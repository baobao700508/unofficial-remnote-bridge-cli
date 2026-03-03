import { describe, it, expect, afterEach } from 'vitest';
import WebSocket from 'ws';
import { BridgeServer } from '../../src/server/ws-server';
import type { BridgeRequest, BridgeResponse, HelloMessage, StatusResult } from '../../src/protocol';

const TEST_PORT = 13002;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createClient(port = TEST_PORT): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}`);
    ws.on('open', () => resolve(ws));
    ws.on('error', reject);
  });
}

function sendAndReceive(ws: WebSocket, data: unknown): Promise<unknown> {
  return new Promise((resolve) => {
    ws.once('message', (raw) => {
      resolve(JSON.parse(raw.toString()));
    });
    ws.send(JSON.stringify(data));
  });
}

describe('BridgeServer', () => {
  let server: BridgeServer;
  const clients: WebSocket[] = [];

  afterEach(async () => {
    for (const c of clients) {
      if (c.readyState === WebSocket.OPEN) c.close();
    }
    clients.length = 0;
    if (server) await server.stop();
  });

  async function startServer(opts: Partial<Parameters<typeof BridgeServer['prototype']['constructor']>[0]> = {}) {
    server = new BridgeServer({ port: TEST_PORT, pingIntervalMs: 60_000, ...opts } as any);
    await server.start();
  }

  async function connectClient(): Promise<WebSocket> {
    const ws = await createClient();
    clients.push(ws);
    return ws;
  }

  // ── hello 握手 ──

  it('接受 Plugin hello 握手', async () => {
    await startServer();
    const ws = await connectClient();

    const hello: HelloMessage = { type: 'hello', version: '0.1.0', sdkReady: true };
    ws.send(JSON.stringify(hello));
    await wait(50);

    const status = server.getStatus(0);
    expect(status.pluginConnected).toBe(true);
    expect(status.sdkReady).toBe(true);
  });

  it('拒绝第二个 Plugin 连接', async () => {
    await startServer();

    const ws1 = await connectClient();
    const hello: HelloMessage = { type: 'hello', version: '0.1.0', sdkReady: true };
    ws1.send(JSON.stringify(hello));
    await wait(50);

    const ws2 = await connectClient();
    const closePromise = new Promise<number>((resolve) => {
      ws2.on('close', (code) => resolve(code));
    });
    ws2.send(JSON.stringify(hello));

    const code = await closePromise;
    expect(code).toBe(4000);
  });

  // ── get_status ──

  it('CLI 发送 get_status 返回状态', async () => {
    await startServer();
    const ws = await connectClient();

    const request: BridgeRequest = { id: 'test-1', action: 'get_status', payload: {} };
    const response = (await sendAndReceive(ws, request)) as BridgeResponse;

    expect(response.id).toBe('test-1');
    const result = response.result as StatusResult;
    expect(result.pluginConnected).toBe(false);
    expect(result.sdkReady).toBe(false);
    expect(typeof result.uptime).toBe('number');
  });

  it('Plugin 连接后 get_status 反映状态', async () => {
    await startServer();

    // Plugin 连接
    const pluginWs = await connectClient();
    pluginWs.send(JSON.stringify({ type: 'hello', version: '0.1.0', sdkReady: true }));
    await wait(50);

    // CLI 查询
    const cliWs = await connectClient();
    const request: BridgeRequest = { id: 'test-2', action: 'get_status', payload: {} };
    const response = (await sendAndReceive(cliWs, request)) as BridgeResponse;

    const result = response.result as StatusResult;
    expect(result.pluginConnected).toBe(true);
    expect(result.sdkReady).toBe(true);
  });

  // ── onCliRequest 回调 ──

  it('CLI 请求触发 onCliRequest 回调', async () => {
    await startServer();
    let callbackCalled = false;
    server.onCliRequest = () => { callbackCalled = true; };

    const ws = await connectClient();
    const request: BridgeRequest = { id: 'test-3', action: 'get_status', payload: {} };
    await sendAndReceive(ws, request);

    expect(callbackCalled).toBe(true);
  });

  // ── Plugin 断开 ──

  it('Plugin 断开后状态恢复', async () => {
    await startServer();

    const pluginWs = await connectClient();
    pluginWs.send(JSON.stringify({ type: 'hello', version: '0.1.0', sdkReady: true }));
    await wait(50);

    expect(server.getStatus(0).pluginConnected).toBe(true);

    pluginWs.close();
    await wait(50);

    expect(server.getStatus(0).pluginConnected).toBe(false);
    expect(server.getStatus(0).sdkReady).toBe(false);
  });

  // ── ping/pong ──

  it('Plugin 响应 ping 返回 pong', async () => {
    await startServer({ port: TEST_PORT, pingIntervalMs: 100, pongTimeoutMs: 5000 });

    const pluginWs = await connectClient();
    pluginWs.send(JSON.stringify({ type: 'hello', version: '0.1.0', sdkReady: true }));

    // 等待收到 ping
    const pingPromise = new Promise<void>((resolve) => {
      pluginWs.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ping') {
          pluginWs.send(JSON.stringify({ type: 'pong' }));
          resolve();
        }
      });
    });

    await pingPromise;
    await wait(50);

    // Plugin 仍然连接
    expect(server.getStatus(0).pluginConnected).toBe(true);
  });

  // ── Plugin 未连接时转发请求返回错误 ──

  it('Plugin 未连接时非 get_status 请求返回错误', async () => {
    await startServer();
    const ws = await connectClient();

    const request: BridgeRequest = { id: 'test-4', action: 'search', payload: {} };
    const response = (await sendAndReceive(ws, request)) as BridgeResponse;

    expect(response.id).toBe('test-4');
    expect(response.error).toContain('Plugin 未连接');
  });
});
