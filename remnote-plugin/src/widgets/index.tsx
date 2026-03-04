import { declareIndexPlugin, type ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import '../style.css';
import '../index.css';
import { SETTING_WS_URL, DEFAULT_WS_URL, DEFAULT_PLUGIN_VERSION } from '../settings';
import { WebSocketClient } from '../bridge/websocket-client';
import { createMessageRouter } from '../bridge/message-router';
import { runActionTests } from '../services/test-actions';

let wsClient: WebSocketClient | null = null;
// 本地日志缓冲区：避免 onLog 并发读写 plugin.storage 的竞态
const logBuffer: Array<{ time: number; message: string; level: string }> = [];
let logFlushPending = false;

async function onActivate(plugin: ReactRNPlugin) {
  // 注册 WS Server URL 设置
  await plugin.settings.registerStringSetting({
    id: SETTING_WS_URL,
    title: 'Bridge WS Server URL',
    description: '守护进程 WebSocket Server 地址（默认 ws://127.0.0.1:3002）',
    defaultValue: DEFAULT_WS_URL,
  });

  // 注册 Bridge Widget（右侧边栏）
  await plugin.app.registerWidget('bridge_widget', WidgetLocation.RightSidebar, {
    dimensions: { height: 'auto', width: '100%' },
    widgetTabIcon: 'https://cdn.jsdelivr.net/npm/lucide-static@0.460.0/icons/globe.svg',
  });

  // 读取 WS URL 设置
  const wsUrl =
    (await plugin.settings.getSetting<string>(SETTING_WS_URL)) || DEFAULT_WS_URL;

  // 在 onActivate 中建立 WebSocket 连接（插件激活即连接，无需打开 widget）
  wsClient = new WebSocketClient({
    url: wsUrl,
    pluginVersion: DEFAULT_PLUGIN_VERSION,
    sdkReady: true,
    maxReconnectAttempts: 10,
    initialReconnectDelay: 1000,
    maxReconnectDelay: 30000,
    onStatusChange: (status) => {
      void plugin.storage.setSession('bridge-status', status);
    },
    onLog: (message, level) => {
      logBuffer.push({ time: Date.now(), message, level });
      if (logBuffer.length > 30) logBuffer.splice(0, logBuffer.length - 30);
      // 合并写入：避免并发 read-modify-write 竞态
      if (!logFlushPending) {
        logFlushPending = true;
        queueMicrotask(async () => {
          logFlushPending = false;
          await plugin.storage.setSession('bridge-logs', logBuffer.slice());
        });
      }
    },
  });

  // 路由守护进程转发的请求到 services 层
  wsClient.setMessageHandler(createMessageRouter(plugin));

  wsClient.connect();

  // ── 纯动作测试（一次性运行）──
  runActionTests(plugin).catch((err) => console.error('[ACTION-TEST] 顶层错误:', err));
}

async function onDeactivate(_: ReactRNPlugin) {
  wsClient?.disconnect();
  wsClient = null;
}

declareIndexPlugin(onActivate, onDeactivate);
