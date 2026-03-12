/**
 * WebSocket Client — Plugin 侧连接守护进程
 *
 * 职责：
 * 1. 连接到 CLI 守护进程的 WS Server
 * 2. 发送 hello 消息（携带版本 + SDK 状态）
 * 3. 响应 ping 心跳返回 pong
 * 4. 接收并执行来自守护进程转发的请求
 * 5. 断线后指数退避自动重连
 *
 * 协议类型在 Plugin 层独立定义（与 CLI 层不共享代码）。
 */

// ── 协议类型（独立定义）──

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export interface HelloMessage {
  type: 'hello';
  version: string;
  sdkReady: boolean;
}

export interface PingMessage {
  type: 'ping';
}

export interface PongMessage {
  type: 'pong';
}

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

// ── AI Chat 协议类型（独立定义）──

export interface ChatMessage {
  type: 'chat';
  sessionId: string;
  message: string;
}

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

export interface ChatSessionRequest {
  type: 'chat_session';
  action: 'list' | 'create' | 'delete' | 'get_history';
  sessionId?: string;
  title?: string;
}

export interface ChatSessionResponse {
  type: 'chat_session_response';
  requestAction: string;
  sessions?: Array<{ id: string; title: string; createdAt: number; updatedAt: number; messageCount: number }>;
  history?: Array<{ id: string; role: string; content: string; timestamp: number }>;
  session?: { id: string; title: string; createdAt: number };
  ok?: boolean;
  error?: string;
}

// ── 配置 ──

export interface WebSocketClientConfig {
  url: string;
  pluginVersion: string;
  sdkReady: boolean;
  maxReconnectAttempts?: number;
  initialReconnectDelay?: number;
  maxReconnectDelay?: number;
  onStatusChange?: (status: ConnectionStatus) => void;
  onLog?: (message: string, level: 'info' | 'warn' | 'error') => void;
  onChatStream?: (chunk: ChatStreamChunk) => void;
  onChatSessionResponse?: (response: ChatSessionResponse) => void;
}

