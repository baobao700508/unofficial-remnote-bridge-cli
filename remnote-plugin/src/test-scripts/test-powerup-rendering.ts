/**
 * Powerup 渲染机制测试 — 每个 SDK 渲染方法的隐藏副作用探测
 *
 * 目的：搞清楚每个改变 Rem "整体渲染" 的 SDK 方法到底：
 * 1. 是否在 tags 数组中注入了 Powerup Tag 引用？
 * 2. 是否在 children 中生成了隐藏的 Powerup 子 Rem？
 * 3. 是否改变了其他属性（hasPowerup 等）？
 *
 * 设计原则：一个 Rem 只用一种 SDK 方法，避免效果叠加。
 */
import type { ReactRNPlugin, PluginRem as Rem } from '@remnote/plugin-sdk';

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** 单个测试用例的探测结果 */
interface ProbeResult {
  label: string;
  remId: string;
  // SDK 方法调用前的快照
  before: RemSnapshot;
  // SDK 方法调用后的快照
  after: RemSnapshot;
  // 差异摘要
  diff: DiffSummary;
}

interface RemSnapshot {
  tags: TagInfo[];
  children: ChildInfo[];
  hasPowerup: PowerupCheck[];
  // 其他可能相关的属性
  type: number | string | null;
  isDocument: boolean;
  fontSize: string | null;
  highlightColor: string | null;
  isTodo: boolean;
  todoStatus: string | null;
  isCode: boolean;
  isQuote: boolean;
  isListItem: boolean;
  isCardItem: boolean;
  isSlot: boolean;
  isProperty: boolean;
}

interface TagInfo {
  id: string;
  text: string;
  isPowerup: boolean;
}

interface ChildInfo {
  id: string;
  text: string;
  backText: string | null;
  type: number | string | null;
  isPowerup: boolean;
  isPowerupProperty: boolean;
  children: ChildInfo[];
}

interface PowerupCheck {
  code: string;
  name: string;
  hasPowerup: boolean;
}

interface DiffSummary {
  tagsAdded: TagInfo[];
  tagsRemoved: TagInfo[];
  childrenAdded: ChildInfo[];
  childrenRemoved: ChildInfo[];
  powerupsChanged: PowerupCheck[];
  fieldsChanged: string[];
}

// 需要探测的内置 Powerup codes（只检测与渲染相关的）
const RENDERING_POWERUP_CODES: Array<{ code: string; name: string }> = [
  { code: 'r', name: 'Header' },
  { code: 'h', name: 'Highlight' },
  { code: 'cd', name: 'Code' },
  { code: 'qt', name: 'Quote' },
  { code: 'i', name: 'List' },
  { code: 't', name: 'Todo' },
  { code: 'w', name: 'MultiLineCard' },
  { code: 'o', name: 'Document' },
  { code: 'e', name: 'EditLater' },
  { code: 'dv', name: 'Divider' },
  { code: 'u', name: 'DisableCards' },
  { code: 'y', name: 'Slot' },
  { code: 'l', name: 'Aliases' },
  { code: 'b', name: 'Link' },
];

/** 拍摄一个 Rem 的完整快照 */
async function takeSnapshot(
  plugin: ReactRNPlugin,
  rem: Rem,
): Promise<RemSnapshot> {
  // 获取 tags
  const tagRems = await rem.getTagRems();
  const tags: TagInfo[] = [];
  for (const t of tagRems) {
    const text = t.text ? await plugin.richText.toString(t.text) : '';
    const isPowerup = await t.isPowerup();
    tags.push({ id: t._id, text, isPowerup });
  }

  // 获取 children（递归一层即可）
  const childRems = await rem.getChildrenRem();
  const children: ChildInfo[] = [];
  for (const c of childRems) {
    children.push(await serializeChild(plugin, c, 0));
  }

  // 检测各 Powerup 状态
  const hasPowerup: PowerupCheck[] = [];
  for (const { code, name } of RENDERING_POWERUP_CODES) {
    try {
      const has = await rem.hasPowerup(code);
      hasPowerup.push({ code, name, hasPowerup: has });
    } catch {
      hasPowerup.push({ code, name, hasPowerup: false });
    }
  }

  // 获取渲染相关字段
  const [
    remType,
    isDocument,
    fontSize,
    highlightColor,
    isTodo,
    todoStatus,
    isCode,
    isQuote,
    isListItem,
    isCardItem,
    isSlot,
    isProperty,
  ] = await Promise.all([
    rem.getType(),
    rem.isDocument(),
    rem.getFontSize(),
    rem.getHighlightColor(),
    rem.isTodo(),
    rem.getTodoStatus(),
    rem.isCode(),
    rem.isQuote(),
    rem.isListItem(),
    rem.isCardItem(),
    rem.isSlot(),
    rem.isProperty(),
  ]);

  return {
    tags,
    children,
    hasPowerup,
    type: remType,
    isDocument,
    fontSize: (fontSize as string) ?? null,
    highlightColor: (highlightColor as string) ?? null,
    isTodo,
    todoStatus: (todoStatus as string) ?? null,
    isCode,
    isQuote,
    isListItem,
    isCardItem,
    isSlot,
    isProperty,
  };
}

