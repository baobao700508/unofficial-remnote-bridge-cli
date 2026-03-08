# remnote-bridge

[English](./README.md)

RemNote 自动化桥接工具集，将 RemNote 知识库能力暴露给 AI Agent。单包安装——CLI、MCP Server、Plugin 一步到位。

## 安装

```bash
npm install -g remnote-bridge
```

## 超级快速开始 (with AI)

只需一步接入，后续所有操作跟着 AI 引导即可完成。

### 方式 A：安装 Skill（适用于 Claude Code、Cursor、Windsurf 等 40+ 工具）

```bash
npx skills add baobao700508/unofficial-remnote-bridge-cli -s remnote-bridge
```

### 方式 B：配置 MCP Server（适用于支持 MCP 协议的 AI 客户端）

将以下配置添加到你的 AI 客户端的 MCP 设置中：

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

**建议：Skill 和 MCP 都安装，效果更好。** MCP 的文档是全量加载的，为控制长度写得较简洁；而 Skill 的文档是按需加载的，包含更详细的使用说明。两者结合，AI 既能获得工具能力，也能获得详细指引。当然，只安装其中一个也能独立运行。

接入后，AI 会引导你完成连接 RemNote、加载插件等后续步骤。

---

## 快速开始

```bash
# 1. 启动守护进程（WS Server + Plugin 开发服务器）
remnote-bridge connect

# 2. 在 RemNote 中加载插件
#    打开 RemNote → 设置 → 插件 → 添加本地插件
#    输入地址：http://localhost:8080

# 3. 检查系统状态
remnote-bridge health

# 4. 探索知识库
remnote-bridge read-globe                    # 全局文档概览
remnote-bridge read-context                  # 当前 RemNote 中的焦点
remnote-bridge search "机器学习"              # 全文搜索
remnote-bridge read-tree <remId>             # 展开子树
remnote-bridge read-rem <remId>              # 读取 Rem 属性

# 5. 编辑内容
remnote-bridge edit-rem <remId> --old-str '"concept"' --new-str '"descriptor"'
remnote-bridge edit-tree <remId> --old-str '  旧行 <!--id-->' --new-str '  新行\n  旧行 <!--id-->'

# 6. 停止守护进程
remnote-bridge disconnect
```

## 命令一览

### 基础设施

| 命令 | 说明 |
|:-----|:-----|
| `connect` | 启动守护进程（WS Server + Plugin 开发服务器） |
| `health` | 检查 daemon、Plugin、SDK 三层状态 |
| `disconnect` | 停止守护进程，释放端口和资源 |

### 读取

| 命令 | 说明 | 缓存 |
|:-----|:-----|:-----|
| `read-globe` | 知识库全局 Document 概览 | 否 |
| `read-context` | 当前焦点/页面上下文视图 | 否 |
| `read-tree <remId>` | 子树序列化为 Markdown 大纲 | 是 |
| `read-rem <remId>` | 单个 Rem 的完整 JSON 属性 | 是 |
| `search <query>` | 全文搜索 | 否 |

### 写入

| 命令 | 说明 | 前置条件 |
|:-----|:-----|:---------|
| `edit-rem <remId>` | 通过 str_replace 编辑 Rem 的 JSON 字段 | 需先 `read-rem` |
| `edit-tree <remId>` | 通过 str_replace 编辑树结构 | 需先 `read-tree` |

### 工具

