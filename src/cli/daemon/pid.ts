/**
 * PID 文件管理
 *
 * 写入、读取、stale 检测、清理。
 */

import fs from 'fs';

/**
 * 写入 PID 文件
 */
export function writePid(filePath: string, pid: number): void {
  fs.writeFileSync(filePath, String(pid), 'utf-8');
}

/**
 * 读取 PID 文件。文件不存在返回 null。
 */
export function readPid(filePath: string): number | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8').trim();
    const pid = parseInt(content, 10);
    return isNaN(pid) ? null : pid;
  } catch {
    return null;
  }
}

/**
 * 删除 PID 文件
 */
export function removePid(filePath: string): void {
  try {
    fs.unlinkSync(filePath);
  } catch {
    // 文件不存在也没关系
  }
}

/**
 * 检查进程是否存活
 */
export function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * 检查守护进程状态。返回：
 * - { running: true, pid } — 守护进程正在运行
 * - { running: false } — 守护进程未运行（无 PID 文件或 stale）
 *
 * 若 PID 文件存在但进程已死（stale），自动清理 PID 文件。
 */
export function checkDaemon(pidPath: string): { running: true; pid: number } | { running: false } {
  const pid = readPid(pidPath);
  if (pid === null) {
    return { running: false };
  }

  if (isProcessAlive(pid)) {
    return { running: true, pid };
  }

  // stale PID 文件，清理
  removePid(pidPath);
  return { running: false };
}
