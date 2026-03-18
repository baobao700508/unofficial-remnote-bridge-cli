# Coding Conventions

**Analysis Date:** 2026-03-16

## Naming Patterns

**文件命名:**
- 所有源文件使用 **kebab-case**：`read-handler.ts`、`ws-server.ts`、`tree-edit-handler.ts`
- 测试文件同样 kebab-case 加 `.test.ts` 后缀：`connect.test.ts`、`pid.test.ts`
- 配置文件保留原名：`config.ts`、`protocol.ts`
- 桥接层 services 文件与 CLI action **同态命名**（红线约束）：
  - CLI action `read_rem` → Plugin service 文件 `read-rem.ts` → 导出函数 `readRem()`
  - CLI action `read_tree` → Plugin service 文件 `read-tree.ts` → 导出函数 `readTree()`

**函数命名:**
- 使用 **camelCase**：`readTreeCommand()`、`handleEditRem()`、`sendDaemonRequest()`
- 命令函数后缀 `Command`：`connectCommand()`、`healthCommand()`、`readTreeCommand()`
- Handler 方法前缀 `handle`：`handleReadRem()`、`handleEditTree()`、`handleCliRequest()`
- 类型守卫前缀 `is`：`isHelloMessage()`、`isPongMessage()`、`isBridgeRequest()`
- MCP 工具注册函数前缀 `register`：`registerReadTools()`、`registerEditTools()`

**变量命名:**
- 使用 **camelCase**：`remId`、`wsPort`、`pluginSocket`、`cachedOutline`
- 常量使用 **UPPER_SNAKE_CASE**：`WS_CLOSE_PONG_TIMEOUT`、`PLUGIN_REQUEST_TIMEOUT_MS`、`DEFAULT_CONFIG`
- 只读字段集合使用 `UPPER_SNAKE_CASE + Set`：`RF_FIELDS`、`READ_ONLY_FIELDS`、`WRITABLE_FIELDS`

**类型/接口命名:**
- 使用 **PascalCase**：`BridgeRequest`、`RemObject`、`TreeEditPayload`
- Options 接口以 `Options` 结尾：`ReadTreeOptions`、`ConnectOptions`、`HealthOptions`
- Result 接口以 `Result` 结尾：`EditRemResult`、`TreeEditResult`、`StatusResult`
- 枚举值类型以 `Value` 结尾：`RemTypeValue`、`PropertyTypeValue`

**类命名:**
- 使用 **PascalCase**，Handler 类以 `Handler` 结尾：`ReadHandler`、`EditHandler`、`TreeEditHandler`
- Server 类以 `Server` 结尾：`BridgeServer`
- 缓存类：`RemCache`
- 错误类以 `Error` 结尾：`DaemonNotRunningError`、`DaemonUnreachableError`、`CliError`

## Code Style

**模块系统:**
- 项目使用 **ESM**（`"type": "module"` in `package.json`）
- `tsconfig.json` 配置 `"module": "NodeNext"`、`"moduleResolution": "NodeNext"`
- 所有 import 路径必须带 `.js` 后缀：`import { sendDaemonRequest } from '../daemon/send-request.js';`
- 无 path alias，所有导入使用相对路径

**TypeScript 严格模式:**
- `strict: true`、`strictNullChecks: true`
- 目标：`es2022`，库：`["es2022"]`

**格式化:**
- 无 Prettier / ESLint 配置文件——项目不使用自动格式化工具
- 实际代码风格：2 空格缩进，单引号字符串，无分号（部分文件），语句末尾分号
- JSDoc 注释使用 `/** */` 格式

**注释风格:**
- 文件头部使用 `/** */` 多行注释，说明文件职责和设计意图
- 使用 `// ── 分节标题 ──` 格式的行内分隔符划分代码区域
- 使用 `// ══════` 格式（双横线）划分 RemObject 接口中的大区域
- 中文注释为主，英文仅用于技术术语和代码标识符
- JSDoc 使用 `@throws`、`@param` 标注

## Import Organization

**顺序（观察到的实际模式）:**
1. Node.js 内置模块：`import fs from 'fs';`、`import path from 'path';`
2. 第三方包：`import WebSocket from 'ws';`、`import { z } from 'zod';`
3. 本项目同层模块（相对路径）：`import { loadConfig } from '../config.js';`
4. 本项目跨层模块（不允许反向依赖，见层约束）

