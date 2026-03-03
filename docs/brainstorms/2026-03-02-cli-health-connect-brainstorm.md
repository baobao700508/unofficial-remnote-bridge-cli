# Brainstorm: CLI health + connect 命令

> 日期: 2026-03-02
> 状态: 探索完成

## What We're Building

为 remnote-cli 实现两个基础命令：

### 1. `connect` 命令
启动后台守护进程，同时运行：
- **WS Server**（默认端口 3002）：供 Plugin 连接，也供后续 CLI 命令（如 health）通信
- **webpack-dev-server**（默认端口 8080）：Plugin 开发服务器，供 RemNote 加载插件

守护进程特性：
- 后台运行，启动后立即返回
- **自动超时关闭**：持续 30 分钟（默认）无 CLI 交互则自动关闭所有服务释放资源
- CLI 每次使用（在守护进程存活期间）刷新超时计时器
- 超时后需要重新执行 `connect`
- 超时时长由项目根目录配置文件定义

### 2. `health` 命令
连接守护进程的 WS Server，检查并报告基础连接状态：
- CLI WS Server 是否在运行
- Plugin 是否已通过 WS 连接
- Plugin 与 RemNote SDK 是否正常

输出为简单的 ✅/❌ 状态列表。

## Why This Approach

### 连接方向：CLI 启动 WS Server，Plugin 作为客户端
- 与参考项目（remnote-mcp-bridge）一致
- Plugin 不需要 `requestNative: true` 权限（不需要监听端口）
- Plugin 只需知道 WS Server 地址即可连接

### 单进程守护（方案 A）
- 一个 Node.js 进程同时运行 WS Server + webpack-dev-server
- 最简单直接，一个 PID 文件管理
- 缺点是 webpack-dev-server 崩溃会影响 WS，但当前阶段可接受

### 自动超时关闭
- 避免用户忘记关闭服务占用资源
- CLI 使用时刷新计时器，正常使用不会意外断开
- 超时时长可配置，灵活适应不同使用场景

### health 通过 WS 通信
- 复用现有 WS Server 和通信协议，不需要额外的 HTTP 端口
- health 请求也会刷新守护进程超时计时器

## Key Decisions

| 决策 | 选择 | 理由 |
|:--|:--|:--|
| CLI ↔ Plugin 通信 | WebSocket | 与参考项目一致，双向实时通信 |
| 连接方向 | CLI 是 WS Server，Plugin 是 Client | 避免 Plugin 需要 native 权限 |
| 守护进程架构 | 单进程（方案 A） | 最简单，先跑起来 |
| 运行模式 | 后台守护 + 自动超时关闭 | 平衡易用性和资源管理 |
| 端口配置 | 固定默认值 + 配置文件可改 | WS 默认 3002，Dev Server 默认 8080 |
| health 通信方式 | 连接守护进程 WS Server | 复用协议，不加额外端口 |
| 健康检查范围 | 基础连接状态（✅/❌） | YAGNI，后续按需扩展 |
| 配置文件格式 | JSON（`.remnote-bridge.json`） | Node.js 原生支持，无需额外依赖 |
| 默认超时时长 | 30 分钟 | 较短但正常使用会不断刷新 |
| Plugin SDK 状态 | Plugin 连接 WS 时主动上报 | hello 握手携带 SDK 状态，get_status 也返回 |

## Resolved Questions

1. **配置文件格式** → JSON（`.remnote-bridge.json`），Node.js 原生支持，无需额外依赖
2. **默认超时时长** → 30 分钟，正常使用中 CLI 每次交互都会刷新计时器
3. **Plugin 与 RemNote SDK 状态** → Plugin 通过 WS 连接时在 hello 握手中主动上报 SDK 连接状态，CLI 发 get_status 时也会返回
