# Testing Patterns

**Analysis Date:** 2026-03-16

## Test Framework

**Runner:**
- Vitest 1.3+ (v1.6.1 实际安装)
- 配置文件：`vitest.config.ts`

**Assertion Library:**
- Vitest 内置（`expect`），兼容 Jest API

**Mocking:**
- Vitest 内置 `vi`：`vi.mock()`、`vi.fn()`、`vi.spyOn()`、`vi.mocked()`

**Run Commands:**
```bash
npm test                    # 运行所有测试（vitest run）
npx vitest run              # 等价，单次运行
npx vitest                  # 观察模式
npx vitest run --coverage   # 生成覆盖率报告
npx vitest run --reporter verbose  # 详细输出
```

## Vitest Configuration

**`vitest.config.ts`:**
```typescript
export default defineConfig({
  test: {
    globals: true,          // describe/it/expect 全局可用
    environment: 'node',    // Node.js 环境
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      exclude: ['node_modules', 'dist', 'test', '**/*.config.ts'],
    },
  },
});
```

**全局 Setup 文件 `test/setup.ts`:**
```typescript
import { beforeEach, afterEach, vi } from 'vitest';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});
```
- 全局静默 `console.error`，避免测试输出噪音
- 每个测试后恢复所有 mock

## Test File Organization

**位置：独立 test 目录（非 co-located）**

```
test/
├── setup.ts                         # 全局 setup
├── config.test.ts                   # 配置加载测试
├── commands/
│   ├── connect.test.ts              # connect 命令测试
│   ├── disconnect.test.ts           # disconnect 命令测试
│   └── health.test.ts               # health 命令测试
├── daemon/
│   └── pid.test.ts                  # PID 文件管理测试
└── server/
    └── ws-server.test.ts            # WebSocket Server 集成测试

remnote-plugin/test/
├── setup.ts                         # Plugin 测试 setup（同样静默 console.error）
├── helpers/
│   └── mock-websocket.ts            # MockWebSocket 自定义 Helper
└── bridge/
    └── websocket-client.test.ts     # WebSocket Client 测试

remnote-plugin/src/test-scripts/     # 非自动化测试，Plugin 内手动测试脚本
├── AGENTS.md                        # 测试脚本文档
├── test-actions.ts                  # SDK 操作测试
├── test-powerup-rendering.ts        # Powerup 渲染行为测试
├── test-rem-type-mapping.ts         # Rem 类型映射测试
├── test-richtext-builder.ts         # RichText 构造测试
├── test-richtext-matrix.ts          # RichText 矩阵测试
├── test-richtext-remaining.ts       # RichText 剩余场景测试
└── test-rw-fields.ts                # 读写字段测试
```

**命名:**
- 测试文件：`{module-name}.test.ts`
- 测试目录结构镜像源代码目录：`test/commands/` 对应 `src/cli/commands/`
- Plugin 测试脚本（手动）：`test-{功能名}.ts`

## Test Structure

**Suite 组织:**
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('模块名或功能', () => {
  let originalExitCode: number | undefined;

  beforeEach(() => {
    originalExitCode = process.exitCode;
    process.exitCode = undefined;
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.exitCode = originalExitCode;
    vi.restoreAllMocks();
  });

  it('中文描述测试场景', async () => {
    // arrange
    vi.mocked(dependency.method).mockReturnValue(value);
    // act
    await xxxCommand(options);
    // assert
    expect(process.exitCode).toBe(0);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('预期文本'));
  });
});
```

**关键模式:**
- 测试用例描述使用**中文**（与项目语言规范一致）
- `process.exitCode` 需要在 beforeEach/afterEach 中备份和恢复
- console 方法全部 mock 静默（防止测试输出噪音）

## Mocking

**模块级 Mock（`vi.mock()`）:**
```typescript
// 完整 mock 一个模块——提供所有导出函数的模拟实现
vi.mock('../../src/cli/config', () => ({
  GLOBAL_DIR: '/tmp/test-global',
  ensureGlobalDir: vi.fn(),
  loadConfig: vi.fn(() => ({
    wsPort: 29100,
    devServerPort: 29101,
    configPort: 29102,
    daemonTimeoutMinutes: 30,
    defaults: {},
  })),
}));

// Mock registry 模块
vi.mock('../../src/cli/daemon/registry', () => ({
  resolveInstanceId: vi.fn(() => 'default'),
  loadRegistry: vi.fn(() => ({ version: 1, slots: [null, null, null, null] })),
  saveRegistry: vi.fn(),
  cleanStaleSlots: vi.fn(),
  findSlotByInstance: vi.fn(),
  allocateSlot: vi.fn(),
  releaseSlot: vi.fn(),
  formatSlotsFullError: vi.fn(() => '错误: 已达最大实例数上限'),
}));

