/**
 * move-rem service — 移动 Rem（改变父节点）
 *
 * 内部原子操作：move_rem (action) → move-rem.ts (文件) → moveRem (函数)
 */

import type { ReactRNPlugin } from '@remnote/plugin-sdk';

export interface MoveRemPayload {
  remId: string;
  newParentId: string;
  /** 在新父节点 children 中的位置（0-based） */
  position: number;
}

/**
 * 将 Rem 移动到新的父节点下。
 *
 * @throws Error — Rem 或新父节点不存在
 */
export async function moveRem(
  plugin: ReactRNPlugin,
  payload: MoveRemPayload,
): Promise<{ ok: true }> {
  const { remId, newParentId, position } = payload;

  const rem = await plugin.rem.findOne(remId);
  if (!rem) {
    throw new Error(`Rem not found: ${remId}`);
  }

  const newParent = await plugin.rem.findOne(newParentId);
  if (!newParent) {
    throw new Error(`New parent Rem not found: ${newParentId}`);
  }

  await rem.setParent(newParent, position);
  return { ok: true };
}
