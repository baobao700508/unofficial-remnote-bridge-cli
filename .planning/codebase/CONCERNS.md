# Codebase Concerns

**Analysis Date:** 2026-03-16

## Tech Debt

**config-server.ts 内联 HTML/CSS/JS（659 行单文件）：**
- Issue: `src/cli/server/config-server.ts` 将完整的可视化配置页面（HTML 模板、CSS 样式、JavaScript 逻辑）以模板字符串形式内联在 TypeScript 文件中，达 659 行。
- Files: `src/cli/server/config-server.ts`
- Impact: 难以维护前端逻辑（无语法高亮、无类型检查、无 linting），前端修改需触碰后端文件。内联 JS 使用未类型化的 `showToast`、`fillForm` 等全局函数，无法被 TypeScript 检查。
- Fix approach: 将 HTML/CSS/JS 提取为独立文件（如 `src/cli/server/config-page/`），构建时嵌入或运行时读取。或使用简单的模板引擎分离关注点。

**tree-parser.ts 复杂度过高（747 行）：**
- Issue: `src/cli/handlers/tree-parser.ts` 承载大纲解析、元数据解析、Powerup 前缀解析、diff 算法四项职责，函数数量多（`parseOutline`、`diffTrees`、`parsePowerupPrefix`、`collectNewLines`、`findCapturedChildren` 等），认知负荷高。
- Files: `src/cli/handlers/tree-parser.ts`
- Impact: 单文件承载过多逻辑，修改一处容易影响其他功能。diff 算法的多个 D-规则（D4、D6、D7、D9）分散在代码中，只通过注释标记。
- Fix approach: 拆分为 `outline-parser.ts`（行解析 + 树构建）、`tree-diff.ts`（diff 算法）、`powerup-prefix.ts`（前缀解析）三个文件，保持 handlers 层内部。

**WS 协议类型在两层重复定义：**
- Issue: `src/cli/protocol.ts` 和 `remnote-plugin/src/bridge/websocket-client.ts` 各自独立定义了完全相同的协议类型（`HelloMessage`、`BridgeRequest`、`BridgeResponse`、`PingMessage`、`PongMessage`、WS Close Code 常量），注释中明确写了「与 CLI 层不共享代码」。
- Files: `src/cli/protocol.ts`、`remnote-plugin/src/bridge/websocket-client.ts`
- Impact: 协议变更时必须两处同步修改，容易遗漏导致运行时不兼容。例如 Plugin 侧只定义了 `WS_CLOSE_OTHER_CONNECTED = 4000` 和 `WS_CLOSE_TWIN_EXISTS = 4003`，而 CLI 侧还有 `WS_CLOSE_PONG_TIMEOUT = 4001` 和 `WS_CLOSE_PREEMPTED = 4002`。
- Fix approach: 抽取共享的协议类型包（`src/shared/protocol.ts`），或至少将常量值定义为 JSON 文件两侧 import。需权衡 Plugin webpack 构建对外部 import 的支持度。

**message-router 中大量 `as` 类型断言：**
- Issue: `remnote-plugin/src/bridge/message-router.ts` 对每个 action 的 payload 使用显式 `as` 类型断言（如 `request.payload as { remId: string; ... }`），无运行时校验。
- Files: `remnote-plugin/src/bridge/message-router.ts`
- Impact: 如果 CLI 侧传入了格式错误的 payload，不会在路由层被拦截，错误会在 services 层以不可预测的方式暴露。
- Fix approach: 引入 Zod schema 或手动校验函数对 payload 进行运行时验证，在路由层提前报错。

**parseJsonInput 硬编码 remId 必填检查：**
- Issue: `src/cli/main.ts` 的 `parseJsonInput()` 函数（第 48 行）总是检查 `input.remId`，但并非所有命令都需要 `remId`（如 `search` 需要的是 `query`、`read-globe` 无必填参数）。
- Files: `src/cli/main.ts:34-60`
- Impact: 导致 `search --json '{"query":"test"}'` 等命令在没有 `remId` 时被错误拒绝。实际调用方通过各自的 `.action()` 绕过了此问题，但 `parseJsonInput` 的通用性被破坏。
- Fix approach: 将 `remId` 检查移到 `requiredFields` 参数中（已有此机制但未使用），调用方按需指定必填字段。

