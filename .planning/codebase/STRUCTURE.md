# Codebase Structure

**Analysis Date:** 2026-03-16

## Directory Layout

```
remnote-bridge-cli/                        (repo root = npm 包根)
├── package.json                           # 单包配置：bin, files, scripts
├── tsconfig.json                          # CLI + MCP 统一编译（ESM, es2022）
├── AGENTS.md                              # AI Agent 导航地图（约束 + 经验 + 目录索引）
├── src/                                   # TypeScript 源码（编译到 dist/）
│   ├── cli/                               # 命令层
│   │   ├── main.ts                        # CLI 入口（Commander.js 注册所有命令）
│   │   ├── protocol.ts                    # WS 协议类型定义（消息格式、类型守卫）
│   │   ├── config.ts                      # 配置加载（~/.remnote-bridge/config.json）
│   │   ├── commands/                      # CLI 命令入口（参数解析 + 输出格式化）
│   │   │   ├── connect.ts                 # 启动 daemon（fork 子进程）
│   │   │   ├── disconnect.ts              # 停止 daemon
│   │   │   ├── health.ts                  # 检查状态
│   │   │   ├── setup.ts                   # Headless 模式登录
│   │   │   ├── read-rem.ts                # 读取单个 Rem
│   │   │   ├── read-tree.ts               # 读取子树大纲
│   │   │   ├── read-globe.ts              # 读取知识库全局概览
│   │   │   ├── read-context.ts            # 读取当前上下文
│   │   │   ├── edit-rem.ts                # 编辑 Rem 属性
│   │   │   ├── edit-tree.ts               # 编辑子树结构
│   │   │   ├── search.ts                  # 搜索 Rem
│   │   │   ├── addon.ts                   # Addon 管理
│   │   │   ├── clean.ts                   # 清理残留文件
│   │   │   └── install-skill.ts           # 安装 Skill
│   │   ├── handlers/                      # 业务编排器（缓存、防线、校验）
│   │   │   ├── rem-cache.ts               # LRU 缓存
│   │   │   ├── read-handler.ts            # read-rem 编排
│   │   │   ├── edit-handler.ts            # edit-rem 编排（两道防线）
│   │   │   ├── tree-read-handler.ts       # read-tree 编排
│   │   │   ├── tree-edit-handler.ts       # edit-tree 编排（三道防线 + diff + 执行）
│   │   │   ├── tree-parser.ts             # 大纲解析器（parse + diff）
│   │   │   ├── globe-read-handler.ts      # read-globe 编排
│   │   │   └── context-read-handler.ts    # read-context 编排
│   │   ├── server/                        # 基础设施：WS 通信
│   │   │   ├── ws-server.ts               # WS Server（Plugin 连接管理 + 请求分发）
│   │   │   └── config-server.ts           # HTTP 配置管理服务器（Web UI）
│   │   ├── daemon/                        # 基础设施：进程管理
│   │   │   ├── daemon.ts                  # 守护进程主逻辑（fork 子进程入口）
│   │   │   ├── send-request.ts            # CLI 命令 → daemon WS 请求发送
│   │   │   ├── registry.ts                # 多实例注册表（slots + registry）
│   │   │   ├── pid.ts                     # PID 文件管理
│   │   │   ├── static-server.ts           # 静态文件服务器（serve plugin dist/）
│   │   │   ├── dev-server.ts              # webpack-dev-server 管理（--dev 模式）
│   │   │   └── headless-browser.ts        # Headless Chrome 管理（puppeteer-core）
│   │   ├── addon/                         # Addon 扩展管理
│   │   │   ├── addon-manager.ts           # Addon 生命周期管理
│   │   │   └── registry.ts                # Addon 注册表
│   │   └── utils/                         # 输出工具
│   │       └── output.ts                  # JSON/人类可读输出、错误处理
│   └── mcp/                               # 接入层（MCP Server）
│       ├── index.ts                       # MCP Server 入口（FastMCP 配置 + 启动）
│       ├── daemon-client.ts               # CLI 子进程调用封装（execFile）
│       ├── instructions.ts                # MCP Server 全局说明
│       ├── types.ts                       # 共享类型（CliResponse）
│       ├── format.ts                      # 返回值格式化（Frontmatter / DataJSON）
│       └── tools/                         # MCP 工具注册
│           ├── read-tools.ts              # search, read_rem, read_tree, read_globe, read_context
│           ├── edit-tools.ts              # edit_rem, edit_tree
│           └── infra-tools.ts             # connect, disconnect, health, setup, addon, clean
├── remnote-plugin/                        # 桥接层（RemNote 插件，独立 npm 子项目）
│   ├── package.json                       # 独立依赖管理（@remnote/plugin-sdk 等）
│   ├── package-lock.json                  # 锁定 600+ 依赖
│   ├── tsconfig.json                      # Plugin 独立 TS 配置
│   ├── webpack.config.js                  # Webpack 打包配置
│   ├── tailwind.config.js                 # Tailwind CSS 配置
│   ├── postcss.config.js                  # PostCSS 配置
│   ├── .npmignore                         # 确保 dist/ 打进 npm 包
│   ├── public/                            # 静态资源（manifest.json）
│   │   └── manifest.json                  # Plugin 清单
│   ├── dist/                              # 预构建产物（webpack output）
│   ├── src/
│   │   ├── settings.ts                    # Plugin 常量（版本号、端口列表、扫描间隔）
│   │   ├── types.ts                       # 类型定义（RemObject、RichText 等）
│   │   ├── index.css                      # 样式
│   │   ├── style.css                      # 样式
│   │   ├── widgets/                       # 宿主层：Plugin 入口 + 状态展示
│   │   │   ├── index.tsx                  # Plugin onActivate / onDeactivate 入口
│   │   │   └── bridge_widget.tsx          # Bridge Widget（右侧边栏状态面板）
│   │   ├── bridge/                        # 核心链入口：WS 传输 + 消息路由
│   │   │   ├── websocket-client.ts        # WS Client（连接 daemon、心跳、重连）
│   │   │   ├── multi-connection-manager.ts # 多连接管理器（4 个 daemon 槽位）
│   │   │   └── message-router.ts          # 请求路由（action → service 函数）
│   │   ├── services/                      # 核心链：SDK 业务操作
│   │   │   ├── read-rem.ts                # 组装完整 RemObject
│   │   │   ├── read-tree.ts               # 读取子树并序列化
│   │   │   ├── read-globe.ts              # 读取知识库全局概览
│   │   │   ├── read-context.ts            # 读取当前上下文
│   │   │   ├── search.ts                  # 搜索 Rem
│   │   │   ├── write-rem-fields.ts        # 原子写入 Rem 字段
│   │   │   ├── create-rem.ts              # 创建新 Rem
│   │   │   ├── delete-rem.ts              # 删除 Rem
│   │   │   ├── move-rem.ts                # 移动 Rem
│   │   │   ├── reorder-children.ts        # 重排子节点
│   │   │   ├── create-portal.ts           # 创建 Portal
│   │   │   ├── add-to-portal.ts           # 添加 Rem 到 Portal
│   │   │   ├── remove-from-portal.ts      # 从 Portal 移除 Rem
│   │   │   ├── powerup-filter.ts          # Powerup 噪音过滤
│   │   │   ├── breadcrumb.ts              # 面包屑路径计算
│   │   │   ├── rem-builder.ts             # Rem 类型转换辅助
│   │   │   └── index.ts                   # 导出汇总
│   │   ├── utils/                         # 核心链：无状态纯函数
│   │   │   ├── tree-serializer.ts         # 树大纲序列化（Markdown 格式）
│   │   │   ├── elision.ts                 # 省略引擎（siblings 裁剪）
│   │   │   └── index.ts                   # 导出汇总
│   │   └── test-scripts/                  # 开发测试脚本（非正式测试）
│   └── test/                              # Plugin 测试
├── skills/                                # 接入层（Skill 文档）
│   └── remnote-bridge/
│       ├── SKILL.md                       # Skill 定义入口
│       └── instructions/                  # 每个命令的详细 Markdown 文档（15 个 .md）
├── remnote-rag/                           # 语义搜索增强（独立 Python 包）
│   ├── pyproject.toml                     # hatchling 构建，bin: remnote-rag
│   ├── src/remnote_rag/                   # Python 核心代码
│   └── tests/                             # pytest 测试
├── remnote-chat/                          # 独立子项目（RemNote Chat 插件）
├── scripts/                               # 工具脚本
│   ├── check-layer-deps.cjs              # 层间依赖检查（CI 可用）
│   ├── crawl-remnote-docs.sh             # 爬取 RemNote Plugin SDK 文档
│   └── crawl-helpcenter.sh               # 爬取 RemNote Help Center
├── docs/                                  # 项目文档
│   ├── RemNote API Reference/            # SDK 文档（151 页 .md）
│   ├── RemNote Help Center/              # Help Center 文档
│   ├── plans/                            # 开发计划
│   ├── brainstorms/                      # 头脑风暴
│   ├── richtext-format/                  # RichText 格式研究
│   ├── rem-type-mapping/                 # Rem 类型映射研究
│   └── powerup-rendering/               # Powerup 渲染研究
├── test/                                  # CLI 层测试
│   ├── setup.ts                          # 测试配置
│   ├── config.test.ts                    # 配置加载测试
│   ├── commands/                         # 命令测试
│   │   ├── connect.test.ts
│   │   ├── disconnect.test.ts
│   │   └── health.test.ts
│   ├── daemon/
│   │   └── pid.test.ts
│   └── server/
│       └── ws-server.test.ts
├── dist/                                  # 编译输出（tsc 产物）
│   ├── cli/                              # CLI + daemon 编译产物
│   └── mcp/                              # MCP 编译产物
├── .claude/                               # Claude Code 配置
│   ├── CLAUDE.md                         # 项目指导
│   ├── commands/                         # 自定义命令
│   ├── get-shit-done/                    # GSD 工作流配置
│   ├── hooks/                            # 钩子
│   └── rules/                            # 规则（含 AGENTS.md 符号链接）
├── .planning/                             # GSD 工作流文档
│   └── codebase/                         # 代码库分析文档
└── public/                                # 全局静态资源
```

