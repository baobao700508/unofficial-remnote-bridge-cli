/**
 * 读取类工具：search、read_rem、read_tree、read_globe、read_context
 */

import { z } from 'zod';
import type { FastMCP } from 'fastmcp';
import { callCli } from '../daemon-client.js';

export function registerReadTools(server: FastMCP): void {
  // -------------------------------------------------------------------------
  // search
  // -------------------------------------------------------------------------
  server.addTool({
    name: 'search',
    description:
      '在 RemNote 知识库中按关键词全文搜索 Rem，返回匹配结果的摘要列表。\n\n适用场景：知道关键词但不知道位置时使用；按结构浏览应使用 read_globe。\n输出：results 数组，每项包含 remId、text（Markdown 单行）、isDocument，以及 totalFound。\n搜索结果不写入缓存——需要详情请拿 remId 调用 read_rem 或 read_tree。\n中文搜索限制：SDK 分词基于空格，中文多字词可能搜不到，建议用单字重试或改用 read_globe + read_tree 按结构定位。\n常见工作流：search 定位 → read_rem 获取详情 → read_tree 展开子树。\n关联工具：read_rem（详情）、read_tree（子树）、read_globe（按结构浏览）',
    parameters: z.object({
      query: z.string().describe('搜索关键词'),
      numResults: z
        .number()
        .optional()
        .describe('结果数量上限，默认 20'),
    }),
    execute: async (args) => {
      const payload: Record<string, unknown> = { query: args.query };
      if (args.numResults !== undefined) payload.numResults = args.numResults;
      const response = await callCli('search', payload);
      return JSON.stringify(response, null, 2);
    },
  });

  // -------------------------------------------------------------------------
  // read_rem
  // -------------------------------------------------------------------------
  server.addTool({
    name: 'read_rem',
    description:
      '通过 Rem ID 读取单个 Rem 的完整属性，返回标准化的 RemObject（JSON 格式）。\n\n适用场景：\n- 查看 Rem 的详细属性（文本、类型、标签、父子关系、练习方向等）\n- 作为 edit_rem 的前置步骤——必须先 read_rem 建立缓存\n- 不适合查看子树结构（那是 read_tree）\n\n输出：RemObject JSON，默认 34 个常用字段，full=true 返回 51 个，fields 可指定子集。\n关键字段：id, text, backText, type, parent, children, tags, isDocument, practiceDirection。\n结果自动缓存供 edit_rem 使用。默认过滤 Powerup 噪音。\n完整字段列表见 resource://rem-object-fields。\n关联工具：search（定位 remId）→ read_rem → edit_rem（编辑属性）\n区别：read_tree 返回子树大纲，read_rem 返回单个 Rem 的 JSON',
    parameters: z.object({
      remId: z.string().describe('目标 Rem 的 ID'),
      fields: z
        .array(z.string())
        .optional()
        .describe('只返回指定字段（默认返回全部）'),
      full: z
        .boolean()
        .optional()
        .describe('是否返回完整 RichText 原始结构'),
      includePowerup: z
        .boolean()
        .optional()
        .describe('是否包含 Powerup 元信息'),
    }),
    execute: async (args) => {
      const payload: Record<string, unknown> = { remId: args.remId };
      if (args.fields !== undefined) payload.fields = args.fields;
      if (args.full !== undefined) payload.full = args.full;
      if (args.includePowerup !== undefined)
        payload.includePowerup = args.includePowerup;
      const response = await callCli('read-rem', payload);
      return JSON.stringify(response, null, 2);
    },
  });

  // -------------------------------------------------------------------------
  // read_tree
  // -------------------------------------------------------------------------
  server.addTool({
    name: 'read_tree',
    description:
      '将指定 Rem 的子树序列化为 Markdown 大纲，支持深度/节点预算控制和祖先路径追溯。\n\n适用场景：\n- 查看 Rem 的子树结构（而非单个 Rem 属性，那是 read_rem）\n- 作为 edit_tree 的强制前置步骤——必须先 read_tree 建立缓存\n- 不适合全局鸟瞰（那是 read_globe）\n\n输出：Markdown 大纲文本，每行格式 {缩进}{内容} <!-- {remId} {标记} -->。\n该大纲同时也是 edit_tree 的操作对象。\n\n预算控制三维度：\n- depth（默认 3，-1 无限）：递归深度，超限节点标记 children:N\n- maxSiblings（默认 20）：单层上限，超限时 70%头+30%尾 省略\n- maxNodes（默认 200）：全局上限\n\n结果自动缓存供 edit_tree 使用。ancestorLevels 可追溯祖先提供面包屑上下文。\n详细大纲格式见 resource://outline-format。\n关联工具：search（定位 remId）→ read_tree → edit_tree（结构编辑）',
    parameters: z.object({
      remId: z.string().describe('根 Rem 的 ID'),
      depth: z
        .number()
        .optional()
        .describe('展开深度（默认由服务端决定）'),
      maxNodes: z
        .number()
        .optional()
        .describe('节点总数上限'),
      maxSiblings: z
        .number()
        .optional()
        .describe('同级节点显示上限（超出省略）'),
      ancestorLevels: z
        .number()
        .optional()
        .describe('向上展示的祖先层级数'),
      includePowerup: z
        .boolean()
        .optional()
        .describe('是否包含 Powerup 元信息'),
    }),
    execute: async (args) => {
      const payload: Record<string, unknown> = { remId: args.remId };
      if (args.depth !== undefined) payload.depth = args.depth;
      if (args.maxNodes !== undefined) payload.maxNodes = args.maxNodes;
      if (args.maxSiblings !== undefined)
        payload.maxSiblings = args.maxSiblings;
      if (args.ancestorLevels !== undefined)
        payload.ancestorLevels = args.ancestorLevels;
      if (args.includePowerup !== undefined)
        payload.includePowerup = args.includePowerup;
      const response = await callCli('read-tree', payload);
      // read-tree 返回的大纲在 response.data.outline 中
      const data = response.data as Record<string, unknown> | undefined;
      if (data?.outline && typeof data.outline === 'string') {
        return data.outline;
      }
      return JSON.stringify(response, null, 2);
    },
  });

  // -------------------------------------------------------------------------
  // read_globe
  // -------------------------------------------------------------------------
  server.addTool({
    name: 'read_globe',
    description:
      '读取知识库全局 Document 层级概览，生成 Markdown 大纲。\n无需指定 remId，自动扫描整个知识库的顶层 Rem，仅递归展开 Document 类型节点；\n非 Document 子节点不展开，仅标注 children:N。\n\n适用场景：\n- 首次探索知识库，了解有哪些文档及层级关系\n- 用户说"有哪些文档"、"知识库里有什么"\n- 不适合搜索特定内容（用 search）\n- 不适合查看某 Rem 内部子节点（用 read_tree）\n\n输出：Markdown 大纲，每行包含 Document 名称和元数据。\n不缓存结果，每次调用获取最新数据。Powerup 节点自动过滤。Portal 感知。\n预算参数：depth（默认 -1 无限）、maxNodes（200）、maxSiblings（20）。\n典型工作流：read_globe 获取宏观结构 → search 或 read_tree 深入。',
    parameters: z.object({
      depth: z
        .number()
        .optional()
        .describe('展开深度'),
      maxNodes: z
        .number()
        .optional()
        .describe('节点总数上限'),
      maxSiblings: z
        .number()
        .optional()
        .describe('同级节点显示上限'),
    }),
    execute: async (args) => {
      const payload: Record<string, unknown> = {};
      if (args.depth !== undefined) payload.depth = args.depth;
      if (args.maxNodes !== undefined) payload.maxNodes = args.maxNodes;
      if (args.maxSiblings !== undefined)
        payload.maxSiblings = args.maxSiblings;
      const response = await callCli('read-globe', payload);
      const data = response.data as Record<string, unknown> | undefined;
      if (data?.outline && typeof data.outline === 'string') {
        return data.outline;
      }
      return JSON.stringify(response, null, 2);
    },
  });

  // -------------------------------------------------------------------------
  // read_context
  // -------------------------------------------------------------------------
  server.addTool({
    name: 'read_context',
    description:
      '读取用户在 RemNote 中的当前上下文视图，生成带面包屑路径的 Markdown 大纲。\n无需指定 remId，自动获取用户当前焦点位置或打开的页面。\n\n适用场景：\n- 用户说"我现在在看什么"、"当前页面是什么"\n- 需要了解用户焦点位置以提供上下文帮助\n- 不适合查看特定 Rem（已知 remId 用 read_tree）\n\n两种模式：\n- focus（默认）：以焦点 Rem 为中心的鱼眼视图。焦点完全展开（depth=3），siblings 浅层预览（depth=1），叔伯不展开。焦点行以 * 前缀标记。可通过 focusRemId 指定任意 Rem 作为鱼眼中心，此时不依赖用户焦点。\n- page：以当前页面为根均匀展开子树。\n\n输出：Markdown 大纲 + 面包屑路径。不缓存。\n前提：focus 模式需用户有焦点 Rem 或指定 focusRemId，page 模式需有打开的页面。\n典型工作流：read_context 了解位置 → read_tree/read_rem 深入。',
    parameters: z.object({
      mode: z
        .enum(['focus', 'page'])
        .optional()
        .describe('视图模式：focus（聚焦）或 page（页面），默认 focus'),
      ancestorLevels: z
        .number()
        .optional()
        .describe('向上展示的祖先层级数'),
      depth: z
        .number()
        .optional()
        .describe('展开深度'),
      maxNodes: z
        .number()
        .optional()
        .describe('节点总数上限'),
      maxSiblings: z
        .number()
        .optional()
        .describe('同级节点显示上限'),
      focusRemId: z
        .string()
        .optional()
        .describe('指定鱼眼中心 Rem ID（仅 focus 模式，默认使用当前焦点）'),
    }),
    execute: async (args) => {
      const payload: Record<string, unknown> = {};
      if (args.mode !== undefined) payload.mode = args.mode;
      if (args.ancestorLevels !== undefined)
        payload.ancestorLevels = args.ancestorLevels;
      if (args.depth !== undefined) payload.depth = args.depth;
      if (args.maxNodes !== undefined) payload.maxNodes = args.maxNodes;
      if (args.maxSiblings !== undefined)
        payload.maxSiblings = args.maxSiblings;
      if (args.focusRemId !== undefined)
        payload.focusRemId = args.focusRemId;
      const response = await callCli('read-context', payload);
      const data = response.data as Record<string, unknown> | undefined;
      if (data?.outline && typeof data.outline === 'string') {
        return data.outline;
      }
      return JSON.stringify(response, null, 2);
    },
  });
}
