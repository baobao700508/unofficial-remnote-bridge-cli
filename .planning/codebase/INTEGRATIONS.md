# External Integrations

**Analysis Date:** 2026-03-16

## APIs & External Services

**RemNote:**
- 核心集成目标 — 所有业务操作最终都通过 RemNote Plugin SDK 与 RemNote 知识库交互
- SDK 包：`@remnote/plugin-sdk` 0.0.46（仅在 `remnote-plugin/` 中使用）
- 权限范围：`All` / `ReadCreateModifyDelete`（见 `remnote-plugin/public/manifest.json`）
- SDK 文档：`docs/RemNote API Reference/`（151 页，通过 `./scripts/crawl-remnote-docs.sh` 更新）

**DashScope / OpenAI 兼容 API:**
- 用于 `remnote-rag/` 的 Embedding 和 Reranker 功能
- 通过 `openai` Python SDK 的兼容接口调用（可配置 base_url 指向 DashScope 等服务）
- 配置存储在 `~/.remnote-bridge/addons/remnote-rag/config.json`
- 关键配置项：`embedding.api_key`、`embedding.base_url`、`embedding.model`、`embedding.dimensions`、`reranker.api_key`、`reranker.base_url`、`reranker.model`
- 配置通过 ConfigServer Web UI 管理（`src/cli/server/config-server.ts`）

## Communication Protocols

**WebSocket（核心通信通道）:**
- 协议定义：`src/cli/protocol.ts`（CLI 端）和 `remnote-plugin/src/bridge/websocket-client.ts`（Plugin 端，独立定义，不共享代码）
- 方向：`BridgeServer`（`src/cli/server/ws-server.ts`）↔ `WebSocketClient`（`remnote-plugin/src/bridge/websocket-client.ts`）
- 绑定地址：`127.0.0.1`（仅本地通信），默认端口 29100（4 个槽位：29100/29110/29120/29130）
- 消息类型：
  - Plugin → Daemon：`HelloMessage`（握手，携带版本、SDK 状态、孪生槽位索引）、`PongMessage`（心跳响应）、`BridgeResponse`（请求响应）
  - Daemon → Plugin：`PingMessage`（心跳，30 秒间隔、10 秒 pong 超时）、`BridgeRequest`（转发的 CLI 请求）、`PreemptedMessage`（孪生抢占通知）
  - CLI → Daemon：`BridgeRequest`（action + payload）
  - Daemon → CLI：`BridgeResponse`（result 或 error）
- 自定义关闭码：`4000`（已有连接，拒绝）、`4001`（心跳超时）、`4002`（被孪生抢占）、`4003`（孪生已连，拒绝非孪生）
- maxPayload: 1MB
- 连接策略：Plugin 断线后指数退避重连（最大 10 次，初始 1 秒，上限 30 秒），带抖动

**HTTP（配置管理和 Plugin 服务）:**
- ConfigServer（`src/cli/server/config-server.ts`）：绑定 `127.0.0.1:<configPort>`（默认 29102）
  - `GET /` — 内联 HTML/CSS/JS 配置页面
  - `GET /api/config` — 获取当前配置
  - `POST /api/config` — 保存配置
  - `POST /api/restart` — 守护进程软重启
  - `GET /api/addon-config?name=xxx` — addon 配置读取
  - `POST /api/addon-config` — addon 配置保存
- StaticServer（`src/cli/daemon/static-server.ts`）：绑定 `127.0.0.1:<devServerPort>`（默认 29101）
  - 提供 `remnote-plugin/dist/` 静态文件
  - `GET /api/discovery` — 返回 WS 端口信息（供 Plugin 自动发现连接地址）
  - `GET /manifest.json` — 多实例模式下动态修改 Plugin id/name
  - CORS headers: `Access-Control-Allow-Origin: *`
- webpack-dev-server（开发模式）：端口同 devServerPort，支持 HMR，同样提供 `/api/discovery` 端点

**MCP（AI Agent 接入协议）:**
- 传输方式：stdio（标准输入/输出）
- 实现：FastMCP 库（`src/mcp/index.ts`）
- 工具注册：
  - `src/mcp/tools/read-tools.ts` — search、read_rem、read_tree、read_globe、read_context
  - `src/mcp/tools/edit-tools.ts` — edit_rem、edit_tree
  - `src/mcp/tools/infra-tools.ts` — connect、disconnect、health、setup、addon、clean
