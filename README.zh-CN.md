# remnote-bridge

[English](./README.md)

将 RemNote 知识库能力暴露给 AI Agent 的桥接工具集。单包发布 — CLI、MCP Server、Plugin 三合一。

## 安装

```bash
npm install -g remnote-bridge
```

## 极速上手（配合 AI）

一步接入，剩下的交给 AI 引导。

### 方式 A：安装 Skill（支持 Claude Code、Cursor、Windsurf 等 40+ 工具）

```bash
npx skills add baobao700508/unofficial-remnote-bridge-cli -s remnote-bridge
```

### 方式 B：配置 MCP Server（适用于任何支持 MCP 协议的 AI 客户端）

在 AI 客户端的 MCP 设置中添加：

```json
{
  "mcpServers": {
    "remnote-bridge": {
      "command": "remnote-bridge",
      "args": ["mcp"]
    }
  }
}
```

**建议两者都安装效果最佳。** MCP 文档精简（一次性全部加载），Skill 文档详细（按需加载），两者互补。当然，单独使用任一方式也完全可以。

接入后，AI 会引导你完成连接 RemNote、加载插件等所有后续步骤。

---

## 快速开始

### 标准模式（推荐）

推荐日常使用 — 由你控制插件的加载和卸载。

```bash
# 1. 启动守护进程（启动 WS 服务器 + 插件服务器）
remnote-bridge connect

# 2. 在 RemNote 中加载插件
#    打开 RemNote → Plugins → Develop Your Plugin
#    输入：http://localhost:8080

# 3. 检查系统状态
remnote-bridge health

# 4. 浏览知识库
remnote-bridge read-globe                    # 全局文档概览
remnote-bridge read-context                  # 当前焦点/页面上下文
remnote-bridge search "machine learning"     # 全文搜索
remnote-bridge read-tree <remId>             # 展开子树
remnote-bridge read-rem <remId>              # 读取 Rem 属性

# 5. 编辑内容
remnote-bridge edit-rem <remId> --changes '{"text":["new text"]}'
remnote-bridge edit-tree <remId> --old-str '  old line <!--id-->' --new-str '  new line\n  old line <!--id-->'

# 6. 停止守护进程
remnote-bridge disconnect
```

### Headless 模式（全自动）

初始设置后无需人工干预 — 仅用于全自动化场景。

```bash
# 1. 一次性操作：在 Chrome 中登录 RemNote（保存凭据）
remnote-bridge setup

# 2. 使用 headless Chrome 自动连接（无需浏览器窗口）
remnote-bridge connect --headless

# 3. 验证所有层就绪
remnote-bridge health

# 4. 直接使用任何命令
remnote-bridge search "machine learning"
```

## 命令一览

### 基础设施

| 命令 | 说明 |
|:-----|:-----|
| `setup` | 启动 Chrome 登录 RemNote，为 headless 模式保存凭据 |
| `connect` | 启动守护进程（`--headless` 自动启动 Chrome，默认需手动加载插件） |
| `health` | 检查守护进程/插件/SDK 状态（`--diagnose` 截图诊断，`--reload` 重启 Chrome） |
| `disconnect` | 停止守护进程并释放资源 |
| `clean` | 清理所有残留文件（.pid / .log / .json / skill 目录） |

### 读取

| 命令 | 说明 | 缓存 |
|:-----|:-----|:-----|
| `read-globe` | 全局文档级概览 | 否 |
| `read-context` | 当前焦点/页面上下文视图 | 否 |
| `read-tree <remId>` | 子树序列化为 Markdown 大纲 | 是 |
| `read-rem <remId>` | 单个 Rem 的完整 JSON 属性 | 是 |
| `read-rem-in-tree <remId>` | 子树大纲 + 所有 Rem 对象，一次调用 | 是 |
| `search <query>` | 全文搜索 | 否 |

### 写入

| 命令 | 说明 | 前置条件 |
|:-----|:-----|:---------|
| `edit-rem <remId>` | 直接修改 Rem 字段（text、backText、type 等） | 需先 `read-rem` |
| `edit-tree <remId>` | 通过 str_replace 编辑树结构 | 需先 `read-tree` |

### 工具

