/**
 * add-to-portal service — 向 Portal 添加引用
 *
 * 同态命名：add_to_portal (action) → add-to-portal.ts (文件) → addToPortal (函数)
 *
 * 注意调用方向：addToPortal() 是在被引用的 Rem 上调用，参数是 Portal Rem。
 */

import type { ReactRNPlugin } from '@remnote/plugin-sdk';

export interface AddToPortalPayload {
  /** Portal Rem ID */
  portalId: string;
  /** 要添加到 Portal 的 Rem ID */
  remId: string;
}

/**
 * 将指定 Rem 添加到 Portal 的引用列表。
 *
 * @throws Error — Portal 不存在、Rem 不存在
 */
export async function addToPortal(
  plugin: ReactRNPlugin,
  payload: AddToPortalPayload,
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

  await rem.addToPortal(portal);
}
