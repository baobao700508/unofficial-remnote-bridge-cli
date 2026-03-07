/**
 * MCP Server 共享类型定义
 */

/** remnote-cli --json 模式的标准响应结构 */
export interface CliResponse {
  ok: boolean;
  command: string;
  error?: string;
  data?: unknown;
  timestamp?: string;
  [key: string]: unknown;
}
