/**
 * output.ts — CLI 输出工具函数
 *
 * 统一 JSON 输出格式，自动注入 timestamp 字段。
 */

/**
 * 输出 JSON 到 stdout，自动追加 ISO 8601 时间戳。
 *
 * 所有 CLI 命令的 --json 模式应通过此函数输出。
 */
export function jsonOutput(data: Record<string, unknown>): void {
  console.log(JSON.stringify({ ...data, timestamp: new Date().toISOString() }));
}
