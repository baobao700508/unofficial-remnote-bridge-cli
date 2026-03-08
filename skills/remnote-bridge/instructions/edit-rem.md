# edit-rem

> 通过 str_replace 语义修改单个 Rem 的属性。三道防线确保编辑安全。

---

## 功能

`edit-rem` 使用 str_replace 语义修改 Rem 属性——在 Rem 的序列化 JSON 文本中，将 `oldStr` 替换为 `newStr`，然后推导出变更字段并写入 SDK。

核心特性：
- **str_replace 语义**：操作对象是 `JSON.stringify(remObject, null, 2)` 的文本
- **三道防线**：缓存存在性 → 乐观并发检测 → 精确匹配校验
- **前置条件**：必须先 `read-rem` 建立缓存，否则防线 1 拒绝

---

## 前置条件

`edit-rem` 依赖 `read-rem` 的缓存。工作流程为：

```
1. read-rem <remId>     → 读取 Rem，缓存到 daemon 内存
2. edit-rem <remId> ... → 基于缓存执行编辑
```

跳过 `read-rem` 直接调用 `edit-rem` 会触发防线 1 错误。

---

## 用法

### 人类模式

```bash
remnote-bridge edit-rem <remId> --old-str <oldStr> --new-str <newStr>
```

| 参数/选项 | 类型 | 必需 | 说明 |
|-----------|------|:----:|------|
| `remId` | string（位置参数） | 是 | Rem ID |
| `--old-str <oldStr>` | string | 是 | 要替换的原始文本片段 |
| `--new-str <newStr>` | string | 是 | 替换后的新文本片段 |

输出示例（成功）：

```
已更新字段: text, fontSize
```

输出示例（无变更）：

```
无变更（old_str 和 new_str 产生相同结果）
```

### JSON 模式

```bash
remnote-bridge edit-rem --json '{"remId":"kLrIOHJLyMd8Y2lyA","oldStr":"\"concept\"","newStr":"\"descriptor\""}'
```

---

## JSON 输入参数

| 字段 | 类型 | 必需 | 说明 |
|------|------|:----:|------|
| `remId` | string | 是 | Rem ID |
| `oldStr` | string | 是 | 要替换的原始文本片段（在序列化 JSON 中精确匹配） |
| `newStr` | string | 是 | 替换后的新文本片段 |

---

## JSON 输出

### 成功（有变更）

