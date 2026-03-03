/**
 * WS 通信协议类型定义
 *
 * 定义 CLI 守护进程与 Plugin 之间的 WebSocket 消息格式。
 * 与 remnote-plugin 各自独立定义，不共享代码。
 */

// ── 连接状态 ──

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

// ── Plugin → 守护进程 ──

export interface HelloMessage {
  type: 'hello';
  version: string;
  sdkReady: boolean;
}

// ── 心跳 ──

export interface PingMessage {
  type: 'ping';
}

export interface PongMessage {
  type: 'pong';
}

// ── CLI → 守护进程 请求/响应 ──

export interface BridgeRequest {
  id: string;
  action: string;
  payload: Record<string, unknown>;
}

export interface BridgeResponse {
  id: string;
  result?: unknown;
  error?: string;
}

// ── get_status 响应 ──

export interface StatusResult {
  pluginConnected: boolean;
  sdkReady: boolean;
  uptime: number;
  timeoutRemaining: number;
}

// ── 消息类型判断辅助 ──

export function isHelloMessage(msg: unknown): msg is HelloMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as Record<string, unknown>).type === 'hello' &&
    typeof (msg as Record<string, unknown>).version === 'string'
  );
}

export function isPingMessage(msg: unknown): msg is PingMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as Record<string, unknown>).type === 'ping'
  );
}

export function isPongMessage(msg: unknown): msg is PongMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as Record<string, unknown>).type === 'pong'
  );
}

export function isBridgeRequest(msg: unknown): msg is BridgeRequest {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    typeof (msg as Record<string, unknown>).id === 'string' &&
    typeof (msg as Record<string, unknown>).action === 'string'
  );
}

export function isBridgeResponse(msg: unknown): msg is BridgeResponse {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    typeof (msg as Record<string, unknown>).id === 'string' &&
    !('action' in (msg as Record<string, unknown>))
  );
}
