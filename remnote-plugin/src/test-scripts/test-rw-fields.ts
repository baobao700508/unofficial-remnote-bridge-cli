/**
 * RW 字段行为观察测试
 *
 * 每个 RW 字段创建一个**独立**的 Rem，清晰标注字段名，
 * 方便截图逐个观察视觉行为。
 */
import type { ReactRNPlugin, PluginRem as Rem } from '@remnote/plugin-sdk';

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function runRwFieldTests(plugin: ReactRNPlugin): Promise<void> {
  // 防止重复运行
  const alreadyRan = await plugin.storage.getSession('rw-test-v3-ran');
  if (alreadyRan) {
    console.log('[RW-TEST] 已运行过，跳过');
    return;
  }
  await plugin.storage.setSession('rw-test-v3-ran', true);

  console.log('[RW-TEST] ========== 开始逐字段行为观察 ==========');

  try {
    // ── 找到 "mcp 测试" 文档 ──
    const allRem = await plugin.rem.getAll();
    let parentDoc: Rem | undefined;
    for (const r of allRem) {
      const t = r.text ? await plugin.richText.toString(r.text) : '';
      if (t.trim() === 'mcp 测试') { parentDoc = r; break; }
    }
    if (!parentDoc) { console.error('[RW-TEST] 找不到 "mcp 测试"'); return; }

    // ── 先清理上次测试残留（以 "RW:" 开头的 Rem）──
    const children = await parentDoc.getChildrenRem();
    for (const c of children) {
      const t = c.text ? await plugin.richText.toString(c.text) : '';
      if (t.startsWith('RW:') || t.startsWith('辅助') || t.startsWith('兄弟') || t.startsWith('RW 字段测试') || t.startsWith('[PASS]') || t.startsWith('[FAIL]') || t.startsWith('测试文本')) {
        await c.remove();
        await delay(100);
      }
    }
    await delay(500);

    // 创建辅助 Rem（用于 tags/sources 测试）
    const helperTag = await plugin.rem.createRem();
    if (!helperTag) return;
    await helperTag.setParent(parentDoc._id, 0);
    await helperTag.setText(['辅助: 标签Rem']);
    await delay(200);

    const helperSource = await plugin.rem.createRem();
    if (!helperSource) return;
    await helperSource.setParent(parentDoc._id, 1);
    await helperSource.setText(['辅助: 来源Rem']);
    await delay(200);

    let pos = 2; // 当前插入位置

    // ── 工具函数：创建一个独立测试 Rem ──
    async function createTestRem(label: string): Promise<Rem | null> {
      const r = await plugin.rem.createRem();
      if (!r) return null;
      await r.setParent(parentDoc!._id, pos++);
      await r.setText([`RW: ${label} — 初始状态`]);
      await delay(300);
      return r;
    }

    // ════════════════════════════════════════════════
    //  1. text
    // ════════════════════════════════════════════════
    {
      const r = await createTestRem('text');
      if (r) {
        // 默认文本已设为 "RW: text — 初始状态"，改为新值
        await r.setText(['RW: text — 已改为新文本内容']);
        await delay(500);
        console.log('[RW-TEST] text: done');
      }
    }

    // ════════════════════════════════════════════════
    //  2. backText
    // ════════════════════════════════════════════════
    {
      const r = await createTestRem('backText');
      if (r) {
        await r.setBackText(['这是背面文本（答案面）']);
        await delay(500);
        console.log('[RW-TEST] backText: done');
      }
    }

    // ════════════════════════════════════════════════
    //  3. type = CONCEPT
    // ════════════════════════════════════════════════
    {
      const r = await createTestRem('type=CONCEPT');
      if (r) {
        await r.setType(1 as any); // CONCEPT
        await delay(500);
        console.log('[RW-TEST] type=CONCEPT: done');
      }
    }

    // ════════════════════════════════════════════════
    //  4. type = DESCRIPTOR
    // ════════════════════════════════════════════════
    {
      const r = await createTestRem('type=DESCRIPTOR');
      if (r) {
        await r.setType(2 as any); // DESCRIPTOR
        await delay(500);
        console.log('[RW-TEST] type=DESCRIPTOR: done');
      }
    }

    // ════════════════════════════════════════════════
    //  5. isDocument = true
    // ════════════════════════════════════════════════
    {
      const r = await createTestRem('isDocument=true');
      if (r) {
        await r.setIsDocument(true);
        await delay(500);
        console.log('[RW-TEST] isDocument: done');
      }
    }

    // ════════════════════════════════════════════════
    //  6. fontSize = H1
    // ════════════════════════════════════════════════
    {
      const r = await createTestRem('fontSize=H1');
      if (r) {
        await r.setFontSize('H1');
        await delay(500);
        console.log('[RW-TEST] fontSize=H1: done');
      }
    }

    // ════════════════════════════════════════════════
    //  7. fontSize = H2
    // ════════════════════════════════════════════════
    {
      const r = await createTestRem('fontSize=H2');
      if (r) {
        await r.setFontSize('H2');
        await delay(500);
        console.log('[RW-TEST] fontSize=H2: done');
      }
    }

    // ════════════════════════════════════════════════
    //  8. fontSize = H3
    // ════════════════════════════════════════════════
    {
      const r = await createTestRem('fontSize=H3');
      if (r) {
        await r.setFontSize('H3');
        await delay(500);
        console.log('[RW-TEST] fontSize=H3: done');
      }
    }

    // ════════════════════════════════════════════════
    //  9. highlightColor = Red
    // ════════════════════════════════════════════════
    {
      const r = await createTestRem('highlightColor=Red');
      if (r) {
        await r.setHighlightColor('Red');
        await delay(500);
        console.log('[RW-TEST] highlightColor=Red: done');
      }
    }

    // ════════════════════════════════════════════════
    //  10. highlightColor = Blue
    // ════════════════════════════════════════════════
    {
      const r = await createTestRem('highlightColor=Blue');
      if (r) {
        await r.setHighlightColor('Blue');
        await delay(500);
        console.log('[RW-TEST] highlightColor=Blue: done');
      }
    }

    // ════════════════════════════════════════════════
    //  11. isTodo = true (未完成)
    // ════════════════════════════════════════════════
    {
      const r = await createTestRem('isTodo=true');
      if (r) {
        await r.setIsTodo(true);
        await delay(500);
        console.log('[RW-TEST] isTodo: done');
      }
    }

    // ════════════════════════════════════════════════
    //  12. todoStatus = Finished
    // ════════════════════════════════════════════════
    {
      const r = await createTestRem('todoStatus=Finished');
      if (r) {
        await r.setIsTodo(true);
        await delay(200);
        await r.setTodoStatus('Finished');
        await delay(500);
        console.log('[RW-TEST] todoStatus=Finished: done');
      }
    }

    // ════════════════════════════════════════════════
    //  13. isCode = true
    // ════════════════════════════════════════════════
    {
      const r = await createTestRem('isCode=true');
      if (r) {
        await r.setIsCode(true);
        await delay(500);
        console.log('[RW-TEST] isCode: done');
      }
    }

    // ════════════════════════════════════════════════
    //  14. isQuote = true
    // ════════════════════════════════════════════════
    {
      const r = await createTestRem('isQuote=true');
      if (r) {
        await r.setIsQuote(true);
        await delay(500);
        console.log('[RW-TEST] isQuote: done');
      }
    }

    // ════════════════════════════════════════════════
    //  15. isListItem = true
    // ════════════════════════════════════════════════
    {
      const r = await createTestRem('isListItem=true');
      if (r) {
        await r.setIsListItem(true);
        await delay(500);
        console.log('[RW-TEST] isListItem: done');
      }
    }

    // ════════════════════════════════════════════════
    //  16. isCardItem = true
    // ════════════════════════════════════════════════
    {
      const r = await createTestRem('isCardItem=true');
      if (r) {
        await r.setIsCardItem(true);
        await delay(500);
        console.log('[RW-TEST] isCardItem: done');
      }
    }

    // ════════════════════════════════════════════════
    //  17. isSlot = true
    // ════════════════════════════════════════════════
    {
      const r = await createTestRem('isSlot=true');
      if (r) {
        await r.setIsSlot(true);
        await delay(500);
        console.log('[RW-TEST] isSlot: done');
      }
    }

    // ════════════════════════════════════════════════
    //  18. isProperty = true
    // ════════════════════════════════════════════════
    {
      const r = await createTestRem('isProperty=true');
      if (r) {
        await r.setIsProperty(true);
        await delay(500);
        console.log('[RW-TEST] isProperty: done');
      }
    }

    // ════════════════════════════════════════════════
    //  19. enablePractice = true
    // ════════════════════════════════════════════════
    {
      const r = await createTestRem('enablePractice=true');
      if (r) {
        await r.setEnablePractice(true);
        await delay(500);
        console.log('[RW-TEST] enablePractice: done');
      }
    }

    // ════════════════════════════════════════════════
    //  20. practiceDirection = forward
    // ════════════════════════════════════════════════
    {
      const r = await createTestRem('practiceDirection=forward');
      if (r) {
        await r.setPracticeDirection('forward');
        await delay(500);
        console.log('[RW-TEST] practiceDirection=forward: done');
      }
    }

    // ════════════════════════════════════════════════
    //  21. tags (addTag)
    // ════════════════════════════════════════════════
    {
      const r = await createTestRem('tags-addTag');
      if (r) {
        await r.addTag(helperTag._id);
        await delay(500);
        console.log('[RW-TEST] tags: done');
      }
    }

    // ════════════════════════════════════════════════
    //  22. sources (addSource)
    // ════════════════════════════════════════════════
    {
      const r = await createTestRem('sources-addSource');
      if (r) {
        await r.addSource(helperSource._id);
        await delay(500);
        console.log('[RW-TEST] sources: done');
      }
    }

    // ════════════════════════════════════════════════
    //  23. aliases (getOrCreateAliasWithText)
    // ════════════════════════════════════════════════
    {
      const r = await createTestRem('aliases');
      if (r) {
        await r.getOrCreateAliasWithText(['测试别名文本']);
        await delay(500);
        console.log('[RW-TEST] aliases: done');
      }
    }

    // ════════════════════════════════════════════════
    //  24. positionAmongstSiblings — 位置变更测试
    //  创建 3 个编号兄弟，然后把 #1 移到末尾
    // ════════════════════════════════════════════════
    {
      const posLabel = await plugin.rem.createRem();
      if (posLabel) {
        await posLabel.setParent(parentDoc._id, pos++);
        await posLabel.setText(['── position 测试区 ──']);
        await delay(200);
      }

      const a = await plugin.rem.createRem();
      const b = await plugin.rem.createRem();
      const c = await plugin.rem.createRem();
      if (a && b && c) {
        await a.setParent(parentDoc._id, pos++);
        await a.setText(['pos: 兄弟A（将被移到末尾）']);
        await delay(200);
        await b.setParent(parentDoc._id, pos++);
        await b.setText(['pos: 兄弟B']);
        await delay(200);
        await c.setParent(parentDoc._id, pos++);
        await c.setText(['pos: 兄弟C']);
        await delay(200);

        // 等 5 秒让截图者看到初始顺序 A→B→C
        console.log('[RW-TEST] position: 初始顺序 A→B→C，等待 5 秒后移动 A 到末尾...');
        await delay(5000);

        // 把 A 移到末尾（position=99 会被钳位）
        await a.setParent(parentDoc._id, 99);
        await delay(500);
        console.log('[RW-TEST] position: A 已移到末尾，现在顺序应为 B→C→A');
      }
    }

    // ── 完成标记 ──
    const doneRem = await plugin.rem.createRem();
    if (doneRem) {
      await doneRem.setParent(parentDoc._id, pos);
      await doneRem.setText(['===== 全部测试 Rem 创建完毕，请截图观察 =====']);
    }

    await plugin.storage.setSession('rw-test-done', true);
    console.log('[RW-TEST] ========== 全部字段 Rem 创建完毕 ==========');

  } catch (err) {
    console.error('[RW-TEST] 出错:', err);
  }
}
