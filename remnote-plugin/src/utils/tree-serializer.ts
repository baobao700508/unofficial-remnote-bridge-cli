/**
 * tree-serializer.ts — 树大纲序列化纯函数
 *
 * 职责：将 SerializableRem 数据拼接为带缩进和元数据注释的大纲行。
 * 约束：纯函数、无副作用、不调用 SDK、不依赖其他层。
 *
 * SDK 调用（toMarkdown、getChildrenRem 等）在 services/read-tree.ts 中完成，
 * 本文件只接收已转换好的字符串数据。
 */

// ────────────────────────── 接口 ──────────────────────────

/** services/read-tree.ts 准备好的单个 Rem 数据 */
export interface SerializableRem {
  id: string;
  markdownText: string;
  markdownBackText: string | null;
  /** 'concept' | 'descriptor' | 'default' */
  type: string;
  hasMultilineChildren: boolean;
  practiceDirection: string;
  isCardItem: boolean;
  isDocument: boolean;
  isPortal: boolean;
  childrenCount: number;
  tagCount: number;
  hasCloze: boolean;
  // P0: Markdown 语法映射
  fontSize: 'H1' | 'H2' | 'H3' | null;
  isTodo: boolean;
  todoStatus: 'Finished' | 'Unfinished' | null;
  isCode: boolean;
  isDivider: boolean;
  // P2: 元数据注释
  highlightColor: string | null;
  isQuote: boolean;
  isListItem: boolean;
}

/** 递归树节点，用于 buildOutline */
export interface OutlineNode {
  rem: SerializableRem;
  children: OutlineNode[];
  /** true = 子树超过 depth 限制被折叠 */
  folded: boolean;
}

// ────────────────────────── 行内容拼接 ──────────────────────────

/**
 * 推导分隔符并拼接行内容（不含缩进和元数据标记）。
 *
 * 推导规则严格遵循 spec 中的优先级链。
 */
function buildLineContent(rem: SerializableRem): string {
  // Divider（最高优先）
  if (rem.isDivider) return '---';

  const { markdownText, markdownBackText, type, hasMultilineChildren, practiceDirection } = rem;

  // 基础内容（concept/descriptor/>> 等分隔符逻辑）
  let baseContent: string;
  if (type === 'concept' && hasMultilineChildren) {
    baseContent = markdownText + ' ::>';
  } else if (type === 'concept' && markdownBackText !== null) {
    baseContent = markdownText + ' :: ' + markdownBackText;
  } else if (type === 'descriptor' && hasMultilineChildren) {
    baseContent = markdownText + ' ;;>';
  } else if (type === 'descriptor' && markdownBackText !== null) {
    baseContent = markdownText + ' ;; ' + markdownBackText;
  } else if (markdownBackText !== null) {
    if (practiceDirection === 'forward') {
      baseContent = markdownText + ' >> ' + markdownBackText;
    } else if (practiceDirection === 'backward') {
      baseContent = markdownText + ' << ' + markdownBackText;
    } else if (practiceDirection === 'both') {
      baseContent = markdownText + ' <> ' + markdownBackText;
    } else {
      baseContent = markdownText;
    }
  } else if (hasMultilineChildren) {
    baseContent = markdownText + ' >>>';
  } else {
    // hasCloze 的情况：cloze 已由 toMarkdown 处理为 {{...}}，直接输出 text
    baseContent = markdownText;
  }

  // Code 包裹（最内层）
  if (rem.isCode) baseContent = '`' + baseContent + '`';

  // Todo 前缀
  if (rem.isTodo) {
    const cb = rem.todoStatus === 'Finished' ? '- [x] ' : '- [ ] ';
    baseContent = cb + baseContent;
  }

  // Header 前缀（最外层）
  if (rem.fontSize) {
    const hd = rem.fontSize === 'H1' ? '# ' : rem.fontSize === 'H2' ? '## ' : '### ';
    baseContent = hd + baseContent;
  }

  return baseContent;
}

// ────────────────────────── 元数据推导 ──────────────────────────

/**
 * 推导 fc 元数据值。无闪卡时返回 null。
 */
function deriveFc(rem: SerializableRem): string | null {
  const { type, markdownBackText, hasMultilineChildren, practiceDirection, hasCloze } = rem;

  if (type === 'concept' && hasMultilineChildren) return 'concept-multiline';
  if (type === 'concept' && markdownBackText !== null) return 'concept';
  if (type === 'descriptor' && hasMultilineChildren) return 'descriptor-multiline';
  if (type === 'descriptor' && markdownBackText !== null) return 'descriptor';
  if (markdownBackText !== null) {
    if (practiceDirection === 'forward') return 'forward';
    if (practiceDirection === 'backward') return 'backward';
    if (practiceDirection === 'both') return 'both';
  }
  if (hasMultilineChildren) return 'multiline';
  if (hasCloze) return 'cloze';
  return null;
}

/**
 * 构建元数据 key:value 对列表。
 */
function buildMetadata(rem: SerializableRem, folded: boolean): string[] {
  const parts: string[] = [];

  // fc
  const fc = deriveFc(rem);
  if (fc) parts.push('fc:' + fc);

  // role
  if (rem.isCardItem) parts.push('role:card-item');

  // type（非默认值时输出）
  if (rem.isDocument) parts.push('type:document');
  else if (rem.isPortal) parts.push('type:portal');

  // tags
  if (rem.tagCount > 0) parts.push('tags:' + rem.tagCount);

  // children（折叠时才输出）
  if (folded && rem.childrenCount > 0) parts.push('children:' + rem.childrenCount);

  // P2: Powerup 元数据
  if (rem.highlightColor) parts.push('hl:' + rem.highlightColor);
  if (rem.isQuote) parts.push('quote');
  if (rem.isListItem) parts.push('list');

  return parts;
}

// ────────────────────────── 公开 API ──────────────────────────

/**
 * 序列化单个 Rem 为一行（不含缩进）。
 *
 * 格式：`{行内容} <!--{remId} {元数据}-->`
 */
export function serializeRemLine(rem: SerializableRem, folded: boolean = false): string {
  const content = buildLineContent(rem);
  const metadata = buildMetadata(rem, folded);
  const metaStr = metadata.length > 0 ? ' ' + metadata.join(' ') : '';
  return `${content} <!--${rem.id}${metaStr}-->`;
}

/**
 * 将递归树结构序列化为完整的 Markdown 大纲文本。
 *
 * 每级缩进 2 个空格。
 */
export function buildOutline(root: OutlineNode): string {
  const lines: string[] = [];

  function walk(node: OutlineNode, depth: number): void {
    const indent = '  '.repeat(depth);
    const line = serializeRemLine(node.rem, node.folded);
    lines.push(indent + line);

    if (!node.folded) {
      for (const child of node.children) {
        walk(child, depth + 1);
      }
    }
  }

  walk(root, 0);
  return lines.join('\n');
}
