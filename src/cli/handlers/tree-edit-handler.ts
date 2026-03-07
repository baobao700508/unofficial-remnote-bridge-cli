/**
 * TreeEditHandler — edit-tree 请求的业务编排
 *
 * 职责：
 * 1. 三道防线（缓存存在、变更检测、str_replace 精确匹配）
 * 2. 解析新旧大纲并 diff
 * 3. 逐项执行操作（通过 forwardToPlugin 调用原子操作）
 * 4. 成功后重新 read-tree 更新缓存
 */

import type { DefaultsConfig } from '../config.js';
import { DEFAULT_DEFAULTS } from '../config.js';
import { RemCache } from './rem-cache.js';
import { parseOutline, diffTrees, parsePowerupPrefix, type TreeOp, type TreeDiffError } from './tree-parser.js';

export interface TreeEditPayload {
  remId: string;
  oldStr: string;
  newStr: string;
}

export interface TreeEditResult {
  ok: boolean;
  operations: TreeOp[];
  error?: string;
  details?: Record<string, unknown>;
}

export class TreeEditHandler {
  private defaults: DefaultsConfig;

  constructor(
    private cache: RemCache,
    private forwardToPlugin: (action: string, payload: Record<string, unknown>) => Promise<unknown>,
    defaults?: DefaultsConfig,
  ) {
    this.defaults = defaults ?? DEFAULT_DEFAULTS;
  }

