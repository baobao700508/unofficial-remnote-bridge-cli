# Overall — remnote-bridge Agent 操作指南

> 本文档面向 AI Agent（MCP / Skills 层），提供操作 RemNote 知识库所需的概念理解、命令决策和技术参考。
> 各命令的详细参数、输出格式和错误码见各自的 instruction 文件。

---

## 1. 本文档定位

本文档是 Agent 操作 RemNote 的**总纲**。Agent 应按以下策略使用文档体系：

1. **首次加载**：读本文件（overall.md），建立概念理解和操作框架
2. **执行命令前**：读取对应命令的 instruction 文件（如 `read-tree.md`、`edit-rem.md`），获取详细参数和输出格式
3. **遇到术语困惑**：查阅 `docs/vocabulary-definition/` 下的分类文件

---

## 2. RemNote 核心概念

> Agent 必须理解这些概念，才能正确翻译用户的自然语言请求。

### 2.1 一切皆 Rem

RemNote 中**一切内容的基本单元都是 Rem**。文档、文件夹、闪卡、标签、属性——本质上都是 Rem 的不同形态，而非独立的数据类型。

| 用户说的 | 实际上是 | 区分方式 |
|:---------|:---------|:---------|
| 笔记 / 条目 / 项 | Rem | 最基本的数据单元 |
| 文档 / 页面 | Rem（`isDocument=true`） | 可作为独立页面打开 |
| 文件夹 / 目录 | Rem（Document 且子节点全是 Document） | UI 概念，SDK 无独立标记 |
| 闪卡 / 卡片 | **Card**——由 RemNote 根据 Rem 属性自动生成 | **不可直接操控**，修改 Rem 属性即可改变闪卡行为 |

**红线**：本项目不操控 Card / Flashcard。要改变闪卡行为，修改 Rem 的 `type`、`backText`、`practiceDirection`、`enablePractice` 等属性。

### 2.2 用户语言 → CLI 操作映射表

Agent 的核心任务是将用户的自然语言请求翻译为 CLI 命令。以下映射表覆盖最常见场景：

#### 探索 / 读取

| 用户表述 | RemNote 概念 | CLI 命令 |
|:---------|:-------------|:---------|
| "看看知识库有什么"、"有哪些文档" | 知识库全局 Document 结构 | `read-globe` |
| "我现在在看什么"、"当前页面" | 用户当前焦点/页面 | `read-context` |
| "展开这个主题"、"看看下面有什么" | Rem 子树 | `read-tree <remId>` |
| "这个笔记的详细信息" | Rem 的完整属性 | `read-rem <remId>` |
| "搜索 X"、"查找关于 X 的内容" | 全文搜索 | `search <query>` |

#### 修改 / 写入

| 用户表述 | 操作类型 | CLI 命令 |
|:---------|:---------|:---------|
| "改文本"、"改标题"、"改颜色"、"改类型" | 修改 Rem 属性 | `edit-rem` |
| "创建一个概念定义 (::)" | 修改 type + backText | `edit-rem` |
| "新增一个子节点"、"添加笔记" | 结构操作：新增 | `edit-tree` |
| "删除这个"、"移除" | 结构操作：删除 | `edit-tree` |
| "移动到…下面" | 结构操作：移动 | `edit-tree` |
| "调整顺序"、"排在前面" | 结构操作：重排 | `edit-tree` |
| "把这段文字改成…" | 行内容修改 | `edit-rem`（**不是** edit-tree） |

**关键区分**：`edit-rem` 修改 Rem 的**属性**（文本、类型、格式等），`edit-tree` 修改 Rem 之间的**结构关系**（新增、删除、移动、重排）。edit-tree **禁止修改行内容**。

### 2.3 Rem 的类型系统

Rem 有两个**独立维度**的类型：

#### type 字段（闪卡语义）

| type 值 | 触发分隔符 | 含义 | UI 表现 |
|:--------|:----------|:-----|:--------|
| `concept` | `::` 或 `::>` | 概念定义 | 文字**加粗** |
| `descriptor` | `;;` 或 `;;>` | 描述/属性 | 文字*斜体* |
| `default` | 无分隔符 / `>>` / `<<` / `<>` / `>>>` / `{{}}` | 普通 Rem | 正常字重 |
| `portal` | — | 嵌入引用容器 | 紫色左边框（**只读**，不可通过 setType 设置） |

