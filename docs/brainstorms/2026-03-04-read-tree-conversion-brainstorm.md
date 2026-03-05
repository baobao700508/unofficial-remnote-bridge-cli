# Brainstorm: read-tree 的 Rem → Markdown 转换规则

> 日期: 2026-03-04
> 状态: ✅ 探测完成（2026-03-05 浏览器实测验证）

## What We're Building

`read-tree` 命令需要将一棵 Rem 子树转换为 Markdown 大纲格式。核心问题是：**原始 Rem 对象怎么转成一行 Markdown？转换后需要什么后处理？**

## Key Decisions

### 1. 行内容只显示 text 的 Markdown 转换结果

- 行内容 = `toMarkdown(rem.text)` + 分隔符 + `toMarkdown(rem.backText)`（如果有）
- 其他所有属性（isTodo、isCode、highlightColor、fontSize 等）压入 `<!-- -->` 元数据（只读）
- AI 看得到元数据，但不能通过树模式修改它们。要改属性走 `edit-rem`。

### 2. toMarkdown 是 RichText 级别 API，不是 Rem 级别

SDK 确认：
- `plugin.richText.toMarkdown(richText: RichTextInterface)` — 接受 RichText 数组，非 Rem 对象
- Rem 类上没有 toMarkdown() 方法
- `text` 和 `backText` 是分离的两个 RichText 字段
- 分隔符（`::`、`;;`、`>>>` 等）不存储在 RichText 里，是 UI 渲染约定

因此**读方向必须我们自己拼接**：text 的 markdown + 分隔符 + backText 的 markdown。

### 3. 分隔符取决于 Rem 类型，需要调研

已知的 RemType 枚举（SDK）：

| 枚举值 | 名称 | 数值 |
|:--|:--|:--|
| CONCEPT | Concept | 1 |
| DESCRIPTOR | Descriptor | 2 |
| DEFAULT_TYPE | 普通行 | number |
| PORTAL | Portal | 6 |

~~推测的~~ **已验证**的分隔符映射（2026-03-05 浏览器实测）：

| 分隔符 | type | backText | practiceDirection | 说明 |
|:--|:--|:--|:--|:--|
| （无） | `default` | `null` | `forward` | 普通行 |
| `::` | `concept` | 有 | `both` | 概念卡，双向 |
| `;;` | `descriptor` | 有 | `forward` | 描述卡，单向 |
| `>>` | `default` | 有 | `forward` | 正向问答 |
| `<<` | `default` | 有 | `backward` | 反向问答 |
| `<>` | `default` | 有 | `both` | 双向问答（type 不变） |
| `>>>` | `default` | `null` | `forward` | 多行问答，答案在子 Rem |
| `::>` | `concept` | `null` | `both` | 概念型多行 |
| `;;>` | `descriptor` | `null` | `forward` | 描述型多行 |
| `{{}}` | `default` | `null` | `forward` | 完形填空，cloze 内嵌 text |

> 完整探测数据和反向序列化规则见 [docs/rem-type-mapping/README.md](../rem-type-mapping/README.md)

### 4. Multi-line 的表示方式 ✅ 已验证

~~Multi-line 闪卡的子行到底是：~~
~~- 存储在 `children` 里？（子 Rem）~~
~~- 存储在 `backText` 里？（单个 RichText 字段内）~~
~~- 还是两者兼有？~~

**答案：存储在 `children` 里，以 `isCardItem: true` 标记**。

- 父 Rem 的 `backText` 始终为 `null`
- 每个答案行是独立子 Rem，`type: "default"`，`isCardItem: true`
- 三种多行分隔符（`>>>`、`::>`、`;;>`）共享同一子 Rem 结构，区别仅在父 Rem 的 `type` 和 `practiceDirection`

这意味着树模式下 Multi-line Rem 的子行**天然就是树结构的一部分**，无需特殊处理。序列化时通过 `isCardItem` 标记加 `role:card-item` 元数据即可。

### 5. 拼接逻辑的层级：由实现时决定

Plugin 侧必须调 SDK（toMarkdown），CLI 侧知道树结构（缩进、元数据）。具体分工在 plan 阶段确定。

### 6. 写方向的工具

SDK 提供了 `createTreeWithMarkdown(markdown, parentId?)` 可以从 Markdown 一次性创建 Rem 树。但其行为细节（是否支持 `::`、缩进规则等）待未来调研。

## Why This Approach

- **toMarkdown + 自己拼接**是唯一可行路径，因为 SDK 没有 Rem 级别的导出方法
- **元数据只读**避免了 round-trip 有损问题（树模式不碰属性，只管结构）
- **先调研再实现**避免在不了解类型系统的情况下做错误假设

## Open Questions — ✅ 全部已解决

> 2026-03-05 通过浏览器模拟输入 + CLI `read-rem --full` 回读实测验证，放弃了 SDK 内部脚本方案。

1. ✅ **各种闪卡类型对应 Rem 对象的哪些字段值？**
   - 已验证 10 种分隔符的完整字段映射，见 [rem-type-mapping/README.md](../rem-type-mapping/README.md)

2. ⏳ **toMarkdown 对各类型 text/backText 的输出是什么？**
   - 未直接测试 `toMarkdown()`，但已知 text/backText 都是 RichText 数组
   - `toMarkdown()` 是纯 RichText → Markdown 转换，不涉及分隔符。分隔符需要我们根据映射规则自己拼接
   - 此问题在实现 plan 中细化

3. ⏳ **parseFromMarkdown 对各种分隔符的解析行为？**
   - 未直接测试，但 spec 中已明确新增行通过 `parseFromMarkdown()` 处理
   - 此问题在实现 plan 中细化（可能需要小范围实测）

4. ✅ **Multi-line 的子行在 Rem 对象里怎么表示？**
   - 答案在 `children` 里，子 Rem 带 `isCardItem: true` 标记，backText 为 null

## Next Steps

1. ~~写探测脚本~~ — ✅ 改用浏览器实测，结果已记录
2. ~~更新初始需求文档~~ — spec 中的序列化格式与探测结果一致，无需修改
3. **→ 进入 `/ce:plan` 制定 read-tree / edit-tree 实现计划**
