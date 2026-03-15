/**
 * output.ts — CLI 输出工具函数
 *
 * 统一 JSON 输出格式，自动注入 timestamp 字段。
 */

import { DaemonNotRunningError, DaemonUnreachableError } from '../daemon/send-request.js';

/**
 * 输出 JSON 到 stdout，自动追加 ISO 8601 时间戳。
 *
 * 所有 CLI 命令的 --json 模式应通过此函数输出。
 */
export function jsonOutput(data: Record<string, unknown>): void {
  console.log(JSON.stringify({ ...data, timestamp: new Date().toISOString() }));
}

/**
 * 命令层统一错误处理。
 *
 * - DaemonNotRunningError / DaemonUnreachableError → exitCode 2
 * - 其他错误 → exitCode 1
 *
 * 返回 void，调用方在 catch 中直接 `handleCommandError(err, cmd, json); return;` 即可。
 */
export function handleCommandError(err: unknown, command: string, json?: boolean): void {
  if (err instanceof DaemonNotRunningError || err instanceof DaemonUnreachableError) {
    if (json) {
      jsonOutput({ ok: false, command, error: (err as Error).message });
    } else {
      console.error(`错误: ${(err as Error).message}`);
    }
    process.exitCode = 2;
    return;
  }
  const errorMsg = err instanceof Error ? err.message : String(err);
  if (json) {
    jsonOutput({ ok: false, command, error: errorMsg });
  } else {
    console.error(`错误: ${errorMsg}`);
  }
  process.exitCode = 1;
}
