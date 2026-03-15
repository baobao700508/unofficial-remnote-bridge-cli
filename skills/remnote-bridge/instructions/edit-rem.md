# edit-rem

> 直接修改单个 Rem 的属性字段。两道防线确保编辑安全。

---

## 功能

`edit-rem` 直接修改 Rem 的属性字段——通过 `changes` 对象指定要修改的字段及其新值，无需构造 str_replace。

核心特性：
- **直接字段修改**：传入 `{字段名: 新值}` 的 changes 对象
- **两道防线**：缓存存在性 → 乐观并发检测
- **字段白名单校验**：21 个可写字段通过，只读和未知字段产生警告
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
remnote-bridge edit-rem <remId> --changes '{"type":"concept"}'
```

| 参数/选项 | 类型 | 必需 | 说明 |
|-----------|------|:----:|------|
| `remId` | string（位置参数） | 是 | Rem ID |
| `--changes <changesJson>` | string | 是 | 要修改的字段及新值（JSON 字符串） |

输出示例（成功）：

```
已更新字段: text, fontSize
```

输出示例（无变更）：

```
无变更（未发现可写入的变更字段）
```

### JSON 模式

```bash
remnote-bridge edit-rem --json '{"remId":"kLrIOHJLyMd8Y2lyA","changes":{"type":"concept"}}'
```

---

## JSON 输入参数

| 字段 | 类型 | 必需 | 说明 |
|------|------|:----:|------|
| `remId` | string | 是 | Rem ID |
| `changes` | object | 是 | 要修改的字段及新值（键=字段名，值=新值） |

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

### 枚举值非法

```json
{
  "ok": false,
  "command": "edit-rem",
  "error": "Invalid value for 'type': \"invalid\". Allowed: \"concept\", \"descriptor\", \"default\"",
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

### 含未知字段警告

```json
{
  "ok": true,
  "command": "edit-rem",
  "changes": ["text"],
  "warnings": ["Field 'fooBar' is unknown and was ignored"],
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

---

## 内部流程

```
1. CLI 解析参数（remId, changes）
2. sendRequest → WS → daemon
3. daemon EditHandler:
   │
   ├─ 防线 1: 缓存存在性检查
   │   └─ cache.get('rem:' + remId) 为 null → 抛出错误
   │
   ├─ 防线 2: 乐观并发检测
   │   ├─ forwardToPlugin('read_rem', { remId }) → 获取当前 RemObject
   │   ├─ JSON.stringify 比较当前 vs 缓存
   │   └─ 不匹配 → 抛出错误（不更新缓存）
   │
   ├─ 遍历 changes keys
   │   ├─ READ_ONLY_FIELDS → warnings
   │   ├─ 不在 WRITABLE_FIELDS 中 → warnings
   │   └─ 通过 → writableChanges
   │
   ├─ 枚举值范围校验（type, practiceDirection, highlightColor, fontSize, todoStatus）
   │
   ├─ 语义校验：todoStatus 非 null 但 isTodo=false → 警告
   │
   ├─ 空变更检查 → 直接返回 ok
   │
   ├─ 发送到 Plugin
   │   ├─ forwardToPlugin('write_rem_fields', { remId, changes })
   │   └─ 首个失败即终止 → 返回 applied + failed
   │
   └─ 缓存更新
       ├─ 写入成功 → 从 Plugin re-read → 更新缓存
       └─ 写入失败 → 不更新缓存
```

---

## 两道防线详解

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
cachedJson = JSON.stringify(cachedObj, null, 2)

if currentJson !== cachedJson:
    // 不更新缓存 — 迫使 AI 重新 read 获取最新状态
    throw "Rem {remId} has been modified since last read. Please read it again before editing."
```

**关键设计**：
- 比较方式：**将当前 RemObject 和缓存 RemObject 分别 JSON.stringify 后做文本比较**
- 失败时**不更新缓存**：防止 AI 跳过 re-read 直接重试
- RichText key 排序保证序列化确定性（`sortRichTextKeys()`）

**恢复方式**：执行 `read-rem <remId>` 获取最新状态后重试。

### 两道防线判断树

```
edit-rem(remId, changes)
│
├─ 防线 1: 缓存存在？
│   ├─ 否 → ERROR: "has not been read yet"
│   └─ 是 → 继续
│
├─ 防线 2: 当前值 === 缓存值？
│   ├─ 否 → ERROR: "has been modified since last read"
│   └─ 是 → 继续
│
├─ 字段分类
│   ├─ 只读字段 → 警告
│   ├─ 未知字段 → 警告
│   └─ 可写字段 → 继续
│
├─ 枚举校验通过？
│   ├─ 否 → ERROR: "Invalid value for..."
│   └─ 是 → 继续
│
├─ 有可写变更？
│   ├─ 否 → OK: changes=[]
│   └─ 是 → 发送到 Plugin
│
└─ Plugin 写入结果？
    ├─ 全部成功 → 更新缓存 → OK: changes=[...]
    └─ 部分失败 → 不更新缓存 → ERROR
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

以下 30 个字段在 changes 中出现时，**只产生警告，不执行写入**：

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

## changes 对象使用指南

### 简单属性修改

```json
{"type": "concept"}
{"highlightColor": "Yellow"}
{"fontSize": "H1"}
{"isTodo": true, "todoStatus": "Unfinished"}
```

### 多字段批量修改

```json
{
  "type": "concept",
  "highlightColor": "Yellow",
  "fontSize": "H1",
  "isTodo": true,
  "todoStatus": "Unfinished"
}
```

### RichText 修改（text / backText）

传入完整的 RichText 数组作为 text 或 backText 的新值：

```json
{"text": ["新文本内容"]}
{"text": [{"b": true, "i": "m", "text": "粗体文本"}]}
{"text": ["普通文本", {"i": "m", "iUrl": "https://example.com", "text": "超链接"}]}
{"backText": ["背面答案"]}
{"backText": null}
```

**RichText 编辑要点**：
- RichText 是 JSON 数组，元素为纯字符串或格式化对象
- 格式化对象的 key 按**字母序**排列（`_id` < `b` < `i` < `text`）
- 修改 text/backText 时，传入的是**完整的新数组**，不是部分替换

### Tags Diff 操作

传入完整的目标 tags 数组，系统自动计算差异并执行增删：

```json
{"tags": ["tagId1", "tagId2", "newTagId3"]}
```

### Portal 引用列表修改

仅 type=portal 的 Rem 可修改此字段：

```json
{"portalDirectlyIncludedRem": ["remId1", "remId2", "newRemId3"]}
```

---

## highlightColor vs h

两种完全不同的高亮机制，不可混淆：

| 属性 | 位置 | 值类型 | 效果 | 修改方式 |
|:-----|:-----|:-------|:-----|:---------|
| `highlightColor` | RemObject 顶层字段 | 字符串 `"Red"`/`"Yellow"` 等，或 `null` | 整行背景色（左侧彩色竖条） | changes 中直接设置 |
| `h` | RichText 元素内部 | 数字 0-9 | 文字片段的荧光底色 | 在 text 数组的 RichText 对象中设置 |

### RichText `h` 颜色值对照表（必须用数字，不是字符串）

| 值 | 颜色 | 值 | 颜色 | 值 | 颜色 |
|:---|:-----|:---|:-----|:---|:-----|
| 0 | 无（默认） | 4 | Green | 7 | Gray |
| 1 | Red | 5 | Purple | 8 | Brown |
| 2 | Orange | 6 | Blue | 9 | Pink |
| 3 | Yellow | — | — | — | — |

### 设置/清除整行背景色（highlightColor）

```json
{"highlightColor": "Yellow"}
{"highlightColor": null}
```

### 给文字加/去荧光底色（RichText h 字段）

通过修改 text 数组中 RichText 对象的 `h` 值实现。需要传入包含完整 text 数组的 changes：

```json
{
  "text": [
    {
      "h": 3,
      "i": "m",
      "text": "黄色荧光文字"
    }
  ]
}
```

---

## 缓存更新行为

| 场景 | 缓存行为 | 原因 |
|------|----------|------|
| 写入成功 | 从 Plugin re-read 最新状态 → 覆盖缓存 | 确保缓存与 SDK 状态同步 |
| 防线 1 拒绝 | 无缓存，不操作 | — |
| 防线 2 拒绝 | **不更新缓存** | 迫使 AI 执行 read-rem 获取最新状态 |
| 枚举值非法 | 缓存保持不变 | AI 可调整值后重试 |
| 部分写入失败 | **不更新缓存** | 迫使 AI 执行 read-rem 重新评估状态 |

**关键设计**：写入成功后**永远从 Plugin 重新读取**最新状态，而非本地推导修改后的值。这保证缓存与实际 SDK 状态完全同步。

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
| `Invalid value for '...'` | 枚举字段的值不在允许范围内 | 检查允许的枚举值（见可编辑字段约束表） |
| `Failed to update field` | SDK setter 调用失败 | 检查字段值是否在允许范围内（如 type 不能设为 portal） |
| `Field '...' is read-only and was ignored` | changes 中包含只读字段 | 该字段只能读取，不可通过 edit-rem 修改 |
| `Field '...' is unknown and was ignored` | changes 中包含不存在的字段名 | 检查字段名拼写，确认在 21 个可写字段或 30 个只读字段中 |
| `守护进程未运行` | daemon 未启动 | 执行 `remnote-bridge connect` |
