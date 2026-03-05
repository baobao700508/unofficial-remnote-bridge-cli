/**
 * reorder-children service — 重排 children 顺序
 *
 * 内部原子操作：reorder_children (action) → reorder-children.ts (文件) → reorderChildren (函数)
 *
 * SDK 没有 setChildrenOrder API，使用逐个 setParent(parent, position) 实现。
 */

import type { ReactRNPlugin } from '@remnote/plugin-sdk';

export interface ReorderChildrenPayload {
  parentId: string;
  /** 期望的 children 顺序（remId 数组） */
  order: string[];
}

/**
 * 重排父节点下 children 的顺序。
 *
 * 策略：按目标顺序逐个调用 setParent(parent, position) 进行定位。
 * 只移动位置需要变化的 children。
 *
 * @throws Error — 父节点不存在
 */
export async function reorderChildren(
  plugin: ReactRNPlugin,
  payload: ReorderChildrenPayload,
): Promise<{ ok: true }> {
  const { parentId, order } = payload;

  const parent = await plugin.rem.findOne(parentId);
  if (!parent) {
    throw new Error(`Parent Rem not found: ${parentId}`);
  }

  // 获取当前 children 顺序
  const currentChildren = await parent.getChildrenRem();
  const currentOrder = currentChildren.map(r => r._id);

  // 检测实际需要移动的项
  // 按目标顺序逐个放置
  for (let targetPos = 0; targetPos < order.length; targetPos++) {
    const remId = order[targetPos];

    // 重新获取最新顺序（因为每次 setParent 会改变顺序）
    const freshChildren = await parent.getChildrenRem();
    const currentPos = freshChildren.findIndex(r => r._id === remId);

    if (currentPos === -1) {
      // 这个 remId 不在当前 children 中（可能已被移动或删除），跳过
      continue;
    }

    if (currentPos !== targetPos) {
      const rem = freshChildren[currentPos];
      await rem.setParent(parent, targetPos);
    }
  }

  return { ok: true };
}
