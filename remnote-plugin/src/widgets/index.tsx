import { declareIndexPlugin, type ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import '../style.css';
import '../index.css';
import { SETTING_WS_URL, DEFAULT_WS_URL } from '../settings';

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
  });
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
