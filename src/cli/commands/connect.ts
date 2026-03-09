/**
 * connect 命令
 *
 * 启动后台守护进程（WS Server + webpack-dev-server），等待 Plugin 连接。
 * - 已在运行 → 打印提示，退出码 0
 * - stale PID → 清理后正常启动
 * - 启动失败 → 退出码 1
 */

import path from 'path';
import fs from 'fs';
import { fork } from 'child_process';
import { loadConfig, pidFilePath, logFilePath, findProjectRoot } from '../config.js';
import { checkDaemon } from '../daemon/pid.js';
import { sendDaemonRequest } from '../daemon/send-request.js';
import { jsonOutput } from '../utils/output.js';
import { isSetupDone } from './setup.js';
import { defaultUserDataDir } from '../daemon/headless-browser.js';
import type { StatusResult } from '../protocol.js';

export interface ConnectOptions {
  json?: boolean;
  headless?: boolean;
  remoteDebuggingPort?: number;
}

interface ReadyMessage {
  type: 'ready';
  wsPort: number;
  devServerPort: number;
  configPort: number;
  pid: number;
  headless?: boolean;
  remoteDebuggingPort?: number;
}

interface ErrorMessage {
  type: 'error';
  message: string;
}

type DaemonMessage = ReadyMessage | ErrorMessage;

function isDaemonMessage(msg: unknown): msg is DaemonMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    typeof (msg as Record<string, unknown>).type === 'string'
  );
}

/** Plugin 连接等待超时（headless 需要加载 Chrome + RemNote，给 90 秒） */
const PLUGIN_WAIT_TIMEOUT_MS = 90_000;
/** 轮询间隔 */
const PLUGIN_POLL_INTERVAL_MS = 3_000;

/**
 * 等待 Plugin 通过 WebSocket 连接到 daemon。
 * 返回最终的 StatusResult，调用方根据 pluginConnected / sdkReady 判断是否成功。
 */
async function waitForPlugin(timeoutMs: number, onTick?: (elapsed: number) => void): Promise<StatusResult | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const status = await sendDaemonRequest('get_status', {}, { timeout: 5_000 }) as StatusResult;
      if (status.pluginConnected && status.sdkReady) {
        return status;
      }
    } catch {
      // daemon 可能还没完全就绪，继续等
    }
    const elapsed = Math.round((Date.now() - start) / 1000);
    onTick?.(elapsed);
    await new Promise((r) => setTimeout(r, PLUGIN_POLL_INTERVAL_MS));
  }
  // 超时，做最后一次查询返回当前状态
  try {
    return await sendDaemonRequest('get_status', {}, { timeout: 5_000 }) as StatusResult;
  } catch {
    return null;
  }
}

/**
 * 生成连接诊断信息，帮助 AI agent 定位问题。
 */
function buildDiagnostics(
  status: StatusResult | null,
  projectRoot: string,
): { summary: string; hints: string[]; logFile: string } {
  const logFile = logFilePath(projectRoot);
  const hints: string[] = [];

  if (!status) {
    return {
      summary: 'daemon 无响应',
      hints: ['守护进程可能已崩溃', `查看日志: cat ${logFile}`],
      logFile,
    };
  }

  if (!status.pluginConnected) {
    hints.push('Plugin 未连接到 daemon（Chrome 可能未加载或 RemNote 页面加载失败）');
    hints.push(`查看日志排查: cat ${logFile}`);
    hints.push('尝试: remnote-bridge disconnect && remnote-bridge connect --headless');
  }

  if (status.pluginConnected && !status.sdkReady) {
    hints.push('Plugin 已连接但 SDK 未就绪（RemNote 可能正在初始化）');
    hints.push('稍后重试: remnote-bridge health --json');
  }

  return {
    summary: status.pluginConnected
      ? (status.sdkReady ? '全部就绪' : 'SDK 未就绪')
      : 'Plugin 未连接',
    hints,
    logFile,
  };
}

