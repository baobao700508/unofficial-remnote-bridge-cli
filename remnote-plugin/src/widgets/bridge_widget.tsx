/**
 * Bridge Widget — 显示多 daemon 连接状态（纯展示）
 *
 * 多连接管理在 index.tsx 的 onActivate 中建立，
 * 此 widget 每秒从 plugin.storage 读取并显示所有槽位状态和日志。
 */

import { renderWidget, usePlugin } from '@remnote/plugin-sdk';
import React, { useEffect, useState } from 'react';
import type { SlotState, DisconnectReason } from '../bridge/multi-connection-manager';

interface StoredLog {
  time: number;
  message: string;
  level: string;
}

/** 未连接时的提示文案 */
function getDisconnectHint(reason: DisconnectReason): string {
  switch (reason) {
    case 'preempted':
      return '被孪生 Plugin 抢占，已断开';
    case 'twin_occupied':
      return '孪生 Plugin 已连接，当前无法连接';
    case 'other_occupied':
      return '已有其他 Plugin 连接，等待重试';
    case 'not_started':
    default:
      return '该实例未启动，或端口被占用';
  }
}

function BridgeWidget() {
  const plugin = usePlugin();
  const [slots, setSlots] = useState<SlotState[]>([]);
  const [logs, setLogs] = useState<StoredLog[]>([]);
  const [instanceName, setInstanceName] = useState<string>('');
  const [configPort, setConfigPort] = useState<number>(29102);

  // 每秒轮询 plugin.storage 获取最新状态
  useEffect(() => {
    let active = true;

    async function poll() {
      if (!active) return;
      const s = await plugin.storage.getSession('bridge-slots');
      const l = await plugin.storage.getSession('bridge-logs');
      const inst = await plugin.storage.getSession('bridge-instance');
      const cp = await plugin.storage.getSession('bridge-config-port');
      if (active) {
        setSlots((s as SlotState[]) ?? []);
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

  const connectedCount = slots.filter(s => s.status === 'connected').length;

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
            backgroundColor: connectedCount > 0 ? '#dcfce7' : '#fee2e2',
            color: connectedCount > 0 ? '#22c55e' : '#ef4444',
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          <span>{connectedCount > 0 ? '\u25cf' : '\u25cb'}</span>
          <span>{connectedCount}</span>
        </div>
      </div>

      {/* 连接状态 */}
      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          backgroundColor: '#f9fafb',
          marginBottom: '12px',
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
          连接状态
        </div>
        {slots.map((slot) => (
          <div key={slot.slotIndex}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                borderBottom: '1px solid #f3f4f6',
              }}
            >
              <span style={{ fontSize: '12px' }}>
                {slot.isTwin ? '\u2605 ' : '  '}
                槽位 {slot.slotIndex} ({slot.wsPort})
              </span>
              <span
                style={{
                  fontSize: '11px',
                  color:
                    slot.status === 'connected'
                      ? '#22c55e'
                      : slot.status === 'connecting'
                        ? '#f59e0b'
                        : '#9ca3af',
                }}
              >
                {slot.status === 'connected'
                  ? '\u25cf 已连接'
                  : slot.status === 'connecting'
                    ? '\u25d0 连接中...'
                    : '\u25cb 未连接'}
              </span>
            </div>
            {slot.status === 'disconnected' && (
              <div
                style={{
                  padding: '2px 10px 6px 26px',
                  fontSize: '10px',
                  color: '#9ca3af',
                }}
              >
                {getDisconnectHint(slot.disconnectReason)}
              </div>
            )}
          </div>
        ))}
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