/** 递归序列化子 Rem（最深 2 层） */
async function serializeChild(
  plugin: ReactRNPlugin,
  rem: Rem,
  depth: number,
): Promise<ChildInfo> {
  const text = rem.text ? await plugin.richText.toString(rem.text) : '';
  const backText = rem.backText ? await plugin.richText.toString(rem.backText) : null;
  const isPowerup = await rem.isPowerup();
  const isPowerupProperty = await rem.isPowerupProperty();

  const children: ChildInfo[] = [];
  if (depth < 2) {
    const childRems = await rem.getChildrenRem();
    for (const c of childRems) {
      children.push(await serializeChild(plugin, c, depth + 1));
    }
  }

  return {
    id: rem._id,
    text,
    backText,
    type: rem.type,
    isPowerup,
    isPowerupProperty,
    children,
  };
}

/** 计算前后快照的差异 */
function computeDiff(before: RemSnapshot, after: RemSnapshot): DiffSummary {
  const beforeTagIds = new Set(before.tags.map(t => t.id));
  const afterTagIds = new Set(after.tags.map(t => t.id));

  const tagsAdded = after.tags.filter(t => !beforeTagIds.has(t.id));
  const tagsRemoved = before.tags.filter(t => !afterTagIds.has(t.id));

  const beforeChildIds = new Set(before.children.map(c => c.id));
  const afterChildIds = new Set(after.children.map(c => c.id));

  const childrenAdded = after.children.filter(c => !beforeChildIds.has(c.id));
  const childrenRemoved = before.children.filter(c => !afterChildIds.has(c.id));

  const powerupsChanged = after.hasPowerup.filter(ap => {
    const bp = before.hasPowerup.find(b => b.code === ap.code);
    return !bp || bp.hasPowerup !== ap.hasPowerup;
  });

  const fieldsChanged: string[] = [];
  const fieldKeys: (keyof RemSnapshot)[] = [
    'type', 'isDocument', 'fontSize', 'highlightColor',
    'isTodo', 'todoStatus', 'isCode', 'isQuote',
    'isListItem', 'isCardItem', 'isSlot', 'isProperty',
  ];
  for (const key of fieldKeys) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      fieldsChanged.push(`${key}: ${JSON.stringify(before[key])} -> ${JSON.stringify(after[key])}`);
    }
  }

  return { tagsAdded, tagsRemoved, childrenAdded, childrenRemoved, powerupsChanged, fieldsChanged };
}