#### isDocument 字段（页面语义）

`isDocument` 与 `type` 完全独立——一个 `concept` 类型的 Rem 可以同时是 Document。

### 2.4 分隔符与闪卡

用户输入的分隔符决定了 Rem 的 `type`、`backText` 和默认 `practiceDirection`。理解分隔符是理解用户创建闪卡意图的关键。

| 分隔符 | type | backText | 默认方向 | 用途 |
|:-------|:-----|:---------|:---------|:-----|
| （无） | `default` | `null` | — | 无闪卡行为 |
| `::` | `concept` | 后半部分 | `both` | 概念定义（CDF 框架） |
| `;;` | `descriptor` | 后半部分 | `forward` | 描述属性（CDF 框架） |
| `>>` | `default` | 后半部分 | `forward` | 正向问答 |
| `<<` | `default` | 后半部分 | `backward` | 反向问答 |
| `<>` | `default` | 后半部分 | `both` | 双向问答 |
| `>>>` | `default` | `null` | `forward` | 多行答案（子 Rem 为答案） |
| `::>` | `concept` | `null` | `both` | 概念型多行答案 |
| `;;>` | `descriptor` | `null` | `forward` | 描述型多行答案 |
| `{{}}` | `default` | `null` | `forward` | 完形填空（Cloze） |

**重要**：分隔符决定创建时的**默认**方向，用户可以事后独立修改 `practiceDirection`。`practiceDirection` 的取值：`forward`（正向）、`backward`（反向）、`both`（双向）、`none`（不练习）。

**CDF（Concept-Descriptor Framework）**：RemNote 推荐的知识结构化方法——`Concept` 是需要理解的概念，`Descriptor` 是概念的属性/描述。典型结构：

```
线性回归 :: 最基本的回归模型        ← Concept
  假设 ;; 因变量与自变量呈线性关系   ← Descriptor
  损失函数 ;; 均方误差 (MSE)        ← Descriptor
```

### 2.5 三种链接机制

| 机制 | 用户操作 | 本质 | 编辑同步 | CLI 可见性 |
|:-----|:---------|:-----|:---------|:-----------|
| **Reference** | `[[` | RichText 中的引用元素 | 否（只是指针） | read-rem/read-tree 中显示为 `[[文本]]` |
| **Tag** | `##` | 将 Rem 作为标签附加 | 否（分类标记） | read-rem 的 `tags` 数组 |
| **Portal** | `((` | 嵌入 Rem 的实时视图 | 是（编辑同步） | read-tree 标记为 `type:portal` |

### 2.6 Powerup 机制简述

RemNote 的格式设置（fontSize、highlightColor、isCode 等）底层通过 **Powerup 机制**实现：给 Rem 注入隐藏的系统 Tag + 创建隐藏的子 Rem 存储参数值。

这些隐藏数据会混入 `tags` 和 `children` 数组，对 Agent 构成噪音。**默认自动过滤**（`includePowerup=false`）。详见第 11 节。

### 2.7 术语深入参考

需要更深入理解某个概念时，查阅对应的词汇定义文件：

| 主题 | 文件 |
|:-----|:-----|
| Rem / Document / RemType / RichText / Card | `docs/vocabulary-definition/01-core-data-model.md` |
| Parent / Child / Hierarchy / Breadcrumb | `docs/vocabulary-definition/02-hierarchy-and-navigation.md` |
| Reference / Tag / Powerup / Portal | `docs/vocabulary-definition/03-linking-and-references.md` |
| 分隔符 / CDF / practiceDirection / SRS | `docs/vocabulary-definition/04-flashcard-system.md` |
| RichText 元素 / 行内格式 / Slot vs Property | `docs/vocabulary-definition/05-formatting-and-richtext.md` |
| Property / PropertyType / Table / Template | `docs/vocabulary-definition/06-tables-and-properties.md` |
| Global Search / Search Portal / Query Language | `docs/vocabulary-definition/07-search-and-query.md` |

---