## Directory Purposes

**`src/cli/commands/`:**
- Purpose: CLI 命令入口。每个文件对应一个终端命令，负责参数解析、调用 `sendDaemonRequest()`、格式化输出
- Contains: 14 个命令文件
- Key files: `connect.ts`（启动 daemon）、`read-tree.ts`（最常用的读取命令）、`edit-tree.ts`（结构编辑）

**`src/cli/handlers/`:**
- Purpose: 业务编排逻辑。在 daemon 进程内运行，管理缓存、执行防线检查、调用 Plugin
- Contains: 7 个 handler + 1 个 parser + 1 个 cache
- Key files: `tree-edit-handler.ts`（最复杂，三道防线 + diff + 执行）、`rem-cache.ts`（LRU 缓存）

**`src/cli/server/`:**
- Purpose: daemon 内的服务器基础设施
- Contains: WS Server（核心通信）+ ConfigServer（HTTP 配置 UI）
- Key files: `ws-server.ts`（Plugin 连接管理 + 请求分发到 handler）

**`src/cli/daemon/`:**
- Purpose: daemon 进程生命周期管理
- Contains: 进程启停、PID 管理、多实例注册表、Plugin 服务、Headless Chrome
- Key files: `daemon.ts`（fork 入口）、`send-request.ts`（CLI → daemon 通信）、`registry.ts`（slot 分配）

