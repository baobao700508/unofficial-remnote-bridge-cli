/**
 * 编辑类工具：edit_rem、edit_tree
 */

import { z } from 'zod';
import type { FastMCP } from 'fastmcp';
import { callCli } from '../daemon-client.js';
import { formatDataJson } from '../format.js';

export function registerEditTools(server: FastMCP): void {
  // -------------------------------------------------------------------------
  // edit_rem
  // -------------------------------------------------------------------------
  server.addTool({
    name: 'edit_rem',
    description:
      '直接修改单个 Rem 的属性字段。通过 changes 对象传入 {字段名: 新值}。' +
      '\\n\\n适用场景：修改文本、类型、标题级别、高亮色、Todo 状态、practiceDirection、Portal 引用列表等属性。' +
      '\\n不适合修改子树结构（增删移动子节点用 edit_tree）。' +
      '\\n\\n前置条件：必须先对同一个 remId 调用 read_rem 建立缓存，否则被防线 1 拒绝。' +
      '\\n工作流：read_rem → 查看属性 → edit_rem(changes) → 写入成功后自动从 Plugin 重新读取并更新缓存。' +
      '\\n\\n操作指南：' +
      '\\n- changes 对象的键=字段名，值=新值。21 个可写字段：text, backText, type, isDocument, parent, fontSize, highlightColor, isTodo, todoStatus, isCode, isQuote, isListItem, isCardItem, isSlot, isProperty, enablePractice, practiceDirection, tags, sources, positionAmongstSiblings, portalDirectlyIncludedRem' +
      '\\n- RichText 编辑（text/backText）：传完整 RichText 数组，元素为纯字符串或格式化对象如 {"i":"m","text":"...","b":true}。backText 传 null 可清除背面' +
      '\\n- tags/sources 使用 diff 机制：传入目标 ID 数组，系统自动计算增删差异' +
      '\\n- portalDirectlyIncludedRem：传入目标 ID 数组（仅 type=portal 的 Rem 可修改），系统自动 diff' +
      '\\n- parent + positionAmongstSiblings 联动：通过同一个 SDK 调用写入，可单独或同时修改' +
      '\\n\\n枚举约束：' +
      '\\n- type: concept / descriptor / default（portal 不可设置）' +
      '\\n- practiceDirection: forward / backward / both / none' +
      '\\n- highlightColor: Red / Orange / Yellow / Green / Blue / Purple / Gray / Brown / Pink / null（清除）' +
      '\\n- fontSize: H1 / H2 / H3 / null（恢复普通）' +
      '\\n- todoStatus: Finished / Unfinished / null（需先 isTodo=true）' +
      '\\n\\nhighlightColor vs RichText h 字段：两者完全独立。highlightColor 是整行背景色（字符串如 "Red"）；h 是 RichText 元素内部的行内荧光底色（数字：1=Red, 2=Orange, 3=Yellow, 4=Green, 5=Purple, 6=Blue, 7=Gray, 8=Brown, 9=Pink）。' +
      '\\n\\n输出格式：JSON 对象，包含 changes（已写入的字段名数组）和 warnings（只读/未知字段警告数组）。' +
      '\\n\\n两道防线：' +
      '\\n1. 缓存存在检查——未先 read_rem 则报 "has not been read yet"' +
      '\\n2. 并发检测——edit 时重新从 Plugin 读取并对比缓存，不一致则报 "has been modified since last read"。防线拒绝/部分失败时不更新缓存，迫使重新 read_rem' +
      '\\n\\n常见错误：' +
      '\\n- "has not been read yet" → 先 read_rem' +
      '\\n- "has been modified since last read" → 重新 read_rem' +
      '\\n- "Invalid value for \'field\'" → 检查枚举合法值' +
      '\\n- "Field \'...\' is read-only/unknown and was ignored" → 警告不阻断' +
      '\\n\\n关联工具：read_rem（前置读取）、edit_tree（子树结构编辑）',
    parameters: z.object({
      remId: z.string().describe('目标 Rem 的 ID'),
      changes: z.record(z.unknown()).describe(
        '要修改的字段及新值。键=字段名，值=新值。' +
        '支持字段：text, backText, type, isDocument, parent, fontSize, highlightColor, ' +
        'isTodo, todoStatus, isCode, isQuote, isListItem, isCardItem, isSlot, isProperty, ' +
        'enablePractice, practiceDirection, tags, sources, positionAmongstSiblings, portalDirectlyIncludedRem。',
      ),
    }),
    execute: async (args) => {
      const response = await callCli('edit-rem', {
        remId: args.remId,
        changes: args.changes,
      });
      return formatDataJson(response);
    },
  });

  // -------------------------------------------------------------------------
  // edit_tree
  // -------------------------------------------------------------------------
  server.addTool({
    name: 'edit_tree',
    description:
      '通过 str_replace 对 Markdown 大纲进行结构编辑（行级增/删/移/重排），禁止修改已有行的文字内容。' +
      '\\n\\n适用场景：新增子节点、删除节点、移动节点到不同父节点、重排同级节点顺序。' +
      '\\n不适合修改已有行的文本内容（用 edit_rem）。' +
      '\\n\\n前置条件：必须先对同一个 remId 调用 read_tree 建立缓存，否则被防线拒绝。' +
      '\\noldStr 必须精确匹配 read_tree 返回的大纲缓存（含缩进、空格、换行），且只匹配 1 次。' +
      '\\n工作流：read_tree → 查看大纲 → edit_tree(oldStr, newStr) → 成功后自动 re-read 更新缓存（可连续 edit）。' +
      '\\n\\n四种操作：' +
      '\\n1. 新增：在 newStr 中插入无 remId 注释的新行。缩进决定父子关系（每级 2 空格）' +
      '\\n2. 删除：从 newStr 中移除带 remId 的行。必须同时删除所有可见子行' +
      '\\n3. 移动：改变行的缩进或位置（换父节点）' +
      '\\n4. 重排：调换同级行的顺序' +
      '\\n执行顺序：Create → Move → Reorder → Delete' +
      '\\n\\n新增行格式：' +
      '\\n- Markdown 前缀：# / ## / ### / - [ ] / - [x] / `代码` / ---' +
      '\\n- 箭头分隔符（闪卡）：→ ← ↔（单行）、↓ ↑ ↕（多行，带 backText 或子节点为答案）' +
      '\\n- 元数据注释（可选）：<!--type:concept--> <!--doc--> <!--tag:Name(id)--> 可组合' +
      '\\n- Portal 创建：<!--portal refs:id1,id2--> 或 <!--portal-->（空 Portal）' +
      '\\n\\n⚠️ 插入位置红线：新行必须插在目标层级所有兄弟的末尾，不能插在父 Rem 和它的 children 之间，否则触发 children_captured 错误。如需"创建新父节点并移入已有 children"，必须分两次 edit_tree 完成。' +
      '\\n\\n六种禁止操作：' +
      '\\n- content_modified：修改已有行内容 → 改用 edit_rem' +
      '\\n- root_modified：修改/删除根节点' +
      '\\n- folded_delete：删除有隐藏子节点(children:N)的行 → 用更大 depth 重新 read_tree' +
      '\\n- orphan_detected：删父不删子 → 必须一起删' +
      '\\n- elided_modified：修改省略占位符 → 用更大参数重新 read_tree' +
      '\\n- children_captured：新行劫持已有子节点 → 把新行插到兄弟末尾' +
      '\\n\\n输出格式：JSON 对象，包含 operations 数组（每项有 type: create/delete/move/reorder 及相关字段）。' +
      '\\n\\n缓存行为：成功后自动 re-read 更新缓存；失败则不更新缓存，迫使重新 read_tree。' +
      '\\n\\n常见错误：' +
      '\\n- "old_str not found" → 检查精确匹配（含缩进换行）' +
      '\\n- "old_str matches N locations" → 扩大 oldStr 包含更多上下文使其唯一' +
      '\\n- "Content modification not allowed" → 改用 edit_rem 修改内容' +
      '\\n- "children_captured" → 新行插到兄弟末尾，不要插在父 Rem 和 children 之间' +
      '\\n\\n关联工具：read_tree（前置读取大纲）、edit_rem（修改单个 Rem 属性/内容）',
    parameters: z.object({
      remId: z.string().describe('根 Rem 的 ID（与 read_tree 时相同）'),
      oldStr: z.string().describe('要替换的大纲片段（必须精确匹配缓存中的内容，且恰好匹配 1 次）'),
      newStr: z.string().describe('替换后的大纲片段（可新增/删除/移动/重排行，但禁止修改已有行内容）'),
    }),
    execute: async (args) => {
      const response = await callCli('edit-tree', {
        remId: args.remId,
        oldStr: args.oldStr,
        newStr: args.newStr,
      });
      return formatDataJson(response);
    },
  });
}
