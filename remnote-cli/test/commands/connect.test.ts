import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { connectCommand } from '../../src/commands/connect';
import * as pid from '../../src/daemon/pid';

vi.mock('../../src/config', () => ({
  findProjectRoot: vi.fn(() => '/tmp/test-project'),
  loadConfig: vi.fn(() => ({
    wsPort: 3002,
    devServerPort: 8080,
    daemonTimeoutMinutes: 30,
  })),
  pidFilePath: vi.fn(() => '/tmp/test-project/.remnote-bridge.pid'),
}));

vi.mock('../../src/daemon/pid', () => ({
  checkDaemon: vi.fn(),
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
    vi.mocked(pid.checkDaemon).mockReturnValue({ running: true, pid: 12345 });

    await connectCommand();

    expect(process.exitCode).toBe(0);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('已在运行'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('12345'));
  });
});
