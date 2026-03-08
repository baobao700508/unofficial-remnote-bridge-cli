/**
 * 编辑类工具：edit_rem、edit_tree
 */

import { z } from 'zod';
import type { FastMCP } from 'fastmcp';
import { callCli } from '../daemon-client.js';

export function registerEditTools(server: FastMCP): void {
  // -------------------------------------------------------------------------
  // edit_rem
  // -------------------------------------------------------------------------
  server.addTool({
    name: 'edit_rem',
    description:
      '通过 str_replace 语义修改单个 Rem 的属性字段。\n\n操作对象是 Rem 序列化后的 JSON 文本（JSON.stringify 2 空格缩进），\n在其中将 oldStr 精确替换为 newStr，自动推导变更字段并写入。\n\n适用场景：修改文本、类型、标题级别、practiceDirection、高亮色、Todo 状态等属性；\n修改分隔符以改变闪卡类型。不适合修改子树结构（用 edit_tree）。\n\n前置条件：必须先 read_rem 建立缓存，否则被防线拒绝。\n工作流：read_rem → 查看 JSON → edit_rem 替换。\n\n三道防线：缓存存在 → 并发检测 → 精确匹配（恰好 1 次）。\nstr_replace 要点：oldStr 建议包含字段名避免歧义（如 "text": "旧值"）。替换后须是合法 JSON。\n详细操作指南（含 RichText 编辑实战示例）见 resource://edit-rem-guide。\n关联工具：read_rem（前置）、edit_tree（结构编辑）',
    parameters: z.object({
      remId: z.string().describe('目标 Rem 的 ID'),
      oldStr: z.string().describe('要替换的原始文本（必须精确匹配缓存中的内容，且恰好匹配 1 次）'),
      newStr: z.string().describe('替换后的新文本'),
    }),
    execute: async (args) => {
      const response = await callCli('edit-rem', {
        remId: args.remId,
        oldStr: args.oldStr,
        newStr: args.newStr,
      });
      return JSON.stringify(response, null, 2);
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
      return JSON.stringify(response, null, 2);
    },
  });
}
