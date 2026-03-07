/**
 * daemon-client.ts
 *
 * 封装对 remnote-cli 的子进程调用（--json 模式）。
 * MCP Server 通过此模块与 CLI 守护进程通信。
 *
 * 调用约定（来自 remnote-cli/src/index.ts）：
 *   --json 是全局选项，位于命令名之前。
 *   无 payload：unofficial-remnote-bridge --json <command>
 *   有 payload：unofficial-remnote-bridge --json <command> '<JSON>'
 */

import { execFile } from 'node:child_process';
import type { CliResponse } from './types.js';

// ---------------------------------------------------------------------------
// 配置
// ---------------------------------------------------------------------------

/** CLI 可执行文件名（对应 package.json bin 字段） */
const CLI_BIN = 'remnote-bridge';

/** 子进程默认超时（毫秒） */
const DEFAULT_TIMEOUT_MS = 30_000;

// ---------------------------------------------------------------------------
// 错误类
// ---------------------------------------------------------------------------

export class CliError extends Error {
  /** CLI 返回的 command 字段 */
  readonly command: string;
  /** CLI 返回的完整响应（如果成功解析了 JSON） */
  readonly response?: CliResponse;

  constructor(message: string, command: string, response?: CliResponse) {
    super(message);
    this.name = 'CliError';
    this.command = command;
    this.response = response;
  }
}

// ---------------------------------------------------------------------------
// 核心函数
// ---------------------------------------------------------------------------

/**
 * 通过子进程调用 remnote-cli --json 模式。
 *
 * @param command  CLI 命令名（如 'read-rem', 'edit-tree', 'health'）
 * @param payload  JSON 参数对象（无参数的命令可省略）
 * @param options  可选配置
 * @returns 解析后的 CliResponse（ok === true）
 * @throws {CliError} 当 CLI 返回 ok: false 或进程异常时
 */
export async function callCli(
  command: string,
  payload?: Record<string, unknown>,
  options?: { timeoutMs?: number },
): Promise<CliResponse> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  // 构造参数列表：--json <command> [jsonStr]
  const args: string[] = ['--json', command];
  if (payload !== undefined) {
    args.push(JSON.stringify(payload));
  }

  const stdout = await execCliProcess(args, timeoutMs);

  // 解析 JSON 输出
  let response: CliResponse;
  try {
    response = JSON.parse(stdout) as CliResponse;
  } catch {
    throw new CliError(
      `CLI 输出不是合法 JSON: ${stdout.slice(0, 200)}`,
      command,
    );
  }

  // ok === false 时抛出错误
  if (!response.ok) {
    throw new CliError(
      response.error ?? `命令 ${command} 失败（无错误描述）`,
      command,
      response,
    );
  }

  return response;
}

// ---------------------------------------------------------------------------
// 内部辅助
// ---------------------------------------------------------------------------

/**
 * 执行 CLI 子进程并返回 stdout。
 */
function execCliProcess(args: string[], timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      CLI_BIN,
      args,
      {
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024, // 10 MB — read-globe/read-tree 可能较大
        env: { ...process.env },
      },
      (error, stdout, stderr) => {
        if (error) {
          // 超时
          if (error.killed) {
            reject(
              new CliError(
                `CLI 子进程超时（${timeoutMs}ms）: ${CLI_BIN} ${args.join(' ')}`,
                args[1] ?? 'unknown',
              ),
            );
            return;
          }
          // 非零退出码但有 stdout（CLI 可能在 stdout 输出了 JSON 错误）
          if (stdout.trim()) {
            resolve(stdout.trim());
            return;
          }
          reject(
            new CliError(
              `CLI 子进程异常: ${error.message}${stderr ? ` | stderr: ${stderr}` : ''}`,
              args[1] ?? 'unknown',
            ),
          );
          return;
        }
        resolve(stdout.trim());
      },
    );
  });
}
