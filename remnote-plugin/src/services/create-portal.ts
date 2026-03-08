/**
 * create-portal service — 创建 Portal Rem
 *
 * 同态命名：create_portal (action) → create-portal.ts (文件) → createPortal (函数)
 *
 * Portal 只能通过 plugin.rem.createPortal() 创建，不能通过 setType() 将已有 Rem 转为 Portal。
 */

import type { ReactRNPlugin } from '@remnote/plugin-sdk';

export interface CreatePortalPayload {
  /** 父节点 Rem ID */
  parentId: string;
  /** 在兄弟中的位置（0-based），可选 */
  position?: number;
}

export interface CreatePortalResult {
  remId: string;
}

/**
 * 创建空 Portal 并设置父节点。
 *
 * @throws Error — 创建失败、父节点不存在
 */
export async function createPortal(
  plugin: ReactRNPlugin,
  payload: CreatePortalPayload,
): Promise<CreatePortalResult> {
  const { parentId, position } = payload;

  // 创建空 Portal
  const portal = await plugin.rem.createPortal();
  if (!portal) {
    throw new Error('Failed to create portal');
  }

  // 设置父节点和位置
  const parent = await plugin.rem.findOne(parentId);
  if (!parent) {
    throw new Error(`Parent Rem not found: ${parentId}`);
  }
  await portal.setParent(parent, position);

  return { remId: portal._id };
}
