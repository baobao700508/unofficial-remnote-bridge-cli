import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import WebSocket, { WebSocketServer } from 'ws';
import { healthCommand } from '../../src/cli/commands/health.js';
import * as registry from '../../src/cli/daemon/registry.js';

vi.mock('../../src/cli/daemon/registry', () => ({
  resolveInstanceId: vi.fn(() => 'default'),
  loadRegistry: vi.fn(() => ({ version: 1, slots: [null, null, null, null] })),
  cleanStaleSlots: vi.fn(),
  findSlotByInstance: vi.fn(),
}));

// Mock send-request：用工厂函数控制返回值
const mockSendDaemonRequest = vi.fn();

vi.mock('../../src/cli/daemon/send-request', () => ({
  sendDaemonRequest: (...args: unknown[]) => mockSendDaemonRequest(...args),
  DaemonNotRunningError: class extends Error { constructor() { super('守护进程未运行'); } },
  DaemonUnreachableError: class extends Error { constructor() { super('守护进程不可达'); } },
}));

vi.mock('../../src/cli/utils/output', () => ({
  jsonOutput: vi.fn((data: unknown) => console.log(JSON.stringify(data))),
}));

describe('health 命令', () => {
  let originalExitCode: number | undefined;

  beforeEach(() => {
    originalExitCode = process.exitCode;
    process.exitCode = undefined;
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSendDaemonRequest.mockReset();
  });

  afterEach(() => {
    process.exitCode = originalExitCode;
    vi.restoreAllMocks();
  });

  it('守护进程未运行时退出码 2', async () => {
    vi.mocked(registry.findSlotByInstance).mockReturnValue(null);

    await healthCommand();

    expect(process.exitCode).toBe(2);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('未运行'));
  });

  it('守护进程运行且全部健康时退出码 0', async () => {
    vi.mocked(registry.findSlotByInstance).mockReturnValue({
      index: 0,
      instance: 'default',
      pid: 12345,
      wsPort: 29100,
      devServerPort: 29101,
      configPort: 29102,
      startedAt: new Date().toISOString(),
    });

    mockSendDaemonRequest.mockResolvedValue({
      pluginConnected: true,
      sdkReady: true,
      uptime: 120,
      timeoutRemaining: 1680,
    });

    await healthCommand();

    expect(process.exitCode).toBe(0);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('✅ 守护进程'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('✅ Plugin'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('✅ SDK'));
  });

  it('Plugin 未连接时退出码 1', async () => {
    vi.mocked(registry.findSlotByInstance).mockReturnValue({
      index: 0,
      instance: 'default',
      pid: 12345,
      wsPort: 29100,
      devServerPort: 29101,
      configPort: 29102,
      startedAt: new Date().toISOString(),
    });

    mockSendDaemonRequest.mockResolvedValue({
      pluginConnected: false,
      sdkReady: false,
      uptime: 60,
      timeoutRemaining: 1740,
    });

    await healthCommand();

    expect(process.exitCode).toBe(1);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('✅ 守护进程'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('❌ Plugin'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('❌ SDK'));
  });

  it('WS 连接失败时退出码 2', async () => {
    vi.mocked(registry.findSlotByInstance).mockReturnValue({
      index: 0,
      instance: 'default',
      pid: 12345,
      wsPort: 59999,
      devServerPort: 29101,
      configPort: 29102,
      startedAt: new Date().toISOString(),
    });

    mockSendDaemonRequest.mockRejectedValue(new Error('连接超时'));

    await healthCommand();

    expect(process.exitCode).toBe(2);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('不可达'));
  });
});
