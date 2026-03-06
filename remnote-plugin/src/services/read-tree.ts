/**
 * read-tree service — 递归遍历子树并序列化为 Markdown 大纲
 *
 * 同态命名：read_tree (action) → read-tree.ts (文件) → readTree (函数)
 *
 * 职责：
 * 1. 从根 Rem 递归遍历子树（受 depth 限制）
 * 2. 对每个 Rem 调用 SDK API 获取序列化所需数据
 * 3. 调用 utils/tree-serializer 纯函数拼接为大纲文本
 */

import type { ReactRNPlugin, PluginRem as Rem } from '@remnote/plugin-sdk';
import {
  type SerializableRem,
  type OutlineNode,
  type TreeNode,
  type ElidedNode,
  buildOutline,
} from '../utils/tree-serializer';
import { filterNoisyChildren, filterNoisyTags } from '../utils/powerup-filter';
import { sliceSiblings } from '../utils/elision';

export interface ReadTreePayload {
  remId: string;
  depth?: number;
  maxNodes?: number;
  maxSiblings?: number;
  ancestorLevels?: number;
  includePowerup?: boolean;
}

/** 祖先节点信息（从直接父亲到最远祖先，由近及远） */
export interface AncestorInfo {
  id: string;
  name: string;
  childrenCount: number;
  isDocument: boolean;
  isTopLevel?: boolean;
}

export interface ReadTreeResult {
  rootId: string;
  depth: number;
  nodeCount: number;
  outline: string;
  /** 祖先链（从直接父亲到最远祖先，由近及远） */
  ancestors?: AncestorInfo[];
  powerupFiltered?: { tags: number; children: number };
}

/**
 * 读取 Rem 子树并序列化为 Markdown 大纲。
 *
 * @throws Error — Rem 不存在、节点数超限
 */
