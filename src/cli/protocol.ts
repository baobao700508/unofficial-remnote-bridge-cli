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

// ── Headless Chrome 状态 ──

export type HeadlessStatus = 'stopped' | 'starting' | 'running' | 'crashed' | 'reloading';

export interface HeadlessDiagnostics {
  status: HeadlessStatus;
  chromeConnected: boolean;
  pageUrl: string | null;
  reloadCount: number;
  lastError: string | null;
  recentConsoleErrors: string[];
}

export interface DiagnoseResult {
  headless: HeadlessDiagnostics;
  screenshotPath: string | null;
  pluginConnected: boolean;
  sdkReady: boolean;
}

export interface ReloadResult {
  ok: boolean;
  error?: string;
}

// ── get_status 响应 ──

export interface StatusResult {
  pluginConnected: boolean;
  sdkReady: boolean;
  uptime: number;
  timeoutRemaining: number;
  headless?: HeadlessDiagnostics;
  aiChat?: { enabled: boolean; ready: boolean };
}

// ── AI Chat 消息 ──

/** Plugin → Daemon: 发起聊天 */
export interface ChatMessage {
  type: 'chat';
  sessionId: string;
  message: string;
}

/** Daemon → Plugin: 流式聊天响应 */
export interface ChatStreamChunk {
  type: 'chat_stream';
  sessionId: string;
  chunk: string;
  done: boolean;
  toolCall?: {
    name: string;
    args?: string;
    result?: string;
    status: 'calling' | 'done';
  };
  error?: string;
}

/** Plugin → Daemon: 会话管理请求 */
export interface ChatSessionRequest {
  type: 'chat_session';
  action: 'list' | 'create' | 'delete' | 'get_history';
  sessionId?: string;
  title?: string;
}

/** Daemon → Plugin: 会话管理响应 */
export interface ChatSessionResponse {
  type: 'chat_session_response';
  requestAction: string;
  sessions?: Array<{ id: string; title: string; createdAt: number; updatedAt: number; messageCount: number }>;
  history?: Array<{ id: string; role: string; content: string; timestamp: number }>;
  session?: { id: string; title: string; createdAt: number };
  ok?: boolean;
  error?: string;
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

export function isChatMessage(msg: unknown): msg is ChatMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as Record<string, unknown>).type === 'chat' &&
    typeof (msg as Record<string, unknown>).sessionId === 'string' &&
    typeof (msg as Record<string, unknown>).message === 'string'
  );
}

export function isChatSessionRequest(msg: unknown): msg is ChatSessionRequest {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as Record<string, unknown>).type === 'chat_session' &&
    typeof (msg as Record<string, unknown>).action === 'string'
  );
}
