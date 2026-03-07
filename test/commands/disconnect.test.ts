import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { disconnectCommand } from '../../src/cli/commands/disconnect.js';
import * as pid from '../../src/cli/daemon/pid.js';

vi.mock('../../src/cli/config', () => ({
  findProjectRoot: vi.fn(() => '/tmp/test-project'),
  pidFilePath: vi.fn(() => '/tmp/test-project/.remnote-bridge.pid'),
}));

vi.mock('../../src/cli/daemon/pid', () => ({
  checkDaemon: vi.fn(),
  removePid: vi.fn(),
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
    vi.mocked(pid.checkDaemon).mockReturnValue({ running: false });

    await disconnectCommand();

    expect(process.exitCode).toBe(0);
    expect(console.log).toHaveBeenCalledWith('守护进程未在运行');
  });

  it('守护进程运行中时发送 SIGTERM', async () => {
    // 启动一个实际的子进程用于测试
    const { fork } = await import('child_process');
    const child = fork(
      '-e',
      // 简单的子进程：收到 SIGTERM 后退出
      ['process.on("SIGTERM", () => process.exit(0)); setInterval(() => {}, 1000);'],
      { silent: true },
    );

    await new Promise<void>((resolve) => {
      child.on('spawn', resolve);
    });

    vi.mocked(pid.checkDaemon).mockReturnValue({ running: true, pid: child.pid! });

    await disconnectCommand();

    expect(process.exitCode).toBe(0);
    expect(console.log).toHaveBeenCalledWith('守护进程已停止');
    expect(pid.removePid).toHaveBeenCalled();
  });

  it('进程已退出时也能正常完成', async () => {
    // 使用一个不存在的 PID
    vi.mocked(pid.checkDaemon).mockReturnValue({ running: true, pid: 999999 });

    await disconnectCommand();

    expect(process.exitCode).toBe(0);
    expect(pid.removePid).toHaveBeenCalled();
  });
});
