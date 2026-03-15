/**
 * 读取类工具：search、read_rem、read_tree、read_globe、read_context
 */

import { z } from 'zod';
import type { FastMCP } from 'fastmcp';
import { callCli } from '../daemon-client.js';
import { formatFrontmatter, formatDataJson } from '../format.js';

export function registerReadTools(server: FastMCP): void {
  // -------------------------------------------------------------------------
  // search
  // -------------------------------------------------------------------------
  server.addTool({
    name: 'search',
    description:
      '在 RemNote 知识库中搜索 Rem，返回匹配结果列表。' +
      '\\n\\n搜索来源（配置驱动）：在 ~/.remnote-bridge/config.json 中启用 addons.remnote-rag（enabled:true）后，优先使用 RAG 语义向量搜索（source:"rag"，中文支持好）；未启用、未安装或调用失败时自动降级到 SDK 全文搜索（source:"sdk"）。' +
      '\\n\\n适用场景：知道关键词但不知道位置时使用。不适合按结构浏览（用 read_globe）。' +
      '\\n不适用场景：搜索结果不写入缓存，不能作为 edit_rem / edit_tree 的前置步骤。需要详情请拿 remId 调用 read_rem 或 read_tree。' +
      '\\n\\n前置条件：daemon 已连接（先执行 connect）。' +
      '\\n\\n参数说明：' +
      '\\n- query（必需）：搜索关键词，不能为空' +
      '\\n- limit（可选，默认 20）：结果数量上限' +
      '\\n\\n输出格式：Data JSON。核心字段：' +
      '\\n- results 数组：每项含 remId、text、isDocument' +
      '\\n- totalFound：返回的结果数量' +
      '\\n- source："rag" 或 "sdk"，标识搜索来源' +
      '\\nRAG 模式额外返回：backText、ancestorPath、type、tags、score（语义相关性 0-1）' +
      '\\n\\n关键约束与常见问题：' +
      '\\n- SDK 模式对中文/日文/韩文等无空格语言搜索效果差（基于空格分词）。应对策略：(1) 用最具区分度的单个字搜索再筛选；(2) 尝试英文/拼音关键词；(3) 搜索失败时改用 read_globe + read_tree 按结构浏览定位' +
      '\\n- RAG 模式中文支持好，但需先安装并配置 remnote-rag addon' +
      '\\n- 搜索结果的 text 是 Markdown 格式单行文本（多行换行符已替换为空格）' +
      '\\n\\n典型工作流：search 定位 → read_rem 获取详情 / read_tree 展开子树。' +
      '\\n关联工具：read_rem（单 Rem 详情）、read_tree（子树大纲）、read_globe（知识库结构浏览）',
    parameters: z.object({
      query: z.string().describe('搜索关键词'),
      limit: z
        .number()
        .optional()
        .describe('结果数量上限，默认 20'),
    }),
    execute: async (args) => {
      const payload: Record<string, unknown> = { query: args.query };
      if (args.limit !== undefined) payload.numResults = args.limit;
      const response = await callCli('search', payload);
      if (!response.data) {
        return 'search 返回了空结果，请检查 query 参数或 daemon 状态。';
      }
      return formatDataJson(response);
    },
  });

  // -------------------------------------------------------------------------
  // read_rem
  // -------------------------------------------------------------------------
  server.addTool({
    name: 'read_rem',
    description:
      '通过 Rem ID 读取单个 Rem 的完整属性，返回标准化的 RemObject（JSON 格式）。' +
      '\\n\\n适用场景：查看 Rem 的详细属性（文本、类型、标签、父子关系、练习方向等）；作为 edit_rem 的强制前置步骤——必须先 read_rem 建立缓存才能 edit_rem。' +
      '\\n不适用场景：查看子树结构（用 read_tree）；按结构浏览知识库（用 read_globe）。' +
      '\\n\\n前置条件：daemon 已连接；需要有效的 remId（可通过 search 获取）。' +
      '\\n\\n参数说明：' +
      '\\n- remId（必需）：目标 Rem 的 ID' +
      '\\n- fields（可选）：字符串数组，只返回指定字段子集（始终包含 id）' +
      '\\n- full（可选，默认 false）：返回全部 51 个字段（含低频 R-F 字段，如 children、isPowerup 系列、deepRemsBeingReferenced 等）' +
      '\\n- includePowerup（可选，默认 false）：包含 Powerup 系统数据（默认过滤噪音）' +
      '\\n\\n输出格式：Data JSON，核心为 RemObject 对象。' +
      '\\n- 默认 33 个常用字段（RW + R），full=true 时 51 个，Portal 类型自动简化为 8 个关键字段' +
      '\\n- 关键字段：id, text, backText, type(concept/descriptor/default/portal), parent, isDocument, tags, fontSize(H1/H2/H3/null), highlightColor(Red/Orange/Yellow/Green/Blue/Purple/Gray/Brown/Pink/null), practiceDirection(forward/backward/both/none), isTodo, todoStatus(Finished/Unfinished/null)' +
      '\\n- children 字段属于 R-F 层级，默认不输出，需 full=true 或 fields 指定' +
      '\\n- text/backText 是 RichText JSON 数组，元素为纯字符串或带 i 字段的对象（i:"m" 格式化文本, i:"q" Rem 引用, i:"x" LaTeX, i:"i" 图片, i:"a" 音视频）' +
      '\\n- 可能附加 cacheOverridden（覆盖旧缓存时）和 powerupFiltered（过滤统计）元数据' +
      '\\n\\n关键约束：' +
      '\\n- 结果自动写入缓存供 edit_rem 使用。缓存存储完整 RemObject，不受 fields/full 选项影响' +
      '\\n- 默认过滤 Powerup 噪音（系统 Tag 和隐藏子 Rem），includePowerup=true 可恢复' +
      '\\n\\n典型工作流：search 定位 remId → read_rem 获取详情并建立缓存 → edit_rem 编辑属性。' +
      '\\n关联工具：search（定位 remId）、edit_rem（编辑属性，需先 read_rem）、read_tree（查看子树大纲）',
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
      if (!response.data) {
        return `read_rem 返回了空的 data，remId: ${args.remId}。请检查该 Rem 是否存在。`;
      }
      return formatDataJson(response);
    },
  });

  // -------------------------------------------------------------------------
  // read_tree
  // -------------------------------------------------------------------------
  server.addTool({
    name: 'read_tree',
    description:
      '将指定 Rem 的子树序列化为 Markdown 大纲，支持深度/节点预算控制和祖先路径追溯。' +
      '\\n\\n适用场景：查看 Rem 的子树结构和内容；作为 edit_tree 的强制前置步骤——必须先 read_tree 建立缓存才能 edit_tree。' +
      '\\n不适用场景：查看单个 Rem 属性（用 read_rem）；全局鸟瞰知识库（用 read_globe）。' +
      '\\n\\n前置条件：daemon 已连接；需要有效的 remId（可通过 search 获取）。' +
      '\\n\\n参数说明：' +
      '\\n- remId（必需）：子树根节点的 Rem ID' +
      '\\n- depth（可选，默认 3，-1 无限）：递归展开深度，超限节点标记 children:N 不展开' +
      '\\n- maxNodes（可选，默认 200）：全局节点总预算，耗尽后剩余节点生成省略占位符' +
      '\\n- maxSiblings（可选，默认 20）：单个父节点下最大可见子节点数，超限时保留前 70% + 后 30%，中间省略' +
      '\\n- ancestorLevels（可选，默认 0，上限 10）：向上追溯祖先层数，提供面包屑上下文' +
      '\\n- includePowerup（可选，默认 false）：包含 Powerup 系统数据（默认过滤噪音）' +
      '\\n\\n输出格式：Frontmatter + Body。Frontmatter 含 rootId、depth、nodeCount 等元数据；Body 为 Markdown 大纲文本。' +
      '\\n大纲每行格式：{缩进}{Markdown前缀}{内容}{箭头}{backText} <!-- {remId} {元数据标记} -->' +
      '\\n- 缩进：每级 2 空格' +
      '\\n- Markdown 前缀：# ## ### (标题), - [ ] - [x] (待办), ` (代码)' +
      '\\n- 箭头编码 practiceDirection：→←↔（单行闪卡，text→backText）；↓↑↕（多行闪卡，答案在子节点）' +
      '\\n- 元数据标记：type:concept/descriptor/portal, doc, children:N, tag:Name(id), role:card-item, top, refs:id1,id2(Portal引用)' +
      '\\n- 省略占位符：<!--...elided N siblings (parent:id range:x-y total:z)-->（精确）或 >=N nodes（预算耗尽）' +
      '\\n\\n关键约束：' +
      '\\n- 结果自动写入缓存供 edit_tree 使用。edit_tree 的 oldStr 必须精确匹配此大纲中的文本' +
      '\\n- 默认过滤 Powerup 噪音，includePowerup=true 可恢复' +
      '\\n- Portal 感知：Portal 类型 Rem 标注 type:portal 和 refs:id1,id2（引用的 Rem ID）' +
      '\\n\\n典型工作流：search 定位 remId → read_tree 展开子树并建立缓存 → edit_tree 结构编辑。' +
      '\\n关联工具：search（定位 remId）、edit_tree（结构编辑，需先 read_tree）、read_rem（单 Rem JSON 详情）、read_globe（全局鸟瞰）',
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
      const data = response.data as Record<string, unknown> | undefined;
      if (!data?.outline || typeof data.outline !== 'string') {
        return `read_tree 返回了空的大纲，remId: ${args.remId}。请检查该 Rem 是否存在或是否有子节点。`;
      }
      return formatFrontmatter(
        {
          rootId: data.rootId,
          depth: data.depth,
          nodeCount: data.nodeCount,
          ancestors: response.ancestors,
          cacheOverridden: response.cacheOverridden,
          powerupFiltered: response.powerupFiltered,
        },
        data.outline,
      );
    },
  });

  // -------------------------------------------------------------------------
  // read_globe
  // -------------------------------------------------------------------------
  server.addTool({
    name: 'read_globe',
    description:
      '读取知识库全局 Document 层级鸟瞰图，生成 Markdown 大纲。无需指定 remId。' +
      '\\n\\n适用场景：首次探索知识库，了解有哪些文档及其层级关系；用户说"有哪些文档"、"知识库里有什么"时使用。' +
      '\\n不适用场景：搜索特定内容（用 search）；查看某 Rem 内部子节点（用 read_tree）；获取单 Rem 详情（用 read_rem）。' +
      '\\n\\n前置条件：daemon 已连接。' +
      '\\n\\n参数说明：' +
      '\\n- depth（可选，默认 -1 无限）：Document 嵌套展开深度' +
      '\\n- maxNodes（可选，默认 200）：全局节点上限' +
      '\\n- maxSiblings（可选，默认 20）：每个父节点下展示的 Document 子节点上限，超限时保留前 70% + 后 30%，中间省略' +
      '\\n\\n输出格式：Frontmatter + Body。Frontmatter 含 nodeCount；Body 为 Markdown 大纲，格式同 read_tree。' +
      '\\n- 仅递归展开 Document 类型节点，非 Document 子节点不展开，仅标注 children:N' +
      '\\n- 不包含 backText、practiceDirection 等详细信息——仅提供文档层级结构概览' +
      '\\n- Powerup 节点硬编码过滤（无选项关闭）' +
      '\\n- Portal 感知：Portal 类型标注 type:portal 和 refs:id1,id2' +
      '\\n\\n关键约束：' +
      '\\n- 不缓存结果，每次调用获取最新数据' +
      '\\n- nodeCount 仅统计 Document 节点，不含非 Document 子 Rem' +
      '\\n\\n典型工作流：read_globe 获取宏观结构 → search 搜索特定内容 / read_tree 深入某文档子树。' +
      '\\n关联工具：search（关键词搜索）、read_tree（子树详细大纲）、read_rem（单 Rem 属性）',
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
      if (!data?.outline || typeof data.outline !== 'string') {
        return 'read_globe 返回了空的大纲。请检查知识库中是否有 Document。';
      }
      return formatFrontmatter(
        { nodeCount: data.nodeCount },
        data.outline,
      );
    },
  });

  // -------------------------------------------------------------------------
  // read_context
  // -------------------------------------------------------------------------
  server.addTool({
    name: 'read_context',
    description:
      '读取用户在 RemNote 中的当前上下文视图，生成带面包屑路径的 Markdown 大纲。无需指定 remId。' +
      '\\n\\n重要：用户正在看的页面对 AI 不可见。当用户说"这个"、"当前页面"、"这里"，或描述与已知信息对不上时，必须主动调用 read_context 对齐信息。' +
      '\\n\\n适用场景：了解用户当前焦点位置或打开的页面；用户说"我现在在看什么"、"当前页面是什么"时使用；需要上下文才能理解用户指代时使用。' +
      '\\n不适用场景：查看特定 Rem（已知 remId 用 read_tree）；搜索内容（用 search）。' +
      '\\n\\n前置条件：daemon 已连接。focus 模式需用户在 RemNote 中有焦点 Rem（光标在某个 Rem 上）或指定 focusRemId；page 模式需有打开的页面。' +
      '\\n\\n参数说明：' +
      '\\n- mode（可选，默认 "focus"）：视图模式' +
      '\\n  - focus：以焦点 Rem 为中心的鱼眼视图。焦点完全展开(depth=3)，siblings 浅层预览(depth=1，前3个children可见)，叔伯不展开。焦点行以 * 前缀标记' +
      '\\n  - page：以当前打开的页面为根，均匀展开子树' +
      '\\n- focusRemId（可选，仅 focus 模式）：指定任意 Rem 作为鱼眼中心，此时不依赖用户实际焦点。page 模式下传入会报错' +
      '\\n- ancestorLevels（可选，默认 2，仅 focus 模式生效）：从焦点向上追溯几层祖先作为上下文起点' +
      '\\n- depth（可选，默认 3，仅 page 模式生效）：向下展开深度（-1 无限）' +
      '\\n- maxNodes（可选，默认 200）：全局节点上限' +
      '\\n- maxSiblings（可选，默认 20）：单层子节点上限，超限时前 70% + 后 30%，中间省略' +
      '\\n\\n输出格式：Frontmatter + Body。Frontmatter 含 mode、nodeCount、breadcrumb（从根到当前位置的路径数组）；Body 为 Markdown 大纲。' +
      '\\n- focus 模式大纲头部：<!-- path: ... --> + <!-- focus: Name (id) -->，焦点 Rem 以 * 前缀标记' +
      '\\n- page 模式大纲头部：<!-- page: Name --> + <!-- path: ... -->' +
      '\\n- Powerup 硬编码过滤（无选项关闭）；Portal 感知标注 type:portal 和 refs' +
      '\\n\\n关键约束：' +
      '\\n- 不缓存结果，每次调用获取最新数据' +
      '\\n- 输出使用最小序列化，不含 backText、practiceDirection 等详细信息——需要详情用 read_tree 或 read_rem' +
      '\\n\\n典型工作流：read_context 了解用户当前位置 → read_tree / read_rem 深入查看具体内容。' +
      '\\n关联工具：read_tree（指定 Rem 子树详情）、read_rem（单 Rem 属性）、search（关键词搜索）',
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
      if (!data?.outline || typeof data.outline !== 'string') {
        return 'read_context 返回了空的大纲。请检查用户是否有焦点 Rem 或已打开的页面。';
      }
      return formatFrontmatter(
        {
          mode: data.mode,
          nodeCount: data.nodeCount,
          breadcrumb: data.breadcrumb,
        },
        data.outline,
      );
    },
  });
}
