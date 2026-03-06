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
  type SerializableRem,
  type OutlineNode,
  type TreeNode,
  type ElidedNode,
  isElidedNode,
  buildOutline,
  serializeElidedLine,
} from '../utils/tree-serializer';
import { sliceSiblings } from '../utils/elision';
import { filterNoisyChildren } from '../utils/powerup-filter';

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

  // 获取所有顶层 Rem（parent === null）
  const allRems = await plugin.rem.getAll();
  const topLevelRems: Rem[] = [];
  for (const rem of allRems) {
    const parent = await rem.getParentRem();
    if (!parent) {
      topLevelRems.push(rem);
    }
  }

  // 过滤出 Document
  const topDocs: Rem[] = [];
  for (const rem of topLevelRems) {
    if (await rem.isDocument()) {
      topDocs.push(rem);
    }
  }

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

    // 过滤出 Document 子节点
    const docChildren: Rem[] = [];
    let nonDocCount = 0;
    for (const child of children) {
      if (await child.isDocument()) {
        docChildren.push(child);
      } else {
        nonDocCount++;
      }
    }

    const shouldFold = maxDepth !== -1 && currentDepth >= maxDepth;
    const folded = shouldFold && docChildren.length > 0;

    const markdownText = await plugin.richText.toMarkdown(rem.text ?? []);

    // 检测是否为顶级 Rem
    const parentRem = await rem.getParentRem();
    const isTopLevel = !parentRem;

    const serializable: SerializableRem = {
      id: rem._id,
      markdownText: markdownText.replace(/\n/g, ' '),
      markdownBackText: null,
      type: 'default',
      hasMultilineChildren: false,
      practiceDirection: 'none',
      isCardItem: false,
      isDocument: true,
      isPortal: false,
      childrenCount: children.length,
      tagCount: 0,
      hasCloze: false,
      fontSize: null,
      isTodo: false,
      todoStatus: null,
      isCode: false,
      isDivider: false,
      highlightColor: null,
      isQuote: false,
      isListItem: false,
      isTopLevel,
    };

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