- MCP → CLI 通信：通过子进程调用 `remnote-bridge --json <command>`（`src/mcp/daemon-client.ts`），子进程超时 30 秒，maxBuffer 10MB
- 返回值格式：
  - 模式 A（Frontmatter + Body）：read_tree、read_globe、read_context（`formatFrontmatter()`）
  - 模式 B（Data JSON）：search、read_rem、edit_rem、edit_tree、connect、disconnect、health 等（`formatDataJson()`）
  - 格式化函数：`src/mcp/format.ts`

**IPC（进程间通信）:**
- Daemon 是 `fork` 子进程，通过 Node.js IPC channel 向父进程发送 `ready`/`error` 消息
- 消息格式：`{ type: 'ready', wsPort, devServerPort, configPort, pid, headless, slotIndex, instance }` 或 `{ type: 'error', message }`
- IPC channel 在 ready 后 `unref()`，允许父进程退出

**Skill（Markdown 技能文档）:**
- 位于 `skills/remnote-bridge/`，遵循 Vercel Skills 生态格式
- `skills/remnote-bridge/SKILL.md` — Agent Skill 入口定义
- `skills/remnote-bridge/instructions/*.md` — 16 个命令详细文档（每个 CLI 命令一个）
- 安装方式：`remnote-bridge install skill [--copy]` 或 `npx skills add`

## Data Storage

**Databases:**
- RemNote 本地 SQLite（只读）— `remnote-rag/` 中 `db_reader.py` 直接读取 RemNote 本地数据库文件
- ChromaDB — `remnote-rag/` 中 `indexer.py` 构建和查询向量索引
  - 数据存储位置：由 `remnote-rag` 配置决定（默认在 addon 数据目录下）

**File Storage:**
- `~/.remnote-bridge/` — 全局运行时文件根目录
  - `config.json` — 用户配置
  - `slots.json` — 端口槽位定义
  - `registry.json` — instance → slot 映射
  - `instances/N.pid` — PID 文件（JSON 格式，含 pid、ports、instance 等）
  - `instances/N.log` — daemon 日志（追加模式）
  - `chrome-profile/` — Headless Chrome 用户数据目录（持久化登录 session）
  - `chrome-profile/.setup-done` — setup 完成标记文件
  - `.headless-pid` — Headless Chrome 进程 PID 文件（供孤儿清理）
  - `addons/<name>/config.json` — addon 独立配置
  - `headless-screenshot-*.png` — 诊断截图

**Caching:**
- 内存缓存 — 守护进程（daemon）内存中的 `RemCache`（`src/cli/handlers/rem-cache.ts`）
  - LRU 策略，默认上限 200 条目（可通过 `config.json` 的 `defaults.cacheMaxSize` 调整）
  - 会话级别：daemon 关闭（disconnect）→ 缓存全部清空
  - 无 TTL 机制：依赖第二道防线（写前变更检测）保证数据一致性

## Authentication & Identity

**RemNote 登录:**
- Headless 模式：通过 `setup` 命令弹出 Chrome 窗口让用户登录 RemNote，登录凭证存储在 `~/.remnote-bridge/chrome-profile/` 目录中
- 标准模式：用户在自己的浏览器/RemNote 桌面端中登录，Plugin 通过 SDK 自动获取权限
- 无独立认证系统：依赖 RemNote 的用户认证

**Plugin SDK 权限:**
- `requiredScopes: [{ type: "All", level: "ReadCreateModifyDelete" }]` — 完全访问权限
- 在 `remnote-plugin/public/manifest.json` 中声明

**API Key 管理（remnote-rag）:**
- Embedding/Reranker API Key 存储在 `~/.remnote-bridge/addons/remnote-rag/config.json`
- 支持直接配置 `api_key` 或通过 `api_key_env` 指定环境变量名
- 通过 ConfigServer Web UI 配置（密码框显示）

## Monitoring & Observability

**Error Tracking:**
- 无外部错误追踪服务

**Logs:**
- Daemon 日志：写入 `~/.remnote-bridge/instances/N.log`（追加模式，带时间戳和级别）
- 日志格式：`[ISO-timestamp] [LEVEL] message`
- 每次 daemon 启动写入分隔线标记
- Plugin 侧通过 `onLog` 回调输出
- ConfigServer 通过 `onLog` 回调输出
- MCP Server 无独立日志（依赖 stdio 传输协议的错误机制）

**Health Check:**
- `remnote-bridge health` — 检查三层链式依赖：daemon → Plugin → SDK
- `--diagnose` — Headless 模式额外输出：Chrome 状态、截图路径、console 错误列表、页面 URL
- `--reload` — 重载 headless Chrome 页面

## CI/CD & Deployment

