/**
 * Bridge Widget — 状态 + AI 聊天（Tab 切换）
 *
 * WebSocket 连接在 index.tsx 的 onActivate 中建立，
 * 此 widget 从 plugin.storage 读取状态和聊天数据。
 */

import { renderWidget, usePlugin } from '@remnote/plugin-sdk';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { ConnectionStatus, ChatStreamChunk, ChatSessionResponse } from '../bridge/websocket-client';
import { wsClient } from './index';

// ── Types ──

interface StoredLog {
  time: number;
  message: string;
  level: string;
}

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: Array<{ name: string; status: string; args?: string; result?: string }>;
}

interface SessionInfo {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
}

type Tab = 'status' | 'chat';

// ── Shared styles ──

const tabStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '6px 0',
  border: 'none',
  borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
  background: 'none',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: active ? 600 : 400,
  color: active ? '#3b82f6' : '#6b7280',
});

// ── Status Tab (原有功能) ──

function StatusTab({ status, logs }: { status: ConnectionStatus; logs: StoredLog[] }) {
  const statusConfig = {
    connected: { color: '#22c55e', bg: '#dcfce7', icon: '\u25cf', text: '已连接' },
    connecting: { color: '#f59e0b', bg: '#fef3c7', icon: '\u25d0', text: '连接中...' },
    disconnected: { color: '#ef4444', bg: '#fee2e2', icon: '\u25cb', text: '未连接' },
  };
  const cs = statusConfig[status];

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '8px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '4px 8px', borderRadius: '12px',
          backgroundColor: cs.bg, color: cs.color, fontSize: '12px', fontWeight: 500,
        }}>
          <span>{cs.icon}</span><span>{cs.text}</span>
        </div>
      </div>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', backgroundColor: '#f9fafb' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, padding: '8px 10px', borderBottom: '1px solid #e5e7eb', color: '#6b7280' }}>
          日志
        </div>
        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
          {logs.length === 0 ? (
            <div style={{ padding: '12px', color: '#9ca3af', textAlign: 'center' }}>暂无日志</div>
          ) : (
            logs.slice().reverse().map((log, i) => (
              <div key={i} style={{ padding: '6px 10px', borderBottom: i < logs.length - 1 ? '1px solid #e5e7eb' : 'none', fontSize: '11px' }}>
                <span style={{ color: '#9ca3af' }}>
                  {new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span style={{
                  marginLeft: '8px',
                  color: log.level === 'error' ? '#ef4444' : log.level === 'warn' ? '#f59e0b' : '#374151',
                }}>
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
      <button
        onClick={() => window.open('http://127.0.0.1:3003', '_blank')}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          width: '100%', marginTop: '12px', padding: '8px 0',
          background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px',
          cursor: 'pointer', fontSize: '13px', color: '#374151',
        }}
      >
        <span style={{ fontSize: '16px' }}>⚙</span>
        <span>打开配置页面</span>
      </button>
    </>
  );
}

// ── Chat Tab ──

function ChatTab({ plugin }: { plugin: ReturnType<typeof usePlugin> }) {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [activeToolCalls, setActiveToolCalls] = useState<Array<{ name: string; status: string }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastChunkTs = useRef(0);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Poll for chat stream chunks
  useEffect(() => {
    let active = true;

    async function pollChat() {
      if (!active) return;
      const chunk = await plugin.storage.getSession('chat-stream-chunk') as (ChatStreamChunk & { _ts: number }) | null;
      if (!active || !chunk || chunk._ts <= lastChunkTs.current) return;
      lastChunkTs.current = chunk._ts;

      if (chunk.sessionId !== currentSessionId) return;

      if (chunk.toolCall) {
        setActiveToolCalls(prev => {
          const existing = prev.findIndex(t => t.name === chunk.toolCall!.name);
          if (chunk.toolCall!.status === 'done' && existing >= 0) {
            return prev.filter((_, i) => i !== existing);
          }
          if (existing >= 0) {
            return prev.map((t, i) => i === existing ? { name: chunk.toolCall!.name, status: chunk.toolCall!.status } : t);
          }
          return [...prev, { name: chunk.toolCall!.name, status: chunk.toolCall!.status }];
        });
      }

      if (chunk.chunk) {
        setStreamingContent(prev => prev + chunk.chunk);
      }

      if (chunk.done) {
        setIsStreaming(false);
        setStreamingContent(prev => {
          if (prev) {
            setMessages(msgs => [...msgs, { role: 'assistant', content: prev }]);
          }
          return '';
        });
        setActiveToolCalls([]);
        if (chunk.error) {
          setMessages(msgs => [...msgs, { role: 'assistant', content: `Error: ${chunk.error}` }]);
        }
      }
    }

    const timer = setInterval(pollChat, 100);
    return () => { active = false; clearInterval(timer); };
  }, [plugin, currentSessionId]);

  // Poll for session responses
  useEffect(() => {
    let active = true;
    let lastTs = 0;

    async function pollSessions() {
      if (!active) return;
      const resp = await plugin.storage.getSession('chat-session-response') as (ChatSessionResponse & { _ts: number }) | null;
      if (!active || !resp || resp._ts <= lastTs) return;
      lastTs = resp._ts;

      if (resp.requestAction === 'list' && resp.sessions) {
        setSessions(resp.sessions);
      } else if (resp.requestAction === 'create' && resp.session) {
        setCurrentSessionId(resp.session.id);
        setMessages([]);
        // Refresh list
        wsClient?.sendChatSessionRequest('list');
      } else if (resp.requestAction === 'get_history' && resp.history) {
        setMessages(resp.history.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })));
      }
    }

    const timer = setInterval(pollSessions, 300);
    return () => { active = false; clearInterval(timer); };
  }, [plugin]);

  // Load sessions on mount
  useEffect(() => {
    wsClient?.sendChatSessionRequest('list');
  }, []);

  const handleSend = useCallback(() => {
    if (!input.trim() || isStreaming || !wsClient) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsStreaming(true);
    setStreamingContent('');
    setActiveToolCalls([]);

    if (!currentSessionId) {
      // Create session first, then send
      wsClient.sendChatSessionRequest('create');
      // We'll send the message after session is created
      // Store pending message
      setTimeout(() => {
        if (wsClient) {
          const sid = currentSessionId;
          if (sid) wsClient.sendChat(sid, userMsg);
        }
      }, 1000);
      return;
    }

    wsClient.sendChat(currentSessionId, userMsg);
  }, [input, isStreaming, currentSessionId]);

  const handleNewSession = useCallback(() => {
    wsClient?.sendChatSessionRequest('create');
  }, []);

  const handleSelectSession = useCallback((sid: string) => {
    setCurrentSessionId(sid);
    setMessages([]);
    wsClient?.sendChatSessionRequest('get_history', sid);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
      {/* Session selector */}
      <div style={{ display: 'flex', gap: '4px', padding: '4px 0', borderBottom: '1px solid #e5e7eb' }}>
        <select
          value={currentSessionId ?? ''}
          onChange={e => e.target.value && handleSelectSession(e.target.value)}
          style={{
            flex: 1, padding: '4px 6px', fontSize: '11px',
            border: '1px solid #e5e7eb', borderRadius: '4px', background: '#fff',
          }}
        >
          <option value="">选择会话...</option>
          {sessions.map(s => (
            <option key={s.id} value={s.id}>
              {s.title} ({s.messageCount})
            </option>
          ))}
        </select>
        <button
          onClick={handleNewSession}
          style={{
            padding: '4px 8px', fontSize: '11px',
            border: '1px solid #e5e7eb', borderRadius: '4px',
            background: '#f9fafb', cursor: 'pointer',
          }}
        >
          +
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              padding: '6px 8px', marginBottom: '6px',
              backgroundColor: msg.role === 'user' ? '#eff6ff' : '#f9fafb',
              borderRadius: '6px', fontSize: '12px',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', marginBottom: '2px' }}>
              {msg.role === 'user' ? 'You' : 'AI'}
            </div>
            {msg.content}
          </div>
        ))}

        {/* Streaming content */}
        {isStreaming && (
          <div style={{ padding: '6px 8px', backgroundColor: '#f9fafb', borderRadius: '6px', fontSize: '12px' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', marginBottom: '2px' }}>AI</div>
            {activeToolCalls.length > 0 && (
              <div style={{ marginBottom: '4px' }}>
                {activeToolCalls.map((tc, i) => (
                  <div key={i} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '2px 6px', marginRight: '4px', marginBottom: '2px',
                    backgroundColor: '#fef3c7', borderRadius: '4px',
                    fontSize: '10px', color: '#92400e',
                  }}>
                    {tc.status === 'calling' ? '...' : '✓'} {tc.name}
                  </div>
                ))}
              </div>
            )}
            <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {streamingContent || (activeToolCalls.length > 0 ? '' : '...')}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: '4px', padding: '8px 0 0', borderTop: '1px solid #e5e7eb' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={currentSessionId ? '输入消息...' : '请先创建会话'}
          disabled={!currentSessionId || isStreaming}
          style={{
            flex: 1, padding: '6px 8px', fontSize: '12px',
            border: '1px solid #e5e7eb', borderRadius: '4px',
            outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isStreaming || !currentSessionId}
          style={{
            padding: '6px 12px', fontSize: '12px',
            border: 'none', borderRadius: '4px',
            background: !input.trim() || isStreaming || !currentSessionId ? '#e5e7eb' : '#3b82f6',
            color: '#fff', cursor: 'pointer',
          }}
        >
          发送
        </button>
      </div>
    </div>
  );
}

// ── Main Widget ──

function BridgeWidget() {
  const plugin = usePlugin();
  const [activeTab, setActiveTab] = useState<Tab>('status');
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [logs, setLogs] = useState<StoredLog[]>([]);
  const [aiChatEnabled, setAiChatEnabled] = useState(false);

  // Poll status and logs
  useEffect(() => {
    let active = true;

    async function poll() {
      if (!active) return;
      const s = await plugin.storage.getSession('bridge-status');
      const l = await plugin.storage.getSession('bridge-logs');
      if (active) {
        setStatus((s as ConnectionStatus) ?? 'disconnected');
        setLogs((l as StoredLog[]) ?? []);
      }
    }

    poll();
    const timer = setInterval(poll, 1000);
    return () => { active = false; clearInterval(timer); };
  }, [plugin]);

  // Check if AI Chat is available (from status response logs)
  useEffect(() => {
    // Simple heuristic: if there's a log mentioning "AI Chat 已启动", enable the tab
    const hasAiChat = logs.some(l => l.message.includes('AI Chat') && l.message.includes('启动'));
    setAiChatEnabled(hasAiChat);
  }, [logs]);

  return (
    <div style={{ padding: '12px', fontFamily: 'system-ui, sans-serif', fontSize: '13px' }}>
      {/* Header */}
      <h3 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 600 }}>RemNote Bridge</h3>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '8px' }}>
        <button onClick={() => setActiveTab('status')} style={tabStyle(activeTab === 'status')}>
          状态
        </button>
        {aiChatEnabled && (
          <button onClick={() => setActiveTab('chat')} style={tabStyle(activeTab === 'chat')}>
            聊天
          </button>
        )}
      </div>

      {/* Tab content */}
      {activeTab === 'status' && <StatusTab status={status} logs={logs} />}
      {activeTab === 'chat' && aiChatEnabled && <ChatTab plugin={plugin} />}
    </div>
  );
}

renderWidget(BridgeWidget);
