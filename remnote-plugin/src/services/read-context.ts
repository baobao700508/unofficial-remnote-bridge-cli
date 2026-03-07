/**
 * read-context service — 上下文视图（focus / page 模式）
 *
 * 同态命名：read_context (action) → read-context.ts (文件) → readContext (函数)
 *
 * 职责：
 * - page 模式：以当前页面顶层 Rem 为中心展开子树
 * - focus 模式：以当前 focus 的 Rem 为中心构建鱼眼视图
 */

import type { ReactRNPlugin, PluginRem as Rem } from '@remnote/plugin-sdk';
import {
  type OutlineNode,
  type TreeNode,
  type ElidedNode,
  buildOutline,
  createMinimalSerializableRem,
} from '../utils/tree-serializer';
import { filterNoisyChildren } from './powerup-filter';
import { sliceSiblings } from '../utils/elision';
import { buildBreadcrumb } from './breadcrumb';
import { buildFullSerializableRem as buildFullRem } from './rem-builder';

export interface ReadContextPayload {
  mode?: 'focus' | 'page';
  ancestorLevels?: number;
  maxNodes?: number;
  maxSiblings?: number;
  depth?: number;
}

export interface ReadContextResult {
  nodeCount: number;
  outline: string;
  breadcrumb: string[];
  mode: 'focus' | 'page';
}

export async function readContext(
  plugin: ReactRNPlugin,
  payload: ReadContextPayload,
): Promise<ReadContextResult> {
  const {
    mode = 'focus',
    ancestorLevels = 2,
    maxNodes = 200,
    maxSiblings = 20,
    depth = 3,
  } = payload;

  if (mode === 'page') {
    return readContextPage(plugin, { maxNodes, maxSiblings, depth });
  }
  return readContextFocus(plugin, { ancestorLevels, maxNodes, maxSiblings });
}

// ────────────────────────── Page 模式 ──────────────────────────

async function readContextPage(
  plugin: ReactRNPlugin,
  opts: { maxNodes: number; maxSiblings: number; depth: number },
): Promise<ReadContextResult> {
  const paneId = await plugin.window.getFocusedPaneId();
  if (!paneId) throw new Error('无法获取当前面板 ID，请确保有打开的页面');

  const remId = await plugin.window.getOpenPaneRemId(paneId);
  if (!remId) throw new Error('当前面板没有打开任何 Rem');

  const pageRem = await plugin.rem.findOne(remId);
  if (!pageRem) throw new Error(`Page Rem not found: ${remId}`);

  const breadcrumb = await buildBreadcrumb(plugin, pageRem);

  let nodeCount = 0;
  const budget = { remaining: opts.maxNodes };

  const rootNode = await buildSubtreeNode(plugin, pageRem, 0, opts.depth, opts.maxSiblings, budget);
  nodeCount = opts.maxNodes - budget.remaining;

  const header = `<!-- page: ${breadcrumb[breadcrumb.length - 1] || remId} -->\n<!-- path: ${breadcrumb.join(' > ')} -->`;
  const outline = header + '\n' + buildOutline(rootNode);

  return { nodeCount, outline, breadcrumb, mode: 'page' };
}

// ────────────────────────── Focus 模式（鱼眼视图） ──────────────────────────

async function readContextFocus(
  plugin: ReactRNPlugin,
  opts: { ancestorLevels: number; maxNodes: number; maxSiblings: number },
): Promise<ReadContextResult> {
  const focusRem = await plugin.focus.getFocusedRem();
  if (!focusRem) throw new Error('当前没有聚焦的 Rem，请先在 RemNote 中点击一个 Rem');

  const breadcrumb = await buildBreadcrumb(plugin, focusRem);

  // 向上追溯 ancestorLevels 层
  const ancestorPath: Rem[] = [focusRem];
  let current: Rem | undefined = focusRem;
  for (let i = 0; i < opts.ancestorLevels; i++) {
    const parent = await current.getParentRem();
    if (!parent) break;
    ancestorPath.unshift(parent);
    current = parent;
  }

  const budget = { remaining: opts.maxNodes };
  let nodeCount = 0;

  // 从最顶层祖先开始构建鱼眼视图
  const topAncestor = ancestorPath[0];
  const rootNode = await buildFisheyeNode(
    plugin, topAncestor, ancestorPath, 0, focusRem._id, opts.maxSiblings, budget,
  );
  nodeCount = opts.maxNodes - budget.remaining;

  const focusName = breadcrumb[breadcrumb.length - 1] || focusRem._id;
  const header = `<!-- path: ${breadcrumb.join(' > ')} -->\n<!-- focus: ${focusName} (${focusRem._id}) -->`;
  const outline = header + '\n' + buildOutline(rootNode);

  return { nodeCount, outline, breadcrumb, mode: 'focus' };
}