| 命令 | 说明 |
|:-----|:-----|
| `mcp` | 启动 MCP Server（stdio 传输） |
| `install skill` | 安装 AI Agent Skill（通过 [Vercel Skills](https://github.com/vercel-labs/skills)） |

## MCP Server

将 `remnote-bridge mcp` 作为 MCP 服务端供 AI 客户端使用：

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

MCP Server 将所有 CLI 命令暴露为工具（tools），并提供文档资源（resources）。

## AI Agent Skill

Skill 为 AI Agent 提供详细的操作指南（SKILL.md + 11 个命令文档），教会 AI 如何使用 remnote-bridge——包括命令选择、工作流、安全规则和闪卡操作。

### 通过 Vercel Skills 安装（推荐）

基于 [Vercel Skills](https://github.com/vercel-labs/skills) 生态，支持 **40+ AI 编程工具**，包括 Claude Code、Cursor、Windsurf、GitHub Copilot、Cline 等。

```bash
# 直接使用 — 交互式选择目标工具
npx skills add baobao700508/unofficial-remnote-bridge-cli -s remnote-bridge

# 或通过内置命令（同样的交互体验）
remnote-bridge install skill
```

安装器会自动检测你已安装的 AI 编程工具，让你选择要安装到哪些工具。

### 备选：仅安装到 Claude Code

如果 `npx` 不可用，或你想手动安装：

```bash
remnote-bridge install skill --copy
```

这会直接将 skill 文件复制到 `~/.claude/skills/remnote-bridge/`。

### 安装内容

```
<agent-skills-dir>/remnote-bridge/
├── SKILL.md              # 核心 Skill — 命令决策、工作流、安全规则
└── instructions/         # 逐命令详细文档
    ├── overall.md        # 全局概览
    ├── connect.md        # connect 命令
    ├── read-tree.md      # read-tree 命令
    ├── edit-tree.md      # edit-tree 命令
    └── ...               # 还有 8 个命令文档
```

## JSON 模式

所有命令支持 `--json` 标志，用于程序化调用。开启后输入和输出均为 JSON：

```bash
# 输入：所有参数打包为 JSON 字符串
remnote-bridge --json read-rem '{"remId":"abc123","fields":["text","type"]}'

# 输出：单行合法 JSON
# {"ok":true,"command":"read-rem","timestamp":"...","data":{...}}
```

**注意**：`--json` 模式下禁止混用裸 remId，如 `read-rem abc123 --json` 会失败。

## 架构

```
AI Agent（Claude Code / MCP Client）
    ↕  CLI 命令（无状态短进程）
remnote-bridge CLI
    ↕  WebSocket IPC
Daemon（守护进程：WS Server + Handlers + 缓存）
    ↕  WebSocket
remnote-plugin（运行在 RemNote 浏览器中）
    ↕
RemNote SDK → 知识库
```

- **CLI 命令无状态**——每次调用都是独立的 OS 进程
- **守护进程持有状态**：缓存、WS 连接、超时计时器
- **Plugin 运行在浏览器中**，代表 daemon 调用 RemNote SDK
- **三道防线**保护编辑操作：缓存存在性检查、乐观并发检测、str_replace 精确匹配

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

所有值都有合理的默认值，无需配置文件即可使用。

## 致谢

本项目的架构设计受到以下项目的启发：

- [remnote-mcp-bridge](https://github.com/quentintou/remnote-mcp-bridge)（[@quentintou](https://github.com/quentintou)）— 原始的 RemNote MCP 桥接项目，首创了通过 MCP 协议将 RemNote SDK 能力暴露给 AI 助手的方案。
- [remnote-mcp-bridge (fork)](https://github.com/robert7/remnote-mcp-bridge)（[@robert7](https://github.com/robert7)）— 在原项目基础上扩展为通用的 WebSocket 桥接架构。其 Plugin ↔ WebSocket ↔ CLI 的分层设计为本项目提供了宝贵的架构参考。

## 未来方向

- **MCP 工具拆分** — 将目前与 CLI 一对一映射的 MCP 工具拆分为更细粒度的工具，让 AI Agent 拥有更灵活、可组合的操作能力
- **优化 Agent 指令** — 改进 Skill 文档和 MCP Server 的 instruction 表述，提升 AI Agent 的理解准确度
- **RAG 搜索** — 研究 RemNote 本地数据库的数据结构，用检索增强生成（RAG）方式重构现有的全文搜索，实现更高效的语义检索
- **多语言支持** — 国际化适配，服务更广泛的用户群体

## 社区

- **RemNote 中文社区** QQ 群：`853031358`

## 许可证

MIT