## 3. 系统架构与会话

### 3.1 三层架构

```
AI Agent（Claude Code / MCP Client）
    │  调用 CLI 命令（短进程，无状态）
    ↓
remnote-bridge（命令层）
    │  WebSocket IPC
    ↓
daemon（守护进程，长生命周期）
    ├── ws-server：接收请求，分发到 handlers，转发到 Plugin
    ├── handlers：业务编排（缓存、防线、diff）
    └── config-server：HTTP 配置界面
    │  WebSocket 连接
    ↓
remnote-plugin（桥接层，运行在浏览器中）
    ├── bridge：WebSocket 客户端 + 消息路由
    ├── services：业务操作（直接调用 RemNote SDK）
    └── utils：纯函数（序列化、省略）
    │
    ↓
RemNote SDK → 知识库
```

核心设计：
- **CLI 命令是无状态短进程**：每次调用都是独立 OS 进程，执行完即退出
- **守护进程持有状态**：缓存、WS 连接、超时计时器都在 daemon 中
- **Plugin 运行在浏览器中**：通过 RemNote SDK 操作知识库，只响应 daemon 转发的请求

### 3.2 会话生命周期

一次**会话（Session）= 守护进程的生命周期**。

```
connect → daemon 启动 → 会话开始
  ↕ (业务命令：read-rem, edit-tree, search, ...)
disconnect → daemon 关闭 → 会话结束，缓存清空
```

`connect` 启动三个服务：

| 服务 | 默认端口 | 用途 |
|:-----|:---------|:-----|
| WS Server | 3002 | CLI ↔ daemon ↔ Plugin 通信 |
| webpack-dev-server | 8080 | 热加载 Plugin 到 RemNote |
| ConfigServer | 3003 | HTTP 配置界面 |

超时机制：daemon 默认 **30 分钟无活动**自动关闭。每次收到 CLI 请求时重置计时器。

### 3.3 健康状态

`health` 命令检查三层状态：

| 检查项 | 含义 |
|:-------|:-----|
| daemon | 守护进程是否在运行 |
| plugin | Plugin 是否已通过 WS 连接 |
| sdk | RemNote SDK 是否就绪（知识库已加载） |

三者全部就绪才能执行业务命令。

---

## 4. 命令体系

### 4.1 命令速查表

#### 基础设施命令

| 命令 | 功能 | 需要 Plugin | 详细文档 |
|:-----|:-----|:------------|:---------|
| `connect` | 启动守护进程 | 否 | `connect.md` |
| `health` | 检查系统状态 | 否 | `health.md` |
| `disconnect` | 停止守护进程 | 否 | `disconnect.md` |

#### 读取命令

| 命令 | 功能 | 输入 | 缓存 | 详细文档 |
|:-----|:-----|:-----|:-----|:---------|
| `read-globe` | 知识库全局 Document 概览 | 展开参数 | 否 | `read-globe.md` |
| `read-context` | 当前上下文视图 | mode + 参数 | 否 | `read-context.md` |
| `read-tree` | 读取子树为 Markdown 大纲 | remId + 展开参数 | 是（`tree:`） | `read-tree.md` |
| `read-rem` | 读取单个 Rem 的 JSON 属性 | remId | 是（`rem:`） | `read-rem.md` |
| `search` | 全文搜索 | query | 否 | `search.md` |

#### 写入命令

| 命令 | 功能 | 前置条件 | 安全机制 | 详细文档 |
|:-----|:-----|:---------|:---------|:---------|
| `edit-rem` | str_replace 编辑 Rem JSON 字段 | 先 `read-rem` | 三道防线 | `edit-rem.md` |
| `edit-tree` | str_replace 编辑树结构 | 先 `read-tree` | 三道防线 + diff | `edit-tree.md` |

### 4.2 探索决策指南

Agent 需要根据用户意图选择正确的读取命令：

