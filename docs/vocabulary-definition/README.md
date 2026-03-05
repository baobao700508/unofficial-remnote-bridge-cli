# RemNote 术语定义与辨析

> RemNote SDK 中存在大量历史遗留命名、同义词和语义重叠，容易造成混淆。
> 本文档记录经实测验证的术语真实含义，避免被表面命名误导。
> 最后更新：2026-03-05
>
> **验证状态说明：**
> - ✅ 实测验证 — 通过 SDK 调用 + read-rem/read-tree 数据对比确认
> - 📖 SDK 文档 — 来自官方文档描述，未做独立实测
> - ⚠️ 易混淆 — 特别标注容易踩坑的命名陷阱

---

## 1. Slot vs Property ⚠️

**结论：同一概念的两个名字，底层完全相同。**

### 定义

| 术语 | 使用语境 | 含义 |
|:-----|:---------|:-----|
| **Slot** | Powerup 开发语境 | Powerup 的数据插槽，存储键值对（值为 RichText） |
| **Property** | 表格/Tag 语境 | Tag 的结构化属性列（表格的列定义） |

### 为什么是同一概念 ✅

- `setIsSlot(true)` 和 `setIsProperty(true)` 注入**同一个** Powerup Tag（`vD8KGEg5dkj9bzkRn`，名为"模板插槽"）
- 调用任一方法后，`isSlot()` 和 `isProperty()` **同时**返回 `true`
- UI 表现完全一致：bullet 变为方形图标

### 底层机制：Tag + Property 继承 ✅

Slot/Property 的运作基于 RemNote 的一个核心特性——**Tag 可以携带 Property，Property 会被复制到被标记的 Rem 下**：

1. **任何 Rem 都可以作为 Tag** 去标记（Tag）别的 Rem
2. **作为 Tag 的 Rem 可以定义 Property**——即标记为 `isProperty=true` 的子 Rem，每个 Property 是一个独立的数据字段
3. **当 Tag 被应用到目标 Rem 时**，Tag 所携带的 Property 会以**复制粘贴**（而非 Portal 引用）的方式，直接成为目标 Rem 的子 Rem

关键点：**Property 是复制过去的，不是引用。** 每个被标记的 Rem 都拥有自己独立的 Property 子 Rem 副本。

这个机制解释了 Powerup 渲染的全部行为：
- `setHighlightColor('Red')` → 给 Rem 打上"高亮" Tag → Tag 的 `[Color]` Property 被复制到 Rem 下，值填为 `[Red]`
- `setFontSize('H1')` → 给 Rem 打上"标题" Tag → Tag 的 `[Size]` Property 被复制到 Rem 下，值填为 `[H1]`
- `setIsCode(true)` → 给 Rem 打上"代码" Tag → 该 Tag 无 Property，所以不生成子 Rem

**Powerup 渲染机制本质上就是 RemNote 的 Tag + Property 继承的一个应用**，前端渲染引擎读取这些 Tag 和 Property 来决定 UI 样式。详见 [Powerup 渲染机制研究](../powerup-rendering/README.md)。

> **注意区分**：Property 是 Rem 级别的数据字段（`isProperty=true` 的子 Rem），而 Template（模板）是文档级别的内容模板（`BuiltInPowerupCodes.Template`），两者是不同的概念。Powerup 渲染只用到 Tag + Property，不涉及 Template。

### 历史演变 📖

1. **早期 SDK**：`registerPowerup()` 用 `slots` 数组定义数据插槽，读写用 `setPowerupProperty(code, slot, value)`
2. **表格功能上线**：RemNote 将 Tag 的子 Rem 作为表格列，称为 Property，读写用 `setTagPropertyValue(propertyId, value)`
3. **当前状态**：两套 API 共存，底层是同一个 Powerup Tag，SDK 未统一命名

### 相关 API 对照

| Slot 系列 API | Property 系列 API | 作用 |
|:-------------|:-----------------|:-----|
| `isSlot()` | `isProperty()` | 判断（结果相同） |
| `setIsSlot(bool)` | `setIsProperty(bool)` | 设置（效果相同） |
| `isPowerupSlot()` | `isPowerupProperty()` | Powerup 细分判断 |
| `getPowerupSlotByCode()` | — | 按 code 获取 Slot Rem |
| `setPowerupProperty(code, slot, value)` | `setTagPropertyValue(propId, value)` | 写入值（入参不同，底层相同） |
| `getPowerupProperty(code, slot)` | `getTagPropertyValue(propId)` | 读取值（入参不同，底层相同） |