**`src/mcp/`:**
- Purpose: MCP Server，将 CLI 命令暴露为 AI 可调用的 tool
- Contains: Server 入口、daemon-client 封装、tool 注册、格式化
- Key files: `daemon-client.ts`（子进程调用核心）、`tools/read-tools.ts`（5 个读取工具，description 最详细）

**`remnote-plugin/src/bridge/`:**
- Purpose: Plugin 侧的 WS 通信层（不碰 SDK 数据 API）
- Contains: WS Client、多连接管理器、消息路由
- Key files: `message-router.ts`（action → service 映射）、`multi-connection-manager.ts`（4 槽位并发管理）

**`remnote-plugin/src/services/`:**
- Purpose: 通过 RemNote SDK 执行实际的知识库操作
- Contains: 17 个 service 文件 + 辅助函数
- Key files: `read-rem.ts`（组装 51 字段 RemObject）、`read-tree.ts`（树遍历 + 序列化调用）、`write-rem-fields.ts`（原子字段写入）

**`remnote-plugin/src/utils/`:**
- Purpose: 无状态纯函数，禁止调用 SDK、禁止有副作用
- Contains: tree-serializer（大纲格式化）、elision（省略裁剪）
- Key files: `tree-serializer.ts`（Markdown 大纲行格式定义：缩进、前缀、箭头、元数据注释）