```
用户想了解什么？
├─ 知识库整体结构 → read-globe
│   仅展示 Document 层级，非 Document 的 Rem 不展开
│   适合：首次探索、了解知识库组织
│
├─ 用户当前在看什么 → read-context
│   ├─ focus 模式（默认）：以用户聚焦的 Rem 为中心的鱼眼视图
│   │   焦点本身展开 depth=3，siblings 浅层展开，祖先路径可见
│   └─ page 模式：以当前打开页面为根展开子树
│
├─ 某个具体 Rem 的子树 → read-tree <remId>
│   完整展开子树（支持深度/节点预算控制）
│   结果缓存，供 edit-tree 使用
│
├─ 某个 Rem 的详细属性 → read-rem <remId>
│   返回 51 字段的 RemObject JSON
│   结果缓存，供 edit-rem 使用
│
└─ 按关键词搜索 → search <query>
    全文搜索，返回匹配的 Rem 列表
    ⚠ 中文等无空格分词语言搜索效果差（详见 search.md）
```

#### read-globe vs read-context vs read-tree 选择表

| 场景 | 命令 | 输出特点 |
|:-----|:-----|:---------|
| "看看知识库有什么" | `read-globe` | 仅 Document 层级，无内容 Rem |
| "我现在在编辑什么" | `read-context --mode focus` | 鱼眼视图，焦点处详细 |
| "当前页面的内容" | `read-context --mode page` | 以页面为根展开 |
| "展开某个主题的细节" | `read-tree <id>` | 完整子树，可缓存供编辑 |

#### read-globe 特性

- 获取所有顶层 Rem（`parent === null`），仅展开 Document 类型节点
- 非 Document 子 Rem 不递归展开（元数据中标注 `children:N`）
- 参数：`depth`（默认 -1 无限）、`maxNodes`（200）、`maxSiblings`（20）
- 不缓存结果
- 输出头部：`<!-- globe: 知识库概览 -->`

#### read-context 特性

**focus 模式**（默认）：
- 获取用户当前聚焦的 Rem（需要用户在 RemNote 中点击某个 Rem）
- 鱼眼视图展开策略：焦点 depth=3，焦点的 siblings depth=1，叔伯节点 depth=0
- 向上追溯 `ancestorLevels` 层（默认 2）
- 焦点 Rem 前标记 `* ` 前缀
- 输出头部含 path 和 focus 信息

**page 模式**：
- 获取当前面板打开的页面 Rem
- 以该页面为根展开子树
- 参数：`depth`（默认 3）、`maxNodes`、`maxSiblings`
- 输出头部含 page 名和 breadcrumb path

两者共同点：不缓存、Portal 感知、Powerup 噪音过滤、返回 breadcrumb。

### 4.3 修改决策指南

```
用户想修改什么？
├─ Rem 的属性（文本、类型、格式、标签等）
│   → edit-rem（操作对象：RemObject 的 JSON 文本）
│   → 前置：必须先 read-rem
│
├─ 树的结构（新增、删除、移动、重排）
│   → edit-tree（操作对象：Markdown 大纲文本）
│   → 前置：必须先 read-tree
│
└─ 修改某行的文字内容
    → edit-rem（不是 edit-tree！edit-tree 禁止修改行内容）
```

#### edit-rem vs edit-tree 详细选择

| 操作 | 命令 | 原因 |
|:-----|:-----|:-----|
| 修改文本内容（text / backText） | `edit-rem` | 需要 JSON 级精度操作 RichText |
| 修改属性（type, fontSize, highlightColor...） | `edit-rem` | 属性级修改 |
| 修改标签（tags） | `edit-rem` | Diff 机制增删 |
| 新增子节点 | `edit-tree` | 结构操作 |
| 删除节点（含所有子节点） | `edit-tree` | 结构操作 |
| 移动节点到新父节点下 | `edit-tree` | 结构操作 |
| 调换同级节点顺序 | `edit-tree` | 结构操作 |

### 4.4 标准工作流

```
1. connect              ← 启动会话
2. health               ← 确认系统就绪
3. read-globe           ← 了解知识库结构（首次探索）
   或 read-context      ← 了解用户当前上下文
4. search "关键词"       ← 定位目标 Rem（中文搜索可能需单字策略，详见 search.md）
5. read-tree <id>       ← 展开目标区域的子树
6. read-rem <id>        ← 读取详细属性（编辑前必需）
7. edit-rem <id> ...    ← 修改 Rem 属性
   或 edit-tree <id> ...← 修改树结构
8. disconnect           ← 结束会话
```