### 两套读写 API 的区别

| 维度 | Powerup API | Tag Property API |
|:-----|:-----------|:----------------|
| 定位方式 | `powerupCode` + `slotCode`（字符串 code） | `propertyId`（Rem ID） |
| 值类型 | RichText | RichText |
| 适用场景 | 插件开发者自定义 Powerup | 用户创建的表格/Tag 属性 |

---

## 2. Powerup vs Tag ⚠️

**结论：Powerup 是一种特殊的 Tag，但不是所有 Tag 都是 Powerup。**

### 定义

| 术语 | 含义 |
|:-----|:-----|
| **Tag** | 可以标记到 Rem 上的任意 Rem（通过 `addTag(remId)` 或 UI 中 `##` 输入） |
| **Powerup** | 带有特殊行为的系统 Tag（`isPowerup()=true`），影响 Rem 的渲染和功能 |

### 关系 ✅

- 每个 Powerup 都是一个 `isPowerup=true` 的 Rem，存在于知识库中
- 用户创建的普通 Tag（如"重要"、"待复习"）的 `isPowerup=false`
- `tags` 数组会混合返回两者，无法从数据结构区分，需逐个检查 `isPowerup`
- SDK 的 `setIsCode(true)` 等方法本质是 `addTag(对应PowerupTag的ID)`

### 内置 Powerup 列表（本知识库实测） ✅

| 显示名称 | Powerup Code | 对应 SDK 快捷方法 |
|:---------|:-------------|:-----------------|
| 标题 | Header (`r`) | `setFontSize()` |
| 高亮 | Highlight (`h`) | `setHighlightColor()` |
| 代码 | Code (`cd`) | `setIsCode()` |
| 引用 | Quote (`qt`) | `setIsQuote()` |
| 列表项 | List (`i`) | `setIsListItem()` |
| 待办 | Todo (`t`) | `setIsTodo()` |
| 卡片条目 | MultiLineCard (`w`) | `setIsCardItem()` |
| 文档 | Document (`o`) | `setIsDocument()` |
| 模板插槽 | Slot (`y`) | `setIsSlot()` / `setIsProperty()` |
| 稍后编辑 | EditLater (`e`) | — |
| 分割线 | Divider (`dv`) | — |

> 注意：Powerup Tag ID 是知识库级别的，不同用户的知识库中同一 Powerup 的 ID 不同。

---

## 3. Concept vs Descriptor vs Default ⚠️

**结论：这三个是 Rem 的 `type` 字段值，由用户输入的分隔符决定。**

| type 值 | 触发分隔符 | 含义 | UI 表现 |
|:--------|:----------|:-----|:--------|
| `concept` | `::` 或 `::>` | 概念定义（双向闪卡） | 文字**加粗** |
| `descriptor` | `;;` 或 `;;>` | 描述/属性（单向闪卡） | 文字*斜体* |
| `default` | 无分隔符、`>>`、`<<`、`<>`、`>>>`、`{{}}` | 普通 Rem | 正常字重 |
| `portal` | 无法通过分隔符创建 | 嵌入引用容器 | 紫色左边框 |

### 易混淆点 ⚠️

- `concept` 和 `descriptor` 是**闪卡语义**，不是"概念 vs 描述"的通用含义
- `default` 不是"默认类型"——它是一个明确的类型值，表示"无闪卡类型标记"
- `type` 和 `isDocument` 是两个**独立维度**：一个 `concept` Rem 可以同时是 Document
- SDK 的 `SetRemType` 枚举不包含 `PORTAL`，Portal 只能通过 `createPortal()` 创建

详见 [Rem 类型与分隔符映射](../rem-type-mapping/README.md)。

---

## 4. RichText vs Text ⚠️

**结论：RichText 是 JSON 数组格式，不是纯文本字符串。**

| 术语 | 实际类型 | 含义 |
|:-----|:---------|:-----|
| **RichText** | `Array<string \| object>` | SDK 中所有文本内容的底层格式，元素可以是纯字符串或格式化对象 |
| **text** | `RichText` | Rem 的正面内容（`rem.text`），类型是 RichText 数组 |
| **backText** | `RichText \| null` | Rem 的背面内容，`null` 表示无背面 |
| **plainText** | — | SDK 中不存在此概念；需要纯文本时，自行遍历 RichText 拼接字符串部分 |

### RichText 元素类型 📖

