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
  buildOutline,
} from '../utils/tree-serializer';
import { filterNoisyChildren, filterNoisyTags } from '../utils/powerup-filter';

/** 节点数上限，超出报错 */
const MAX_NODES = 500;

export interface ReadTreePayload {
  remId: string;
  depth?: number;
  includePowerup?: boolean;
}

export interface ReadTreeResult {
  rootId: string;
  depth: number;
  nodeCount: number;
  outline: string;
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
  const { remId, depth = 3, includePowerup = false } = payload;

  const rootRem = await plugin.rem.findOne(remId);
  if (!rootRem) {
    throw new Error(`Rem not found: ${remId}`);
  }

  let nodeCount = 0;
  let totalFilteredTags = 0;
  let totalFilteredChildren = 0;

  /**
   * 递归构建 OutlineNode 树。
   *
   * @param rem SDK Rem 对象
   * @param currentDepth 当前相对于根的深度（根 = 0）
   * @param maxDepth 最大展开深度（-1 = 无限）
   */
  async function buildNode(rem: Rem, currentDepth: number, maxDepth: number): Promise<OutlineNode> {
    nodeCount++;
    if (nodeCount > MAX_NODES) {
      throw new Error(
        `Tree exceeds ${MAX_NODES} nodes. Use a smaller --depth or read-tree a subtree.`,
      );
    }

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

    // 递归处理子节点
    const childNodes: OutlineNode[] = [];
    if (!folded) {
      for (const child of children) {
        childNodes.push(await buildNode(child, currentDepth + 1, maxDepth));
      }
    }

    return { rem: serializable, children: childNodes, folded };
  }

  const rootNode = await buildNode(rootRem, 0, depth);
  const outline = buildOutline(rootNode);

  const result: ReadTreeResult = {
    rootId: remId,
    depth,
    nodeCount,
    outline,
  };

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
