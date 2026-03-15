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
      '直接修改单个 Rem 的属性字段。\n\n通过 changes 对象指定要修改的字段及新值，无需构造 str_replace。\n\n适用场景：修改文本、类型、标题级别、practiceDirection、高亮色、Todo 状态等属性；\n修改 Portal 引用列表。不适合修改子树结构（用 edit_tree）。\n\n前置条件：必须先 read_rem 建立缓存，否则被防线拒绝。\n工作流：read_rem → 查看属性 → edit_rem 传入 changes。\n\n两道防线：缓存存在 → 并发检测。\n字段白名单：只接受 21 个可写字段，只读和未知字段产生警告但不阻断。\n详细操作指南见 resource://edit-rem-guide。\n关联工具：read_rem（前置）、edit_tree（结构编辑）',
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
      '通过 str_replace 对 Markdown 大纲进行结构编辑（行级增/删/移/重排）。\n\n操作对象是 read_tree 返回的 Markdown 大纲文本，将 oldStr 替换为 newStr，\n自动解析差异并执行结构操作。\n\n适用场景：新增子节点、删除节点、移动节点、重排顺序。\n不适合修改行内容（用 edit_rem）。\n\n前置条件：必须先 read_tree 建立缓存，否则被防线拒绝。\n工作流：read_tree → 查看大纲 → edit_tree 替换。\n\n关键禁止：\n- 禁止修改已有行的文本内容（报 content_modified）\n- 禁止删除有隐藏子节点（children:N）的行\n- 禁止删除父节点但保留子节点\n\n新行支持 Markdown 前缀（# ## ### - [ ] 等）和箭头分隔符（→ ← ↔ ↓ ↑ ↕）。\n缩进决定父子关系（每级 2 空格）。\n详细操作指南见 resource://edit-tree-guide。\n关联工具：read_tree（前置）、edit_rem（内容修改）',
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
