/**
 * rem-field-filter — RemObject 字段过滤逻辑
 *
 * 从 ReadHandler 提取的共享模块，供 ReadHandler 和 TreeRemReadHandler 使用。
 */

/** R-F 字段（仅 --full 模式输出，默认不输出） */
export const RF_FIELDS = new Set([
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
export const REM_DEFAULTS: Record<string, unknown> = {
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

export function matchesDefault(value: unknown, defaultValue: unknown): boolean {
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

/**
 * 过滤 RemObject 字段。
 *
 * @param remObject 完整 RemObject
 * @param options.full 返回全部字段
 * @param options.fields 返回指定字段子集
 * @returns 过滤后的对象
 */
export function filterRemFields(
  remObject: Record<string, unknown>,
  options?: { full?: boolean; fields?: string[] },
): Record<string, unknown> {
  const { full, fields } = options ?? {};

  if (full) {
    return { ...remObject };
  }

  if (fields) {
    const result: Record<string, unknown> = { id: remObject.id };
    for (const field of fields) {
      if (field in remObject) {
        result[field] = remObject[field];
      }
    }
    return result;
  }

  if (remObject.type === 'portal') {
    const result: Record<string, unknown> = {};
    for (const field of PORTAL_FIELDS) {
      if (field in remObject) {
        result[field] = remObject[field];
      }
    }
    return result;
  }

  // 默认模式：排除 R-F 字段 + Token Slimming
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(remObject)) {
    if (RF_FIELDS.has(key)) continue;
    if (key in REM_DEFAULTS && matchesDefault(value, REM_DEFAULTS[key])) continue;
    result[key] = value;
  }
  return result;
}