export async function readTree(
  plugin: ReactRNPlugin,
  payload: ReadTreePayload,
): Promise<ReadTreeResult> {
  const {
    remId,
    depth = 3,
    maxNodes = 200,
    maxSiblings = 20,
    ancestorLevels = 0,
    includePowerup = false,
  } = payload;

  const rootRem = await plugin.rem.findOne(remId);
  if (!rootRem) {
    throw new Error(`Rem not found: ${remId}`);
  }

  let nodeCount = 0;
  let totalFilteredTags = 0;
  let totalFilteredChildren = 0;
  const budget = { remaining: maxNodes };

  /**
   * 递归构建 OutlineNode 树。
   *
   * @param rem SDK Rem 对象
   * @param currentDepth 当前相对于根的深度（根 = 0）
   * @param maxDepth 最大展开深度（-1 = 无限）
   */
  async function buildNode(rem: Rem, currentDepth: number, maxDepth: number): Promise<OutlineNode> {
    nodeCount++;
    budget.remaining--;

    const allChildren = await rem.getChildrenRem();
    const children = includePowerup ? allChildren : await filterNoisyChildren(allChildren);
    if (!includePowerup) totalFilteredChildren += allChildren.length - children.length;
    const shouldFold = maxDepth !== -1 && currentDepth >= maxDepth;
    const folded = shouldFold && children.length > 0;

    // 并行获取序列化所需的字段
    const [
      markdownText,
      markdownBackText,
      remType,
      isCardItem,
      isDocument,
      isPortal,
      tagRems,
      practiceDirection,
      fontSize,
      isTodo,
      todoStatus,
      isCode,
      hasDvPowerup,
      highlightColor,
      isQuote,
      isListItem,
    ] = await Promise.all([
      plugin.richText.toMarkdown(rem.text ?? []),
      rem.backText ? plugin.richText.toMarkdown(rem.backText) : Promise.resolve(null),
      rem.getType(),
      rem.isCardItem(),
      rem.isDocument(),
      Promise.resolve(rem.type === 6), // portal type enum = 6
      rem.getTagRems().then(tags => includePowerup ? tags : filterNoisyTags(tags).then(filtered => {
        totalFilteredTags += tags.length - filtered.length;
        return filtered;
      })),
      rem.getPracticeDirection(),
      rem.getFontSize(),
      rem.isTodo(),
      rem.getTodoStatus(),
      rem.isCode(),
      rem.hasPowerup('dv'),
      rem.getHighlightColor(),
      rem.isQuote(),
      rem.isListItem(),
    ]);

    // 检测是否有 multiline children（children 中有 isCardItem 的）
    let hasMultilineChildren = false;
    if (!folded && children.length > 0) {
      const cardItemFlags = await Promise.all(children.map(c => c.isCardItem()));
      hasMultilineChildren = cardItemFlags.some(Boolean);
    } else if (folded) {
      // 折叠时无法确定，保守设为 false（元数据 fc 可能不完全准确）
      hasMultilineChildren = false;
    }

    // 检测 cloze
    const hasCloze = (rem.text ?? []).some(
      el => typeof el === 'object' && el !== null && 'cId' in el,
    );

    // Divider = 有 dv powerup 且 text 为空
    const isDivider = hasDvPowerup && (rem.text ?? []).length === 0;

    const serializable: SerializableRem = {
      id: rem._id,
      markdownText: sanitizeNewlines(markdownText),
      markdownBackText: markdownBackText !== null ? sanitizeNewlines(markdownBackText) : null,
      type: remTypeToString(remType as number),
      hasMultilineChildren,
      practiceDirection: (practiceDirection as string) ?? 'none',
      isCardItem,
      isDocument,
      isPortal,
      childrenCount: children.length,
      tagCount: tagRems.length,
      hasCloze,
      fontSize: (fontSize as 'H1' | 'H2' | 'H3' | null) ?? null,
      isTodo,
      todoStatus: (todoStatus as 'Finished' | 'Unfinished' | null) ?? null,
      isCode,
      isDivider,
      highlightColor: (highlightColor as string | null) ?? null,
      isQuote,
      isListItem,
    };

    // 递归处理子节点（带省略逻辑）
    const childNodes: TreeNode[] = [];
    if (!folded) {
      // Sibling 省略
      const { visibleIndices, elided } = sliceSiblings(children.length, maxSiblings, rem._id);

      if (visibleIndices) {
        // 有省略：展示前 head + 省略占位 + 后 tail
        const { head, tail } = visibleIndices;

        // 前 head 个
        for (let i = 0; i < head && budget.remaining > 0; i++) {
          childNodes.push(await buildNode(children[i], currentDepth + 1, maxDepth));
        }

        // 省略占位符
        if (elided) {
          // 判断 isExact：被省略的节点如果有子节点，则不精确
          // 保守策略：只要 depth 未到底，就标记为非精确
          const atMaxDepth = maxDepth !== -1 && currentDepth + 1 >= maxDepth;
          childNodes.push({
            type: 'elided',
            count: elided.count,
            isExact: atMaxDepth, // 到底了就是精确的（不会有更多后代）
            parentId: elided.parentId,
            rangeFrom: elided.rangeFrom,
            rangeTo: elided.rangeTo,
            totalSiblings: elided.totalSiblings,
          } as ElidedNode);
        }

        // 后 tail 个
        const tailStart = children.length - tail;
        for (let i = tailStart; i < children.length && budget.remaining > 0; i++) {
          childNodes.push(await buildNode(children[i], currentDepth + 1, maxDepth));
        }
      } else {
        // 无 sibling 省略：正常遍历，但需检查全局预算
        for (let i = 0; i < children.length; i++) {
          if (budget.remaining <= 0) {
            // 全局预算耗尽：剩余 children 生成一个省略占位符
            const remainCount = children.length - i;
            childNodes.push({
              type: 'elided',
              count: remainCount,
              isExact: false, // 可能还有后代
              parentId: rem._id,
              rangeFrom: i,
              rangeTo: children.length - 1,
              totalSiblings: children.length,
            } as ElidedNode);
            break;
          }
          childNodes.push(await buildNode(children[i], currentDepth + 1, maxDepth));
        }
      }
    }

    return { rem: serializable, children: childNodes, folded };
  }

  const rootNode = await buildNode(rootRem, 0, depth);

  // 检测根节点是否为顶级 Rem（无父节点）
  const rootParent = await rootRem.getParentRem();
  if (!rootParent) {
    rootNode.rem.isTopLevel = true;
  }

  const outline = buildOutline(rootNode);

  const result: ReadTreeResult = {
    rootId: remId,
    depth,
    nodeCount,
    outline,
  };

  // 祖先链构建
  const clampedLevels = Math.min(Math.max(ancestorLevels, 0), 10);
  if (clampedLevels > 0) {
    const ancestors: AncestorInfo[] = [];
    let current: Rem | undefined = rootRem;
    for (let i = 0; i < clampedLevels; i++) {
      const parent = await current.getParentRem();
      if (!parent) break;
      const [name, children, isDoc] = await Promise.all([
        plugin.richText.toMarkdown(parent.text ?? []),
        parent.getChildrenRem(),
        parent.isDocument(),
      ]);
      ancestors.push({
        id: parent._id,
        name: sanitizeNewlines(name),
        childrenCount: children.length,
        isDocument: isDoc,
      });
      current = parent;
    }
    if (ancestors.length > 0) {
      // 检测最远祖先是否为顶级 Rem
      const furthestAncestor = ancestors[ancestors.length - 1];
      const furthestParent = await current!.getParentRem();
      if (!furthestParent) {
        furthestAncestor.isTopLevel = true;
      }
      result.ancestors = ancestors;
    }
  }

  if (!includePowerup && (totalFilteredTags > 0 || totalFilteredChildren > 0)) {
    result.powerupFiltered = { tags: totalFilteredTags, children: totalFilteredChildren };
  }

  return result;
}

// ── 辅助函数 ──

/** toMarkdown 可能返回多行，替换为空格以保持"每 Rem 一行" */
function sanitizeNewlines(text: string): string {
  return text.replace(/\n/g, ' ');
}

/** SDK RemType 枚举值 → 字符串 */
function remTypeToString(type: number): string {
  switch (type) {
    case 1: return 'concept';
    case 2: return 'descriptor';
    case 6: return 'portal';
    default: return 'default';
  }
}
