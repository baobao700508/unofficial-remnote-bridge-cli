# RemNote 术语字典

> RemNote 的完整术语定义与辨析，供 AI Agent 理解和操作 RemNote 知识库。
> 最后更新：2026-03-06
>
> **使用方法：**
> - 快速查找：使用下方字母索引表定位术语
> - 按主题浏览：进入对应分类文件
> - Agent 按需加载：只加载相关分类文件，节省 token
>
> **验证状态说明：**
> - ✅ 实测验证 — 通过 SDK 调用 + CLI 数据对比确认
> - 📖 SDK 文档 — 来自官方文档描述，未做独立实测
> - ⚠️ 易混淆 — 特别标注容易踩坑的命名陷阱

---

## 分类导航

| # | 分类 | 内容概述 | 文件 |
|:--|:-----|:---------|:-----|
| 01 | **核心数据模型** | Rem、Document、Folder、KB、RemType、RichText、Card | [01-core-data-model.md](01-core-data-model.md) |
| 02 | **层级与导航** | Parent/Child、Zoom、Breadcrumb、Pane、Omnibar、Daily Doc | [02-hierarchy-and-navigation.md](02-hierarchy-and-navigation.md) |
| 03 | **链接与引用** | Reference、Tag、Powerup、Portal、Backlink、Alias | [03-linking-and-references.md](03-linking-and-references.md) |
| 04 | **闪卡系统** | 分隔符、CDF、practiceDirection、SRS 概念 | [04-flashcard-system.md](04-flashcard-system.md) |
| 05 | **格式与富文本** | RichText 元素、行内格式、Powerup 渲染、Slot vs Property | [05-formatting-and-richtext.md](05-formatting-and-richtext.md) |
| 06 | **表格与属性** | Property、PropertyType、Table、Template | [06-tables-and-properties.md](06-tables-and-properties.md) |
| 07 | **搜索与查询** | Global Search、Search Portal、Query Language | [07-search-and-query.md](07-search-and-query.md) |

---

## 快速查找表（按字母排序）

