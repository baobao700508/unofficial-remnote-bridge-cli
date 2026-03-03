/**
 * 守护进程主逻辑
 *
 * 作为 fork 子进程运行：
 * 1. 启动 WS Server
 * 2. 启动 webpack-dev-server 子进程
 * 3. 写入 PID 文件
 * 4. 管理自动超时关闭
 * 5. 通过 IPC 向父进程发送 ready 信号
 */

import path from 'path';
import fs from 'fs';
import { BridgeServer } from '../server/ws-server';
import { DevServerManager } from './dev-server';
import { writePid, removePid } from './pid';
import { loadConfig, pidFilePath, logFilePath, findProjectRoot } from '../config';

let shutdownInProgress = false;

async function main() {
  const projectRoot = findProjectRoot();
  const config = loadConfig(projectRoot);
  const pidPath = pidFilePath(projectRoot);
  const logPath = logFilePath(projectRoot);

  // 日志写入文件（覆盖模式）
  const logStream = fs.createWriteStream(logPath, { flags: 'w' });
  function log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    logStream.write(line);
  }

  // 超时管理
  const timeoutMs = config.daemonTimeoutMinutes * 60 * 1000;
  let timeoutTimer: ReturnType<typeof setTimeout>;
  let lastResetTime = Date.now();

  function resetTimeout() {
    clearTimeout(timeoutTimer);
    lastResetTime = Date.now();
    timeoutTimer = setTimeout(() => {
      log('超时关闭（无 CLI 交互）');
      shutdown();
    }, timeoutMs);
  }

  function getTimeoutRemaining(): number {
    const elapsed = Date.now() - lastResetTime;
    return Math.max(0, Math.floor((timeoutMs - elapsed) / 1000));
  }

  // 启动 WS Server
  const server = new BridgeServer({
    port: config.wsPort,
    host: '127.0.0.1',
    onLog: log,
  });

  // CLI 请求刷新超时
  server.onCliRequest = () => {
    resetTimeout();
  };

  // 覆盖 getStatus 的 timeoutRemaining
  const originalGetStatus = server.getStatus.bind(server);
  server.getStatus = (timeoutRemaining: number) => {
    return originalGetStatus(getTimeoutRemaining());
  };

  // 启动 webpack-dev-server
  const pluginDir = path.join(projectRoot, 'remnote-plugin');
  const devServer = new DevServerManager({
    pluginDir,
    port: config.devServerPort,
    onLog: log,
    onExit: (code) => {
      if (!shutdownInProgress && code !== 0) {
        log('webpack-dev-server 异常退出，守护进程关闭', 'error');
        shutdown();
      }
    },
  });

  async function shutdown() {
    if (shutdownInProgress) return;
    shutdownInProgress = true;

    log('开始优雅关闭...');
    clearTimeout(timeoutTimer);

    try {
      await server.stop();
      log('WS Server 已关闭');
    } catch (err) {
      log(`WS Server 关闭失败: ${err}`, 'error');
    }

    try {
      await devServer.stop();
      log('webpack-dev-server 已关闭');
    } catch (err) {
      log(`webpack-dev-server 关闭失败: ${err}`, 'error');
    }

    removePid(pidPath);
    log('PID 文件已删除');

    logStream.end(() => {
      process.exit(0);
    });
  }

  // 信号处理
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  try {
    await server.start();
    log(`WS Server 已启动 (端口 ${config.wsPort})`);
  } catch (err) {
    log(`WS Server 启动失败: ${err}`, 'error');
    process.send?.({ type: 'error', message: `WS Server 启动失败: ${err}` });
    process.exit(1);
  }

  try {
    devServer.start();
    log(`webpack-dev-server 启动中 (端口 ${config.devServerPort})`);
  } catch (err) {
    log(`webpack-dev-server 启动失败: ${err}`, 'error');
    await server.stop();
    process.send?.({ type: 'error', message: `webpack-dev-server 启动失败: ${err}` });
    process.exit(1);
  }

  // 写入 PID 文件
  writePid(pidPath, process.pid);
  log(`PID 文件已写入: ${pidPath} (PID: ${process.pid})`);

  // 启动超时计时器
  resetTimeout();

  // 通知父进程就绪
  process.send?.({
    type: 'ready',
    wsPort: config.wsPort,
    devServerPort: config.devServerPort,
    pid: process.pid,
  });

  // 断开 IPC 通道（让父进程可以退出）
  if (process.channel) {
    process.channel.unref();
  }
}

main().catch((err) => {
  console.error('守护进程启动失败:', err);
  process.exit(1);
});
