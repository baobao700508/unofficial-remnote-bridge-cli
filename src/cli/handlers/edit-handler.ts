/**
 * EditHandler — edit-rem 命令的编排器
 *
 * 在 daemon 层实现两道防线 + 字段白名单校验 + 直接转发 changes。
 * Plugin 只负责原子写入（write_rem_fields）。
 *
 * 防线 1：缓存存在性检查（必须先 read 再 edit）
 * 防线 2：语义并发检测（三层字段比较：语义字段硬拒绝，元数据放行+警告）
 */

import { RemCache } from './rem-cache.js';

/** 只读字段集合 — 变更这些字段只产生警告，不执行写入 */
const READ_ONLY_FIELDS = new Set([
  'id',
  'children',
  'isTable',
  'portalType',
  'propertyType',
  'aliases',
  'remsBeingReferenced', 'deepRemsBeingReferenced', 'remsReferencingThis',
  'taggedRem', 'ancestorTagRem', 'descendantTagRem',
  'descendants', 'siblingRem',
  'portalsAndDocumentsIn', 'allRemInDocumentOrPortal', 'allRemInFolderQueue',
  'timesSelectedInSearch', 'lastTimeMovedTo', 'schemaVersion',
  'embeddedQueueViewMode',
  'createdAt', 'updatedAt', 'localUpdatedAt', 'lastPracticed',
  'isPowerup', 'isPowerupEnum', 'isPowerupProperty',
  'isPowerupPropertyListItem', 'isPowerupSlot',
]);

// ── 防线 2 三层字段分类 ──────────────────────────────────────
// 不在以下两个集合中的字段 = 第1层语义字段（硬拒绝）

/** 第2层：敏感元数据字段——放行但输出专门警告。扩展时须同步更新 handleEditRem 中的 warned 警告生成逻辑 */
const DEFENSE2_WARN_FIELDS = new Set([
  'parent',
]);

/** 第3层：普通元数据字段——放行，有变化时输出统一警告 */
const DEFENSE2_IGNORE_FIELDS = new Set([
  'id',
  // 位置/时间
  'positionAmongstSiblings', 'updatedAt', 'localUpdatedAt', 'createdAt',
  'lastPracticed', 'lastTimeMovedTo', 'timesSelectedInSearch',
  // 级联关联
  'children', 'siblingRem', 'descendants',
  'deepRemsBeingReferenced', 'remsReferencingThis',
  'taggedRem', 'ancestorTagRem', 'descendantTagRem',
  'portalsAndDocumentsIn', 'allRemInDocumentOrPortal', 'allRemInFolderQueue',
  // 系统
  'schemaVersion', 'embeddedQueueViewMode',
  'isPowerup', 'isPowerupEnum', 'isPowerupProperty',
  'isPowerupPropertyListItem', 'isPowerupSlot',
]);

/** 可写字段白名单 — 21 个可写字段 */
const WRITABLE_FIELDS = new Set([
  'text', 'backText', 'type', 'isDocument', 'parent',
  'fontSize', 'highlightColor',
  'isTodo', 'todoStatus', 'isCode', 'isQuote', 'isListItem', 'isCardItem', 'isSlot', 'isProperty',
  'enablePractice', 'practiceDirection',
  'tags', 'sources', 'positionAmongstSiblings', 'portalDirectlyIncludedRem',
]);

/** 枚举字段的合法值 */
const ENUM_VALUES: Record<string, Set<unknown>> = {
  type: new Set(['concept', 'descriptor', 'default']),
  practiceDirection: new Set(['forward', 'backward', 'both', 'none']),
  highlightColor: new Set(['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple', 'Gray', 'Brown', 'Pink', null]),
  fontSize: new Set(['H1', 'H2', 'H3', null]),
  todoStatus: new Set(['Finished', 'Unfinished', null]),
};

export interface EditRemPayload {
  remId: string;
  changes: Record<string, unknown>;
}

export interface EditRemResult {
  ok: boolean;
  changes: string[];
  warnings: string[];
  error?: string;
  appliedChanges?: string[];
  failedField?: string;
}

export class EditHandler {
  constructor(
    private cache: RemCache,
    private forwardToPlugin: (action: string, payload: Record<string, unknown>) => Promise<unknown>,
  ) {}