/**
 * 鱼眼节点构建。
 *
 * 展开深度梯度：
 * - 焦点本身：depth=3
 * - 焦点的 siblings：depth=1（前 3 个 children）
 * - 祖先节点（路径上）：展开
 * - 祖先的 siblings（叔伯）：depth=0
 */
async function buildFisheyeNode(
  plugin: ReactRNPlugin,
  rem: Rem,
  ancestorPath: Rem[],
  pathIndex: number,
  focusId: string,
  maxSiblings: number,
  budget: { remaining: number },
): Promise<OutlineNode> {
  budget.remaining--;

  const isFocus = rem._id === focusId;
  const isOnPath = ancestorPath.some(a => a._id === rem._id);
  const nextPathRem = pathIndex + 1 < ancestorPath.length ? ancestorPath[pathIndex + 1] : null;

  const allChildren = await rem.getChildrenRem();
  const children = await filterNoisyChildren(allChildren);

  const serializable = await buildMinimalSerializableRem(plugin, rem, children.length, isFocus);

  const childNodes: TreeNode[] = [];

  if (isFocus) {
    // 焦点本身：完整展开 depth=3
    const focusChildren = await processChildrenWithElision(
      plugin, children, maxSiblings, rem._id, budget, 0, 3,
    );
    childNodes.push(...focusChildren);
  } else if (isOnPath && nextPathRem) {
    // 路径上的祖先：展开所有 siblings，但非路径 children 不深入
    const { visibleIndices, elided } = sliceSiblings(children.length, maxSiblings, rem._id);

    const processChild = async (child: Rem): Promise<TreeNode> => {
      if (budget.remaining <= 0) {
        return createBudgetExhaustedNode(rem._id, 0, 0, 0); // will be handled
      }
      if (child._id === nextPathRem._id) {
        // 路径上的子节点：继续鱼眼递归
        return buildFisheyeNode(plugin, child, ancestorPath, pathIndex + 1, focusId, maxSiblings, budget);
      }
      if (child._id === focusId) {
        // 焦点节点
        return buildFisheyeNode(plugin, child, ancestorPath, pathIndex + 1, focusId, maxSiblings, budget);
      }
      // 焦点的 siblings：展开 1 层
      const isSiblingOfFocus = nextPathRem._id === focusId;
      if (isSiblingOfFocus) {
        return buildShallowNode(plugin, child, 1, 3, maxSiblings, budget);
      }
      // 叔伯节点：depth=0
      return buildShallowNode(plugin, child, 0, 0, maxSiblings, budget);
    };

    if (visibleIndices) {
      const { head, tail } = visibleIndices;
      for (let i = 0; i < head && budget.remaining > 0; i++) {
        childNodes.push(await processChild(children[i]));
      }
      if (elided) {
        childNodes.push({
          type: 'elided', count: elided.count, isExact: false,
          parentId: elided.parentId, rangeFrom: elided.rangeFrom,
          rangeTo: elided.rangeTo, totalSiblings: elided.totalSiblings,
        } as ElidedNode);
      }
      const tailStart = children.length - tail;
      for (let i = tailStart; i < children.length && budget.remaining > 0; i++) {
        childNodes.push(await processChild(children[i]));
      }
    } else {
      for (let i = 0; i < children.length; i++) {
        if (budget.remaining <= 0) {
          childNodes.push({
            type: 'elided', count: children.length - i, isExact: false,
            parentId: rem._id, rangeFrom: i, rangeTo: children.length - 1,
            totalSiblings: children.length,
          } as ElidedNode);
          break;
        }
        childNodes.push(await processChild(children[i]));
      }
    }
  }
  // 叔伯节点（不在路径上）：不展开 children

  return { rem: serializable, children: childNodes, folded: childNodes.length === 0 && children.length > 0 };
}

/**
 * 浅层节点构建：展开到指定深度，每层最多 maxChildrenPreview 个子节点。
 */