export async function connectCommand(options: ConnectOptions = {}): Promise<void> {
  const { json, headless, remoteDebuggingPort } = options;
  const projectRoot = findProjectRoot();
  const config = loadConfig(projectRoot);
  const pidPath = pidFilePath(projectRoot);

  // 检查是否已在运行
  const status = checkDaemon(pidPath);
  if (status.running) {
    if (json) {
      jsonOutput({
        ok: true, command: 'connect', alreadyRunning: true,
        pid: status.pid, wsPort: config.wsPort, devServerPort: config.devServerPort,
      });
    } else {
      console.log(`守护进程已在运行（PID: ${status.pid}）`);
    }
    process.exitCode = 0;
    return;
  }

  // headless 模式：检查是否已完成 setup
  if (headless || remoteDebuggingPort) {
    const userDataDir = config.headless?.userDataDir || defaultUserDataDir();
    if (!isSetupDone(userDataDir)) {
      const msg = '尚未完成登录设置。请先运行: remnote-bridge setup';
      if (json) {
        jsonOutput({ ok: false, command: 'connect', error: msg });
      } else {
        console.error(msg);
      }
      process.exitCode = 1;
      return;
    }
  }

  // fork 守护进程
  const daemonScriptJs = path.resolve(import.meta.dirname, '..', 'daemon', 'daemon.js');
  const daemonScriptTs = path.resolve(import.meta.dirname, '..', 'daemon', 'daemon.ts');

  let scriptPath: string;
  let execArgv: string[] = [];

  // 判断是 ts 开发模式还是 js 构建后模式
  if (fs.existsSync(daemonScriptJs)) {
    scriptPath = daemonScriptJs;
  } else {
    scriptPath = daemonScriptTs;
    // 继承父进程的 tsx loader 参数（排除 --eval 相关项）
    execArgv = process.execArgv.filter(
      (arg) => !arg.startsWith('--eval') && !arg.includes('const '),
    );
  }

  if (!json) {
    console.log('正在启动守护进程...');
  }

  // 通过环境变量向 daemon 传递 headless 配置
  const env: Record<string, string> = { ...process.env as Record<string, string> };
  if (headless) {
    env['REMNOTE_HEADLESS'] = '1';
  }
  if (remoteDebuggingPort) {
    env['REMNOTE_HEADLESS'] = '1'; // 远程调试隐含 headless
    env['REMNOTE_HEADLESS_REMOTE_PORT'] = String(remoteDebuggingPort);
  }

  const child = fork(scriptPath, [], {
    detached: true,
    stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
    cwd: projectRoot,
    execArgv,
    env,
  });

  // 等待就绪信号，超时 60 秒
  // 首次启动可能需要安装 remnote-plugin 依赖（npm install），在 Windows 上可能需要较长时间
  const ready = await new Promise<DaemonMessage | null>((resolve) => {
    const timeout = setTimeout(() => {
      resolve(null);
    }, 60_000);

    child.on('message', (msg: unknown) => {
      if (isDaemonMessage(msg)) {
        clearTimeout(timeout);
        resolve(msg);
      }
    });

    child.on('error', (err) => {
      clearTimeout(timeout);
      resolve({ type: 'error', message: String(err) });
    });

    child.on('exit', (code) => {
      clearTimeout(timeout);
      if (code !== null && code !== 0) {
        resolve({ type: 'error', message: `守护进程异常退出（退出码 ${code}）` });
      }
    });
  });

  // 断开与子进程的连接（让 CLI 进程可以退出）
  child.unref();
  child.disconnect?.();

  if (!ready) {
    if (json) {
      jsonOutput({ ok: false, command: 'connect', error: '守护进程启动超时（60 秒）' });
    } else {
      console.error('守护进程启动超时（60 秒）');
    }
    process.exitCode = 1;
    return;
  }

  if (ready.type === 'error') {
    if (json) {
      jsonOutput({ ok: false, command: 'connect', error: ready.message });
    } else {
      console.error(`守护进程启动失败: ${ready.message}`);
    }
    process.exitCode = 1;
    return;
  }

  // headless 模式下，等待 Plugin 实际连接上
  const isHeadless = ready.headless || false;
  let pluginStatus: StatusResult | null = null;

  if (isHeadless) {
    if (!json) {
      console.log('守护进程已启动，正在等待 Plugin 连接...');
    }

    pluginStatus = await waitForPlugin(
      PLUGIN_WAIT_TIMEOUT_MS,
      !json ? (elapsed) => {
        process.stdout.write(`\r  等待 Plugin 连接中... ${elapsed}s`);
      } : undefined,
    );

    if (!json) {
      // 清除进度行
      process.stdout.write('\r' + ' '.repeat(50) + '\r');
    }
  }

  // 构建基础信息
  const baseInfo = {
    pid: ready.pid, wsPort: ready.wsPort, devServerPort: ready.devServerPort,
    configPort: ready.configPort,
    timeoutMinutes: config.daemonTimeoutMinutes,
    headless: isHeadless,
    remoteDebuggingPort: ready.remoteDebuggingPort,
  };

  // headless 且 Plugin 未连上 → 输出诊断信息，退出码 1
  if (isHeadless && (!pluginStatus || !pluginStatus.pluginConnected || !pluginStatus.sdkReady)) {
    const diag = buildDiagnostics(pluginStatus, projectRoot);

    if (json) {
      jsonOutput({
        ok: false, command: 'connect', alreadyRunning: false,
        ...baseInfo,
        error: `Plugin 连接超时（${PLUGIN_WAIT_TIMEOUT_MS / 1000} 秒）`,
        diagnostics: {
          daemonRunning: true,
          pluginConnected: pluginStatus?.pluginConnected ?? false,
          sdkReady: pluginStatus?.sdkReady ?? false,
          summary: diag.summary,
          hints: diag.hints,
          logFile: diag.logFile,
        },
      });
    } else {
      console.error(`\nPlugin 连接超时（${PLUGIN_WAIT_TIMEOUT_MS / 1000} 秒）`);
      console.error(`\n诊断信息:`);
      console.error(`  守护进程: ✅ 运行中（PID: ${ready.pid}）`);
      console.error(`  Plugin:   ${pluginStatus?.pluginConnected ? '✅ 已连接' : '❌ 未连接'}`);
      console.error(`  SDK:      ${pluginStatus?.sdkReady ? '✅ 就绪' : '❌ 未就绪'}`);
      console.error(`\n排查建议:`);
      for (const hint of diag.hints) {
        console.error(`  - ${hint}`);
      }
    }
    process.exitCode = 1;
    return;
  }

  // 成功
  if (json) {
    jsonOutput({
      ok: true, command: 'connect', alreadyRunning: false,
      ...baseInfo,
      pluginConnected: isHeadless ? true : undefined,
    });
  } else {
    console.log(`守护进程已启动（PID: ${ready.pid}）`);
    console.log(`  WS Server:         ws://127.0.0.1:${ready.wsPort}`);
    console.log(`  webpack-dev-server: http://localhost:${ready.devServerPort}`);
    console.log(`  配置页面:          http://127.0.0.1:${ready.configPort}`);
    console.log(`  超时: ${config.daemonTimeoutMinutes} 分钟无 CLI 交互后自动关闭`);
    if (isHeadless) {
      console.log(`  Headless Chrome:   已启动`);
      console.log(`  Plugin:            ✅ 已连接`);
      if (ready.remoteDebuggingPort) {
        console.log(`  远程调试:          http://0.0.0.0:${ready.remoteDebuggingPort}`);
        console.log(`  提示: 建议通过 SSH 隧道访问: ssh -L ${ready.remoteDebuggingPort}:127.0.0.1:${ready.remoteDebuggingPort} user@server`);
      }
    }
  }
  process.exitCode = 0;
}
