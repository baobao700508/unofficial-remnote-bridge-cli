/**
 * tree-parser.ts — 大纲解析 + diff 算法
 *
 * CLI handlers 层的纯函数。解析 Markdown 大纲文本为树结构，
 * 对比新旧两棵树生成增量操作列表。
 *
 * 不依赖 server / commands / daemon（强约束）。
 */

// ────────────────────────── 接口 ──────────────────────────

/** 大纲中解析出的节点 */
export interface OutlineNode {
  /** Rem ID，null = 新增行 */
  remId: string | null;
  /** 缩进级别（0 = 根节点） */
  depth: number;
  /** 去除缩进和行尾标记后的纯内容 */
  rawContent: string;
  /** 原始行文本 */
  rawLine: string;
  /** 子节点 */
  children: OutlineNode[];
  /** 是否为省略占位符行 */
  isElided?: boolean;
}

/** diff 操作类型 */
export type TreeOp =
  | { type: 'create'; content: string; parentId: string; position: number; parentIsMultiline?: boolean }
  | { type: 'delete'; remId: string }
  | { type: 'move'; remId: string; fromParentId: string; toParentId: string; position: number; fromParentIsMultiline?: boolean; toParentIsMultiline?: boolean }
  | { type: 'reorder'; parentId: string; order: string[] };

export interface TreeDiffResult {
  operations: TreeOp[];
}

export interface TreeDiffError {
  type: 'content_modified' | 'orphan_detected' | 'folded_delete' | 'root_modified' | 'indent_skip' | 'elided_modified';
  message: string;
  details: Record<string, unknown>;
}

// ────────────────────────── 行解析 ──────────────────────────

/**
 * 行尾标记正则（D5: 从行尾匹配）。
 * 捕获组：[1] = remId, [2] = 可选的 key:value 元数据串
 */
const LINE_MARKER_RE = /<!--(\S+)((?:\s+\S+)*)-->$/;

/** 省略占位符正则 */
const ELIDED_LINE_RE = /^<!--\.\.\.elided\s/;

/** 解析单行，提取缩进、内容、remId */
function parseLine(line: string): { depth: number; rawContent: string; remId: string | null; metadata: string; isElided: boolean } {
  // 计算缩进（每 2 空格一级）
  const stripped = line.replace(/^ */, '');
  const indentChars = line.length - stripped.length;
  const depth = Math.floor(indentChars / 2);

  // 检测省略占位符行
  if (ELIDED_LINE_RE.test(stripped)) {
    return { depth, rawContent: stripped, remId: null, metadata: '', isElided: true };
  }

  // 匹配行尾标记
  const match = stripped.match(LINE_MARKER_RE);
  if (match) {
    const remId = match[1];
    const metadata = match[2].trim();
    // rawContent = 去掉行尾标记后的内容（也去掉标记前的空格）
    const contentPart = stripped.slice(0, match.index!).trimEnd();
    return { depth, rawContent: contentPart, remId, metadata, isElided: false };
  }

  // 无标记 = 新增行
  return { depth, rawContent: stripped, remId: null, metadata: '', isElided: false };
}

// ────────────────────────── 大纲解析 ──────────────────────────

/**
 * 解析 Markdown 大纲文本为树结构。
 *
 * 使用栈追踪当前路径，根据缩进级别确定父子关系。
 */
export function parseOutline(text: string): OutlineNode[] {
  const lines = text.split('\n').filter(l => l.trim() !== '');
  if (lines.length === 0) return [];

  const roots: OutlineNode[] = [];
  // stack[i] = depth 为 i 的最近节点
  const stack: OutlineNode[] = [];

  for (const line of lines) {
    const { depth, rawContent, remId, isElided } = parseLine(line);

    const node: OutlineNode = {
      remId,
      depth,
      rawContent,
      rawLine: line,
      children: [],
      isElided,
    };

    if (depth === 0) {
      roots.push(node);
      stack.length = 1;
      stack[0] = node;
    } else {
      // 找到父节点（depth - 1 层的最近节点）
      const parent = stack[depth - 1];
      if (!parent) {
        throw new Error(
          `缩进跳级：行 "${line.trim()}" 的缩进级别为 ${depth}，` +
          `但找不到上一级（${depth - 1}）的父节点。请检查缩进是否正确。`,
        );
      }
      parent.children.push(node);
      stack.length = depth + 1;
      stack[depth] = node;
    }
  }

  return roots;
}

