import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import WebSocket, { WebSocketServer } from 'ws';
import { healthCommand } from '../../src/cli/commands/health.js';
import * as config from '../../src/cli/config.js';
import * as pid from '../../src/cli/daemon/pid.js';

// Mock config 和 pid 模块
vi.mock('../../src/cli/config', () => ({
  findProjectRoot: vi.fn(() => '/tmp/test-project'),
  loadConfig: vi.fn(() => ({
    wsPort: 0, // 动态端口，测试中会覆盖
    devServerPort: 8080,
    daemonTimeoutMinutes: 30,
  })),
  pidFilePath: vi.fn(() => '/tmp/test-project/.remnote-bridge.pid'),
  logFilePath: vi.fn(() => '/tmp/test-project/.remnote-bridge.log'),
}));

vi.mock('../../src/cli/daemon/pid', () => ({
  checkDaemon: vi.fn(),
}));

describe('health 命令', () => {
  let wss: WebSocketServer | null = null;
  let originalExitCode: number | undefined;

  beforeEach(() => {
    originalExitCode = process.exitCode;
    process.exitCode = undefined;
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    process.exitCode = originalExitCode;
    vi.restoreAllMocks();
    if (wss) {
      await new Promise<void>((resolve) => {
        wss!.close(() => resolve());
      });
      wss = null;
    }
  });

  it('守护进程未运行时退出码 2', async () => {
    vi.mocked(pid.checkDaemon).mockReturnValue({ running: false });

    await healthCommand();

    expect(process.exitCode).toBe(2);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('未运行'));
  });

  it('守护进程运行且全部健康时退出码 0', async () => {
    // 启动一个真实的 WS Server 模拟守护进程
    wss = new WebSocketServer({ port: 0 });
    const port = (wss.address() as { port: number }).port;

    wss.on('connection', (ws) => {
      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.action === 'get_status') {
          ws.send(JSON.stringify({
            id: msg.id,
            result: {
              pluginConnected: true,
              sdkReady: true,
              uptime: 120,
              timeoutRemaining: 1680,
            },
          }));
        }
      });
    });

    vi.mocked(pid.checkDaemon).mockReturnValue({ running: true, pid: 12345 });
    vi.mocked(config.loadConfig).mockReturnValue({
      wsPort: port,
      devServerPort: 8080,
      daemonTimeoutMinutes: 30,
    });

    await healthCommand();

    expect(process.exitCode).toBe(0);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('✅ 守护进程'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('✅ Plugin'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('✅ SDK'));
  });

  it('Plugin 未连接时退出码 1', async () => {
    wss = new WebSocketServer({ port: 0 });
    const port = (wss.address() as { port: number }).port;

    wss.on('connection', (ws) => {
      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.action === 'get_status') {
          ws.send(JSON.stringify({
            id: msg.id,
            result: {
              pluginConnected: false,
              sdkReady: false,
              uptime: 60,
              timeoutRemaining: 1740,
            },
          }));
        }
      });
    });

    vi.mocked(pid.checkDaemon).mockReturnValue({ running: true, pid: 12345 });
    vi.mocked(config.loadConfig).mockReturnValue({
      wsPort: port,
      devServerPort: 8080,
      daemonTimeoutMinutes: 30,
    });

    await healthCommand();

    expect(process.exitCode).toBe(1);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('✅ 守护进程'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('❌ Plugin'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('❌ SDK'));
  });

  it('WS 连接失败时退出码 2', async () => {
    // 使用一个不存在的端口
    vi.mocked(pid.checkDaemon).mockReturnValue({ running: true, pid: 12345 });
    vi.mocked(config.loadConfig).mockReturnValue({
      wsPort: 59999, // 极不可能被占用
      devServerPort: 8080,
      daemonTimeoutMinutes: 30,
    });

    await healthCommand();

    expect(process.exitCode).toBe(2);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('不可达'));
  });
});
