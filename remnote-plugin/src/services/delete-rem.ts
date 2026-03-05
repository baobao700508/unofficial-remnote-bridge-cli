/**
 * delete-rem service — 删除 Rem
 *
 * 内部原子操作：delete_rem (action) → delete-rem.ts (文件) → deleteRem (函数)
 */

import type { ReactRNPlugin } from '@remnote/plugin-sdk';

export interface DeleteRemPayload {
  remId: string;
}

/**
 * 删除指定 Rem。
 *
 * @throws Error — Rem 不存在
 */
export async function deleteRem(
  plugin: ReactRNPlugin,
  payload: DeleteRemPayload,
): Promise<{ ok: true }> {
  const rem = await plugin.rem.findOne(payload.remId);
  if (!rem) {
    throw new Error(`Rem not found: ${payload.remId}`);
  }

  await rem.remove();
  return { ok: true };
}
