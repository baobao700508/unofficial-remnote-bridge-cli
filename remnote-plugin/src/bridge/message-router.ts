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
import { readTree } from '../services/read-tree';
import { readGlobe } from '../services/read-globe';
import { readContext } from '../services/read-context';
import { writeRemFields } from '../services/write-rem-fields';
import { createRem } from '../services/create-rem';
import { deleteRem } from '../services/delete-rem';
import { moveRem } from '../services/move-rem';
import { reorderChildren } from '../services/reorder-children';
import { search } from '../services/search';

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
        return readRem(plugin, request.payload as { remId: string; includePowerup?: boolean });
      case 'read_tree':
        return readTree(plugin, request.payload as { remId: string; depth?: number; maxNodes?: number; maxSiblings?: number; ancestorLevels?: number; includePowerup?: boolean });
      case 'write_rem_fields':
        return writeRemFields(plugin, request.payload as { remId: string; changes: Record<string, unknown> });
      case 'create_rem':
        return createRem(plugin, request.payload as { content: string; parentId: string; position: number });
      case 'delete_rem':
        return deleteRem(plugin, request.payload as { remId: string });
      case 'move_rem':
        return moveRem(plugin, request.payload as { remId: string; newParentId: string; position: number });
      case 'reorder_children':
        return reorderChildren(plugin, request.payload as { parentId: string; order: string[] });
      case 'read_globe':
        return readGlobe(plugin, request.payload as { depth?: number; maxNodes?: number; maxSiblings?: number });
      case 'read_context':
        return readContext(plugin, request.payload as { mode?: 'focus' | 'page'; ancestorLevels?: number; maxNodes?: number; maxSiblings?: number; depth?: number });
      case 'search':
        return search(plugin, request.payload as { query: string; numResults?: number });

      default:
        throw new Error(`未实现的 action: ${request.action}`);
    }
  };
}