| 命令 | 说明 |
|:-----|:-----|
| `mcp` | 启动 MCP Server（stdio 传输） |
| `install skill` | 安装 AI Agent Skill（通过 [Vercel Skills](https://github.com/vercel-labs/skills)） |
| `addon list\|install\|uninstall` | 管理增强项目（如 remnote-rag） |

## MCP Server

使用 `remnote-bridge mcp` 作为 AI 客户端的 MCP 服务器：

```json
{
  "mcpServers": {
    "remnote-bridge": {
      "command": "remnote-bridge",
      "args": ["mcp"]
    }
  }
}
```

MCP 服务器将所有 CLI 命令暴露为工具。文档直接内联在工具描述和服务器说明中（无独立 resources）。

## AI Agent Skill

Skill 提供详细的使用说明（SKILL.md + 11 个命令文档），教 AI Agent 如何使用 remnote-bridge — 包括命令选择、工作流程、安全规则和闪卡操作。

### 通过 Vercel Skills 安装（推荐）

基于 [Vercel Skills](https://github.com/vercel-labs/skills) 生态。支持 **40+ AI 编程工具**，包括 Claude Code、Cursor、Windsurf、GitHub Copilot、Cline 等。

```bash
# 直接安装 — 交互式选择 Agent
npx skills add baobao700508/unofficial-remnote-bridge-cli -s remnote-bridge

# 或通过内置封装（同样的交互体验）
remnote-bridge install skill
```

交互式安装器会自动检测已安装的 AI 工具，让你选择为哪些工具安装 Skill。

### 备选方案：仅限 Claude Code

如果 `npx` 不可用，或偏好手动安装：

```bash
remnote-bridge install skill --copy
```

这会将 Skill 文件直接复制到 `~/.claude/skills/remnote-bridge/`。

### 安装内容

```
<agent-skills-dir>/remnote-bridge/
├── SKILL.md              # 核心 Skill — 命令决策、工作流程、安全规则
└── instructions/         # 逐命令详细文档
    ├── overall.md        # 全局概览
    ├── connect.md        # connect 命令
    ├── read-tree.md      # read-tree 命令
    ├── edit-tree.md      # edit-tree 命令
    └── ...               # 另外 8 个命令文档
```

## JSON 模式

所有命令支持 `--json` 用于程序化调用。JSON 模式下输入和输出均为 JSON：

```bash
# 输入：所有参数打包在 JSON 字符串中
remnote-bridge --json read-rem '{"remId":"abc123","fields":["text","type"]}'

# 输出：单行 JSON
# {"ok":true,"command":"read-rem","timestamp":"...","data":{...}}
```

## 多实例

支持并行运行多个守护进程实例（如不同的知识库）：

```bash
# 命名实例
remnote-bridge --instance work connect
remnote-bridge --instance personal connect

# Headless 简写
remnote-bridge --headless connect    # 等同于 --instance headless

# 命令自动路由到对应实例
remnote-bridge --instance work search "project notes"
```

实例通过 `~/.remnote-bridge/` 下的全局注册表管理。每个实例拥有独立的端口分配、PID 文件和日志文件。

## 架构

```
AI Agent（Claude Code / MCP Client）
    ↕  CLI 命令（无状态短进程）
remnote-bridge CLI
    ↕  WebSocket IPC
守护进程（长生命周期：WS 服务器 + 处理器 + 缓存）
    ↕  WebSocket
remnote-plugin（运行在 RemNote 浏览器或 headless Chrome 中）
    ↕
RemNote SDK → 知识库
```

- **CLI 命令** 无状态 — 每次调用都是独立的 OS 进程
- **守护进程** 持有状态：缓存、WS 连接、超时计时器
- **插件** 运行在浏览器（或 headless Chrome）中，代守护进程调用 RemNote SDK
- **多实例** — 多个守护进程可同时运行，每个插件可连接多个守护进程（孪生优先级机制）
- **Headless 模式** 使用保存的凭据自动启动 Chrome — 无需浏览器窗口
- **三道安全防线** 保护编辑操作：缓存存在检查、乐观并发检测、str_replace 精确匹配（edit-tree）

## 配置

可选配置文件：项目根目录下的 `.remnote-bridge.json`。

```json
{
  "wsPort": 3002,
  "devServerPort": 8080,
  "configPort": 3003,
  "daemonTimeoutMinutes": 30,
  "defaults": {
    "maxNodes": 200,
    "maxSiblings": 20,
    "readTreeDepth": 3
  }
}
```

所有值都有合理的默认值 — 配置文件不是必需的。

## 致谢

本项目的灵感来源和学习对象：

- [remnote-mcp-bridge](https://github.com/quentintou/remnote-mcp-bridge) by [@quentintou](https://github.com/quentintou) — 最早将 RemNote 连接到 AI 助手的 MCP 桥接项目。开创了通过 MCP 将 RemNote SDK 桥接到外部工具的理念。
- [remnote-mcp-bridge (fork)](https://github.com/robert7/remnote-mcp-bridge) by [@robert7](https://github.com/robert7) — 在原版基础上扩展了通用、可扩展的 WebSocket 桥接架构。其 Plugin ↔ WebSocket ↔ CLI 分层设计为我们提供了宝贵的架构参考。

## 增强项目（Addons）

增强项目为 remnote-bridge 扩展额外能力：

| 增强项目 | 说明 |
|:---------|:-----|
| [remnote-rag](https://github.com/baobao700508/remnote-rag) | 基于 ChromaDB + DashScope 嵌入的语义搜索 |
| [remnote-chat](https://github.com/baobao700508/remnote-chat) | RemNote 知识库聊天界面 |

```bash
# 查看所有增强项目
remnote-bridge addon list

# 安装增强项目
remnote-bridge addon install remnote-rag

# 卸载（--purge 同时删除数据）
remnote-bridge addon uninstall remnote-rag --purge
```

## Roadmap

- **RAG 语义搜索** — 基于本地 SQLite + ChromaDB 的语义检索，补充 SDK 全文搜索
- **多语言支持** — 国际化，更广泛的可访问性

## Changelog

### 0.1.15 (2026-03-18)

- **防线 2 误判修复** — 移除 RemObject 序列化中 ID 数组的 `.sort()`，消除 edit-rem 并发检测的假阳性
- **文档全面优化** — 加强 headless 模式警告、新增 Plugin 加载防幻觉红线、重组 edit-tree 模板/回退双模式文档
- **Skill ↔ MCP 文档同步** — connect、edit-tree、overall 说明在 Skill 和 MCP 层全面对齐

### 0.1.14 (2026-03-18)

- **read-rem-in-tree** — 新命令：一次调用获取子树大纲 + 所有 Rem 对象（批量读取，用于批量编辑场景）
- **Token Slimming** — `read-rem` 默认省略处于默认值的字段，减少 token 消耗；`--full` 获取完整输出
- **rem-field-filter** — 从 read-handler 提取可复用的字段过滤逻辑
- **Headless 策略** — CLAUDE.md 新增测试场景禁止 headless 模式的规则
- **health 改进** — 重构诊断逻辑，优化状态报告

### 0.1.13 (2026-03-15)

- **edit-rem 重写** — 从 str_replace 改为直接字段修改（`--changes` 参数）
- **移除 MCP resources** — 所有文档内联到工具描述和服务器说明中
- **MCP 返回格式标准化** — 大纲工具使用 Frontmatter+Body，操作工具使用 Data JSON

### 0.1.12 (2026-03-15)

- **多实例支持** — `--instance <name>` 参数，`~/.remnote-bridge/` 全局注册表，并行守护进程
- **插件多连接** — 单个插件可连接多个守护进程，孪生优先级机制
- **增强项目系统** — `addon list|install|uninstall` 命令，管理扩展项目（remnote-rag、remnote-chat）
- **read-context focusRemId** — 可选参数，指定焦点目标而无需改变 RemNote 界面
- **输出优化** — `children` 从默认输出移至 full 模式（`read-rem --full`）

### 0.1.9 (2026-03-09)

- 建议日常使用标准模式，headless 仅用于全自动化场景

### 0.1.8 (2026-03-09)

- **Headless Chrome** — `setup` + `connect --headless` + `health --diagnose/--reload`，零干预工作流
- **静态插件服务器** — 轻量生产服务器，替代非开发模式下的 webpack-dev-server

### 0.1.7 (2026-03-08)

- **Portal 支持** — 读写 Portal Rem，双路径解析（portal ↔ source）
- **树操作** — 通过 `edit-tree` 创建和删除 Rem

### 0.1.6 (2026-03-07)

- 连接超时从 10 秒延长到 60 秒

### 0.1.5 (2026-03-07)

- dev-server 崩溃自愈机制（清洁重装 + 重试）

### 0.1.4 (2026-03-07)

- **Windows 兼容性**修复
- `clean` 命令，清理残留文件
- `read-context` 提示增强

### 0.1.3 (2026-03-07)

- RichText 文档全面修正

### 0.1.2 (2026-03-07)

- **Vercel Skills** 生态适配（`npx skills add ...`）
- `connect` 用户引导改进

### 0.1.1 (2026-03-07)

- 瘦身 npm 包（精确 `files` 白名单）

### 0.1.0 (2026-03-07)

- 首次发布 — CLI + MCP Server + Plugin 单包 `remnote-bridge`
- 命令：`connect`、`disconnect`、`health`、`read-rem`、`edit-rem`、`read-tree`、`edit-tree`、`read-globe`、`read-context`、`search`
- 三层架构：Plugin（RemNote SDK）→ CLI（命令层）→ MCP/Skill（AI 接入层）
- 基于会话的 LRU 缓存 + 乐观并发控制
- Powerup 噪音过滤、祖先面包屑、大树省略机制

## License

MIT