  async handleEditTree(payload: TreeEditPayload): Promise<TreeEditResult> {
    const { remId, oldStr, newStr } = payload;

    // ── noop 检查 ──
    if (oldStr === newStr) {
      return { ok: true, operations: [] };
    }

    // ── 防线 1: 缓存存在性检查 ──
    const cachedOutline = this.cache.get('tree:' + remId);
    if (!cachedOutline) {
      throw new Error(
        `Tree rooted at ${remId} has not been read yet. Use read-tree first.`,
      );
    }

    // ── 防线 2: 乐观并发检测 ──
    // 用与 read-tree 相同的参数重新获取最新大纲
    const cachedDepthStr = this.cache.get('tree-depth:' + remId);
    const cachedMaxNodesStr = this.cache.get('tree-maxNodes:' + remId);
    const cachedMaxSiblingsStr = this.cache.get('tree-maxSiblings:' + remId);
    const depth = cachedDepthStr ? Number(cachedDepthStr) : this.defaults.readTreeDepth;
    const maxNodes = cachedMaxNodesStr ? Number(cachedMaxNodesStr) : this.defaults.maxNodes;
    const maxSiblings = cachedMaxSiblingsStr ? Number(cachedMaxSiblingsStr) : this.defaults.maxSiblings;
    const freshResult = await this.forwardToPlugin('read_tree', { remId, depth, maxNodes, maxSiblings }) as {
      outline: string;
      depth: number;
      nodeCount: number;
    };
    if (freshResult.outline !== cachedOutline) {
      // 不更新缓存 — 迫使 AI re-read
      throw new Error(
        `Tree rooted at ${remId} has been modified since last read-tree. Please read-tree again.`,
      );
    }

    // ── 防线 3: str_replace 精确匹配 ──
    const matchCount = countOccurrences(cachedOutline, oldStr);
    if (matchCount === 0) {
      throw new Error(
        `old_str not found in the tree outline of ${remId}`,
      );
    }
    if (matchCount > 1) {
      throw new Error(
        `old_str matches ${matchCount} locations in the tree outline of ${remId}. ` +
        `Make old_str more specific to match exactly once.`,
      );
    }

    const modifiedOutline = cachedOutline.replace(oldStr, newStr);

    // ── 解析新旧大纲 ──
    const oldTree = parseOutline(cachedOutline);
    const newTree = parseOutline(modifiedOutline);

    // ── diff ──
    const diffResult = diffTrees(oldTree, newTree);

    // 检查是否是错误
    if ('type' in diffResult) {
      const err = diffResult as TreeDiffError;
      return {
        ok: false,
        operations: [],
        error: err.message,
        details: err.details,
      };
    }

    const { operations } = diffResult;

    // 空操作（结构无变化，可能只是元数据变化被 D9 忽略了）
    if (operations.length === 0) {
      return { ok: true, operations: [] };
    }

    // ── 执行操作（D4 操作顺序已在 diffTrees 中排好）──
    // newRemIdMap: 映射新增行的占位 ID → 实际创建的 remId
    const newRemIdMap = new Map<number, string>();

    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];
      switch (op.type) {
        case 'create': {
          // 解析父节点 ID（可能是占位标记 __new_N__）
          let parentId = op.parentId;
          const placeholderMatch = parentId.match(/^__new_(\d+)__$/);
          if (placeholderMatch) {
            const refIndex = parseInt(placeholderMatch[1], 10);
            const actualId = newRemIdMap.get(refIndex);
            if (!actualId) {
              throw new Error(`内部错误：新增行的父节点（占位 ${refIndex}）尚未创建`);
            }
            parentId = actualId;
          }

          // 解析 Markdown 前缀 + 箭头分隔符 → 属性
          const { cleanContent, powerups, backText, practiceDirection } = parsePowerupPrefix(op.content);

          const createResult = await this.forwardToPlugin('create_rem', {
            content: cleanContent,
            parentId,
            position: op.position,
          }) as { remId: string };

          // 合并所有需要写入的属性（Powerup + 箭头分隔符推导的字段）
          const changes: Record<string, unknown> = { ...powerups };
          if (backText !== undefined) changes.backText = backText;
          if (practiceDirection !== undefined) changes.practiceDirection = practiceDirection;
          // 父节点为 multiline 时，子行标记 isCardItem
          // ⚠ SDK bug: setIsCardItem(true) 会偷偷设 practiceDirection: "forward"
          // 但 practiceDirection 应该只存在于父行（问题行），card-item（答案行）上不应该有。
          // 如果 card-item 带着 practiceDirection: "forward" 且有子行，会被 RemNote 错误渲染成 multiline 卡片。
          // 对策：setIsCardItem(true) 后立即用 practiceDirection: 'none' 覆盖掉副作用。
          if (op.parentIsMultiline) {
            changes.isCardItem = true;
            if (!changes.practiceDirection) changes.practiceDirection = 'none';
          }

          if (Object.keys(changes).length > 0) {
            await this.forwardToPlugin('write_rem_fields', {
              remId: createResult.remId,
              changes,
            });
          }

          // 记录新创建的 remId，供后续嵌套引用
          newRemIdMap.set(i, createResult.remId);
          break;
        }
        case 'delete': {
          await this.forwardToPlugin('delete_rem', { remId: op.remId });
          break;
        }
        case 'move': {
          await this.forwardToPlugin('move_rem', {
            remId: op.remId,
            newParentId: op.toParentId,
            position: op.position,
          });
          // 同步 isCardItem：移入 multiline 父节点 → true，移出 → false
          if (op.toParentIsMultiline && !op.fromParentIsMultiline) {
            // ⚠ SDK bug: setIsCardItem(true) 会偷设 practiceDirection: "forward"
            // 对策：覆盖为 'none'，但如果 Rem 自身有合法的 practiceDirection（如 ↔ 闪卡）则保留
            const changes: Record<string, unknown> = { isCardItem: true };
            if (!op.selfHasPracticeDirection) changes.practiceDirection = 'none';
            await this.forwardToPlugin('write_rem_fields', {
              remId: op.remId,
              changes,
            });
          } else if (!op.toParentIsMultiline && op.fromParentIsMultiline) {
            // ⚠ SDK bug: setIsCardItem(false) 不会清 practiceDirection（不对称行为）
            // 移出时清掉 SDK 副作用残留，但如果 Rem 自身有合法的 practiceDirection 则保留
            const changes: Record<string, unknown> = { isCardItem: false };
            if (!op.selfHasPracticeDirection) changes.practiceDirection = 'none';
            await this.forwardToPlugin('write_rem_fields', {
              remId: op.remId,
              changes,
            });
          }
          break;
        }
        case 'reorder': {
          await this.forwardToPlugin('reorder_children', {
            parentId: op.parentId,
            order: op.order,
          });
          break;
        }
      }
    }

    // ── D3: 成功后更新缓存（使用相同参数）──
    const updatedResult = await this.forwardToPlugin('read_tree', { remId, depth, maxNodes, maxSiblings }) as {
      outline: string;
    };
    this.cache.set('tree:' + remId, updatedResult.outline);

    return { ok: true, operations };
  }
}

/** 统计 needle 在 haystack 中出现的次数 */
function countOccurrences(haystack: string, needle: string): number {
  let count = 0;
  let pos = 0;
  while (true) {
    pos = haystack.indexOf(needle, pos);
    if (pos === -1) break;
    count++;
    pos += needle.length;
  }
  return count;
}
