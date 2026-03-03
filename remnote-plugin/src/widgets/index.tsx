import { declareIndexPlugin, type ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import '../style.css';
import '../index.css';
import { SETTING_WS_URL, DEFAULT_WS_URL, DEFAULT_PLUGIN_VERSION } from '../settings';
import { WebSocketClient } from '../bridge/websocket-client';

let wsClient: WebSocketClient | null = null;

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
    onLog: async (message, level) => {
      const logs =
        ((await plugin.storage.getSession('bridge-logs')) as Array<{
          time: number;
          message: string;
          level: string;
        }>) || [];
      logs.push({ time: Date.now(), message, level });
      if (logs.length > 30) logs.splice(0, logs.length - 30);
      await plugin.storage.setSession('bridge-logs', logs);
    },
  });

  // 未来扩展：处理守护进程转发的请求
  wsClient.setMessageHandler(async (request) => {
    throw new Error(`未实现的 action: ${request.action}`);
  });

  wsClient.connect();
}

async function onDeactivate(_: ReactRNPlugin) {
  wsClient?.disconnect();
  wsClient = null;
}

declareIndexPlugin(onActivate, onDeactivate);