## Known Bugs

**ws-server.test.ts 全部失败（5/5 用例）：**
- Symptoms: `test/server/ws-server.test.ts` 的 5 个测试用例全部 FAIL。Hello 握手测试报 `expected false to be true`（Plugin 状态未正确识别），ping/pong 测试超时。
- Files: `test/server/ws-server.test.ts`、`src/cli/server/ws-server.ts`
- Trigger: `BridgeServer` 构造函数现在要求 `slotIndex` 参数，但测试代码（第 42 行）未提供此参数。同时 `HelloMessage` 协议现在包含 `twinSlotIndex` 字段，而测试的 hello 消息（第 58 行）缺少此字段，导致 `isHelloMessage()` 校验失败，Plugin 连接不被识别。
- Workaround: 无。测试代码需要更新以匹配当前 API。

**websocket-client.test.ts 部分失败（2/4 用例）：**
- Symptoms: `remnote-plugin/test/bridge/websocket-client.test.ts` 的重连相关测试失败。「断线后自动重连」和「达到最大重连次数后停止」均未按预期触发。
- Files: `remnote-plugin/test/bridge/websocket-client.test.ts`、`remnote-plugin/src/bridge/websocket-client.ts`
- Trigger: `WebSocketClient` 的 `scheduleReconnect()` 方法在非孪生连接时不会自动重连（第 240 行 `if (!this.config.isTwinConnection) return;`），而测试未设置 `isTwinConnection: true`。
- Workaround: 无。测试需要更新配置参数或分别测试孪生/非孪生重连行为。

**reference_repository 测试被 vitest 误收集：**
- Symptoms: `reference_repository/test/` 下的 8 个测试文件被 vitest 执行，全部失败（ENOENT 缺少文件）。
- Files: `vitest.config.ts`、`reference_repository/` 目录
- Trigger: `vitest.config.ts` 未配置 `exclude` 排除 `reference_repository/` 目录，而该目录为只读参考仓库（已 gitignore），其测试不适用于本项目。
- Workaround: 运行测试时手动 `--exclude 'reference_repository/**'`。
- Fix approach: 在 `vitest.config.ts` 的 `test.exclude` 中添加 `'reference_repository/**'`。

## Security Considerations

**ConfigServer 未鉴权，暴露配置读写 API：**
- Risk: `src/cli/server/config-server.ts` 的 HTTP 服务器绑定 `127.0.0.1`（仅本地访问），但无任何认证机制。任何本地进程可以 `POST /api/config` 修改守护进程配置、`POST /api/restart` 触发软重启、通过 addon 配置 API 读写 API Key。
- Files: `src/cli/server/config-server.ts`
- Current mitigation: 绑定 `127.0.0.1` 限制本地访问，配置文件写入时使用 `mode: 0o600` 权限。
- Recommendations: 对 API 端点添加 token 鉴权（daemon 启动时生成随机 token，CLI 命令通过 PID 文件获取 token），或至少限制 POST 请求来源。

**WebSocket 通信无认证：**
- Risk: WS Server（`src/cli/server/ws-server.ts`）监听 `127.0.0.1`，接受任何本地 WS 连接。CLI 命令和 Plugin 均通过无认证的 WS 通信，恶意本地进程可以冒充 Plugin 发送 hello 握手或冒充 CLI 发送 read/edit 请求，读写用户的 RemNote 知识库数据。
- Files: `src/cli/server/ws-server.ts`、`src/cli/daemon/send-request.ts`
- Current mitigation: 仅绑定 `127.0.0.1`；只允许一个 Plugin 连接；请求/响应通过 UUID 关联。
- Recommendations: 在 hello 握手中加入共享密钥验证（daemon 启动时生成，通过 Plugin 服务页面或 PID 文件传递）。