**`skills/remnote-bridge/`:**
- Purpose: Vercel Skills 生态兼容的 Agent Skill 文档
- Contains: SKILL.md 入口 + 15 个命令详细文档
- Key files: `instructions/overall.md`（全局说明）、`instructions/read-tree.md`（最常用命令文档）

## Key File Locations

**Entry Points:**
- `src/cli/main.ts`: CLI 主入口（`bin: remnote-bridge`）
- `src/mcp/index.ts`: MCP Server 入口
- `src/cli/daemon/daemon.ts`: daemon 进程入口（fork 子进程）
- `remnote-plugin/src/widgets/index.tsx`: Plugin 入口（`onActivate`）

**Configuration:**
- `package.json`: npm 包配置
- `tsconfig.json`: TypeScript 编译配置
- `src/cli/config.ts`: 运行时配置加载（`~/.remnote-bridge/config.json`）
- `remnote-plugin/src/settings.ts`: Plugin 常量

**Core Logic:**
- `src/cli/server/ws-server.ts`: WS Server（连接管理 + 请求路由）
- `src/cli/handlers/tree-edit-handler.ts`: 最复杂的业务逻辑（三道防线 + diff）
- `src/cli/handlers/tree-parser.ts`: 大纲解析和差异对比
- `remnote-plugin/src/bridge/message-router.ts`: action → service 路由
- `remnote-plugin/src/services/read-rem.ts`: RemObject 组装（51 字段）
- `remnote-plugin/src/utils/tree-serializer.ts`: 大纲序列化格式

**Protocol:**
- `src/cli/protocol.ts`: daemon 侧协议定义
- `remnote-plugin/src/bridge/websocket-client.ts`: Plugin 侧协议定义（独立定义，不共享）
- `remnote-plugin/src/types.ts`: RemObject、RichText 等业务类型

**Testing:**
- `test/`: CLI 层测试（vitest）
- `test/server/ws-server.test.ts`: WS Server 测试
- `test/config.test.ts`: 配置加载测试
- `remnote-plugin/test/`: Plugin 测试

## Naming Conventions

**Files:**
- CLI 命令文件使用 kebab-case：`read-tree.ts`、`edit-rem.ts`
- Handler 文件使用 kebab-case + 职责后缀：`tree-read-handler.ts`、`rem-cache.ts`
- Plugin services 文件使用 kebab-case，与 CLI 命令同态命名：`read-tree.ts`、`write-rem-fields.ts`
- MCP tools 文件按功能分组：`read-tools.ts`、`edit-tools.ts`、`infra-tools.ts`
- Widget 文件使用 snake_case：`bridge_widget.tsx`

**Directories:**
- 横向架构分层用独立顶级目录：`src/cli/`、`src/mcp/`、`remnote-plugin/`
- CLI 内部按职责分子目录：`commands/`、`handlers/`、`server/`、`daemon/`
- Plugin 内部按分层：`widgets/`、`bridge/`、`services/`、`utils/`

**同态命名规则（跨层）:**

| CLI 命令 | 协议 action | services 文件 | services 函数 |
|:---------|:-----------|:-------------|:-------------|
| `read-rem` | `read_rem` | `read-rem.ts` | `readRem()` |
| `read-tree` | `read_tree` | `read-tree.ts` | `readTree()` |
| `edit-tree` (内部调用) | `create_rem` | `create-rem.ts` | `createRem()` |
| `search` | `search` | `search.ts` | `search()` |

## Where to Add New Code

