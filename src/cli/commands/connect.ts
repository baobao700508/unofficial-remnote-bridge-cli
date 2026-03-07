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
import { loadConfig, pidFilePath, findProjectRoot } from '../config.js';
import { checkDaemon } from '../daemon/pid.js';
import { jsonOutput } from '../utils/output.js';

export interface ConnectOptions {
  json?: boolean;
}

interface ReadyMessage {
  type: 'ready';
  wsPort: number;
  devServerPort: number;
  configPort: number;
  pid: number;
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

export async function connectCommand(options: ConnectOptions = {}): Promise<void> {
  const { json } = options;
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

  const child = fork(scriptPath, [], {
    detached: true,
    stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
    cwd: projectRoot,
    execArgv,
  });

  // 等待就绪信号，超时 10 秒
  const ready = await new Promise<DaemonMessage | null>((resolve) => {
    const timeout = setTimeout(() => {
      resolve(null);
    }, 10_000);

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
      jsonOutput({ ok: false, command: 'connect', error: '守护进程启动超时（10 秒）' });
    } else {
      console.error('守护进程启动超时（10 秒）');
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

  if (json) {
    jsonOutput({
      ok: true, command: 'connect', alreadyRunning: false,
      pid: ready.pid, wsPort: ready.wsPort, devServerPort: ready.devServerPort,
      configPort: ready.configPort,
      timeoutMinutes: config.daemonTimeoutMinutes,
    });
  } else {
    console.log(`守护进程已启动（PID: ${ready.pid}）`);
    console.log(`  WS Server:         ws://127.0.0.1:${ready.wsPort}`);
    console.log(`  webpack-dev-server: http://localhost:${ready.devServerPort}`);
    console.log(`  配置页面:          http://127.0.0.1:${ready.configPort}`);
    console.log(`  超时: ${config.daemonTimeoutMinutes} 分钟无 CLI 交互后自动关闭`);
  }
  process.exitCode = 0;
}
