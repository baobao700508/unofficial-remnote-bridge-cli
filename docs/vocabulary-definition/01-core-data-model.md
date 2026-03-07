# Core Data Model — 核心数据模型

> RemNote 的核心数据模型术语。理解这些概念是使用 CLI 和 SDK 的前提。

---

## Rem（知识单元）

| 维度 | 内容 |
|:-----|:-----|
| **用户侧** | RemNote 中一切内容的基本单元——笔记、文档、文件夹、闪卡本质上都是 Rem |
| **SDK 侧** | `Rem` 类，核心字段：`_id`（唯一标识）、`text`（正面 RichText）、`backText`（背面 RichText）、`type`（concept/descriptor/default/portal）、`parent`（父 Rem ID）、`children`（子 Rem ID 数组）、`tags`（Tag ID 数组） |
| **CLI 操作** | `read-rem <remId>` 读取单个 Rem；`read-tree <remId>` 读取 Rem 及其子树 |
| **注意** | "Everything is a Rem" 是 RemNote 的设计理念。Document、Folder、Property 都是 Rem 的特殊形态，不是独立的数据类型 |

---

## Document（文档） vs Rem

**结论：Document 是 Rem 的一个布尔属性，不是独立的数据类型。**

| 表述 | 含义 |
|:-----|:-----|
| `isDocument: true` | 该 Rem 可作为独立页面打开（UI 上 bullet 变为文档图标） |
| `isDocument: false` | 该 Rem 是普通的行内条目 |

### 底层机制 ✅

`setIsDocument(true)` 通过 Powerup 机制实现：注入"文档" Tag + 自动创建 `[Status] ;; [Draft]` descriptor 子 Rem。

`isDocument` 和 `type` 是**两个独立维度**——一个 `concept` 类型的 Rem 可以同时是 Document。

| 维度 | 内容 |
|:-----|:-----|
| **SDK 侧** | `rem.isDocument()`、`rem.setIsDocument(bool)`；Powerup Code: `BuiltInPowerupCodes.Document` (`o`) |
| **CLI 操作** | `read-rem` 返回的 `isDocument` 字段；`read-tree` 显示文档图标 |

---

## Folder（文件夹）

| 维度 | 内容 |
|:-----|:-----|
| **用户侧** | 侧边栏中只包含 Document 子节点的文档，显示为文件夹图标 |
| **SDK 侧** | 没有独立的 `isFolder` 标记。Folder 就是一个 `isDocument=true` 且所有子节点也是 Document 的 Rem |
| **CLI 操作** | `read-tree` 可见层级结构 |
| **注意** | Folder 是 UI 层面的概念，SDK 层面没有特殊字段 |

---

## Top-level Rem（顶级 Rem）

| 维度 | 内容 |
|:-----|:-----|
| **用户侧** | 侧边栏中直接可见的文档/文件夹，没有父文档 |
| **SDK 侧** | `parent` 字段为 `null`，或通过 `rem.isTopLevel()` 判断 |
| **CLI 操作** | `read-tree` 输出中标记 `isTopLevel` |

---

## Knowledge Base（知识库）

| 维度 | 内容 |
|:-----|:-----|
| **用户侧** | 用户的笔记空间，分为 Synced KB（云同步）和 Local KB（本地）。每个用户可拥有多个知识库 |
| **SDK 侧** | `plugin.kb` 命名空间；`plugin.kb.id` 获取当前知识库 ID |
| **CLI 操作** | `connect` 时连接到特定知识库 |
| **注意** | 不同知识库之间的 Rem ID 互不相通。Powerup Tag ID 也是知识库级别的 |

> 深入参考：-> [Help Center: Multiple Knowledge Bases](../RemNote%20Help%20Center/multiple-knowledge-bases.md)

---

## RemType（Rem 类型） — Concept vs Descriptor vs Default

**结论：这三个是 Rem 的 `type` 字段值，由用户输入的分隔符决定。**