**注意**：步骤 6 是 `edit-rem` 的强制前置条件，步骤 5 是 `edit-tree` 的强制前置条件。跳过会触发防线 1 错误。

---

## 5. 双模式 I/O（`--json`）

所有命令支持两种调用模式：

### 人类模式（默认）

```bash
read-rem kLrIOHJLyMd8Y2lyA --fields text,type
read-tree kLrIOHJLyMd8Y2lyA --depth 2
edit-rem kLrIOHJLyMd8Y2lyA --old-str '"concept"' --new-str '"descriptor"'
```

- 位置参数 = remId 或关键词
- 选项通过 `--flag` 传递
- 输出为人类可读格式

### JSON 模式（`--json`）

```bash
read-rem --json '{"remId":"kLrIOHJLyMd8Y2lyA","fields":["text","type"]}'
read-tree --json '{"remId":"kLrIOHJLyMd8Y2lyA","depth":2}'
edit-rem --json '{"remId":"kLrIOHJLyMd8Y2lyA","oldStr":"\"concept\"","newStr":"\"descriptor\""}'
```

- **位置参数 = JSON 字符串**，所有参数打包在 JSON 对象中
- 输出为**单行合法 JSON**

**禁止混用**：`read-rem kLrIOHJLyMd8Y2lyA --json` 会失败（裸 remId 被当作 JSON 解析）。

### JSON 输出结构

```jsonc
// 成功
{ "ok": true, "command": "read-rem", "timestamp": "...", ... }

// 失败
{ "ok": false, "command": "read-rem", "error": "Rem not found", ... }
```

所有 JSON 输出都包含 `ok`（boolean）和 `command`（string）字段。

---

## 6. 通信协议与 action 映射

### 消息格式

CLI → daemon 请求：
```json
{ "id": "uuid-v4", "action": "read_rem", "payload": { "remId": "kLr..." } }
```

daemon → CLI 响应：
```json
{ "id": "uuid-v4（与请求匹配）", "result": { ... } }
```

### action 映射表

| action | CLI 命令 | Plugin service | 说明 |
|:-------|:---------|:---------------|:-----|
| `read_rem` | read-rem | readRem() | 直接转发 |
| `edit_rem` | edit-rem | — | daemon handler 编排 |
| `read_tree` | read-tree | readTree() | 直接转发 |
| `edit_tree` | edit-tree | — | daemon handler 编排 |
| `read_globe` | read-globe | readGlobe() | 直接转发 |
| `read_context` | read-context | readContext() | 直接转发 |
| `search` | search | search() | 直接转发 |
| `write_rem_fields` | —（内部） | writeRemFields() | edit-rem/edit-tree 的原子写入 |
| `create_rem` | —（内部） | createRem() | edit-tree 的原子创建 |
| `delete_rem` | —（内部） | deleteRem() | edit-tree 的原子删除 |
| `move_rem` | —（内部） | moveRem() | edit-tree 的原子移动 |
| `reorder_children` | —（内部） | reorderChildren() | edit-tree 的原子重排 |

`edit_rem` 和 `edit_tree` 在 daemon handler 中编排完成后，调用 `write_rem_fields`、`create_rem` 等原子操作。

---

## 7. RemObject 数据模型

RemObject 是本项目对 RemNote Rem 的标准化表示，包含 51 个字段。详细字段表见 `read-rem.md`。

### 7.1 字段分类

| 标记 | 含义 | 数量 | 输出条件 |
|:-----|:-----|:-----|:---------|
| RW | 可读可写 | 20 | 默认输出 |
| R | 只读 | 14 | 默认输出 |
| R-F | 只读低频 | 17 | 仅 `--full` 输出 |

### 7.2 核心字段速览

```
标识：  id
内容：  text [RW], backText [RW]
类型：  type [RW], isDocument [RW]
结构：  parent [RW], children [R]
格式：  fontSize [RW], highlightColor [RW]
状态：  isTodo [RW], todoStatus [RW], isCode [RW], isQuote [RW],
        isListItem [RW], isCardItem [RW], isSlot [RW], isProperty [RW]
练习：  enablePractice [RW], practiceDirection [RW]
关联：  tags [RW], sources [RW], aliases [R], remsReferencingThis [R]
位置：  positionAmongstSiblings [RW]
时间：  createdAt [R], updatedAt [R]
Portal：portalType [R], portalDirectlyIncludedRem [R]
```

