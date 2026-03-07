# remnote-bridge

[English](./README.md)

RemNote 自动化桥接工具集，将 RemNote 知识库能力暴露给 AI Agent。单包安装——CLI、MCP Server、Plugin 一步到位。

## 安装

```bash
npm install -g remnote-bridge
```

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
| `install skill` | 安装 Claude Code Skill 到 `~/.claude/skills/remnote-bridge/` |

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

## Claude Code Skill

```bash
remnote-bridge install skill
```

将 Skill 安装到 `~/.claude/skills/remnote-bridge/`，让 Claude Code 能通过自然语言操作你的 RemNote 知识库。

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

## 许可证

Proprietary
