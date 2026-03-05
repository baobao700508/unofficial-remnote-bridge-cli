/**
 * ReadHandler — read-rem 请求的业务编排
 *
 * 职责：
 * 1. 转发到 Plugin 获取完整 RemObject
 * 2. 序列化为 JSON 字符串并缓存（完整版本）
 * 3. 根据 fields/full 参数过滤字段返回给 CLI
 */

import { RemCache } from './rem-cache';

/** R-F 字段（仅 --full 模式输出，默认不输出） */
const RF_FIELDS = new Set([
  'isPowerup', 'isPowerupEnum', 'isPowerupProperty',
  'isPowerupPropertyListItem', 'isPowerupSlot',
  'deepRemsBeingReferenced',
  'ancestorTagRem', 'descendantTagRem',
  'portalsAndDocumentsIn', 'allRemInDocumentOrPortal', 'allRemInFolderQueue',
  'timesSelectedInSearch', 'lastTimeMovedTo', 'schemaVersion',
  'embeddedQueueViewMode',
  'localUpdatedAt', 'lastPracticed',
]);

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

    // 转发到 Plugin
    const remObject = await this.forwardToPlugin('read_rem', { remId });

    // 缓存完整 JSON
    const fullJson = JSON.stringify(remObject, null, 2);
    this.cache.set('rem:' + remId, fullJson);
    this.onLog?.(`缓存 Rem ${remId.slice(0, 8)}... (${fullJson.length} bytes)`, 'info');

    // 字段过滤
    const fields = payload.fields as string[] | undefined;
    const full = payload.full as boolean | undefined;

    if (full) {
      // --full → 返回完整对象（含 R-F 字段）
      return remObject;
    }

    const obj = remObject as Record<string, unknown>;

    if (fields) {
      // --fields 过滤：只返回指定字段 + id
      const filtered: Record<string, unknown> = { id: obj.id };
      for (const field of fields) {
        if (field in obj) {
          filtered[field] = obj[field];
        }
      }
      return filtered;
    }

    // 默认模式：排除 R-F 字段
    const filtered: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (!RF_FIELDS.has(key)) {
        filtered[key] = value;
      }
    }
    return filtered;
  }
}
