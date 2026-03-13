/**
 * PID 文件管理
 *
 * PID 文件为 JSON 格式，包含 pid、slotIndex、instance 和端口信息。
 * 路径：~/.remnote-bridge/instances/N.pid
 */

import fs from 'fs';
import { execFileSync } from 'child_process';

export interface PidInfo {
  pid: number;
  slotIndex: number;
  instance: string;
  wsPort: number;
  devServerPort: number;
  configPort: number;
}

/**
 * 写入 PID 文件（JSON 格式）
 */
export function writePid(filePath: string, info: PidInfo): void {
  fs.writeFileSync(filePath, JSON.stringify(info, null, 2) + '\n', 'utf-8');
}

/**
 * 读取 PID 文件。文件不存在或格式错误返回 null。
 */
export function readPidInfo(filePath: string): PidInfo | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    if (typeof parsed.pid === 'number' && typeof parsed.slotIndex === 'number') {
      return parsed;
    }
    return null;
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
 * 检查进程是否是我们的 daemon。
 *
 * 仅 kill -0 无法防止 PID recycling：OS 可能把同一 PID 分配给无关进程，
 * 导致 cleanStaleSlots 误判槽位为"存活"而不清理。
 * 此函数额外校验进程命令行是否包含 daemon 关键字。
 */
export function isDaemonAlive(pid: number): boolean {
  // PID 0 是 allocateSlot 的占位值，不是有效的 daemon PID
  // process.kill(0, 0) 发信号给进程组，会误返回 true
  if (pid <= 0) return false;
  if (!isProcessAlive(pid)) return false;

  try {
    const cmd = execFileSync('ps', ['-p', String(pid), '-o', 'command='], {
      encoding: 'utf-8',
      timeout: 3000,
    }).trim();
    // daemon.ts 编译后路径包含 "daemon/daemon"（dist/cli/daemon/daemon.js）
    // 使用更精确的匹配避免误匹配 dockerd 等含 "daemon" 的无关进程
    return cmd.includes('daemon/daemon') || cmd.includes('daemon.js');
  } catch {
    // ps 失败时回退到基本检查（kill -0 已通过）
    return true;
  }
}
