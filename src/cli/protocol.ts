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
  twinSlotIndex: number;  // Plugin 的孪生 daemon 槽位索引 (0-3)
}

// ── Daemon → Plugin（抢占通知）──

export interface PreemptedMessage {
  type: 'preempted';
  reason: string;  // 'twin_plugin_connected'
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
}

// ── 消息类型判断辅助 ──

export function isHelloMessage(msg: unknown): msg is HelloMessage {
  if (typeof msg !== 'object' || msg === null) return false;
  const obj = msg as Record<string, unknown>;
  return (
    obj.type === 'hello' &&
    typeof obj.version === 'string' &&
    typeof obj.twinSlotIndex === 'number' &&
    Number.isInteger(obj.twinSlotIndex) &&
    obj.twinSlotIndex >= 0 &&
    obj.twinSlotIndex <= 3
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

// ── WS Close Codes ──

/** 已有其他 Plugin 连接（非孪生），拒绝 */
export const WS_CLOSE_OTHER_CONNECTED = 4000;
/** 心跳超时，断开连接 */
export const WS_CLOSE_PONG_TIMEOUT = 4001;
/** 被孪生 Plugin 抢占（daemon 主动断开非孪生连接） */
export const WS_CLOSE_PREEMPTED = 4002;
/** 孪生已连，拒绝非孪生 */
export const WS_CLOSE_TWIN_EXISTS = 4003;