// Mock output 工具
vi.mock('../../src/cli/utils/output', () => ({
  jsonOutput: vi.fn((data: unknown) => console.log(JSON.stringify(data))),
}));
```

**函数级 Mock 控制:**
```typescript
// 在测试中动态改变 mock 返回值
vi.mocked(registry.findSlotByInstance).mockReturnValue({
  index: 0,
  instance: 'default',
  pid: 12345,
  wsPort: 29100,
  devServerPort: 29101,
  configPort: 29102,
  startedAt: new Date().toISOString(),
});

// 异步 mock
mockSendDaemonRequest.mockResolvedValue({
  pluginConnected: true,
  sdkReady: true,
  uptime: 120,
  timeoutRemaining: 1680,
});

// mock 抛出错误
mockSendDaemonRequest.mockRejectedValue(new Error('连接超时'));
```

**工厂函数 Mock 模式（解决 hoisting 问题）:**
```typescript
// 顶层创建可控 mock
const mockSendDaemonRequest = vi.fn();

// vi.mock 内部引用顶层变量
vi.mock('../../src/cli/daemon/send-request', () => ({
  sendDaemonRequest: (...args: unknown[]) => mockSendDaemonRequest(...args),
  DaemonNotRunningError: class extends Error { ... },
  DaemonUnreachableError: class extends Error { ... },
}));
```

**什么需要 Mock:**
- 外部依赖模块（`config`、`registry`、`send-request`、`output`）
- `console.log` / `console.error`（静默输出）
- `process.exitCode`（需手动备份/恢复）
- 浏览器 WebSocket API（Plugin 测试中使用 `MockWebSocket`）

**什么不需要 Mock:**
- 被测试模块自身的逻辑
- 纯函数（如 `parseConfig`、`isPositiveNumber`）
- 文件系统操作（使用临时目录代替 mock）

## Fixtures and Factories

**临时目录模式（文件系统测试）:**
```typescript
let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'remnote-config-test-'));
  fs.mkdirSync(path.join(tmpDir, 'instances'), { recursive: true });
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
```

**样本数据对象:**
```typescript
const samplePidInfo: PidInfo = {
  pid: 12345,
  slotIndex: 0,
  instance: 'test-instance',
  wsPort: 29100,
  devServerPort: 29101,
  configPort: 29102,
};
```

**自定义测试 Helper（Plugin 层）:**
- `test/helpers/mock-websocket.ts`：完整的浏览器 WebSocket Mock 实现
  - `MockWebSocket` 类：模拟 `readyState`、`send()`、`close()`、事件回调
  - 测试控制方法：`simulateOpen()`、`simulateMessage()`、`simulateClose()`、`simulateError()`
  - 实例追踪：`getMockWebSocketInstances()`、`getLastMockWebSocket()`
  - 全局安装/卸载：`installMockWebSocket()`、`uninstallMockWebSocket()`

## Coverage

**Requirements:** 无强制覆盖率阈值

**Coverage 配置:**
```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json'],
  exclude: ['node_modules', 'dist', 'test', '**/*.config.ts'],
},
```

**查看 Coverage:**
```bash
npx vitest run --coverage
```

## Test Types

**Unit Tests:**
- 配置加载：`test/config.test.ts` — 测试 `loadConfig()`、`saveConfig()`、`configFilePath()`
- PID 管理：`test/daemon/pid.test.ts` — 测试文件读写、进程存活检测
- 命令行为：`test/commands/*.test.ts` — Mock 所有依赖，验证退出码和输出

**Integration Tests:**
- WS Server：`test/server/ws-server.test.ts` — 启动真实 WS Server，使用真实 WebSocket Client
  - 测试 hello 握手、get_status 查询、Plugin 断开恢复、ping/pong 心跳
  - 使用固定测试端口 `TEST_PORT = 13002`

**Plugin Integration Tests（浏览器 mock）:**
- WebSocket Client：`remnote-plugin/test/bridge/websocket-client.test.ts`
  - 使用自定义 `MockWebSocket` 模拟浏览器 WebSocket
  - 使用 `vi.useFakeTimers()` 控制时间（重连延迟、超时）

**手动实机测试脚本（Plugin 层，不参与 CI）:**
- `remnote-plugin/src/test-scripts/` 下 7 个测试脚本
- 需在 RemNote 环境中运行，验证 SDK 行为
- 涵盖：SDK 操作、Powerup 渲染、Rem 类型映射、RichText 构造
- AGENTS.md 中明确要求 SDK 相关改动必须实机测试

**E2E Tests:**
- 无独立 E2E 测试框架
- 实机测试通过 Chrome MCP + RemNote 插件完成（手动/半自动）

## Current Test Status

**测试结果（2026-03-16 运行）:**
- 本项目测试：**全部通过**（6 个文件，约 30 个测试）
- reference_repository 测试：部分失败（路径引用过期，不影响本项目）
- remnote-plugin 测试：5/7 通过，2 个异步重连测试失败（已知 flaky）

**测试覆盖分布:**

| 层 | 已有测试 | 覆盖范围 |
|:--|:--|:--|
| CLI commands | `connect`、`disconnect`、`health` | 退出码、输出内容、分支路径 |
| CLI config | `loadConfig`、`saveConfig`、`configFilePath` | 默认值、合并、损坏文件处理 |
| CLI daemon | `pid` 文件管理 | 读写、删除、进程存活检测 |
| CLI server | `BridgeServer` | hello 握手、状态查询、请求分发、心跳 |
| Plugin bridge | `WebSocketClient` | 连接、ping/pong、请求处理 |

## Test Coverage Gaps

**未覆盖的关键模块:**

| 模块 | 文件路径 | 风险 |
|:--|:--|:--|
| ReadHandler | `src/cli/handlers/read-handler.ts` | 缓存写入、字段过滤逻辑 |
| EditHandler | `src/cli/handlers/edit-handler.ts` | 防线检查、字段白名单、枚举校验 |
| TreeReadHandler | `src/cli/handlers/tree-read-handler.ts` | 大纲缓存策略 |
| TreeEditHandler | `src/cli/handlers/tree-edit-handler.ts` | str_replace 防线、diff 执行、Portal 创建 |
| TreeParser | `src/cli/handlers/tree-parser.ts` | 大纲解析、diff 算法 |
| GlobeReadHandler | `src/cli/handlers/globe-read-handler.ts` | 全局概览逻辑 |
| ContextReadHandler | `src/cli/handlers/context-read-handler.ts` | 焦点/页面模式 |
| RemCache | `src/cli/handlers/rem-cache.ts` | LRU 淘汰策略 |
| daemon/daemon.ts | `src/cli/daemon/daemon.ts` | 守护进程启动、超时、PID 管理 |
| daemon/registry.ts | `src/cli/daemon/registry.ts` | 槽位分配、stale 清理 |
| MCP tools | `src/mcp/tools/*.ts` | 工具注册、参数转换、返回值格式化 |
| MCP daemon-client | `src/mcp/daemon-client.ts` | 子进程调用、超时处理 |
| Plugin services | `remnote-plugin/src/services/*.ts` | SDK 调用链（需实机测试） |
| Plugin utils | `remnote-plugin/src/utils/*.ts` | 大纲序列化、省略算法 |

**优先级建议:**
- **High**：`TreeEditHandler` + `TreeParser`（edit-tree 是最复杂的命令，diff 算法和操作执行容易出错）
- **High**：`EditHandler`（防线逻辑是数据安全保障）
- **Medium**：`RemCache`（LRU 淘汰逻辑，缓存一致性）
- **Medium**：`daemon/registry.ts`（多实例槽位管理）
- **Low**：MCP tools（薄包装层，逻辑简单）

## Common Test Patterns

**Async 测试:**
```typescript
it('异步操作', async () => {
  vi.mocked(registry.findSlotByInstance).mockReturnValue(null);
  await disconnectCommand();
  expect(process.exitCode).toBe(0);
});
```

**Fake Timer 控制（Plugin 测试）:**
```typescript
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

it('定时器相关测试', () => {
  vi.advanceTimersByTime(2000);      // 同步推进
  await vi.advanceTimersByTimeAsync(0);  // 异步推进
});
```

**WS Server 集成测试辅助函数:**
```typescript
function createClient(port = TEST_PORT): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}`);
    ws.on('open', () => resolve(ws));
    ws.on('error', reject);
  });
}

function sendAndReceive(ws: WebSocket, data: unknown): Promise<unknown> {
  return new Promise((resolve) => {
    ws.once('message', (raw) => {
      resolve(JSON.parse(raw.toString()));
    });
    ws.send(JSON.stringify(data));
  });
}
```

**错误测试:**
```typescript
it('Rem 不存在时返回错误', async () => {
  mockSendDaemonRequest.mockRejectedValue(new Error('Rem not found'));
  await readRemCommand('invalid-id', { json: true });
  expect(process.exitCode).toBe(1);
});
```

## Linting

**依赖方向检查（替代 ESLint）:**
```bash
npm run lint:deps          # node scripts/check-layer-deps.cjs
```
- 检查跨层依赖方向（禁止反向）
- 检查 Plugin 内部分层（bridge → services → utils）
- 检查 CLI 内部分层（handlers 不依赖 server/commands/daemon）

**无 ESLint / Prettier / Biome 配置。** 项目不使用自动代码风格检查工具。

---

*Testing analysis: 2026-03-16*
