/**
 * tree-serializer.ts — 树大纲序列化纯函数
 *
 * 职责：将 SerializableRem 数据拼接为带缩进和元数据注释的大纲行。
 * 约束：纯函数、无副作用、不调用 SDK、不依赖其他层。
 *
 * SDK 调用（toMarkdown、getChildrenRem 等）在 services/read-tree.ts 中完成，
 * 本文件只接收已转换好的字符串数据。
 *
 * ── 分隔符设计（v2）──
 *
 * 行内分隔符只表示 practiceDirection，不编码 type 信息。
 * type（concept/descriptor）由元数据标记 `type:` 承载。
 *
 * | 箭头 | 含义                           |
 * |:-----|:-------------------------------|
 * | →    | 有 backText, forward           |
 * | ←    | 有 backText, backward          |
 * | ↔    | 有 backText, both              |
 * | ↓    | multiline, forward（无 backText）|
 * | ↑    | multiline, backward            |
 * | ↕    | multiline, both                |
 *
 * ── 元数据标记 ──
 *
 * | 标记            | 含义                            |
 * |:----------------|:--------------------------------|
 * | type:concept    | Rem type = concept              |
 * | type:descriptor | Rem type = descriptor           |
 * | type:portal     | Rem type = portal               |
 * | doc             | isDocument = true               |
 * | role:card-item  | isCardItem = true（多行答案行）  |
 * | children:N      | 折叠时的隐藏子节点数            |
 * | tag:Name(id)    | 每个 tag 独立一个标记           |
 * | top             | 知识库顶级 Rem                  |
 */

// ────────────────────────── 接口 ──────────────────────────

/** Tag 信息 */
export interface TagInfo {
  id: string;
  name: string;
}

/** services/read-tree.ts 准备好的单个 Rem 数据 */
export interface SerializableRem {
  id: string;
  markdownText: string;
  markdownBackText: string | null;
  /** 'concept' | 'descriptor' | 'default' | 'portal' */
  type: string;
  hasMultilineChildren: boolean;
  /** 'forward' | 'backward' | 'both' | 'none' */
  practiceDirection: string;
  isCardItem: boolean;
  isDocument: boolean;
  isPortal: boolean;
  /** Portal 直接引用的 Rem ID 列表（仅 Portal 类型有值） */
  portalRefs: string[];
  childrenCount: number;
  tags: TagInfo[];
  // Markdown 语法映射
  fontSize: 'H1' | 'H2' | 'H3' | null;
  isTodo: boolean;
  todoStatus: 'Finished' | 'Unfinished' | null;
  isCode: boolean;
  isDivider: boolean;
  /** 是否为知识库顶级 Rem（无父节点） */
  isTopLevel?: boolean;
}

/** 递归树节点，用于 buildOutline */
export interface OutlineNode {
  rem: SerializableRem;
  children: TreeNode[];
  /** true = 子树超过 depth 限制被折叠 */
  folded: boolean;
}

/** 省略占位节点 */
export interface ElidedNode {
  type: 'elided';
  /** 被省略的同级节点数 */
  count: number;
  /** 是否精确计数（false = ">=N"，表示省略的节点可能还有后代） */
  isExact: boolean;
  parentId: string;
  rangeFrom: number;
  rangeTo: number;
  totalSiblings: number;
}

/** 树节点统一类型 */
export type TreeNode = OutlineNode | ElidedNode;

/** 类型守卫 */
export function isElidedNode(node: TreeNode): node is ElidedNode {
  return 'type' in node && node.type === 'elided';
}

// ────────────────────────── 行内容拼接 ──────────────────────────

/**
 * 根据 practiceDirection 选择方向箭头，拼接行内容（不含缩进和元数据标记）。
 *
 * 箭头只表示 direction，不编码 type。type 由元数据标记承载。
 */