**导入方式:**
- 优先具名导入：`import { sendDaemonRequest } from '...'`
- Type-only 导入使用 `import type`：`import type { BridgeResponse } from '../protocol.js';`
- 避免默认导入，除 Node 内置模块外：`import fs from 'fs';`
- `createRequire` 用于读取 JSON：`const require = createRequire(import.meta.url); const { version } = require('../../package.json');`

**无 Barrel 文件（CLI 层）:**
- `src/cli/` 无 `index.ts`，每个文件直接导入需要的模块
- `src/mcp/index.ts` 存在但仅作为入口导出 `startMcpServer()`

**Plugin 层有 Barrel 文件:**
- `remnote-plugin/src/services/index.ts`：仅包含文件头注释，不实际 re-export
- `remnote-plugin/src/utils/index.ts`：存在

## Error Handling

**错误类层级:**
- `DaemonNotRunningError extends Error`（`src/cli/daemon/send-request.ts`）
- `DaemonUnreachableError extends Error`（`src/cli/daemon/send-request.ts`）
- `CliError extends Error`（`src/mcp/daemon-client.ts`）

**命令层错误处理模式（统一）:**
```typescript
// src/cli/utils/output.ts 提供统一错误处理
export function handleCommandError(err: unknown, command: string, json?: boolean): void {
  if (err instanceof DaemonNotRunningError || err instanceof DaemonUnreachableError) {
    // exitCode 2
  } else {
    // exitCode 1
  }
}

// 命令函数中的标准模式：
try {
  result = await sendDaemonRequest('action', payload);
} catch (err) {
  handleCommandError(err, 'command-name', json);
  return;
}
```

**退出码约定:**
- `0`：成功
- `1`：业务错误（参数错误、SDK 返回错误等）
- `2`：守护进程不可达（未运行或连接失败）

**Handler 层错误处理:**
- Handler 中直接 `throw new Error(...)` 抛出业务错误
- WS Server 在 `handleCliRequest` 中 catch 并序列化为 `BridgeResponse.error`

**MCP 层错误处理:**
- `callCli()` 在 `ok === false` 时自动抛出 `CliError`
- MCP 工具的 `execute` 函数不需要手动检查 `ok` 字段

## CLI Command Structure

**命令函数签名约定:**
```typescript
export interface XxxOptions {
  json?: boolean;
  // 其他选项...
}
export async function xxxCommand(options: XxxOptions = {}): Promise<void> { ... }
```

**`--json` 双模式机制（红线）:**
- `--json` 同时改变输入和输出
- JSON 模式输入：位置参数为 JSON 字符串，所有参数打包在 JSON 对象中
- JSON 模式输出：仅 stdout 一行合法 JSON，`{ ok, command, ...fields, timestamp }`
- 人类模式输入：位置参数 + `--flag` 选项
- 人类模式输出：可读文本到 stdout/stderr

**JSON 输出通过 `jsonOutput()` 统一处理（`src/cli/utils/output.ts`）:**
```typescript
export function jsonOutput(data: Record<string, unknown>): void {
  console.log(JSON.stringify({ ...data, timestamp: new Date().toISOString() }));
}
```

**JSON 输入解析通过 `parseJsonInput()`（`src/cli/main.ts`）:**
- 验证 JSON 合法性
- 验证必需字段（如 `remId`）
- 失败时设置 `process.exitCode = 1` 并输出 JSON 错误

## MCP Tool Structure

**工具注册模式（`src/mcp/tools/*.ts`）:**
```typescript
export function registerXxxTools(server: FastMCP): void {
  server.addTool({
    name: 'tool_name',
    description: '...',        // 详细的多行工具文档
    parameters: z.object({...}), // Zod schema
    execute: async (args) => {
      const payload: Record<string, unknown> = { ... };
      const response = await callCli('command-name', payload);
      return formatDataJson(response);   // 或 formatFrontmatter(meta, body)
    },
  });
}
```

**MCP 返回值两种模式（红线）:**
- **模式 A — Frontmatter + Body**：`formatFrontmatter(meta, body)` — read 类工具返回 Markdown 大纲
- **模式 B — Data JSON**：`formatDataJson(response)` — action/infra 工具返回操作报告

**工具名使用 snake_case：** `read_tree`、`edit_rem`、`read_context`

## Handler Design Pattern

**Handler 类通过构造注入解耦:**
```typescript
export class ReadHandler {
  constructor(
    private cache: RemCache,
    private forwardToPlugin: (action: string, payload: Record<string, unknown>) => Promise<unknown>,
    private onLog?: (message: string, level: 'info' | 'warn' | 'error') => void,
  ) {}
}
```

