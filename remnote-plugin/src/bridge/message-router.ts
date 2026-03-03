/**
 * Message Router — 请求路由分发
 *
 * bridge 层的 API 控制器：接收守护进程转发的请求，
 * 根据 action 路由到 services 层对应方法。
 *
 * 依赖方向：bridge/message-router → services（单向）
 */

import type { BridgeRequest } from './websocket-client';

/**
 * 创建消息路由处理器
 *
 * 返回一个函数供 WebSocketClient.setMessageHandler() 使用。
 * 未来实现 services 后，此处按 action 分发到对应 service 方法。
 */
export function createMessageRouter(): (request: BridgeRequest) => Promise<unknown> {
  return async (request: BridgeRequest): Promise<unknown> => {
    switch (request.action) {
      // 待实现：
      // case 'read_note':    return readNote(plugin, request.payload);
      // case 'create_note':  return createNote(plugin, request.payload);
      // case 'update_note':  return updateNote(plugin, request.payload);
      // case 'search':       return search(plugin, request.payload);
      // case 'search_by_tag': return searchByTag(plugin, request.payload);
      // case 'append_journal': return appendJournal(plugin, request.payload);

      default:
        throw new Error(`未实现的 action: ${request.action}`);
    }
  };
}