### 7.3 RichText 格式

`text` 和 `backText` 字段使用 RichText 格式——一个 JSON 数组，元素为纯字符串或格式化对象：

```json
[
  "普通文本",
  { "i": "m", "text": "粗体文本", "b": true },
  { "i": "q", "_id": "remId123" },
  { "i": "i", "url": "https://...", "width": 200, "height": 100 }
]
```

| `i` 值 | 类型 | 核心字段 |
|:-------|:-----|:---------|
| （纯 string） | 纯文本 | — |
| `"m"` | 带格式文本 | `text` + `b`/`l`/`u`/`h`/`code`/`cId`/`iUrl` |
| `"q"` | Rem 引用 | `_id`（被引用 Rem ID） |
| `"i"` | 图片 | `url`, `width`, `height` |
| `"x"` | LaTeX | `text` |
| `"a"` | 音频 | `url` |

**序列化确定性**：RichText 对象内部按 key 字母序排列（`sortRichTextKeys()`），确保同一内容的 JSON 始终一致。这对 edit-rem 的 str_replace 和并发检测至关重要。

---

## 8. Markdown 大纲格式

read-tree / read-globe / read-context 的输出核心是 Markdown 大纲文本。edit-tree 基于此大纲进行结构编辑。

### 8.1 行结构

每行的格式为：

```
{缩进}{Markdown 前缀}{内容}{箭头分隔符}{backText} <!-- {remId} {元数据标记} -->
```

- **缩进**：每级 2 个空格（根节点 0 个空格）
- **remId**：该行对应的 Rem ID（新增行无 remId）
- **元数据标记**：空格分隔的属性标记

### 8.2 Markdown 前缀

| 前缀 | 含义 | 对应字段 |
|:-----|:-----|:---------|
| `# ` | H1 标题 | `fontSize: 'H1'` |
| `## ` | H2 标题 | `fontSize: 'H2'` |
| `### ` | H3 标题 | `fontSize: 'H3'` |
| `- [ ] ` | 未完成待办 | `isTodo: true, todoStatus: 'Unfinished'` |
| `- [x] ` | 已完成待办 | `isTodo: true, todoStatus: 'Finished'` |
| `` `...` `` | 代码块 | `isCode: true` |
| `---` | 分隔线 | Divider Powerup |

### 8.3 箭头分隔符

箭头编码 `practiceDirection`（闪卡练习方向），不编码 type（type 由元数据标记承载）。

| 箭头 | 格式 | practiceDirection |
|:-----|:-----|:------------------|
| ` → ` | `text → backText` | forward |
| ` ← ` | `text ← backText` | backward |
| ` ↔ ` | `text ↔ backText` | both |
| ` ↓` | `text ↓`（尾部，无 backText 多行） | forward |
| ` ↑` | `text ↑` | backward |
| ` ↕` | `text ↕` | both |

多行箭头（↓↑↕）带 backText 时格式为 `text ↓ backText`。

### 8.4 元数据标记

行尾 `<!-- -->` 注释中的标记：

| 标记 | 含义 |
|:-----|:-----|
| `type:concept` / `type:descriptor` / `type:portal` | Rem 类型（default 时不标记） |
| `doc` | isDocument = true |
| `top` | 知识库顶层 Rem |
| `children:N` | 折叠的子节点数量（深度超限时） |
| `role:card-item` | isCardItem = true（多行闪卡答案行） |
| `tag:Name(id)` | 已附加的标签 |
| `refs:id1,id2,...` | Portal 引用的 Rem ID |

### 8.5 省略占位符

当子节点数超过 maxSiblings 或全局预算耗尽时，插入省略行：

```
<!--...elided 3 siblings (parent:remIdB range:2-4 total:5)-->
<!--...elided >=10 nodes (parent:remIdB range:5-14 total:20)-->
```

