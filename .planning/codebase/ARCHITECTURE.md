# Architecture

**Analysis Date:** 2026-03-16

## Pattern Overview

**Overall:** 三层协作架构（桥接层 - 命令层 - 接入层），通过 WebSocket + 子进程调用连接各层。

**Key Characteristics:**
- 单包发布（`npm install -g remnote-bridge`），但 `remnote-plugin/` 是独立的 npm 子项目（有自己的 `package.json` + `package-lock.json`）
- 层间通过 WebSocket 协议和子进程（`execFile`）通信，禁止跨层 import
- 守护进程（daemon）是长生命周期进程，CLI 命令是短生命周期进程；缓存和状态存储在 daemon 内存中
- 支持最多 4 个并发 daemon 实例（slot 机制），Plugin 同时连接所有 daemon

## Layers

**桥接层 (Bridge Layer):**
- Purpose: 在 RemNote 浏览器环境中运行，通过 RemNote Plugin SDK 直接操作知识库数据
- Location: `remnote-plugin/src/`
- Contains: WebSocket Client、消息路由、SDK 业务操作（services）、序列化工具（utils）
- Depends on: RemNote Plugin SDK (`@remnote/plugin-sdk`)
- Used by: 命令层通过 WebSocket 发送请求

**命令层 (Command Layer):**
- Purpose: 封装所有 RemNote 操作为统一的 CLI 命令接口；管理 daemon 生命周期、缓存、并发防线
- Location: `src/cli/`
- Contains: CLI 入口、命令定义、业务编排 handler、WS Server、daemon 进程管理
- Depends on: 桥接层（通过 WS 协议转发请求）
- Used by: 接入层（MCP 通过子进程调用 CLI、Skill 文档描述 CLI 命令）

**接入层 (Access Layer):**
- Purpose: 将 CLI 命令暴露给 AI Agent（MCP 协议 + Skill Markdown 文档）
- Location: `src/mcp/` + `skills/`
- Contains: FastMCP Server、tool 注册、daemon-client 封装、Skill 定义文档
- Depends on: 命令层（通过 `execFile` 子进程调用 `remnote-bridge --json`）
- Used by: AI 助手（Claude Code、OpenClaw 等）

## Data Flow

**典型读取流程（以 `read_tree` 为例）:**

1. AI Agent 调用 MCP tool `read_tree`（`src/mcp/tools/read-tools.ts`）
2. MCP tool 通过 `callCli('read-tree', payload)`（`src/mcp/daemon-client.ts`）fork 子进程执行 `remnote-bridge --json read-tree '{"remId":"..."}'`
3. CLI 命令入口 `src/cli/commands/read-tree.ts` 解析参数，调用 `sendDaemonRequest('read_tree', payload)`（`src/cli/daemon/send-request.ts`）
4. `sendDaemonRequest` 通过 registry 查找当前实例的 WS 端口，建立临时 WebSocket 连接，发送 `BridgeRequest`
5. daemon 的 `BridgeServer`（`src/cli/server/ws-server.ts`）收到请求，分发到 `TreeReadHandler.handleReadTree()`（`src/cli/handlers/tree-read-handler.ts`）
6. `TreeReadHandler` 通过 `forwardToPlugin('read_tree', payload)` 将请求转发给 Plugin
7. Plugin 的 `WebSocketClient`（`remnote-plugin/src/bridge/websocket-client.ts`）收到请求，交给 `message-router`（`remnote-plugin/src/bridge/message-router.ts`）
8. `message-router` 路由到 `services/read-tree.ts`，调用 RemNote SDK 获取数据，使用 `utils/tree-serializer.ts` 序列化为 Markdown 大纲
9. 结果沿原路返回：Plugin WS response → daemon WS response → CLI stdout JSON → MCP tool 格式化为 Frontmatter + Body

**典型编辑流程（以 `edit_tree` 为例）:**

1. AI Agent 调用 MCP tool `edit_tree`（`src/mcp/tools/edit-tools.ts`）
2. 请求经 MCP → CLI → daemon → `TreeEditHandler`（`src/cli/handlers/tree-edit-handler.ts`）
3. 防线 1: 检查 `RemCache` 中是否有 `tree:{remId}` 缓存（必须先 `read_tree`）
4. 防线 2: 通过 `forwardToPlugin('read_tree')` 获取最新大纲，与缓存比对（乐观并发检测）
5. 防线 3: `str_replace` 精确匹配 `oldStr` 在大纲中出现一次
6. 解析新旧大纲差异（`tree-parser.ts`），生成操作序列（create/delete/move/reorder）
7. 逐项通过 `forwardToPlugin` 调用原子操作（`create_rem`、`delete_rem`、`move_rem`、`reorder_children`、`write_rem_fields`）
8. 成功后重新 `read_tree` 更新缓存

**State Management:**
- 缓存存储在 daemon 的 `RemCache` 实例中（`src/cli/handlers/rem-cache.ts`），LRU 策略，上限 200 条目
- 会话 = daemon 生命周期：`connect` 启动 → `disconnect` 关闭，缓存随 daemon 销毁
- 不使用 TTL：依靠第二道防线（写前变更检测）保证数据一致性
- Plugin 状态通过 `plugin.storage.setSession()` 存储，供 Widget 轮询显示

