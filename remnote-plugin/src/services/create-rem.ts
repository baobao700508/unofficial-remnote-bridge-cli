/**
 * create-rem service — 创建新 Rem
 *
 * 内部原子操作：create_rem (action) → create-rem.ts (文件) → createRem (函数)
 *
 * 使用 createSingleRemWithMarkdown 一步到位创建：
 * - 自动解析 Markdown 中的闪卡语法（::, >>, <<, <>, ;;, >>>, {{}} 等）
 * - 自动设置 type、backText、practiceDirection 等属性
 * - 自动设置父节点
 */

import type { ReactRNPlugin } from '@remnote/plugin-sdk';

export interface CreateRemPayload {
  /** RemNote Markdown 格式的内容 */
  content: string;
  /** 父节点 Rem ID */
  parentId: string;
  /** 在兄弟中的位置（0-based） */
  position: number;
}

export interface CreateRemResult {
  remId: string;
}

/**
 * 创建新 Rem。
 *
 * @throws Error — 父节点不存在、创建失败
 */
export async function createRem(
  plugin: ReactRNPlugin,
  payload: CreateRemPayload,
): Promise<CreateRemResult> {
  const { content, parentId, position } = payload;

  // 验证父节点存在
  const parent = await plugin.rem.findOne(parentId);
  if (!parent) {
    throw new Error(`Parent Rem not found: ${parentId}`);
  }

  // 使用 createSingleRemWithMarkdown 创建（自动解析闪卡语法）
  const newRem = await plugin.rem.createSingleRemWithMarkdown(content, parentId);
  if (!newRem) {
    throw new Error(`Failed to create Rem with content: ${content.slice(0, 50)}`);
  }

  // 设置位置（createSingleRemWithMarkdown 默认追加到末尾）
  // 如果 position 不是末尾，需要用 setParent 调整
  const siblings = await parent.getChildrenRem();
  const currentIndex = siblings.findIndex(r => r._id === newRem._id);
  if (currentIndex !== -1 && currentIndex !== position && position < siblings.length) {
    await newRem.setParent(parent, position);
  }

  return { remId: newRem._id };
}
