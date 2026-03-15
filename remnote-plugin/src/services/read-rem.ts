/**
 * read-rem service — 从 SDK 组装完整 RemObject
 *
 * 按 RemObject 接口的字段声明顺序组装对象（确定性序列化）。
 * RichText 元素内部按 key 字母序排列。
 *
 * 同态命名：read_rem (action) → read-rem.ts (文件) → readRem (函数)
 */

import type { ReactRNPlugin, PluginRem as Rem } from '@remnote/plugin-sdk';
import type {
  RemObject,
  RichText,
  RemTypeValue,
  PortalType,
  PropertyTypeValue,
} from '../types';
import { filterNoisyChildren, filterNoisyTags } from './powerup-filter';
import { remTypeToString } from './rem-builder';

/**
 * 读取单个 Rem，组装为完整 RemObject。
 *
 * @throws Error — Rem 不存在时抛 "Rem not found"
 */
export async function readRem(
  plugin: ReactRNPlugin,
  payload: { remId: string; includePowerup?: boolean },
): Promise<RemObject & { powerupFiltered?: { tags: number; children: number } }> {
  const { includePowerup = false } = payload;
  const rem = await plugin.rem.findOne(payload.remId);
  if (!rem) {
    throw new Error(`Rem not found: ${payload.remId}`);
  }

  // 并行获取所有异步字段
  const [
    isDocument,
    fontSize,
    highlightColor,
    isTodo,
    todoStatus,
    isCode,
    isQuote,
    isListItem,
    isCardItem,
    isTable,
    isSlot,
    isProperty,
    enablePractice,
    practiceDirection,
    tagRems,
    sourceRems,
    aliasRems,
    position,
    // R-F boolean fields
    isPowerup,
    isPowerupEnum,
    isPowerupProperty,
    isPowerupPropertyListItem,
    isPowerupSlot,
    // Portal
    portalType,
    portalDirectlyIncludedRems,
    // Property
    propertyType,
    // References
    refsBeingReferenced,
    deepRefsBeingReferenced,
    refsReferencingThis,
    // Tags hierarchy
    taggedRems,
    ancestorTagRems,
    descendantTagRems,
    // Hierarchy traversal
    descendantRems,
    siblingRems,
    portalsAndDocsIn,
    allRemInDocOrPortal,
    allRemInFolderQ,
    // Children (for powerup filtering)
    childrenRems,
    // Stats
    timesSelected,
    lastMovedTo,
    schemaVer,
    embeddedQueueView,
    lastPracticed,
  ] = await Promise.all([
    rem.isDocument(),
    rem.getFontSize(),
    rem.getHighlightColor(),
    rem.isTodo(),
    rem.getTodoStatus(),
    rem.isCode(),
    rem.isQuote(),
    rem.isListItem(),
    rem.isCardItem(),
    rem.isTable(),
    rem.isSlot(),
    rem.isProperty(),
    rem.getEnablePractice(),
    rem.getPracticeDirection(),
    rem.getTagRems(),
    rem.getSources(),
    rem.getAliases(),
    rem.positionAmongstSiblings(),
    // R-F boolean fields
    rem.isPowerup(),
    rem.isPowerupEnum(),
    rem.isPowerupProperty(),
    rem.isPowerupPropertyListItem(),
    rem.isPowerupSlot(),
    // Portal
    rem.getPortalType(),
    rem.getPortalDirectlyIncludedRem(),
    // Property
    rem.getPropertyType(),
    // References
    rem.remsBeingReferenced(),
    rem.deepRemsBeingReferenced(),
    rem.remsReferencingThis(),
    // Tags hierarchy
    rem.taggedRem(),
    rem.ancestorTagRem(),
    rem.descendantTagRem(),
    // Hierarchy traversal
    rem.getDescendants(),
    rem.siblingRem(),
    rem.portalsAndDocumentsIn(),
    rem.allRemInDocumentOrPortal(),
    rem.allRemInFolderQueue(),
    // Children (for powerup filtering)
    rem.getChildrenRem(),
    // Stats
    rem.timesSelectedInSearch(),
    rem.getLastTimeMovedTo(),
    rem.getSchemaVersion(),
    rem.embeddedQueueViewMode(),
    rem.getLastPracticed(),
  ]);

  // Powerup 噪音过滤
  let filteredTagRems = tagRems;
  let filteredChildrenIds = rem.children ?? [];
  let filteredTagCount = 0;
  let filteredChildCount = 0;

  if (!includePowerup) {
    filteredTagRems = await filterNoisyTags(tagRems);
    filteredTagCount = tagRems.length - filteredTagRems.length;

    const filteredChildren = await filterNoisyChildren(childrenRems);
    filteredChildCount = childrenRems.length - filteredChildren.length;
    filteredChildrenIds = filteredChildren.map(r => r._id);
  }

  // 按 RemObject 接口字段声明顺序组装（确定性序列化）
  const remObject: RemObject = {
    // 核心标识
    id: rem._id,

    // 内容
    text: sortRichTextKeys(rem.text ?? []),
    backText: rem.backText ? sortRichTextKeys(rem.backText) : null,

    // 类型系统
    type: remTypeToString(rem.type as number),
    isDocument,

    // 结构
    parent: rem.parent,
    children: filteredChildrenIds,

    // 格式 / 显示
    fontSize: (fontSize as RemObject['fontSize']) ?? null,
    highlightColor: (highlightColor as RemObject['highlightColor']) ?? null,

    // 状态标记
    isTodo,
    todoStatus: (todoStatus as RemObject['todoStatus']) ?? null,
    isCode,
    isQuote,
    isListItem,
    isCardItem,
    isTable: Boolean(isTable),
    isSlot,
    isProperty,
    isPowerup,
    isPowerupEnum,
    isPowerupProperty,
    isPowerupPropertyListItem,
    isPowerupSlot,

    // Portal 专用
    portalType: remTypeToString(rem.type as number) === 'portal'
      ? portalTypeToString(portalType as number)
      : null,
    portalDirectlyIncludedRem: portalDirectlyIncludedRems.map(r => r._id),

    // 属性类型
    propertyType: (propertyType as PropertyTypeValue | undefined) ?? null,

    // 练习设置
    enablePractice,
    practiceDirection: practiceDirection as RemObject['practiceDirection'],

    // 关联 — 直接关系
    tags: filteredTagRems.map(r => r._id),
    sources: sourceRems.map(r => r._id),
    aliases: aliasRems.map(r => r._id),

    // 关联 — 引用关系
    remsBeingReferenced: refsBeingReferenced.map(r => r._id),
    deepRemsBeingReferenced: deepRefsBeingReferenced.map(r => r._id),
    remsReferencingThis: refsReferencingThis.map(r => r._id),

    // 关联 — 标签体系
    taggedRem: taggedRems.map(r => r._id),
    ancestorTagRem: ancestorTagRems.map(r => r._id),
    descendantTagRem: descendantTagRems.map(r => r._id),

    // 关联 — 层级遍历
    descendants: descendantRems.map(r => r._id),
    siblingRem: siblingRems.map(r => r._id),
    portalsAndDocumentsIn: portalsAndDocsIn.map(r => r._id),
    allRemInDocumentOrPortal: allRemInDocOrPortal.map(r => r._id),
    allRemInFolderQueue: allRemInFolderQ.map(r => r._id),

    // 位置 / 统计
    positionAmongstSiblings: position ?? null,
    timesSelectedInSearch: timesSelected,
    lastTimeMovedTo: lastMovedTo,
    schemaVersion: schemaVer,

    // 队列视图
    embeddedQueueViewMode: embeddedQueueView,

    // 元数据 / 时间戳
    createdAt: rem.createdAt,
    updatedAt: rem.updatedAt,
    localUpdatedAt: rem.localUpdatedAt,
    lastPracticed,
  };

  if (!includePowerup && (filteredTagCount > 0 || filteredChildCount > 0)) {
    return { ...remObject, powerupFiltered: { tags: filteredTagCount, children: filteredChildCount } };
  }

  return remObject;
}

// ── 辅助函数 ──

/** 对 RichText 元素内部按 key 字母序排列（确定性序列化） */
function sortRichTextKeys(rt: RichText): RichText {
  return rt.map(el => {
    if (typeof el === 'string') return el;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(el).sort()) {
      sorted[key] = el[key];
    }
    return sorted;
  });
}


/** SDK PORTAL_TYPE 枚举值 → 字符串 */
function portalTypeToString(pt: number): PortalType {
  switch (pt) {
    case 2: return 'embedded_queue';
    case 3: return 'scaffold';
    case 4: return 'search_portal';
    default: return 'portal';
  }
}