## Key Abstractions

**BridgeRequest / BridgeResponse:**
- Purpose: CLI daemon 与 Plugin 之间的统一消息格式
- Examples: `src/cli/protocol.ts`（daemon 侧定义）、`remnote-plugin/src/bridge/websocket-client.ts`（Plugin 侧独立定义）
- Pattern: 请求/响应模式，通过 `id` 字段关联。每个请求包含 `action` 和 `payload`，响应包含 `result` 或 `error`

**Handler 编排器:**
- Purpose: 在 daemon 中实现业务编排逻辑（缓存、防线、字段过滤），将"怎么通信"和"做什么"解耦
- Examples: `src/cli/handlers/read-handler.ts`、`src/cli/handlers/edit-handler.ts`、`src/cli/handlers/tree-read-handler.ts`、`src/cli/handlers/tree-edit-handler.ts`
- Pattern: 构造注入 `forwardToPlugin` 回调函数，不直接依赖 `ws-server`

**RemCache:**
- Purpose: 缓存 Rem 数据和树大纲，支持 read-before-edit 防线机制
- Examples: `src/cli/handlers/rem-cache.ts`
- Pattern: LRU Map，key 前缀区分数据类型（`rem:`, `tree:`, `tree-depth:` 等）

**同态命名映射:**
- Purpose: CLI 命令 → 协议 action → Plugin message-router case → services 文件/函数保持命名一致
- Examples: `read-tree` (CLI) → `read_tree` (action) → `read-tree.ts` / `readTree()` (service)
- Pattern: 新增业务命令时，必须在所有层同时添加同态命名的对应实现

## Entry Points

**CLI 主入口:**
- Location: `src/cli/main.ts`
- Triggers: `remnote-bridge <command>` 终端命令
- Responsibilities: 注册 Commander.js 命令、解析全局参数（`--json`、`--instance`、`--headless`）、分发到各命令函数

**MCP Server 入口:**
- Location: `src/mcp/index.ts`
- Triggers: `remnote-bridge mcp`（由 AI 客户端通过 stdio 连接）
- Responsibilities: 创建 FastMCP Server，注册所有 MCP tool，启动 stdio 传输

**Daemon 进程入口:**
- Location: `src/cli/daemon/daemon.ts`
- Triggers: `connect` 命令通过 `fork()` 启动子进程
- Responsibilities: 启动 WS Server、ConfigServer、Plugin 服务（静态/dev）、Headless Chrome（可选）、管理超时自动关闭

**Plugin 入口:**
- Location: `remnote-plugin/src/widgets/index.tsx`
- Triggers: RemNote 加载插件时调用 `onActivate()`
- Responsibilities: 注册 Bridge Widget、创建 `MultiConnectionManager`（连接 4 个 daemon 槽位）、设置消息路由

## Communication Mechanisms

**WebSocket (daemon <-> Plugin):**
- `BridgeServer`（`src/cli/server/ws-server.ts`）监听 `127.0.0.1:<wsPort>`
- `WebSocketClient`（`remnote-plugin/src/bridge/websocket-client.ts`）连接到 daemon
- 握手：Plugin 发送 `HelloMessage`（含版本、SDK 状态、孪生槽位索引），daemon 识别并管理连接
- 心跳：daemon 定期 ping（30s 间隔），Plugin 回复 pong，10s 无 pong 断开
- 请求转发：daemon 使用 `forwardToPlugin()`，生成独立 `requestId`，通过 `pendingPluginRequests` Map 关联 Promise

**WebSocket (CLI command -> daemon):**
- CLI 命令通过 `sendDaemonRequest()`（`src/cli/daemon/send-request.ts`）建立临时 WS 连接
- 端口发现：读取 `~/.remnote-bridge/registry.json` 找到当前实例的 WS 端口
- 连接是短暂的：发送请求 → 等待响应 → 关闭连接

**子进程 (MCP -> CLI):**
- `daemon-client.ts`（`src/mcp/daemon-client.ts`）通过 `execFile('remnote-bridge', ['--json', command, jsonStr])` 调用 CLI
- CLI 以 `--json` 模式输出一行 JSON 到 stdout
- MCP 解析 JSON 响应，格式化后返回给 AI

**IPC (connect command -> daemon process):**
- `connect` 命令通过 `fork()` 启动 daemon 子进程
- daemon 启动完成后通过 `process.send()` 发送 `ready` 消息（含实际端口信息）
- connect 命令收到 ready 后断开 IPC channel，让 daemon 独立运行

**HTTP (ConfigServer):**
- `ConfigServer`（`src/cli/server/config-server.ts`）监听 `127.0.0.1:<configPort>`
- 提供 Web 配置页面、配置 API（GET/POST /api/config）、软重启 API（POST /api/restart）
- Plugin Widget 链接配置页面按钮

