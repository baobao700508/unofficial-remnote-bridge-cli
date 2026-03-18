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

/** Token Slimming: 默认模式下，字段值匹配此表时省略输出。未列入的字段始终输出。 */
const REM_DEFAULTS: Record<string, unknown> = {
  backText: null,
  type: 'default',
  isDocument: false,
  fontSize: null,
  highlightColor: null,
  isTodo: false,
  todoStatus: null,
  isCode: false,
  isQuote: false,
  isListItem: false,
  isCardItem: false,
  isTable: false,
  isSlot: false,
  isProperty: false,
  portalType: null,
  portalDirectlyIncludedRem: [],
  propertyType: null,
  enablePractice: false,
  practiceDirection: 'forward',
  tags: [],
  sources: [],
  aliases: [],
  remsBeingReferenced: [],
  remsReferencingThis: [],
  taggedRem: [],
  descendants: [],
  siblingRem: [],
  positionAmongstSiblings: null,
};

function matchesDefault(value: unknown, defaultValue: unknown): boolean {
  if (Array.isArray(defaultValue) && defaultValue.length === 0) {
    return Array.isArray(value) && value.length === 0;
  }
  return value === defaultValue;
}

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

    // 缓存完整 RemObject 对象
    this.cache.set(cacheKey, remObject);
    this.onLog?.(`缓存 Rem ${remId.slice(0, 8)}...`, 'info');

    // 字段过滤
    const fields = payload.fields as string[] | undefined;
    const full = payload.full as boolean | undefined;

    let result: Record<string, unknown>;

    if (full) {
      // --full → 返回完整对象（含 R-F 字段）。浅拷贝避免污染缓存对象。
      result = { ...(remObject as Record<string, unknown>) };
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
      // 默认模式：排除 R-F 字段 + 省略匹配默认值的字段（Token Slimming）
      const obj = remObject as Record<string, unknown>;
      result = {};
      for (const [key, value] of Object.entries(obj)) {
        if (RF_FIELDS.has(key)) continue;
        if (key in REM_DEFAULTS && matchesDefault(value, REM_DEFAULTS[key])) continue;
        result[key] = value;
      }
    }

    // 附加缓存覆盖提示
    if (previousCachedAt) {
      result._cacheOverridden = { id: remId, previousCachedAt };
    }

    return result;
  }
}