// ────────────────────────── Powerup 前缀解析 ──────────────────────────

export interface PowerupPrefixResult {
  cleanContent: string;
  powerups: Record<string, unknown>;
  /** 箭头分隔符后的 backText（有 backText 时） */
  backText?: string;
  /** 箭头分隔符推导的 practiceDirection */
  practiceDirection?: string;
  /** 是否为 multiline（↓ ↑ ↕） */
  isMultiline?: boolean;
}

/**
 * 从新增行的 rawContent 中解析 Markdown 前缀和箭头分隔符，提取属性。
 *
 * 解析顺序与 read-tree 输出的嵌套顺序对称：Header → Todo → Code → 箭头分隔符。
 *
 * 箭头分隔符（v2 格式）：
 *   中间箭头（有 backText）：` → ` ` ← ` ` ↔ ` ` ↓ ` ` ↑ ` ` ↕ `
 *   尾部箭头（无 backText，multiline）：` ↓` ` ↑` ` ↕`
 *
 * ⚠️ 已知限制：使用 indexOf 匹配第一个箭头，如果用户新增行的内容本身包含
 *   箭头字符（如 `A → B → C`），会被误切割为 text + backText。
 *   对于 read→edit 往返的已有行不受影响（序列化/反序列化对称）。
 */
export function parsePowerupPrefix(rawContent: string): PowerupPrefixResult {
  const powerups: Record<string, unknown> = {};

  if (rawContent === '---') {
    return { cleanContent: '', powerups: { addPowerup: 'dv' } };
  }

  let content = rawContent;

  // Header（从长到短匹配）
  if (content.startsWith('### '))      { powerups.fontSize = 'H3'; content = content.slice(4); }
  else if (content.startsWith('## '))  { powerups.fontSize = 'H2'; content = content.slice(3); }
  else if (content.startsWith('# '))   { powerups.fontSize = 'H1'; content = content.slice(2); }

  // Todo
  if (content.startsWith('- [x] '))      { powerups.isTodo = true; powerups.todoStatus = 'Finished'; content = content.slice(6); }
  else if (content.startsWith('- [ ] ')) { powerups.isTodo = true; content = content.slice(6); }

  // Code
  if (content.startsWith('`') && content.endsWith('`') && content.length >= 2) {
    powerups.isCode = true;
    content = content.slice(1, -1);
  }

  // 箭头分隔符解析
  let backText: string | undefined;
  let practiceDirection: string | undefined;
  let isMultiline: boolean | undefined;

  // 中间箭头（有 backText）— 按搜索顺序逐个匹配
  const midArrows: Array<[string, string, boolean]> = [
    [' ↔ ', 'both', false],
    [' ↕ ', 'both', true],
    [' → ', 'forward', false],
    [' ← ', 'backward', false],
    [' ↓ ', 'forward', true],
    [' ↑ ', 'backward', true],
  ];

  for (const [arrow, dir, multi] of midArrows) {
    const idx = content.indexOf(arrow);
    if (idx !== -1) {
      backText = content.slice(idx + arrow.length);
      content = content.slice(0, idx);
      practiceDirection = dir;
      isMultiline = multi;
      break;
    }
  }

  // 尾部箭头（无 backText，multiline）
  if (backText === undefined) {
    const tailArrows: Array<[string, string]> = [
      [' ↕', 'both'],
      [' ↓', 'forward'],
      [' ↑', 'backward'],
    ];
    for (const [arrow, dir] of tailArrows) {
      if (content.endsWith(arrow)) {
        content = content.slice(0, -arrow.length);
        practiceDirection = dir;
        isMultiline = true;
        break;
      }
    }
  }

  const hasChanges = Object.keys(powerups).length > 0
    || backText !== undefined
    || practiceDirection !== undefined;

  if (!hasChanges) return { cleanContent: rawContent, powerups: {} };

  const result: PowerupPrefixResult = { cleanContent: content, powerups };
  if (backText !== undefined) result.backText = backText;
  if (practiceDirection !== undefined) result.practiceDirection = practiceDirection;
  if (isMultiline !== undefined) result.isMultiline = isMultiline;
  return result;
}

