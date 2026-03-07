/**
 * Daemon 通信工具 — CLI 命令向守护进程发送请求的通用方法
 *
 * 封装 WS 连接建立、请求发送、响应等待、超时处理的完整流程。
 * 所有业务命令（health、read-rem、edit-rem 等）均通过此函数与 daemon 通信。
 */

import WebSocket from 'ws';
import crypto from 'crypto';
import { loadConfig, pidFilePath, findProjectRoot } from '../config.js';
import { checkDaemon } from './pid.js';
import type { BridgeResponse } from '../protocol.js';
import { isBridgeResponse } from '../protocol.js';

const CONNECT_TIMEOUT_MS = 5_000;
const DEFAULT_RESPONSE_TIMEOUT_MS = 30_000;

export class DaemonNotRunningError extends Error {
  constructor() {
    super('守护进程未运行，请先执行 remnote-bridge connect');
    this.name = 'DaemonNotRunningError';
  }
}

export class DaemonUnreachableError extends Error {
  constructor(cause: string) {
    super(`无法连接守护进程: ${cause}`);
    this.name = 'DaemonUnreachableError';
  }
}

/**
 * 向守护进程发送请求并等待响应。
 *
 * 流程：读取 PID 文件 → 建立 WS 连接 → 发送 BridgeRequest → 等待 BridgeResponse → 关闭连接
 *
 * @throws DaemonNotRunningError — PID 文件不存在或进程已死
 * @throws DaemonUnreachableError — WS 连接失败
 * @throws Error — daemon 返回 error 字段或响应超时
 */
export async function sendDaemonRequest(
  action: string,
  payload: Record<string, unknown> = {},
  options?: { timeout?: number },
): Promise<unknown> {
  const projectRoot = findProjectRoot();
  const config = loadConfig(projectRoot);
  const pidPath = pidFilePath(projectRoot);

  // 检查 daemon 是否运行
  const daemonStatus = checkDaemon(pidPath);
  if (!daemonStatus.running) {
    throw new DaemonNotRunningError();
  }

  const responseTimeout = options?.timeout ?? DEFAULT_RESPONSE_TIMEOUT_MS;

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${config.wsPort}`);
    const requestId = crypto.randomUUID();
    let responseTimer: ReturnType<typeof setTimeout> | null = null;

    const connectTimer = setTimeout(() => {
      ws.terminate();
      reject(new DaemonUnreachableError('连接超时'));
    }, CONNECT_TIMEOUT_MS);

    ws.on('open', () => {
      clearTimeout(connectTimer);

      responseTimer = setTimeout(() => {
        ws.terminate();
        reject(new Error(`请求超时 (${responseTimeout / 1000}s): ${action}`));
      }, responseTimeout);

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (isBridgeResponse(msg) && msg.id === requestId) {
            if (responseTimer) clearTimeout(responseTimer);
            ws.close();
            if (msg.error) {
              reject(new Error(msg.error));
            } else {
              resolve(msg.result);
            }
          }
        } catch {
          // 忽略非 JSON 消息
        }
      });

      // 发送请求
      ws.send(JSON.stringify({
        id: requestId,
        action,
        payload,
      }));
    });

    ws.on('error', (err) => {
      clearTimeout(connectTimer);
      if (responseTimer) clearTimeout(responseTimer);
      reject(new DaemonUnreachableError(err.message));
    });
  });
}