- `siblings`（精确省略）：子节点超过 maxSiblings，保留前 70% + 后 30%
- `>=N nodes`（非精确省略）：全局 maxNodes 预算耗尽

### 8.6 预算控制参数

| 参数 | 默认值 | 说明 |
|:-----|:-------|:-----|
| `depth` | 3 | 递归展开深度（-1 = 无限） |
| `maxNodes` | 200 | 全局节点上限 |
| `maxSiblings` | 20 | 每个父节点下展示的 children 上限 |
| `ancestorLevels` | 0 | 向上追溯祖先层数（上限 10） |
| `includePowerup` | false | 是否包含 Powerup 系统数据 |

完整示例：

```markdown
# 数据结构 <!--kLr type:concept doc top-->
  ## 线性结构 <!--ABC type:concept-->
    数组 → Array <!--DEF-->
    链表 ↓ <!--GHI type:concept-->
      单向链表 <!--JKL role:card-item-->
      双向链表 <!--MNO role:card-item-->
    - [x] 复习完成 <!--PQR-->
    `quickSort()` <!--STU-->
  ## 树结构 <!--VWX type:concept children:8-->
  <!--...elided 3 siblings (parent:kLr range:3-5 total:6)-->
```

---

## 9. 缓存与安全机制

### 9.1 缓存存储

缓存存储在**守护进程内存中**（Map 结构），不持久化到磁盘。

| 前缀 | 用途 | 写入命令 |
|:-----|:-----|:---------|
| `rem:{remId}` | RemObject JSON | read-rem |
| `tree:{remId}` | Markdown 大纲 | read-tree |
| `tree-depth:{remId}` 等 | read-tree 参数 | read-tree |

- LRU 淘汰：上限 200 条目
- disconnect 关闭 daemon 时缓存自动消失
- **没有 TTL**——三道防线的并发检测已能捕获所有陈旧数据

### 9.2 三道防线

`edit-rem` 和 `edit-tree` 使用 str_replace 语义编辑数据。为防止数据损坏，实施三道防线：

#### 防线 1：缓存存在性检查

```
必须先 read → 建立缓存 → 再 edit
```

未缓存的 Rem 不允许编辑。确保 Agent 看到的数据和即将编辑的数据是同一份。

#### 防线 2：乐观并发检测

```
edit 时重新从 SDK 读取最新数据 → 与缓存严格比较
```

如果 Rem 在 read 之后被外部修改（用户在 RemNote UI 中编辑、其他 Agent 修改等），数据不一致时拒绝编辑，**且不更新缓存**——迫使 Agent 重新 read。

#### 防线 3：str_replace 精确匹配

```
oldStr 必须在目标文本中恰好匹配 1 次
```

- 0 次匹配：`old_str not found`
- \>1 次匹配：`matches N locations, make old_str more specific`
- 精确 1 次：执行替换

### 9.3 缓存更新行为

| 场景 | 缓存行为 |
|:-----|:---------|
| 写入全部成功 | 从 SDK 重新读取最新状态 → **更新缓存** |
| 防线拒绝 | **不更新缓存**（迫使 Agent 重新 read） |
| 部分写入失败 | **不更新缓存** |

---

## 10. edit-tree 结构编辑

edit-tree 使用 str_replace 对 Markdown 大纲进行结构编辑。详细文档见 `edit-tree.md`。

### 10.1 支持的操作

| 操作 | 实现方式 | 执行顺序 |
|:-----|:---------|:---------|
| **新增行** | 在 newStr 中添加无 remId 的新行 | 1（从浅到深） |
| **移动行** | 改变行的缩进层级或位置 | 2 |
| **重排行** | 调换同级行的顺序 | 3 |
| **删除行** | 从 newStr 中移除带 remId 的行 | 4（从深到浅） |

### 10.2 禁止的操作

| 操作 | 错误类型 | 替代方案 |
|:-----|:---------|:---------|
| 修改已有行内容 | `content_modified` | 使用 `edit-rem` |
| 删除根节点 | `root_modified` | — |
| 删除有隐藏子节点的行 | `folded_delete` | 用更大的 depth 重新 read-tree |
| 删除节点但保留子节点 | `orphan_detected` | 必须同时删除所有子行 |
| 删除/修改省略占位符 | `elided_modified` | 用更大参数重新 read-tree 展开 |