// ────────────────────────── Multiline 检测 ──────────────────────────

/** multiline 箭头正则：中间箭头 ↓↑↕ 或尾部箭头 ↓↑↕ */
const MULTILINE_MID_RE = / [↓↑↕] /;
const MULTILINE_TAIL_RE = / [↓↑↕]$/;

/** 从行内容判断是否为 multiline 父节点（内容包含 ↓↑↕ 箭头） */
export function isContentMultiline(rawContent: string): boolean {
  return MULTILINE_MID_RE.test(rawContent) || MULTILINE_TAIL_RE.test(rawContent);
}

// ────────────────────────── Diff 算法 ──────────────────────────

/** 从旧大纲中构建 remId → { parentId, content, children metadata } 的映射 */
interface OldNodeInfo {
  parentId: string | null;
  content: string;
  childrenIds: string[];
  hasFoldedChildren: boolean;
  foldedCount: number;
}

function buildOldMap(roots: OutlineNode[]): Map<string, OldNodeInfo> {
  const map = new Map<string, OldNodeInfo>();

  function walk(node: OutlineNode, parentId: string | null): void {
    if (node.remId) {
      const childrenIds = node.children
        .filter(c => c.remId !== null)
        .map(c => c.remId!);

      // 检查折叠标记
      const foldedMatch = node.rawLine.match(/children:(\d+)/);
      const hasFoldedChildren = foldedMatch !== null && node.children.length === 0;
      const foldedCount = foldedMatch ? parseInt(foldedMatch[1], 10) : 0;

      map.set(node.remId, {
        parentId,
        content: node.rawContent,
        childrenIds,
        hasFoldedChildren,
        foldedCount,
      });
    }
    for (const child of node.children) {
      walk(child, node.remId);
    }
  }

  for (const root of roots) {
    walk(root, null);
  }
  return map;
}

/** 从新大纲中收集每个 remId 的新状态 */
interface NewNodeInfo {
  parentId: string | null;
  content: string;
  position: number; // 在父节点 children 中的位置
}

function buildNewMap(roots: OutlineNode[]): Map<string, NewNodeInfo> {
  const map = new Map<string, NewNodeInfo>();

  function walk(node: OutlineNode, parentId: string | null, position: number): void {
    if (node.remId) {
      map.set(node.remId, { parentId, content: node.rawContent, position });
    }
    let childPos = 0;
    for (const child of node.children) {
      walk(child, node.remId, childPos);
      childPos++;
    }
  }

  let rootPos = 0;
  for (const root of roots) {
    walk(root, null, rootPos);
    rootPos++;
  }
  return map;
}

/** 收集新大纲中的新增行（无 remId） */
interface NewLineInfo {
  content: string;
  parentId: string;
  position: number;
  parentIsMultiline: boolean;
}

function collectNewLines(roots: OutlineNode[]): NewLineInfo[] {
  const result: NewLineInfo[] = [];

  function walk(node: OutlineNode, parentId: string | null): void {
    let childPos = 0;
    for (const child of node.children) {
      if (child.remId === null && !child.isElided) {
        if (!parentId) {
          // 新增行不能作为根节点的兄弟（根 remId 为 null 时理论不会到这里）
          throw new Error('新增行缺少父节点');
        }
        result.push({
          content: child.rawContent,
          parentId,
          position: childPos,
          parentIsMultiline: isContentMultiline(node.rawContent),
        });
        // 新增行也可能有子节点（嵌套新增）
        collectNewLinesUnderNew(child, result);
      } else {
        walk(child, child.remId);
      }
      childPos++;
    }
  }

  for (const root of roots) {
    walk(root, root.remId);
  }
  return result;
}

/**
 * 新增行下面的嵌套新增行。
 * 这些行的 parentId 需要在创建时动态分配（临时占位标记）。
 */