// ── WebSocket Client 实现 ──

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private messageHandler: ((request: BridgeRequest) => Promise<unknown>) | null = null;
  private status: ConnectionStatus = 'disconnected';
  private isShuttingDown = false;
  private _sdkReady: boolean;

  private config: Required<Omit<WebSocketClientConfig, 'onStatusChange' | 'onLog' | 'onChatStream' | 'onChatSessionResponse'>> & {
    onStatusChange?: (status: ConnectionStatus) => void;
    onLog?: (message: string, level: 'info' | 'warn' | 'error') => void;
    onChatStream?: (chunk: ChatStreamChunk) => void;
    onChatSessionResponse?: (response: ChatSessionResponse) => void;
  };

  constructor(config: WebSocketClientConfig) {
    this._sdkReady = config.sdkReady;
    this.config = {
      url: config.url,
      pluginVersion: config.pluginVersion,
      sdkReady: config.sdkReady,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 10,
      initialReconnectDelay: config.initialReconnectDelay ?? 1000,
      maxReconnectDelay: config.maxReconnectDelay ?? 30000,
      onStatusChange: config.onStatusChange,
      onLog: config.onLog,
      onChatStream: config.onChatStream,
      onChatSessionResponse: config.onChatSessionResponse,
    };
  }

  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    this.config.onLog?.(message, level);
  }

  private setStatus(newStatus: ConnectionStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.config.onStatusChange?.(newStatus);
    }
  }

  private sendHello(): void {
    const hello: HelloMessage = {
      type: 'hello',
      version: this.config.pluginVersion,
      sdkReady: this._sdkReady,
    };
    try {
      this.ws?.send(JSON.stringify(hello));
      this.log(`发送 hello（v${this.config.pluginVersion}, sdkReady=${this._sdkReady}）`);
    } catch (error) {
      this.log(`发送 hello 失败: ${error}`, 'warn');
    }
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    this.isShuttingDown = false;
    this.setStatus('connecting');
    this.log(`正在连接 ${this.config.url}...`);

    try {
      this.ws = new WebSocket(this.config.url);

      this.ws.onopen = () => {
        this.log('已连接到守护进程');
        this.reconnectAttempts = 0;
        this.setStatus('connected');
        this.sendHello();
      };

      this.ws.onmessage = async (event) => {
        await this.handleMessage(typeof event.data === 'string' ? event.data : String(event.data));
      };

      this.ws.onclose = (event) => {
        this.log(`连接断开: ${event.code} ${event.reason}`, 'warn');
        this.setStatus('disconnected');

        if (!this.isShuttingDown) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        this.log(`WebSocket 错误: ${error}`, 'error');
      };
    } catch (error) {
      this.log(`连接失败: ${error}`, 'error');
      this.setStatus('disconnected');
      this.scheduleReconnect();
    }
  }

  private async handleMessage(data: string): Promise<void> {
    try {
      const message = JSON.parse(data);

      // 心跳响应
      if (message.type === 'ping') {
        this.ws?.send(JSON.stringify({ type: 'pong' } as PongMessage));
        return;
      }

      // AI Chat 流式响应
      if (message.type === 'chat_stream') {
        this.config.onChatStream?.(message as ChatStreamChunk);
        return;
      }

      // AI Chat 会话管理响应
      if (message.type === 'chat_session_response') {
        this.config.onChatSessionResponse?.(message as ChatSessionResponse);
        return;
      }

      // 处理来自守护进程转发的请求
      if (message.id && message.action && this.messageHandler) {
        const request = message as BridgeRequest;
        this.log(`收到请求: ${request.action}`);

        try {
          const result = await this.messageHandler(request);
          const response: BridgeResponse = { id: request.id, result };
          this.ws?.send(JSON.stringify(response));
          this.log(`完成: ${request.action}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const response: BridgeResponse = { id: request.id, error: errorMessage };
          this.ws?.send(JSON.stringify(response));
          this.log(`失败: ${request.action} - ${errorMessage}`, 'error');
        }
      }
    } catch (error) {
      this.log(`处理消息失败: ${error}`, 'error');
    }
  }

  private scheduleReconnect(): void {
    if (this.isShuttingDown) return;

    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.log('已达最大重连次数', 'error');
      return;
    }

    // 指数退避 + 抖动
    const baseDelay = Math.min(
      this.config.initialReconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.config.maxReconnectDelay,
    );
    const jitter = Math.random() * 0.3 * baseDelay;
    const delay = baseDelay + jitter;

    this.reconnectAttempts++;
    this.log(
      `${Math.round(delay)}ms 后重连（第 ${this.reconnectAttempts}/${this.config.maxReconnectAttempts} 次）`,
    );

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  setMessageHandler(handler: (request: BridgeRequest) => Promise<unknown>): void {
    this.messageHandler = handler;
  }

  setSdkReady(ready: boolean): void {
    this._sdkReady = ready;
  }

  disconnect(): void {
    this.isShuttingDown = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Plugin disconnect');
      this.ws = null;
    }

    this.setStatus('disconnected');
  }

  reconnect(): void {
    this.reconnectAttempts = 0;
    this.disconnect();
    this.connect();
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  // ── AI Chat 发送方法 ──

  sendChat(sessionId: string, message: string): void {
    const msg: ChatMessage = { type: 'chat', sessionId, message };
    try {
      this.ws?.send(JSON.stringify(msg));
    } catch (error) {
      this.log(`发送聊天消息失败: ${error}`, 'error');
    }
  }

  sendChatSessionRequest(action: 'list' | 'create' | 'delete' | 'get_history', sessionId?: string, title?: string): void {
    const msg: ChatSessionRequest = { type: 'chat_session', action, sessionId, title };
    try {
      this.ws?.send(JSON.stringify(msg));
    } catch (error) {
      this.log(`发送会话请求失败: ${error}`, 'error');
    }
  }
}
