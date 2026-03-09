/**
 * 守护进程主逻辑
 *
 * 作为 fork 子进程运行：
 * 1. 启动 WS Server
 * 2. 启动 Plugin 服务（静态文件服务器 或 webpack-dev-server）
 * 3. 写入 PID 文件
 * 4. 管理自动超时关闭
 * 5. 通过 IPC 向父进程发送 ready 信号
 */

import path from 'path';
import fs from 'fs';
import { BridgeServer } from '../server/ws-server.js';
import { ConfigServer } from '../server/config-server.js';
import { DevServerManager } from './dev-server.js';
import { StaticServer } from './static-server.js';
import type { PluginServer } from './static-server.js';
import { writePid, removePid } from './pid.js';
import { loadConfig, pidFilePath, logFilePath, findProjectRoot } from '../config.js';
import type { BridgeConfig } from '../config.js';

let shutdownInProgress = false;

async function main() {
  const projectRoot = findProjectRoot();
  let config = loadConfig(projectRoot);
  const pidPath = pidFilePath(projectRoot);
  const logPath = logFilePath(projectRoot);

  // 日志写入文件（追加模式，保留前次会话日志）
  const logStream = fs.createWriteStream(logPath, { flags: 'a' });
  logStream.write(`\n${'='.repeat(60)}\n[${new Date().toISOString()}] 守护进程启动 (PID: ${process.pid})\n${'='.repeat(60)}\n`);
  function log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    logStream.write(line);
  }

  // 超时管理
  let timeoutMs = config.daemonTimeoutMinutes * 60 * 1000;
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

  // 创建 WS Server（抽取为函数，供软重启复用）
  function createServer(cfg: BridgeConfig): BridgeServer {
    const srv = new BridgeServer({
      port: cfg.wsPort,
      host: '127.0.0.1',
      onLog: log,
      getTimeoutRemaining,
      defaults: cfg.defaults,
    });
    srv.onCliRequest = () => resetTimeout();
    return srv;
  }

  let server = createServer(config);

  // 软重启：关闭旧 WS Server → 重新读配置 → 创建新 WS Server → 启动
  async function reload() {
    log('开始软重启...');
    try {
      await server.stop();
      log('旧 WS Server 已关闭');
    } catch (err) {
      log(`旧 WS Server 关闭失败: ${err}`, 'error');
    }

    config = loadConfig(projectRoot);
    timeoutMs = config.daemonTimeoutMinutes * 60 * 1000;

    server = createServer(config);
    await server.start();
    log(`新 WS Server 已启动 (端口 ${config.wsPort})`);

    resetTimeout();
    log('软重启完成');
  }

  // 启动 ConfigServer
  const configServer = new ConfigServer({
    port: config.configPort,
    host: '127.0.0.1',
    projectRoot,
    onRestart: reload,
    onLog: log,
  });

  // 启动 Plugin 服务（静态文件服务器 或 webpack-dev-server）
  // 从包安装路径计算 pluginDir（dist/cli/daemon/daemon.js → 包根/remnote-plugin）
  const packageRoot = path.resolve(import.meta.dirname, '..', '..', '..');
  const pluginDir = path.join(packageRoot, 'remnote-plugin');
  const devMode = process.env.REMNOTE_BRIDGE_DEV === '1';
  const distDir = path.join(pluginDir, 'dist');
  const distExists = fs.existsSync(path.join(distDir, 'index.html'));

  if (!devMode && !distExists) {
    const msg = 'Plugin dist/ 未找到。请使用 --dev 模式，或确认 remnote-bridge 包完整性。';
    log(msg, 'error');
    process.send?.({ type: 'error', message: msg });
    process.exit(1);
  }

  const pluginServerLabel = devMode ? 'webpack-dev-server' : '静态文件服务器';
  const pluginServer: PluginServer = devMode
    ? new DevServerManager({
        pluginDir,
        port: config.devServerPort,
        onLog: log,
        onExit: (code) => {
          if (!shutdownInProgress && code !== 0) {
            log('webpack-dev-server 异常退出，守护进程关闭', 'error');
            shutdown();
          }
        },
      })
    : new StaticServer({
        distDir,
        port: config.devServerPort,
        onLog: log,
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
      await configServer.stop();
      log('ConfigServer 已关闭');
    } catch (err) {
      log(`ConfigServer 关闭失败: ${err}`, 'error');
    }

    try {
      await pluginServer.stop();
      log(`${pluginServerLabel} 已关闭`);
    } catch (err) {
      log(`${pluginServerLabel} 关闭失败: ${err}`, 'error');
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
    await configServer.start();
    log(`ConfigServer 已启动 (端口 ${config.configPort})`);
  } catch (err) {
    log(`ConfigServer 启动失败: ${err}`, 'warn');
    // ConfigServer 非关键，启动失败不阻塞
  }

  try {
    await pluginServer.start();
    log(`${pluginServerLabel} 已启动 (端口 ${config.devServerPort})`);
  } catch (err) {
    log(`${pluginServerLabel} 启动失败: ${err}`, 'error');
    await server.stop();
    process.send?.({ type: 'error', message: `${pluginServerLabel} 启动失败: ${err}` });
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
    configPort: config.configPort,
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
