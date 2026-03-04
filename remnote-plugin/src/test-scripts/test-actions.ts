/**
 * 纯动作方法 (W) 行为观察测试
 *
 * 测试流程：创建初态 → 暂停（截图初态）→ 执行动作 → 暂停（截图终态）
 * 测试的动作方法：remove / indent / outdent / merge / collapse / expand / addToPortal
 */
import type { ReactRNPlugin, PluginRem as Rem } from '@remnote/plugin-sdk';

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function runActionTests(plugin: ReactRNPlugin): Promise<void> {
  const alreadyRan = await plugin.storage.getSession('action-test-v1-ran');
  if (alreadyRan) {
    console.log('[ACTION-TEST] 已运行过，跳过');
    return;
  }
  await plugin.storage.setSession('action-test-v1-ran', true);

  console.log('[ACTION-TEST] ========== 开始纯动作行为观察 ==========');

  try {
    // ── 找到 "mcp 测试" 文档 ──
    const allRem = await plugin.rem.getAll();
    let parentDoc: Rem | undefined;
    for (const r of allRem) {
      const t = r.text ? await plugin.richText.toString(r.text) : '';
      if (t.trim() === 'mcp 测试') { parentDoc = r; break; }
    }
    if (!parentDoc) { console.error('[ACTION-TEST] 找不到 "mcp 测试"'); return; }

    // ── 状态指示 Rem ──
    const statusRem = await plugin.rem.createRem();
    if (!statusRem) return;
    await statusRem.setParent(parentDoc._id, 0);
    await statusRem.setHighlightColor('Yellow');
    await statusRem.setText(['⏳ 动作测试：正在创建初态...']);
    await delay(300);

    let pos = 1;

    // ═══════════════════════════════════════════════════
    //  创建所有初态 Rem
    // ═══════════════════════════════════════════════════

    // --- 1. remove() 测试 ---
    const removeLabel = await plugin.rem.createRem();
    if (!removeLabel) return;
    await removeLabel.setParent(parentDoc._id, pos++);
    await removeLabel.setText(['── 1. remove() 测试 ──']);
    await delay(200);

    const removeTarget = await plugin.rem.createRem();
    if (!removeTarget) return;
    await removeTarget.setParent(parentDoc._id, pos++);
    await removeTarget.setHighlightColor('Red');
    await removeTarget.setText(['❌ 这个 Rem 将被 remove() 删除']);
    await delay(200);

    // --- 2. indent() 测试 ---
    const indentLabel = await plugin.rem.createRem();
    if (!indentLabel) return;
    await indentLabel.setParent(parentDoc._id, pos++);
    await indentLabel.setText(['── 2. indent() 测试 ──']);
    await delay(200);

    const indentParent = await plugin.rem.createRem();
    if (!indentParent) return;
    await indentParent.setParent(parentDoc._id, pos++);
    await indentParent.setText(['indent 的上方兄弟（将变成父级）']);
    await delay(200);

    const indentTarget = await plugin.rem.createRem();
    if (!indentTarget) return;
    await indentTarget.setParent(parentDoc._id, pos++);
    await indentTarget.setHighlightColor('Orange');
    await indentTarget.setText(['→ 这个 Rem 将被 indent()（向右缩进）']);
    await delay(200);

    // --- 3. outdent() 测试 ---
    const outdentLabel = await plugin.rem.createRem();
    if (!outdentLabel) return;
    await outdentLabel.setParent(parentDoc._id, pos++);
    await outdentLabel.setText(['── 3. outdent() 测试 ──']);
    await delay(200);

    const outdentWrapper = await plugin.rem.createRem();
    if (!outdentWrapper) return;
    await outdentWrapper.setParent(parentDoc._id, pos++);
    await outdentWrapper.setText(['outdent 的当前父级']);
    await delay(200);

    const outdentTarget = await plugin.rem.createRem();
    if (!outdentTarget) return;
    await outdentTarget.setParent(outdentWrapper._id, 0); // 作为子级
    await outdentTarget.setHighlightColor('Orange');
    await outdentTarget.setText(['← 这个子 Rem 将被 outdent()（向左提升）']);
    await delay(200);

    // --- 4. merge() 测试 ---
    const mergeLabel = await plugin.rem.createRem();
    if (!mergeLabel) return;
    await mergeLabel.setParent(parentDoc._id, pos++);
    await mergeLabel.setText(['── 4. merge() 测试 ──']);
    await delay(200);

    const mergeKeep = await plugin.rem.createRem();
    if (!mergeKeep) return;
    await mergeKeep.setParent(parentDoc._id, pos++);
    await mergeKeep.setHighlightColor('Green');
    await mergeKeep.setText(['保留的 Rem（merge 目标）']);
    await delay(200);

    const mergeDisappear = await plugin.rem.createRem();
    if (!mergeDisappear) return;
    await mergeDisappear.setParent(parentDoc._id, pos++);
    await mergeDisappear.setHighlightColor('Red');
    await mergeDisappear.setText(['将被合并消失的 Rem']);
    await delay(200);

    // --- 5. collapse() / expand() 测试 ---
    const collapseLabel = await plugin.rem.createRem();
    if (!collapseLabel) return;
    await collapseLabel.setParent(parentDoc._id, pos++);
    await collapseLabel.setText(['── 5. collapse()/expand() 测试 ──']);
    await delay(200);

    const collapseParent = await plugin.rem.createRem();
    if (!collapseParent) return;
    await collapseParent.setParent(parentDoc._id, pos++);
    await collapseParent.setHighlightColor('Blue');
    await collapseParent.setText(['将被 collapse() 的父 Rem']);
    await delay(200);

    // 给它创建 3 个子级
    for (let i = 1; i <= 3; i++) {
      const child = await plugin.rem.createRem();
      if (child) {
        await child.setParent(collapseParent._id, i - 1);
        await child.setText([`子级 ${i}（collapse 后应隐藏）`]);
        await delay(150);
      }
    }

    // --- 6. addToPortal() 测试 ---
    const portalLabel = await plugin.rem.createRem();
    if (!portalLabel) return;
    await portalLabel.setParent(parentDoc._id, pos++);
    await portalLabel.setText(['── 6. addToPortal() 测试 ──']);
    await delay(200);

    const portalTarget = await plugin.rem.createRem();
    if (!portalTarget) return;
    await portalTarget.setParent(parentDoc._id, pos++);
    await portalTarget.setHighlightColor('Purple');
    await portalTarget.setText(['将被添加到 Portal 的 Rem']);
    await delay(200);

    // 创建一个 Portal
    const portal = await plugin.rem.createPortal();
    if (portal) {
      await portal.setParent(parentDoc._id, pos++);
      await delay(200);
    }

    // ═══════════════════════════════════════════════════
    //  初态就绪，暂停 15 秒供截图
    // ═══════════════════════════════════════════════════
    await statusRem.setText(['📸 初态就绪！请截图（15 秒后执行动作）']);
    console.log('[ACTION-TEST] ===== 初态就绪，等待 15 秒截图 =====');
    await delay(15000);

    // ═══════════════════════════════════════════════════
    //  逐个执行动作
    // ═══════════════════════════════════════════════════
    await statusRem.setText(['⚡ 正在执行动作...']);

    // 1. remove()
    console.log('[ACTION-TEST] 执行 remove()');
    await removeTarget.remove();
    await delay(500);

    // 2. indent()
    console.log('[ACTION-TEST] 执行 indent()');
    await indentTarget.indent();
    await delay(500);

    // 3. outdent()
    console.log('[ACTION-TEST] 执行 outdent()');
    await outdentTarget.outdent();
    await delay(500);

    // 4. merge() — 把 mergeDisappear 合并到 mergeKeep
    console.log('[ACTION-TEST] 执行 merge()');
    await mergeKeep.merge(mergeDisappear._id);
    await delay(500);

    // 5. collapse()
    console.log('[ACTION-TEST] 执行 collapse()');
    await collapseParent.collapse();
    await delay(500);

    // 6. addToPortal()
    if (portal) {
      console.log('[ACTION-TEST] 执行 addToPortal()');
      await portalTarget.addToPortal(portal);
      await delay(500);
    }

    // ═══════════════════════════════════════════════════
    //  动作执行完毕，暂停供截图
    // ═══════════════════════════════════════════════════
    await statusRem.setText(['📸 全部动作已执行！请截图观察终态']);
    await statusRem.setHighlightColor('Green');
    console.log('[ACTION-TEST] ===== 全部动作已执行，请截图终态 =====');

    // 20 秒后执行 expand() 让 collapse 的效果能对比
    await delay(20000);
    console.log('[ACTION-TEST] 执行 expand()（恢复折叠）');
    const refetchCollapse = await plugin.rem.findOne(collapseParent._id);
    if (refetchCollapse) {
      await refetchCollapse.expand();
    }
    await statusRem.setText(['📸 expand() 已执行，子级应重新可见']);

  } catch (err) {
    console.error('[ACTION-TEST] 出错:', err);
  }
}
