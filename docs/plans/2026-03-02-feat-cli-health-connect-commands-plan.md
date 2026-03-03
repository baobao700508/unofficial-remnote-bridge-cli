---
title: "feat: CLI connect/health/disconnect 命令"
type: feat
status: completed
date: 2026-03-02
origin: docs/brainstorms/2026-03-02-cli-health-connect-brainstorm.md
---

# feat: CLI connect/health/disconnect 命令

## Overview

为 remnote-cli 实现三个基础命令，建立 CLI 与 Plugin 之间的通信基础设施：

- **`remnote connect`**：启动后台守护进程（WS Server + webpack-dev-server），等待 Plugin 连接
- **`remnote health`**：检查守护进程、Plugin 连接、SDK 状态，输出 ✅/❌ 列表
- **`remnote disconnect`**：主动停止守护进程，释放端口和资源

（see brainstorm: [docs/brainstorms/2026-03-02-cli-health-connect-brainstorm.md](../brainstorms/2026-03-02-cli-health-connect-brainstorm.md)）

## Problem Statement / Motivation

当前 remnote-cli 和 remnote-plugin 都是空壳。要实现任何 RemNote 操作（搜索、创建笔记等），必须先建立 CLI ↔ Plugin 的通信链路。connect/health/disconnect 是所有后续功能的前置基础设施。

## Proposed Solution

### 架构总览

```
用户执行 `remnote connect`
    → CLI fork 守护进程（detached）
    → 守护进程启动：
        1. WS Server（端口 3002）
        2. webpack-dev-server 子进程（端口 8080）
    → 写入 PID 文件
    → 启动 30 分钟自动关闭计时器
    → CLI 等待就绪信号后退出

用户在 RemNote 加载插件（指向 localhost:8080）
    → Plugin WebSocket Client 连接到 ws://127.0.0.1:3002
    → 发送 hello 消息（携带版本 + SDK 状态）
    → 守护进程记录 Plugin 连接

用户执行 `remnote health`
    → CLI 作为 WS Client 连接到守护进程
    → 发送 get_status 请求
    → 守护进程返回状态 + 刷新超时计时器
    → CLI 输出 ✅/❌ 列表后退出

用户执行 `remnote disconnect`
    → CLI 读取 PID 文件
    → 发送 SIGTERM 给守护进程
    → 守护进程优雅关闭（关闭 WS、停止 webpack-dev-server、删除 PID 文件）
```

### 进程角色区分

| 进程 | 角色 | 说明 |
|:--|:--|:--|
| 守护进程 | WS Server | 监听 3002，接受 Plugin 和 CLI 命令的连接 |
| Plugin（RemNote 内） | WS Client | 连接守护进程，执行 RemNote SDK 操作 |
| CLI 命令（health 等） | WS Client（临时） | 连接守护进程发送请求，完成后断开 |

## Technical Considerations

### 守护进程生命周期

**启动**（`connect`）：
- 检查 PID 文件：若存在且进程存活 → 打印"已在运行（PID: xxx）"，退出码 0
- PID 文件存在但进程已死（stale）→ 清理 PID 文件，正常启动
- fork detached 子进程，子进程写入 PID 文件
- 父进程等待就绪信号（子进程通过 IPC 发送 `ready`），超时 10 秒
- 收到就绪信号后打印端口信息并退出

**超时关闭**：
- 30 分钟无 CLI 交互自动关闭
- 任何 WS 请求（health、future commands）刷新计时器
- Plugin 的 ping/pong 心跳不刷新计时器（避免 Plugin 长连接永远不超时）

**优雅关闭**（SIGTERM / disconnect / 超时）：
1. 关闭 WS Server（通知已连接客户端）
2. 停止 webpack-dev-server 子进程
3. 删除 PID 文件
4. 进程退出

**异常关闭**：
- webpack-dev-server 崩溃 → 整个守护进程退出，清理 PID 文件
- SIGKILL → PID 文件残留，下次 connect 时自动清理

