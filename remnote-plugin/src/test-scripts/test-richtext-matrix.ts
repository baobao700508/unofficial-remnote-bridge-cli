/**
 * RichText 字段×元素类型 交叉兼容性矩阵测试
 *
 * 测试 7 种 i 类型 × 12 种格式化字段 = 84 个组合
 * 记录每个组合：✅ 写入+保留 / ❌ SDK 拒绝 / ⚠️ 写入但字段丢失
 *
 * 跳过：i:"m"（已全覆盖）、i:"fi"（SDK 拒绝写入）
 */
import type { ReactRNPlugin, PluginRem as Rem } from '@remnote/plugin-sdk';

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const LOG = '[RICHTEXT-MATRIX]';
const SESSION_KEY = 'richtext-matrix-v1-ran';

// ── 格式化字段定义 ──

interface FieldDef {
  key: string;
  value: any;
}

const FORMAT_FIELDS: FieldDef[] = [
  { key: 'b', value: true },
  { key: 'l', value: true },
  { key: 'u', value: true },
  { key: 'h', value: 4 },       // Green highlight
  { key: 'tc', value: 6 },      // Blue text color
  { key: 'q', value: true },    // inline code
  { key: 'code', value: true },
  { key: 'cId', value: 'test-cloze-matrix' },
  { key: 'qId', value: '__PLACEHOLDER__' }, // will be replaced with real Rem ID
  { key: 'iUrl', value: 'https://example.com/matrix-test' },
  { key: 'block', value: true },
  { key: 'title', value: '矩阵测试标题' },
];

// ── 元素类型定义 ──

interface ElementTypeDef {
  label: string;
  iValue: string;
  buildBase: (realRemId: string) => Record<string, any>;
}

const ELEMENT_TYPES: ElementTypeDef[] = [
  {
    label: 'q (Rem引用)',
    iValue: 'q',
    buildBase: (realRemId) => ({
      i: 'q', _id: realRemId, content: false, pin: false,
    }),
  },
  {
    label: 'i (图片)',
    iValue: 'i',
    buildBase: () => ({
      i: 'i', url: 'https://via.placeholder.com/1x1',
    }),
  },
  {
    label: 'a (音频)',
    iValue: 'a',
    buildBase: () => ({
      i: 'a', url: 'https://example.com/test.mp3', onlyAudio: true,
    }),
  },
  {
    label: 'x (LaTeX)',
    iValue: 'x',
    buildBase: () => ({
      i: 'x', text: 'E=mc^2',
    }),
  },
  {
    label: 's (分隔符)',
    iValue: 's',
    buildBase: () => ({
      i: 's',
    }),
  },
  {
    label: 'n (注释)',
    iValue: 'n',
    buildBase: () => ({
      i: 'n', text: 'annotation', url: 'https://example.com',
    }),
  },
  {
    label: 'g (GlobalName)',
    iValue: 'g',
    buildBase: (realRemId) => ({
      i: 'g', _id: realRemId,
    }),
  },
];

// ── 结果类型 ──
type CellResult = 'OK' | 'ERROR' | 'LOST';

interface MatrixResult {
  elementType: string;
  iValue: string;
  field: string;
  fieldValue: any;
  result: CellResult;
  detail: string;
}