/** 格式化报告 */
function formatReport(results: ProbeResult[]): string {
  const lines: string[] = [];
  lines.push('='.repeat(80));
  lines.push('Powerup 渲染机制探测报告');
  lines.push(`测试时间: ${new Date().toISOString()}`);
  lines.push(`测试数量: ${results.length}`);
  lines.push('='.repeat(80));
  lines.push('');

  for (const r of results) {
    lines.push('-'.repeat(60));
    lines.push(`[${r.label}]  remId: ${r.remId}`);
    lines.push('-'.repeat(60));

    // Tags 变化
    if (r.diff.tagsAdded.length > 0) {
      lines.push('  Tags 新增:');
      for (const t of r.diff.tagsAdded) {
        lines.push(`    + "${t.text}" (${t.id}) isPowerup=${t.isPowerup}`);
      }
    }
    if (r.diff.tagsRemoved.length > 0) {
      lines.push('  Tags 移除:');
      for (const t of r.diff.tagsRemoved) {
        lines.push(`    - "${t.text}" (${t.id}) isPowerup=${t.isPowerup}`);
      }
    }

    // Children 变化
    if (r.diff.childrenAdded.length > 0) {
      lines.push('  Children 新增:');
      for (const c of r.diff.childrenAdded) {
        const back = c.backText ? ` ;; "${c.backText}"` : '';
        lines.push(`    + "${c.text}"${back} (${c.id}) type=${c.type} isPowerup=${c.isPowerup} isPowerupProp=${c.isPowerupProperty}`);
        for (const gc of c.children) {
          const gcBack = gc.backText ? ` ;; "${gc.backText}"` : '';
          lines.push(`      + "${gc.text}"${gcBack} (${gc.id}) type=${gc.type} isPowerup=${gc.isPowerup} isPowerupProp=${gc.isPowerupProperty}`);
        }
      }
    }
    if (r.diff.childrenRemoved.length > 0) {
      lines.push('  Children 移除:');
      for (const c of r.diff.childrenRemoved) {
        lines.push(`    - "${c.text}" (${c.id})`);
      }
    }

    // Powerup 状态变化
    if (r.diff.powerupsChanged.length > 0) {
      lines.push('  Powerup 状态变化:');
      for (const p of r.diff.powerupsChanged) {
        lines.push(`    ${p.name} (${p.code}): ${p.hasPowerup}`);
      }
    }

    // 字段变化
    if (r.diff.fieldsChanged.length > 0) {
      lines.push('  字段变化:');
      for (const f of r.diff.fieldsChanged) {
        lines.push(`    ${f}`);
      }
    }

    // 无变化
    if (
      r.diff.tagsAdded.length === 0 &&
      r.diff.tagsRemoved.length === 0 &&
      r.diff.childrenAdded.length === 0 &&
      r.diff.childrenRemoved.length === 0 &&
      r.diff.powerupsChanged.length === 0 &&
      r.diff.fieldsChanged.length === 0
    ) {
      lines.push('  (无可检测的变化)');
    }

    // 完整的 after 快照（供详细分析）
    lines.push('  After 完整快照:');
    lines.push(`    tags (${r.after.tags.length}): ${JSON.stringify(r.after.tags.map(t => ({ text: t.text, isPowerup: t.isPowerup })))}`);
    lines.push(`    children (${r.after.children.length}): ${JSON.stringify(r.after.children.map(c => ({ text: c.text, backText: c.backText, isPowerup: c.isPowerup, isPowerupProp: c.isPowerupProperty, childCount: c.children.length })))}`);
    lines.push(`    hasPowerup (true only): ${JSON.stringify(r.after.hasPowerup.filter(p => p.hasPowerup).map(p => p.name))}`);
    lines.push('');
  }

  lines.push('='.repeat(80));
  lines.push('报告结束');
  lines.push('='.repeat(80));

  return lines.join('\n');
}