### WS 通信协议

**消息类型：**

```typescript
// Plugin → 守护进程：连接后发送
interface HelloMessage {
  type: 'hello';
  version: string;
  sdkReady: boolean;  // RemNote SDK 是否可用
}

// 守护进程 → Plugin：心跳
interface PingMessage { type: 'ping'; }
interface PongMessage { type: 'pong'; }

// CLI → 守护进程：请求
interface BridgeRequest {
  id: string;        // crypto.randomUUID()
  action: string;    // 'get_status' | future actions
  payload: Record<string, unknown>;
}

// 守护进程 → CLI：响应
interface BridgeResponse {
  id: string;
  result?: unknown;
  error?: string;
}
```

**get_status 响应格式：**

```typescript
interface StatusResult {
  pluginConnected: boolean; // Plugin 是否已连接
  sdkReady: boolean;        // Plugin 上报的 SDK 状态
  uptime: number;           // 守护进程运行时长（秒）
  timeoutRemaining: number; // 距离自动关闭的剩余时间（秒）
}
```

> 注意：无需 `wsServer` 字段——能收到响应本身就说明 WS Server 在运行。health 命令连接失败时直接判定为不可达（退出码 2）。

**心跳：** 守护进程每 30 秒向 Plugin 发送 ping，10 秒内无 pong 标记为断开。

**多 Plugin 连接：** 只允许一个 Plugin 连接。后来者收到错误消息后被关闭。

### 配置文件

文件：项目根目录 `.remnote-bridge.json`（项目级别配置）

```typescript
interface BridgeConfig {
  wsPort: number;              // 默认 3002
  devServerPort: number;       // 默认 8080
  daemonTimeoutMinutes: number; // 默认 30
}
```

不存在时使用全部默认值，不报错。

### PID 文件

位置：项目根目录 `.remnote-bridge.pid`（与配置文件同级，项目级别守护进程）。

### 退出码

| 命令 | 场景 | 退出码 |
|:--|:--|:--|
| connect | 启动成功 | 0 |
| connect | 已在运行 | 0 |
| connect | 启动失败（端口占用等） | 1 |
| health | 全部健康 | 0 |
| health | 部分不健康 | 1 |
| health | 守护进程不可达 | 2 |
| disconnect | 停止成功 | 0 |
| disconnect | 守护进程未运行 | 0 |

### 安全

当前阶段有意不加 WS 认证。WS Server 仅绑定 127.0.0.1（localhost），不暴露到网络。后续如需认证，在 hello 握手中加 shared secret。

### 守护进程日志

写入项目根目录 `.remnote-bridge.log`，使用简单格式 `[时间] [级别] 消息`。connect 启动时覆盖（不追加）。

## System-Wide Impact

- **层边界**：connect/health/disconnect 完全在 remnote-cli 层内实现。Plugin 的 WebSocket 客户端在 remnote-plugin 层实现。两层通过 WS 协议通信，无代码依赖。
- **依赖方向**：符合 AGENTS.md 2.1.2——Plugin 不依赖 CLI，CLI 不依赖接入层。
- **后续命令**：所有未来的 CLI 命令（search、create_note 等）都将复用这里建立的 WS 通信基础设施。

## Acceptance Criteria

### connect

- [x] `remnote connect` 启动守护进程（WS Server + webpack-dev-server），立即返回
- [x] 守护进程写入 `.remnote-bridge.pid`
- [x] WS Server 在配置端口监听（默认 3002）
- [x] webpack-dev-server 在配置端口运行（默认 8080）
- [x] 30 分钟无 CLI 交互自动关闭，清理 PID 文件
- [x] 重复执行 `connect` 时提示"已在运行"，退出码 0
- [x] stale PID 文件自动清理后正常启动
- [x] 端口被占用时报错并退出码 1

### health

