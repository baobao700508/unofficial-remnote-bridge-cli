# Technology Stack

**Analysis Date:** 2026-03-16

## Languages

**Primary:**
- TypeScript 5.4+ — CLI 层 (`src/cli/`)、MCP 层 (`src/mcp/`)、Plugin 层 (`remnote-plugin/src/`) 全部使用
- 严格模式：`strict: true` + `strictNullChecks: true`（两个 tsconfig 均启用）

**Secondary:**
- Python 3.9+ — RAG 语义搜索增强模块 (`remnote-rag/`)，独立的 git submodule
- JavaScript (CJS) — Webpack 配置 (`remnote-plugin/webpack.config.js`)、PostCSS/Tailwind 配置、部分脚本 (`scripts/check-layer-deps.cjs`)
- CSS — Plugin UI 样式 (`remnote-plugin/src/index.css`, `remnote-plugin/src/style.css`)，使用 TailwindCSS

## Runtime

**Environment:**
- Node.js — 当前开发环境 v22.12.0，无 `.nvmrc` 或 `.node-version` 文件，`package.json` 未指定 `engines` 字段
- TypeScript target: `es2022`（CLI/MCP），`esnext`（Plugin）
- ESM 模块系统 — `"type": "module"` in `package.json`，CLI/MCP 使用 `NodeNext` module resolution
- Python 3.9+ — `remnote-rag/` 使用

**Package Manager:**
- npm — 项目根和 `remnote-plugin/` 各自独立管理
- `package-lock.json` 存在于两处：根目录和 `remnote-plugin/`
- **注意**：`remnote-plugin/` 不是 workspace，是独立的 npm 子项目（有自己的 `package.json` + `package-lock.json`），但通过根包 `files` 字段一起发布
- pip + hatchling — `remnote-rag/` 使用 (`pyproject.toml`)

## Frameworks

**Core:**
- Commander.js ^12.1.0 — CLI 命令框架，`src/cli/main.ts` 中注册所有命令
- FastMCP ^3.34.0 — MCP Server 实现（stdio 传输），`src/mcp/index.ts` 入口
- React 17.0.2 — Plugin UI（仅 `remnote-plugin/src/widgets/` 目录）
- RemNote Plugin SDK 0.0.46 — Plugin 层与 RemNote 知识库交互（`@remnote/plugin-sdk`）

**Testing:**
- Vitest ^1.3.0 — 根项目和 Plugin 均使用
  - 根项目：`vitest.config.ts`，environment: `node`，setup: `test/setup.ts`
  - Plugin：`remnote-plugin/vitest.config.ts`，environment: `happy-dom`，setup: `remnote-plugin/test/setup.ts`
- happy-dom ^14.0.0 — Plugin 测试的 DOM 模拟环境

**Build/Dev:**
- tsc (TypeScript Compiler) — CLI/MCP 编译（`npm run build` → `tsc`）
- Webpack 5.97 — Plugin 构建，esbuild-loader 加速编译
- tsx ^4.7.0 — 开发模式直接运行 TypeScript（`npm run dev`）
- webpack-dev-server 5.2 — Plugin 开发模式（HMR 支持，端口默认 8080）
- hatchling — `remnote-rag/` 的 Python 包构建系统

## Key Dependencies

**Critical（生产依赖）:**
- `ws` ^8.16.0 — WebSocket Server，守护进程与 Plugin 通信的核心基础设施。`src/cli/server/ws-server.ts` 中使用
- `commander` ^12.1.0 — CLI 命令解析。`src/cli/main.ts`
- `fastmcp` ^3.34.0 — MCP 协议实现。`src/mcp/index.ts`
- `zod` ^3.23.0 — MCP 工具参数校验（schema 定义）。`src/mcp/tools/*.ts`
- `puppeteer-core` ^24.0.0 — Headless Chrome 控制，用于无 GUI 环境自动加载 RemNote。`src/cli/daemon/headless-browser.ts`
- `@remnote/plugin-sdk` 0.0.46 — RemNote 官方 Plugin SDK，仅 `remnote-plugin/` 内使用

