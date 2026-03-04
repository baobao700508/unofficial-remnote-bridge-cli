/**
 * Message Router — 请求路由分发
 *
 * bridge 层的 API 控制器：接收守护进程转发的请求，
 * 根据 action 路由到 services 层对应方法。
 *
 * 依赖方向：bridge/message-router → services（单向）
 */

import type { ReactRNPlugin } from '@remnote/plugin-sdk';
import type { BridgeRequest } from './websocket-client';
import { readRem } from '../services/read-rem';
import { writeRemFields } from '../services/write-rem-fields';

/**
 * 创建消息路由处理器
 *
 * 返回一个函数供 WebSocketClient.setMessageHandler() 使用。
 * 按 action 分发到 services 层对应方法（同态命名）。
 */
export function createMessageRouter(plugin: ReactRNPlugin): (request: BridgeRequest) => Promise<unknown> {
  return async (request: BridgeRequest): Promise<unknown> => {
    switch (request.action) {
      case 'read_rem':
        return readRem(plugin, request.payload as { remId: string });
      case 'write_rem_fields':
        return writeRemFields(plugin, request.payload as { remId: string; changes: Record<string, unknown> });

      default:
        throw new Error(`未实现的 action: ${request.action}`);
    }
  };
}