- [x] `remnote health` 输出三项状态（WS Server / Plugin / SDK）
- [x] 守护进程运行 + Plugin 已连接 + SDK 正常 → 全 ✅，退出码 0
- [x] 守护进程运行但 Plugin 未连接 → 部分 ❌，退出码 1
- [x] 守护进程未运行 → 全 ❌，退出码 2
- [x] health 请求刷新守护进程超时计时器
- [x] 连接超时 5 秒

### disconnect

- [x] `remnote disconnect` 发送 SIGTERM 停止守护进程
- [x] 守护进程优雅关闭（关闭 WS、停 webpack-dev-server、删 PID 文件）
- [x] 守护进程未运行时提示并退出码 0

### Plugin WebSocket 客户端

- [x] Plugin 启动后自动连接配置的 WS Server 地址
- [x] 连接成功后发送 hello 消息（携带版本 + sdkReady）
- [x] 响应 ping 心跳返回 pong
- [x] 断线后指数退避自动重连（1s → 30s，最多 10 次）

### 配置

- [x] `.remnote-bridge.json` 不存在时使用全部默认值
- [x] 配置文件中的端口和超时值生效

### 测试

- [x] remnote-cli 层：WS Server、守护进程生命周期、命令解析的单元测试
- [x] remnote-plugin 层：WebSocket Client 连接、hello、ping/pong 的单元测试
- [x] 使用 MockWebSocket（Plugin 测试）和真实 ws 库（CLI 测试）

## Dependencies & Risks

**已就位的依赖：**
- `commander ^12.1.0` — CLI 命令框架（remnote-cli/package.json）
- `ws ^8.16.0` — WebSocket 实现（remnote-cli/package.json）
- `vitest` — 两层都已配置

**需要确认的风险：**
- webpack-dev-server 在守护进程中作为子进程运行的稳定性
- Node.js `child_process.fork` + detached 在不同平台（macOS/Linux/Windows）上的行为差异
- Plugin 在 RemNote 内的 WebSocket 连接受浏览器安全策略限制

## Implementation Tasks

### Phase 1：协议和配置（remnote-cli）

> 协议类型（HelloMessage, BridgeRequest/Response 等）在 remnote-cli 和 remnote-plugin 各自独立定义，不共享代码——它们只是描述 JSON 消息格式的 TypeScript interface。

| # | 任务 | 文件 |
|:--|:--|:--|
| 1.1 | 定义 WS 协议类型（HelloMessage, BridgeRequest/Response 等） | `remnote-cli/src/protocol.ts` |
| 1.2 | 实现配置加载（读取 `.remnote-bridge.json`，合并默认值） | `remnote-cli/src/config.ts` |
| 1.3 | 单元测试：配置加载 | `remnote-cli/test/config.test.ts` |

### Phase 2：WS Server（remnote-cli）

| # | 任务 | 文件 |
|:--|:--|:--|
| 2.1 | 实现 WS Server（监听端口、管理连接、hello 握手、ping/pong 心跳、get_status） | `remnote-cli/src/server/ws-server.ts` |
| 2.2 | 单元测试：WS Server 消息处理、连接管理 | `remnote-cli/test/server/ws-server.test.ts` |

### Phase 3：守护进程管理（remnote-cli）

| # | 任务 | 文件 |
|:--|:--|:--|
| 3.1 | 实现守护进程（fork 模式、PID 文件、自动超时、优雅关闭） | `remnote-cli/src/daemon/daemon.ts` |
| 3.2 | 实现 PID 文件管理（写入、读取、stale 检测、清理） | `remnote-cli/src/daemon/pid.ts` |
| 3.3 | 实现 webpack-dev-server 子进程管理 | `remnote-cli/src/daemon/dev-server.ts` |
| 3.4 | 单元测试：PID 管理、超时计时器 | `remnote-cli/test/daemon/` |

### Phase 4：CLI 命令（remnote-cli）