function buildLineContent(rem: SerializableRem): string {
  // Divider（最高优先）
  if (rem.isDivider) return '---';

  const { markdownText, markdownBackText, hasMultilineChildren, practiceDirection } = rem;

  let baseContent: string;

  if (markdownBackText !== null) {
    // 有 backText：按 direction 选择水平/垂直箭头
    const arrow = hasMultilineChildren
      ? (practiceDirection === 'backward' ? ' ↑ ' : practiceDirection === 'both' ? ' ↕ ' : ' ↓ ')
      : (practiceDirection === 'backward' ? ' ← ' : practiceDirection === 'both' ? ' ↔ ' : ' → ');
    baseContent = markdownText + arrow + markdownBackText;
  } else if (hasMultilineChildren) {
    // 无 backText + multiline：尾部箭头
    const arrow = practiceDirection === 'backward' ? ' ↑' : practiceDirection === 'both' ? ' ↕' : ' ↓';
    baseContent = markdownText + arrow;
  } else {
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

// ────────────────────────── 元数据 ──────────────────────────

/**
 * 构建元数据标记列表。每个标记对应一个独立字段，不合并。
 */
function buildMetadata(rem: SerializableRem, folded: boolean): string[] {
  const parts: string[] = [];

  // type（default 不输出）
  if (rem.type === 'concept') parts.push('type:concept');
  else if (rem.type === 'descriptor') parts.push('type:descriptor');
  else if (rem.type === 'portal') {
    parts.push('type:portal');
    if (rem.portalRefs.length > 0) parts.push('refs:' + rem.portalRefs.join(','));
  }

  // doc（独立于 type 的维度）
  if (rem.isDocument) parts.push('doc');

  // role
  if (rem.isCardItem) parts.push('role:card-item');

  // children（折叠时才输出）
  if (folded && rem.childrenCount > 0) parts.push('children:' + rem.childrenCount);

  // tags（每个 tag 独立一个标记）
  for (const tag of rem.tags) {
    parts.push('tag:' + tag.name + '(' + tag.id + ')');
  }

  // 顶级标记
  if (rem.isTopLevel) parts.push('top');

  return parts;
}

// ────────────────────────── 工厂函数 ──────────────────────────

/**
 * 创建一个带合理默认值的 SerializableRem。
 *
 * 用于 read-globe、read-context 等场景中只需基础字段的节点。
 * 必须提供 id、markdownText、childrenCount，其余字段使用默认值。
 */
export function createMinimalSerializableRem(
  overrides: Partial<SerializableRem> & Pick<SerializableRem, 'id' | 'markdownText' | 'childrenCount'>,
): SerializableRem {
  return {
    markdownBackText: null,
    type: 'default',
    hasMultilineChildren: false,
    practiceDirection: 'none',
    isCardItem: false,
    isDocument: false,
    isPortal: false,
    portalRefs: [],
    tags: [],
    fontSize: null,
    isTodo: false,
    todoStatus: null,
    isCode: false,
    isDivider: false,
    ...overrides,
  };
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
 * 序列化省略占位符行（不含缩进）。
 *
 * 精确：`<!--...elided {N} siblings (parent:{id} range:{from}-{to} total:{total})-->`
 * 非精确：`<!--...elided >={N} nodes (parent:{id} range:{from}-{to} total:{total})-->`
 */
export function serializeElidedLine(node: ElidedNode): string {
  const label = node.isExact ? 'siblings' : 'nodes';
  const prefix = node.isExact ? '' : '>=';
  return `<!--...elided ${prefix}${node.count} ${label} (parent:${node.parentId} range:${node.rangeFrom}-${node.rangeTo} total:${node.totalSiblings})-->`;
}

/**
 * 将递归树结构序列化为完整的 Markdown 大纲文本。
 *
 * 每级缩进 2 个空格。
 */
export function buildOutline(root: OutlineNode): string {
  const lines: string[] = [];

  function walkNode(node: TreeNode, depth: number): void {
    const indent = '  '.repeat(depth);

    if (isElidedNode(node)) {
      lines.push(indent + serializeElidedLine(node));
      return;
    }

    const line = serializeRemLine(node.rem, node.folded);
    lines.push(indent + line);

    if (!node.folded) {
      for (const child of node.children) {
        walkNode(child, depth + 1);
      }
    }
  }

  walkNode(root, 0);
  return lines.join('\n');
}