**Infrastructure（开发依赖）:**
- `typescript` ^5.4.0 — 编译器
- `tsx` ^4.7.0 — 开发时直接运行 TS
- `@types/node` ^20.11.0 — Node.js 类型定义
- `@types/ws` ^8.5.0 — WebSocket 类型定义

**Plugin 构建链:**
- `esbuild-loader` ^4.4.0 — Webpack 中使用 esbuild 加速 TS/TSX 编译
- `tailwindcss` ^3.4.17 + `postcss` ^8.4.49 + `autoprefixer` — CSS 工具链
- `mini-css-extract-plugin` ^2.10.0 — 生产模式 CSS 提取
- `@pmmmwh/react-refresh-webpack-plugin` — 开发模式 React HMR
- `copy-webpack-plugin` ^12.0.0 — 复制 `public/` 到 dist
- `bestzip` ^2.2.1 — 构建后打包 `PluginZip.zip`

**RAG 模块（Python）:**
- `chromadb` >=0.4 — 向量数据库，构建和查询语义索引
- `openai` >=1.0 — 调用 Embedding / Reranker API（兼容 DashScope）
- `pytest` >=7.0 — 测试框架（可选开发依赖）

## Configuration

**全局运行时配置:**
- `~/.remnote-bridge/config.json` — 全局配置文件（daemon 超时、默认参数、addon 启用状态）
- `~/.remnote-bridge/slots.json` — 4 组端口槽位定义（默认 29100/29110/29120/29130 段）
- `~/.remnote-bridge/registry.json` — instance → slot 映射
- `~/.remnote-bridge/instances/N.pid` — 槽位 PID 文件（JSON 格式）
- `~/.remnote-bridge/instances/N.log` — 槽位日志文件
- `~/.remnote-bridge/chrome-profile/` — Headless Chrome 用户数据目录
- `~/.remnote-bridge/addons/<name>/config.json` — addon 独立配置

**构建配置文件:**
- `tsconfig.json` — CLI + MCP 编译配置（target: es2022, module: NodeNext, outDir: ./dist, rootDir: ./src）
- `remnote-plugin/tsconfig.json` — Plugin 类型检查（target: esnext, module: esnext, noEmit: true，Webpack 负责实际编译）
- `remnote-plugin/webpack.config.js` — Plugin 构建配置（多入口：widgets/*.tsx，esbuild-loader 加速，支持 HMR）
- `remnote-plugin/tailwind.config.js` — TailwindCSS 配置（扫描 src/**/*.{vue,js,ts,jsx,tsx}）
- `remnote-plugin/postcss.config.js` — PostCSS 管道（postcss-import + tailwindcss + autoprefixer）
- `vitest.config.ts` — 根项目测试配置
- `remnote-plugin/vitest.config.ts` — Plugin 测试配置
- `remnote-rag/pyproject.toml` — Python 包构建和测试配置

**Plugin Manifest:**
- `remnote-plugin/public/manifest.json` — RemNote Plugin 清单（id: `unofficial_remnote_bridge`，权限: All/ReadCreateModifyDelete）

## Platform Requirements

**Development:**
- Node.js 22+（当前开发环境，无硬性版本要求文件）
- npm（非 yarn/pnpm）
- Chrome/Chromium（headless 模式需要，自动检测路径，支持 macOS/Windows/Linux）
- Python 3.9+（仅 remnote-rag 模块需要）

**Production:**
- npm 全局安装：`npm install -g remnote-bridge`
- 单包发布（包含 `dist/` + `remnote-plugin/dist/` + `skills/`）
- bin 入口：`remnote-bridge`（→ `./dist/cli/main.js`），同时注册 `unofficial-remnote-bridge` 别名
- 运行时通信：本地 WebSocket（127.0.0.1），不需要外网访问
- MCP Server 通过 stdio 传输运行，由 MCP 宿主（如 Claude Desktop）管理生命周期

**多实例支持:**
- 最多 4 个并发 daemon 实例（4 组端口槽位：29100/29110/29120/29130 段）
- `--instance <name>` 或 `REMNOTE_BRIDGE_INSTANCE` 环境变量指定实例
- `--headless` 或 `REMNOTE_HEADLESS=1` 启用 headless 模式（固定实例名 `headless`）

---

*Stack analysis: 2026-03-16*