**addon 配置中的 API Key 以明文存储：**
- Risk: `~/.remnote-bridge/addons/remnote-rag/config.json` 中的 `embedding.api_key` 和 `reranker.api_key` 以明文 JSON 存储。ConfigServer 的 addon 配置 API 也直接读写这些明文值。
- Files: `src/cli/config.ts:266-273`（`saveAddonConfig` 函数）、`src/cli/server/config-server.ts`（addon 配置 API）
- Current mitigation: 配置文件使用 `mode: 0o600` 权限；配置页面中的输入框使用 `type="password"` 隐藏显示；支持通过 `api_key_env` 引用环境变量。
- Recommendations: 推荐用户优先使用 `api_key_env`（环境变量引用）而非直接填写 API Key。文档中应明确标注此风险。

## Performance Bottlenecks

**LRU 缓存的线性扫描淘汰：**
- Problem: `RemCache`（`src/cli/handlers/rem-cache.ts`）在缓存满时（默认 200 条）使用 `O(n)` 遍历 `Map` 查找最旧条目。
- Files: `src/cli/handlers/rem-cache.ts:47-58`
- Cause: `Map` 按插入顺序迭代，但 `lastAccess` 更新不改变迭代顺序，因此必须全量扫描。
- Improvement path: 利用 `Map` 的插入顺序特性：每次 `get()` 时先 `delete` 再 `set`，淘汰时直接取 `Map.keys().next().value`（即最旧条目），将淘汰操作从 `O(n)` 降为 `O(1)`。在 200 条目规模下影响不大，但如果未来提高上限则需优化。

**MCP 层每次调用都 spawn CLI 子进程：**
- Problem: `src/mcp/daemon-client.ts` 的 `callCli()` 通过 `execFile` 对每个 MCP 工具调用都启动一个新的 CLI 子进程。每次调用都经历进程创建 → Node.js 初始化 → ESM 模块加载 → WS 连接 → 请求 → 关闭 的完整流程。
- Files: `src/mcp/daemon-client.ts:57-96`
- Cause: 架构设计选择——MCP 通过子进程调用 CLI，遵守层间依赖约束（MCP 不 import CLI 代码）。
- Improvement path: 在 MCP Server 进程内维持一个长连接的 WS 客户端直连 daemon，绕过 CLI 子进程开销。需要在 `src/mcp/` 内实现轻量 WS 客户端，直接发送 BridgeRequest 格式的消息。这不违反架构约束（MCP 依赖 daemon 的 WS 协议，而非 import CLI 代码）。

**edit-tree 的防线 2 导致双重读取：**
- Problem: `src/cli/handlers/tree-edit-handler.ts` 每次 edit-tree 都会重新调用 `forwardToPlugin('read_tree', ...)` 获取最新大纲用于并发检测（防线 2），然后在写入成功后再次调用 `forwardToPlugin('read_tree', ...)` 更新缓存，共 2 次完整的 read-tree 操作。
- Files: `src/cli/handlers/tree-edit-handler.ts:64-68`（防线 2）、`src/cli/handlers/tree-edit-handler.ts:243-246`（成功后更新缓存）
- Cause: 乐观并发控制策略需要读取最新数据对比缓存。
- Improvement path: 防线 2 读取的 freshResult 如果与缓存一致，可以在写入成功后直接用 `modifiedOutline` 更新缓存（因为操作已执行），避免第二次 read-tree。但需要仔细验证操作执行后的实际大纲是否与预期完全一致（SDK 可能有副作用改变输出）。

## Fragile Areas

**tree-parser 的箭头分隔符解析：**
- Files: `src/cli/handlers/tree-parser.ts:220-280`（`parsePowerupPrefix` 函数）
- Why fragile: 代码注释（第 216-218 行）明确标注了已知限制——使用 `indexOf` 匹配第一个箭头字符，如果用户内容本身包含箭头字符（如 `A → B → C`），会被误切割为 text + backText。多种箭头类型（`→` `←` `↔` `↓` `↑` `↕`）的优先级匹配也增加了复杂度。
- Safe modification: 修改箭头解析逻辑时，必须同时验证 `remnote-plugin/src/utils/tree-serializer.ts` 中的序列化方向是否对称（read → serialize → parse 必须可逆）。
- Test coverage: 无自动化测试覆盖 `parsePowerupPrefix`。

