import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { disconnectCommand } from '../../src/cli/commands/disconnect.js';
import * as registry from '../../src/cli/daemon/registry.js';
import * as pid from '../../src/cli/daemon/pid.js';

vi.mock('../../src/cli/daemon/registry', () => ({
  resolveInstanceId: vi.fn(() => 'default'),
  loadRegistry: vi.fn(() => ({ version: 1, slots: [null, null, null, null] })),
  saveRegistry: vi.fn(),
  cleanStaleSlots: vi.fn(),
  findSlotByInstance: vi.fn(),
  releaseSlot: vi.fn(),
  instancePidPath: vi.fn((i: number) => `/tmp/test-global/instances/${i}.pid`),
}));

vi.mock('../../src/cli/daemon/pid', () => ({
  removePid: vi.fn(),
}));

vi.mock('../../src/cli/daemon/headless-browser', () => ({
  cleanupOrphanChrome: vi.fn(),
}));

vi.mock('../../src/cli/utils/output', () => ({
  jsonOutput: vi.fn((data: unknown) => console.log(JSON.stringify(data))),
}));

describe('disconnect 命令', () => {
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

  it('守护进程未运行时退出码 0', async () => {
    vi.mocked(registry.findSlotByInstance).mockReturnValue(null);

    await disconnectCommand();

    expect(process.exitCode).toBe(0);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('未在运行'));
  });

  it('守护进程运行中时发送 SIGTERM', async () => {
    // 启动一个实际的子进程用于测试
    const { fork } = await import('child_process');
    const child = fork(
      '-e',
      ['process.on("SIGTERM", () => process.exit(0)); setInterval(() => {}, 1000);'],
      { silent: true },
    );

    await new Promise<void>((resolve) => {
      child.on('spawn', resolve);
    });

    vi.mocked(registry.findSlotByInstance).mockReturnValue({
      index: 0,
      instance: 'default',
      pid: child.pid!,
      wsPort: 29100,
      devServerPort: 29101,
      configPort: 29102,
      startedAt: new Date().toISOString(),
    });

    await disconnectCommand();

    expect(process.exitCode).toBe(0);
    expect(console.log).toHaveBeenCalledWith('守护进程已停止');
    expect(pid.removePid).toHaveBeenCalled();
    expect(registry.releaseSlot).toHaveBeenCalled();
  });

  it('进程已退出时也能正常完成', async () => {
    vi.mocked(registry.findSlotByInstance).mockReturnValue({
      index: 1,
      instance: 'default',
      pid: 999999,
      wsPort: 29110,
      devServerPort: 29111,
      configPort: 29112,
      startedAt: new Date().toISOString(),
    });

    await disconnectCommand();

    expect(process.exitCode).toBe(0);
    expect(pid.removePid).toHaveBeenCalled();
    expect(registry.releaseSlot).toHaveBeenCalled();
  });
});