function collectNewLinesUnderNew(parent: OutlineNode, result: NewLineInfo[]): void {
  let childPos = 0;
  for (const child of parent.children) {
    // parent 是新增行（无 remId），用占位标记
    result.push({
      content: child.rawContent,
      parentId: `__new_${result.length - 1}__`,
      position: childPos,
      parentIsMultiline: isContentMultiline(parent.rawContent),
    });
    if (child.children.length > 0) {
      collectNewLinesUnderNew(child, result);
    }
    childPos++;
  }
}

/** 递归收集所有省略占位符行的 rawContent */
function collectElidedLines(roots: OutlineNode[]): Set<string> {
  const result = new Set<string>();
  function walk(node: OutlineNode): void {
    if (node.isElided) {
      result.add(node.rawContent);
    }
    for (const child of node.children) {
      walk(child);
    }
  }
  for (const root of roots) walk(root);
  return result;
}

/**
 * 对比新旧大纲树，生成操作列表或报错。
 *
 * @param oldRoots 旧大纲解析结果
 * @param newRoots 新大纲解析结果（str_replace 后）
 * @returns 操作列表或错误
 */
export function diffTrees(
  oldRoots: OutlineNode[],
  newRoots: OutlineNode[],
): TreeDiffResult | TreeDiffError {
  const oldMap = buildOldMap(oldRoots);
  const newMap = buildNewMap(newRoots);

  // ── D7: 根节点校验 ──
  if (oldRoots.length > 0 && newRoots.length > 0) {
    const oldRoot = oldRoots[0];
    const newRoot = newRoots[0];
    if (oldRoot.remId && newRoot.remId !== oldRoot.remId) {
      return {
        type: 'root_modified',
        message: 'Root node cannot be changed, deleted or moved.',
        details: { expected: oldRoot.remId, actual: newRoot.remId },
      };
    }
  }

  // ── 省略行防线：检测旧大纲中的省略行是否在新大纲中被删除/修改 ──
  const oldElidedLines = collectElidedLines(oldRoots);
  const newElidedLines = collectElidedLines(newRoots);
  // 旧大纲中的每个省略行必须在新大纲中原样存在
  for (const elidedLine of oldElidedLines) {
    if (!newElidedLines.has(elidedLine)) {
      return {
        type: 'elided_modified',
        message: 'Cannot delete or modify elided region directly. Use read-tree with the parent remId to expand first.',
        details: { elidedLine },
      };
    }
  }

  // ── 内容变更检测 ──
  const modifiedRems: { remId: string; original_content: string; new_content: string }[] = [];
  for (const [remId, newInfo] of newMap) {
    const oldInfo = oldMap.get(remId);
    if (oldInfo && oldInfo.content !== newInfo.content) {
      modifiedRems.push({
        remId,
        original_content: oldInfo.content,
        new_content: newInfo.content,
      });
    }
  }
  if (modifiedRems.length > 0) {
    return {
      type: 'content_modified',
      message: 'Content modification of existing Rem is not allowed in tree edit mode.',
      details: {
        modified_rems: modifiedRems,
        hint: `Use edit-rem ${modifiedRems[0].remId} --old-str ... --new-str ... for content changes.`,
      },
    };
  }

  // ── D6: 折叠节点删除检测 ──
  const deletedIds = new Set<string>();
  for (const remId of oldMap.keys()) {
    if (!newMap.has(remId)) {
      deletedIds.add(remId);
    }
  }

  for (const remId of deletedIds) {
    const oldInfo = oldMap.get(remId)!;
    if (oldInfo.hasFoldedChildren) {
      return {
        type: 'folded_delete',
        message: `Cannot delete ${remId} because it has ${oldInfo.foldedCount} hidden children. Use read-tree to expand first.`,
        details: { remId, hidden_children_count: oldInfo.foldedCount },
      };
    }
  }

  // ── 孤儿检测 ──
  for (const remId of deletedIds) {
    const oldInfo = oldMap.get(remId)!;
    for (const childId of oldInfo.childrenIds) {
      if (!deletedIds.has(childId)) {
        return {
          type: 'orphan_detected',
          message: `Cannot delete ${remId} because it has children that were not removed.`,
          details: {
            orphaned_children: oldInfo.childrenIds.filter(id => !deletedIds.has(id)),
            hint: 'Either remove all children too, or move them to another parent first.',
          },
        };
      }
    }
  }

  const operations: TreeOp[] = [];

  // ── D4 步骤 1: 新增（按出现顺序，从浅到深） ──
  const newLines = collectNewLines(newRoots);
  for (const nl of newLines) {
    operations.push({
      type: 'create',
      content: nl.content,
      parentId: nl.parentId,
      position: nl.position,
      parentIsMultiline: nl.parentIsMultiline,
    });
  }

  // ── D4 步骤 2: 移动（父节点变化） ──
  for (const [remId, newInfo] of newMap) {
    const oldInfo = oldMap.get(remId);
    if (!oldInfo) continue; // 新节点不在旧树中（不应该出现，已有 remId 的节点应该在旧树中）
    if (oldInfo.parentId !== newInfo.parentId && newInfo.parentId !== null) {
      // 从新旧树中查找父节点内容以检测 multiline
      const fromParentNode = oldInfo.parentId ? findNodeById(oldRoots, oldInfo.parentId) : null;
      const toParentNode = findNodeById(newRoots, newInfo.parentId);
      operations.push({
        type: 'move',
        remId,
        fromParentId: oldInfo.parentId ?? '',
        toParentId: newInfo.parentId,
        position: newInfo.position,
        fromParentIsMultiline: fromParentNode ? isContentMultiline(fromParentNode.rawContent) : false,
        toParentIsMultiline: toParentNode ? isContentMultiline(toParentNode.rawContent) : false,
      });
    }
  }

  // ── D4 步骤 3: 重排（同父节点内位置变化） ──
  // 按父节点分组，比较 children 顺序
  const newChildrenByParent = new Map<string, string[]>();
  for (const [remId, newInfo] of newMap) {
    if (newInfo.parentId === null) continue;
    if (!newChildrenByParent.has(newInfo.parentId)) {
      newChildrenByParent.set(newInfo.parentId, []);
    }
    // 只收集未被删除且未被移动的节点
    const oldInfo = oldMap.get(remId);
    if (oldInfo && oldInfo.parentId === newInfo.parentId) {
      newChildrenByParent.get(newInfo.parentId)!.push(remId);
    }
  }

  for (const [parentId, newOrder] of newChildrenByParent) {
    const oldInfo = oldMap.get(parentId);
    if (!oldInfo) continue;
    // 过滤出在新旧中都存在且父节点未变的 children
    const oldOrder = oldInfo.childrenIds.filter(id => newMap.has(id) && newMap.get(id)!.parentId === parentId);
    if (oldOrder.length === newOrder.length && !oldOrder.every((id, i) => id === newOrder[i])) {
      // 需要包含所有新 children（含新增行的 placeholder 和移入的节点）
      // 获取完整的新 children 顺序
      const fullNewOrder: string[] = [];
      const newRoot = findNodeById(newRoots, parentId);
      if (newRoot) {
        for (const child of newRoot.children) {
          if (child.remId) fullNewOrder.push(child.remId);
        }
      }
      if (fullNewOrder.length > 0) {
        operations.push({ type: 'reorder', parentId, order: fullNewOrder });
      }
    }
  }

  // ── D4 步骤 4: 删除（按层级从深到浅） ──
  const deleteOps = Array.from(deletedIds).map(remId => {
    // 计算深度
    let depth = 0;
    let currentId: string | null = remId;
    while (currentId) {
      const info = oldMap.get(currentId);
      if (!info || !info.parentId) break;
      currentId = info.parentId;
      depth++;
    }
    return { remId, depth };
  });
  // 从深到浅排序
  deleteOps.sort((a, b) => b.depth - a.depth);
  for (const { remId } of deleteOps) {
    operations.push({ type: 'delete', remId });
  }

  return { operations };
}

/** 在树中按 remId 查找节点 */
function findNodeById(roots: OutlineNode[], remId: string): OutlineNode | null {
  for (const root of roots) {
    if (root.remId === remId) return root;
    const found = findNodeByIdRecursive(root.children, remId);
    if (found) return found;
  }
  return null;
}

function findNodeByIdRecursive(nodes: OutlineNode[], remId: string): OutlineNode | null {
  for (const node of nodes) {
    if (node.remId === remId) return node;
    const found = findNodeByIdRecursive(node.children, remId);
    if (found) return found;
  }
  return null;
}