  async handleEditRem(payload: EditRemPayload): Promise<EditRemResult> {
    const { remId, changes } = payload;

    if (!changes || typeof changes !== 'object' || Object.keys(changes).length === 0) {
      return { ok: true, changes: [], warnings: [] };
    }

    // ── 防线 1: 缓存存在性检查 ──
    const cachedObj = this.cache.get('rem:' + remId) as Record<string, unknown> | null;
    if (!cachedObj) {
      throw new Error(
        `Rem ${remId} has not been read yet. Read it first before editing.`,
      );
    }

    // ── 防线 2: 乐观并发检测（三层字段比较） ──
    const currentRemObject = await this.forwardToPlugin('read_rem', { remId });
    const { semantic, warned, ignored } = classifyDiff(
      cachedObj as Record<string, unknown>,
      currentRemObject as Record<string, unknown>,
    );

    // 第1层：语义字段冲突 → 硬拒绝
    if (semantic.length > 0) {
      console.error(
        `[defense-2] Rem ${remId} conflict. Changed semantic fields: ${semantic.join(', ')}`,
      );
      throw new Error(
        `Rem ${remId} has been modified since last read. Please read it again before editing.`,
      );
    }

    // 第2层+第3层：元数据变化 → 放行，收集警告
    const defense2Warnings: string[] = [];
    if (warned.length > 0) {
      const cachedParent = (cachedObj as Record<string, unknown>).parent;
      const currentParent = (currentRemObject as Record<string, unknown>).parent;
      defense2Warnings.push(
        `⚠️ parent has changed (was: ${cachedParent}, now: ${currentParent}). ` +
        `The Rem has been moved to a different parent since last read. Proceeding with edit.`,
      );
      console.error(`[defense-2] Rem ${remId} parent changed: ${cachedParent} → ${currentParent}`);
    }
    if (ignored.length > 0) {
      defense2Warnings.push(
        `ℹ️ Metadata fields changed since last read: ${ignored.join(', ')}. ` +
        `This is expected after structural operations. Proceeding with edit.`,
      );
      console.error(`[defense-2] Rem ${remId} metadata drift: ${ignored.join(', ')}`);
    }

    // 静默刷新缓存（保持新鲜度）
    if (warned.length > 0 || ignored.length > 0) {
      this.cache.set('rem:' + remId, currentRemObject);
    }

    // ── 遍历 changes keys：分类过滤 ──
    const warnings: string[] = [...defense2Warnings];
    const writableChanges: Record<string, unknown> = {};

    for (const key of Object.keys(changes)) {
      if (READ_ONLY_FIELDS.has(key)) {
        warnings.push(`Field '${key}' is read-only and was ignored`);
      } else if (!WRITABLE_FIELDS.has(key)) {
        warnings.push(`Field '${key}' is unknown and was ignored`);
      } else {
        writableChanges[key] = changes[key];
      }
    }

    // ── 枚举值范围校验 ──
    for (const [field, allowedValues] of Object.entries(ENUM_VALUES)) {
      if (field in writableChanges) {
        const value = writableChanges[field];
        if (!allowedValues.has(value)) {
          throw new Error(
            `Invalid value for '${field}': ${JSON.stringify(value)}. Allowed: ${[...allowedValues].map(v => JSON.stringify(v)).join(', ')}`,
          );
        }
      }
    }

    // ── 语义校验：todoStatus 非 null 但 isTodo 未启用 ──
    if ('todoStatus' in writableChanges && writableChanges.todoStatus !== null) {
      const isTodo = writableChanges.isTodo ?? cachedObj.isTodo;
      if (!isTodo) {
        warnings.push(
          "Setting 'todoStatus' without 'isTodo: true' may have no effect",
        );
      }
    }

    // ── 空变更检查 ──
    if (Object.keys(writableChanges).length === 0) {
      return { ok: true, changes: [], warnings };
    }

    // ── 发送变更到 Plugin ──
    const writeResult = (await this.forwardToPlugin('write_rem_fields', {
      remId,
      changes: writableChanges,
    })) as { applied: string[]; failed?: { field: string; error: string } };

    if (writeResult.failed) {
      // 部分失败 — 不更新缓存（迫使 AI re-read）
      return {
        ok: false,
        changes: [],
        warnings,
        error: `Failed to update field '${writeResult.failed.field}': ${writeResult.failed.error}`,
        appliedChanges: writeResult.applied,
        failedField: writeResult.failed.field,
      };
    }

    // ── 写入成功 → 从 Plugin 重新获取完整 Rem 并更新缓存 ──
    const freshRemObject = await this.forwardToPlugin('read_rem', { remId });
    this.cache.set('rem:' + remId, freshRemObject);

    return {
      ok: true,
      changes: Object.keys(writableChanges),
      warnings,
    };
  }
}

/** 三层字段分类比较 — 防线2核心逻辑 */
function classifyDiff(
  cached: Record<string, unknown>,
  current: Record<string, unknown>,
): { semantic: string[]; warned: string[]; ignored: string[] } {
  const allKeys = new Set([...Object.keys(cached), ...Object.keys(current)]);
  const semantic: string[] = [];
  const warned: string[] = [];
  const ignored: string[] = [];

  for (const key of allKeys) {
    if (JSON.stringify(cached[key]) === JSON.stringify(current[key])) continue;

    if (DEFENSE2_WARN_FIELDS.has(key)) {
      warned.push(key);
    } else if (DEFENSE2_IGNORE_FIELDS.has(key)) {
      ignored.push(key);
    } else {
      semantic.push(key);
    }
  }
  return { semantic, warned, ignored };
}
