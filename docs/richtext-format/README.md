# RichText 底层 JSON 格式完整参考

> 基于 RemNote Plugin SDK v0.0.46+。
> 官方文档信息分散且部分不准确，本文档整合了官方 API 类型定义 + 实际运行验证结果。
> 最后验证时间：2026-03-04
>
> **验证状态说明：**
> - ✅ 实测验证 — 通过 `edit-rem` 实际写入 RemNote 并在浏览器中确认效果
> - 📖 来自 SDK 类型定义 — 从 `api_modules.md` 的 TypeScript 接口提取，**未经实际写入测试**
> - ❌ 不可用 — 实测写入失败或无效果
> - ⚠️ 有限可用 — 可写入但行为异常或效果不可见

---

## 1. 总体结构

`RichTextInterface` 是一个数组，元素可以是：

- **纯字符串** — 无格式文本
- **对象** — 带格式的富文本元素，通过 `i` 字段区分类型

```jsonc
// 示例：混合格式的 RichText
[
  "普通文本",
  {"i": "m", "text": "加粗文本", "b": true},
  "中间文本",
  {"i": "m", "text": "红色高亮", "h": 1},
  {"i": "q", "_id": "someRemId"}
]
```

`text` 和 `backText` 字段都使用此格式。

---

## 2. 元素类型标识（`i` 字段）

| `i` 值 | 类型名 | 说明 | 验证状态 |
|:-------|:-------|:-----|:---------|
| `"m"` | Text | 格式化文本（最常用） | ✅ 实测验证 |
| `"q"` | Rem | Rem 引用（内嵌链接） | ✅ 实测验证 |
| `"i"` | Image | 图片 | ✅ 实测验证 |
| `"a"` | Audio | 音频/视频 | ✅ 实测验证（需含 `onlyAudio` 字段） |
| `"x"` | LaTeX | LaTeX 公式 | ✅ 实测验证 |
| `"s"` | CardDelimiter | 卡片分隔符（正反面分界） | ✅ 实测验证 |
| `"n"` | Annotation | 注释/批注 | ⚠️ 可写入但不可见 |
| `"g"` | GlobalName | 全局名称 | ⚠️ 可写入但不可见（内部元素） |
| `"fi"` | FlashcardIcon | 闪卡图标 | ❌ `setText()` 拒绝写入 |

---

## 3. 通用格式化字段 ✅ 实测验证

