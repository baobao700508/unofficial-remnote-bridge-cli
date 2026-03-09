/**
 * read-globe service — 知识库全局概览（仅 Document 层级）
 *
 * 同态命名：read_globe (action) → read-globe.ts (文件) → readGlobe (函数)
 *
 * 职责：
 * 1. 获取所有顶层 Rem（parent === null）
 * 2. 只递归展开 Document 类型的节点
 * 3. 非 Document 子 Rem 不展开（元数据中标注 children:N）
 */

import type { ReactRNPlugin, PluginRem as Rem } from '@remnote/plugin-sdk';
import {
  type OutlineNode,
  type TreeNode,
  type ElidedNode,
  isElidedNode,
  buildOutline,
  serializeElidedLine,
  createMinimalSerializableRem,
} from '../utils/tree-serializer';
import { sliceSiblings } from '../utils/elision';
import { filterNoisyChildren } from './powerup-filter';
import { safeToMarkdown } from './rem-builder';

export interface ReadGlobePayload {
  depth?: number;
  maxNodes?: number;
  maxSiblings?: number;
}

export interface ReadGlobeResult {
  nodeCount: number;
  outline: string;
}

export async function readGlobe(
  plugin: ReactRNPlugin,
  payload: ReadGlobePayload,
): Promise<ReadGlobeResult> {
  const {
    depth = -1,
    maxNodes = 200,
    maxSiblings = 20,
  } = payload;

  // 获取所有顶层 Rem（同步属性 rem.parent === null）
  const allRems = await plugin.rem.getAll();
  const topLevelRems = allRems.filter(rem => rem.parent === null);

  // 过滤出 Document（并行）
  const docFlags = await Promise.all(topLevelRems.map(r => r.isDocument()));
  const topDocs = topLevelRems.filter((_, i) => docFlags[i]);

  let nodeCount = 0;
  const budget = { remaining: maxNodes };

  async function buildGlobeNode(
    rem: Rem,
    currentDepth: number,
    maxDepth: number,
  ): Promise<OutlineNode> {
    nodeCount++;
    budget.remaining--;

    const allChildren = await rem.getChildrenRem();
    const children = await filterNoisyChildren(allChildren);

    // 过滤出 Document 子节点（并行）
    const childDocFlags = await Promise.all(children.map(c => c.isDocument()));
    const docChildren = children.filter((_, i) => childDocFlags[i]);
    const nonDocCount = children.length - docChildren.length;

    const shouldFold = maxDepth !== -1 && currentDepth >= maxDepth;
    const folded = shouldFold && docChildren.length > 0;

    const isPortal = rem.type === 6;
    const [markdownText, portalIncludedRems] = await Promise.all([
      safeToMarkdown(plugin, rem.text ?? []),
      isPortal ? rem.getPortalDirectlyIncludedRem() : Promise.resolve([]),
    ]);

    const serializable = createMinimalSerializableRem({
      id: rem._id,
      markdownText: markdownText.replace(/\n/g, ' '),
      childrenCount: children.length,
      isDocument: true,
      isTopLevel: rem.parent === null,
      isPortal,
      ...(isPortal ? { type: 'portal' as const, portalRefs: portalIncludedRems.map((r: Rem) => r._id) } : {}),
    });

    const childNodes: TreeNode[] = [];
    if (!folded && docChildren.length > 0) {
      const { visibleIndices, elided } = sliceSiblings(docChildren.length, maxSiblings, rem._id);

      if (visibleIndices) {
        const { head, tail } = visibleIndices;
        for (let i = 0; i < head && budget.remaining > 0; i++) {
          childNodes.push(await buildGlobeNode(docChildren[i], currentDepth + 1, maxDepth));
        }
        if (elided) {
          const atMaxDepth = maxDepth !== -1 && currentDepth + 1 >= maxDepth;
          childNodes.push({
            type: 'elided',
            count: elided.count,
            isExact: atMaxDepth,
            parentId: elided.parentId,
            rangeFrom: elided.rangeFrom,
            rangeTo: elided.rangeTo,
            totalSiblings: elided.totalSiblings,
          } as ElidedNode);
        }
        const tailStart = docChildren.length - tail;
        for (let i = tailStart; i < docChildren.length && budget.remaining > 0; i++) {
          childNodes.push(await buildGlobeNode(docChildren[i], currentDepth + 1, maxDepth));
        }
      } else {
        for (let i = 0; i < docChildren.length; i++) {
          if (budget.remaining <= 0) {
            const remainCount = docChildren.length - i;
            childNodes.push({
              type: 'elided',
              count: remainCount,
              isExact: false,
              parentId: rem._id,
              rangeFrom: i,
              rangeTo: docChildren.length - 1,
              totalSiblings: docChildren.length,
            } as ElidedNode);
            break;
          }
          childNodes.push(await buildGlobeNode(docChildren[i], currentDepth + 1, maxDepth));
        }
      }
    }

    return { rem: serializable, children: childNodes, folded };
  }

  // 构建虚拟根节点来容纳所有顶层 Document
  const topNodes: TreeNode[] = [];
  const { visibleIndices, elided } = sliceSiblings(topDocs.length, maxSiblings, 'root');

  if (visibleIndices) {
    const { head, tail } = visibleIndices;
    for (let i = 0; i < head && budget.remaining > 0; i++) {
      topNodes.push(await buildGlobeNode(topDocs[i], 0, depth));
    }
    if (elided) {
      topNodes.push({
        type: 'elided',
        count: elided.count,
        isExact: false,
        parentId: 'root',
        rangeFrom: elided.rangeFrom,
        rangeTo: elided.rangeTo,
        totalSiblings: elided.totalSiblings,
      } as ElidedNode);
    }
    const tailStart = topDocs.length - tail;
    for (let i = tailStart; i < topDocs.length && budget.remaining > 0; i++) {
      topNodes.push(await buildGlobeNode(topDocs[i], 0, depth));
    }
  } else {
    for (let i = 0; i < topDocs.length; i++) {
      if (budget.remaining <= 0) {
        const remainCount = topDocs.length - i;
        topNodes.push({
          type: 'elided',
          count: remainCount,
          isExact: false,
          parentId: 'root',
          rangeFrom: i,
          rangeTo: topDocs.length - 1,
          totalSiblings: topDocs.length,
        } as ElidedNode);
        break;
      }
      topNodes.push(await buildGlobeNode(topDocs[i], 0, depth));
    }
  }

  // 序列化：多个顶层节点逐个 buildOutline 再拼接
  const lines: string[] = ['<!-- globe: 知识库概览 -->'];
  for (const node of topNodes) {
    if (isElidedNode(node)) {
      lines.push(serializeElidedLine(node));
    } else {
      lines.push(buildOutline(node as OutlineNode));
    }
  }

  return {
    nodeCount,
    outline: lines.join('\n'),
  };
}
