/**
 * TreeRemReadHandler — read-rem-in-tree 请求的业务编排
 *
 * 职责：
 * 1. 转发到 Plugin 获取 outline + remObjects
 * 2. 缓存 tree:{remId} + 参数（供 edit_tree 使用）
 * 3. 缓存 rem:{nodeRemId}（供 edit_rem 使用）
 * 4. 对每个 RemObject 应用字段过滤
 */

import type { DefaultsConfig } from '../config.js';
import { DEFAULT_DEFAULTS } from '../config.js';
import { RemCache } from './rem-cache.js';
import { filterRemFields } from './rem-field-filter.js';

export interface TreeRemReadResult {
  rootId: string;
  depth: number;
  nodeCount: number;
  outline: string;
  remObjects: Record<string, Record<string, unknown>>;
  ancestors?: Array<{ id: string; name: string; childrenCount: number; isDocument: boolean; isTopLevel?: boolean }>;
  powerupFiltered?: { tags: number; children: number };
}

export class TreeRemReadHandler {
  private defaults: DefaultsConfig;

  constructor(
    private cache: RemCache,
    private forwardToPlugin: (action: string, payload: Record<string, unknown>) => Promise<unknown>,
    private onLog?: (message: string, level: 'info' | 'warn' | 'error') => void,
    defaults?: DefaultsConfig,
  ) {
    this.defaults = defaults ?? DEFAULT_DEFAULTS;
  }

  async handleReadRemInTree(payload: Record<string, unknown>): Promise<TreeRemReadResult> {
    const remId = payload.remId as string;
    if (!remId) {
      throw new Error('缺少 remId 参数');
    }

    const depth = (payload.depth as number) ?? this.defaults.readTreeDepth;
    const maxNodes = (payload.maxNodes as number) ?? this.defaults.readRemInTreeMaxNodes;
    const maxSiblings = (payload.maxSiblings as number) ?? this.defaults.maxSiblings;
    const ancestorLevels = (payload.ancestorLevels as number) ?? this.defaults.readTreeAncestorLevels;
    const includePowerup = (payload.includePowerup as boolean) ?? this.defaults.readTreeIncludePowerup;

    // 检查旧缓存
    const treeCacheKey = 'tree:' + remId;
    const previousTreeCachedAt = this.cache.getCreatedAt(treeCacheKey);

    // 转发到 Plugin
    const result = await this.forwardToPlugin('read_rem_in_tree', {
      remId, depth, maxNodes, maxSiblings, ancestorLevels, includePowerup,
    }) as TreeRemReadResult & { nodeRemIds?: unknown };
    // 剥离内部字段 nodeRemIds（不暴露给 CLI 输出）
    delete result.nodeRemIds;

    // 缓存 tree outline + 参数（供 edit_tree 使用）
    this.cache.set(treeCacheKey, result.outline);
    this.cache.set('tree-depth:' + remId, String(depth));
    this.cache.set('tree-maxNodes:' + remId, String(maxNodes));
    this.cache.set('tree-maxSiblings:' + remId, String(maxSiblings));
    this.onLog?.(
      `缓存树 ${remId.slice(0, 8)}... (${result.nodeCount} 节点, ${result.outline.length} bytes)`,
      'info',
    );

    // 缓存每个 RemObject（供 edit_rem 使用）
    const remObjects = result.remObjects ?? {};
    let remCachedCount = 0;
    for (const [nodeId, remObj] of Object.entries(remObjects)) {
      this.cache.set('rem:' + nodeId, remObj);
      remCachedCount++;
    }
    this.onLog?.(
      `缓存 ${remCachedCount} 个 RemObject`,
      'info',
    );

    // 字段过滤
    const fields = payload.fields as string[] | undefined;
    const full = payload.full as boolean | undefined;
    const filteredRemObjects: Record<string, Record<string, unknown>> = {};
    for (const [nodeId, remObj] of Object.entries(remObjects)) {
      filteredRemObjects[nodeId] = filterRemFields(remObj as Record<string, unknown>, { full, fields });
    }

    // 附加缓存覆盖提示
    const finalResult: TreeRemReadResult & { _cacheOverridden?: unknown } = {
      ...result,
      remObjects: filteredRemObjects,
    };
    if (previousTreeCachedAt) {
      finalResult._cacheOverridden = { id: remId, previousCachedAt: previousTreeCachedAt };
    }

    return finalResult;
  }
}
