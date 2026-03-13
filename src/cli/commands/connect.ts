/**
 * connect 命令
 *
 * 启动后台守护进程（WS Server + Plugin 服务），等待 Plugin 连接。
 * - 已在运行 → 打印提示，退出码 0
 * - stale PID → 清理后正常启动
 * - 启动失败 → 退出码 1
 * - 槽位满载 → 报错，退出码 1
 *
 * 默认使用静态文件服务器 serve 预构建 plugin。
 * --dev 模式使用 webpack-dev-server（支持 HMR）。
 */

import path from 'path';
import fs from 'fs';
import { fork } from 'child_process';
import { loadConfig, ensureGlobalDir } from '../config.js';
import {
  resolveInstanceId,
  loadRegistry,
  saveRegistry,
  cleanStaleSlots,
  findSlotByInstance,
  allocateSlot,
  releaseSlot,
  formatSlotsFullError,
} from '../daemon/registry.js';
import { getSetupDonePath, cleanupOrphanChrome } from '../daemon/headless-browser.js';
import { jsonOutput } from '../utils/output.js';

export interface ConnectOptions {
  json?: boolean;
  dev?: boolean;
  remoteDebuggingPort?: number;
  instance?: string;
}

interface ReadyMessage {
  type: 'ready';
  wsPort: number;
  devServerPort: number;
  configPort: number;
  pid: number;
  headless?: boolean;
  slotIndex?: number;
  instance?: string;
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
  const instanceId = resolveInstanceId(options.instance);
  const config = loadConfig();

  ensureGlobalDir();

  // headless 从全局参数 / 环境变量读取（preAction 已同步到 env）
  const headless = process.env.REMNOTE_HEADLESS === '1';

  // headless 前置检查
  if (headless) {
    cleanupOrphanChrome(json ? undefined : (msg) => console.log(msg));

    const setupDonePath = getSetupDonePath();
    if (!fs.existsSync(setupDonePath)) {
      const error = '尚未完成 setup。请先执行 `remnote-bridge setup` 登录 RemNote，然后再使用 --headless';
      if (json) {
        jsonOutput({ ok: false, command: 'connect', error });
      } else {
        console.error(error);
      }
      process.exitCode = 1;
      return;
    }
  }

  // 加载注册表并清理 stale 槽位
  const registry = loadRegistry();
  cleanStaleSlots(registry);

  // 检查当前 instance 是否已在运行
  const existing = findSlotByInstance(registry, instanceId);
  if (existing) {
    if (json) {
      jsonOutput({
        ok: true, command: 'connect', alreadyRunning: true,
        instance: instanceId,
        pid: existing.pid, wsPort: existing.wsPort, devServerPort: existing.devServerPort,
        configPort: existing.configPort, slotIndex: existing.index,
      });
    } else {
      console.log(`守护进程已在运行（PID: ${existing.pid}，实例: ${instanceId}，槽位: ${existing.index}）`);
    }
    process.exitCode = 0;
    return;
  }

  // 分配空闲槽位（先用 pid=0 占位，daemon ready 后更新）
  const slot = allocateSlot(registry, instanceId, 0);
  if (!slot) {
    const error = formatSlotsFullError(registry);
    if (json) {
      jsonOutput({ ok: false, command: 'connect', error: '已达最大实例数上限（4），无可用槽位' });
    } else {
      console.error(error);
    }
    process.exitCode = 1;
    return;
  }

  // fork 守护进程
  const daemonScriptJs = path.resolve(import.meta.dirname, '..', 'daemon', 'daemon.js');
  const daemonScriptTs = path.resolve(import.meta.dirname, '..', 'daemon', 'daemon.ts');

  let scriptPath: string;
  let execArgv: string[] = [];

  if (fs.existsSync(daemonScriptJs)) {
    scriptPath = daemonScriptJs;
  } else {
    scriptPath = daemonScriptTs;
    execArgv = process.execArgv.filter(
      (arg) => !arg.startsWith('--eval') && !arg.includes('const '),
    );
  }

  // 保存预分配端口（用于后续比较是否发生回退）
  const originalWsPort = slot.wsPort;
  const originalDevPort = slot.devServerPort;

  if (!json) {
    console.log(`正在启动守护进程（实例: ${instanceId}，槽位: ${slot.index}）...`);
  }

  const child = fork(scriptPath, [], {
    detached: true,
    stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
    execArgv,
    env: {
      ...process.env,
      REMNOTE_BRIDGE_DEV: options.dev ? '1' : '0',
      ...(headless ? { REMNOTE_HEADLESS: '1' } : {}),
      ...(options.remoteDebuggingPort ? { REMNOTE_HEADLESS_REMOTE_PORT: String(options.remoteDebuggingPort) } : {}),
      SLOT_INDEX: String(slot.index),
      SLOT_WS_PORT: String(slot.wsPort),
      SLOT_DEV_PORT: String(slot.devServerPort),
      SLOT_CONFIG_PORT: String(slot.configPort),
      REMNOTE_BRIDGE_INSTANCE: instanceId,
    },
  });

  // 等待就绪信号，超时 60 秒
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

  if (!ready || ready.type === 'error') {
    // 启动失败，释放槽位
    releaseSlot(registry, instanceId);

    const errorMsg = !ready
      ? '守护进程启动超时（60 秒）'
      : ready.message;
    if (json) {
      jsonOutput({ ok: false, command: 'connect', error: errorMsg });
    } else {
      console.error(`守护进程启动失败: ${errorMsg}`);
    }
    process.exitCode = 1;
    return;
  }

  // 更新注册表中的 PID 和实际端口（可能与预分配不同，若原端口被占用则 OS 自动分配）
  slot.pid = ready.pid;
  slot.wsPort = ready.wsPort;
  slot.devServerPort = ready.devServerPort;
  slot.configPort = ready.configPort;
  saveRegistry(registry);

  const portChanged = ready.wsPort !== originalWsPort || ready.devServerPort !== originalDevPort;

  if (json) {
    jsonOutput({
      ok: true, command: 'connect', alreadyRunning: false,
      instance: instanceId,
      pid: ready.pid, wsPort: ready.wsPort, devServerPort: ready.devServerPort,
      configPort: ready.configPort, slotIndex: slot.index,
      timeoutMinutes: config.daemonTimeoutMinutes,
      headless: ready.headless ?? false,
      portChanged,
    });
  } else {
    console.log(`守护进程已启动（PID: ${ready.pid}，实例: ${instanceId}）`);
    console.log(`  WS Server:         ws://127.0.0.1:${ready.wsPort}`);
    console.log(`  Plugin 服务:       http://localhost:${ready.devServerPort}`);
    console.log(`  配置页面:          http://127.0.0.1:${ready.configPort}`);
    if (ready.headless) {
      console.log(`  Headless Chrome:   已启动（自动加载 Plugin）`);
    }
    console.log(`  超时: ${config.daemonTimeoutMinutes} 分钟无 CLI 交互后自动关闭`);

    // 端口变更提示（标准模式）
    if (ready.wsPort !== originalWsPort) {
      console.log('');
      console.log(`⚠ WS 端口被占用，已回退到 ${ready.wsPort}（Plugin 将自动发现新端口）`);
    }
    if (ready.devServerPort !== originalDevPort) {
      console.log('');
      console.log(`⚠ Plugin 服务端口被占用，已回退到 ${ready.devServerPort}`);
      console.log('  请在 RemNote 中更新 Native Plugin URL 为:');
      console.log(`    http://localhost:${ready.devServerPort}`);
    }
  }
  process.exitCode = 0;
}
