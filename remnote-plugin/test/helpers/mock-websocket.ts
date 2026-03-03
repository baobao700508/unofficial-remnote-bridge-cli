/**
 * MockWebSocket — 用于 Plugin 层测试
 *
 * 模拟浏览器 WebSocket API，控制连接、消息、关闭等事件。
 */

import { vi } from 'vitest';

export class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;

  readyState: number = MockWebSocket.CONNECTING;
  url: string;
  protocol = '';
  extensions = '';
  bufferedAmount = 0;
  binaryType: BinaryType = 'blob';

  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  send = vi.fn((data: string) => {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
  });

  close = vi.fn((code?: number, reason?: string) => {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code: code ?? 1000, reason: reason ?? '' } as CloseEvent);
  });

  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  dispatchEvent = vi.fn(() => true);

  constructor(url: string) {
    this.url = url;
    // 不自动触发 open，让测试控制
  }

  // ── 测试辅助方法 ──

  /** 模拟连接成功 */
  simulateOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.({} as Event);
  }

  /** 模拟收到消息 */
  simulateMessage(data: string): void {
    this.onmessage?.({ data } as MessageEvent);
  }

  /** 模拟连接关闭 */
  simulateClose(code = 1000, reason = ''): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code, reason } as CloseEvent);
  }

  /** 模拟错误 */
  simulateError(): void {
    this.onerror?.({} as Event);
  }
}

// 记录所有创建的 MockWebSocket 实例
let instances: MockWebSocket[] = [];

export function getMockWebSocketInstances(): MockWebSocket[] {
  return instances;
}

export function getLastMockWebSocket(): MockWebSocket | undefined {
  return instances[instances.length - 1];
}

export function clearMockWebSocketInstances(): void {
  instances = [];
}

/** 安装 MockWebSocket 到全局 */
export function installMockWebSocket(): void {
  instances = [];
  (globalThis as any).WebSocket = class extends MockWebSocket {
    constructor(url: string) {
      super(url);
      instances.push(this);
    }
  };
  // 设置静态常量
  (globalThis as any).WebSocket.CONNECTING = MockWebSocket.CONNECTING;
  (globalThis as any).WebSocket.OPEN = MockWebSocket.OPEN;
  (globalThis as any).WebSocket.CLOSING = MockWebSocket.CLOSING;
  (globalThis as any).WebSocket.CLOSED = MockWebSocket.CLOSED;
}

/** 卸载 MockWebSocket */
export function uninstallMockWebSocket(): void {
  instances = [];
}