export async function runPowerupRenderingTest(plugin: ReactRNPlugin): Promise<void> {
  const alreadyRan = await plugin.storage.getSession('powerup-render-test-v2-ran');
  if (alreadyRan) {
    console.log('[POWERUP-RENDER] 已运行过，跳过');
    return;
  }
  await plugin.storage.setSession('powerup-render-test-v2-ran', true);

  console.log('[POWERUP-RENDER] ========== 开始 Powerup 渲染机制探测 ==========');

  try {
    // ── 找到 "mcp 测试" 文档 ──
    const allRem = await plugin.rem.getAll();
    let parentDoc: Rem | undefined;
    for (const r of allRem) {
      const t = r.text ? await plugin.richText.toString(r.text) : '';
      if (t.trim() === 'mcp') { parentDoc = r; break; }
    }
    if (!parentDoc) { console.error('[POWERUP-RENDER] 找不到 "mcp"'); return; }

    // ── 清理上次测试残留（以 "PU:" 开头的 Rem）──
    const children = await parentDoc.getChildrenRem();
    for (const c of children) {
      const t = c.text ? await plugin.richText.toString(c.text) : '';
      if (t.startsWith('PU:') || t.startsWith('=== Powerup')) {
        await c.remove();
        await delay(100);
      }
    }
    await delay(500);

    let pos = 0;
    const results: ProbeResult[] = [];

    // ── 工具函数：创建空白 Rem 并拍快照 ──
    async function createAndSnapshotBefore(label: string): Promise<{ rem: Rem; before: RemSnapshot } | null> {
      const r = await plugin.rem.createRem();
      if (!r) return null;
      await r.setParent(parentDoc!._id, pos++);
      await r.setText([`PU: ${label}`]);
      await delay(500); // 等 SDK 稳定
      const before = await takeSnapshot(plugin, r);
      return { rem: r, before };
    }

    // ── 工具函数：执行 SDK 方法后拍快照并记录差异 ──
    async function probeAfter(
      label: string,
      rem: Rem,
      before: RemSnapshot,
    ): Promise<void> {
      await delay(500); // 等 SDK 稳定
      // 重新获取 Rem（某些操作可能需要刷新）
      const fresh = await plugin.rem.findOne(rem._id);
      if (!fresh) {
        console.error(`[POWERUP-RENDER] Rem ${rem._id} 不存在了`);
        return;
      }
      const after = await takeSnapshot(plugin, fresh);
      const diff = computeDiff(before, after);
      results.push({ label, remId: rem._id, before, after, diff });
      console.log(`[POWERUP-RENDER] ${label}: done`);
    }

    // ════════════════════════════════════════════════════════════
    //  测试用例：每个 Rem 只用一种 SDK 方法
    // ════════════════════════════════════════════════════════════

    // 1. setFontSize('H1')
    {
      const ctx = await createAndSnapshotBefore('setFontSize(H1)');
      if (ctx) {
        await ctx.rem.setFontSize('H1');
        await probeAfter('setFontSize(H1)', ctx.rem, ctx.before);
      }
    }

    // 2. setFontSize('H2')
    {
      const ctx = await createAndSnapshotBefore('setFontSize(H2)');
      if (ctx) {
        await ctx.rem.setFontSize('H2');
        await probeAfter('setFontSize(H2)', ctx.rem, ctx.before);
      }
    }

    // 3. setFontSize('H3')
    {
      const ctx = await createAndSnapshotBefore('setFontSize(H3)');
      if (ctx) {
        await ctx.rem.setFontSize('H3');
        await probeAfter('setFontSize(H3)', ctx.rem, ctx.before);
      }
    }

    // 4. setHighlightColor('Red')
    {
      const ctx = await createAndSnapshotBefore('setHighlightColor(Red)');
      if (ctx) {
        await ctx.rem.setHighlightColor('Red');
        await probeAfter('setHighlightColor(Red)', ctx.rem, ctx.before);
      }
    }

    // 5. setHighlightColor('Blue')
    {
      const ctx = await createAndSnapshotBefore('setHighlightColor(Blue)');
      if (ctx) {
        await ctx.rem.setHighlightColor('Blue');
        await probeAfter('setHighlightColor(Blue)', ctx.rem, ctx.before);
      }
    }

    // 6. setHighlightColor('Green')
    {
      const ctx = await createAndSnapshotBefore('setHighlightColor(Green)');
      if (ctx) {
        await ctx.rem.setHighlightColor('Green');
        await probeAfter('setHighlightColor(Green)', ctx.rem, ctx.before);
      }
    }

    // 7. setIsCode(true)
    {
      const ctx = await createAndSnapshotBefore('setIsCode(true)');
      if (ctx) {
        await ctx.rem.setIsCode(true);
        await probeAfter('setIsCode(true)', ctx.rem, ctx.before);
      }
    }

    // 8. setIsQuote(true)
    {
      const ctx = await createAndSnapshotBefore('setIsQuote(true)');
      if (ctx) {
        await ctx.rem.setIsQuote(true);
        await probeAfter('setIsQuote(true)', ctx.rem, ctx.before);
      }
    }

    // 9. setIsListItem(true)
    {
      const ctx = await createAndSnapshotBefore('setIsListItem(true)');
      if (ctx) {
        await ctx.rem.setIsListItem(true);
        await probeAfter('setIsListItem(true)', ctx.rem, ctx.before);
      }
    }

    // 10. setIsTodo(true)
    {
      const ctx = await createAndSnapshotBefore('setIsTodo(true)');
      if (ctx) {
        await ctx.rem.setIsTodo(true);
        await probeAfter('setIsTodo(true)', ctx.rem, ctx.before);
      }
    }

    // 11. setTodoStatus('Finished') — 需要先 setIsTodo
    {
      const ctx = await createAndSnapshotBefore('setTodoStatus(Finished)');
      if (ctx) {
        await ctx.rem.setIsTodo(true);
        await delay(300);
        // 重新拍 before（因为 setIsTodo 已经改变了状态）
        const beforeTodoFinish = await takeSnapshot(plugin, ctx.rem);
        await ctx.rem.setTodoStatus('Finished');
        await probeAfter('setTodoStatus(Finished) [after setIsTodo]', ctx.rem, beforeTodoFinish);
      }
    }

    // 12. setIsCardItem(true)
    {
      const ctx = await createAndSnapshotBefore('setIsCardItem(true)');
      if (ctx) {
        await ctx.rem.setIsCardItem(true);
        await probeAfter('setIsCardItem(true)', ctx.rem, ctx.before);
      }
    }

    // 13. setIsDocument(true)
    {
      const ctx = await createAndSnapshotBefore('setIsDocument(true)');
      if (ctx) {
        await ctx.rem.setIsDocument(true);
        await probeAfter('setIsDocument(true)', ctx.rem, ctx.before);
      }
    }

    // 14. setType(CONCEPT = 1)
    {
      const ctx = await createAndSnapshotBefore('setType(CONCEPT)');
      if (ctx) {
        await ctx.rem.setType(1 as any);
        await probeAfter('setType(CONCEPT)', ctx.rem, ctx.before);
      }
    }

    // 15. setType(DESCRIPTOR = 2)
    {
      const ctx = await createAndSnapshotBefore('setType(DESCRIPTOR)');
      if (ctx) {
        await ctx.rem.setType(2 as any);
        await probeAfter('setType(DESCRIPTOR)', ctx.rem, ctx.before);
      }
    }

    // 16. setIsSlot(true)
    {
      const ctx = await createAndSnapshotBefore('setIsSlot(true)');
      if (ctx) {
        await ctx.rem.setIsSlot(true);
        await probeAfter('setIsSlot(true)', ctx.rem, ctx.before);
      }
    }

    // 17. setIsProperty(true)
    {
      const ctx = await createAndSnapshotBefore('setIsProperty(true)');
      if (ctx) {
        await ctx.rem.setIsProperty(true);
        await probeAfter('setIsProperty(true)', ctx.rem, ctx.before);
      }
    }

    // 18. setBackText (产生正反面)
    {
      const ctx = await createAndSnapshotBefore('setBackText');
      if (ctx) {
        await ctx.rem.setBackText(['这是背面文本']);
        await probeAfter('setBackText', ctx.rem, ctx.before);
      }
    }

    // 19. addPowerup(Header) — 直接用 Powerup API
    {
      const ctx = await createAndSnapshotBefore('addPowerup(Header)');
      if (ctx) {
        await ctx.rem.addPowerup('r');
        await probeAfter('addPowerup(Header)', ctx.rem, ctx.before);
      }
    }

    // 20. addPowerup(Highlight) — 直接用 Powerup API
    {
      const ctx = await createAndSnapshotBefore('addPowerup(Highlight)');
      if (ctx) {
        await ctx.rem.addPowerup('h');
        await probeAfter('addPowerup(Highlight)', ctx.rem, ctx.before);
      }
    }

    // 21. addPowerup(Code) — 直接用 Powerup API
    {
      const ctx = await createAndSnapshotBefore('addPowerup(Code)');
      if (ctx) {
        await ctx.rem.addPowerup('cd');
        await probeAfter('addPowerup(Code)', ctx.rem, ctx.before);
      }
    }

    // 22. addPowerup(Quote) — 直接用 Powerup API
    {
      const ctx = await createAndSnapshotBefore('addPowerup(Quote)');
      if (ctx) {
        await ctx.rem.addPowerup('qt');
        await probeAfter('addPowerup(Quote)', ctx.rem, ctx.before);
      }
    }

    // 23. addPowerup(Todo) — 直接用 Powerup API
    {
      const ctx = await createAndSnapshotBefore('addPowerup(Todo)');
      if (ctx) {
        await ctx.rem.addPowerup('t');
        await probeAfter('addPowerup(Todo)', ctx.rem, ctx.before);
      }
    }

    // 24. addPowerup(List) — 直接用 Powerup API
    {
      const ctx = await createAndSnapshotBefore('addPowerup(List)');
      if (ctx) {
        await ctx.rem.addPowerup('i');
        await probeAfter('addPowerup(List)', ctx.rem, ctx.before);
      }
    }

    // 25. addPowerup(EditLater) — 直接用 Powerup API
    {
      const ctx = await createAndSnapshotBefore('addPowerup(EditLater)');
      if (ctx) {
        await ctx.rem.addPowerup('e');
        await probeAfter('addPowerup(EditLater)', ctx.rem, ctx.before);
      }
    }

    // 26. addPowerup(Document) — 直接用 Powerup API
    {
      const ctx = await createAndSnapshotBefore('addPowerup(Document)');
      if (ctx) {
        await ctx.rem.addPowerup('o');
        await probeAfter('addPowerup(Document)', ctx.rem, ctx.before);
      }
    }

    // 27. addPowerup(MultiLineCard) — 直接用 Powerup API
    {
      const ctx = await createAndSnapshotBefore('addPowerup(MultiLineCard)');
      if (ctx) {
        await ctx.rem.addPowerup('w');
        await probeAfter('addPowerup(MultiLineCard)', ctx.rem, ctx.before);
      }
    }

    // 28. addPowerup(Divider)
    {
      const ctx = await createAndSnapshotBefore('addPowerup(Divider)');
      if (ctx) {
        await ctx.rem.addPowerup('dv');
        await probeAfter('addPowerup(Divider)', ctx.rem, ctx.before);
      }
    }

    // 29. setPowerupProperty(Header, Size, H1) — 先 addPowerup 再设属性
    {
      const ctx = await createAndSnapshotBefore('setPowerupProperty(Header,Size,H1)');
      if (ctx) {
        await ctx.rem.addPowerup('r');
        await delay(300);
        // 重新拍 before（addPowerup 已改变状态）
        const beforeSetProp = await takeSnapshot(plugin, ctx.rem);
        await ctx.rem.setPowerupProperty('r', 'Size', ['H1']);
        await probeAfter('setPowerupProperty(Header,Size,H1) [after addPowerup]', ctx.rem, beforeSetProp);
      }
    }

    // 30. setPowerupProperty(Highlight, Color, Red) — 先 addPowerup 再设属性
    {
      const ctx = await createAndSnapshotBefore('setPowerupProperty(Highlight,Color,Red)');
      if (ctx) {
        await ctx.rem.addPowerup('h');
        await delay(300);
        const beforeSetProp = await takeSnapshot(plugin, ctx.rem);
        await ctx.rem.setPowerupProperty('h', 'Color', ['Red']);
        await probeAfter('setPowerupProperty(Highlight,Color,Red) [after addPowerup]', ctx.rem, beforeSetProp);
      }
    }

    // 31. setEnablePractice(true)
    {
      const ctx = await createAndSnapshotBefore('setEnablePractice(true)');
      if (ctx) {
        await ctx.rem.setEnablePractice(true);
        await probeAfter('setEnablePractice(true)', ctx.rem, ctx.before);
      }
    }

    // 32. setPracticeDirection('forward')
    {
      const ctx = await createAndSnapshotBefore('setPracticeDirection(forward)');
      if (ctx) {
        await ctx.rem.setPracticeDirection('forward');
        await probeAfter('setPracticeDirection(forward)', ctx.rem, ctx.before);
      }
    }

    // ════════════════════════════════════════════════════════════
    //  生成并输出报告
    // ════════════════════════════════════════════════════════════

    const report = formatReport(results);
    console.log(report);

    // 同时创建一个报告 Rem，方便在 RemNote 中查看
    const reportRem = await plugin.rem.createRem();
    if (reportRem) {
      await reportRem.setParent(parentDoc._id, pos++);
      await reportRem.setText([`=== Powerup 渲染探测完毕 (${results.length} 个测试) ===`]);
      await reportRem.setHighlightColor('Green');
    }

    // 将完整 JSON 结果存到 session，方便通过 bridge 读取
    await plugin.storage.setSession('powerup-render-results', results);

    console.log('[POWERUP-RENDER] ========== 探测完毕 ==========');

  } catch (err) {
    console.error('[POWERUP-RENDER] 出错:', err);
  }
}