| type 值 | 触发分隔符 | 含义 | UI 表现 | 可通过 setType() 设置 |
|:--------|:----------|:-----|:--------|:---------------------|
| `concept` | `::` 或 `::>` | 概念定义（双向闪卡） | 文字**加粗** | ✅ |
| `descriptor` | `;;` 或 `;;>` | 描述/属性（单向闪卡） | 文字*斜体* | ✅ |
| `default` | 无分隔符、`>>`、`<<`、`<>`、`>>>`、`{{}}` | 普通 Rem | 正常字重 | ✅ |
| `portal` | 无法通过分隔符创建 | 嵌入引用容器 | 紫色左边框 | ❌ 只读 |

### 易混淆点

- `concept` 和 `descriptor` 是**闪卡语义**，不是"概念 vs 描述"的通用含义
- `default` 不是"默认类型"——它是一个明确的类型值，表示"无闪卡类型标记"
- `type` 和 `isDocument` 是两个**独立维度**：一个 `concept` Rem 可以同时是 Document

### SDK 的两套 RemType 枚举

| 枚举 | 用途 | 包含 PORTAL |
|:-----|:-----|:-----------|
| `RemType` / `REM_TYPE` | **读取**（`getType()` 返回值） | ✅ 有 `PORTAL = 6` |
| `SetRemType` | **写入**（`setType()` 参数） | ❌ 没有 PORTAL |

Portal 只能通过 `rem.createPortal()` 专用 API 创建，不能通过 `setType()` 将已有 Rem 改为 Portal。

| 维度 | 内容 |
|:-----|:-----|
| **SDK 侧** | 读取：`rem.type` / `rem.getType()` 返回 `RemType` 枚举；写入：`rem.setType()` 接受 `SetRemType` 枚举（不含 PORTAL） |
| **CLI 操作** | `read-rem` 返回 `type` 字段；`edit-rem` 可设置 concept/descriptor/default，设置 portal 会报错 |

> 深入参考：-> [Rem 类型与分隔符映射完整参考](../rem-type-mapping/README.md)

---

## RichText（富文本） vs Text

**结论：RichText 是 JSON 数组格式，不是纯文本字符串。**

| 术语 | 实际类型 | 含义 |
|:-----|:---------|:-----|
| **RichText** | `Array<string \| object>` | SDK 中所有文本内容的底层格式，元素可以是纯字符串或格式化对象 |
| **text** | `RichText` | Rem 的正面内容（`rem.text`），类型是 RichText 数组 |
| **backText** | `RichText \| null` | Rem 的背面内容，`null` 表示无背面 |
| **plainText** | — | SDK 中不存在此概念；需要纯文本时，自行遍历 RichText 拼接字符串部分 |

### RichText 元素类型概览

| `i` 字段值 | 含义 | 示例 |
|:----------|:-----|:-----|
| （无，纯 string） | 纯文本片段 | `"hello"` |
| `"m"` | 带格式文本 | bold/italic/underline/code/highlight/cloze |
| `"q"` | Rem 引用 | `{ _id: "xxx", i: "q" }` |
| `"i"` | 图片 | `{ url, width, height, i: "i" }` |
| `"g"` | 全局名称 | — |

| 维度 | 内容 |
|:-----|:-----|
| **SDK 侧** | `RichTextInterface` 类型；`plugin.richText` 命名空间提供辅助方法 |
| **CLI 操作** | `read-rem` 和 `read-tree` 返回 Markdown 渲染的文本；`--full` 模式可见原始 RichText JSON |

> 深入参考：-> [RichText 底层 JSON 格式完整参考](../richtext-format/README.md)

---

## Card（闪卡） vs Rem

**结论：Card 是 RemNote 根据 Rem 自动生成的，不需要也不应该直接操控。**

| 术语 | 含义 |
|:-----|:-----|
| **Rem** | 知识库中的基本数据单元，可读可写 |
| **Card** | RemNote 根据 Rem 的 type、backText、practiceDirection 等属性**自动生成**的闪卡 |

### 红线

- 本项目**不操控** Card / Flashcard
- Card 由 RemNote 内部规则自动生成，SDK 中 Card 相关 API（`getCards()`、`CardNamespace`）不在使用范围内
- 要改变闪卡行为，修改 Rem 的属性即可（如 `type`、`backText`、`practiceDirection`、`enablePractice`）
