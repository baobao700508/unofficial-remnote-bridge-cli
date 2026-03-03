/**
 * Bridge Widget — 显示守护进程连接状态
 *
 * 在 RemNote 右侧边栏显示：
 * - 连接状态指示灯
 * - 重连按钮
 * - 简单日志
 */

import { renderWidget, usePlugin, useTracker } from '@remnote/plugin-sdk';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { WebSocketClient, ConnectionStatus, BridgeRequest } from '../bridge/websocket-client';
import { SETTING_WS_URL, DEFAULT_WS_URL, DEFAULT_PLUGIN_VERSION } from '../settings';

interface LogEntry {
  timestamp: Date;
  message: string;
  level: 'info' | 'warn' | 'error';
}

function BridgeWidget() {
  const plugin = usePlugin();
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const wsClientRef = useRef<WebSocketClient | null>(null);

  const wsUrl = useTracker(() => plugin.settings.getSetting<string>(SETTING_WS_URL), []);
  const currentWsUrl = wsUrl ?? DEFAULT_WS_URL;

  const addLog = useCallback((message: string, level: LogEntry['level'] = 'info') => {
    setLogs((prev) => {
      const newLogs = [...prev, { timestamp: new Date(), message, level }];
      return newLogs.slice(-30);
    });
  }, []);

  // 处理来自守护进程的请求（未来扩展用）
  const handleRequest = useCallback(
    async (request: BridgeRequest): Promise<unknown> => {
      addLog(`收到请求: ${request.action}`);
      // 当前阶段暂不处理实际请求，后续添加 RemAdapter
      throw new Error(`未实现的 action: ${request.action}`);
    },
    [addLog],
  );

  // 初始化 WebSocket 连接
  useEffect(() => {
    if (wsClientRef.current) {
      wsClientRef.current.disconnect();
    }

    const client = new WebSocketClient({
      url: currentWsUrl,
      pluginVersion: DEFAULT_PLUGIN_VERSION,
      sdkReady: true, // Plugin SDK 在 widget 渲染时已就绪
      maxReconnectAttempts: 10,
      initialReconnectDelay: 1000,
      maxReconnectDelay: 30000,
      onStatusChange: setStatus,
      onLog: (message, level) => addLog(message, level),
    });

    client.setMessageHandler(handleRequest);
    wsClientRef.current = client;
    client.connect();
    addLog(`正在连接 ${currentWsUrl}...`);

    return () => {
      client.disconnect();
    };
  }, [handleRequest, addLog, currentWsUrl]);

  const handleReconnect = useCallback(() => {
    addLog('手动重连');
    wsClientRef.current?.reconnect();
  }, [addLog]);

  const statusConfig = {
    connected: { color: '#22c55e', bg: '#dcfce7', icon: '\u25cf', text: '已连接' },
    connecting: { color: '#f59e0b', bg: '#fef3c7', icon: '\u25d0', text: '连接中...' },
    disconnected: { color: '#ef4444', bg: '#fee2e2', icon: '\u25cb', text: '未连接' },
  };

  const currentStatus = statusConfig[status];

  return (
    <div style={{ padding: '12px', fontFamily: 'system-ui, sans-serif', fontSize: '13px' }}>
      {/* 头部 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>RemNote Bridge</h3>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px',
            borderRadius: '12px',
            backgroundColor: currentStatus.bg,
            color: currentStatus.color,
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          <span>{currentStatus.icon}</span>
          <span>{currentStatus.text}</span>
        </div>
      </div>

      {/* 重连按钮 */}
      {status !== 'connected' && (
        <button
          onClick={handleReconnect}
          style={{
            width: '100%',
            padding: '8px',
            marginBottom: '12px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            backgroundColor: '#f9fafb',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          重新连接
        </button>
      )}

      {/* 日志 */}
      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          backgroundColor: '#f9fafb',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '8px 10px',
            borderBottom: '1px solid #e5e7eb',
            color: '#6b7280',
          }}
        >
          日志
        </div>
        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
          {logs.length === 0 ? (
            <div style={{ padding: '12px', color: '#9ca3af', textAlign: 'center' }}>暂无日志</div>
          ) : (
            logs
              .slice()
              .reverse()
              .map((log, index) => (
                <div
                  key={index}
                  style={{
                    padding: '6px 10px',
                    borderBottom: index < logs.length - 1 ? '1px solid #e5e7eb' : 'none',
                    fontSize: '11px',
                  }}
                >
                  <span style={{ color: '#9ca3af' }}>
                    {log.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                  <span
                    style={{
                      marginLeft: '8px',
                      color:
                        log.level === 'error'
                          ? '#ef4444'
                          : log.level === 'warn'
                            ? '#f59e0b'
                            : '#374151',
                    }}
                  >
                    {log.message}
                  </span>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}

renderWidget(BridgeWidget);
