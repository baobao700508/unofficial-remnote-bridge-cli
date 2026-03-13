import { declareIndexPlugin, type ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import '../style.css';
import '../index.css';
import { DEFAULT_WS_URL, DEFAULT_PLUGIN_VERSION } from '../settings';
import { WebSocketClient } from '../bridge/websocket-client';
import { createMessageRouter } from '../bridge/message-router';
// test-scripts 已完成数据收集，不再打包进生产代码
// 如需重跑，取消注释对应 import 和 onActivate 调用
// import { runActionTests } from '../test-scripts/test-actions';
// import { runRichTextBuilderTest } from '../test-scripts/test-richtext-builder';
// import { runRichTextRemainingTest } from '../test-scripts/test-richtext-remaining';
// import { runRichTextMatrixTest } from '../test-scripts/test-richtext-matrix';
// import { runPowerupRenderingTest } from '../test-scripts/test-powerup-rendering';

let wsClient: WebSocketClient | null = null;
// 本地日志缓冲区：避免 onLog 并发读写 plugin.storage 的竞态
const logBuffer: Array<{ time: number; message: string; level: string }> = [];
let logFlushPending = false;

async function onActivate(plugin: ReactRNPlugin) {
  // 注册 Bridge Widget（右侧边栏）
  await plugin.app.registerWidget('bridge_widget', WidgetLocation.RightSidebar, {
    dimensions: { height: 'auto', width: '100%' },
    widgetTabIcon: 'https://cdn.jsdelivr.net/npm/lucide-static@0.460.0/icons/globe.svg',
  });

  // 自动发现 wsPort：Plugin 由 daemon 的 static-server 提供服务，
  // fetch('/api/discovery') 是同源请求，返回 daemon 的实际端口信息
  let wsUrl = DEFAULT_WS_URL;
  let instanceName = '';
  let configPort = 29102;
  try {
    const resp = await fetch('/api/discovery');
    if (resp.ok) {
      const data = await resp.json();
      if (data.wsPort) {
        wsUrl = `ws://127.0.0.1:${data.wsPort}`;
      }
      if (data.instance) {
        instanceName = data.instance;
      }
      if (data.configPort) {
        configPort = data.configPort;
      }
    }
  } catch {
    // discovery 失败（dev 模式 / 非 daemon 环境），使用默认值
  }
  // 存储实例名和配置端口，供 widget 显示
  await plugin.storage.setSession('bridge-instance', instanceName);
  await plugin.storage.setSession('bridge-config-port', configPort);

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

  // test-scripts 已完成数据收集，不再自动运行
  // runActionTests(plugin).catch((err) => console.error('[ACTION-TEST] 顶层错误:', err));
  // runRichTextBuilderTest(plugin).catch((err) => console.error('[RICHTEXT-BUILDER-TEST] 顶层错误:', err));
  // runRichTextRemainingTest(plugin).catch((err) => console.error('[RICHTEXT-REMAINING-TEST] 顶层错误:', err));
  // runRichTextMatrixTest(plugin).catch((err) => console.error('[RICHTEXT-MATRIX-TEST] 顶层错误:', err));
  // runPowerupRenderingTest(plugin).catch((err) => console.error('[POWERUP-RENDER] 顶层错误:', err));
}

async function onDeactivate(_: ReactRNPlugin) {
  wsClient?.disconnect();
  wsClient = null;
}

declareIndexPlugin(onActivate, onDeactivate);
