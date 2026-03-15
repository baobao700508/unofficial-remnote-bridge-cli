/**
 * 守护进程主逻辑
 *
 * 作为 fork 子进程运行：
 * 1. 启动 WS Server
 * 2. 启动 Plugin 服务（静态文件服务器 或 webpack-dev-server）
 * 3. 写入 PID 文件
 * 4. 管理自动超时关闭
 * 5. 通过 IPC 向父进程发送 ready 信号
 *
 * 端口来源：env SLOT_WS_PORT / SLOT_DEV_PORT / SLOT_CONFIG_PORT
 * 实例标识：env REMNOTE_BRIDGE_INSTANCE
 * 日志/PID：~/.remnote-bridge/instances/N.*
 */

import path from 'path';
import fs from 'fs';
import { BridgeServer } from '../server/ws-server.js';
import { ConfigServer } from '../server/config-server.js';
import { DevServerManager } from './dev-server.js';
import { StaticServer } from './static-server.js';
import type { PluginServer } from './static-server.js';
import { HeadlessBrowserManager } from './headless-browser.js';
import { writePid, removePid } from './pid.js';
import { instancePidPath, instanceLogPath } from './registry.js';
import { loadConfig, ensureGlobalDir } from '../config.js';
import type { BridgeConfig } from '../config.js';
import type { DiagnoseResult, ReloadResult } from '../protocol.js';

let shutdownInProgress = false;