**Hosting:**
- npm 包发布（`npm publish`）
- `prepublishOnly` 脚本：`npm run build && npm run build:plugin`
- 发布内容：`dist/**/*.js`（CLI/MCP 编译产物）+ `remnote-plugin/dist/`（Plugin 预构建产物）+ `skills/`
- bin 入口：`remnote-bridge` 和 `unofficial-remnote-bridge`（→ `./dist/cli/main.js`）

**CI Pipeline:**
- 未检测到 CI 配置文件（无 `.github/workflows/`、`.gitlab-ci.yml`、`Jenkinsfile` 等）

**Plugin 分发:**
- Plugin 随 npm 包发布（`remnote-plugin/dist/` 预构建产物）
- 也可通过 `remnote-plugin/` 目录使用 `npm run build` 生成 `PluginZip.zip`
- 用户通过 RemNote 的"开发你的插件"功能加载本地 Plugin

## Environment Configuration

**关键环境变量:**
- `REMNOTE_BRIDGE_INSTANCE` — 指定 daemon 实例名（CLI 全局 `--instance` 选项等效）
- `REMNOTE_HEADLESS` — 设为 `1` 或 `true` 启用 headless 模式
- `REMNOTE_HEADLESS_REMOTE_PORT` — Chrome 远程调试端口（headless 模式可选）
- `REMNOTE_BRIDGE_DEV` — 设为 `1` 使用 webpack-dev-server（daemon 内部使用）
- `SLOT_INDEX` / `SLOT_WS_PORT` / `SLOT_DEV_PORT` / `SLOT_CONFIG_PORT` — daemon 子进程环境变量（由 connect 命令设置，daemon 启动时读取）
- `DISCOVERY_INSTANCE` / `DISCOVERY_WS_PORT` / `DISCOVERY_CONFIG_PORT` / `DISCOVERY_SLOT_INDEX` — webpack-dev-server 开发模式环境变量
- `PORT` — webpack-dev-server 端口覆盖

**Secrets 位置:**
- `~/.remnote-bridge/addons/remnote-rag/config.json` — 包含 Embedding/Reranker API Key
- `~/.remnote-bridge/chrome-profile/` — 包含 RemNote 登录 session 数据
- 无 `.env` 文件存在

## Webhooks & Callbacks

**Incoming:**
- `/api/discovery` — Plugin 通过 HTTP GET 自动发现 daemon 的 WS 端口（StaticServer 和 webpack-dev-server 均提供）
- `/api/config` — ConfigServer 配置读写端点
- `/api/restart` — ConfigServer 软重启触发
- `/api/addon-config` — addon 配置读写端点

**Outgoing:**
- 无外部 webhook 或回调

## Data Flow

**核心数据流（三层协作）：**

```
AI Assistants (Claude Code / OpenClaw / etc.)
    ↕ MCP (stdio) 或 Skill (shell 命令)
src/mcp/ (FastMCP Server) 或 skill/ (Markdown Skills)
    ↕ 子进程调用 `remnote-bridge --json <command>`
src/cli/ (CLI 守护进程)
    ↕ WebSocket (127.0.0.1:291xx)
remnote-plugin/ (RemNote Plugin)
    ↕ RemNote Plugin SDK
RemNote 知识库
```

**请求处理链路（以 `read_tree` 为例）：**

1. MCP 宿主调用 `read_tree` 工具 → `src/mcp/tools/read-tools.ts`
2. `callCli('read-tree', payload)` → 子进程 `remnote-bridge --json read-tree '{"remId":"..."}'`
3. CLI 命令 → `src/cli/commands/read-tree.ts` → `daemon/send-request.ts` → WebSocket 连接到 daemon
4. Daemon (`ws-server.ts`) 分发到 `TreeReadHandler` (`handlers/tree-read-handler.ts`)
5. Handler 检查缓存 → 通过 `forwardToPlugin()` 发送 `BridgeRequest` 到 Plugin
6. Plugin (`message-router.ts`) → `services/read-tree.ts` → RemNote SDK 调用
7. SDK 返回数据 → Plugin 序列化为 `BridgeResponse` → WebSocket 回传
8. Handler 缓存结果 → daemon 返回 → CLI 输出 JSON → MCP 格式化返回

**RAG 搜索增强流（可选）：**

1. `search` 命令检查 addon `remnote-rag` 是否启用
2. 启用则调用 `remnote-rag search` Python CLI
3. `remnote-rag` 直读 RemNote 本地 SQLite → ChromaDB 向量查询 → DashScope Embedding API
4. 结果返回（source: "rag"）；失败则降级到 SDK 全文搜索（source: "sdk"）

---

*Integration audit: 2026-03-16*