**New CLI Command:**
1. 命令入口：`src/cli/commands/<command-name>.ts`（参数解析 + `sendDaemonRequest()`）
2. 在 `src/cli/main.ts` 注册命令（`program.command()`）
3. 如需 daemon 内编排：新建 `src/cli/handlers/<xxx>-handler.ts`
4. 在 `src/cli/server/ws-server.ts` 的 `handleCliRequest()` 中添加 action 分发
5. Plugin 侧：`remnote-plugin/src/services/<command-name>.ts`（SDK 操作）
6. 在 `remnote-plugin/src/bridge/message-router.ts` 添加 switch case
7. 必须遵守同态命名规则

**New MCP Tool:**
1. 在 `src/mcp/tools/` 对应文件中添加 `server.addTool()`
2. 使用 `callCli()` 调用对应 CLI 命令
3. 选择返回格式：`formatFrontmatter()`（outline 类）或 `formatDataJson()`（action/infra 类）
4. 同步更新 `skills/remnote-bridge/instructions/` 中的文档

**New Plugin Service:**
1. `remnote-plugin/src/services/<service-name>.ts`（单文件封装一条 SDK 操作链）
2. 在 `remnote-plugin/src/bridge/message-router.ts` 添加 import 和 switch case
3. 遵守分层约束：services 不碰 WebSocket，bridge 不碰 SDK

**New Plugin Utils:**
1. `remnote-plugin/src/utils/<util-name>.ts`（纯函数，禁止调用 SDK，禁止副作用）
2. 在 `remnote-plugin/src/utils/index.ts` 中导出

**New Skill Document:**
1. `skills/remnote-bridge/instructions/<command-name>.md`
2. 同步更新 `SKILL.md` 中的命令列表
3. 必须与 MCP tool description 保持同步

## Special Directories

**`~/.remnote-bridge/` (运行时目录，不在 repo 中):**
- Purpose: 所有运行时文件的根目录
- Generated: Yes（首次 `connect` 时创建）
- Committed: No
- Contains: `config.json`, `slots.json`, `registry.json`, `instances/N.pid`, `instances/N.log`, `addons/<name>/config.json`

**`dist/`:**
- Purpose: TypeScript 编译输出（`tsc` 产物）
- Generated: Yes（`npm run build`）
- Committed: No（`.gitignore`）

**`remnote-plugin/dist/`:**
- Purpose: Plugin 预构建产物（webpack output）
- Generated: Yes（`npm run build:plugin`）
- Committed: No（`.gitignore`），但通过 `.npmignore` 确保打进 npm 包

**`reference_repository/`:**
- Purpose: 参考项目（remnote-mcp-bridge 克隆，只读）
- Generated: No
- Committed: No（`.gitignore`）

**`docs/RemNote API Reference/`:**
- Purpose: RemNote Plugin SDK 文档（151 页，脚本爬取）
- Generated: Yes（`./scripts/crawl-remnote-docs.sh`）
- Committed: Yes
- 更新规则：距上次爬取超过 7 天时必须更新

**`remnote-rag/`:**
- Purpose: 独立 Python 包，语义搜索增强（ChromaDB + DashScope）
- Generated: No
- Committed: Yes
- 独立安装：`pip install`，通过 addon 机制集成

## Runtime File Layout

```
~/.remnote-bridge/                         (GLOBAL_DIR)
├── config.json                            # 全局配置
├── slots.json                             # 4 组端口定义
├── registry.json                          # instance → slot 映射
├── instances/
│   ├── 0.pid                              # 槽位 0 PID 文件（JSON）
│   ├── 0.log                              # 槽位 0 日志
│   ├── 1.pid / 1.log                      # 槽位 1
│   ├── 2.pid / 2.log                      # 槽位 2
│   └── 3.pid / 3.log                      # 槽位 3
├── addons/
│   └── remnote-rag/
│       └── config.json                    # remnote-rag addon 配置
└── headless/                              # Headless Chrome 数据
    └── setup-done                         # setup 完成标记
```

## Dependency Check

运行 `node scripts/check-layer-deps.cjs` 检查跨层依赖违规。该脚本同时检查：
- 跨层（CLI ↛ MCP、Plugin ↛ CLI 等）
- Plugin 内部（bridge ↛ services 反向、utils ↛ SDK 等）
- CLI 内部（handlers ↛ server/commands/daemon 等）

---

*Structure analysis: 2026-03-16*