```json
{
  "ok": true,
  "command": "edit-rem",
  "changes": ["text", "fontSize"],
  "warnings": [],
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

### 成功（无变更）

```json
{
  "ok": true,
  "command": "edit-rem",
  "changes": [],
  "warnings": [],
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

### 防线 1 拒绝：未先 read

```json
{
  "ok": false,
  "command": "edit-rem",
  "error": "Rem kLrIOHJLyMd8Y2lyA has not been read yet. Read it first before editing.",
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

### 防线 2 拒绝：并发修改

```json
{
  "ok": false,
  "command": "edit-rem",
  "error": "Rem kLrIOHJLyMd8Y2lyA has been modified since last read. Please read it again before editing.",
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

### 防线 3 拒绝：old_str 未找到

```json
{
  "ok": false,
  "command": "edit-rem",
  "error": "old_str not found in the serialized JSON of rem kLrIOHJLyMd8Y2lyA",
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

### 防线 3 拒绝：old_str 多次匹配

```json
{
  "ok": false,
  "command": "edit-rem",
  "error": "old_str matches 3 locations in rem kLrIOHJLyMd8Y2lyA. Make old_str more specific to match exactly once.",
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

### 后处理：替换产生非法 JSON

```json
{
  "ok": false,
  "command": "edit-rem",
  "error": "The replacement produced invalid JSON. Check your new_str for syntax errors.",
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

### 部分写入失败

```json
{
  "ok": false,
  "command": "edit-rem",
  "changes": [],
  "warnings": [],
  "error": "Failed to update field 'type': Portal 不可通过 setType() 设置，只能通过 createPortal() 创建",
  "appliedChanges": ["text"],
  "failedField": "type",
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

### 含只读字段警告

```json
{
  "ok": true,
  "command": "edit-rem",
  "changes": ["text"],
  "warnings": ["Field 'children' is read-only and was ignored"],
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

---

## 内部流程

```
1. CLI 解析参数（remId, oldStr, newStr）
2. sendRequest → WS → daemon
3. daemon EditHandler:
   │
   ├─ 防线 1: 缓存存在性检查
   │   └─ cache.get('rem:' + remId) 为 null → 抛出错误
   │
   ├─ 防线 2: 乐观并发检测
   │   ├─ forwardToPlugin('read_rem', { remId }) → 获取当前 RemObject
   │   ├─ JSON.stringify(currentRemObject, null, 2)
   │   ├─ 与缓存 JSON 严格比较
   │   └─ 不匹配 → 抛出错误（不更新缓存，迫使 AI re-read）
   │
   ├─ Portal 检测：type === 'portal'？
   │   ├─ 是 → 进入 Portal 专用路径（简化 JSON 上执行 str_replace）
   │   └─ 否 → 继续普通 Rem 路径
   │
   ├─ 防线 3: str_replace 精确匹配
   │   ├─ countOccurrences(cachedJson, oldStr)
   │   ├─ 0 次 → 抛出"未找到"错误
   │   ├─ >1 次 → 抛出"多次匹配"错误
   │   └─ 恰好 1 次 → cachedJson.replace(oldStr, newStr)
   │
   ├─ 后处理校验
   │   ├─ JSON.parse(modifiedJson) → 失败则抛"非法 JSON"错误
   │   ├─ 逐字段对比 original vs modified
   │   ├─ READ_ONLY_FIELDS → 产生警告，不执行写入
   │   ├─ 语义校验：todoStatus 非 null 但 isTodo=false → 警告
   │   └─ 无变更 → 返回 ok=true, changes=[]
   │
   ├─ 发送到 Plugin
   │   ├─ forwardToPlugin('write_rem_fields', { remId, changes })
   │   ├─ Plugin 逐字段调用 SDK setter
   │   └─ 首个失败即终止 → 返回 applied + failed
   │
   └─ 缓存更新
       ├─ 写入成功 → 从 Plugin re-read 最新状态 → 更新缓存
       └─ 写入失败 → 不更新缓存（迫使 AI re-read）
```

---

## 三道防线详解

### 防线 1：缓存存在性检查

**目的**：强制 AI 先 `read-rem` 再 `edit-rem`，建立编辑上下文。

```
if cache.get('rem:' + remId) === null:
    throw "Rem {remId} has not been read yet. Read it first before editing."
```

**触发条件**：
- 从未对该 remId 执行过 `read-rem`
- daemon 重启后缓存已清空

**恢复方式**：执行 `read-rem <remId>` 后重试。

### 防线 2：乐观并发检测

**目的**：检测自上次 read 以来，Rem 是否被外部修改（如用户在 RemNote UI 中编辑、其他 Agent 修改等）。

```
currentRemObject = forwardToPlugin('read_rem', { remId })
currentJson = JSON.stringify(currentRemObject, null, 2)

if currentJson !== cachedJson:
    // 不更新缓存 — 迫使 AI 重新 read 获取最新状态
    throw "Rem {remId} has been modified since last read. Please read it again before editing."
```

**关键设计**：
- 比较方式：**整个 JSON 文本严格二进制比较**（包括格式化空白）
- 失败时**不更新缓存**：防止 AI 跳过 re-read 直接重试
- RichText key 排序保证序列化确定性（`sortRichTextKeys()`）

**恢复方式**：执行 `read-rem <remId>` 获取最新状态后重试。

### 防线 3：str_replace 精确匹配

**目的**：确保替换精确定位到唯一位置，避免意外修改。

```
function countOccurrences(haystack, needle):
    count = 0, pos = 0
    while true:
        pos = haystack.indexOf(needle, pos)
        if pos === -1: break
        count++
        pos += needle.length    // 非重叠匹配
    return count

matchCount = countOccurrences(cachedJson, oldStr)

switch matchCount:
    case 0:  throw "old_str not found in the serialized JSON of rem {remId}"
    case 1:  modifiedJson = cachedJson.replace(oldStr, newStr)    // 执行替换
    default: throw "old_str matches {matchCount} locations in rem {remId}. Make old_str more specific to match exactly once."
```

**后处理校验**：

```
// 1. JSON 语法检查
modified = JSON.parse(modifiedJson)
// 失败 → throw "The replacement produced invalid JSON. Check your new_str for syntax errors."

// 2. 推导变更字段
for key in modified:
    if modified[key] !== original[key]:
        if key in READ_ONLY_FIELDS:
            warnings.push("Field '{key}' is read-only and was ignored")
        else:
            changes[key] = modified[key]

// 3. 语义校验
if 'todoStatus' in changes && todoStatus !== null && !isTodo:
    warnings.push("Setting 'todoStatus' without 'isTodo: true' may have no effect")

// 4. 空变更
if changes is empty: return { ok: true, changes: [], warnings }
```

### 三道防线判断树

```
edit-rem(remId, oldStr, newStr)
│
├─ 防线 1: 缓存存在？
│   ├─ 否 → ERROR: "has not been read yet"
│   └─ 是 → 继续
│
├─ 防线 2: 当前值 === 缓存值？
│   ├─ 否 → ERROR: "has been modified since last read"
│   └─ 是 → 继续
│
├─ 防线 3: old_str 匹配次数？
│   ├─ 0 次 → ERROR: "old_str not found"
│   ├─ >1 次 → ERROR: "old_str matches N locations"
│   └─ 1 次 → 执行替换
│
├─ 后处理: JSON 合法？
│   ├─ 否 → ERROR: "invalid JSON"
│   └─ 是 → 推导变更字段
│
├─ 有变更？
│   ├─ 否 → OK: changes=[]
│   └─ 是 → 发送到 Plugin
│
└─ Plugin 写入结果？
    ├─ 全部成功 → 更新缓存 → OK: changes=[...]
    └─ 部分失败 → 不更新缓存 → ERROR: failed field info
```

---

## Portal 编辑专用路径

当 edit-rem 检测到被编辑的 Rem 是 Portal（`type === 'portal'`）时，自动切换到 Portal 专用编辑路径。

### 简化 JSON 作为操作目标

**问题**：缓存中存储完整 51 字段 JSON，但 AI 看到的是 9 字段简化 JSON。oldStr 来自简化输出，在完整 JSON 上匹配不到。

**方案**：Portal 路径在**简化 JSON**（9 字段）上执行 str_replace：

1. 防线 1 + 2：不变（完整 JSON 对比）
2. **str_replace**：将缓存的完整 JSON 转换为简化 JSON，在简化 JSON 上执行 str_replace
3. 解析 str_replace 后的简化 JSON，推导变更字段
4. 调用写入

### Portal 简化 JSON 格式

```json
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
```

### Portal 可写字段

| 字段 | 写入方式 |
|:-----|:---------|
| `portalDirectlyIncludedRem` | diff 数组，新增调 `addToPortal()`，移除调 `removeFromPortal()` |
| `parent` | 调 `setParent()` |
| `positionAmongstSiblings` | 调 `setParent(parent, position)` |

### Portal 只读字段

id、type、portalType、children、createdAt、updatedAt — 修改只产生警告。

### Portal 编辑示例

```bash
# 添加一个引用
edit-rem abc123 --old-str '"portalDirectlyIncludedRem": ["remId1", "remId2"]' \
                --new-str '"portalDirectlyIncludedRem": ["remId1", "remId2", "remId3"]'

# 移除一个引用
edit-rem abc123 --old-str '"portalDirectlyIncludedRem": ["remId1", "remId2"]' \
                --new-str '"portalDirectlyIncludedRem": ["remId1"]'
```

---

## 可编辑字段约束表

RemObject 51 个字段中，21 个可编辑（RW），30 个只读（R + R-F）。

以下为 21 个可编辑字段及其写入约束：

| 字段 | SDK setter | 值类型 | 约束 / 特殊处理 |
|------|-----------|--------|-----------------|
| `text` | `rem.setText()` | RichText | RichText 数组 |
| `backText` | `rem.setBackText()` | RichText \| null | null → `setBackText([])`（清除背面）；字符串 → 包装为 `[string]` |
| `type` | `rem.setType()` | RemTypeValue | `portal` 不可设置（只能通过 `createPortal()` 创建） |
| `isDocument` | `rem.setIsDocument()` | boolean | — |
| `parent` | `rem.setParent(parentId, position?)` | string \| null | 与 `positionAmongstSiblings` 联动（见下方说明） |
| `fontSize` | `rem.setFontSize()` | FontSize \| null | null → `setFontSize(undefined)`（恢复普通大小） |
| `highlightColor` | `rem.setHighlightColor()` / `rem.removePowerup('h')` | HighlightColor \| null | null → `removePowerup('h')`（SDK 不接受 null） |
| `isTodo` | `rem.setIsTodo()` | boolean | 设为 true 时自动初始化 todoStatus |
| `todoStatus` | `rem.setTodoStatus()` | TodoStatus \| null | null → 跳过（清除 todo 应通过 `isTodo=false`） |
| `isCode` | `rem.setIsCode()` | boolean | — |
| `isQuote` | `rem.setIsQuote()` | boolean | — |
| `isListItem` | `rem.setIsListItem()` | boolean | — |
| `isCardItem` | `rem.setIsCardItem()` | boolean | — |
| `isSlot` | `rem.setIsSlot()` | boolean | 与 `isProperty` 底层相同 |
| `isProperty` | `rem.setIsProperty()` | boolean | 与 `isSlot` 底层相同 |
| `enablePractice` | `rem.setEnablePractice()` | boolean | — |
| `practiceDirection` | `rem.setPracticeDirection()` | PracticeDirection | `forward` / `backward` / `both` / `none` |
| `tags` | `rem.addTag()` / `rem.removeTag()` | string[] | **Diff 机制**：对比当前 vs 目标，增删差异项 |
| `sources` | `rem.addSource()` / `rem.removeSource()` | string[] | **Diff 机制**：对比当前 vs 目标，增删差异项 |
| `positionAmongstSiblings` | `rem.setParent(parent, position)` | number \| null | 与 `parent` 联动（见下方说明） |
| `portalDirectlyIncludedRem` | `rem.addToPortal()` / `rem.removeFromPortal()` | string[] | **Portal-W Diff 机制**：仅 type=portal 时可修改。对比当前 vs 目标数组，逐项增删 |

### parent + positionAmongstSiblings 联动

这两个字段通过同一个 SDK 调用 `rem.setParent(parentId, position)` 写入：

| 场景 | 行为 |
|------|------|
| 两个字段都变更 | 合并为一次 `setParent(newParent, newPosition)` 调用 |
| 只有 `parent` 变更 | `setParent(newParent)` 不带 position（保持末尾） |
| 只有 `positionAmongstSiblings` 变更 | 获取当前 parent → `setParent(currentParent, newPosition)` |

### tags / sources Diff 机制

写入 `tags` 或 `sources` 时，不是整体替换，而是计算差异：

```
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
```

---

## 只读字段列表

以下 30 个字段在 str_replace 中被修改时，**只产生警告，不执行写入**：

```
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
```

警告格式：`"Field '{fieldName}' is read-only and was ignored"`

---

## str_replace 语义详解

### 操作对象

str_replace 操作的对象是 `JSON.stringify(remObject, null, 2)` 的文本——格式化缩进 2 空格的 JSON。

示例（部分）：

```json
{
  "id": "kLrIOHJLyMd8Y2lyA",
  "text": [
    "Hello World"
  ],
  "type": "concept",
  "fontSize": null,
  "isTodo": false
}
```

### 匹配规则

- **非重叠匹配**：与 `String.prototype.replace()` 行为一致
- **必须恰好匹配一次**：0 次=未找到错误，>1 次=多匹配错误
- **大小写敏感**：精确匹配，无模糊匹配

### 使用技巧

1. **包含足够上下文**：oldStr 应包含字段名和前后结构，避免模糊匹配

   ```
   正确: "\"type\": \"concept\""  → 匹配字段名+值
   错误: "concept"                → 可能匹配到 text 内容中的 "concept"
   ```

2. **替换后必须是合法 JSON**：检查引号、逗号、括号的完整性

3. **修改 RichText 字段**：直接操作 JSON 数组结构（见下方完整示例）

---

## RichText 编辑实战指南

### 理解格式化 JSON 中的 RichText

`edit-rem` 的 str_replace 操作对象是 `JSON.stringify(remObject, null, 2)` 的格式化文本。RichText 数组在格式化后是多行缩进结构，**不是**紧凑的单行 JSON。

以下是一个包含 RichText 的 RemObject **实际输出片段**：

```json
{
  "id": "kLrIOHJLyMd8Y2lyA",
  "text": [
    "这是",
    {
      "b": true,
      "i": "m",
      "text": "粗体"
    },
    "普通文本"
  ],
  "backText": null,
  "type": "concept",
  "highlightColor": null,
  "isTodo": false
}
```

**关键要点**：
- RichText 对象内部的 key 按**字母序**排列（`b` < `i` < `text`），由 Plugin 端 `sortRichTextKeys()` 保证
- `_id` 中的 `_` 在 Unicode 中排在小写字母之前，所以 `_id` 排在所有小写 key 的最前面
- 每个 key-value 对占一行，缩进 4 空格（对象在数组中时嵌套 2+2）
- 纯字符串元素直接是 `"字符串"`，对象元素展开为多行

### 示例 1：将纯文本改为粗体

**read-rem 返回**（部分）：

```json
  "text": [
    "普通标题"
  ],
```

**edit-rem 调用**：

```
oldStr:  "\"text\": [\n    \"普通标题\"\n  ]"

newStr:  "\"text\": [\n    {\n      \"b\": true,\n      \"i\": \"m\",\n      \"text\": \"粗体标题\"\n    }\n  ]"
```

替换后 JSON 变为：

```json
  "text": [
    {
      "b": true,
      "i": "m",
      "text": "粗体标题"
    }
  ],
```

### 示例 2：修改 Rem 引用旁的文本

**read-rem 返回**（部分）：

```json
  "text": [
    "参考 ",
    {
      "_id": "abc123",
      "i": "q"
    },
    " 的内容"
  ],
```

将 " 的内容" 替换为 " 的详细说明"：

```
oldStr:  " 的内容"
newStr:  " 的详细说明"
```

> 注意：纯字符串可以直接匹配，不需要包含数组结构。但如果 " 的内容" 在 JSON 中出现多次，需要加上下文：
> `oldStr: "    \" 的内容\"\n  ]"`

### 示例 3：给文本添加超链接

**read-rem 返回**（部分）：

```json
  "text": [
    "点击访问官网"
  ],
```

**edit-rem 调用**：

```
oldStr:  "\"text\": [\n    \"点击访问官网\"\n  ]"

newStr:  "\"text\": [\n    \"点击\",\n    {\n      \"i\": \"m\",\n      \"iUrl\": \"https://remnote.com\",\n      \"text\": \"访问官网\"\n    }\n  ]"
```

### 示例 4：修改高亮颜色（Rem 级别 vs RichText 级别）

**Rem 级别的 `highlightColor`**（整行背景色，值为英文字符串）：

```
oldStr:  "\"highlightColor\": null"
newStr:  "\"highlightColor\": \"Red\""
```

**RichText 级别的 `h`**（行内文字高亮，值为数字 0-9）：

```
oldStr:  "\"text\": [\n    \"普通文本\"\n  ]"
newStr:  "\"text\": [\n    {\n      \"h\": 1,\n      \"i\": \"m\",\n      \"text\": \"红色高亮文本\"\n    }\n  ]"
```

> **区分**：`highlightColor` 是 RemObject 顶层字段，值为字符串（`"Red"`, `"Blue"` 等）；RichText 的 `h` 是行内格式标记，值为数字（1=Red, 2=Orange 等，见 RemColor 枚举）。

### 示例 5：添加完形填空

**read-rem 返回**（部分）：

```json
  "text": [
    "光合作用需要阳光"
  ],
```

将 "阳光" 变成完形填空：

```
oldStr:  "\"text\": [\n    \"光合作用需要阳光\"\n  ]"

newStr:  "\"text\": [\n    \"光合作用需要\",\n    {\n      \"cId\": \"cloze1\",\n      \"i\": \"m\",\n      \"text\": \"阳光\"\n    }\n  ]"
```

### 常见错误

1. **忘记 key 字母序**：写 `{"text":"xx","i":"m","b":true}` 不会被匹配——实际存储为 `{"b":true,"i":"m","text":"xx"}`
2. **缩进不匹配**：格式化 JSON 使用 2 空格缩进，数组内对象的 key 缩进 6 空格（顶层 2 + 数组 2 + 对象 2），但在 `JSON.stringify(obj, null, 2)` 中数组元素的对象缩进 4 空格（数组 2 + 对象内 2）
3. **混淆 highlightColor 和 h**：前者是字符串 `"Red"`，后者是数字 `1`
4. **忘记 `i:"a"` 的 `onlyAudio` 必填**：缺少此字段 SDK 拒绝写入

---

## 缓存更新行为

| 场景 | 缓存行为 | 原因 |
|------|----------|------|
| 写入成功 | 从 Plugin re-read 最新状态 → 覆盖缓存 | 确保缓存与 SDK 状态同步 |
| 防线 1 拒绝 | 无缓存，不操作 | — |
| 防线 2 拒绝 | **不更新缓存** | 迫使 AI 执行 read-rem 获取最新状态 |
| 防线 3 拒绝 | 缓存保持不变 | AI 可调整 oldStr 后重试 |
| JSON 语法错误 | 缓存保持不变 | AI 可调整 newStr 后重试 |
| 部分写入失败 | **不更新缓存** | 迫使 AI 执行 read-rem 重新评估状态 |

**关键设计**：写入成功后**永远从 Plugin 重新读取**最新状态，而非本地推导修改后的 JSON。这保证缓存与实际 SDK 状态完全同步。

---

## 退出码

| 退出码 | 含义 | 触发条件 |
|:------:|------|----------|
| 0 | 成功 | 编辑成功（含无变更场景） |
| 1 | 业务错误 | 防线拒绝、写入失败、参数缺失等 |
| 2 | daemon 不可达 | daemon 未运行或 WS 连接失败 |

---

## 常见错误诊断

| 错误消息 | 原因 | 解决方案 |
|----------|------|----------|
| `has not been read yet` | 未先执行 read-rem | 执行 `read-rem <remId>` 后重试 |
| `has been modified since last read` | Rem 在 read 和 edit 之间被外部修改 | 执行 `read-rem <remId>` 获取最新状态后重试 |
| `old_str not found` | oldStr 在序列化 JSON 中不存在 | 检查 oldStr 是否精确匹配（含引号、空格、换行） |
| `old_str matches N locations` | oldStr 匹配到多个位置 | 扩大 oldStr 范围，包含更多上下文以唯一定位 |
| `invalid JSON` | 替换后的文本不是合法 JSON | 检查 newStr 的引号、逗号、括号完整性 |
| `Failed to update field` | SDK setter 调用失败 | 检查字段值是否在允许范围内（如 type 不能设为 portal） |
| `Field '...' is read-only and was ignored` | 修改了只读字段 | 该字段只能读取，不可通过 edit-rem 修改 |
| `old_str not found in the simplified Portal JSON` | Portal 编辑时 oldStr 在简化 JSON 中不匹配 | 检查 oldStr 是否匹配 9 字段简化 JSON 格式（而非完整 51 字段 JSON） |
| `守护进程未运行` | daemon 未启动 | 执行 `remnote-bridge connect` |
