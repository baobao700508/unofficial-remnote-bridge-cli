/**
 * Bridge Widget — 显示守护进程连接状态（纯展示）
 *
 * WebSocket 连接在 index.tsx 的 onActivate 中建立，
 * 此 widget 每秒从 plugin.storage 读取并显示状态和日志。
 */

import { renderWidget, usePlugin } from '@remnote/plugin-sdk';
import React, { useEffect, useState } from 'react';
import type { ConnectionStatus } from '../bridge/websocket-client';

interface StoredLog {
  time: number;
  message: string;
  level: string;
}

function BridgeWidget() {
  const plugin = usePlugin();
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [logs, setLogs] = useState<StoredLog[]>([]);
  const [instanceName, setInstanceName] = useState<string>('');
  const [configPort, setConfigPort] = useState<number>(29102);

  // 每秒轮询 plugin.storage 获取最新状态
  useEffect(() => {
    let active = true;

    async function poll() {
      if (!active) return;
      const s = await plugin.storage.getSession('bridge-status');
      const l = await plugin.storage.getSession('bridge-logs');
      const inst = await plugin.storage.getSession('bridge-instance');
      const cp = await plugin.storage.getSession('bridge-config-port');
      if (active) {
        setStatus((s as ConnectionStatus) ?? 'disconnected');
        setLogs((l as StoredLog[]) ?? []);
        setInstanceName((inst as string) ?? '');
        setConfigPort((cp as number) ?? 29102);
      }
    }

    poll();
    const timer = setInterval(poll, 1000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [plugin]);

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
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
          RemNote Bridge{instanceName ? ` (${instanceName})` : ''}
        </h3>
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
                    {new Date(log.time).toLocaleTimeString([], {
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

      {/* 配置按钮 */}
      <button
        onClick={() => window.open(`http://127.0.0.1:${configPort}`, '_blank')}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          width: '100%',
          marginTop: '12px',
          padding: '8px 0',
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '13px',
          color: '#374151',
        }}
      >
        <span style={{ fontSize: '16px' }}>⚙</span>
        <span>打开配置页面</span>
      </button>
    </div>
  );
}

renderWidget(BridgeWidget);
