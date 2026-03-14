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

/** 已有其他 Plugin 连接（非孪生），拒绝 */
const WS_CLOSE_OTHER_CONNECTED = 4000;
/** 孪生已连，拒绝非孪生 */
const WS_CLOSE_TWIN_EXISTS = 4003;

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export interface HelloMessage {
  type: 'hello';
  version: string;
  sdkReady: boolean;
  twinSlotIndex: number;  // Plugin 的孪生 daemon 槽位索引 (0-3)
}

export interface PreemptedMessage {
  type: 'preempted';
  reason: string;  // 'twin_plugin_connected'
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

// ── 配置 ──

export interface WebSocketClientConfig {
  url: string;
  pluginVersion: string;
  sdkReady: boolean;
  twinSlotIndex: number;       // Plugin 的孪生槽位
  isTwinConnection?: boolean;  // 本连接是否孪生连接
  maxReconnectAttempts?: number;
  initialReconnectDelay?: number;
  maxReconnectDelay?: number;
  onStatusChange?: (status: ConnectionStatus) => void;
  onLog?: (message: string, level: 'info' | 'warn' | 'error') => void;
  onPreempted?: () => void;      // 被孪生 Plugin 抢占回调
  onTwinOccupied?: () => void;   // 被拒绝：孪生 Plugin 已连（不可重试）
  onOtherOccupied?: () => void;  // 被拒绝：已有其他非孪生 Plugin（可重试）
}

// ── WebSocket Client 实现 ──

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private messageHandler: ((request: BridgeRequest) => Promise<unknown>) | null = null;
  private status: ConnectionStatus = 'disconnected';
  private isShuttingDown = false;
  private isPreempted = false;
  private _sdkReady: boolean;

  private config: Required<Omit<WebSocketClientConfig, 'onStatusChange' | 'onLog' | 'onPreempted' | 'onTwinOccupied' | 'onOtherOccupied' | 'isTwinConnection'>> & {
    onStatusChange?: (status: ConnectionStatus) => void;
    onLog?: (message: string, level: 'info' | 'warn' | 'error') => void;
    onPreempted?: () => void;
    onTwinOccupied?: () => void;
    onOtherOccupied?: () => void;
    isTwinConnection: boolean;
  };

  constructor(config: WebSocketClientConfig) {
    this._sdkReady = config.sdkReady;
    this.config = {
      url: config.url,
      pluginVersion: config.pluginVersion,
      sdkReady: config.sdkReady,
      twinSlotIndex: config.twinSlotIndex,
      isTwinConnection: config.isTwinConnection ?? false,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 10,
      initialReconnectDelay: config.initialReconnectDelay ?? 1000,
      maxReconnectDelay: config.maxReconnectDelay ?? 30000,
      onStatusChange: config.onStatusChange,
      onLog: config.onLog,
      onPreempted: config.onPreempted,
      onTwinOccupied: config.onTwinOccupied,
      onOtherOccupied: config.onOtherOccupied,
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
      twinSlotIndex: this.config.twinSlotIndex,
    };
    try {
      this.ws?.send(JSON.stringify(hello));
      this.log(`发送 hello（v${this.config.pluginVersion}, sdkReady=${this._sdkReady}, twinSlot=${this.config.twinSlotIndex}）`);
    } catch (error) {
      this.log(`发送 hello 失败: ${error}`, 'warn');
    }
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    this.isShuttingDown = false;
    this.isPreempted = false;
    this.setStatus('connecting');

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
        // 1006 = 连接从未建立（daemon 未运行），不打日志
        if (event.code !== 1006) {
          this.log(`连接断开: ${event.code} ${event.reason}`, 'warn');
        }
        this.setStatus('disconnected');

        // 被 daemon 拒绝
        if (event.code === WS_CLOSE_TWIN_EXISTS) {
          this.config.onTwinOccupied?.();
        } else if (event.code === WS_CLOSE_OTHER_CONNECTED) {
          this.config.onOtherOccupied?.();
        }

        if (!this.isShuttingDown) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        // 连接失败的错误由 onclose 处理，此处不重复打日志
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

      // 抢占通知
      if (message.type === 'preempted') {
        this.isPreempted = true;
        this.log(`被孪生 Plugin 抢占: ${message.reason}`, 'warn');
        this.config.onPreempted?.();
        return;
      }

      // 心跳响应
      if (message.type === 'ping') {
        this.ws?.send(JSON.stringify({ type: 'pong' } as PongMessage));
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

    // 被抢占 → 不在此处重连，由外部轮询驱动
    if (this.isPreempted) {
      return;
    }

    // 非孪生连接 → 不在此处重连，由外部轮询驱动
    if (!this.config.isTwinConnection) {
      return;
    }

    // 孪生连接保留指数退避重连
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

  getStatus(): ConnectionStatus {
    return this.status;
  }
}
