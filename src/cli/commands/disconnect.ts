/**
 * disconnect 命令
 *
 * 停止守护进程，释放端口和资源。
 * - 守护进程运行中 → 发送 SIGTERM，等待退出
 * - 守护进程未运行 → 打印提示，退出码 0
 */

import {
  resolveInstanceId,
  loadRegistry,
  cleanStaleSlots,
  findSlotByInstance,
  releaseSlot,
  instancePidPath,
} from '../daemon/registry.js';
import { removePid } from '../daemon/pid.js';
import { cleanupOrphanChrome } from '../daemon/headless-browser.js';
import { jsonOutput } from '../utils/output.js';

const WAIT_TIMEOUT_MS = 10_000;
const POLL_INTERVAL_MS = 200;

export interface DisconnectOptions {
  json?: boolean;
  instance?: string;
}

export async function disconnectCommand(options: DisconnectOptions = {}): Promise<void> {
  const { json } = options;
  const instanceId = resolveInstanceId(options.instance);

  const registry = loadRegistry();
  cleanStaleSlots(registry);

  const entry = findSlotByInstance(registry, instanceId);
  if (!entry) {
    if (json) {
      jsonOutput({ ok: true, command: 'disconnect', wasRunning: false, instance: instanceId });
    } else {
      console.log(`守护进程未在运行（实例: ${instanceId}）`);
    }
    process.exitCode = 0;
    return;
  }

  const pid = entry.pid;
  const pidPath = instancePidPath(entry.index);

  if (!json) {
    console.log(`正在停止守护进程（PID: ${pid}，实例: ${instanceId}）...`);
  }

  // 发送 SIGTERM
  try {
    process.kill(pid, 'SIGTERM');
  } catch {
    // 进程可能已经退出
    removePid(pidPath);
    releaseSlot(registry, instanceId);
    if (json) {
      jsonOutput({ ok: true, command: 'disconnect', wasRunning: true, instance: instanceId, pid, forced: false });
    } else {
      console.log('守护进程已停止');
    }
    process.exitCode = 0;
    return;
  }

  // 等待进程退出
  const exited = await waitForExit(pid, WAIT_TIMEOUT_MS);

  if (exited) {
    removePid(pidPath);
    releaseSlot(registry, instanceId);
    cleanupOrphanChrome(json ? undefined : (msg) => console.log(msg));
    if (json) {
      jsonOutput({ ok: true, command: 'disconnect', wasRunning: true, instance: instanceId, pid, forced: false });
    } else {
      console.log('守护进程已停止');
    }
    process.exitCode = 0;
  } else {
    try {
      process.kill(pid, 'SIGKILL');
    } catch {
      // 可能已退出
    }
    removePid(pidPath);
    releaseSlot(registry, instanceId);
    cleanupOrphanChrome(json ? undefined : (msg) => console.log(msg));
    if (json) {
      jsonOutput({ ok: true, command: 'disconnect', wasRunning: true, instance: instanceId, pid, forced: true });
    } else {
      console.error(`守护进程未在 ${WAIT_TIMEOUT_MS / 1000} 秒内退出，尝试强制终止...`);
      console.log('守护进程已强制终止');
    }
    process.exitCode = 0;
  }
}

function waitForExit(pid: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const start = Date.now();

    const check = () => {
      try {
        process.kill(pid, 0);
        if (Date.now() - start >= timeoutMs) {
          resolve(false);
        } else {
          setTimeout(check, POLL_INTERVAL_MS);
        }
      } catch {
        resolve(true);
      }
    };

    check();
  });
}
