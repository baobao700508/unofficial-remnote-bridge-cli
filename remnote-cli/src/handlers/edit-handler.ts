/**
 * EditHandler — edit-rem 命令的编排器
 *
 * 在 daemon 层实现三道防线 + str_replace + 后处理校验。
 * Plugin 只负责原子写入（write_rem_fields）。
 *
 * 防线 1：缓存存在性检查（必须先 read 再 edit）
 * 防线 2：乐观并发检测（当前 JSON 与缓存 JSON 比较）
 * 防线 3：str_replace 精确匹配（old_str 必须唯一匹配）
 */

import { RemCache } from './rem-cache';

/** 只读字段集合 — 变更这些字段只产生警告，不执行写入 */
const READ_ONLY_FIELDS = new Set([
  'id',
  'children',
  'isTable',
  'portalType', 'portalDirectlyIncludedRem',
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

export interface EditRemPayload {
  remId: string;
  oldStr: string;
  newStr: string;
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
    const { remId, oldStr, newStr } = payload;

    // ── 防线 1: 缓存存在性检查 ──
    const cachedJson = this.cache.get(remId);
    if (!cachedJson) {
      throw new Error(
        `Rem ${remId} has not been read yet. Read it first before editing.`,
      );
    }

    // ── 防线 2: 乐观并发检测 ──
    const currentRemObject = await this.forwardToPlugin('read_rem', { remId });
    const currentJson = JSON.stringify(currentRemObject, null, 2);
    if (currentJson !== cachedJson) {
      // 不更新缓存 — 迫使 AI re-read
      throw new Error(
        `Rem ${remId} has been modified since last read. Please read it again before editing.`,
      );
    }

    // ── 防线 3: str_replace 精确匹配 ──
    const matchCount = countOccurrences(cachedJson, oldStr);
    if (matchCount === 0) {
      throw new Error(
        `old_str not found in the serialized JSON of rem ${remId}`,
      );
    }
    if (matchCount > 1) {
      throw new Error(
        `old_str matches ${matchCount} locations in rem ${remId}. ` +
        `Make old_str more specific to match exactly once.`,
      );
    }

    const modifiedJson = cachedJson.replace(oldStr, newStr);

    // ── 后处理校验 ──

    // 1. JSON 解析
    let modified: Record<string, unknown>;
    try {
      modified = JSON.parse(modifiedJson);
    } catch {
      throw new Error(
        'The replacement produced invalid JSON. Check your new_str for syntax errors.',
      );
    }

    const original = JSON.parse(cachedJson) as Record<string, unknown>;

    // 2. 推导变更字段
    const changes: Record<string, unknown> = {};
    const warnings: string[] = [];

    for (const key of Object.keys(modified)) {
      if (JSON.stringify(modified[key]) !== JSON.stringify(original[key])) {
        if (READ_ONLY_FIELDS.has(key)) {
          warnings.push(`Field '${key}' is read-only and was ignored`);
        } else {
          changes[key] = modified[key];
        }
      }
    }

    // 3. 语义一致性校验
    if ('todoStatus' in changes && changes.todoStatus !== null) {
      const isTodo = modified.isTodo ?? original.isTodo;
      if (!isTodo) {
        warnings.push(
          "Setting 'todoStatus' without 'isTodo: true' may have no effect",
        );
      }
    }

    // 4. 空变更检查
    if (Object.keys(changes).length === 0) {
      return { ok: true, changes: [], warnings };
    }

    // ── 发送变更到 Plugin ──
    const writeResult = (await this.forwardToPlugin('write_rem_fields', {
      remId,
      changes,
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

    // ── 写入成功 → 从 Plugin 重新获取完整 Rem 并更新缓存（D5）──
    const freshRemObject = await this.forwardToPlugin('read_rem', { remId });
    const freshJson = JSON.stringify(freshRemObject, null, 2);
    this.cache.set(remId, freshJson);

    return {
      ok: true,
      changes: Object.keys(changes),
      warnings,
    };
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
    pos += needle.length; // 非重叠匹配，与 String.replace 行为一致
  }
  return count;
}
