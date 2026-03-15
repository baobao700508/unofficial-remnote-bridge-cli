export const REM_OBJECT_FIELDS_CONTENT = `
# RemObject 字段参考

RemObject 是本项目对 RemNote Rem 的标准化表示，包含 51 个字段。

---

## 字段分类

| 标记 | 含义 | 数量 | 输出条件 |
|:-----|:-----|:-----|:---------|
| RW | 可读可写 | 20 | 默认输出 |
| Portal-W | Portal 专用可写 | 1 | 默认输出（Portal 简化模式） |
| R | 只读 | 13 | 默认输出 |
| R-F | 只读低频 | 18 | 仅 \\\`--full\\\` 输出 |

---

## 核心标识

| 字段 | 类型 | 权限 | 说明 |
|------|------|:----:|------|
| \\\`id\\\` | \\\`string\\\` | R | Rem 唯一 ID |

## 内容

| 字段 | 类型 | 权限 | 说明 |
|------|------|:----:|------|
| \\\`text\\\` | \\\`RichText\\\` | RW | 正面文本（RichText 数组）。UI：文本内容立即更新显示 |
| \\\`backText\\\` | \\\`RichText \\| null\\\` | RW | 背面文本。null=无背面；设值即产生闪卡正反面结构。UI：显示为"正面 → 背面"箭头分隔格式 |

## 类型系统

| 字段 | 类型 | 权限 | 说明 |
|------|------|:----:|------|
| \\\`type\\\` | \\\`RemTypeValue\\\` | RW | \\\`concept\\\` / \\\`descriptor\\\` / \\\`default\\\` / \\\`portal\\\` |
| \\\`isDocument\\\` | \\\`boolean\\\` | RW | 是否作为独立文档页面。独立于 type。UI：bullet(•)变为文档图标，可独立打开 |

## 结构

| 字段 | 类型 | 权限 | 说明 |
|------|------|:----:|------|
| \\\`parent\\\` | \\\`string \\| null\\\` | RW | 父 Rem ID。null=顶级。UI：Rem 从原位置消失，出现在新父级下 |
| \\\`children\\\` | \\\`string[]\\\` | R-F | 子 Rem ID 有序数组 |

## 格式 / 显示

| 字段 | 类型 | 权限 | 说明 |
|------|------|:----:|------|
| \\\`fontSize\\\` | \\\`FontSize \\| null\\\` | RW | 标题大小：\\\`H1\\\` / \\\`H2\\\` / \\\`H3\\\`。null=普通 |
| \\\`highlightColor\\\` | \\\`HighlightColor \\| null\\\` | RW | 高亮颜色（9 种）。null=无高亮。UI：整行背景变为对应颜色，bullet 也着色 |

## 状态标记

| 字段 | 类型 | 权限 | 说明 |
|------|------|:----:|------|
| \\\`isTodo\\\` | \\\`boolean\\\` | RW | 是否待办。设为 true 时自动初始化 todoStatus。UI：文本前出现空心 checkbox（☐） |
| \\\`todoStatus\\\` | \\\`TodoStatus \\| null\\\` | RW | \\\`Finished\\\` / \\\`Unfinished\\\`。需先 isTodo=true。UI：Finished=蓝色已勾选（☑）+文本删除线 |
| \\\`isCode\\\` | \\\`boolean\\\` | RW | 是否代码块。UI：等宽字体、灰色背景、块级缩进 |
| \\\`isQuote\\\` | \\\`boolean\\\` | RW | 是否引用块。UI：左侧灰色竖线+背景浅灰（blockquote 样式） |
| \\\`isListItem\\\` | \\\`boolean\\\` | RW | 是否列表项。UI：bullet(•)变为数字编号"1."（有序列表） |
| \\\`isCardItem\\\` | \\\`boolean\\\` | RW | 是否卡片项（多行答案行标记）。UI：无明显变化，在 Card View 中生效 |
| \\\`isTable\\\` | \\\`boolean\\\` | R | 是否表格（只读） |
| \\\`isSlot\\\` | \\\`boolean\\\` | RW | 是否 Powerup 插槽。与 isProperty 底层相同。UI：bullet(•)变为方形图标（☐） |
| \\\`isProperty\\\` | \\\`boolean\\\` | RW | 是否 Tag 属性（表格列）。与 isSlot 底层相同。UI：bullet(•)变为方形图标（☐） |

## Powerup 系统标识

| 字段 | 类型 | 权限 | 说明 |
|------|------|:----:|------|
| \\\`isPowerup\\\` | \\\`boolean\\\` | R-F | 是否 Powerup |
| \\\`isPowerupEnum\\\` | \\\`boolean\\\` | R-F | 是否 Powerup 枚举 |
| \\\`isPowerupProperty\\\` | \\\`boolean\\\` | R-F | 是否 Powerup 属性 |
| \\\`isPowerupPropertyListItem\\\` | \\\`boolean\\\` | R-F | 是否 Powerup 属性列表项 |
| \\\`isPowerupSlot\\\` | \\\`boolean\\\` | R-F | 是否 Powerup 插槽 |

## Portal 专用

| 字段 | 类型 | 权限 | 说明 |
|------|------|:----:|------|
| \\\`portalType\\\` | \\\`PortalType \\| null\\\` | R | Portal 子类型。仅 type=portal 时有值 |
| \\\`portalDirectlyIncludedRem\\\` | \\\`string[]\\\` | Portal-W | Portal 直接包含的 Rem ID。仅 type=portal 时可通过 edit-rem 修改（Diff 机制：addToPortal/removeFromPortal） |

## 属性类型

| 字段 | 类型 | 权限 | 说明 |
|------|------|:----:|------|
| \\\`propertyType\\\` | \\\`PropertyTypeValue \\| null\\\` | R | 属性数据类型（当此 Rem 是 Tag 的属性时） |

## 练习设置

| 字段 | 类型 | 权限 | 说明 |
|------|------|:----:|------|
| \\\`enablePractice\\\` | \\\`boolean\\\` | RW | 是否启用间隔重复练习。UI：无明显变化 |
| \\\`practiceDirection\\\` | \\\`PracticeDirection\\\` | RW | 练习方向：\\\`forward\\\` / \\\`backward\\\` / \\\`both\\\` / \\\`none\\\`。UI：无明显变化 |

## 关联 — 直接关系

| 字段 | 类型 | 权限 | 说明 |
|------|------|:----:|------|
| \\\`tags\\\` | \\\`string[]\\\` | RW | 标签 Rem ID 数组。写入时使用 diff 机制（add/remove）。UI：行右侧出现标签徽章 |
| \\\`sources\\\` | \\\`string[]\\\` | RW | 来源 Rem ID 数组。写入时使用 diff 机制。UI：Rem 下方出现灰色来源引用框 |
| \\\`aliases\\\` | \\\`string[]\\\` | R | 别名 Rem ID 数组 |

## 关联 — 引用关系

| 字段 | 类型 | 权限 | 说明 |
|------|------|:----:|------|
| \\\`remsBeingReferenced\\\` | \\\`string[]\\\` | R | 本 Rem 引用的其他 Rem |
| \\\`deepRemsBeingReferenced\\\` | \\\`string[]\\\` | R-F | 本 Rem 深层引用的 Rem |
| \\\`remsReferencingThis\\\` | \\\`string[]\\\` | R | 引用本 Rem 的 Rem（反向链接） |

## 关联 — 标签体系

| 字段 | 类型 | 权限 | 说明 |
|------|------|:----:|------|
| \\\`taggedRem\\\` | \\\`string[]\\\` | R | 被本 Rem 标记的 Rem（本 Rem 作为 tag 时） |
| \\\`ancestorTagRem\\\` | \\\`string[]\\\` | R-F | 祖先标签 Rem（标签继承链） |
| \\\`descendantTagRem\\\` | \\\`string[]\\\` | R-F | 后代标签 Rem（标签继承链） |

## 关联 — 层级遍历

| 字段 | 类型 | 权限 | 说明 |
|------|------|:----:|------|
| \\\`descendants\\\` | \\\`string[]\\\` | R | 所有后代 Rem |
| \\\`siblingRem\\\` | \\\`string[]\\\` | R | 兄弟 Rem |
| \\\`portalsAndDocumentsIn\\\` | \\\`string[]\\\` | R-F | 所在的 Portal 和文档 |
| \\\`allRemInDocumentOrPortal\\\` | \\\`string[]\\\` | R-F | 文档/Portal 中的所有 Rem |
| \\\`allRemInFolderQueue\\\` | \\\`string[]\\\` | R-F | 文件夹队列中的 Rem |

## 位置 / 统计

| 字段 | 类型 | 权限 | 说明 |
|------|------|:----:|------|
| \\\`positionAmongstSiblings\\\` | \\\`number \\| null\\\` | RW | 在兄弟间的位置（0 起始）。UI：Rem 在父级子列表中的显示位置改变 |
| \\\`timesSelectedInSearch\\\` | \\\`number\\\` | R-F | 搜索中被选次数 |
| \\\`lastTimeMovedTo\\\` | \\\`number\\\` | R-F | 上次移动时间（毫秒时间戳） |
| \\\`schemaVersion\\\` | \\\`number\\\` | R-F | Schema 版本号 |

## 队列视图

| 字段 | 类型 | 权限 | 说明 |
|------|------|:----:|------|
| \\\`embeddedQueueViewMode\\\` | \\\`boolean\\\` | R-F | 嵌入式队列视图模式 |

## 元数据 / 时间戳

| 字段 | 类型 | 权限 | 说明 |
|------|------|:----:|------|
| \\\`createdAt\\\` | \\\`number\\\` | R | 创建时间（毫秒时间戳） |
| \\\`updatedAt\\\` | \\\`number\\\` | R | 最后更新时间（毫秒时间戳） |
| \\\`localUpdatedAt\\\` | \\\`number\\\` | R-F | 本地最后更新时间 |
| \\\`lastPracticed\\\` | \\\`number\\\` | R-F | 上次练习时间 |

---

## 可编辑字段约束表

以下为 21 个可编辑字段（RW + Portal-W）及其写入约束：

| 字段 | SDK setter | 值类型 | 约束 / 特殊处理 |
|------|-----------|--------|-----------------|
| \\\`text\\\` | \\\`rem.setText()\\\` | RichText | RichText 数组 |
| \\\`backText\\\` | \\\`rem.setBackText()\\\` | RichText \\| null | null → \\\`setBackText([])\\\`（清除背面）；字符串 → 包装为 \\\`[string]\\\` |
| \\\`type\\\` | \\\`rem.setType()\\\` | RemTypeValue | \\\`portal\\\` 不可设置（只能通过 \\\`createPortal()\\\` 创建） |
| \\\`isDocument\\\` | \\\`rem.setIsDocument()\\\` | boolean | — |
| \\\`parent\\\` | \\\`rem.setParent(parentId, position?)\\\` | string \\| null | 与 \\\`positionAmongstSiblings\\\` 联动 |
| \\\`fontSize\\\` | \\\`rem.setFontSize()\\\` | FontSize \\| null | null → \\\`setFontSize(undefined)\\\`（恢复普通大小） |
| \\\`highlightColor\\\` | \\\`rem.setHighlightColor()\\\` / \\\`rem.removePowerup('h')\\\` | HighlightColor \\| null | null → \\\`removePowerup('h')\\\`（SDK 不接受 null） |
| \\\`isTodo\\\` | \\\`rem.setIsTodo()\\\` | boolean | 设为 true 时自动初始化 todoStatus |
| \\\`todoStatus\\\` | \\\`rem.setTodoStatus()\\\` | TodoStatus \\| null | null → 跳过（清除 todo 应通过 \\\`isTodo=false\\\`） |
| \\\`isCode\\\` | \\\`rem.setIsCode()\\\` | boolean | — |
| \\\`isQuote\\\` | \\\`rem.setIsQuote()\\\` | boolean | — |
| \\\`isListItem\\\` | \\\`rem.setIsListItem()\\\` | boolean | — |
| \\\`isCardItem\\\` | \\\`rem.setIsCardItem()\\\` | boolean | — |
| \\\`isSlot\\\` | \\\`rem.setIsSlot()\\\` | boolean | 与 \\\`isProperty\\\` 底层相同 |
| \\\`isProperty\\\` | \\\`rem.setIsProperty()\\\` | boolean | 与 \\\`isSlot\\\` 底层相同 |
| \\\`enablePractice\\\` | \\\`rem.setEnablePractice()\\\` | boolean | — |
| \\\`practiceDirection\\\` | \\\`rem.setPracticeDirection()\\\` | PracticeDirection | \\\`forward\\\` / \\\`backward\\\` / \\\`both\\\` / \\\`none\\\` |
| \\\`tags\\\` | \\\`rem.addTag()\\\` / \\\`rem.removeTag()\\\` | string[] | **Diff 机制**：对比当前 vs 目标，增删差异项 |
| \\\`sources\\\` | \\\`rem.addSource()\\\` / \\\`rem.removeSource()\\\` | string[] | **Diff 机制**：对比当前 vs 目标，增删差异项 |
| \\\`positionAmongstSiblings\\\` | \\\`rem.setParent(parent, position)\\\` | number \\| null | 与 \\\`parent\\\` 联动 |
| \\\`portalDirectlyIncludedRem\\\` | \\\`rem.addToPortal()\\\` / \\\`rem.removeFromPortal()\\\` | string[] | **Portal-W Diff 机制**：仅 type=portal 时可修改。对比当前 vs 目标数组，逐项增删 |

### parent + positionAmongstSiblings 联动

这两个字段通过同一个 SDK 调用 \\\`rem.setParent(parentId, position)\\\` 写入：

| 场景 | 行为 |
|------|------|
| 两个字段都变更 | 合并为一次 \\\`setParent(newParent, newPosition)\\\` 调用 |
| 只有 \\\`parent\\\` 变更 | \\\`setParent(newParent)\\\` 不带 position（保持末尾） |
| 只有 \\\`positionAmongstSiblings\\\` 变更 | 获取当前 parent → \\\`setParent(currentParent, newPosition)\\\` |

### tags / sources Diff 机制

写入 \\\`tags\\\` 或 \\\`sources\\\` 时，不是整体替换，而是计算差异：

\\\`\\\`\\\`
currentTags = await rem.getTagRems()
targetIds = payload 中的 tags 字段
currentSet = Set(currentTags.map(r => r._id))
targetSet = Set(targetIds)

// 增加缺少的
for id in targetIds:
    if id not in currentSet: await rem.addTag(id)

// 删除多余的
for id in currentSet:
    if id not in targetSet: await rem.removeTag(id)
\\\`\\\`\\\`

---

## 只读字段列表

以下 30 个字段在 str_replace 中被修改时，**只产生警告，不执行写入**：

\\\`\\\`\\\`
id,
children,
isTable,
portalType,
propertyType,
aliases,
remsBeingReferenced, deepRemsBeingReferenced, remsReferencingThis,
taggedRem, ancestorTagRem, descendantTagRem,
descendants, siblingRem,
portalsAndDocumentsIn, allRemInDocumentOrPortal, allRemInFolderQueue,
timesSelectedInSearch, lastTimeMovedTo, schemaVersion,
embeddedQueueViewMode,
createdAt, updatedAt, localUpdatedAt, lastPracticed,
isPowerup, isPowerupEnum, isPowerupProperty,
isPowerupPropertyListItem, isPowerupSlot
\\\`\\\`\\\`

警告格式：\\\`"Field '{fieldName}' is read-only and was ignored"\\\`

---

## 枚举类型速查表

### RemTypeValue

| 值 | 含义 | UI 表现 |
|----|------|---------|
| \\\`concept\\\` | 概念（双向闪卡） | 文字加粗 |
| \\\`descriptor\\\` | 描述（单向闪卡） | 正常字重 |
| \\\`default\\\` | 普通 Rem | 正常字重 |
| \\\`portal\\\` | 嵌入引用容器 | 紫色左边框（只读，不可通过 setType 设置） |

### FontSize

| 值 | UI 表现 |
|----|---------|
| \\\`H1\\\` | 超大粗体 |
| \\\`H2\\\` | 大粗体 |
| \\\`H3\\\` | 中粗体 |

### TodoStatus

| 值 | UI 表现 |
|----|---------|
| \\\`Finished\\\` | 蓝色已勾选 + 文本删除线 |
| \\\`Unfinished\\\` | 空心未勾选 |

### HighlightColor

\\\`\\\`\\\`
Red | Orange | Yellow | Green | Blue | Purple | Gray | Brown | Pink
\\\`\\\`\\\`

### PortalType

| 值 | 含义 |
|----|------|
| \\\`portal\\\` | 标准 Portal |
| \\\`embedded_queue\\\` | 嵌入式队列视图 |
| \\\`scaffold\\\` | 脚手架模式 |
| \\\`search_portal\\\` | 搜索 Portal |

### PracticeDirection

| 值 | 含义 |
|----|------|
| \\\`forward\\\` | 正向：看 text 回忆 backText |
| \\\`backward\\\` | 反向：看 backText 回忆 text |
| \\\`both\\\` | 双向：正反两个方向都练习 |
| \\\`none\\\` | 不生成闪卡 |

### PropertyTypeValue

\\\`\\\`\\\`
text | number | date | checkbox | single_select | multi_select | url | image | title | definition | created_at | last_updated | 0
\\\`\\\`\\\`

\\\`0\\\` 表示隐式文本类型（IMPLICIT_TEXT）。

---

## RichText 格式

RemObject 中的 \\\`text\\\` 和 \\\`backText\\\` 字段使用 RichText 格式——一个 JSON 数组，每个元素为纯字符串或带 \\\`i\\\` 字段的格式化对象。

### 元素类型

| \\\`i\\\` 值 | 含义 | 必填字段 | 可选字段 |
|--------|------|----------|----------|
| （纯 string） | 纯文本片段 | — | — |
| \\\`"m"\\\` | 带格式文本 | \\\`text\\\` | 格式标记（见下表） |
| \\\`"q"\\\` | Rem 引用 | \\\`_id\\\` | \\\`content\\\`, \\\`showFullName\\\`, \\\`aliasId\\\` |
| \\\`"i"\\\` | 图片 | \\\`url\\\` | \\\`width\\\`, \\\`height\\\`, \\\`percent\\\`(25/50/100) |
| \\\`"x"\\\` | LaTeX | \\\`text\\\` | \\\`block\\\`(true=块级公式) |
| \\\`"a"\\\` | 音频/视频 | \\\`url\\\`, \\\`onlyAudio\\\`（**必填**） | \\\`width\\\`, \\\`height\\\` |
| \\\`"s"\\\` | 卡片分隔符 | — | \\\`delimiterCharacterForSerialization\\\` |

**注意**：\\\`i:"a"\\\` 的 \\\`onlyAudio\\\` 是**必填**字段（\\\`true\\\`=音频，\\\`false\\\`=视频），缺少会导致 SDK 拒绝写入。

### 格式标记（主要用于 \\\`i:"m"\\\`，但 \\\`i:"q"\\\` 等元素也支持）

| 字段 | 类型 | 含义 |
|------|------|------|
| \\\`b\\\` | \\\`true\\\` | 加粗 |
| \\\`l\\\` | \\\`true\\\` | 斜体（小写字母 L，不是 I） |
| \\\`u\\\` | \\\`true\\\` | 下划线 |
| \\\`h\\\` | \\\`number\\\` | 高亮颜色（RemColor 枚举：1=Red, 2=Orange, 3=Yellow, 4=Green, 5=Purple, 6=Blue, 7=Gray, 8=Brown, 9=Pink） |
| \\\`tc\\\` | \\\`number\\\` | 文字颜色（同 RemColor 枚举） |
| \\\`q\\\` | \\\`true\\\` | 行内代码（红色等宽样式） |
| \\\`code\\\` | \\\`true\\\` | 代码块（带语言标签和复制按钮） |
| \\\`language\\\` | \\\`string\\\` | 代码块语言（如 \\\`"javascript"\\\`、\\\`"python"\\\`） |
| \\\`cId\\\` | \\\`string\\\` | 完形填空 ID |
| \\\`hiddenCloze\\\` | \\\`true\\\` | 完形填空隐藏状态 |
| \\\`revealedCloze\\\` | \\\`true\\\` | 完形填空已揭示状态 |
| \\\`iUrl\\\` | \\\`string\\\` | 外部超链接 URL（\\\`url\\\` 字段已废弃，必须用 \\\`iUrl\\\`） |
| \\\`qId\\\` | \\\`string\\\` | 行内引用链接的 Rem ID |

### RemColor 颜色枚举（\\\`h\\\` 和 \\\`tc\\\` 共用）

| 值 | 颜色 | 值 | 颜色 | 值 | 颜色 |
|:---|:-----|:---|:-----|:---|:-----|
| 0 | 无颜色/默认 | 4 | Green | 7 | Gray |
| 1 | Red | 5 | Purple | 8 | Brown |
| 2 | Orange | 6 | Blue | 9 | Pink |
| 3 | Yellow | — | — | — | — |

### 常用构造示例

以下为 key 字母序排列的格式：

\\\`\\\`\\\`jsonc
{ "b": true, "i": "m", "text": "粗体" }        // 粗体（key 序：b < i < text）
{ "i": "m", "q": true, "text": "code" }        // 行内代码
{ "i": "m", "iUrl": "https://...", "text": "链接" } // 超链接（iUrl 不是 url！）
{ "b": true, "h": 1, "i": "m", "text": "重点" } // 粗体+红色高亮（h 是数字 0-9）
{ "cId": "c1", "i": "m", "text": "答案" }       // 完形填空
{ "_id": "remId", "b": true, "i": "q" }         // Rem 引用加粗（_id 排最前）
{ "i": "x", "text": "E = mc^2" }                // LaTeX
{ "i": "a", "onlyAudio": false, "url": "..." }  // 视频（onlyAudio 必填！）
{ "i": "a", "onlyAudio": true, "url": "..." }   // 音频
\\\`\\\`\\\`

> 在 RemObject 格式化 JSON 中，数组内对象会展开为多行（每个 key 一行）。构造 \\\`edit_rem\\\` 的 oldStr/newStr 时必须使用实际的多行格式。

### highlightColor（Rem 级别）vs h（RichText 行内）

- \\\`highlightColor\\\`：RemObject 顶层字段，值为字符串（\\\`"Red"\\\`, \\\`"Blue"\\\` 等）或 \\\`null\\\`，整行背景色
- \\\`h\\\`：RichText 元素内格式标记，值为数字 0-9（RemColor 枚举），行内文字片段高亮

两者完全独立，互不影响。

### 序列化确定性

RichText 对象元素内部按 **key 字母序排列**（Plugin 端 \\\`sortRichTextKeys()\\\` 处理），确保同一内容的序列化 JSON 始终一致。\\\`_id\\\` 中的 \\\`_\\\`（U+005F）排在所有小写字母（\\\`a\\\`=U+0061）之前，所以 \\\`_id\\\` 总是第一个 key。这对 \\\`edit_rem\\\` 的 str_replace 和乐观并发检测至关重要。
`;
