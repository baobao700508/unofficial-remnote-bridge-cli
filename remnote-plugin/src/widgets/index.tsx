import { declareIndexPlugin, type ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import '../style.css';
import '../index.css';
import { DEFAULT_PLUGIN_VERSION } from '../settings';
import { MultiConnectionManager } from '../bridge/multi-connection-manager';
import { createMessageRouter } from '../bridge/message-router';

let connectionManager: MultiConnectionManager | null = null;
// 本地日志缓冲区：避免 onLog 并发读写 plugin.storage 的竞态
const logBuffer: Array<{ time: number; message: string; level: string }> = [];
let logFlushPending = false;

async function onActivate(plugin: ReactRNPlugin) {
  // 注册 Bridge Widget（右侧边栏）
  await plugin.app.registerWidget('bridge_widget', WidgetLocation.RightSidebar, {
    dimensions: { height: 'auto', width: '100%' },
    widgetTabIcon: 'https://cdn.jsdelivr.net/npm/lucide-static@0.460.0/icons/globe.svg',
  });

  // 自动发现孪生槽位：Plugin 由 daemon 的 static-server 提供服务，
  // fetch('/api/discovery') 是同源请求，返回 daemon 的 slotIndex 等信息
  let twinSlotIndex = 0;
  let instanceName = '';
  let configPort = 29102;
  try {
    const resp = await fetch('/api/discovery');
    if (resp.ok) {
      const data = await resp.json();
      if (typeof data.slotIndex === 'number') {
        twinSlotIndex = data.slotIndex;
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

  // 创建 MultiConnectionManager
  connectionManager = new MultiConnectionManager({
    twinSlotIndex,
    pluginVersion: DEFAULT_PLUGIN_VERSION,
    sdkReady: true,
    onSlotsChange: (slots) => {
      void plugin.storage.setSession('bridge-slots', slots);
    },
    onLog: (slotIndex, message, level) => {
      logBuffer.push({ time: Date.now(), message: `[${slotIndex}] ${message}`, level });
      if (logBuffer.length > 50) logBuffer.splice(0, logBuffer.length - 50);
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

  // 路由守护进程转发的请求到 services 层（所有连接共享同一个 router）
  connectionManager.setMessageHandler(createMessageRouter(plugin));

  connectionManager.start();
}

async function onDeactivate(_: ReactRNPlugin) {
  connectionManager?.stop();
  connectionManager = null;
}

declareIndexPlugin(onActivate, onDeactivate);
