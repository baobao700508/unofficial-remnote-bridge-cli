export const EDIT_REM_GUIDE_CONTENT = `
# edit_rem 操作指南

edit_rem 直接修改单个 Rem 的属性字段。通过 changes 对象指定要修改的字段及新值。

---

## 前置条件

必须先 \\\`read_rem\\\` 同一个 remId，建立缓存后才能 \\\`edit_rem\\\`。跳过会触发防线 1 错误。

工作流：\\\`read_rem\\\` → 查看属性 → \\\`edit_rem\\\`（changes 对象）。

---

## changes 对象

传入 {字段名: 新值} 格式的对象。支持 21 个可写字段，只读和未知字段会产生警告但不阻断。

示例：
- 修改类型：\\\`{type: "concept"}\\\`
- 设置高亮：\\\`{highlightColor: "Yellow"}\\\`
- 批量修改：\\\`{type: "concept", highlightColor: "Yellow", fontSize: "H1"}\\\`

---

## 两道防线

| 防线 | 检查内容 | 失败时 |
|:-----|:---------|:-------|
| 1. 缓存存在 | 是否已 read_rem | 报 "has not been read yet" → 先 read_rem |
| 2. 并发检测 | 当前 Rem 是否被外部修改 | 报 "has been modified since last read" → 重新 read_rem |

防线 2 的关键：edit 时会从 Plugin 重新读取最新数据与缓存比较。如果不一致，拒绝编辑并**不更新缓存**，迫使你重新 read_rem。

---

## RichText 编辑

\\\`text\\\` 和 \\\`backText\\\` 字段使用 RichText 格式。传入完整的 RichText 数组作为新值。

### 关键排序规则

- \\\`_id\\\`（U+005F）排在所有小写字母之前，所以 \\\`_id\\\` 总是第一个 key
- 示例排序：\\\`_id\\\` < \\\`b\\\` < \\\`cId\\\` < \\\`h\\\` < \\\`i\\\` < \\\`iUrl\\\` < \\\`text\\\`

### 示例 1：设置纯文本

\\\`\\\`\\\`
changes: {text: ["新标题"]}
\\\`\\\`\\\`

### 示例 2：设置粗体

\\\`\\\`\\\`
changes: {text: [{"b": true, "i": "m", "text": "粗体标题"}]}
\\\`\\\`\\\`

### 示例 3：设置超链接

\\\`\\\`\\\`
changes: {text: ["点击", {"i": "m", "iUrl": "https://remnote.com", "text": "访问官网"}]}
\\\`\\\`\\\`

### 示例 4：添加完形填空

\\\`\\\`\\\`
changes: {text: ["光合作用需要", {"cId": "cloze1", "i": "m", "text": "阳光"}]}
\\\`\\\`\\\`

### 示例 5：设置 backText

\\\`\\\`\\\`
changes: {backText: ["背面答案"]}
changes: {backText: null}  // 清除背面
\\\`\\\`\\\`

---

## highlightColor vs h

| 属性 | 位置 | 值类型 | 作用范围 |
|:-----|:-----|:-------|:---------|
| \\\`highlightColor\\\` | RemObject 顶层字段 | 字符串（\\\`"Red"\\\`, \\\`"Blue"\\\` 等）或 \\\`null\\\` | 整行背景色 |
| \\\`h\\\` | RichText 元素内格式标记 | 数字 0-9（RemColor 枚举） | 行内文字片段 |

两者完全独立。\\\`highlightColor\\\` 通过 \\\`setHighlightColor()\\\` 写入，\\\`h\\\` 通过 \\\`setText()\\\` 随 RichText 一起写入。

---

## Portal 编辑

Portal（type=portal）的引用列表通过 \\\`portalDirectlyIncludedRem\\\` 字段修改：

\\\`\\\`\\\`
changes: {portalDirectlyIncludedRem: ["remId1", "remId2", "newRemId3"]}
\\\`\\\`\\\`

创建和删除 Portal 请使用 \\\`edit_tree\\\`。

---

## 缓存更新行为

| 场景 | 缓存 |
|:-----|:-----|
| 写入成功 | 从 Plugin 重新读取最新状态 → 覆盖缓存 |
| 防线 2 拒绝 | **不更新**缓存（迫使重新 read_rem） |
| 部分写入失败 | **不更新**缓存（迫使重新 read_rem） |

写入成功后**永远从 Plugin 重新读取**，不做本地推导，保证缓存与 SDK 状态完全同步。

---

## 常见错误

| 错误 | 原因 | 解决 |
|:-----|:-----|:-----|
| 字段值类型错误 | 如 type 传了无效值 | 检查枚举类型速查表 |
| 混淆 highlightColor 和 h | 前者字符串 \\\`"Red"\\\`，后者数字 \\\`1\\\` | 参考上方对比表 |
| 漏 onlyAudio | \\\`i:"a"\\\` 的 \\\`onlyAudio\\\` 是必填 | true=音频，false=视频 |
| 只读字段被忽略 | 修改了只读字段 | 产生警告但不阻断，检查字段权限 |
| Portal 字段修改无效 | 非 Portal 类型的 Rem 修改 portalDirectlyIncludedRem | 仅 type=portal 的 Rem 支持该字段 |
`;