| 术语 | 一句话定义 | 所在文件 |
|:-----|:----------|:---------|
| Advanced Table | 基于 Tag + Property 驱动的结构化表格 | [06](06-tables-and-properties.md) |
| Alias | Rem 的替代名称，搜索和引用时都能匹配 | [03](03-linking-and-references.md) |
| Ancestor | 从当前 Rem 到根 Rem 路径上的所有节点 | [02](02-hierarchy-and-navigation.md) |
| Anki SM-2 | SuperMemo 2 经典间隔重复算法 | [04](04-flashcard-system.md) |
| backText | Rem 的背面内容（RichText 或 null） | [04](04-flashcard-system.md) |
| Backlink | 反向链接——所有引用了当前 Rem 的 Rem 列表 | [03](03-linking-and-references.md) |
| Breadcrumb | 面包屑导航，从根到当前 Rem 的路径 | [02](02-hierarchy-and-navigation.md) |
| Card | RemNote 根据 Rem 自动生成的闪卡（本项目不操控） | [01](01-core-data-model.md) |
| Child / Children | 父 Rem 下的直接子级 Rem 有序列表 | [02](02-hierarchy-and-navigation.md) |
| Cloze | `{{}}` 完形填空，RichText 中嵌入 cId 元素 | [04](04-flashcard-system.md) |
| Code Block | 整个 Rem 渲染为代码块（Powerup `cd`） | [05](05-formatting-and-richtext.md) |
| Concept | `type=concept`，`::` 创建的双向闪卡概念 | [01](01-core-data-model.md) |
| CDF | Concept-Descriptor Framework，知识结构化方法 | [04](04-flashcard-system.md) |
| Daily Document | 以日期命名的自动创建文档 | [02](02-hierarchy-and-navigation.md) |
| Default | `type=default`，无闪卡类型标记的普通 Rem | [01](01-core-data-model.md) |
| Descendant | 当前 Rem 下所有层级的子孙节点 | [02](02-hierarchy-and-navigation.md) |
| Descriptor | `type=descriptor`，`;;` 创建的单向闪卡描述 | [01](01-core-data-model.md) |
| Difficulty | FSRS 参数：卡片的固有学习难度 | [04](04-flashcard-system.md) |
| Divider | 水平分割线（Powerup `dv`） | [05](05-formatting-and-richtext.md) |
| Document | `isDocument=true` 的 Rem，可作为独立页面打开 | [01](01-core-data-model.md) |
| Due for Review | 闪卡达到计划复习时间 | [04](04-flashcard-system.md) |
| Extra Card Detail | 为闪卡添加额外提示的 Power-up | [04](04-flashcard-system.md) |
| Folder | 只含 Document 子节点的 Document | [01](01-core-data-model.md) |
| FSRS | Free Spaced Repetition Scheduler 间隔重复算法 | [04](04-flashcard-system.md) |
| Global Search | 知识库全文搜索 | [07](07-search-and-query.md) |
| Heading | Rem 级别标题（Powerup `r`，H1/H2/H3） | [05](05-formatting-and-richtext.md) |
| Hierarchy | 树形层级结构，RemNote 的核心组织方式 | [02](02-hierarchy-and-navigation.md) |
| Hierarchical Search | 限定范围搜索 | [07](07-search-and-query.md) |
| Highlight | Rem 级别背景色高亮（Powerup `h`） | [05](05-formatting-and-richtext.md) |
| Image Occlusion | 图片遮挡闪卡 | [04](04-flashcard-system.md) |
| Interval | 间隔——两次复习之间的天数 | [04](04-flashcard-system.md) |
| isCardItem | 多行闪卡的答案行标记（Powerup `w`） | [04](04-flashcard-system.md) |
| Knowledge Base | 用户的笔记空间（Synced/Local） | [01](01-core-data-model.md) |
| Leech | 反复遗忘的顽固闪卡 | [04](04-flashcard-system.md) |
| Link | 指向外部 URL 的超链接 | [03](03-linking-and-references.md) |
| Omnibar | Ctrl+P 全能搜索栏 | [02](02-hierarchy-and-navigation.md) |
| Pane | 分屏窗格 | [02](02-hierarchy-and-navigation.md) |
| Parent | Rem 的直接上级节点 | [02](02-hierarchy-and-navigation.md) |
| Pin | 固定引用到侧边栏 | [03](03-linking-and-references.md) |
| Portal | `((` 创建的实时嵌入引用，编辑同步 | [03](03-linking-and-references.md) |
| Position | 兄弟节点中的位置（有两种含义） | [02](02-hierarchy-and-navigation.md) |
| Powerup | `isPowerup=true` 的特殊系统 Tag，影响渲染 | [03](03-linking-and-references.md) |
| Practice Queue | 当前需要复习的闪卡列表 | [04](04-flashcard-system.md) |
| practiceDirection | 练习方向：forward/backward/both | [04](04-flashcard-system.md) |
| Property | Tag 下 `isProperty=true` 的子 Rem，定义数据字段 | [06](06-tables-and-properties.md) |
| PropertyType | Property 的数据类型（text/number/checkbox 等） | [06](06-tables-and-properties.md) |
| Query Builder | Search Portal 的图形化查询构建器 | [07](07-search-and-query.md) |
| Query Language | Search Portal 的查询条件语法 | [07](07-search-and-query.md) |
| Quote Block | 整个 Rem 渲染为引用块（Powerup `qt`） | [05](05-formatting-and-richtext.md) |
| Rem | RemNote 的基本数据单元，一切皆 Rem | [01](01-core-data-model.md) |
| Rem Reference | `[[` 创建的 Rem 间引用，RichText `i:"q"` 元素 | [03](03-linking-and-references.md) |
| RemType | Rem 的 type 字段：concept/descriptor/default/portal | [01](01-core-data-model.md) |
| removePowerup vs removeTag | removePowerup 是 removeTag 的超集，额外清理 Slot | [05](05-formatting-and-richtext.md) |
| Retrievability | FSRS 参数：当前能回忆起的概率 | [04](04-flashcard-system.md) |
| RichText | JSON 数组格式的富文本（非纯字符串） | [01](01-core-data-model.md) |
| Search Portal | 基于查询条件动态显示匹配 Rem 的 Portal | [07](07-search-and-query.md) |
| Sibling | 共享同一 Parent 的 Rem | [02](02-hierarchy-and-navigation.md) |
| Simple Table | 独立网格表格 | [06](06-tables-and-properties.md) |
| Slot vs Property | 同一概念的两个名字，底层完全相同 | [05](05-formatting-and-richtext.md) |
| Spaced Repetition | 间隔重复学习方法 | [04](04-flashcard-system.md) |
| Stability | FSRS 参数：记忆保持的时间长度 | [04](04-flashcard-system.md) |
| Stub | 被引用但无内容的 Rem | [02](02-hierarchy-and-navigation.md) |
| Tab | 浏览器式标签页 | [02](02-hierarchy-and-navigation.md) |
| Tag | `##` 创建的标签，Tag 本身也是 Rem | [03](03-linking-and-references.md) |
| Template | 文档级内容模板（Powerup） | [06](06-tables-and-properties.md) |
| text | Rem 的正面内容（RichText 数组） | [04](04-flashcard-system.md) |
| Todo | 带复选框的待办 Rem（Powerup `t`） | [05](05-formatting-and-richtext.md) |
| Top-level Rem | `parent=null` 的顶级 Rem | [01](01-core-data-model.md) |
| Universal Descriptor | `~` 前缀的可跨 Concept 复用的描述符 | [04](04-flashcard-system.md) |
| Zen Mode | 隐藏 UI 元素的专注模式 | [02](02-hierarchy-and-navigation.md) |
| Zoom | 聚焦到 Rem 作为独立页面查看 | [02](02-hierarchy-and-navigation.md) |
| /-menu | 斜杠命令菜单 | [02](02-hierarchy-and-navigation.md) |

---

## 附录：命名风格速查

RemNote SDK 中混用了多种命名风格，以下是规律总结：

| 风格 | 示例 | 出现位置 |
|:-----|:-----|:---------|
| camelCase | `setHighlightColor`, `getTagPropertyValue` | SDK 方法名 |
| UPPER_SNAKE | `CONCEPT`, `DESCRIPTOR`, `PORTAL` | SDK 枚举值（RemType, SetRemType） |
| 小写下划线 | `single_select`, `multi_select`, `created_at` | PropertyType 枚举值 |
| 单字母 code | `r`, `h`, `cd`, `qt`, `t`, `w`, `o`, `y` | 内置 Powerup Code |
| 混合 | `BuiltInPowerupCodes.MultiLineCard` → code=`w` | Powerup 枚举名 vs 实际 code |
