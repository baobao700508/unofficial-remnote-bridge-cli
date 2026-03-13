import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { connectCommand } from '../../src/cli/commands/connect.js';
import * as registry from '../../src/cli/daemon/registry.js';

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

vi.mock('../../src/cli/daemon/headless-browser', () => ({
  getSetupDonePath: vi.fn(() => '/tmp/test-global/chrome-profile/.setup-done'),
  cleanupOrphanChrome: vi.fn(),
}));

vi.mock('../../src/cli/utils/output', () => ({
  jsonOutput: vi.fn((data: unknown) => console.log(JSON.stringify(data))),
}));

describe('connect 命令', () => {
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

  it('守护进程已在运行时退出码 0', async () => {
    vi.mocked(registry.findSlotByInstance).mockReturnValue({
      index: 0,
      instance: 'default',
      pid: 12345,
      wsPort: 29100,
      devServerPort: 29101,
      configPort: 29102,
      startedAt: new Date().toISOString(),
    });

    await connectCommand();

    expect(process.exitCode).toBe(0);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('已在运行'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('12345'));
  });

  it('槽位满载时退出码 1', async () => {
    vi.mocked(registry.findSlotByInstance).mockReturnValue(null);
    vi.mocked(registry.allocateSlot).mockReturnValue(null);

    await connectCommand();

    expect(process.exitCode).toBe(1);
    expect(console.error).toHaveBeenCalled();
  });
});
