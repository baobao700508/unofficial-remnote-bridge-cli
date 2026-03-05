/**
 * Rem 类型 → Markdown 映射探测脚本
 *
 * 探测目标：
 * 1. 各种闪卡类型（Concept ::、Descriptor ;;、Multi-line >>>）对应 Rem 对象的哪些字段值
 * 2. toMarkdown() 对各类型 text/backText 的输出
 * 3. parseFromMarkdown() 对各种分隔符的解析行为
 * 4. Multi-line 子行在 Rem 对象里的表示方式
 *
 * 运行方式：在 widgets/index.tsx 中取消注释 import 和调用，刷新 RemNote
 * 结果写入："mcp 测试" 文档下的 "类型映射探测" wrapper Rem
 */
import type { ReactRNPlugin, PluginRem as Rem } from '@remnote/plugin-sdk';

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** 安全地将任意值序列化为可读字符串 */
function safeStringify(val: unknown): string {
  if (val === undefined) return 'undefined';
  if (val === null) return 'null';
  if (typeof val === 'string') return val;
  try {
    return JSON.stringify(val, null, 2);
  } catch {
    return String(val);
  }
}

export async function runRemTypeMappingTest(plugin: ReactRNPlugin): Promise<void> {
  const SESSION_KEY = 'rem-type-mapping-v1-ran';
  const alreadyRan = await plugin.storage.getSession(SESSION_KEY);
  if (alreadyRan) {
    console.log('[TYPE-MAPPING] 已运行过，跳过');
    return;
  }
  await plugin.storage.setSession(SESSION_KEY, true);

  console.log('[TYPE-MAPPING] ========== 开始 Rem 类型映射探测 ==========');

  try {
    // ── 找到 "mcp 测试" 文档 ──
    const allRem = await plugin.rem.getAll();
    let parentDoc: Rem | undefined;
    for (const r of allRem) {
      const t = r.text ? await plugin.richText.toString(r.text) : '';
      if (t.trim() === 'mcp 测试') { parentDoc = r; break; }
    }
    if (!parentDoc) {
      console.error('[TYPE-MAPPING] 找不到 "mcp 测试" 文档');
      return;
    }

    // ── 创建 wrapper Rem ──
    const wrapper = await plugin.rem.createRem();
    if (!wrapper) return;
    await wrapper.setParent(parentDoc._id, 0);
    await wrapper.setHighlightColor('Blue');
    await wrapper.setText(['🔬 类型映射探测 (', new Date().toISOString().slice(0, 19), ')']);
    await delay(300);

    let pos = 0;
    const results: string[] = [];

    // ═══════════════════════════════════════════════════
    //  Part 1: 用各种分隔符创建 Rem，读取字段值
    // ═══════════════════════════════════════════════════

    const sectionLabel1 = await plugin.rem.createRem();
    if (!sectionLabel1) return;
    await sectionLabel1.setParent(wrapper._id, pos++);
    await sectionLabel1.setText(['═══ Part 1: 各类型 Rem 的字段值 ═══']);
    await delay(200);

    // 测试用例：各种分隔符的 Markdown 输入
    const testCases = [
      { label: '普通行', markdown: '这是一个普通行' },
      { label: 'Concept (::)', markdown: '线性回归 :: 最基本的回归模型' },
      { label: 'Descriptor (;;)', markdown: '细胞核 ;; 控制细胞活动的中心' },
      { label: 'Forward (>>)', markdown: '什么是过拟合？ >> 模型在训练数据上表现好但泛化能力差' },
      { label: 'Backward (<<)', markdown: '模型泛化能力差 << 什么是过拟合？' },
      { label: 'Bidirectional (<>)', markdown: 'DNA <> 脱氧核糖核酸' },
      { label: 'Multi-line (>>>)', markdown: '什么是机器学习？ >>>' },
      { label: 'Cloze ({{}})', markdown: '光合作用将{{光能}}转化为{{化学能}}' },
    ];

    for (const tc of testCases) {
      console.log(`[TYPE-MAPPING] 创建: ${tc.label}`);

      // 用 createSingleRemWithMarkdown 创建
      const rem = await plugin.rem.createSingleRemWithMarkdown(tc.markdown, wrapper._id);
      if (!rem) {
        results.push(`❌ ${tc.label}: createSingleRemWithMarkdown 返回 undefined`);
        continue;
      }
      await delay(300);

      // 重新获取（确保数据刷新）
      const fresh = await plugin.rem.findOne(rem._id);
      if (!fresh) {
        results.push(`❌ ${tc.label}: findOne 返回 undefined`);
        continue;
      }

      // 读取关键字段
      const type = fresh.type;
      const textRaw = fresh.text;
      const backTextRaw = fresh.backText;
      const children = fresh.children;

      // toMarkdown 转换
      const textMd = textRaw ? await plugin.richText.toMarkdown(textRaw) : '(empty)';
      const backTextMd = backTextRaw ? await plugin.richText.toMarkdown(backTextRaw) : '(empty)';

      // toString 转换（作为对照）
      const textStr = textRaw ? await plugin.richText.toString(textRaw) : '(empty)';
      const backTextStr = backTextRaw ? await plugin.richText.toString(backTextRaw) : '(empty)';

      // 额外状态
      const isCardItem = await fresh.isCardItem();

      const result = [
        `【${tc.label}】`,
        `  input: "${tc.markdown}"`,
        `  type: ${type} (${type === 1 ? 'CONCEPT' : type === 2 ? 'DESCRIPTOR' : type === 6 ? 'PORTAL' : 'DEFAULT'})`,
        `  text (raw): ${safeStringify(textRaw)}`,
        `  text (toMarkdown): "${textMd}"`,
        `  text (toString): "${textStr}"`,
        `  backText (raw): ${safeStringify(backTextRaw)}`,
        `  backText (toMarkdown): "${backTextMd}"`,
        `  backText (toString): "${backTextStr}"`,
        `  children: ${safeStringify(children)}`,
        `  isCardItem: ${isCardItem}`,
      ].join('\n');

      results.push(result);
      console.log(`[TYPE-MAPPING] ${result}`);

      // 写入结果 Rem
      const resultRem = await plugin.rem.createRem();
      if (resultRem) {
        await resultRem.setParent(wrapper._id, pos++);
        await resultRem.setText([`${tc.label}: type=${type}, text="${textStr}", back="${backTextStr}"`]);
        await delay(100);
      }
    }

    // ═══════════════════════════════════════════════════
    //  Part 2: Multi-line 子行探测
    // ═══════════════════════════════════════════════════

    const sectionLabel2 = await plugin.rem.createRem();
    if (!sectionLabel2) return;
    await sectionLabel2.setParent(wrapper._id, pos++);
    await sectionLabel2.setText(['═══ Part 2: Multi-line 子行结构探测 ═══']);
    await delay(200);

    // 创建一个 Multi-line Rem 并手动添加子行
    const mlParent = await plugin.rem.createSingleRemWithMarkdown('多行测试问题 >>>', wrapper._id);
    if (mlParent) {
      await delay(300);

      // 添加子行
      const child1 = await plugin.rem.createRem();
      if (child1) {
        await child1.setText(['这是第一个答案行']);
        await child1.setParent(mlParent._id, 0);
        await delay(200);
      }

      const child2 = await plugin.rem.createRem();
      if (child2) {
        await child2.setText(['这是第二个答案行']);
        await child2.setParent(mlParent._id, 1);
        await delay(200);
      }

      // 重新读取 Multi-line 父 Rem
      const mlFresh = await plugin.rem.findOne(mlParent._id);
      if (mlFresh) {
        const mlType = mlFresh.type;
        const mlText = mlFresh.text ? await plugin.richText.toString(mlFresh.text) : '(empty)';
        const mlBack = mlFresh.backText ? await plugin.richText.toString(mlFresh.backText) : '(empty)';
        const mlChildren = mlFresh.children;

        // 读取子行的 isCardItem 状态
        const childResults: string[] = [];
        if (mlChildren) {
          for (let i = 0; i < mlChildren.length; i++) {
            const childRem = await plugin.rem.findOne(mlChildren[i]);
            if (childRem) {
              const cType = childRem.type;
              const cText = childRem.text ? await plugin.richText.toString(childRem.text) : '(empty)';
              const cIsCardItem = await childRem.isCardItem();
              childResults.push(`  child[${i}]: type=${cType}, text="${cText}", isCardItem=${cIsCardItem}`);
            }
          }
        }

        const mlResult = [
          '【Multi-line 子行结构】',
          `  parent type: ${mlType}`,
          `  parent text: "${mlText}"`,
          `  parent backText: "${mlBack}"`,
          `  parent children IDs: ${safeStringify(mlChildren)}`,
          ...childResults,
        ].join('\n');

        results.push(mlResult);
        console.log(`[TYPE-MAPPING] ${mlResult}`);

        const mlResultRem = await plugin.rem.createRem();
        if (mlResultRem) {
          await mlResultRem.setParent(wrapper._id, pos++);
          await mlResultRem.setText([`Multi-line: type=${mlType}, children=${mlChildren?.length ?? 0}`]);
        }
      }
    }

    // ═══════════════════════════════════════════════════
    //  Part 3: parseFromMarkdown 解析行为
    // ═══════════════════════════════════════════════════

    const sectionLabel3 = await plugin.rem.createRem();
    if (!sectionLabel3) return;
    await sectionLabel3.setParent(wrapper._id, pos++);
    await sectionLabel3.setText(['═══ Part 3: parseFromMarkdown 解析行为 ═══']);
    await delay(200);

    const parseTests = [
      '普通文本',
      '概念 :: 定义',
      '描述 ;; 解释',
      '问题 >> 答案',
      '答案 << 问题',
      '左 <> 右',
      '多行问题 >>>',
      '**粗体** 和 *斜体*',
      '带 [[引用]] 的文本',
      '带 {{cloze}} 的文本',
      '$E = mc^2$',
    ];

    for (const input of parseTests) {
      const parsed = await plugin.richText.parseFromMarkdown(input);
      const parsedStr = safeStringify(parsed);

      const parseResult = `parseFromMarkdown("${input}") → ${parsedStr}`;
      results.push(parseResult);
      console.log(`[TYPE-MAPPING] ${parseResult}`);

      const parseRem = await plugin.rem.createRem();
      if (parseRem) {
        await parseRem.setParent(wrapper._id, pos++);
        // 截断过长的结果
        const shortResult = parsedStr.length > 100 ? parsedStr.slice(0, 100) + '...' : parsedStr;
        await parseRem.setText([`parse("${input}") → ${shortResult}`]);
        await delay(100);
      }
    }

    // ═══════════════════════════════════════════════════
    //  Part 4: 汇总 JSON 结果
    // ═══════════════════════════════════════════════════

    const jsonSummary = await plugin.rem.createRem();
    if (jsonSummary) {
      await jsonSummary.setParent(wrapper._id, pos++);
      await jsonSummary.setIsCode(true);
      const fullJson = JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2);
      await jsonSummary.setText([fullJson]);
    }

    // ── 完成标记 ──
    await wrapper.setText(['✅ 类型映射探测完成 (', new Date().toISOString().slice(0, 19), ')']);
    console.log('[TYPE-MAPPING] ========== 探测完成 ==========');
    console.log('[TYPE-MAPPING] 完整结果:\n' + results.join('\n\n'));

  } catch (err) {
    console.error('[TYPE-MAPPING] 错误:', err);
  }
}
