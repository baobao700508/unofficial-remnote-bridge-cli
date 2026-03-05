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

    // 转发到 Plugin 的 read_tree service
    const result = await this.forwardToPlugin('read_tree', { remId, depth }) as TreeReadResult;

    // 缓存大纲文本（key = 'tree:' + remId）
    this.cache.set('tree:' + remId, result.outline);
    this.onLog?.(
      `缓存树 ${remId.slice(0, 8)}... (${result.nodeCount} 节点, ${result.outline.length} bytes)`,
      'info',
    );

    return result;
  }
}
