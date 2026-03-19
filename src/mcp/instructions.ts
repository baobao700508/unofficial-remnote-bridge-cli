export const SERVER_INSTRUCTIONS = `
# RemNote Bridge MCP Server — Agent 操作手册

RemNote 知识库操作工具集。通过这些工具读取、搜索、编辑用户的 RemNote 笔记和知识结构。不能操控闪卡（Card/Flashcard）本身——闪卡由 RemNote 根据 Rem 属性自动生成。

> **架构备注**：本 MCP Server 是 \`remnote-bridge\` CLI 的包装层，每个工具调用在底层都会转化为一次 CLI 子进程调用（\`--json\` 模式）。错误消息中的"守护进程"/"daemon"指 CLI 的后台守护进程。

---

## 1. Core Concepts

### Everything is Rem

| 用户说的 | 实际上是 | 区分方式 |
|:---------|:---------|:---------|
| 笔记 / 条目 | Rem | 最基本的数据单元 |
| 文档 / 页面 | Rem（\`isDocument=true\`） | 可独立打开的页面 |
| 文件夹 | Rem（Document + 子节点全是 Document） | UI 概念，无独立标记 |
| 闪卡 | Card——由 Rem 属性自动生成 | **不可直接操控** |

### Type 系统

Rem 有两个独立维度：**type**（闪卡语义）和 **isDocument**（页面语义），二者互不影响。

| type | 含义 | UI 表现 |
|:-----|:-----|:--------|
| \`concept\` | 概念定义 | 文字**加粗** |
| \`descriptor\` | 描述/属性 | 正常字重 |
| \`default\` | 普通 Rem | 正常字重 |
| \`portal\` | 嵌入引用容器 | 紫色边框（**不可通过 setType 创建**） |

### 闪卡机制

闪卡由 Rem 的 \`type\`、\`backText\`、\`practiceDirection\` 三个字段控制。

**禁止**：在文本中插入分隔符（\`::\`、\`;;\`、\`>>\` 等）来创建闪卡。分隔符是 RemNote 编辑器语法，工具端无法识别。

#### 创建/修改闪卡

| 闪卡操作 | 方法 |
|:---------|:-----|
| 创建概念定义 | \`edit_tree\` 新增行 \`概念 ↔ 定义 <!--type:concept-->\` |
| 创建正向问答 | \`edit_tree\` 新增行 \`问题 → 答案\` |
| 创建反向问答 | \`edit_tree\` 新增行 \`问题 ← 答案\` |
| 创建多行答案 | \`edit_tree\` 新增行 \`问题 ↓\`（子行自动成为答案） |
| 改变闪卡类型/方向 | \`edit_rem\` 修改 \`type\`、\`backText\`、\`practiceDirection\` |

\`practiceDirection\` 取值：\`forward\`、\`backward\`、\`both\`、\`none\`。

#### 分隔符映射（理解用户意图）

用户在编辑器中用分隔符创建闪卡，提到时需映射到工具操作：

| 用户说 / 编辑器分隔符 | 对应 type | 对应 practiceDirection |
|:----------------------|:----------|:----------------------|
| \`::\` | concept | both |
| \`;;\` | descriptor | forward |
| \`>>\` / \`<<\` / \`<>\` | default | forward / backward / both |
| \`>>>\` / \`::>\` / \`;;>\` | default / concept / descriptor | 多行（子 Rem 为答案） |
| \`{{}}\` | default | forward（完形填空） |

### CDF（Concept-Descriptor Framework）

RemNote 推荐的知识结构化方法——用 Concept 和 Descriptor 构建可自动生成闪卡的知识网络：

- **Concept**（type:concept）：核心概念——回答"X 是什么？"，文字加粗显示
- **Descriptor**（type:descriptor）：概念的属性——回答"X 的 Y 是什么？"

在 CLI 大纲中的表现：
\`\`\`
线性回归 ↔ 最基本的回归模型 <!--id1 type:concept-->
  假设 → 因变量与自变量呈线性关系 <!--id2 type:descriptor-->
  损失函数 → 均方误差 (MSE) <!--id3 type:descriptor-->
\`\`\`

CDF 的核心优势：Concept 自动生成双向闪卡（"什么是线性回归？"↔"最基本的回归模型"），Descriptor 自动生成正向闪卡（"线性回归的假设？"→"因变量与自变量呈线性关系"），层级关系自动维护上下文。

### 完形填空（Cloze）

通过 RichText 中的 \`cId\` 标记实现（不是分隔符），练习时 \`cId\` 标记的文本被遮盖：

\`\`\`json
["The ", {"cId": "cloze1", "i": "m", "text": "capital"}, " of France is Paris"]
\`\`\`

通过 \`edit_rem\` 操作 RichText 来创建/修改完形填空——在 \`changes.text\` 数组中为目标文字片段添加 \`cId\` 字段。每个 cloze 需要唯一的 \`cId\` 值。

### 链接机制

| 机制 | 用户操作 | 说明 |
|:-----|:---------|:-----|
| Reference \`[[\` | 文本内引用 | 只是指针，不同步编辑 |
| Tag \`##\` | 附加标签 | 分类标记 |
| Portal \`((\` | 嵌入实时视图 | **编辑同步**，大纲中标为 \`type:portal\` |

#### Portal 操作速查

| 操作 | 命令 | 方式 |
|:-----|:-----|:-----|
| 创建 Portal | \`edit_tree\` | 新增行 \`<!--portal refs:id1,id2-->\` |
| 删除 Portal | \`edit_tree\` | 从大纲中移除 Portal 行 |
| 修改引用列表 | \`edit_rem\` | 修改 \`portalDirectlyIncludedRem\` 数组 |
| 移动 Portal | \`edit_tree\` | 与移动普通行相同 |
| 读取 Portal | \`read_rem\` | 自动输出 8 字段简化 JSON |

### Powerup 过滤

RemNote 格式设置（标题、高亮、代码等）底层通过 Powerup 机制实现，会向 Rem 注入隐藏的系统 Tag（\`isPowerup===true\`）和子 Rem（\`isPowerupProperty\`/\`isPowerupSlot\`）。

**默认自动过滤**（\`includePowerup=false\`），返回值中 \`powerupFiltered\` 字段统计被过滤的数量（如 \`{tags: 2, children: 3}\`）。

\`includePowerup=true\` 参数可恢复完整数据（调试用）。\`read_tree\` 支持此参数，\`read_globe\` 和 \`read_context\` 硬编码过滤。

通常无需关心 Powerup 过滤，除非你需要理解某个 Rem 为什么有额外的 children 或 tags。

---

## 2. Session Lifecycle

所有操作都依赖一个活跃的会话（= 守护进程的生命周期）。

> **⚠️ 关于 Plugin 加载方式（防幻觉红线）**：
> - 本插件是**开发者插件**，通过 RemNote「开发你的插件」功能加载本地 URL
> - **禁止**告诉用户"去插件市场/商店搜索安装"——本插件**不在 RemNote 插件市场中**
> - **禁止**告诉用户"Settings → Plugins"——这个路径不存在
> - **禁止**编造不存在的安装流程——严格按照下方步骤引导用户

### 标准模式（默认，推荐）

**标准模式是日常使用的推荐方式**。用户在自己的浏览器中打开 RemNote 并加载 Plugin，Agent 可以通过 \`read_context\` 感知用户正在浏览的页面和焦点位置，实现真正的协作。

\`\`\`
connect → 启动 daemon（幂等）
  ↓
⚠️ 引导用户加载 Plugin（见下方 ★ 标记的步骤）
  ↓
health → 确认三层就绪（daemon / Plugin / SDK）
  ↓
业务操作（read / search / edit）
  ↓
disconnect → 关闭 daemon，清空所有缓存
\`\`\`

### ★ 标准模式：connect 后引导用户加载 Plugin（核心步骤）

\`connect\`（不传 headless）成功只意味着 daemon 和 Plugin 服务已启动，**Plugin 并未自动连接**。你必须引导用户完成以下操作：

**首次使用**（RemNote 从未加载过此插件）：
1. 打开 RemNote 桌面端或网页端
2. 点击左侧边栏底部的**插件图标**（拼图形状）
3. 点击「**开发你的插件**」（Develop Your Plugin）
4. 在输入框中填入 connect 输出的 **Plugin 服务地址**（如 \`http://localhost:29101\`）
5. 等待插件加载完成

**非首次使用**（之前已加载过此插件）：
- 只需**刷新 RemNote 页面**即可（浏览器 F5 或 Cmd+R）

**你必须**：执行 \`connect\` 后，**立即**将上述步骤告知用户，**禁止**跳过此步直接调用业务命令。引导用户完成后，用 \`health\` 确认三层就绪再继续。

### Headless 模式（特殊场景，不推荐日常使用）

通过 setup（一次性）+ headless Chrome 实现自动连接，后续 connect 无需用户介入。

**⚠️ 不推荐日常使用**。Headless Chrome 是后台独立实例，**会丢失用户上下文**：\`read_context\` 返回的是 headless Chrome 的上下文，不是用户浏览器的。Agent 无法感知用户正在浏览和操作的页面，协作体验大打折扣。

**仅在以下场景使用 headless**：
- 用户明确要求在**服务器/无 GUI 环境**中运行
- 用户明确表示**不想参与操作**，希望全自动化（CI/CD、定时任务、批量处理等）
- 用户自己不在 RemNote 前面，不需要与 Agent 协作浏览

**默认始终使用标准模式**，除非用户主动要求 headless。

#### 首次使用（setup）

\`setup\` 会弹出 Chrome 窗口，用户只需 **登录 RemNote**，然后**彻底退出 Chrome**（macOS 必须 Cmd+Q，仅关窗口不够）。setup 只负责保存登录凭证。

**你必须这样与用户交互**：
1. 调用 \`setup\`
2. 立即告知用户："已打开 Chrome 浏览器。请登录 RemNote，完成后彻底退出 Chrome（macOS 请按 Cmd+Q）"
3. 等待 \`setup\` 返回（阻塞，最长 10 分钟）
4. 成功 → 进入下一步 \`connect(headless=true)\`

setup 只需执行一次。之后每次连接直接用 \`connect(headless=true)\`。

#### 后续使用

\`\`\`
connect(headless=true) → 启动 daemon + headless Chrome 自动加载 RemNote 和 Plugin
  ↓                        MCP Server 自动记住 headless 状态
health → 等待三层就绪（Plugin 需要 10-30 秒连接，可多次轮询）
  ↓                        后续所有工具自动路由到 headless 实例
业务操作（read / search / edit）
  ↓
disconnect → 关闭 daemon + headless Chrome，清空所有缓存，清除 headless 状态
\`\`\`

#### 排查

- \`health(diagnose=true)\`：截图 + Chrome 状态 + console 错误
- \`health(reload=true)\`：重载 headless Chrome 页面
- Plugin 始终不连接 → 可能登录 session 过期，需重新 setup

### Windows 注意事项

- 默认模式秒级启动（预构建 plugin）
- 端口残留：多次 connect 失败后可能 EADDRINUSE，用 \`disconnect\` 或手动终止进程后重试

### 关键要点

- daemon 默认 **30 分钟**无活动自动关闭，每次请求重置计时器
- \`disconnect\` 会销毁所有缓存，之前的 read 结果全部失效
- \`health\` 检查 daemon → Plugin → SDK 链式依赖，三者全通过才能执行业务命令

---

## 3. Common Scenarios

### 场景 A：探索知识库

> "帮我看看知识库里有什么"、"有哪些文档"

\`read_globe\` → 返回所有 Document 的层级鸟瞰图 → 拿到感兴趣的 remId 后用 \`read_tree\` 深入。

### 场景 B：搜索并深入

> "搜一下关于 X 的笔记"

\`search\` → 获得匹配 Rem 列表 → \`read_rem\`/\`read_tree\` 查看详情。

**中文搜索限制**：SDK 全文搜索基于空格分词，中文等无空格语言效果差。策略：先用完整词搜索 → 无结果则用单个最具区分度的字重试 → 仍无结果则改用 \`read_globe\` → \`read_tree\` 手动定位。RAG 模式（启用 remnote-rag addon）对中文支持更好。

### 场景 C：了解当前上下文（⚠️ 主动调用时机）

> "我现在在看什么"、"当前页面"

**用户正在看的页面对你不可见。** 当你发现以下情况时，**必须主动调用 \`read_context\`**：
- 用户提到"这个"、"当前页面"、"这里"等无上下文的指代
- 用户的描述与你已知信息对不上
- 搜索不到用户提到的内容

\`read_context\`：默认使用 **page 模式**——只需有打开的页面即可，几乎总能成功。仅当需要知道用户光标具体在哪个 Rem 上时，才显式传 \`mode="focus"\`（focus 模式要求用户光标停在某个 Rem 上，否则报错"当前没有聚焦的 Rem"）。两者都返回面包屑路径。

### 场景 D：修改文本或属性

> "把标题改成..."、"改成概念"、"加个高亮"

\`read_rem\` → 确认当前属性 → \`edit_rem\` 传入 changes 对象。只需包含要修改的字段，未提及字段保持不变。

**注意**：\`read_rem\` 默认模式启用 Token Slimming——省略处于默认值的字段，未返回的字段即默认值（如 type 未显示 = "default"，isTodo 未显示 = false，tags 未显示 = []）。需要完整字段用 \`full=true\`。

> **批量修改多个节点时**：改用 \`read_rem_in_tree\` 一次性获取全部节点属性，避免逐个 read_rem。详见场景 D2。

#### edit_rem changes 示例

\`\`\`jsonc
// 修改类型
changes: { "type": "concept" }
// 设置整行高亮背景色
changes: { "highlightColor": "Yellow" }
// 粗体文本（RichText 数组）
changes: { "text": [{"b": true, "i": "m", "text": "粗体标题"}] }
// 超链接（注意用 iUrl 不是 url）
changes: { "text": ["点击", {"i": "m", "iUrl": "https://remnote.com", "text": "访问官网"}] }
// 文字颜色（tc 是数字，RemColor 枚举）
changes: { "text": [{"i": "m", "tc": 1, "text": "红色文字"}] }
// 批量修改多个字段
changes: { "type": "concept", "highlightColor": "Yellow", "fontSize": "H1" }
\`\`\`

#### highlightColor（Rem 级别）vs h（RichText 行内）

| 属性 | 位置 | 值类型 | 效果 | 修改方式 |
|:-----|:-----|:-------|:-----|:---------|
| \`highlightColor\` | RemObject 顶层 | 字符串 \`"Red"\`/\`"Yellow"\` 等或 \`null\` | 整行背景色 | changes 直接设置 |
| \`h\` | RichText 元素内 | 数字 0-9（RemColor 枚举） | 文字片段荧光底色 | changes.text 整体替换 |

两者完全独立，互不影响。

#### RichText h 颜色值对照表

| 值 | 颜色 | 值 | 颜色 | 值 | 颜色 |
|:---|:-----|:---|:-----|:---|:-----|
| 0 | 无/默认 | 4 | Green | 7 | Gray |
| 1 | Red | 5 | Purple | 8 | Brown |
| 2 | Orange | 6 | Blue | 9 | Pink |
| 3 | Yellow | — | — | — | — |

#### 特殊字段处理规则

- **tags / sources**：传入**目标 ID 数组**，系统自动计算 diff（逐项 add/remove），不是整体替换。必须列出完整目标数组，缺少的 ID 会被删除
- **backText**：\`null\` → 清除背面（调用 \`setBackText([])\`）；传 RichText 数组设置背面内容；裸字符串自动包装为 \`[string]\`
- **parent + positionAmongstSiblings**：共享同一 SDK 调用 \`setParent(parentId, position)\`，应在同一次 changes 中同时修改
- **portalDirectlyIncludedRem**：仅 type=portal 的 Rem 可修改，传目标 ID 数组，系统自动 diff（逐项 addToPortal/removeFromPortal）
- **highlightColor**：\`null\` → 调用 \`removePowerup('h')\`（SDK 不接受 null）
- **fontSize**：\`null\` → 调用 \`setFontSize(undefined)\`（恢复普通大小）
- **todoStatus**：依赖 \`isTodo=true\` 才生效；清除 todo 应设 \`isTodo=false\`
- **type**：不可设为 \`portal\`（Portal 只能通过 SDK \`createPortal()\` 或 edit_tree \`<!--portal-->\` 创建）

### 场景 D2：批量读取 + 标注（课本划重点）

> "帮我标注这些笔记的重点"、"给关键词加高亮"、"批量修改格式"

当需要读取一棵子树并对**多个节点**进行属性或富文本修改时，使用 \`read_rem_in_tree\` 一次性获取全部信息：

\`read_rem_in_tree\` → 同时获取大纲 + 每个节点的 RemObject（含完整 RichText）
  ↓
对目标节点直接调用 \`edit_rem\`（rem 缓存已就绪，无需再逐个 read_rem）
  +
如需结构变更，直接调用 \`edit_tree\`（tree 缓存已就绪，无需再 read_tree）

**为什么不用 read_tree + N×read_rem？** \`read_rem_in_tree\` 一次调用建立双重缓存，省去 N+1 次网络往返。对 30+ 节点的子树，差异是 1 次调用 vs 31+ 次调用。

**注意**：\`read_rem_in_tree\` 默认 maxNodes=50（每节点需 40+ SDK 调用），大子树需显式设置 maxNodes。

### 场景 E：修改结构（新增/删除/移动/重排）

> "在这下面加几个子项"、"删掉这个"

\`read_tree\` → 查看大纲 → \`edit_tree\` 用 str_replace 修改。

**关键红线**：
- edit_tree **禁止修改行内容**（改内容用 edit_rem）
- 新增行必须插在兄弟**末尾**，不能插在有子节点的 Rem 和其 children 之间（否则触发 \`children_captured\`）

#### 新增行格式说明

新增行（无 remId 注释的行）支持以下格式：

**Markdown 前缀**：\`# \` \`## \` \`### \` \`- [ ] \` \`- [x] \` \`> \`(引用块) \`1. \`(有序列表) \\\`code\\\` \`---\`

> **⚠️ 有序列表必须用 \`1. \` 前缀（Lazy Numbering）**：RemNote 有序列表采用 Lazy Numbering——所有列表项统一写 \`1. \`，RemNote 按层级自动编号（1./2./3./A./B./I./II.）。不要手动编号（如 \`2. \` \`3. \`）。\`2. \`~\`9. \` 会被容错处理（归一化为 isListItem 并返回 templateWarnings 警告），\`10. \` 及以上不会被识别为有序列表。

**箭头分隔符**：
- 单行：\`→\`（forward）\`←\`（backward）\`↔\`（both）——格式 \`text → backText\`
- 多行：\`↓\`（forward）\`↑\`（backward）\`↕\`（both）——子行自动成为答案

**元数据注释**（可选，行尾追加）：
- \`<!--type:concept-->\` \`<!--type:descriptor-->\` \`<!--doc-->\`
- \`<!--tag:标签名(tagId)-->\`（可多个，空格分隔）
- 可组合：\`<!--type:concept doc tag:数学(tag01)-->\`

**Portal 新增**：
- \`<!--portal refs:id1,id2-->\`（创建并引用指定 Rem）
- \`<!--portal-->\`（创建空 Portal）

#### 行引用模板 \`{{remId}}\`

已有行支持两种写法：**模板模式**（推荐）和**完整匹配模式**（回退）。

**模板模式**（优先使用）：用 \`{{remId}}\` 引用已有行，系统自动展开为完整内容（不含缩进）。节省 token、减少复制错误。
**完整匹配模式**（回退）：直接从大纲复制完整行内容（含 \`<!--remId 元数据-->\`）。

**策略：优先模板，连续失败则回退**。如果模板模式连续 2+ 次因 ID 错误导致 \`old_str not found\`，说明当前上下文不足以准确引用 ID——立即切换到完整匹配模式（从最新大纲复制完整行内容），不要反复重试模板。

**模板模式示例**：
\`\`\`
# 重排两个节点
oldStr: "    {{id1_1}}\\n    {{id1_2}}"
newStr: "    {{id1_2}}\\n    {{id1_1}}"

# 删除带子节点的行
oldStr: "  {{idA}}\\n    {{idA1}}\\n  {{idB}}"
newStr: "  {{idB}}"

# 末尾新增行（新增行手动写，已有行用模板）
oldStr: "  {{idZ}}"
newStr: "  新增行\\n  {{idZ}}"
\`\`\`

**完整匹配模式示例**（回退时使用）：
\`\`\`
oldStr: "    动态数组 <!--id1_1 type:concept-->\\n    静态数组 <!--id1_2 type:concept-->"
newStr: "    静态数组 <!--id1_2 type:concept-->\\n    动态数组 <!--id1_1 type:concept-->"
\`\`\`

**模板规则**：
- \`{{remId}}\` 展开为**不含缩进**的完整行内容，缩进由你控制
- 只匹配纯字母数字（\`[a-zA-Z0-9]+\`），与 RemNote cloze 语法 \`{{text}}\` 不冲突
- 新增行不能用 \`{{}}\`（新增行没有 remId）
- 可以混用：部分行用 \`{{id}}\`，部分行手动写

#### ⚠️ children_captured 详解

在有子节点的 Rem 和其 children 之间插入新行，会导致新行"劫持"已有 children：

\`\`\`
❌ 错误（模板）：
oldStr: "  {{idA}}"   newStr: "  {{idA}}\\n  新行"   ← idA 有子节点，新行劫持 children！
❌ 错误（完整匹配）：
oldStr: "  水分子 ↓ <!--idA-->"   newStr: "  水分子 ↓ <!--idA-->\\n  新行"   ← 同理

✅ 正确：插在末尾
oldStr: "  {{idZ}}"   newStr: "  {{idZ}}\\n  新行"
\`\`\`

#### 创建新节点并移动已有 children

当需要在已有 children 的 Rem 下插入一个新的中间层时，不能一步完成（否则触发 children_captured）。正确做法是**两步**：

1. 先在大纲**末尾**新增节点（避免劫持）
2. 再发一次 \`edit_tree\`，将已有 children 移动到新节点下（通过调整缩进实现移动）

### 场景 F：创建/修改闪卡

> "创建概念定义"、"做个正向问答卡"

**创建新闪卡**（\`edit_tree\` 新增行 + 箭头 + 可选元数据注释）：
- 正向：\`问题 → 答案\`
- 双向：\`问题 ↔ 答案\`
- 多行：\`问题 ↓\`（子行自动成为答案）
- 概念定义：\`概念 ↔ 定义 <!--type:concept-->\`（一步完成）
- 描述属性：\`属性 → 值 <!--type:descriptor-->\`（与 Concept 配合使用）

**Concept vs Descriptor 使用场景**：
- Concept（概念定义）：独立的核心概念，回答"X 是什么？"——如"线性回归 ↔ 最基本的回归模型"
- Descriptor（描述属性）：作为某个 Concept 的子 Rem，回答"X 的 Y 是什么？"——如"假设 → 因变量与自变量呈线性关系"
- 通常 Descriptor 是 Concept 的直接子节点，二者配合构成完整的 CDF 知识结构

**修改现有 Rem 的闪卡行为**（\`read_rem\` → \`edit_rem\`）：修改 \`type\`、\`practiceDirection\`、\`backText\` 字段。

### 场景 G：排查连接问题

\`health\` 默认查询所有活跃实例的三层状态（daemon / Plugin / SDK），返回 \`instances\` 数组。有 \`--instance\` 或 \`--headless\` 时只查询指定实例。每个实例的 \`plugin.isTwin\` 标记是否为孪生连接。

故障定位：无活跃实例 → \`connect\`；Plugin 未连接 → 引导用户操作 RemNote（标准模式下刷新页面或首次加载插件）；SDK 未就绪 → 等待重试。

### 场景 H：管理增强项目

\`addon\`：\`action="list"\` 查看状态、\`action="install"\` 安装、\`action="uninstall"\` 卸载。

### 场景 I：重置环境

\`clean\` 彻底清理所有 daemon 进程、PID 文件、注册表和 addon 数据。清理后需重新 \`connect\`。

---

## 4. Safety Rules

### 黄金法则：先 read 再 edit

- \`edit_rem\` 前必须先 \`read_rem\` 或 \`read_rem_in_tree\` 同一个 remId
- \`edit_tree\` 前必须先 \`read_tree\` 或 \`read_rem_in_tree\` 同一个 remId
- \`read_rem_in_tree\` 同时建立两种缓存，调用后可直接 \`edit_tree\` 和 \`edit_rem\`
- \`search\`/\`read_globe\`/\`read_context\` **不写入缓存**，不能作为 edit 前置

跳过 read 直接 edit 会被拒绝（硬性要求）。

### 两道防线

1. **缓存存在**：必须有对应的 read 缓存
2. **语义并发检测**（三层字段分类）：edit 时重新读取最新数据并逐字段比较——语义字段（text/type/tags 等）变化 → 硬拒绝；parent 变化 → 放行 + warnings 返回 \`"⚠️ parent has changed (was: X, now: Y)..."\`；普通元数据（positionAmongstSiblings/updatedAt 等）变化 → 放行 + warnings 返回 \`"ℹ️ Metadata fields changed since last read: ..."\`。这意味着 \`edit_tree\` 移动/重排 Rem 后，可以直接 \`edit_rem\` 修改受影响节点，无需重新 read

### edit_tree 禁止事项

- \`content_modified\`：修改已有行内容 → 用 edit_rem
- \`root_modified\`：删除/修改根节点
- \`folded_delete\`：删除有隐藏子节点的行 → 更大 depth 重新 read_tree
- \`orphan_detected\`：删父留子 → 必须一起删
- \`elided_modified\`：修改/删除省略占位符 → 更大参数重新 read_tree
- \`children_captured\`：新行劫持已有子节点 → 插在兄弟末尾
- \`indent_skip\`：缩进跳级 → 每级 2 空格

### 缓存行为速查表

| 场景 | 缓存行为 | 重试策略 |
|:-----|:---------|:---------|
| edit_rem 写入成功 | 从 Plugin 重新读取 → 更新缓存 | 可继续编辑 |
| edit_rem 仅元数据变化 | 静默刷新缓存并放行 | 可继续编辑（返回警告） |
| edit_rem 语义字段冲突 | 不更新缓存 | 必须重新 read_rem |
| edit_rem 部分写入失败 | 不更新缓存 | 必须重新 read_rem |
| edit_tree 成功 | 自动 re-read → 更新缓存 | 可连续 edit |
| edit_tree 防线 3 拒绝（str_replace 不匹配等） | 缓存保持不变 | 调整 oldStr/newStr 后直接重试 |
| edit_tree 执行中异常 | 已执行操作保留（**无回滚**），不更新缓存 | 必须重新 read_tree |
| 枚举值非法（edit_rem） | 报错拒绝，缓存不变 | 检查允许的值范围后重试 |

### 可写字段列表（21 个）

\`\`\`
text, backText, type, isDocument, parent,
fontSize, highlightColor,
isTodo, todoStatus, isCode, isQuote, isListItem, isCardItem, isSlot, isProperty,
enablePractice, practiceDirection,
tags, sources, positionAmongstSiblings, portalDirectlyIncludedRem
\`\`\`

### 枚举约束速查

| 字段 | 允许的值 |
|:-----|:---------|
| \`type\` | \`concept\` / \`descriptor\` / \`default\`（\`portal\` 不可设置） |
| \`practiceDirection\` | \`forward\` / \`backward\` / \`both\` / \`none\` |
| \`highlightColor\` | \`Red\` / \`Orange\` / \`Yellow\` / \`Green\` / \`Blue\` / \`Purple\` / \`Gray\` / \`Brown\` / \`Pink\` / \`null\` |
| \`fontSize\` | \`H1\` / \`H2\` / \`H3\` / \`null\` |
| \`todoStatus\` | \`Finished\` / \`Unfinished\` / \`null\`（需先 \`isTodo=true\`） |

---

## 5. Output Format Quick Reference

\`read_tree\`、\`read_globe\`、\`read_context\` 返回 Markdown 大纲。

### 行结构

\`\`\`
{缩进}{前缀}{内容}{箭头}{backText} <!-- {remId} {标记} -->
\`\`\`

- 缩进：每级 2 空格
- 前缀：\`# \`(H1)、\`## \`(H2)、\`### \`(H3)、\`- [ ] \`(待办)、\`- [x] \`(已完成)、\`> \`(引用块)、\`1. \`(有序列表)、\\\`...\\\`(代码)、\`---\`(分隔线)

### 元数据标记

| 标记 | 含义 |
|:-----|:-----|
| \`type:concept\` / \`type:descriptor\` / \`type:portal\` | Rem 类型（default 不标记） |
| \`doc\` | 是文档页面 |
| \`top\` | 知识库顶层 Rem |
| \`children:N\` | 有 N 个未展开的子节点 |
| \`role:card-item\` | 多行闪卡答案行 |
| \`tag:Name(id)\` | 已附加的标签 |
| \`refs:id1,id2\` | Portal 引用的 Rem ID |

### 箭头含义

| 箭头 | practiceDirection | 格式 |
|:-----|:------------------|:-----|
| \`→\` \`←\` \`↔\` | forward / backward / both | \`text → backText\`（单行） |
| \`↓\` \`↑\` \`↕\` | forward / backward / both | \`text ↓\` 或 \`text ↓ backText\`（多行，子行为答案） |

### 省略占位符

\`\`\`
<!--...elided 3 siblings (parent:id range:2-4 total:5)-->       精确省略（超 maxSiblings）
<!--...elided >=10 nodes (parent:id range:5-14 total:20)-->     非精确省略（maxNodes 耗尽）
\`\`\`

精确省略保留前 70% + 后 30%。**省略占位符不可删除或修改**。

### edit_tree 新增行格式

新增行（无 remId 注释的行）在 newStr 中出现时，会被创建为新的 Rem。格式选项：

- 纯文本行：\`新内容\`
- 带前缀：\`# 新标题\`、\`- [ ] 新待办\`、\`> 引用内容\`、\`1. 列表项\`
- 带箭头：\`问题 → 答案\`、\`概念 ↔ 定义\`、\`题目 ↓\`
- 带元数据注释（metadata-only，无 remId）：\`新行 <!--type:concept doc-->\`
- Portal 行：\`<!--portal refs:id1,id2-->\`
- 嵌套新增（父+子一起创建）：
  \`\`\`
  新父节点 ↓
    新子行 1
    新子行 2
  \`\`\`

### 完整示例大纲

\`\`\`markdown
# 数据结构 <!--kLr type:concept doc top-->
  ## 线性结构 <!--ABC type:concept-->
    数组 → Array <!--DEF-->
    链表 ↓ <!--GHI type:concept-->
      单向链表 <!--JKL role:card-item-->
      双向链表 <!--MNO role:card-item-->
    - [x] 复习完成 <!--PQR-->
  ## 树结构 <!--VWX type:concept children:8-->
  <!--...elided 3 siblings (parent:kLr range:3-5 total:6)-->
  嵌入视图 <!--p01 type:portal refs:ref1,ref2-->
  重要概念 <!--QRS tag:数学(tag01) tag:基础(tag02)-->
\`\`\`

---

## 6. RichText 格式参考

\`text\` 和 \`backText\` 字段是 JSON 数组（RichText），元素为纯字符串或格式化对象。

### 元素类型表

| \`i\` 值 | 含义 | 必填字段 | 可选字段 |
|:---------|:-----|:---------|:---------|
| （纯 string） | 纯文本片段 | — | — |
| \`"m"\` | 带格式文本 | \`text\` | \`b\`, \`l\`, \`u\`, \`h\`, \`tc\`, \`q\`, \`code\`, \`language\`, \`cId\`, \`iUrl\` |
| \`"q"\` | Rem 引用 | \`_id\` | \`content\`, \`showFullName\`, \`aliasId\` |
| \`"i"\` | 图片 | \`url\` | \`width\`, \`height\`, \`percent\`(25/50/100) |
| \`"x"\` | LaTeX | \`text\` | \`block\`(true=块级公式) |
| \`"a"\` | 音频/视频 | \`url\`, \`onlyAudio\`(**必填**) | \`width\`, \`height\` |
| \`"s"\` | 卡片分隔符 | — | \`delimiterCharacterForSerialization\` |

### 格式标记表（\`i:"m"\` 主要，但 \`i:"q"\` 等也支持部分标记）

| 字段 | 类型 | 含义 |
|:-----|:-----|:-----|
| \`b\` | \`true\` | 加粗 |
| \`l\` | \`true\` | 斜体（小写 L，不是大写 I） |
| \`u\` | \`true\` | 下划线 |
| \`h\` | number | 高亮颜色（RemColor 0-9） |
| \`tc\` | number | 文字颜色（RemColor 0-9） |
| \`q\` | \`true\` | 行内代码（红色等宽样式） |
| \`code\` | \`true\` | 代码块（带语言标签和复制按钮） |
| \`language\` | string | 代码语言（如 \`"python"\`） |
| \`cId\` | string | 完形填空 ID |
| \`hiddenCloze\` | \`true\` | 完形填空隐藏状态 |
| \`iUrl\` | string | 超链接 URL（**不是 \`url\`！**） |
| \`qId\` | string | 行内引用的 Rem ID |

### RemColor 颜色枚举（\`h\` 和 \`tc\` 共用）

| 值 | 颜色 | 值 | 颜色 | 值 | 颜色 |
|:---|:-----|:---|:-----|:---|:-----|
| 0 | 无/默认 | 4 | Green | 7 | Gray |
| 1 | Red | 5 | Purple | 8 | Brown |
| 2 | Orange | 6 | Blue | 9 | Pink |
| 3 | Yellow | — | — | — | — |

### 常用构造示例（key 字母序排列）

\`\`\`jsonc
{"b": true, "i": "m", "text": "粗体"}                    // 粗体
{"i": "m", "q": true, "text": "code"}                    // 行内代码
{"i": "m", "iUrl": "https://...", "text": "链接"}         // 超链接（iUrl 不是 url！）
{"b": true, "h": 1, "i": "m", "text": "重点"}            // 粗体+红色高亮
{"cId": "c1", "i": "m", "text": "答案"}                   // 完形填空
{"_id": "remId", "b": true, "i": "q"}                    // Rem 引用加粗
{"i": "x", "text": "E = mc^2"}                           // LaTeX
{"i": "a", "onlyAudio": false, "url": "..."}             // 视频（onlyAudio 必填！）
{"i": "a", "onlyAudio": true, "url": "..."}              // 音频
\`\`\`

### ⚠️ 关键陷阱

- \`i:"a"\` 的 \`onlyAudio\` 是**必填**字段（\`true\`=音频，\`false\`=视频），缺少会导致 SDK 拒绝写入
- 超链接必须用 \`iUrl\`，\`url\` 字段已废弃无效
- RichText 对象内部按 **key 字母序排列**（\`_id\` < \`b\` < \`cId\` < \`h\` < \`i\` < \`iUrl\` < \`text\`），确保序列化一致性
- \`highlightColor\`（RemObject 顶层，字符串 \`"Red"\`）与 \`h\`（RichText 内部，数字 \`1\`）完全独立——前者是整行背景色，后者是文字片段荧光底色
- 防线 2（语义并发检测）依赖 key 字母序的确定性序列化来比较语义字段

---

## 7. Error Quick Reference

### 诊断决策树


\`\`\`
命令报错
├─ "守护进程未运行" → connect 未执行或 daemon 已超时 → 执行 connect
├─ "Plugin 未连接" → RemNote 未打开或插件未加载 → 引导用户操作 RemNote
├─ "SDK 未就绪" → 知识库尚未加载 → 等待并重试 health
├─ "has not been read yet" → 未先 read → 执行对应 read 后重试
├─ "has been modified since last read" → 语义字段被外部修改 → 必须重新 read（不可直接重试）
├─ "Invalid value" → 枚举字段值不合法 → 检查允许的值范围
├─ "old_str not found" → oldStr 不精确 → 检查缩进、空格、换行
├─ "old_str matches N locations" → oldStr 不够具体 → 扩大范围包含更多上下文
├─ "content_modified" → edit_tree 中改了行内容 → 用 edit_rem
├─ "orphan_detected" → 删了父但留了子 → 同时删除所有子行
├─ "folded_delete" → 删了有隐藏子节点的行 → 更大 depth 重新 read_tree
├─ "elided_modified" → 删/改了省略占位符 → 更大参数重新 read_tree
├─ "children_captured" → 新行劫持已有子节点 → 新行插到兄弟末尾
├─ "indent_skip" → 缩进跳级 → 每级 2 空格不可跳级
├─ "Rem not found" → remId 无效或已删除 → 用 search 重新定位
└─ "focusRemId 仅在 focus 模式下有效" → page 模式不支持 → 去掉参数或改用 focus 模式
\`\`\`
`;
