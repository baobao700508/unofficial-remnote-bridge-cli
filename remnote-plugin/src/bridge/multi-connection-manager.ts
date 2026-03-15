/**
 * Multi-Connection Manager — 管理 Plugin 到多个 Daemon 的连接
 *
 * 一个 Plugin 同时连接最多 4 个 daemon，通过"孪生优先级"机制
 * 保证各 daemon 与其原生 Plugin 的亲和性，同时允许空闲 daemon 被接管。
 *
 * 依赖方向：multi-connection-manager → websocket-client（单向）
 */

import { WebSocketClient } from './websocket-client';
import type { ConnectionStatus, BridgeRequest } from './websocket-client';
import { ALL_WS_PORTS, SCAN_INTERVAL_MS } from '../settings';

// ── 类型定义 ──

export type DisconnectReason = 'not_started' | 'preempted' | 'twin_occupied' | 'other_occupied' | null;

export interface SlotState {
  slotIndex: number;
  wsPort: number;
  status: ConnectionStatus;
  isTwin: boolean;
  disconnectReason: DisconnectReason;
}

export interface MultiConnectionManagerConfig {
  twinSlotIndex: number;
  pluginVersion: string;
  sdkReady: boolean;
  onSlotsChange: (slots: SlotState[]) => void;
  onLog: (slotIndex: number, message: string, level: 'info' | 'warn' | 'error') => void;
}

// ── 实现 ──

export class MultiConnectionManager {
  private clients: WebSocketClient[] = [];
  private slotStates: SlotState[] = [];
  private scanTimer: ReturnType<typeof setInterval> | null = null;
  private config: MultiConnectionManagerConfig;

  constructor(config: MultiConnectionManagerConfig) {
    this.config = config;

    // 初始化 4 个槽位状态 + 创建 4 个 WebSocketClient
    for (let i = 0; i < ALL_WS_PORTS.length; i++) {
      const isTwin = (i === config.twinSlotIndex);

      this.slotStates.push({
        slotIndex: i,
        wsPort: ALL_WS_PORTS[i],
        status: 'disconnected',
        isTwin,
        disconnectReason: 'not_started',
      });

      this.clients.push(new WebSocketClient({
        url: `ws://127.0.0.1:${ALL_WS_PORTS[i]}`,
        pluginVersion: config.pluginVersion,
        sdkReady: config.sdkReady,
        twinSlotIndex: config.twinSlotIndex,
        isTwinConnection: isTwin,
        maxReconnectAttempts: isTwin ? 10 : 0,  // 非孪生不自动重连
        initialReconnectDelay: 1000,
        maxReconnectDelay: 30000,
        onStatusChange: (status) => this.handleStatusChange(i, status),
        onLog: (message, level) => config.onLog(i, message, level),
        onPreempted: () => this.handleDisconnectReason(i, 'preempted'),
        onTwinOccupied: () => this.handleDisconnectReason(i, 'twin_occupied'),
        onOtherOccupied: () => this.handleDisconnectReason(i, 'other_occupied'),
      }));
    }
  }

  /** 设置消息处理器（所有连接共享同一个 messageHandler） */
  setMessageHandler(handler: (request: BridgeRequest) => Promise<unknown>): void {
    for (const client of this.clients) {
      client.setMessageHandler(handler);
    }
  }

  /** 启动连接：先连孪生槽位，延迟 2s 后连其余 */
  start(): void {
    const twinIdx = this.config.twinSlotIndex;

    // 先连孪生
    this.clients[twinIdx].connect();

    // 延迟 2s 后连其余
    setTimeout(() => {
      for (let i = 0; i < this.clients.length; i++) {
        if (i !== twinIdx) {
          this.clients[i].connect();
        }
      }
    }, 2000);

    // 启动周期扫描
    this.scanTimer = setInterval(() => this.scanAndReconnect(), SCAN_INTERVAL_MS);
  }

  /** 停止所有连接和定时器 */
  stop(): void {
    if (this.scanTimer) {
      clearInterval(this.scanTimer);
      this.scanTimer = null;
    }
    for (const client of this.clients) {
      client.disconnect();
    }
  }

  /** 获取当前所有槽位状态 */
  getSlots(): SlotState[] {
    return this.slotStates.slice();
  }

  // ── 内部方法 ──

  private handleStatusChange(slotIndex: number, status: ConnectionStatus): void {
    const slot = this.slotStates[slotIndex];
    slot.status = status;
    if (status === 'connected') {
      slot.disconnectReason = null;
    }
    this.notifySlotsChange();
  }

  private handleDisconnectReason(slotIndex: number, reason: DisconnectReason): void {
    this.slotStates[slotIndex].disconnectReason = reason;
    this.notifySlotsChange();
  }

  private notifySlotsChange(): void {
    this.config.onSlotsChange(this.slotStates.slice());
  }

  /** 周期扫描：对所有未连接的非孪生槽位尝试重连 */
  private scanAndReconnect(): void {
    for (let i = 0; i < this.clients.length; i++) {
      const slot = this.slotStates[i];
      // 跳过孪生（有自己的重连逻辑）、已连接
      if (slot.isTwin) continue;
      if (slot.status === 'connected' || slot.status === 'connecting') continue;
      // 所有非孪生槽位都参与轮询（含 preempted/twin_occupied/other_occupied）
      // 对方 Plugin 可能已断开，daemon 空闲后我们能感知到

      this.clients[i].connect();
    }
  }
}