- Handler 不直接依赖 WS Server 或 daemon 模块
- 通过 `forwardToPlugin` 回调与 Plugin 通信
- 通过 `onLog` 回调输出日志

**防线模式（edit 命令的标准守卫）:**
1. 防线 1：缓存存在性检查（必须先 read）
2. 防线 2：乐观并发检测（当前数据 vs 缓存数据 JSON 比较）
3. edit-tree 额外防线 3：str_replace 精确匹配（恰好匹配 1 次）

## Plugin Layer Conventions

**Services 函数签名:**
```typescript
export async function readRem(
  plugin: ReactRNPlugin,
  payload: { remId: string; includePowerup?: boolean },
): Promise<RemObject> { ... }
```
- 第一个参数始终是 `plugin: ReactRNPlugin`（SDK 入口）
- 第二个参数是 payload 对象（与 WS 协议 payload 对应）
- 返回 Promise

**Widget 生命周期:**
- 使用 `declareIndexPlugin(onActivate, onDeactivate)` 注册
- `onActivate`：注册 Widget、创建 ConnectionManager、设置 MessageRouter
- `onDeactivate`：停止 ConnectionManager

**RichText 确定性序列化:**
- RichText 元素内部按 key 字母序排列（`src/remnote-plugin/src/services/read-rem.ts` 中的 `sortRichTextKeys()`）
- 确保防线 2（JSON 比较）的一致性

## Configuration Pattern

**配置加载（`src/cli/config.ts`）:**
- 全局配置目录：`~/.remnote-bridge/`
- 配置文件：`~/.remnote-bridge/config.json`
- 加载策略：文件存在 → 解析并合并默认值；不存在或损坏 → 使用全部默认值
- 原子写入：写临时文件 → `fs.renameSync`

**依赖注入模式:**
- `DefaultsConfig` 通过构造函数注入到 Handler 和 BridgeServer
- 回调函数（`getTimeoutRemaining`、`getHeadlessStatus`）通过配置对象注入

## Layer Dependency Rules

**跨层依赖方向（红线，`scripts/check-layer-deps.cjs` 自动检查）:**
```
接入层 (src/mcp) → 命令层 (src/cli) → 桥接层 (remnote-plugin) → RemNote SDK
```
- MCP 层通过子进程调用 CLI（非 import）：`src/mcp/daemon-client.ts`
- 禁止反向依赖

**CLI 内部分层（强约束）:**
- `handlers/` 禁止依赖 `server/`、`commands/`、`daemon/`
- `commands/` 禁止依赖 `server/`、`handlers/`
- `commands/` 通过 `daemon/send-request.ts` 与 daemon 通信

**Plugin 内部分层（红线）:**
- 核心链：`bridge/` → `services/` → `utils/`（单向）
- `utils/` 禁止调用 SDK，禁止依赖其他层
- `services/` 禁止依赖 `bridge/` 和 `widgets/`

**检查命令:** `npm run lint:deps` 或 `node scripts/check-layer-deps.cjs`

## Logging Pattern

**CLI 层:**
- 人类模式：`console.log()` / `console.error()` / `console.warn()`
- JSON 模式：`jsonOutput()` 单行 JSON 到 stdout
- 中文错误消息（面向用户）：`'错误: 缺少 remId'`

**BridgeServer:**
- 通过 `onLog` 回调函数：`(message: string, level: 'info' | 'warn' | 'error') => void`
- 消息格式：中文为主，夹杂英文技术术语

**Plugin 层:**
- 通过 `plugin.storage.setSession()` 存储日志供 Widget 显示
- 日志缓冲区防止并发竞态（`logBuffer` + `queueMicrotask`）

## Async Patterns

**Promise.all 并行获取:**
```typescript
// read-rem.ts 中 51 个 SDK 调用并行执行
const [isDocument, fontSize, ...] = await Promise.all([
  rem.isDocument(),
  rem.getFontSize(),
  ...
]);
```

**手动 Promise 构造:**
```typescript
// send-request.ts、ws-server.ts 中大量使用
return new Promise((resolve, reject) => {
  const ws = new WebSocket(url);
  ws.on('open', () => { ... });
  ws.on('error', (err) => { reject(...) });
});
```

**无 async/await 滥用：** 同步代码不使用 async 包装

---

*Convention analysis: 2026-03-16*
