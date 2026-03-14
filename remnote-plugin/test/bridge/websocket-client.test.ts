import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebSocketClient, ConnectionStatus } from '../../src/bridge/websocket-client';
import {
  installMockWebSocket,
  uninstallMockWebSocket,
  getLastMockWebSocket,
  clearMockWebSocketInstances,
} from '../helpers/mock-websocket';

describe('WebSocketClient', () => {
  let client: WebSocketClient;
  let statusChanges: ConnectionStatus[];

  beforeEach(() => {
    vi.useFakeTimers();
    installMockWebSocket();
    statusChanges = [];

    client = new WebSocketClient({
      url: 'ws://127.0.0.1:3002',
      pluginVersion: '0.1.0',
      sdkReady: true,
      maxReconnectAttempts: 3,
      initialReconnectDelay: 1000,
      maxReconnectDelay: 5000,
      onStatusChange: (s) => statusChanges.push(s),
    });
  });

  afterEach(() => {
    client.disconnect();
    uninstallMockWebSocket();
    clearMockWebSocketInstances();
    vi.useRealTimers();
  });

  it('连接成功后发送 hello', () => {
    client.connect();
    const ws = getLastMockWebSocket()!;

    expect(ws).toBeDefined();
    expect(statusChanges).toContain('connecting');

    ws.simulateOpen();

    expect(statusChanges).toContain('connected');
    expect(ws.send).toHaveBeenCalledWith(
      expect.stringContaining('"type":"hello"'),
    );

    // 验证 hello 内容
    const helloData = JSON.parse(ws.send.mock.calls[0][0]);
    expect(helloData.type).toBe('hello');
    expect(helloData.version).toBe('0.1.0');
    expect(helloData.sdkReady).toBe(true);
  });

  it('响应 ping 返回 pong', () => {
    client.connect();
    const ws = getLastMockWebSocket()!;
    ws.simulateOpen();

    ws.simulateMessage(JSON.stringify({ type: 'ping' }));

    // send 第一次调用是 hello，第二次是 pong
    expect(ws.send).toHaveBeenCalledTimes(2);
    const pongData = JSON.parse(ws.send.mock.calls[1][0]);
    expect(pongData.type).toBe('pong');
  });

  it('断线后自动重连', () => {
    client.connect();
    const ws1 = getLastMockWebSocket()!;
    ws1.simulateOpen();
    ws1.simulateClose(1006, 'abnormal');

    expect(statusChanges).toContain('disconnected');

    // 推进时间触发重连
    vi.advanceTimersByTime(2000);

    // 应该创建了新的 WebSocket 实例
    const ws2 = getLastMockWebSocket()!;
    expect(ws2).not.toBe(ws1);
  });

  it('达到最大重连次数后停止', () => {
    // 使用 maxReconnectAttempts=2，模拟连接失败（不 simulateOpen）
    const logFn = vi.fn();
    const client2 = new WebSocketClient({
      url: 'ws://127.0.0.1:3002',
      pluginVersion: '0.1.0',
      sdkReady: true,
      maxReconnectAttempts: 2,
      initialReconnectDelay: 100,
      maxReconnectDelay: 1000,
      onLog: logFn,
    });

    client2.connect();
    // 第一次连接：直接关闭（模拟连接失败）
    getLastMockWebSocket()!.simulateClose(1006, '');
    vi.advanceTimersByTime(500); // 触发第 1 次重连

    // 第二次连接：也关闭
    getLastMockWebSocket()!.simulateClose(1006, '');
    vi.advanceTimersByTime(1500); // 触发第 2 次重连

    // 第三次连接：也关闭
    getLastMockWebSocket()!.simulateClose(1006, '');
    vi.advanceTimersByTime(5000); // 等待足够久

    // 此时应该已达最大重连次数
    expect(logFn).toHaveBeenCalledWith('已达最大重连次数', 'error');
    client2.disconnect();
  });

  it('处理来自守护进程转发的请求', async () => {
    const handler = vi.fn().mockResolvedValue({ ok: true });
    client.setMessageHandler(handler);

    client.connect();
    const ws = getLastMockWebSocket()!;
    ws.simulateOpen();

    const request = { id: 'req-1', action: 'test_action', payload: { key: 'value' } };
    ws.simulateMessage(JSON.stringify(request));

    // 等待异步处理
    await vi.advanceTimersByTimeAsync(0);

    expect(handler).toHaveBeenCalledWith(request);
    // hello + response = 2 次 send
    expect(ws.send).toHaveBeenCalledTimes(2);
    const response = JSON.parse(ws.send.mock.calls[1][0]);
    expect(response.id).toBe('req-1');
    expect(response.result).toEqual({ ok: true });
  });

  it('请求处理失败时返回错误', async () => {
    const handler = vi.fn().mockRejectedValue(new Error('处理失败'));
    client.setMessageHandler(handler);

    client.connect();
    const ws = getLastMockWebSocket()!;
    ws.simulateOpen();

    ws.simulateMessage(JSON.stringify({ id: 'req-2', action: 'fail_action', payload: {} }));
    await vi.advanceTimersByTimeAsync(0);

    const response = JSON.parse(ws.send.mock.calls[1][0]);
    expect(response.id).toBe('req-2');
    expect(response.error).toBe('处理失败');
  });

  it('disconnect 后不重连', () => {
    client.connect();
    const ws = getLastMockWebSocket()!;
    ws.simulateOpen();

    client.disconnect();

    expect(client.getStatus()).toBe('disconnected');
    vi.advanceTimersByTime(60000);

    // 不应该创建新连接
    // disconnect 会调用 ws.close，之后不会有新实例
  });

});