async function buildShallowNode(
  plugin: ReactRNPlugin,
  rem: Rem,
  remainingDepth: number,
  maxChildrenPreview: number,
  maxSiblings: number,
  budget: { remaining: number },
): Promise<OutlineNode> {
  budget.remaining--;

  const allChildren = await rem.getChildrenRem();
  const children = await filterNoisyChildren(allChildren);

  const serializable = await buildMinimalSerializableRem(plugin, rem, children.length, false);

  const childNodes: TreeNode[] = [];

  if (remainingDepth > 0 && children.length > 0) {
    const showCount = Math.min(children.length, maxChildrenPreview, maxSiblings);
    for (let i = 0; i < showCount && budget.remaining > 0; i++) {
      childNodes.push(await buildShallowNode(plugin, children[i], remainingDepth - 1, maxChildrenPreview, maxSiblings, budget));
    }
    if (showCount < children.length) {
      childNodes.push({
        type: 'elided', count: children.length - showCount, isExact: false,
        parentId: rem._id, rangeFrom: showCount, rangeTo: children.length - 1,
        totalSiblings: children.length,
      } as ElidedNode);
    }
  }

  return {
    rem: serializable,
    children: childNodes,
    folded: childNodes.length === 0 && children.length > 0,
  };
}

// ────────────────────────── 共享辅助 ──────────────────────────

async function buildSubtreeNode(
  plugin: ReactRNPlugin,
  rem: Rem,
  currentDepth: number,
  maxDepth: number,
  maxSiblings: number,
  budget: { remaining: number },
): Promise<OutlineNode> {
  budget.remaining--;

  const allChildren = await rem.getChildrenRem();
  const children = await filterNoisyChildren(allChildren);
  const shouldFold = maxDepth !== -1 && currentDepth >= maxDepth;
  const folded = shouldFold && children.length > 0;

  const serializable = await buildFullRem(plugin, rem, children);

  const childNodes: TreeNode[] = [];
  if (!folded) {
    const processed = await processChildrenWithElision(
      plugin, children, maxSiblings, rem._id, budget, currentDepth + 1, maxDepth,
    );
    childNodes.push(...processed);
  }

  return { rem: serializable, children: childNodes, folded };
}

async function processChildrenWithElision(
  plugin: ReactRNPlugin,
  children: Rem[],
  maxSiblings: number,
  parentId: string,
  budget: { remaining: number },
  nextDepth: number,
  maxDepth: number,
): Promise<TreeNode[]> {
  const result: TreeNode[] = [];
  const { visibleIndices, elided } = sliceSiblings(children.length, maxSiblings, parentId);

  if (visibleIndices) {
    const { head, tail } = visibleIndices;
    for (let i = 0; i < head && budget.remaining > 0; i++) {
      result.push(await buildSubtreeNode(plugin, children[i], nextDepth, maxDepth, maxSiblings, budget));
    }
    if (elided) {
      const atMaxDepth = maxDepth !== -1 && nextDepth >= maxDepth;
      result.push({
        type: 'elided', count: elided.count, isExact: atMaxDepth,
        parentId: elided.parentId, rangeFrom: elided.rangeFrom,
        rangeTo: elided.rangeTo, totalSiblings: elided.totalSiblings,
      } as ElidedNode);
    }
    const tailStart = children.length - tail;
    for (let i = tailStart; i < children.length && budget.remaining > 0; i++) {
      result.push(await buildSubtreeNode(plugin, children[i], nextDepth, maxDepth, maxSiblings, budget));
    }
  } else {
    for (let i = 0; i < children.length; i++) {
      if (budget.remaining <= 0) {
        result.push({
          type: 'elided', count: children.length - i, isExact: false,
          parentId, rangeFrom: i, rangeTo: children.length - 1,
          totalSiblings: children.length,
        } as ElidedNode);
        break;
      }
      result.push(await buildSubtreeNode(plugin, children[i], nextDepth, maxDepth, maxSiblings, budget));
    }
  }

  return result;
}

function createBudgetExhaustedNode(parentId: string, rangeFrom: number, rangeTo: number, total: number): ElidedNode {
  return {
    type: 'elided', count: 1, isExact: false,
    parentId, rangeFrom, rangeTo, totalSiblings: total,
  };
}

async function buildMinimalSerializableRem(
  plugin: ReactRNPlugin,
  rem: Rem,
  childrenCount: number,
  isFocusRem: boolean,
) {
  const isPortal = rem.type === 6;
  const [markdownText, isDocument, portalIncludedRems] = await Promise.all([
    plugin.richText.toMarkdown(rem.text ?? []),
    rem.isDocument(),
    isPortal ? rem.getPortalDirectlyIncludedRem() : Promise.resolve([]),
  ]);

  return createMinimalSerializableRem({
    id: rem._id,
    markdownText: (isFocusRem ? '* ' : '') + markdownText.replace(/\n/g, ' '),
    childrenCount,
    isDocument,
    isTopLevel: rem.parent === null,
    isPortal,
    ...(isPortal ? { type: 'portal' as const, portalRefs: portalIncludedRems.map((r: Rem) => r._id) } : {}),
  });
}