| `i` 字段值 | 含义 | 示例 |
|:----------|:-----|:-----|
| （无，纯 string） | 纯文本片段 | `"hello"` |
| `"m"` | 带格式文本 | bold/italic/underline/code/highlight/cloze |
| `"q"` | Rem 引用 | `{ _id: "xxx", i: "q" }` |
| `"i"` | 图片 | `{ url, width, height, i: "i" }` |
| `"g"` | 全局名称 | — |

详见 [RichText 底层 JSON 格式参考](../richtext-format/README.md)。

---

## 5. Card vs Rem ⚠️

**结论：Card 是 RemNote 根据 Rem 自动生成的，不需要也不应该直接操控。**

| 术语 | 含义 |
|:-----|:-----|
| **Rem** | 知识库中的基本数据单元，可读可写 |
| **Card** | RemNote 根据 Rem 的 type、backText、practiceDirection 等属性**自动生成**的闪卡 |

### 红线

- 本项目**不操控** Card / Flashcard
- Card 由 RemNote 内部规则自动生成，SDK 中 Card 相关 API（`getCards()`、`CardNamespace`）不在使用范围内
- 要改变闪卡行为，修改 Rem 的属性即可（如 `type`、`backText`、`practiceDirection`、`enablePractice`）

---

## 6. removePowerup vs removeTag ⚠️

**结论：`removePowerup` 是 `removeTag` 的超集，会额外清理所有 Slot 子 Rem。**

| 方法 | 移除 Tag 引用 | 移除参数子 Rem（Slots） | 适用场景 |
|:-----|:-------------|:----------------------|:---------|
| `removeTag(tagId)` | ✅ | 默认不移除（`removeProperties=false`） | 移除普通 Tag |
| `removeTag(tagId, true)` | ✅ | ✅ | 移除 Tag 并清理属性 |
| `removePowerup(code)` | ✅ | ✅（always） | 移除 Powerup 效果 |

SDK CHANGELOG 原文：*"Added `Rem.removePowerup(powerupCode)`. It will always remove all powerup slots."*

### 实测案例：清除高亮 ✅

`setHighlightColor(null)` 被 SDK 拒绝（Invalid input），但 `removePowerup('h')` 成功清除：
- Tag 引用从 `tags` 数组移除
- `[Color] ;; [Blue]` descriptor 子 Rem 被删除
- `getHighlightColor()` 恢复返回 `null`

---

## 7. Document vs Rem ⚠️

**结论：Document 是 Rem 的一个布尔属性，不是独立的数据类型。**

| 表述 | 含义 |
|:-----|:-----|
| `isDocument: true` | 该 Rem 可作为独立页面打开（UI 上 bullet 变为文档图标） |
| `isDocument: false` | 该 Rem 是普通的行内条目 |

### 底层机制 ✅

`setIsDocument(true)` 通过 Powerup 机制实现：注入"文档" Tag + 自动创建 `[Status] ;; [Draft]` descriptor 子 Rem。

`isDocument` 和 `type` 是**两个独立维度**——一个 `concept` 类型的 Rem 可以同时是 Document。

---

## 8. Position 的两种含义 ⚠️

| API | 含义 | 参数来源 |
|:----|:-----|:---------|
| `positionAmongstSiblings()` | 在**所有**兄弟中的位置（0 起始） | 无参数 |
| `positionAmongstVisibleSiblings(portalId?)` | 在**可见**兄弟中的位置（折叠状态影响） | 需要 Portal 上下文 |
| `setParent(parentId, position?)` | 移动到新父级的指定位置 | position 可选 |

`positionAmongstSiblings` 是静态数据（不依赖视图），`positionAmongstVisibleSiblings` 依赖 Portal 折叠状态。

---

## 9. Property vs Template ⚠️

**结论：完全不同的概念，不要混淆。**

| 术语 | 粒度 | 含义 | 示例 |
|:-----|:-----|:-----|:-----|
| **Property** | Rem 级别 | Tag 下标记为 `isProperty=true` 的子 Rem，定义一个数据字段 | "高亮"Tag 的 `[Color]` Property |
| **Template** | 文档级别 | 一种内置 Powerup（`BuiltInPowerupCodes.Template`），整个文档作为模板 | 会议记录模板、日记模板 |

- Property 是结构化数据字段（键值对），参与 Powerup 渲染和表格系统
- Template 是内容模板（整个文档结构），用于批量创建相似文档
- Powerup 渲染机制只涉及 **Tag + Property**，不涉及 Template

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