### 10.3 新增行格式

新增行可以使用 Markdown 前缀和箭头分隔符：

```markdown
  # 新标题 H1
  新闪卡 → 答案
  - [ ] 新待办
  `代码块内容`
```

支持的箭头分隔符：`→`（forward）、`←`（backward）、`↔`（both）、`↓`（多行 forward）、`↑`（多行 backward）、`↕`（多行 both）。

新增行可以嵌套（通过缩进表示父子关系），支持创建带子节点的结构。

---

## 11. Powerup 噪音过滤

RemNote 的格式设置通过 Powerup 机制实现，会向 Rem 注入隐藏的系统 Tag 和子 Rem。

**默认行为**（`includePowerup=false`）：自动过滤以下内容：
- **tags**：移除 `isPowerup === true` 的系统 Tag
- **children**：移除 `isPowerupProperty / isPowerupSlot / isPowerupPropertyListItem / isPowerupEnum` 的隐藏子 Rem

过滤统计通过 `powerupFiltered: { tags: N, children: N }` 返回。

`--includePowerup` 可恢复完整数据（调试或分析 Powerup 机制时使用）。

---

## 12. 配置系统

配置文件位于项目根目录：`.remnote-bridge.json`

```json
{
  "wsPort": 3002,
  "devServerPort": 8080,
  "configPort": 3003,
  "daemonTimeoutMinutes": 30,
  "defaults": {
    "maxNodes": 200,
    "maxSiblings": 20,
    "cacheMaxSize": 200,
    "readTreeDepth": 3,
    "readTreeAncestorLevels": 0,
    "readTreeIncludePowerup": false,
    "readGlobeDepth": -1,
    "readContextMode": "focus",
    "readContextAncestorLevels": 2,
    "readContextDepth": 3,
    "searchNumResults": 20
  }
}
```

- 文件不存在时使用全部默认值
- 三个端口不允许冲突

---

## 13. 错误处理速查

Agent 遇到错误时的诊断和恢复指南：

### 连接问题

| 错误 | 原因 | 恢复 |
|:-----|:-----|:-----|
| 守护进程未运行 | 未执行 connect 或 daemon 已超时 | 执行 `connect` |
| Plugin 未连接 | RemNote 未打开或插件未加载 | 打开 RemNote 并确认插件加载 |
| SDK 未就绪 | 知识库尚未加载完成 | 等待并重试 `health` |

### 防线错误

| 错误 | 原因 | 恢复 |
|:-----|:-----|:-----|
| has not been read yet | 未先执行 read-rem / read-tree | 执行对应 read 命令后重试 |
| has been modified since last read | Rem 在 read 和 edit 之间被外部修改 | 重新执行 read 获取最新状态后重试 |

### str_replace 错误

| 错误 | 原因 | 恢复 |
|:-----|:-----|:-----|
| old_str not found | oldStr 在目标文本中不存在 | 检查 oldStr 是否精确匹配（含引号、空格、换行） |
| old_str matches N locations | oldStr 匹配到多个位置 | 扩大 oldStr 范围，包含更多上下文以唯一定位 |
| invalid JSON | 替换后的文本不是合法 JSON | 检查 newStr 的引号、逗号、括号完整性 |

### edit-tree 专用错误

| 错误 | 原因 | 恢复 |
|:-----|:-----|:-----|
| Content modification not allowed | edit-tree 中修改了已有行内容 | 使用 `edit-rem` 修改内容 |
| orphan_detected | 删除了父节点但保留了子节点 | 同时删除所有子行 |
| folded_delete | 删除了有隐藏子节点的行 | 用更大 depth 重新 read-tree |

### 数据问题

| 错误 | 原因 | 恢复 |
|:-----|:-----|:-----|
| Rem not found | remId 无效或 Rem 已被删除 | 使用 `search` 重新定位 |
| Failed to update field 'type': Portal... | 尝试将 type 设为 portal | Portal 只能通过 SDK 专用 API 创建 |
| Field '...' is read-only | 修改了只读字段 | 该字段不可通过 edit-rem 修改（警告，非阻断） |
