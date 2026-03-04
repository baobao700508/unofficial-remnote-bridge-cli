/**
 * WebSocket Server
 *
 * 守护进程的核心组件：监听端口，管理 Plugin 和 CLI 命令的连接。
 * - 接受 Plugin 的 hello 握手
 * - 向 Plugin 发送 ping 心跳
 * - 处理 CLI 命令的 BridgeRequest（如 get_status）
 * - 只允许一个 Plugin 连接
 */

import { WebSocketServer, WebSocket } from 'ws';
import type {
  HelloMessage,
  BridgeRequest,
  BridgeResponse,
  StatusResult,
} from '../protocol';
import { isHelloMessage, isPongMessage, isBridgeRequest, isBridgeResponse } from '../protocol';
import { RemCache } from './rem-cache';
import { EditHandler } from './edit-handler';
import crypto from 'crypto';

const PLUGIN_REQUEST_TIMEOUT_MS = 15_000;

/** R-F 字段（仅 --full 模式输出，默认不输出） */
const RF_FIELDS = new Set([
  'isPowerup', 'isPowerupEnum', 'isPowerupProperty',
  'isPowerupPropertyListItem', 'isPowerupSlot',
  'deepRemsBeingReferenced',
  'ancestorTagRem', 'descendantTagRem',
  'portalsAndDocumentsIn', 'allRemInDocumentOrPortal', 'allRemInFolderQueue',
  'timesSelectedInSearch', 'lastTimeMovedTo', 'schemaVersion',
  'embeddedQueueViewMode',
  'localUpdatedAt', 'lastPracticed',
]);

export interface BridgeServerConfig {
  port: number;
  host?: string;
  pingIntervalMs?: number;
  pongTimeoutMs?: number;
  onLog?: (message: string, level: 'info' | 'warn' | 'error') => void;
  /** 获取守护进程超时剩余秒数（由 daemon 注入） */
  getTimeoutRemaining?: () => number;
}

export class BridgeServer {
  private wss: WebSocketServer | null = null;
  private pluginSocket: WebSocket | null = null;
  private pluginVersion: string | null = null;
  private pluginSdkReady = false;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private pongTimer: ReturnType<typeof setTimeout> | null = null;
  private startTime = Date.now();
  private remCache = new RemCache();
  private editHandler: EditHandler;
  private pendingPluginRequests = new Map<string, {
    resolve: (result: unknown) => void;
    reject: (error: Error) => void;
    timer: NodeJS.Timeout;
  }>();

  private config: Required<Omit<BridgeServerConfig, 'onLog' | 'getTimeoutRemaining'>> & {
    onLog?: (message: string, level: 'info' | 'warn' | 'error') => void;
    getTimeoutRemaining?: () => number;
  };

  /** 每当收到 CLI 命令请求时触发（用于刷新守护进程超时计时器） */
  public onCliRequest?: () => void;