async function main() {
  // 从环境变量获取槽位信息
  const slotIndex = parseInt(process.env.SLOT_INDEX ?? '', 10);
  const wsPort = parseInt(process.env.SLOT_WS_PORT ?? '', 10);
  const devServerPort = parseInt(process.env.SLOT_DEV_PORT ?? '', 10);
  const configPort = parseInt(process.env.SLOT_CONFIG_PORT ?? '', 10);
  const instanceId = process.env.REMNOTE_BRIDGE_INSTANCE ?? 'default';

  if (isNaN(slotIndex) || isNaN(wsPort) || isNaN(devServerPort) || isNaN(configPort)) {
    console.error('守护进程缺少必要的环境变量 (SLOT_INDEX, SLOT_WS_PORT, SLOT_DEV_PORT, SLOT_CONFIG_PORT)');
    process.exit(1);
  }

  let config = loadConfig();
  ensureGlobalDir();

  const pidPath = instancePidPath(slotIndex);
  const logPath = instanceLogPath(slotIndex);

  // 日志写入文件（追加模式，保留前次会话日志）
  const logStream = fs.createWriteStream(logPath, { flags: 'a' });
  logStream.write(`\n${'='.repeat(60)}\n[${new Date().toISOString()}] 守护进程启动 (PID: ${process.pid}, instance: ${instanceId}, slot: ${slotIndex})\n${'='.repeat(60)}\n`);
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
      port: wsPort,
      host: '127.0.0.1',
      slotIndex,
      onLog: log,
      getTimeoutRemaining,
      defaults: cfg.defaults,
      // Headless Chrome 回调（闭包引用 headlessBrowser，调用时读取最新值）
      getHeadlessStatus: () => headlessBrowser?.getDiagnostics() ?? null,
      diagnoseHeadless: async (): Promise<DiagnoseResult | null> => {
        if (!headlessBrowser) return null;
        const diag = headlessBrowser.getDiagnostics();
        const screenshotPath = await headlessBrowser.takeScreenshot();
        return {
          headless: diag,
          screenshotPath,
          pluginConnected: false, // 由 ws-server 填充
          sdkReady: false,        // 由 ws-server 填充
        };
      },
      reloadHeadless: async (): Promise<ReloadResult> => {
        if (!headlessBrowser) return { ok: false, error: '非 headless 模式' };
        try {
          await headlessBrowser.manualReload();
          return { ok: true };
        } catch (err) {
          return { ok: false, error: err instanceof Error ? err.message : String(err) };
        }
      },
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

    config = loadConfig();
    timeoutMs = config.daemonTimeoutMinutes * 60 * 1000;

    server = createServer(config);
    await server.start();
    log(`新 WS Server 已启动 (端口 ${wsPort})`);

    resetTimeout();
    log('软重启完成');
  }

  // 启动 ConfigServer
  const configServer = new ConfigServer({
    port: configPort,
    host: '127.0.0.1',
    onRestart: reload,
    onLog: log,
  });

  // 启动 Plugin 服务（静态文件服务器 或 webpack-dev-server）
  // 从包安装路径计算 pluginDir（dist/cli/daemon/daemon.js → 包根/remnote-plugin）
  const packageRoot = path.resolve(import.meta.dirname, '..', '..', '..');
  const pluginDir = path.join(packageRoot, 'remnote-plugin');
  const devMode = process.env.REMNOTE_BRIDGE_DEV === '1';
  const headlessMode = process.env.REMNOTE_HEADLESS === '1';
  const headlessRemotePort = process.env.REMNOTE_HEADLESS_REMOTE_PORT
    ? parseInt(process.env.REMNOTE_HEADLESS_REMOTE_PORT, 10)
    : undefined;

  // Headless Chrome 管理器（在 createServer 之前声明，闭包可引用）
  let headlessBrowser: HeadlessBrowserManager | null = null;

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
        port: devServerPort,
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
        port: devServerPort,
        onLog: log,
      });

  async function shutdown() {
    if (shutdownInProgress) return;
    shutdownInProgress = true;

    log('开始优雅关闭...');
    clearTimeout(timeoutTimer);

    // 先关闭 headless Chrome
    if (headlessBrowser) {
      try {
        await headlessBrowser.stop();
        log('Headless Chrome 已关闭');
      } catch (err) {
        log(`Headless Chrome 关闭失败: ${err}`, 'error');
      }
      headlessBrowser = null;
    }

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
    log(`WS Server 已启动 (端口 ${wsPort})`);
  } catch (err) {
    log(`WS Server 启动失败: ${err}`, 'error');
    process.send?.({ type: 'error', message: `WS Server 启动失败: ${err}` });
    process.exit(1);
  }

  try {
    await configServer.start();
    log(`ConfigServer 已启动 (端口 ${configPort})`);
  } catch (err) {
    log(`ConfigServer 启动失败: ${err}`, 'warn');
    // ConfigServer 非关键，启动失败不阻塞
  }

  try {
    await pluginServer.start();
    log(`${pluginServerLabel} 已启动 (端口 ${devServerPort})`);
  } catch (err) {
    log(`${pluginServerLabel} 启动失败: ${err}`, 'error');
    await server.stop();
    process.send?.({ type: 'error', message: `${pluginServerLabel} 启动失败: ${err}` });
    process.exit(1);
  }

  // 取实际绑定的端口（可能与 env 传入的不同，若原端口被占用则 OS 自动分配）
  const actualWsPort = server.actualPort;
  const actualConfigPort = configServer.actualPort;
  // StaticServer 有 actualPort；DevServerManager 通过 spawn 无法获取，用 env 值
  const actualDevPort = 'actualPort' in pluginServer
    ? (pluginServer as StaticServer).actualPort
    : devServerPort;

  // Headless 模式：关键端口不允许回退（Plugin 无法发现新端口）
  if (headlessMode) {
    if (actualWsPort !== wsPort) {
      log(`Headless 模式下 WS 端口被占用（${wsPort} → ${actualWsPort}），终止启动`, 'error');
      await server.stop();
      await configServer.stop();
      await pluginServer.stop();
      process.send?.({
        type: 'error',
        message: `Headless 模式不支持端口回退：WS 端口 ${wsPort} 被占用。请释放端口或修改配置后重试`,
      });
      process.exit(1);
    }
    if (actualDevPort !== devServerPort) {
      log(`Headless 模式下 Plugin 服务端口被占用（${devServerPort} → ${actualDevPort}），终止启动`, 'error');
      await server.stop();
      await configServer.stop();
      await pluginServer.stop();
      process.send?.({
        type: 'error',
        message: `Headless 模式不支持端口回退：Plugin 服务端口 ${devServerPort} 被占用。请释放端口或修改配置后重试`,
      });
      process.exit(1);
    }
  }

  // 设置 discovery 数据（供 Plugin 通过 /api/discovery 自动发现端口）
  if (pluginServer instanceof StaticServer) {
    pluginServer.setDiscovery({
      wsPort: actualWsPort,
      configPort: actualConfigPort,
      instance: instanceId,
      slotIndex,
    });
    log(`Discovery 端点已就绪 (wsPort=${actualWsPort}, configPort=${actualConfigPort}, instance=${instanceId}, slotIndex=${slotIndex})`);
  }

  // 写入 PID 文件（JSON 格式，使用实际端口）
  writePid(pidPath, {
    pid: process.pid,
    slotIndex,
    instance: instanceId,
    wsPort: actualWsPort,
    devServerPort: actualDevPort,
    configPort: actualConfigPort,
  });
  log(`PID 文件已写入: ${pidPath} (PID: ${process.pid})`);

  // 启动 Headless Chrome（如果启用）
  if (headlessMode) {
    const remNoteUrl = 'https://www.remnote.com';
    headlessBrowser = new HeadlessBrowserManager({
      remNoteUrl,
      remoteDebuggingPort: headlessRemotePort,
      onLog: log,
    });
    try {
      await headlessBrowser.start();
      log(`Headless Chrome 已启动，加载 ${remNoteUrl}`);
    } catch (err) {
      // 非致命：daemon 继续运行，日志记录错误
      log(`Headless Chrome 启动失败（非致命）: ${err}`, 'error');
      headlessBrowser = null;
    }
  }

  // 启动超时计时器
  resetTimeout();

  // 通知父进程就绪（使用实际端口）
  process.send?.({
    type: 'ready',
    wsPort: actualWsPort,
    devServerPort: actualDevPort,
    configPort: actualConfigPort,
    pid: process.pid,
    headless: headlessMode,
    slotIndex,
    instance: instanceId,
  });

  // 断开 IPC 通道（让父进程可以退出）
  if (process.channel) {
    process.channel.unref();
  }

  // 自动安装已启用的 addon（非阻塞，不影响启动速度）
  import('../addon/addon-manager.js').then(({ AddonManager }) => {
    const addonManager = new AddonManager(config);
    return addonManager.ensureEnabledAddons(log);
  }).then((addonResults) => {
    for (const r of addonResults) {
      if (r.action === 'installed') {
        log(`[addon] ${r.name} 已自动安装`);
      } else if (r.action === 'failed') {
        log(`[addon] ${r.name} 自动安装失败: ${r.error}`, 'warn');
      }
    }
  }).catch((err) => {
    log(`[addon] 自动安装检查失败: ${err}`, 'warn');
  });
}

main().catch((err) => {
  console.error('守护进程启动失败:', err);
  process.exit(1);
});