**SDK Bug 的 workaround 代码（isCardItem + practiceDirection）：**
- Files: `src/cli/handlers/tree-edit-handler.ts:173-186`（create 路径）、`src/cli/handlers/tree-edit-handler.ts:211-229`（move 路径）
- Why fragile: 代码中有多处 `⚠ SDK bug` 注释，描述了 `setIsCardItem(true)` 会偷设 `practiceDirection: "forward"`、`setIsCardItem(false)` 不清 `practiceDirection` 的不对称行为。Workaround 是在 `setIsCardItem` 之后手动覆写 `practiceDirection`。
- Safe modification: RemNote SDK 升级后可能修复此 bug，届时 workaround 变成错误行为。修改前需要用 Claude in Chrome MCP 实测当前 SDK 版本的实际行为。
- Test coverage: 无自动化测试覆盖此 SDK 交互行为。

**Plugin 的多连接管理状态机：**
- Files: `remnote-plugin/src/bridge/websocket-client.ts`、`remnote-plugin/src/widgets/bridge_widget.tsx`
- Why fragile: WebSocket 重连逻辑区分孪生连接（twinConnection）和非孪生连接，抢占（preempted）场景有独立处理。Widget 每秒轮询 `plugin.storage` 读取状态（第 59 行），存在微小的状态不一致窗口。
- Safe modification: 修改重连策略时需同时更新 CLI 侧的 `ws-server.ts` 连接管理逻辑（WS Close Code 语义）和 Plugin 侧的 `websocket-client.ts`。
- Test coverage: 相关测试（2/4）当前失败，需要先修复测试。

## Scaling Limits

**最多 4 个并发 daemon 实例：**
- Current capacity: 4 个实例（`MAX_SLOTS = 4`），对应 4 组端口（29100/29110/29120/29130 段）。
- Limit: 超过 4 个实例时 `allocateSlot()` 返回 null，CLI 报错提示释放槽位。
- Scaling path: 修改 `src/cli/daemon/registry.ts` 中的 `MAX_SLOTS` 常量和 `DEFAULT_SLOTS` 数组，添加更多端口组。当前设计支持修改。
- Files: `src/cli/daemon/registry.ts:20-38`

**LRU 缓存上限 200 条目：**
- Current capacity: 每个 daemon 实例的内存缓存上限 200 条目（`DEFAULT_DEFAULTS.cacheMaxSize`）。
- Limit: 频繁操作大量不同 Rem 时缓存命中率下降，导致更多的「防线 1」失败（要求 re-read）。
- Scaling path: 通过配置页面或 `~/.remnote-bridge/config.json` 调整 `defaults.cacheMaxSize`。无硬编码上限，但受 daemon 进程内存限制。
- Files: `src/cli/config.ts:29`（`cacheMaxSize` 定义）

## Dependencies at Risk

**@remnote/plugin-sdk 0.0.46 — 处于 0.0.x 版本：**
- Risk: SDK 处于 0.0.x 阶段，API 可能随时有 breaking change。项目中多处使用了 SDK 的内部行为假设（如 `rem.type === 6` 判断 Portal 类型、Powerup 三层机制的底层 Tag 行为）。
- Impact: SDK 升级可能破坏 Plugin 层所有 services，特别是 `write-rem-fields.ts`、`read-rem.ts`、`rem-builder.ts` 中的字段读写逻辑。
- Migration plan: 维护 `docs/RemNote API Reference/` 文档（151 页），定期通过 `./scripts/crawl-remnote-docs.sh` 更新。升级 SDK 前必须逐一验证所有 services 的行为。
- Files: `remnote-plugin/package.json`（`@remnote/plugin-sdk: 0.0.46`）

**vitest 1.x vs 最新 4.x：**
- Risk: vitest 当前版本 1.6.1，最新已达 4.1.0。大版本差距可能导致与最新 Node.js 版本或其他工具链的兼容性问题。
- Impact: 测试功能不受影响，但可能错过性能改进和 bug 修复。
- Migration plan: 升级到 vitest 2.x+ 并修复可能的 breaking change。当前 7 个测试中有 7 个失败，应先修复测试再升级。
- Files: `package.json`（`vitest: ^1.3.0`）

