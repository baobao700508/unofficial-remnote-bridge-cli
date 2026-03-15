/**
 * ReadHandler — read-rem 请求的业务编排
 *
 * 职责：
 * 1. 转发到 Plugin 获取完整 RemObject
 * 2. 序列化为 JSON 字符串并缓存（完整版本）
 * 3. 根据 fields/full 参数过滤字段返回给 CLI
 */

import { RemCache } from './rem-cache.js';

/** R-F 字段（仅 --full 模式输出，默认不输出） */
const RF_FIELDS = new Set([
  'children',
  'isPowerup', 'isPowerupEnum', 'isPowerupProperty',
  'isPowerupPropertyListItem', 'isPowerupSlot',
  'deepRemsBeingReferenced',
  'ancestorTagRem', 'descendantTagRem',
  'portalsAndDocumentsIn', 'allRemInDocumentOrPortal', 'allRemInFolderQueue',
  'timesSelectedInSearch', 'lastTimeMovedTo', 'schemaVersion',
  'embeddedQueueViewMode',
  'localUpdatedAt', 'lastPracticed',
]);

/** Portal 简化输出字段（type === 'portal' 时默认输出这 8 个字段） */
export const PORTAL_FIELDS = [
  'id', 'type', 'portalType', 'portalDirectlyIncludedRem',
  'parent', 'positionAmongstSiblings',
  'createdAt', 'updatedAt',
] as const;

export class ReadHandler {
  constructor(
    private cache: RemCache,
    private forwardToPlugin: (action: string, payload: Record<string, unknown>) => Promise<unknown>,
    private onLog?: (message: string, level: 'info' | 'warn' | 'error') => void,
  ) {}

  async handleReadRem(payload: Record<string, unknown>): Promise<unknown> {
    const remId = payload.remId as string;
    if (!remId) {
      throw new Error('缺少 remId 参数');
    }

    // 检查旧缓存
    const cacheKey = 'rem:' + remId;
    const previousCachedAt = this.cache.getCreatedAt(cacheKey);

    const includePowerup = (payload.includePowerup as boolean) ?? false;

    // 转发到 Plugin
    const remObject = await this.forwardToPlugin('read_rem', { remId, includePowerup });

    // 缓存完整 JSON
    const fullJson = JSON.stringify(remObject, null, 2);
    this.cache.set(cacheKey, fullJson);
    this.onLog?.(`缓存 Rem ${remId.slice(0, 8)}... (${fullJson.length} bytes)`, 'info');

    // 字段过滤
    const fields = payload.fields as string[] | undefined;
    const full = payload.full as boolean | undefined;

    let result: Record<string, unknown>;

    if (full) {
      // --full → 返回完整对象（含 R-F 字段）
      result = remObject as Record<string, unknown>;
    } else if (fields) {
      // --fields 过滤：只返回指定字段 + id
      const obj = remObject as Record<string, unknown>;
      result = { id: obj.id };
      for (const field of fields) {
        if (field in obj) {
          result[field] = obj[field];
        }
      }
    } else if ((remObject as Record<string, unknown>).type === 'portal') {
      // Portal 简化模式：只输出 8 个关键字段
      const obj = remObject as Record<string, unknown>;
      result = {};
      for (const field of PORTAL_FIELDS) {
        if (field in obj) {
          result[field] = obj[field];
        }
      }
    } else {
      // 默认模式：排除 R-F 字段
      const obj = remObject as Record<string, unknown>;
      result = {};
      for (const [key, value] of Object.entries(obj)) {
        if (!RF_FIELDS.has(key)) {
          result[key] = value;
        }
      }
    }

    // 附加缓存覆盖提示
    if (previousCachedAt) {
      result._cacheOverridden = { id: remId, previousCachedAt };
    }

    return result;
  }
}