| # | 任务 | 文件 |
|:--|:--|:--|
| 4.1 | Commander.js 主入口 + connect 命令 | `remnote-cli/src/index.ts`, `remnote-cli/src/commands/connect.ts` |
| 4.2 | health 命令（临时 WS Client → get_status → 格式化输出） | `remnote-cli/src/commands/health.ts` |
| 4.3 | disconnect 命令（读 PID → SIGTERM → 等待退出） | `remnote-cli/src/commands/disconnect.ts` |
| 4.4 | 单元测试：命令逻辑 | `remnote-cli/test/commands/` |

### Phase 5：Plugin WebSocket 客户端（remnote-plugin）

| # | 任务 | 文件 |
|:--|:--|:--|
| 5.1 | 实现 WebSocket Client（参考 reference_repository） | `remnote-plugin/src/bridge/websocket-client.ts` |
| 5.2 | 定义设置常量（WS URL 等） | `remnote-plugin/src/settings.ts` |
| 5.3 | 实现 Bridge Widget（替换 sample_widget） | `remnote-plugin/src/widgets/bridge_widget.tsx` |
| 5.4 | 更新插件入口注册 Bridge Widget | `remnote-plugin/src/widgets/index.tsx` |
| 5.5 | 单元测试：WebSocket Client（使用 MockWebSocket） | `remnote-plugin/test/bridge/websocket-client.test.ts` |
| 5.6 | 测试辅助：MockWebSocket | `remnote-plugin/test/helpers/mocks.ts` |

### Phase 6：集成验证

| # | 任务 | 说明 |
|:--|:--|:--|
| 6.1 | 更新 `.gitignore` | 添加 `.remnote-bridge.pid`、`.remnote-bridge.log`（运行时产物不入库） |
| 6.2 | 手动端到端测试 | 启动 connect → RemNote 加载插件 → health 检查 → disconnect |
| 6.3 | 运行层依赖检查 | `npm run lint:deps` 确保无违规 |

## 预期目录结构

```
remnote-cli/src/
├── index.ts                  # Commander.js 主入口
├── config.ts                 # 配置加载
├── protocol.ts               # WS 协议类型定义
├── commands/
│   ├── connect.ts            # connect 命令
│   ├── health.ts             # health 命令
│   └── disconnect.ts         # disconnect 命令
├── server/
│   └── ws-server.ts          # WebSocket Server
└── daemon/
    ├── daemon.ts             # 守护进程主逻辑
    ├── pid.ts                # PID 文件管理
    └── dev-server.ts         # webpack-dev-server 子进程管理

remnote-plugin/src/
├── bridge/
│   └── websocket-client.ts   # WebSocket Client
├── settings.ts               # 设置常量
└── widgets/
    ├── index.tsx              # 插件入口（注册 bridge_widget）
    └── bridge_widget.tsx      # Bridge Widget（替换 sample_widget）
```

## Sources & References

### Origin

- **Brainstorm 文档：** [docs/brainstorms/2026-03-02-cli-health-connect-brainstorm.md](../brainstorms/2026-03-02-cli-health-connect-brainstorm.md)
  - 关键决策：CLI 为 WS Server / Plugin 为 Client、单进程守护、30 分钟自动超时、JSON 配置文件

### Internal References

- 参考项目 WebSocket Client：`reference_repository/src/bridge/websocket-client.ts`
- 参考项目 Bridge Widget：`reference_repository/src/widgets/mcp_bridge.tsx`
- 参考项目测试 Mock：`reference_repository/test/helpers/mocks.ts`
- 参考项目 WS 测试：`reference_repository/test/unit/websocket-client.test.ts`
- 层依赖规则：`AGENTS.md` 第 2.1.2 节
- CLI package.json：`remnote-cli/package.json`（已有 commander、ws 依赖）

### External References

- Commander.js 文档：https://github.com/tj/commander.js
- ws 库文档：https://github.com/websockets/ws
- Node.js child_process.fork：https://nodejs.org/api/child_process.html#child_processforkmodulepath-args-options