export async function runRichTextMatrixTest(plugin: ReactRNPlugin): Promise<void> {
  const alreadyRan = await plugin.storage.getSession(SESSION_KEY);
  if (alreadyRan) {
    console.log(`${LOG} 已运行过，跳过`);
    return;
  }
  await plugin.storage.setSession(SESSION_KEY, true);

  console.log(`${LOG} ========== 开始交叉兼容性矩阵测试 ==========`);

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
    await wrapper.setHighlightColor('Purple');
    await wrapper.setText(['===== RichText 交叉兼容性矩阵测试 =====']);
    await delay(300);

    const wId = wrapper._id;
    let pos = 0;

    // ── 创建辅助 Rem（用于需要真实 Rem ID 的元素类型）──
    const helperRem = await plugin.rem.createRem();
    if (!helperRem) return;
    await helperRem.setParent(wId, pos++);
    await helperRem.setText(['辅助 Rem（用于 q/_id 和 g/_id 引用）']);
    await delay(200);
    const realRemId = helperRem._id;

    // 替换 qId 字段的占位符
    const fields = FORMAT_FIELDS.map((f) =>
      f.key === 'qId' ? { ...f, value: realRemId } : f,
    );

    // ── 收集所有结果 ──
    const allResults: MatrixResult[] = [];

    // ── 外层循环：元素类型 ──
    for (const elemType of ELEMENT_TYPES) {
      console.log(`${LOG} --- 测试元素类型: ${elemType.label} ---`);

      const typeHeader = await plugin.rem.createRem();
      if (typeHeader) {
        await typeHeader.setParent(wId, pos++);
        await typeHeader.setHighlightColor('Blue');
        await typeHeader.setText([`▶ ${elemType.label}`]);
        await delay(100);
      }

      // ── 内层循环：格式化字段 ──
      for (const field of fields) {
        const combo = `${elemType.iValue}+${field.key}`;
        console.log(`${LOG} 测试: ${combo}`);

        const base = elemType.buildBase(realRemId);
        const testObj = { ...base, [field.key]: field.value };

        let result: CellResult;
        let detail: string;

        // 创建测试 Rem
        const testRem = await plugin.rem.createRem();
        if (!testRem) {
          result = 'ERROR';
          detail = '无法创建 Rem';
          allResults.push({
            elementType: elemType.label,
            iValue: elemType.iValue,
            field: field.key,
            fieldValue: field.value,
            result,
            detail,
          });
          continue;
        }
        await testRem.setParent(wId, pos++);

        try {
          // 写入
          await testRem.setText([testObj] as any);
          await delay(200);

          // 回读
          const refetch = await plugin.rem.findOne(testRem._id);
          const readBack = refetch ? refetch.text : testRem.text;

          // 检查字段是否保留
          let fieldRetained = false;
          if (Array.isArray(readBack)) {
            for (const el of readBack) {
              if (el && typeof el === 'object' && field.key in el) {
                // 对于 boolean 字段，检查值是否为 true
                const val = (el as any)[field.key];
                if (typeof field.value === 'boolean') {
                  fieldRetained = val === field.value;
                } else {
                  fieldRetained = val !== undefined && val !== null;
                }
                break;
              }
            }
          }

          if (fieldRetained) {
            result = 'OK';
            detail = `写入+保留 → ${JSON.stringify(readBack)}`;
          } else {
            result = 'LOST';
            detail = `写入成功但字段丢失 → ${JSON.stringify(readBack)}`;
          }

          console.log(`${LOG} ${combo}: ${result} — ${detail}`);
        } catch (err) {
          result = 'ERROR';
          detail = `SDK 拒绝: ${String(err)}`;
          console.error(`${LOG} ${combo}: ERROR —`, err);

          // 写入错误提示到 Rem（避免空 Rem）
          try {
            await testRem.setText([`${combo} 失败: ${String(err).slice(0, 100)}`]);
          } catch {
            // ignore
          }
        }
        await delay(100);

        // 写结果到子 Rem
        const resultRem = await plugin.rem.createRem();
        if (resultRem) {
          await resultRem.setParent(wId, pos++);
          const icon = result === 'OK' ? '✅' : result === 'ERROR' ? '❌' : '⚠️';
          await resultRem.setText([`${icon} ${combo}: ${result} — ${detail.slice(0, 200)}`]);
          await delay(50);
        }

        allResults.push({
          elementType: elemType.label,
          iValue: elemType.iValue,
          field: field.key,
          fieldValue: field.value,
          result,
          detail,
        });
      }
    }

    // ── 汇总结果 ──

    // 构建矩阵表
    const matrix: Record<string, Record<string, CellResult>> = {};
    for (const r of allResults) {
      if (!matrix[r.iValue]) matrix[r.iValue] = {};
      matrix[r.iValue][r.field] = r.result;
    }

    // 统计
    const stats = {
      total: allResults.length,
      ok: allResults.filter((r) => r.result === 'OK').length,
      error: allResults.filter((r) => r.result === 'ERROR').length,
      lost: allResults.filter((r) => r.result === 'LOST').length,
    };

    console.log(`${LOG} ========== 汇总 ==========`);
    console.log(`${LOG} 总计: ${stats.total}, OK: ${stats.ok}, ERROR: ${stats.error}, LOST: ${stats.lost}`);
    console.log(`${LOG} 矩阵:`, JSON.stringify(matrix, null, 2));

    // 写入汇总 JSON Rem
    const summaryRem = await plugin.rem.createRem();
    if (summaryRem) {
      await summaryRem.setParent(wId, pos++);
      await summaryRem.setHighlightColor('Green');

      const summaryJson = JSON.stringify({
        testName: 'richtext-field-element-matrix',
        timestamp: new Date().toISOString(),
        stats,
        matrix,
        fieldList: fields.map((f) => f.key),
        elementList: ELEMENT_TYPES.map((e) => e.iValue),
        details: allResults.map((r) => ({
          elem: r.iValue,
          field: r.field,
          result: r.result,
          detail: r.detail.slice(0, 300),
        })),
      });

      await summaryRem.setText([`矩阵汇总 JSON: ${summaryJson}`]);
      await delay(200);
    }

    // 完成标记
    const doneRem = await plugin.rem.createRem();
    if (doneRem) {
      await doneRem.setParent(wId, pos++);
      await doneRem.setHighlightColor('Green');
      await doneRem.setText([
        `===== 矩阵测试完成 ===== ` +
        `✅${stats.ok} ❌${stats.error} ⚠️${stats.lost} / 共${stats.total}`,
      ]);
    }

    console.log(`${LOG} ========== 矩阵测试全部完成 ==========`);
  } catch (err) {
    console.error(`${LOG} 顶层错误:`, err);
  }
}
