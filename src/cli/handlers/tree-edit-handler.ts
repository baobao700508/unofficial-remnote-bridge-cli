/**
 * TreeEditHandler — edit-tree 请求的业务编排
 *
 * 职责：
 * 1. 模板展开（{{remId}} → 缓存中对应行的完整内容）
 * 2. 三道防线（缓存存在、变更检测、str_replace 精确匹配）
 * 3. 解析新旧大纲并 diff
 * 4. 逐项执行操作（通过 forwardToPlugin 调用原子操作）
 * 5. 成功后重新 read-tree 更新缓存
 */

import type { DefaultsConfig } from '../config.js';
import { DEFAULT_DEFAULTS } from '../config.js';
import { RemCache } from './rem-cache.js';
import { parseOutline, diffTrees, parsePowerupPrefix, type TreeOp, type TreeDiffError, type ParsedMetadata } from './tree-parser.js';

// ────────────────────────── 模板展开 ──────────────────────────

/** 匹配 {{remId}} 占位符 */
const TEMPLATE_RE = /\{\{(\S+?)\}\}/g;

/** 行尾标记正则（与 tree-parser.ts 的 LINE_MARKER_RE 一致） */
const LINE_MARKER_RE = /<!--(\S+)(?:\s+\S+)*-->$/;

/** 省略占位符正则（与 tree-parser.ts 的 ELIDED_LINE_RE 一致） */
const ELIDED_LINE_RE = /^<!--\.\.\.elided\s/;

/**
 * 从缓存大纲构建 remId → 去缩进完整行 的映射。
 * 省略占位符行无 remId，自然不会进入映射。
 */
function buildLineMap(cachedOutline: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of cachedOutline.split('\n')) {
    const stripped = line.trimStart();
    if (!stripped || ELIDED_LINE_RE.test(stripped)) continue;
    const match = stripped.match(LINE_MARKER_RE);
    if (match) {
      map.set(match[1], stripped);
    }
  }
  return map;
}

/**
 * 展开 oldStr/newStr 中的 {{remId}} 占位符。
 *
 * {{remId}} 被替换为该 remId 在缓存大纲中对应行的完整内容（不含缩进）。
 * 不含 {{}} 的文本原样返回（零开销，向后兼容）。
 */
function expandTemplates(text: string, lineMap: Map<string, string>): string {
  if (!text.includes('{{')) return text;
  return text.replace(TEMPLATE_RE, (_match, remId: string) => {
    const content = lineMap.get(remId);
    if (content === undefined) {
      throw new Error(
        `Template {{${remId}}} refers to a remId not found in the cached outline. ` +
        `Only remIds visible in the last read-tree output can be referenced.`,
      );
    }
    return content;
  });
}

// ────────────────────────── 接口 ──────────────────────────

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
    const cachedOutline = this.cache.get('tree:' + remId) as string | null;
    if (!cachedOutline) {
      throw new Error(
        `Tree rooted at ${remId} has not been read yet. Use read-tree first.`,
      );
    }

    // ── 防线 2: 乐观并发检测 ──
    // 用与 read-tree 相同的参数重新获取最新大纲
    const cachedDepthStr = this.cache.get('tree-depth:' + remId) as string | null;
    const cachedMaxNodesStr = this.cache.get('tree-maxNodes:' + remId) as string | null;
    const cachedMaxSiblingsStr = this.cache.get('tree-maxSiblings:' + remId) as string | null;
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

    // ── 模板展开：{{remId}} → 缓存中对应行的完整内容（不含缩进）──
    const lineMap = buildLineMap(cachedOutline);
    const expandedOldStr = expandTemplates(oldStr, lineMap);
    const expandedNewStr = expandTemplates(newStr, lineMap);

    // 展开后 noop 检查（原始不等但展开后可能相等）
    if (expandedOldStr === expandedNewStr) {
      return { ok: true, operations: [] };
    }

    // ── 防线 3: str_replace 精确匹配 ──
    const matchCount = countOccurrences(cachedOutline, expandedOldStr);
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

    const modifiedOutline = cachedOutline.replace(expandedOldStr, expandedNewStr);

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

          if (op.isPortal) {
            // ── Portal 创建路径 ──
            // 1. 创建空 Portal 并设置父节点
            const portalResult = await this.forwardToPlugin('create_portal', {
              parentId,
              position: op.position,
            }) as { remId: string };

            // 2. 逐个添加引用
            if (op.portalRefs?.length) {
              for (const refId of op.portalRefs) {
                await this.forwardToPlugin('add_to_portal', {
                  portalId: portalResult.remId,
                  remId: refId,
                });
              }
            }

            // 记录新创建的 remId，供后续嵌套引用
            newRemIdMap.set(i, portalResult.remId);
          } else {
            // ── 普通 Rem 创建路径 ──
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
            // 合并 HTML 注释中的元数据（type、doc、tag）
            if (op.metadata) {
              if (op.metadata.type) changes.type = op.metadata.type;
              if (op.metadata.isDocument) changes.isDocument = op.metadata.isDocument;
              if (op.metadata.tags) changes.tags = op.metadata.tags;
            }
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
          }
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
