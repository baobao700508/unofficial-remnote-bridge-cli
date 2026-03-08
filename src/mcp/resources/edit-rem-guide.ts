export const EDIT_REM_GUIDE_CONTENT = `
# edit_rem 操作指南

edit_rem 通过 str_replace 语义修改单个 Rem 的属性。操作对象是 \\\`JSON.stringify(remObject, null, 2)\\\` 的格式化文本。

---

## 前置条件

必须先 \\\`read_rem\\\` 同一个 remId，建立缓存后才能 \\\`edit_rem\\\`。跳过会触发防线 1 错误。

工作流：\\\`read_rem\\\` → 查看 JSON → \\\`edit_rem\\\`（oldStr/newStr）。

---

## str_replace 语义

### 操作对象

格式化缩进 2 空格的 JSON 文本。示例片段：

\\\`\\\`\\\`json
{
  "id": "kLrIOHJLyMd8Y2lyA",
  "text": [
    "Hello World"
  ],
  "backText": null,
  "type": "concept",
  "highlightColor": null,
  "isTodo": false
}
\\\`\\\`\\\`

### 匹配规则

- oldStr 必须在 JSON 文本中**恰好匹配 1 次**（0 次=未找到，>1 次=多匹配，均报错）
- 大小写敏感，精确匹配
- oldStr 建议包含字段名 + 值，避免匹配到 text 内容中的同名字符串

### 替换后校验

替换后的文本必须是合法 JSON，否则报 "invalid JSON" 错误。

---

## 三道防线

| 防线 | 检查内容 | 失败时 |
|:-----|:---------|:-------|
| 1. 缓存存在 | 是否已 read_rem | 报 "has not been read yet" → 先 read_rem |
| 2. 并发检测 | 当前 Rem 是否被外部修改 | 报 "has been modified since last read" → 重新 read_rem |
| 3. 精确匹配 | oldStr 匹配次数 | 0 次或多次 → 调整 oldStr 使其唯一 |

防线 2 的关键：edit 时会从 Plugin 重新读取最新数据与缓存比较。如果不一致（含空白和格式），拒绝编辑并**不更新缓存**，迫使你重新 read_rem。

---

## RichText 编辑实战

\\\`text\\\` 和 \\\`backText\\\` 字段使用 RichText 格式。在格式化 JSON 中，RichText 数组内的对象展开为多行，key 按**字母序**排列。

### 关键排序规则

- \\\`_id\\\`（U+005F）排在所有小写字母之前，所以 \\\`_id\\\` 总是第一个 key
- 示例排序：\\\`_id\\\` < \\\`b\\\` < \\\`cId\\\` < \\\`h\\\` < \\\`i\\\` < \\\`iUrl\\\` < \\\`text\\\`

### 示例 1：纯文本 → 粗体

read_rem 返回：

\\\`\\\`\\\`json
  "text": [
    "普通标题"
  ],
\\\`\\\`\\\`

edit_rem 调用：

\\\`\\\`\\\`
oldStr:  "text": [\\n    "普通标题"\\n  ]
newStr:  "text": [\\n    {\\n      "b": true,\\n      "i": "m",\\n      "text": "粗体标题"\\n    }\\n  ]
\\\`\\\`\\\`

替换后变为：

\\\`\\\`\\\`json
  "text": [
    {
      "b": true,
      "i": "m",
      "text": "粗体标题"
    }
  ],
\\\`\\\`\\\`

### 示例 2：纯文本 → 部分超链接

\\\`\\\`\\\`
oldStr:  "text": [\\n    "点击访问官网"\\n  ]
newStr:  "text": [\\n    "点击",\\n    {\\n      "i": "m",\\n      "iUrl": "https://remnote.com",\\n      "text": "访问官网"\\n    }\\n  ]
\\\`\\\`\\\`

### 示例 3：修改引用旁的文本

read_rem 返回：

\\\`\\\`\\\`json
  "text": [
    "参考 ",
    {
      "_id": "abc123",
      "i": "q"
    },
    " 的内容"
  ],
\\\`\\\`\\\`

只改文字部分（纯字符串可直接匹配）：

\\\`\\\`\\\`
oldStr:  " 的内容"
newStr:  " 的详细说明"
\\\`\\\`\\\`

如果 " 的内容" 出现多次导致多匹配，加上下文：

\\\`\\\`\\\`
oldStr:  "q"\\n    },\\n    " 的内容"
newStr:  "q"\\n    },\\n    " 的详细说明"
\\\`\\\`\\\`

### 示例 4：添加完形填空

\\\`\\\`\\\`
oldStr:  "text": [\\n    "光合作用需要阳光"\\n  ]
newStr:  "text": [\\n    "光合作用需要",\\n    {\\n      "cId": "cloze1",\\n      "i": "m",\\n      "text": "阳光"\\n    }\\n  ]
\\\`\\\`\\\`

### 示例 5：修改简单属性

\\\`\\\`\\\`
oldStr:  "type": "default"
newStr:  "type": "concept"
\\\`\\\`\\\`

\\\`\\\`\\\`
oldStr:  "highlightColor": null
newStr:  "highlightColor": "Red"
\\\`\\\`\\\`

\\\`\\\`\\\`
oldStr:  "practiceDirection": "forward"
newStr:  "practiceDirection": "both"
\\\`\\\`\\\`

---

## highlightColor vs h

| 属性 | 位置 | 值类型 | 作用范围 |
|:-----|:-----|:-------|:---------|
| \\\`highlightColor\\\` | RemObject 顶层字段 | 字符串（\\\`"Red"\\\`, \\\`"Blue"\\\` 等）或 \\\`null\\\` | 整行背景色 |
| \\\`h\\\` | RichText 元素内格式标记 | 数字 0-9（RemColor 枚举） | 行内文字片段 |

两者完全独立。\\\`highlightColor\\\` 通过 \\\`setHighlightColor()\\\` 写入，\\\`h\\\` 通过 \\\`setText()\\\` 随 RichText 一起写入。

---

## 常见错误

| 错误 | 原因 | 解决 |
|:-----|:-----|:-----|
| key 顺序错 | 写 \\\`{"text":"xx","i":"m"}\\\` 但实际是 \\\`{"i":"m","text":"xx"}\\\` | 按字母序排列 key |
| 缩进不匹配 | 空格数不对 | 仔细对照 read_rem 返回的缩进 |
| 混淆 highlightColor 和 h | 前者字符串 \\\`"Red"\\\`，后者数字 \\\`1\\\` | 参考上方对比表 |
| 漏 onlyAudio | \\\`i:"a"\\\` 的 \\\`onlyAudio\\\` 是必填 | true=音频，false=视频 |
| JSON 语法错 | 引号、逗号、括号不完整 | 检查替换边界 |
| Portal oldStr 不匹配 | Portal 编辑在简化 JSON 上匹配，不是完整 JSON | 检查 oldStr 是否匹配 9 字段简化 JSON |

---

## Portal 编辑

当被编辑的 Rem 是 Portal（type === 'portal'）时，edit_rem 自动切换到 Portal 专用路径。

**edit_rem 只能修改 Portal 的引用列表和位置属性。创建 Portal 和删除 Portal 请使用 \\\`edit_tree\\\`。**

### 操作目标：简化 JSON

Portal 的 str_replace 在 **9 字段简化 JSON** 上执行（而非完整 51 字段）：

\\\`\\\`\\\`json
{
  "id": "abc123",
  "type": "portal",
  "portalType": "portal",
  "portalDirectlyIncludedRem": ["remId1", "remId2"],
  "parent": "parentId",
  "positionAmongstSiblings": 3,
  "children": ["remId1", "remId2"],
  "createdAt": 1709000000000,
  "updatedAt": 1709000000000
}
\\\`\\\`\\\`

### 可写字段

| 字段 | 写入方式 |
|:-----|:---------|
| \\\`portalDirectlyIncludedRem\\\` | diff 数组 → addToPortal / removeFromPortal |
| \\\`parent\\\` | setParent() |
| \\\`positionAmongstSiblings\\\` | setParent(parent, position) |

其余字段（id、type、portalType、children、createdAt、updatedAt）为只读，修改只产生警告。

### 示例

添加引用：

\\\`\\\`\\\`
oldStr:  "portalDirectlyIncludedRem": ["remId1", "remId2"]
newStr:  "portalDirectlyIncludedRem": ["remId1", "remId2", "remId3"]
\\\`\\\`\\\`

移除引用：

\\\`\\\`\\\`
oldStr:  "portalDirectlyIncludedRem": ["remId1", "remId2"]
newStr:  "portalDirectlyIncludedRem": ["remId1"]
\\\`\\\`\\\`

---

## 缓存更新行为

| 场景 | 缓存 |
|:-----|:-----|
| 写入成功 | 从 Plugin 重新读取最新状态 → 覆盖缓存 |
| 防线 2 拒绝 | **不更新**缓存（迫使重新 read_rem） |
| 防线 3 拒绝 | 缓存不变（可调整 oldStr 重试） |
| 部分写入失败 | **不更新**缓存（迫使重新 read_rem） |

写入成功后**永远从 Plugin 重新读取**，不做本地推导，保证缓存与 SDK 状态完全同步。
`;
