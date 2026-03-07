# Formatting and RichText — 格式与富文本

> RichText 元素类型、行内格式、Powerup 渲染机制、以及相关易混淆概念。

---

## RichText 元素类型概览

RichText 是 `Array<string | object>` 格式的 JSON 数组。对象元素通过 `i` 字段区分类型：

| `i` 字段值 | 含义 | 核心字段 |
|:----------|:-----|:---------|
| （纯 string） | 纯文本片段 | — |
| `"m"` | 带格式文本 | `text` + 格式标记字段 |
| `"q"` | Rem 引用 | `_id`（被引用 Rem ID） |
| `"i"` | 图片 | `url`, `width`, `height` |
| `"g"` | 全局名称 | — |

> 深入参考：-> [RichText 底层 JSON 格式完整参考](../richtext-format/README.md)

---

## 行内格式字段概览

`i: "m"` 元素可通过以下字段组合实现各种行内格式：

| 字段 | 类型 | 含义 |
|:-----|:-----|:-----|
| `b` | `true` | **加粗** |
| `l` | `true` | *斜体* |
| `u` | `true` | <u>下划线</u> |
| `h` | `number` | 高亮颜色（1=红, 2=橙, 3=黄, 4=绿, 5=蓝, 6=紫） |
| `tc` | `number` | 文字颜色（编号同高亮） |
| `q` | `true` | 引用格式 |
| `code` | `true` | `行内代码` |
| `cId` | `string` | 完形填空 ID（标记为 Cloze） |
| `iUrl` | `string` | 外部链接 URL |

> 深入参考：-> [RichText 底层 JSON 格式完整参考 - 格式标记字段](../richtext-format/README.md)

---

## Powerup 渲染三层机制概览

一个 Rem 的前端渲染效果由三层机制共同决定：

1. **Rem 自身属性层**：`type`（concept 加粗、descriptor 斜体）、`isDocument`（文档图标）
2. **Powerup Tag 层**：通过 `tags` 数组中的 Powerup Tag 决定渲染（Header→标题大小、Highlight→高亮颜色、Code→代码块、Quote→引用块等）
3. **RichText 行内层**：`text` / `backText` 数组中的格式化对象（`b`/`l`/`u`/`h`/`code` 等字段）

关键点：**第 2 层（Powerup Tag）本质是 RemNote 的 Tag + Property 继承机制的应用**。当 Powerup Tag 应用到 Rem 时，Tag 携带的 Property 会以复制粘贴的方式成为 Rem 的子节点。

> 深入参考：-> [Powerup 渲染机制研究](../powerup-rendering/README.md)

---

## Slot vs Property

**结论：同一概念的两个名字，底层完全相同。**

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

### 历史演变

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

## removePowerup vs removeTag

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

## Heading（标题）

Rem 级别的标题格式，通过 Header Powerup 实现。SDK: `rem.setFontSize('H1'|'H2'|'H3')`。实质是给 Rem 打上 Header Tag + 设置 Size Property。

## Highlight（高亮）

Rem 级别的背景色高亮。SDK: `rem.setHighlightColor('Red'|'Orange'|'Yellow'|'Green'|'Blue'|'Purple')`。注意区分 Rem 级别高亮（Powerup Tag）和 RichText 行内高亮（`h` 字段）。

## Code Block（代码块）

整个 Rem 渲染为代码块。SDK: `rem.setIsCode(true)`。Powerup Code: `cd`。

## Quote Block（引用块）

整个 Rem 渲染为引用块（左侧竖线）。SDK: `rem.setIsQuote(true)`。Powerup Code: `qt`。

## Todo（待办）

Rem 前显示复选框。SDK: `rem.setIsTodo(true)`。Powerup Code: `t`。

## Divider（分割线）

水平分割线。Powerup Code: `dv`。无 SDK 快捷方法。

---

## Rem 级别颜色 vs RichText 行内颜色

| 层级 | 作用范围 | 设置方式 | 存储位置 |
|:-----|:---------|:---------|:---------|
| **Rem 级别高亮** | 整个 Rem 的背景色 | `setHighlightColor()` | Powerup Tag + Property 子 Rem |
| **RichText 行内高亮** | 文本片段的背景色 | RichText `{ h: 1-6 }` | `text` / `backText` 数组内 |
| **RichText 行内文字色** | 文本片段的前景色 | RichText `{ tc: 1-6 }` | `text` / `backText` 数组内 |
