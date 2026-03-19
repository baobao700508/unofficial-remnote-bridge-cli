/**
 * rem-builder.ts — 共享的 SerializableRem 构建函数
 *
 * 从 read-tree.ts 和 read-context.ts 中提取的重复逻辑。
 * 放在 services/ 目录（因为调用 SDK），不放 utils/。
 *
 * 依赖方向：services/rem-builder → utils/tree-serializer（单向）
 */

import type { ReactRNPlugin, PluginRem as Rem, RichTextInterface } from '@remnote/plugin-sdk';
import type { SerializableRem } from '../utils/tree-serializer';
import { filterNoisyTags } from './powerup-filter';

/**
 * SDK richText.toMarkdown 的安全包装。
 * SDK 不认识某些 RichText 类型（如 "i":"u" URL 链接），会抛 Invalid input。
 * 失败时回退到本地解析。
 */
export async function safeToMarkdown(
  plugin: ReactRNPlugin,
  richText: unknown[],
): Promise<string> {
  try {
    return await plugin.richText.toMarkdown(richText as RichTextInterface);
  } catch {
    return richTextFallback(richText);
  }
}

/**
 * 本地 RichText → 纯文本回退，处理 SDK 不支持的类型。
 *
 * 覆盖 RICH_TEXT_ELEMENT_TYPE 枚举全部 12 种类型 + 遗留 "u" 类型：
 *   m=TEXT, q=REM, i=IMAGE, a=AUDIO, x=LATEX, p=PLUGIN,
 *   g=GLOBAL_NAME, s=CARD_DELIMITER, n=ANNOTATION,
 *   fi=FLASHCARD_ICON, ai=ADD_ICON, o=DEPRECATED_CODE, u=URL(遗留)
 */
function richTextFallback(richText: unknown[]): string {
  return richText.map(item => {
    if (typeof item === 'string') return item;
    if (typeof item !== 'object' || item === null) return '';
    const obj = item as Record<string, unknown>;
    switch (obj.i) {
      case 'm': return String(obj.text ?? '');
      case 'q': return `[[${String(obj._id ?? '')}]]`;
      case 'u': return obj.title
        ? `[${String(obj.title)}](${String(obj.url)})`
        : String(obj.url ?? '');
      case 'x': return `$${String(obj.text ?? '')}$`;
      case 'i': return `![image](${String(obj.url ?? '')})`;
      case 'a': return `[audio](${String(obj.url ?? '')})`;
      case 'p': return String(obj.text ?? '');           // PLUGIN
      case 'g': return String(obj.text ?? '');           // GLOBAL_NAME
      case 'n': return String(obj.text ?? '');           // ANNOTATION
      case 'o': return String(obj.text ?? '');           // DEPRECATED_CODE
      case 's':                                          // CARD_DELIMITER
      case 'fi':                                         // FLASHCARD_ICON
      case 'ai': return '';                              // ADD_ICON（纯视觉标记）
      default: return String(obj.text ?? obj.url ?? '');
    }
  }).join('');
}

export interface BuildFullRemOptions {
  /** 是否保留 Powerup 系统 Tag（默认 false = 过滤掉） */
  includePowerup?: boolean;
  /** 过滤掉的 Tag 数量回调（用于 read-tree 统计） */
  onFilteredTags?: (count: number) => void;
}

/**
 * 构建完整的 SerializableRem（并行获取所有 SDK 字段）。
 *
 * 被 read-tree 和 read-context 共享。
 */
export async function buildFullSerializableRem(
  plugin: ReactRNPlugin,
  rem: Rem,
  children: Rem[],
  options?: BuildFullRemOptions,
): Promise<SerializableRem> {
  const includePowerup = options?.includePowerup ?? false;

  const [
    markdownText,
    markdownBackText,
    remType,
    isCardItem,
    isDocument,
    tagRems,
    practiceDirection,
    fontSize,
    isTodo,
    todoStatus,
    isCode,
    isQuote,
    isListItem,
    hasDvPowerup,
    portalIncludedRems,
  ] = await Promise.all([
    safeToMarkdown(plugin, rem.text ?? []),
    rem.backText ? safeToMarkdown(plugin, rem.backText) : Promise.resolve(null),
    rem.getType(),
    rem.isCardItem(),
    rem.isDocument(),
    rem.getTagRems().then(tags => {
      if (includePowerup) return tags;
      return filterNoisyTags(tags).then(filtered => {
        const filteredCount = tags.length - filtered.length;
        if (filteredCount > 0) options?.onFilteredTags?.(filteredCount);
        return filtered;
      });
    }),
    rem.getPracticeDirection(),
    rem.getFontSize(),
    rem.isTodo(),
    rem.getTodoStatus(),
    rem.isCode(),
    rem.isQuote(),
    rem.isListItem(),
    rem.hasPowerup('dv'),
    rem.type === 6 ? rem.getPortalDirectlyIncludedRem() : Promise.resolve([]),
  ]);

  let hasMultilineChildren = false;
  if (children.length > 0) {
    const cardItemFlags = await Promise.all(children.map(c => c.isCardItem()));
    hasMultilineChildren = cardItemFlags.some(Boolean);
  }

  const isDivider = hasDvPowerup && (rem.text ?? []).length === 0;

  // 获取每个 tag 的 name（并行）
  const tags = await Promise.all(
    tagRems.map(async (t) => ({
      id: t._id,
      name: sanitizeNewlines(await safeToMarkdown(plugin, t.text ?? [])),
    })),
  );

  return {
    id: rem._id,
    markdownText: sanitizeNewlines(markdownText),
    markdownBackText: markdownBackText !== null ? sanitizeNewlines(markdownBackText) : null,
    type: remTypeToString(remType as number),
    hasMultilineChildren,
    practiceDirection: (practiceDirection as string) ?? 'none',
    isCardItem,
    isDocument,
    isPortal: rem.type === 6,
    portalRefs: portalIncludedRems.map((r: Rem) => r._id),
    childrenCount: children.length,
    tags,
    fontSize: (fontSize as 'H1' | 'H2' | 'H3' | null) ?? null,
    isTodo,
    todoStatus: (todoStatus as 'Finished' | 'Unfinished' | null) ?? null,
    isCode,
    isQuote,
    isListItem,
    isDivider,
    isTopLevel: rem.parent === null,
  };
}

// ── 辅助函数 ──

/** toMarkdown 可能返回多行，替换为空格以保持"每 Rem 一行" */
export function sanitizeNewlines(text: string): string {
  return text.replace(/\n/g, ' ');
}

/** SDK RemType 枚举值 → 字符串 */
export function remTypeToString(type: number): string {
  switch (type) {
    case 1: return 'concept';
    case 2: return 'descriptor';
    case 6: return 'portal';
    default: return 'default';
  }
}