  constructor(config: BridgeServerConfig) {
    this.config = {
      port: config.port,
      host: config.host ?? '127.0.0.1',
      pingIntervalMs: config.pingIntervalMs ?? 30_000,
      pongTimeoutMs: config.pongTimeoutMs ?? 10_000,
      onLog: config.onLog,
      getTimeoutRemaining: config.getTimeoutRemaining,
    };
    this.editHandler = new EditHandler(
      this.remCache,
      (action, payload) => this.forwardToPlugin(action, payload),
    );
  }

  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    this.config.onLog?.(message, level);
  }

  /**
   * 启动 WS Server。返回 Promise，监听成功后 resolve。
   */
  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.startTime = Date.now();

      this.wss = new WebSocketServer({
        port: this.config.port,
        host: this.config.host,
        maxPayload: 1 * 1024 * 1024, // 1MB，足够所有 JSON 消息
      });

      this.wss.on('listening', () => {
        this.log(`WS Server 监听 ${this.config.host}:${this.config.port}`);
        this.startPingInterval();
        resolve();
      });

      this.wss.on('error', (err) => {
        this.log(`WS Server 错误: ${err.message}`, 'error');
        reject(err);
      });

      this.wss.on('connection', (ws) => {
        this.handleConnection(ws);
      });
    });
  }

  /**
   * 关闭 WS Server。
   */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      this.stopPingInterval();

      if (this.pluginSocket) {
        this.pluginSocket.close(1000, 'Server shutdown');
        this.pluginSocket = null;
      }

      if (this.wss) {
        this.wss.close(() => {
          this.wss = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  private handleConnection(ws: WebSocket): void {
    // 等待第一条消息来区分 Plugin 和 CLI 命令
    let identified = false;

    ws.on('message', (data) => {
      let message: unknown;
      try {
        message = JSON.parse(data.toString());
      } catch {
        this.log('收到无法解析的消息', 'warn');
        return;
      }

      // 第一条消息用来识别连接类型
      if (!identified) {
        if (isHelloMessage(message)) {
          identified = true;
          this.handlePluginHello(ws, message);
          return;
        }
        if (isBridgeRequest(message)) {
          identified = true;
          this.handleCliRequest(ws, message);
          return;
        }
        this.log('收到未知类型的首条消息', 'warn');
        return;
      }

      // 已识别为 Plugin 的后续消息
      if (ws === this.pluginSocket) {
        if (isPongMessage(message)) {
          this.handlePong();
          return;
        }
        // Plugin 返回的 BridgeResponse（子请求的响应）
        if (isBridgeResponse(message)) {
          this.handlePluginResponse(message);
          return;
        }
        return;
      }

      // 已识别为 CLI 的后续请求
      if (isBridgeRequest(message)) {
        this.handleCliRequest(ws, message);
      }
    });

    ws.on('close', () => {
      if (ws === this.pluginSocket) {
        this.log('Plugin 已断开', 'warn');
        this.pluginSocket = null;
        this.pluginVersion = null;
        this.pluginSdkReady = false;
        // 清理可能残留的 pong 超时定时器
        if (this.pongTimer) {
          clearTimeout(this.pongTimer);
          this.pongTimer = null;
        }
        // 拒绝所有等待中的 Plugin 子请求
        for (const [id, pending] of this.pendingPluginRequests) {
          clearTimeout(pending.timer);
          pending.reject(new Error('Plugin 已断开'));
          this.pendingPluginRequests.delete(id);
        }
      }
    });

    ws.on('error', (err) => {
      this.log(`连接错误: ${err.message}`, 'error');
    });
  }

  private handlePluginHello(ws: WebSocket, hello: HelloMessage): void {
    if (this.pluginSocket && this.pluginSocket.readyState === WebSocket.OPEN) {
      // 已有 Plugin 连接，拒绝新连接
      this.log(`拒绝 Plugin 连接（已有连接）`, 'warn');
      ws.close(4000, 'Another plugin is already connected');
      return;
    }

    this.pluginSocket = ws;
    this.pluginVersion = hello.version;
    this.pluginSdkReady = hello.sdkReady ?? false;
    this.log(`Plugin 已连接 (v${hello.version}, SDK: ${this.pluginSdkReady ? '就绪' : '未就绪'})`);
  }

  private async handleCliRequest(ws: WebSocket, request: BridgeRequest): Promise<void> {
    // 通知守护进程刷新超时计时器
    this.onCliRequest?.();

    if (request.action === 'get_status') {
      const result = this.getStatus();
      const response: BridgeResponse = { id: request.id, result };
      ws.send(JSON.stringify(response));
      return;
    }

    // 检查 Plugin 连接
    if (!this.pluginSocket || this.pluginSocket.readyState !== WebSocket.OPEN) {
      const response: BridgeResponse = {
        id: request.id,
        error: 'Plugin 未连接，请确认 RemNote 已打开且插件已激活',
      };
      ws.send(JSON.stringify(response));
      return;
    }

    // read_rem: 转发 + 缓存 + 字段过滤
    if (request.action === 'read_rem') {
      try {
        const result = await this.handleReadRem(request.payload);
        const response: BridgeResponse = { id: request.id, result };
        ws.send(JSON.stringify(response));
      } catch (error) {
        const response: BridgeResponse = {
          id: request.id,
          error: error instanceof Error ? error.message : String(error),
        };
        ws.send(JSON.stringify(response));
      }
      return;
    }

    // edit_rem: 三道防线 + str_replace + 写入
    if (request.action === 'edit_rem') {
      try {
        const result = await this.editHandler.handleEditRem(
          request.payload as { remId: string; oldStr: string; newStr: string },
        );
        const response: BridgeResponse = { id: request.id, result };
        ws.send(JSON.stringify(response));
      } catch (error) {
        const response: BridgeResponse = {
          id: request.id,
          error: error instanceof Error ? error.message : String(error),
        };
        ws.send(JSON.stringify(response));
      }
      return;
    }

    // 其他 action：直接转发给 Plugin
    try {
      const result = await this.forwardToPlugin(request.action, request.payload);
      const response: BridgeResponse = { id: request.id, result };
      ws.send(JSON.stringify(response));
    } catch (error) {
      const response: BridgeResponse = {
        id: request.id,
        error: error instanceof Error ? error.message : String(error),
      };
      ws.send(JSON.stringify(response));
    }
  }

  /**
   * 处理 read_rem 请求：
   * 1. 转发到 Plugin 获取完整 RemObject
   * 2. 序列化为 JSON 字符串并缓存（完整版本）
   * 3. 根据 fields/full 参数过滤字段返回给 CLI
   */
  private async handleReadRem(payload: Record<string, unknown>): Promise<unknown> {
    const remId = payload.remId as string;
    if (!remId) {
      throw new Error('缺少 remId 参数');
    }

    // 转发到 Plugin
    const remObject = await this.forwardToPlugin('read_rem', { remId });

    // 缓存完整 JSON
    const fullJson = JSON.stringify(remObject, null, 2);
    this.remCache.set(remId, fullJson);
    this.log(`缓存 Rem ${remId.slice(0, 8)}... (${fullJson.length} bytes)`);

    // 字段过滤
    const fields = payload.fields as string[] | undefined;
    const full = payload.full as boolean | undefined;

    if (full) {
      // --full → 返回完整对象（含 R-F 字段）
      return remObject;
    }

    const obj = remObject as Record<string, unknown>;

    if (fields) {
      // --fields 过滤：只返回指定字段 + id
      const filtered: Record<string, unknown> = { id: obj.id };
      for (const field of fields) {
        if (field in obj) {
          filtered[field] = obj[field];
        }
      }
      return filtered;
    }

    // 默认模式：排除 R-F 字段
    const filtered: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (!RF_FIELDS.has(key)) {
        filtered[key] = value;
      }
    }
    return filtered;
  }

  /**
   * 向 Plugin 发送子请求并等待响应。
   * 生成独立的请求 ID，通过 pendingPluginRequests 关联 Promise。
   */
  forwardToPlugin(action: string, payload: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.pluginSocket || this.pluginSocket.readyState !== WebSocket.OPEN) {
        reject(new Error('Plugin 未连接'));
        return;
      }

      const requestId = crypto.randomUUID();

      const timer = setTimeout(() => {
        this.pendingPluginRequests.delete(requestId);
        reject(new Error(`Plugin 请求超时 (${PLUGIN_REQUEST_TIMEOUT_MS / 1000}s): ${action}`));
      }, PLUGIN_REQUEST_TIMEOUT_MS);

      this.pendingPluginRequests.set(requestId, { resolve, reject, timer });

      const subRequest: BridgeRequest = {
        id: requestId,
        action,
        payload,
      };

      this.pluginSocket.send(JSON.stringify(subRequest));
      this.log(`转发到 Plugin: ${action} (${requestId.slice(0, 8)}...)`);
    });
  }

  private handlePluginResponse(response: BridgeResponse): void {
    const pending = this.pendingPluginRequests.get(response.id);
    if (!pending) {
      this.log(`收到未知 ID 的 Plugin 响应: ${response.id}`, 'warn');
      return;
    }

    clearTimeout(pending.timer);
    this.pendingPluginRequests.delete(response.id);

    if (response.error) {
      pending.reject(new Error(response.error));
    } else {
      pending.resolve(response.result);
    }
  }

  private handlePong(): void {
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
  }

  private startPingInterval(): void {
    this.pingTimer = setInterval(() => {
      if (this.pluginSocket?.readyState === WebSocket.OPEN) {
        this.pluginSocket.send(JSON.stringify({ type: 'ping' }));

        this.pongTimer = setTimeout(() => {
          this.log('Plugin 心跳超时，断开连接', 'warn');
          this.pluginSocket?.close(4001, 'Pong timeout');
          this.pluginSocket = null;
          this.pluginVersion = null;
          this.pluginSdkReady = false;
        }, this.config.pongTimeoutMs);
      }
    }, this.config.pingIntervalMs);
  }

  private stopPingInterval(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
  }

  /** 获取缓存的 Rem JSON（供 edit-rem 防线使用） */
  getCachedRem(remId: string): string | null {
    return this.remCache.get(remId);
  }

  /** 获取当前状态（timeoutRemaining 通过构造时注入的回调获取） */
  getStatus(): StatusResult {
    return {
      pluginConnected: this.pluginSocket?.readyState === WebSocket.OPEN,
      sdkReady: this.pluginSdkReady,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timeoutRemaining: this.config.getTimeoutRemaining?.() ?? 0,
    };
  }
}
