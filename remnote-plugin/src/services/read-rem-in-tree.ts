/**
 * read-rem-in-tree service — read_tree + 对每个节点 buildRemObject
 *
 * 同态命名：read_rem_in_tree (action) → read-rem-in-tree.ts (文件) → readRemInTree (函数)
 */

import type { ReactRNPlugin } from '@remnote/plugin-sdk';
import type { RemObject } from '../types';
import { readTree, type ReadTreePayload, type ReadTreeResult } from './read-tree';
import { buildRemObject } from './read-rem';

export interface ReadRemInTreePayload extends ReadTreePayload {}

export interface ReadRemInTreeResult extends ReadTreeResult {
  /** remId → RemObject 的扁平映射 */
  remObjects: Record<string, RemObject & { powerupFiltered?: { tags: number; children: number } }>;
}

/**
 * 读取 Rem 子树大纲 + 对树中每个节点构建完整 RemObject。
 *
 * @throws Error — Rem 不存在、节点数超限
 */
export async function readRemInTree(
  plugin: ReactRNPlugin,
  payload: ReadRemInTreePayload,
): Promise<ReadRemInTreeResult> {
  // 1. 获取 outline + nodeRemIds（复用 readTree）
  const treeResult = await readTree(plugin, payload);

  // 2. 用 readTree 遍历时收集的 nodeRemIds，直接并行 buildRemObject
  const includePowerup = payload.includePowerup ?? false;
  const remObjects: ReadRemInTreeResult['remObjects'] = {};

  await Promise.all(treeResult.nodeRemIds.map(async (id) => {
    const rem = await plugin.rem.findOne(id);
    if (rem) {
      remObjects[id] = await buildRemObject(plugin, rem, { includePowerup });
    }
  }));

  return { ...treeResult, remObjects };
}
