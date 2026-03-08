/**
 * remove-from-portal service — 从 Portal 移除引用
 *
 * 同态命名：remove_from_portal (action) → remove-from-portal.ts (文件) → removeFromPortal (函数)
 *
 * 注意调用方向：removeFromPortal() 是在被引用的 Rem 上调用，参数是 Portal Rem。
 */

import type { ReactRNPlugin } from '@remnote/plugin-sdk';

export interface RemoveFromPortalPayload {
  /** Portal Rem ID */
  portalId: string;
  /** 要从 Portal 移除的 Rem ID */
  remId: string;
}

/**
 * 将指定 Rem 从 Portal 的引用列表中移除。
 *
 * @throws Error — Portal 不存在、Rem 不存在
 */
export async function removeFromPortal(
  plugin: ReactRNPlugin,
  payload: RemoveFromPortalPayload,
): Promise<void> {
  const { portalId, remId } = payload;

  const portal = await plugin.rem.findOne(portalId);
  if (!portal) {
    throw new Error(`Portal not found: ${portalId}`);
  }

  const rem = await plugin.rem.findOne(remId);
  if (!rem) {
    throw new Error(`Rem not found: ${remId}`);
  }

  await rem.removeFromPortal(portal);
}
