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
remnote edit-rem <remId> --old-str <oldStr> --new-str <newStr>
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
remnote edit-rem --json '{"remId":"kLrIOHJLyMd8Y2lyA","oldStr":"\"concept\"","newStr":"\"descriptor\""}'
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

## 可编辑字段约束表

RemObject 51 个字段中，20 个可编辑（RW），31 个只读（R + R-F）。

以下为 20 个可编辑字段及其写入约束：

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

以下 31 个字段在 str_replace 中被修改时，**只产生警告，不执行写入**：

```
id,
children,
isTable,
portalType, portalDirectlyIncludedRem,
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

3. **修改 RichText 字段**：直接操作 JSON 数组结构

   ```
   oldStr: "\"text\": [\n    \"Hello\"\n  ]"
   newStr: "\"text\": [\n    \"World\"\n  ]"
   ```

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
| `守护进程未运行` | daemon 未启动 | 执行 `remnote connect` |
