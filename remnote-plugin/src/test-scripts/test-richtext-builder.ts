/**
<<<<<<< ours
 * RichText Builder 探测脚本（恢复占位）
 *
 * 说明：该文件在本地历史中被误删后无法从 git 精确回滚。
 * 当前先恢复脚本入口，避免 import 失效；具体探测逻辑可按需补回。
 */
import type { ReactRNPlugin } from '@remnote/plugin-sdk';

export async function runRichTextBuilderTest(plugin: ReactRNPlugin): Promise<void> {
  const alreadyRan = await plugin.storage.getSession('richtext-builder-test-v1-ran');
  if (alreadyRan) {
    console.log('[RICHTEXT-BUILDER-TEST] 已运行过，跳过');
    return;
  }
  await plugin.storage.setSession('richtext-builder-test-v1-ran', true);
  console.warn('[RICHTEXT-BUILDER-TEST] 脚本主体待补回（文件已恢复占位）');
=======
 * RichText Builder API 输出探测测试
 *
 * 目的：探测 plugin.richText.video() 和 plugin.richText.audio() Builder API
 * 实际产出的 JSON 结构，看看跟手拼的 { i: "a" } 有什么区别。
 *
 * 背景：手拼 { i: "a", url: "..." } 通过 setText() 写入时，SDK 一律拒绝（Invalid input）。
 * 但 SDK 提供了 Builder API，需要探测 Builder 产出的结构能否被 setText() 接受。
 */
import type { ReactRNPlugin, PluginRem as Rem } from '@remnote/plugin-sdk';

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const LOG_TAG = '[RICHTEXT-BUILDER-TEST]';

export async function runRichTextBuilderTest(plugin: ReactRNPlugin): Promise<void> {
  // 防重复运行
  const alreadyRan = await plugin.storage.getSession('richtext-builder-test-v1-ran');
  if (alreadyRan) {
    console.log(`${LOG_TAG} 已运行过，跳过`);
    return;
  }
  await plugin.storage.setSession('richtext-builder-test-v1-ran', true);

  console.log(`${LOG_TAG} ========== 开始 RichText Builder 输出探测 ==========`);

  try {
    // ── 找到 "mcp 测试" 文档 ──
    const allRem = await plugin.rem.getAll();
    let parentDoc: Rem | undefined;
    for (const r of allRem) {
      const t = r.text ? await plugin.richText.toString(r.text) : '';
      if (t.trim() === 'mcp 测试') { parentDoc = r; break; }
    }
    if (!parentDoc) {
      console.error(`${LOG_TAG} 找不到 "mcp 测试" 文档`);
      return;
    }

    let pos = 0;

    // ── 标题 Rem ──
    const titleRem = await plugin.rem.createRem();
    if (!titleRem) return;
    await titleRem.setParent(parentDoc._id, pos++);
    await titleRem.setHighlightColor('Yellow');
    await titleRem.setText(['===== RichText Builder 输出探测 =====']);
    await delay(300);

    // ═══════════════════════════════════════════════════
    //  1. 探测 plugin.richText.video() 产出
    // ═══════════════════════════════════════════════════
    console.log(`${LOG_TAG} --- 1. 探测 video() Builder ---`);

    const videoRichText = plugin.richText.video('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    const videoValue = await videoRichText.value();

    console.log(`${LOG_TAG} video() .value() 类型:`, typeof videoValue);
    console.log(`${LOG_TAG} video() .value() 是数组:`, Array.isArray(videoValue));
    console.log(`${LOG_TAG} video() .value() JSON:`, JSON.stringify(videoValue, null, 2));
    console.log(`${LOG_TAG} video() .value() 紧凑 JSON:`, JSON.stringify(videoValue));

    // 把 video Builder 结果写入一个 Rem
    const videoResultRem = await plugin.rem.createRem();
    if (videoResultRem) {
      await videoResultRem.setParent(parentDoc._id, pos++);
      await videoResultRem.setText([`video() Builder 产出 JSON: ${JSON.stringify(videoValue)}`]);
      await delay(300);
    }

    // ═══════════════════════════════════════════════════
    //  2. 探测 plugin.richText.audio() 产出
    // ═══════════════════════════════════════════════════
    console.log(`${LOG_TAG} --- 2. 探测 audio() Builder ---`);

    const audioRichText = plugin.richText.audio('https://example.com/test.mp3');
    const audioValue = await audioRichText.value();

    console.log(`${LOG_TAG} audio() .value() 类型:`, typeof audioValue);
    console.log(`${LOG_TAG} audio() .value() 是数组:`, Array.isArray(audioValue));
    console.log(`${LOG_TAG} audio() .value() JSON:`, JSON.stringify(audioValue, null, 2));
    console.log(`${LOG_TAG} audio() .value() 紧凑 JSON:`, JSON.stringify(audioValue));

    // 把 audio Builder 结果写入一个 Rem
    const audioResultRem = await plugin.rem.createRem();
    if (audioResultRem) {
      await audioResultRem.setParent(parentDoc._id, pos++);
      await audioResultRem.setText([`audio() Builder 产出 JSON: ${JSON.stringify(audioValue)}`]);
      await delay(300);
    }

    // ═══════════════════════════════════════════════════
    //  3. 探测 Builder 对象的其他属性
    // ═══════════════════════════════════════════════════
    console.log(`${LOG_TAG} --- 3. 探测 Builder 对象属性 ---`);

    // 探测 video RichText 对象本身
    console.log(`${LOG_TAG} video RichText 对象 keys:`, Object.keys(videoRichText));
    console.log(`${LOG_TAG} video RichText 对象 prototype:`, Object.getOwnPropertyNames(Object.getPrototypeOf(videoRichText)));

    // 探测 audio RichText 对象本身
    console.log(`${LOG_TAG} audio RichText 对象 keys:`, Object.keys(audioRichText));

    // ═══════════════════════════════════════════════════
    //  4. 对比测试：用 Builder 产出的结构通过 setText() 回写
    // ═══════════════════════════════════════════════════
    console.log(`${LOG_TAG} --- 4. 对比测试：Builder 产出 → setText() 回写 ---`);

    // 4a. 尝试用 video Builder 的 .value() 直接 setText()
    const videoWriteRem = await plugin.rem.createRem();
    if (videoWriteRem) {
      await videoWriteRem.setParent(parentDoc._id, pos++);
      try {
        await videoWriteRem.setText(videoValue);
        console.log(`${LOG_TAG} 4a. video .value() → setText() 成功！`);
        // 读回验证
        const readBack = videoWriteRem.text;
        console.log(`${LOG_TAG} 4a. 回读 text:`, JSON.stringify(readBack));
      } catch (err) {
        console.error(`${LOG_TAG} 4a. video .value() → setText() 失败:`, err);
        await videoWriteRem.setText([`video setText 失败: ${String(err)}`]);
      }
      await delay(300);
    }

    // 4b. 尝试用 audio Builder 的 .value() 直接 setText()
    const audioWriteRem = await plugin.rem.createRem();
    if (audioWriteRem) {
      await audioWriteRem.setParent(parentDoc._id, pos++);
      try {
        await audioWriteRem.setText(audioValue);
        console.log(`${LOG_TAG} 4b. audio .value() → setText() 成功！`);
        // 读回验证
        const readBack = audioWriteRem.text;
        console.log(`${LOG_TAG} 4b. 回读 text:`, JSON.stringify(readBack));
      } catch (err) {
        console.error(`${LOG_TAG} 4b. audio .value() → setText() 失败:`, err);
        await audioWriteRem.setText([`audio setText 失败: ${String(err)}`]);
      }
      await delay(300);
    }

    // 4c. 尝试用 Builder 的 .value() 中的单个元素手拼 setText()
    //     （如果 .value() 是数组，取出每个元素尝试）
    if (Array.isArray(videoValue) && videoValue.length > 0) {
      const singleElement = videoValue[0];
      console.log(`${LOG_TAG} 4c. video 单个元素:`, JSON.stringify(singleElement));

      const singleWriteRem = await plugin.rem.createRem();
      if (singleWriteRem) {
        await singleWriteRem.setParent(parentDoc._id, pos++);
        try {
          // 用完全相同的结构手拼
          const handCrafted = JSON.parse(JSON.stringify(singleElement));
          await singleWriteRem.setText([handCrafted]);
          console.log(`${LOG_TAG} 4c. 手拼单元素 → setText() 成功！`);
        } catch (err) {
          console.error(`${LOG_TAG} 4c. 手拼单元素 → setText() 失败:`, err);
          await singleWriteRem.setText([`手拼单元素 setText 失败: ${String(err)}`]);
        }
        await delay(300);
      }
    }

    // ═══════════════════════════════════════════════════
    //  5. 探测其他可能有用的 Builder 方法
    // ═══════════════════════════════════════════════════
    console.log(`${LOG_TAG} --- 5. 列举 plugin.richText 上的所有方法 ---`);

    const rtKeys = Object.getOwnPropertyNames(Object.getPrototypeOf(plugin.richText));
    console.log(`${LOG_TAG} plugin.richText 方法列表:`, rtKeys);

    // 完成标记
    const doneRem = await plugin.rem.createRem();
    if (doneRem) {
      await doneRem.setParent(parentDoc._id, pos++);
      await doneRem.setHighlightColor('Green');
      await doneRem.setText(['===== RichText Builder 测试完成 =====']);
      await delay(200);
    }

    console.log(`${LOG_TAG} ========== 测试完成，请检查控制台输出 ==========`);

  } catch (err) {
    console.error(`${LOG_TAG} 顶层错误:`, err);
  }
>>>>>>> theirs
}