**zod 3.x vs 最新 4.x：**
- Risk: zod 当前 3.25.76，最新 4.3.6。zod 4 有 breaking change（API 变化）。
- Impact: 目前 zod 仅在 `src/mcp/` 的 FastMCP 工具参数定义中使用，影响范围有限。
- Migration plan: FastMCP 升级可能要求 zod 4。评估 FastMCP 版本要求后再决定。
- Files: `package.json`（`zod: ^3.23.0`）

## Missing Critical Features

**无 linting/formatting 配置：**
- Problem: 项目中没有 `.eslintrc`、`.prettierrc`、`biome.json` 等任何代码质量工具配置。
- Blocks: 无法自动检测代码风格不一致、潜在 bug、未使用的变量等问题。多人/多 Agent 协作时风格可能漂移。
- Files: 项目根目录（缺少配置文件）

**handlers 和 services 层无单元测试：**
- Problem: 核心业务逻辑（`src/cli/handlers/` 和 `remnote-plugin/src/services/`）完全没有单元测试。`tree-parser.ts`（747 行，含 diff 算法）、`edit-handler.ts`、`read-handler.ts`、`tree-edit-handler.ts` 均无测试覆盖。Plugin 侧的 `write-rem-fields.ts`、`read-rem.ts`、`read-context.ts` 等也无测试。
- Blocks: 修改 diff 算法或字段白名单时无法自动验证正确性，只能依赖手动实机测试。
- Files: `src/cli/handlers/`（0 测试文件）、`remnote-plugin/src/services/`（0 测试文件）

**MCP 工具无测试：**
- Problem: `src/mcp/tools/` 的 3 个工具文件（`read-tools.ts`、`edit-tools.ts`、`infra-tools.ts`）无任何测试覆盖。
- Blocks: MCP 工具注册的参数定义（Zod schema）、返回值格式化（frontmatter/data JSON）无法自动验证。
- Files: `src/mcp/tools/`（0 测试文件）

## Test Coverage Gaps

**现有测试全部失败或过时：**
- What's not tested: 项目自有的 7 个测试文件中，`test/server/ws-server.test.ts`（5 个用例全部失败）和 `remnote-plugin/test/bridge/websocket-client.test.ts`（2/4 失败）因 API 变更未同步更新。只有基础设施测试（`test/config.test.ts`、`test/daemon/pid.test.ts`、`test/commands/connect.test.ts`、`test/commands/disconnect.test.ts`、`test/commands/health.test.ts`）通过。
- Files: `test/server/ws-server.test.ts`、`remnote-plugin/test/bridge/websocket-client.test.ts`
- Risk: WebSocket 通信层的核心逻辑（握手、心跳、请求转发、连接管理）无有效测试保护。
- Priority: High — 这是所有数据流通的基础设施。

**tree-parser（diff 算法）零测试覆盖：**
- What's not tested: 大纲解析、树 diff、Powerup 前缀解析、元数据解析、省略行检测、子节点劫持检测、折叠节点删除检测等核心功能。
- Files: `src/cli/handlers/tree-parser.ts`（747 行，0 测试）
- Risk: 这是 `edit-tree` 命令的核心引擎，任何 bug 可能导致用户的 RemNote 知识库数据被错误修改（创建/删除/移动 Rem）。当前完全依赖实机测试验证。
- Priority: High — 直接影响数据安全。

**edit-handler / tree-edit-handler 无测试：**
- What's not tested: 防线逻辑（缓存存在性检查、乐观并发检测、str_replace 精确匹配）、字段白名单校验、枚举值校验、操作执行序列。
- Files: `src/cli/handlers/edit-handler.ts`（166 行）、`src/cli/handlers/tree-edit-handler.ts`（263 行）
- Risk: 防线失效可能导致并发写入冲突未被检测，错误的字段值可能被写入 RemNote。
- Priority: High — 防线是数据一致性的核心保障。

**Plugin services 层无测试：**
- What's not tested: RemNote SDK 调用封装（`readRem`、`readTree`、`writeRemFields`、`createRem`、`deleteRem` 等 17 个 service 函数）。
- Files: `remnote-plugin/src/services/`（1981 行总计，0 测试）
- Risk: SDK 行为变更或参数错误无法被自动发现。
- Priority: Medium — 需要 SDK mock 层支持，实施成本较高。

---

*Concerns audit: 2026-03-16*