**Discovery (Plugin -> StaticServer):**
- Plugin 通过 `fetch('/api/discovery')` 同源请求发现孪生 daemon 信息（slotIndex、wsPort、configPort、instance）
- `StaticServer`（`src/cli/daemon/static-server.ts`）在 `/api/discovery` 端点返回 daemon 元数据

## Multi-Instance Architecture

**Slot 机制:**
- 最多 4 个并发 daemon 实例（`MAX_SLOTS = 4`）
- 每个 slot 分配 3 个端口：wsPort、devServerPort、configPort
- 默认端口组：29100/29101/29102、29110/29111/29112、29120/29121/29122、29130/29131/29132
- 端口定义在 `~/.remnote-bridge/slots.json`，实例映射在 `~/.remnote-bridge/registry.json`

**实例标识（Instance ID）:**
- 通过 `--instance <name>` 或 `REMNOTE_BRIDGE_INSTANCE` 环境变量指定
- `--headless` 模式固定实例名为 `headless`
- 默认实例名 `default`
- 解析逻辑：`resolveInstanceId()`（`src/cli/daemon/registry.ts`）

**孪生优先级（Twin Slot）:**
- 每个 Plugin 通过 discovery 获取自己的 `twinSlotIndex`
- 孪生连接有重连机制（指数退避，最多 10 次）
- 非孪生连接无自动重连，由 `MultiConnectionManager` 周期扫描（18s）尝试
- 孪生 Plugin 可以抢占非孪生连接（`PreemptedMessage`）
- 自定义 WS Close Code：4000（非孪生拒绝）、4001（pong 超时）、4002（被抢占）、4003（孪生已连）

## Caching Strategy

**缓存位置:** daemon 内存中的 `RemCache` 实例（`src/cli/handlers/rem-cache.ts`）

**缓存 Key 前缀:**
- `rem:{remId}` → 完整 RemObject（`ReadHandler` 写入）
- `tree:{remId}` → Markdown 大纲文本（`TreeReadHandler` 写入）
- `tree-depth:{remId}`, `tree-maxNodes:{remId}`, `tree-maxSiblings:{remId}` → 读取参数（供 `TreeEditHandler` 复现查询）

**淘汰策略:** LRU，上限 200 条目（可通过 `~/.remnote-bridge/config.json` 的 `defaults.cacheMaxSize` 配置）

**一致性保证（两道/三道防线）:**
- 防线 1（缓存存在性）：edit 前必须先 read 建立缓存
- 防线 2（乐观并发检测）：edit 前从 Plugin 重新获取最新数据，与缓存比对；不一致则拒绝并迫使 AI re-read
- 防线 3（仅 `edit_tree`）：`str_replace` 必须在大纲中精确匹配一次

**缓存生命周期:** 与 daemon 一致，`disconnect` 时自然销毁，无需 TTL

## Error Handling

**Strategy:** 错误通过 throw Error 向上冒泡，由 CLI 命令层统一格式化输出

**Patterns:**
- `DaemonNotRunningError` / `DaemonUnreachableError`（`src/cli/daemon/send-request.ts`）：daemon 连接失败
- `CliError`（`src/mcp/daemon-client.ts`）：CLI 返回 `ok: false` 或子进程异常
- handler 层直接 `throw new Error(...)`（英文错误消息，面向 AI 消费）
- CLI 命令层通过 `handleCommandError()`（`src/cli/utils/output.ts`）统一处理，区分 `--json` 和人类可读模式
- Plugin request timeout：15s（`PLUGIN_REQUEST_TIMEOUT_MS`）
- CLI daemon response timeout：30s（`DEFAULT_RESPONSE_TIMEOUT_MS`）

## Cross-Cutting Concerns

**Logging:**
- daemon 日志写入文件 `~/.remnote-bridge/instances/N.log`
- 各组件通过 `onLog` 回调注入日志函数
- Plugin 日志通过 `plugin.storage.setSession('bridge-logs')` 存储，Widget 轮询显示

**Validation:**
- 字段白名单校验在 `EditHandler`（`src/cli/handlers/edit-handler.ts`）：21 个可写字段、只读字段集、枚举值范围
- CLI 参数校验在命令入口文件（`src/cli/commands/*.ts`）
- 配置校验在 `ConfigServer`（`src/cli/server/config-server.ts`）

**Configuration:**
- 全局配置：`~/.remnote-bridge/config.json`（`src/cli/config.ts` 加载、合并默认值）
- Addon 配置：`~/.remnote-bridge/addons/<name>/config.json`
- Plugin 常量：`remnote-plugin/src/settings.ts`（版本号、端口列表、扫描间隔）
- 所有端口由 `slots.json` 管理，不出现在用户配置中

**Powerup Filtering:**
- RemNote 的 Powerup 系统产生大量噪音数据（系统 Tag、隐藏子 Rem）
- 默认过滤（`includePowerup: false`），可通过参数恢复
- 过滤逻辑在 Plugin 层：`remnote-plugin/src/services/powerup-filter.ts`

---

*Architecture analysis: 2026-03-16*