> **重要发现（2026-03-04 矩阵测试）：** 格式化字段**不是 `i: "m"` 的专属**。
> 通过 7×12 交叉兼容性测试验证，除 `i: "n"`（注释）外，所有元素类型的 `setText()` 都**接受**全部格式化字段且 JSON 完整保留。
> 详见 [3.2 交叉兼容性矩阵](#32-交叉兼容性矩阵字段×元素类型)。
>
> **注意区分：** "SDK 接受写入 + 字段保留" ≠ "格式化有实际视觉效果"。
> 例如给音频元素 `i:"a"` 加 `b:true`，SDK 不报错、JSON 保留了 `b:true`，但音频播放器不会变粗。
> 这说明 SDK 验证器使用了**通用 schema**，但渲染器只在语义合理的元素上应用格式化
>（如 `i:"q"` 的 Rem 引用文字确实可以加粗/斜体，这在用户手动操作时也能观察到）。

### 3.1 完整字段列表

以下格式化字段可附加到**几乎所有**元素类型（`m`, `q`, `i`, `a`, `x`, `s`, `g`），唯一例外是 `n`（注释）。

| 字段 | JSON 键 | 类型 | 说明 | 验证 |
|:-----|:--------|:-----|:-----|:-----|
| **粗体** | `b` | `boolean` | `true` = 粗体 | ✅ |
| **斜体** | `l` | `boolean` | `true` = 斜体（注意：是小写字母 L，不是 I） | ✅ |
| **下划线** | `u` | `boolean` | `true` = 下划线 | ✅ |
| **高亮色** | `h` | `number` | 背景高亮颜色，使用 RemColor 枚举数值 | ✅ |
| **文字颜色** | `tc` | `number` | 文字前景色，使用 RemColor 枚举数值 | ✅ |
| **代码块** | `code` | `boolean` | `true` = 代码格式（渲染为完整代码块，带语言标签和复制按钮） | ✅ |
| **行内代码** | `q` | `boolean` | `true` = 行内代码（红色等宽字体样式） | ✅ |
| **引用** | `block` | `boolean` | `true` = 引用块（可写入但无视觉效果） | ⚠️ |
| **完形填空 ID** | `cId` | `string` | Cloze 填空的标识符 | ✅ |
| **隐藏的完形填空** | `hiddenCloze` | `boolean` | 完形填空是否隐藏 | ✅ |
| **已揭示的完形填空** | `revealedCloze` | `boolean` | 完形填空是否已揭示 | ✅ |
| **行内链接 ID** | `qId` | `string` | 行内引用链接的 Rem ID（渲染为蓝色下划线链接） | ✅ |
| **URL 链接（已废弃）** | `url` | `string` | ❌ 官方类型定义有此字段，但实测写入后**无链接效果** | ❌ |
| **URL 链接（实际）** | `iUrl` | `string` | ✅ 超链接的实际字段（蓝色下划线可点击），官方文档未记录 | ✅ |
| **代码语言** | `language` | `string` | 代码块的编程语言（如 `"javascript"`、`"python"`） | ✅ |
| **标题** | `title` | `string` | 元素标题（可写入但无可见效果） | ⚠️ |

### 3.2 交叉兼容性矩阵（字段×元素类型）

> 2026-03-04 实测，84 个组合（7 种元素类型 × 12 种格式化字段）。
> ✅ = `setText()` 接受写入且字段在回读 JSON 中保留（**不代表有视觉渲染效果**）
> ❌ = SDK 拒绝写入（`Invalid input`）
> 跳过 `i:"m"`（已全覆盖）和 `i:"fi"`（SDK 拒绝所有写入）。

| 字段 \ 类型 | `q` Rem引用 | `i` 图片 | `a` 音频 | `x` LaTeX | `s` 分隔符 | `n` 注释 | `g` GlobalName |
|:------------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| `b` 粗体 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `l` 斜体 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `u` 下划线 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `h` 高亮色 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `tc` 文字色 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `q` 行内代码 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `code` 代码块 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `cId` 填空ID | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `qId` 行内链接 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `iUrl` 超链接 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `block` 引用块 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `title` 标题 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |

**结论：**
> - SDK 的 `setText()` 验证器对格式化字段采用**通用 schema**——除 `n`（注释）严格拒绝所有额外字段外，其余元素类型均接受全部 12 种格式化字段并完整保留。
> - `n` 类型只允许其定义的必填字段（`text`、`url`、`highlighterSerialization`），任何额外字段都会触发 `Invalid input`。
> - **实用意义：** 对于有文字渲染的元素（`m`、`q`），格式化字段（`b`/`l`/`u`/`h`/`tc`）有实际视觉效果。对于非文字元素（`i` 图片、`a` 音频、`s` 分隔符等），字段虽被 SDK 接受和保留，但渲染器不会应用格式化样式。

### 3.3 格式化文本元素（`i: "m"`）专属说明

`i: "m"` 是最常用的元素类型。除上述通用格式化字段外，它还有两个必需/专属字段：

| 字段 | JSON 键 | 类型 | 说明 |
|:-----|:--------|:-----|:-----|
| **类型标识** | `i` | `"m"`（固定值） | 标识为文本元素 |
| **文本内容** | `text` | `string` | 文本内容（必填） |

```jsonc
// i:"m" 是唯一需要 text 字段的格式化文本类型
{"i": "m", "text": "加粗文本", "b": true}

// 跨类型示例：给 Rem 引用加粗体
{"i": "q", "_id": "remId", "b": true}

// 跨类型示例：给图片加高亮背景
{"i": "i", "url": "https://example.com/img.png", "h": 4}
```

### 3.4 RemColor 颜色枚举值

`h`（高亮色）和 `tc`（文字颜色）字段使用相同的数值枚举：

| 数值 | 颜色 | 说明 |
|:-----|:-----|:-----|
| `0` | undefined | 无颜色 / 默认 |
| `1` | Red | 红色 |
| `2` | Orange | 橙色 |
| `3` | Yellow | 黄色 |
| `4` | Green | 绿色 |
| `5` | Purple | 紫色 |
| `6` | Blue | 蓝色 |
| `7` | Gray | 灰色 |
| `8` | Brown | 棕色 |
| `9` | Pink | 粉色 |

> **重要踩坑：** 官方文档的类型定义中 `HIGHLIGHT` 标注为 `string` 类型，但实际运行时必须使用 `number`。
> 传入字符串（如 `"Red"`）会导致 SDK 报 `Invalid input` 错误。
>
> 这与 Rem 级别的 `highlightColor` 属性不同 — 那个确实使用字符串值（`"Red"`、`"Green"` 等）。

### 3.5 常用格式化示例

```jsonc
// 粗体
{"i": "m", "text": "粗体文本", "b": true}

// 斜体
{"i": "m", "text": "斜体文本", "l": true}

// 下划线
{"i": "m", "text": "下划线文本", "u": true}

// 红色高亮背景
{"i": "m", "text": "高亮文本", "h": 1}

// 蓝色文字颜色
{"i": "m", "text": "蓝色文字", "tc": 6}

// 组合格式：粗体 + 绿色高亮
{"i": "m", "text": "重点内容", "b": true, "h": 4}

// 组合格式：斜体 + 紫色文字
{"i": "m", "text": "注释", "l": true, "tc": 5}

// 全组合：粗体 + 斜体 + 红色高亮 + 蓝色文字
{"i": "m", "text": "超级重点", "b": true, "l": true, "h": 1, "tc": 6}

// 行内代码
{"i": "m", "text": "console.log()", "q": true}

// 代码块
{"i": "m", "text": "function hello() {}", "code": true, "language": "javascript"}

// 超链接（注意：必须用 iUrl，不是 url！）
{"i": "m", "text": "点击访问", "iUrl": "https://example.com"}

// 完形填空（Cloze）— cId 可以是任意字符串
{"i": "m", "text": "答案内容", "cId": "cloze-id-1"}

// 隐藏的完形填空（闪卡练习时隐藏此部分）
{"i": "m", "text": "被隐藏的答案", "cId": "cloze-id-2", "hiddenCloze": true}

// 已揭示的完形填空（闪卡练习时显示此部分）
{"i": "m", "text": "已揭示的答案", "cId": "cloze-id-3", "revealedCloze": true}

// 行内引用链接（渲染为蓝色下划线可点击链接）
{"i": "m", "text": "链接文本", "qId": "targetRemId"}
```

### 3.6 完整 RichText 数组示例

```jsonc
// 一段混合格式的文本
[
  "机器学习是",
  {"i": "m", "text": "人工智能", "b": true, "h": 4},
  "的一个分支，它使用",
  {"i": "m", "text": "数据和算法", "l": true, "tc": 6},
  "来模仿人类学习的方式。"
]
```

---

## 4. Rem 引用元素（`i: "q"`）✅ 实测验证

用于在文本中嵌入对其他 Rem 的引用（内嵌链接）。写入后显示为红色可点击的 Rem 引用链接，被引用的 Rem 会自动增加引用计数。

```jsonc
// 最简写法（只需 _id）
{"i": "q", "_id": "remId"}

// 完整字段
{
  "i": "q",
  "_id": "remId",           // 被引用的 Rem ID（必填）
  "content": false,          // 是否展示内容（Portal）
  "pin": false,              // 是否固定
  "showFullName": false,     // 是否显示全路径名称
  "aliasId": "aliasRemId",   // 别名 Rem ID（可选）
  "textOfDeletedRem": [...]  // 已删除 Rem 的备份文本（可选）
}
```

---

## 5. 图片元素（`i: "i"`）✅ 实测验证

写入后图片直接在 Rem 内容中渲染显示。

```jsonc
// 最简写法（只需 url）
{"i": "i", "url": "https://example.com/image.png"}

// 指定尺寸
{"i": "i", "url": "https://example.com/image.png", "width": 280, "height": 207}

// 完整字段
{
  "i": "i",
  "url": "https://...",     // 图片 URL（必填）
  "width": 600,             // 宽度（像素，可选）
  "height": 300,            // 高度（像素，可选）
  "title": "图片说明",      // 标题/文件名（可选）
  "percent": 50,            // 显示比例：25 | 50 | 100（可选）
  "imgId": "imageId",       // 图片 ID（可选）
  "loading": false,         // 是否加载中（可选）
  "transparent": false      // 是否透明（可选）
}
```

本地文件使用 `%LOCAL_FILE%` 前缀的特殊 URL。

---

## 6. 音频/视频元素（`i: "a"`）✅ 实测验证（需含 `onlyAudio` 字段）

> **实测结论（2026-03-03 更新）：**
> - 之前测试手拼 `{"i":"a","url":"..."}` 不含 `onlyAudio` 字段时，SDK 返回 `Invalid input` 错误。
> - 通过 Builder API（`plugin.richText.video(url)` / `plugin.richText.audio(url)`）探测发现：
>   **`onlyAudio` 是必填字段**，不是可选字段。缺少此字段会导致 SDK 验证失败。
> - 加上 `onlyAudio` 后，手拼 JSON 通过 `setText()` 写入**成功**，媒体正常渲染。
>
> **Builder API 产出对照：**
> - `plugin.richText.video(url).value()` → `[{"i":"a","url":"...","onlyAudio":false}]`
> - `plugin.richText.audio(url).value()` → `[{"i":"a","url":"...","onlyAudio":true}]`

### 6.1 视频嵌入

```jsonc
// 最简写法（YouTube 视频）
{"i": "a", "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "onlyAudio": false}

// 指定尺寸
{"i": "a", "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "onlyAudio": false, "width": 640, "height": 360}
```

写入后渲染为 YouTube 视频缩略图 + 播放按钮，可直接在 Rem 中播放。

### 6.2 音频嵌入

```jsonc
// 最简写法
{"i": "a", "url": "https://example.com/audio.mp3", "onlyAudio": true}
```

写入后渲染为音频播放控件（播放/暂停按钮 + 进度条 + 音量控制）。

### 6.3 完整字段列表

```jsonc
{
  "i": "a",
  "url": "https://...",     // 媒体 URL（必填）
  "onlyAudio": false,       // 仅音频模式（必填！false=视频，true=音频）
  "width": 640,             // 宽度（可选）
  "height": 360,            // 高度（可选）
  "percent": 100            // 显示比例：25 | 50 | 100（可选）
}
```

> **重要踩坑：** SDK 类型定义中 `onlyAudio` 标注为可选字段，但实际运行时**必须提供**。
> 不含 `onlyAudio` 的 `i: "a"` 对象会被 `setText()` 拒绝（`Invalid input`）。

---

## 7. LaTeX 公式元素（`i: "x"`）✅ 实测验证

写入后 LaTeX 公式直接在 Rem 中渲染。支持行内公式和块级公式。

```jsonc
// 简单公式
{"i": "x", "text": "E = mc^2"}

// 复杂公式（分数）
{"i": "x", "text": "\\frac{a}{b}"}

// 完整字段
{
  "i": "x",
  "text": "E = mc^2",       // LaTeX 源码（必填）
  "block": true,            // 块级公式 vs 行内公式（可选）
  "cId": "clozeId"          // 完形填空 ID（可选）
}
```

---

## 8. 卡片分隔符（`i: "s"`）✅ 实测验证

用于分隔 Rem 正面和背面内容（在使用行内分隔符时出现）。写入后显示为 → 箭头分隔符。

```jsonc
// 最简写法
{"i": "s"}

// 完整字段
{
  "i": "s",
  "delimiterCharacterForSerialization": "→"  // 分隔字符（可选）
}
```

---

## 9. 注释元素（`i: "n"`）⚠️ 可写入但不可见 | ❌ 拒绝额外字段

> **实测结论：** 通过 `rem.setText()` 写入 `i: "n"` 注释元素不会报错，数据确实保存了，
> 但注释内容**不会在普通文档视图中可见渲染**。
> 注释元素可能仅在特定上下文中显示（如 PDF 阅读器高亮、Web Clipper 批注等）。
>
> **矩阵测试补充（2026-03-04）：** `i: "n"` 是所有可写入元素类型中**唯一严格拒绝额外字段**的类型。
> 给它附加任何格式化字段（`b`、`l`、`h`、`tc` 等）都会导致 `setText()` 返回 `Invalid input`。
> 只允许其定义的必填字段（`text`、`url`、`highlighterSerialization`）。

```jsonc
{
  "i": "n",
  "text": "批注文本",        // 注释内容（必填）
  "url": "https://...",      // 关联 URL（必填）
  "highlighterSerialization": {
    "text": "高亮的原文"     // 被高亮的原始文本
  }
}
```

---

## 10. 全局名称元素（`i: "g"`）⚠️ 可写入但不可见

> **实测结论：** 通过 `rem.setText()` 写入 `i: "g"` 不会报错（`_id` 可以是有效 Rem ID 或 `null`），
> 但元素**不会在文档视图中产生任何可见渲染**。属于 RemNote 内部使用的元素类型。

```jsonc
{
  "i": "g",
  "_id": "remId"            // 关联的 Rem ID（可以为 null）
}
```

---

## 11. RICH_TEXT_FORMATTING 常量映射

SDK 中 `RICH_TEXT_FORMATTING` 枚举的实际键值对应关系：

| 常量名 | 实际 JSON 键 | 值类型 |
|:-------|:------------|:-------|
| `BOLD` | `"b"` | `boolean` |
| `ITALIC` | `"l"` | `boolean` |
| `UNDERLINE` | `"u"` | `boolean` |
| `HIGHLIGHT` | `"h"` | `number`（RemColor 枚举） |
| `TEXT_COLOR` | `"tc"` | `number`（RemColor 枚举） |
| `CODE` | `"code"` | `boolean` |
| `INLINE_CODE` | `"q"` | `boolean` |
| `INLINE_LINK` | `"qId"` | `string`（Rem ID，渲染为蓝色链接） |
| `CLOZE` | `"cId"` | `string` |
| _(未记录)_ | `"iUrl"` | `string`（超链接 URL） |
| _(未记录)_ | `"tc"` | `number`（RemColor 枚举） |

---

## 12. 官方文档已知问题

| 问题 | 位置 | 说明 |
|:-----|:-----|:-----|
| `HIGHLIGHT` 类型标注错误 | `advanced_rich_text.md` | 类型定义标注为 `string`，实际必须是 `number` |
| `TEXT_COLOR` 缺失 | `advanced_rich_text.md` | `RichTextElementTextInterface` 类型定义中完全没有 `tc` 字段 |
| Builder API 与原始 JSON 类型不一致 | `api_classes_RichTextNamespace.md` | Builder 用字符串名（`"Red"`），原始 JSON 用数值（`1`） |
| 没有完整的原始 JSON 示例 | 全部文档 | 需要跨 3-4 个文件拼凑，且部分信息不准确 |
| `api_modules.md` 中 `h` 和 `tc` 类型为 `number \| string` | `api_modules.md` | 实际只接受 `number`，传 `string` 会报 `Invalid input` |
| **超链接字段名错误** | `api_modules.md` | 类型定义中有 `url` 字段，但实测写入后**无链接效果**；实际有效字段为 `iUrl`（未出现在类型定义中） |
| **音频/视频元素 `onlyAudio` 实为必填** | `api_modules.md` | `i: "a"` 类型定义中 `onlyAudio` 标注为可选，但实际**必须提供**，否则 `setText()` 返回 `Invalid input` |
| **注释元素写入不可见** | `api_modules.md` | `i: "n"` 可通过 `setText()` 写入不报错，但内容不在文档视图中渲染 |
| **FlashcardIcon 不可通过 `setText()` 创建** | `api_modules.md` | `i: "fi"` 类型定义存在，但通过 `setText()` 写入时被 SDK 拒绝（`Invalid input`） |
| **`block` 字段无视觉效果** | `api_modules.md` | `i: "m"` 的 `block: true` 可写入不报错，但不产生引用块视觉样式 |
| **GlobalName 写入不可见** | `api_modules.md` | `i: "g"` 可通过 `setText()` 写入不报错，但不在文档视图中渲染 |
| **格式化字段非 `i:"m"` 专属** | `api_modules.md` | 官方类型定义将格式化字段（`b`/`l`/`u`/`h` 等）放在 `RichTextElementTextInterface` 下，暗示仅适用于 `i:"m"`。实测除 `i:"n"` 外，所有类型均接受这些字段 |
| **`i:"n"` 严格拒绝额外字段** | `api_modules.md` | 注释元素不接受任何格式化字段，附加 `b`/`l`/`h` 等会导致 `Invalid input` |

---

## 13. Rem 级别颜色 vs RichText 行内颜色

两套颜色系统容易混淆：

| 属性 | 级别 | 值类型 | 示例 |
|:-----|:-----|:-------|:-----|
| `highlightColor` | Rem 整体 | 字符串 | `"Red"`, `"Green"`, `"Blue"` |
| `h`（RichText 内） | 行内文字 | 数值 | `1`(红), `4`(绿), `6`(蓝) |
| `tc`（RichText 内） | 行内文字 | 数值 | `1`(红), `4`(绿), `6`(蓝) |

通过 SDK setter 设置 Rem 级别颜色用 `rem.setHighlightColor("Red")`（字符串）。
通过 `rem.setText()` 设置行内颜色用 `{"h": 1}`（数值）。

---

## 14. 信息来源

| 来源 | 文件 | 贡献内容 |
|:-----|:-----|:---------|
| SDK 类型定义 | `api_modules.md` | `RichTextElementTextInterface` 完整字段列表 |
| SDK 类型定义 | `api_modules.md` | 所有 RichText 元素类型的接口定义 |
| SDK 枚举 | `api_enums_RemColor.md` | 颜色数值映射 |
| SDK 概述 | `advanced_rich_text.md` | 总体结构和 Builder API |
| Builder API | `api_classes_RichTextNamespace.md` | `richTextFormatNameCodeMap` 键值映射 |
| **实测验证** | 2026-03-03 会话 | 颜色必须用数值、`tc` 字段可用、组合格式可行、`iUrl` 发现、音频/视频需 `onlyAudio` 必填、注释不可见、cId/hiddenCloze/revealedCloze 可用（cloze ID 可任意字符串）、qId 渲染为蓝色链接、block/title/g 可写但无视觉效果、fi 不可写 |
| **交叉兼容性矩阵测试** | 2026-03-04 会话 | 7 种元素类型 × 12 种格式化字段 = 84 组合。结果：72 ✅ + 12 ❌。格式化字段是通用的（除 `n` 外全部接受），`n` 严格拒绝所有额外字段 |
