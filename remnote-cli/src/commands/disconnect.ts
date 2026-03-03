/**
 * disconnect 命令
 *
 * 停止守护进程，释放端口和资源。
 * - 守护进程运行中 → 发送 SIGTERM，等待退出
 * - 守护进程未运行 → 打印提示，退出码 0
 */

import { pidFilePath, findProjectRoot } from '../config';
import { checkDaemon, removePid } from '../daemon/pid';

const WAIT_TIMEOUT_MS = 10_000;
const POLL_INTERVAL_MS = 200;

export async function disconnectCommand(): Promise<void> {
  const projectRoot = findProjectRoot();
  const pidPath = pidFilePath(projectRoot);

  const status = checkDaemon(pidPath);
  if (!status.running) {
    console.log('守护进程未在运行');
    process.exitCode = 0;
    return;
  }

  const pid = status.pid;
  console.log(`正在停止守护进程（PID: ${pid}）...`);

  // 发送 SIGTERM
  try {
    process.kill(pid, 'SIGTERM');
  } catch (err) {
    // 进程可能已经退出
    console.log('守护进程已停止');
    removePid(pidPath);
    process.exitCode = 0;
    return;
  }

  // 等待进程退出
  const exited = await waitForExit(pid, WAIT_TIMEOUT_MS);

  if (exited) {
    console.log('守护进程已停止');
    // 确保 PID 文件被清理（正常情况下守护进程自己会清理）
    removePid(pidPath);
    process.exitCode = 0;
  } else {
    console.error(`守护进程未在 ${WAIT_TIMEOUT_MS / 1000} 秒内退出，尝试强制终止...`);
    try {
      process.kill(pid, 'SIGKILL');
    } catch {
      // 可能已退出
    }
    removePid(pidPath);
    console.log('守护进程已强制终止');
    process.exitCode = 0;
  }
}

function waitForExit(pid: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const start = Date.now();

    const check = () => {
      try {
        // kill(pid, 0) 不发信号，只检查进程是否存在
        process.kill(pid, 0);
        // 进程仍在运行
        if (Date.now() - start >= timeoutMs) {
          resolve(false);
        } else {
          setTimeout(check, POLL_INTERVAL_MS);
        }
      } catch {
        // 进程已退出
        resolve(true);
      }
    };

    check();
  });
}
