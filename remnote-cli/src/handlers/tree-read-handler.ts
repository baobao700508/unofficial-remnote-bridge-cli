/**
 * TreeReadHandler — read-tree 请求的业务编排
 *
 * 职责：
 * 1. 转发到 Plugin 获取序列化的 Markdown 大纲
 * 2. 以 'tree:' + remId 为 key 缓存大纲文本
 * 3. 返回大纲结果给 CLI command
 */

import { RemCache } from './rem-cache';

export interface TreeReadResult {
  rootId: string;
  depth: number;
  nodeCount: number;
  outline: string;
  powerupFiltered?: { tags: number; children: number };
}

export class TreeReadHandler {
  constructor(
    private cache: RemCache,
    private forwardToPlugin: (action: string, payload: Record<string, unknown>) => Promise<unknown>,
    private onLog?: (message: string, level: 'info' | 'warn' | 'error') => void,
  ) {}

  async handleReadTree(payload: Record<string, unknown>): Promise<TreeReadResult> {
    const remId = payload.remId as string;
    if (!remId) {
      throw new Error('缺少 remId 参数');
    }

    const depth = (payload.depth as number) ?? 3;
    const maxNodes = (payload.maxNodes as number) ?? 200;
    const maxSiblings = (payload.maxSiblings as number) ?? 20;
    const ancestorLevels = (payload.ancestorLevels as number) ?? 0;
    const includePowerup = (payload.includePowerup as boolean) ?? false;

    // 检查旧缓存
    const cacheKey = 'tree:' + remId;
    const previousCachedAt = this.cache.getCreatedAt(cacheKey);

    // 转发到 Plugin 的 read_tree service
    const result = await this.forwardToPlugin('read_tree', {
      remId, depth, maxNodes, maxSiblings, ancestorLevels, includePowerup,
    }) as TreeReadResult;

    // 缓存大纲文本 + 读取参数（供 edit-tree 乐观并发检测时复现相同查询）
    this.cache.set(cacheKey, result.outline);
    this.cache.set('tree-depth:' + remId, String(depth));
    this.cache.set('tree-maxNodes:' + remId, String(maxNodes));
    this.cache.set('tree-maxSiblings:' + remId, String(maxSiblings));
    this.onLog?.(
      `缓存树 ${remId.slice(0, 8)}... (${result.nodeCount} 节点, ${result.outline.length} bytes)`,
      'info',
    );

    // 附加缓存覆盖提示
    if (previousCachedAt) {
      (result as TreeReadResult & { _cacheOverridden?: unknown })._cacheOverridden = {
        id: remId,
        previousCachedAt,
      };
    }

    return result;
  }
}
