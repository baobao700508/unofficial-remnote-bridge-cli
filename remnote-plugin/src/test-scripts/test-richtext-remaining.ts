/**
 * RichText 剩余未测字段验证 v2
 *
 * 改进：
 * - 用 applyTextFormatToRange + "cloze" 创建真正的 cloze，再回读真实 cId 格式
 * - 每个测试的回读 JSON 写入结果 Rem（不依赖 console.log）
 * - 用包装 Rem 隔离，避免跟其他测试交错
 */
import type { ReactRNPlugin, PluginRem as Rem } from '@remnote/plugin-sdk';

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const LOG = '[RICHTEXT-REMAINING-V2]';

export async function runRichTextRemainingTest(plugin: ReactRNPlugin): Promise<void> {
  const alreadyRan = await plugin.storage.getSession('richtext-remaining-v2-ran');
  if (alreadyRan) {
    console.log(`${LOG} 已运行过，跳过`);
    return;
  }
  await plugin.storage.setSession('richtext-remaining-v2-ran', true);

  console.log(`${LOG} ========== 开始 v2 验证 ==========`);

  try {
    // ── 找到 "mcp 测试" 文档 ──
    const allRem = await plugin.rem.getAll();
    let parentDoc: Rem | undefined;
    for (const r of allRem) {
      const t = r.text ? await plugin.richText.toString(r.text) : '';
      if (t.trim() === 'mcp 测试') { parentDoc = r; break; }
    }
    if (!parentDoc) {
      console.error(`${LOG} 找不到 "mcp 测试" 文档`);
      return;
    }

    // ── 创建包装 Rem 隔离测试区域 ──
    const wrapper = await plugin.rem.createRem();
    if (!wrapper) return;
    await wrapper.setParent(parentDoc._id, 0);
    await wrapper.setHighlightColor('Yellow');
    await wrapper.setText(['===== RichText 剩余字段验证 v2 =====']);
    await delay(300);

    const wId = wrapper._id;
    let pos = 0;

    // 辅助：创建 Rem + 写入 + 回读 + 写结果
    async function testWrite(
      label: string,
      richText: any[],
    ): Promise<{ ok: boolean; readBack: any }> {
      const testRem = await plugin.rem.createRem();
      if (!testRem) return { ok: false, readBack: null };
      await testRem.setParent(wId, pos++);

      try {
        await testRem.setText(richText);
        await delay(200);
        // 回读
        const refetch = await plugin.rem.findOne(testRem._id);
        const readBack = refetch ? refetch.text : testRem.text;
        console.log(`${LOG} ${label} → OK, 回读:`, JSON.stringify(readBack));

        // 结果 Rem
        const resultRem = await plugin.rem.createRem();
        if (resultRem) {
          await resultRem.setParent(wId, pos++);
          await resultRem.setText([`↳ ${label} 回读: ${JSON.stringify(readBack)}`]);
        }
        await delay(200);
        return { ok: true, readBack };
      } catch (err) {
        console.error(`${LOG} ${label} → 失败:`, err);
        await testRem.setText([`${label} 失败: ${String(err)}`]);
        await delay(200);
        return { ok: false, readBack: null };
      }
    }

    // ═══════════════════════════════════════════════════
    //  0. 探测真实 cloze：先写纯文本，再用 applyTextFormatToRange 加 cloze，再回读
    // ═══════════════════════════════════════════════════
    console.log(`${LOG} --- 0. 探测真实 cloze ID 格式 ---`);
    const clozeProbe = await plugin.rem.createRem();
    if (clozeProbe) {
      await clozeProbe.setParent(wId, pos++);
      await clozeProbe.setText(['探测用文本：ABCDEFGH']);
      await delay(300);

      // 对 "BCDE"（位置 5-9）加 cloze 格式
      const originalText = clozeProbe.text;
      if (originalText) {
        try {
          const formatted = await plugin.richText.applyTextFormatToRange(
            originalText, 5, 9, 'cloze' as any
          );
          console.log(`${LOG} applyTextFormatToRange cloze 结果:`, JSON.stringify(formatted));
          // 写回
          await clozeProbe.setText(formatted);
          await delay(300);
          // 回读
          const refetch = await plugin.rem.findOne(clozeProbe._id);
          const readBack = refetch ? refetch.text : clozeProbe.text;
          console.log(`${LOG} cloze 回读:`, JSON.stringify(readBack));

          const probeResult = await plugin.rem.createRem();
          if (probeResult) {
            await probeResult.setParent(wId, pos++);
            await probeResult.setText([`↳ 真实 cloze JSON: ${JSON.stringify(readBack)}`]);
          }
          await delay(200);

          // 提取真实 cloze ID
          let realClozeId: string | undefined;
          if (Array.isArray(readBack)) {
            for (const el of readBack) {
              if (el && typeof el === 'object' && 'cId' in el) {
                realClozeId = (el as any).cId;
                break;
              }
            }
          }

          const idInfoRem = await plugin.rem.createRem();
          if (idInfoRem) {
            await idInfoRem.setParent(wId, pos++);
            await idInfoRem.setText([
              `↳ 真实 cloze ID: "${realClozeId}" ` +
              `(类型:${typeof realClozeId}, 长度:${realClozeId?.length})`,
            ]);
          }
          await delay(200);

          // ── 用真实 ID 格式手拼 cloze 写入 ──
          if (realClozeId) {
            await testWrite('0b. 真实ID手拼cloze', [
              '手拼(真实ID): ',
              { i: 'm', text: '真实ID填空', cId: realClozeId } as any,
              ' 后续',
            ]);
          }
        } catch (err) {
          console.error(`${LOG} applyTextFormatToRange 失败:`, err);
          const errRem = await plugin.rem.createRem();
          if (errRem) {
            await errRem.setParent(wId, pos++);
            await errRem.setText([`0. applyTextFormatToRange 失败: ${String(err)}`]);
          }
        }
      }
    }

    // ═══════════════════════════════════════════════════
    //  1. cId — 用随便编的 ID
    // ═══════════════════════════════════════════════════
    await testWrite('1. cId(随编ID)', [
      '填空(随编): ',
      { i: 'm', text: '答案B', cId: 'my-fake-cloze-999' } as any,
      ' 后续',
    ]);

    // ═══════════════════════════════════════════════════
    //  2. hiddenCloze + cId
    // ═══════════════════════════════════════════════════
    await testWrite('2. hiddenCloze', [
      'hidden: ',
      { i: 'm', text: '隐藏填空', cId: 'hc-001', hiddenCloze: true } as any,
    ]);

    // ═══════════════════════════════════════════════════
    //  3. revealedCloze + cId
    // ═══════════════════════════════════════════════════
    await testWrite('3. revealedCloze', [
      'revealed: ',
      { i: 'm', text: '揭示填空', cId: 'rc-001', revealedCloze: true } as any,
    ]);

    // ═══════════════════════════════════════════════════
    //  4. block = true（引用块）
    // ═══════════════════════════════════════════════════
    await testWrite('4. block=true', [
      { i: 'm', text: '这应该是引用块', block: true } as any,
    ]);

    // ═══════════════════════════════════════════════════
    //  5. qId — 行内引用链接
    // ═══════════════════════════════════════════════════
    const qIdTarget = await plugin.rem.createRem();
    if (qIdTarget) {
      await qIdTarget.setParent(wId, pos++);
      await qIdTarget.setText(['qId 引用目标 Rem']);
      await delay(200);
    }

    await testWrite('5. qId', [
      '行内引用: ',
      { i: 'm', text: '这是qId链接', qId: qIdTarget?._id || 'fake' } as any,
      ' 后续',
    ]);

    // ═══════════════════════════════════════════════════
    //  6. title
    // ═══════════════════════════════════════════════════
    await testWrite('6. title', [
      { i: 'm', text: '有title属性的文本', title: '我是标题' } as any,
    ]);

    // ═══════════════════════════════════════════════════
    //  7. i:"g" GlobalName
    // ═══════════════════════════════════════════════════
    await testWrite('7a. i:g(有_id)', [
      'GlobalName: ',
      { i: 'g', _id: qIdTarget?._id || null } as any,
    ]);
    await testWrite('7b. i:g(null)', [
      'GlobalName(null): ',
      { i: 'g', _id: null } as any,
    ]);

    // ═══════════════════════════════════════════════════
    //  8. i:"fi" FlashcardIcon
    // ═══════════════════════════════════════════════════
    await testWrite('8. i:fi', [
      '闪卡图标: ',
      { i: 'fi' } as any,
    ]);

    // ── 完成 ──
    const doneRem = await plugin.rem.createRem();
    if (doneRem) {
      await doneRem.setParent(wId, pos++);
      await doneRem.setHighlightColor('Green');
      await doneRem.setText(['===== v2 验证完成 =====']);
    }

    console.log(`${LOG} ========== v2 全部完成 ==========`);

  } catch (err) {
    console.error(`${LOG} 顶层错误:`, err);
  }
}
