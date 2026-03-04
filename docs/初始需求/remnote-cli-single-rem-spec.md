# RemNote CLI - 单 Rem 模式读写规范

## 概述

单 Rem 模式是 RemNote CLI 的精细编辑模式。在此模式下，一个 Rem 被视为一个完整的对象（JSON），AI 通过 str_replace 模式直接编辑该对象的序列化文本，CLI 负责解析变更并通过 RemNote Plugin 调用 SDK 写回。

### 核心思路

- RemNote 中一行就是一个 Rem，一个 Rem 就是一个对象
- read 返回单个 Rem 对象的完整 JSON 序列化
- write 使用 str_replace（old_str → new_str）编辑该 JSON
- CLI 对比修改前后的 JSON，推导出变更字段，通过 Plugin 调用对应的 RemNote SDK 方法写回
- 不依赖 bash、代码执行环境，纯 CLI 命令调用，所有 AI 客户端通用

### 与多 Rem 模式的关系

| 维度 | 单 Rem 模式（本文档） | 多 Rem 模式（另文档） |
|------|----------------------|----------------------|
| 粒度 | 单个 Rem 对象 | Rem 子树（文档/大纲） |
| 格式 | JSON（原始对象） | Markdown 或 HTML |
| 编辑方式 | str_replace 对象字段 | str_replace 文档文本 |
| 适用场景 | 精细控制属性、RichText 元素级操作 | 批量内容编辑、大纲重组 |
| CLI 端复杂度 | 低（字段级 diff） | 高（树 diff + 多 Rem 写回） |

---

## 数据模型：Rem 对象结构

> **注意**：Rem 对象的完整字段定义见 `remnote-plugin/src/types.ts`（RemObject 接口），
> 基于 SDK 实际能力和 UI 行为实测确定（2026-03-03）。
> 共 51 个字段：21 个 [RW] + 13 个 [R] + 17 个 [R-F]。
> 字段映射参考：`docs/rem-object-field-mapping.md`。

---

## 命令定义

### `read-rem` — 读取单个 Rem 对象

```
remnote-cli read-rem <remId> [--fields text,tags,type] [--full] [--json]
```

| 参数 | 说明 |
|------|------|
| `remId` | 要读取的 Rem 的 ID |
| `--fields` | 可选。指定只返回哪些字段，减少输出量。如 `--fields text,tags,type`。不指定则返回默认字段集。 |
| `--full` | 可选。输出全部 51 个字段。默认只输出 34 个常用字段（21 个 [RW] + 13 个 [R]），省略 17 个低频只读 [R-F] 字段。 |
| `--json` | 结构化 JSON 输出 |

> **输出模式决策**（2026-03-03）：
> RemObject 共 51 个字段，分三档标注（定义见 `remnote-plugin/src/types.ts`）：
> - **[RW] 21 个**：可读可写，默认输出
> - **[R] 13 个**：只读，默认输出（id、children、createdAt、updatedAt、remsBeingReferenced、remsReferencingThis、taggedRem、descendants、siblingRem、portalType、portalDirectlyIncludedRem、propertyType、isTable）
> - **[R-F] 17 个**：只读，仅 `--full` 输出（deepRemsBeingReferenced、ancestorTagRem、descendantTagRem、portalsAndDocumentsIn、allRemInDocumentOrPortal、allRemInFolderQueue、timesSelectedInSearch、lastTimeMovedTo、schemaVersion、embeddedQueueViewMode、localUpdatedAt、lastPracticed、isPowerup、isPowerupEnum、isPowerupProperty、isPowerupPropertyListItem、isPowerupSlot）

**返回示例**（默认模式，34 个字段）：

```json
{
  "id": "rem_abc123",
  "text": [
    "机器学习是一种",
    { "i": "m", "text": "人工智能", "b": true },
    "的分支"
  ],
  "backText": null,
  "type": "concept",
  "isDocument": false,
  "parent": "rem_parent_001",
  "children": ["rem_child_001", "rem_child_002"],
  "fontSize": null,
  "highlightColor": null,
  "isTodo": false,
  "todoStatus": null,
  "isCode": false,
  "isQuote": false,
  "isListItem": false,
  "isCardItem": false,
  "isTable": false,
  "isSlot": false,
  "isProperty": false,
  "enablePractice": false,
  "practiceDirection": "forward",
  "tags": ["rem_tag_ai", "rem_tag_ml"],
  "sources": [],
  "aliases": [],
  "positionAmongstSiblings": 0,
  "remsBeingReferenced": [],
  "remsReferencingThis": [],
  "taggedRem": [],
  "descendants": ["rem_child_001", "rem_child_002"],
  "siblingRem": ["rem_sibling_001"],
  "portalType": null,
  "portalDirectlyIncludedRem": [],
  "propertyType": null,
  "createdAt": 1705312200000,
  "updatedAt": 1709301720000
}
```

**返回示例**（`--full` 模式额外包含的 [R-F] 字段）：

```json
{
  "...默认字段...",
  "deepRemsBeingReferenced": [],
  "ancestorTagRem": [],
  "descendantTagRem": [],
  "portalsAndDocumentsIn": [],
  "allRemInDocumentOrPortal": [],
  "allRemInFolderQueue": [],
  "timesSelectedInSearch": 5,
  "lastTimeMovedTo": 1709301720000,
  "schemaVersion": 1,
  "embeddedQueueViewMode": false,
  "localUpdatedAt": 1709301720000,
  "lastPracticed": 0,
  "isPowerup": false,
  "isPowerupEnum": false,
  "isPowerupProperty": false,
  "isPowerupPropertyListItem": false,
  "isPowerupSlot": false
}
```

### `edit-rem` — str_replace 编辑单个 Rem 对象

```
remnote-cli edit-rem <remId> --old-str <old_str> --new-str <new_str> [--json]
```

| 参数 | 说明 |
|------|------|
| `remId` | 要编辑的 Rem 的 ID |
| `--old-str` | 要替换的原始文本片段。必须在该 Rem 的 JSON 序列化中精确且唯一地出现。 |
| `--new-str` | 替换后的新文本片段。 |
| `--json` | 结构化 JSON 输出 |

---

## 编辑示例

### 示例 1：修改纯文本内容

将"机器学习"改为"深度学习"：

```
remnote-cli edit-rem rem_abc123 \
  --old-str '"机器学习是一种"' \
  --new-str '"深度学习是一种"'
```

CLI 端动作：检测到 `text` 数组中第 0 个元素变更 → 通过 Plugin 调用 `rem.setText(newRichText)`。

### 示例 2：修改 RichText 元素样式

将粗体"人工智能"改为粗体+红色高亮：

```
remnote-cli edit-rem rem_abc123 \
  --old-str '{ "text": "人工智能", "b": true }' \
  --new-str '{ "text": "人工智能", "b": true, "h": "red" }'
```

CLI 端动作：检测到 `text` 数组中第 1 个元素变更 → 通过 Plugin 调用 `rem.setText(newRichText)`。

### 示例 3：添加新的 RichText 元素

在末尾追加一段文本：

```
remnote-cli edit-rem rem_abc123 \
  --old-str '{ "type": "latex", "text": "E=mc^2" }\n  ]' \
  --new-str '{ "type": "latex", "text": "E=mc^2" },\n    "，这是基础公式"\n  ]'
```

CLI 端动作：检测到 `text` 数组新增元素 → 通过 Plugin 调用 `rem.setText(newRichText)`。

### 示例 4：修改高亮颜色

给 Rem 添加红色高亮：

```
remnote-cli edit-rem rem_abc123 \
  --old-str '"highlightColor": null' \
  --new-str '"highlightColor": "Red"'
```

CLI 端动作：检测到 `highlightColor` 变更 → 通过 Plugin 调用 `rem.setHighlightColor("Red")`。

### 示例 5：修改标签

添加一个新标签：

```
remnote-cli edit-rem rem_abc123 \
  --old-str '"tags": ["rem_tag_ai", "rem_tag_ml"]' \
  --new-str '"tags": ["rem_tag_ai", "rem_tag_ml", "rem_tag_dl"]'
```

CLI 端动作：检测到 `tags` 数组新增 `"rem_tag_dl"` → 通过 Plugin 调用 `rem.addTag(tagRemId)`。

### 示例 6：修改 Rem 类型

从 concept 改为 descriptor：

```
remnote-cli edit-rem rem_abc123 \
  --old-str '"type": "concept"' \
  --new-str '"type": "descriptor"'
```

CLI 端动作：检测到 `type` 变更 → 通过 Plugin 调用 `rem.setType(SetRemType.DESCRIPTOR)`。

### 示例 7：设置为文档

将 Rem 标记为独立文档页面：

```
remnote-cli edit-rem rem_abc123 \
  --old-str '"isDocument": false' \
  --new-str '"isDocument": true'
```

CLI 端动作：检测到 `isDocument` 变更 → 通过 Plugin 调用 `rem.setIsDocument(true)`。

---

## CLI 端实现要点

### JSON diff → SDK 调用映射

CLI 收到 `edit-rem` 命令后的处理流程：

```
1. [防线 1] 检查缓存中是否存在该 remId 且未过期
2. [防线 2] 通过 Plugin 从 SDK 重新抓取 Rem 当前状态，与缓存对比，确认未被外部修改
3. [防线 3] 在缓存的 JSON 文本上执行 str_replace（old_str → new_str），要求唯一匹配
4. 解析替换后的文本为 JSON（modified）
5. 对比缓存版本（original）和 modified 的每个字段
6. 对每个变更字段，通过 Plugin 调用对应的 SDK 方法
7. 写入成功 → 更新缓存；写入失败 → 缓存不变
```

> 详见下文「写保护三道防线」章节。

字段 → SDK 方法映射表（21 个 [RW] 字段）：

| 变更字段 | SDK 调用 | 备注 |
|---------|---------|------|
| `text` | `rem.setText(newRichText)` | |
| `backText` | `rem.setBackText(newRichText)` | null 表示清除背面 |
| `type` | `rem.setType(newType)` | SetRemType 枚举，不含 PORTAL |
| `isDocument` | `rem.setIsDocument(bool)` | |
| `parent` | `rem.setParent(newParentId, position?)` | 同时控制位置 |
| `fontSize` | `rem.setFontSize(size)` | H1/H2/H3/undefined(清除) |
| `highlightColor` | `rem.setHighlightColor(color)` | Red/Orange/Yellow/Green/Blue/Purple |
| `isTodo` | `rem.setIsTodo(bool)` | |
| `todoStatus` | `rem.setTodoStatus(status)` | Finished/Unfinished，需先 isTodo=true |
| `isCode` | `rem.setIsCode(bool)` | |
| `isQuote` | `rem.setIsQuote(bool)` | |
| `isListItem` | `rem.setIsListItem(bool)` | |
| `isCardItem` | `rem.setIsCardItem(bool)` | |
| `isSlot` | `rem.setIsSlot(bool)` | |
| `isProperty` | `rem.setIsProperty(bool)` | |
| `enablePractice` | `rem.setEnablePractice(bool)` | |
| `practiceDirection` | `rem.setPracticeDirection(dir)` | forward/backward/both/none |
| `tags`（新增） | `rem.addTag(tagRemId)` | |
| `tags`（删除） | `rem.removeTag(tagRemId)` | |
| `sources`（新增） | `rem.addSource(sourceRemId)` | |
| `sources`（删除） | `rem.removeSource(sourceRemId)` | |
| `aliases` | `rem.getOrCreateAliasWithText(text)` | 有副作用：不存在则创建 |
| `positionAmongstSiblings` | `rem.setParent(parent, newPosition)` | 通过 setParent 的第二参数控制 |

### 只读字段与后处理校验

以下字段在 `read-rem` 中返回但**不可**通过 `edit-rem` 修改。

**[R] 默认输出的只读字段（13 个）**：

- `id` — Rem ID 不可变
- `children` — 通过设置子 Rem 的 parent 间接改变，不可直接赋值
- `createdAt` / `updatedAt` — 系统时间戳
- `remsBeingReferenced` / `remsReferencingThis` — 由 text 中的引用元素自动推导
- `taggedRem` / `descendants` / `siblingRem` — 由层级/标签关系自动推导
- `portalType` / `portalDirectlyIncludedRem` — Portal 内部状态
- `propertyType` — 通过 `getPropertyType()` 读取，无直接 setter
- `isTable` — 无 `setIsTable()`，只有 `setTableFilter()`

**[R-F] 仅 `--full` 输出的只读字段（17 个）**：

- `deepRemsBeingReferenced` / `ancestorTagRem` / `descendantTagRem` — 推导关系
- `portalsAndDocumentsIn` / `allRemInDocumentOrPortal` / `allRemInFolderQueue` — 聚合查询
- `timesSelectedInSearch` / `lastTimeMovedTo` / `schemaVersion` — 统计/内部
- `embeddedQueueViewMode` / `localUpdatedAt` / `lastPracticed` — 低频元数据
- `isPowerup` / `isPowerupEnum` / `isPowerupProperty` / `isPowerupPropertyListItem` / `isPowerupSlot` — Powerup 系统标识

#### 后处理校验规则

str_replace 执行后、写入 SDK 前，CLI 必须对 modified JSON 进行以下校验：

**1. 类型合规校验**：替换结果必须符合 RemObject 的类型定义。

| 字段 | 合法值 | 非法示例 |
|------|--------|---------|
| `type` | `"concept"` / `"descriptor"` / `"portal"` / `"default"` | `"document"`（isDocument 是独立字段） |
| `fontSize` | `"H1"` / `"H2"` / `"H3"` / `null` | `"H4"`、`"large"` |
| `highlightColor` | `"Red"` / `"Orange"` / `"Yellow"` / `"Green"` / `"Blue"` / `"Purple"` / `null` | `"red"`（大小写敏感）、`"Pink"` |
| `todoStatus` | `"Finished"` / `"Unfinished"` / `null` | `"Done"`、`true` |
| `practiceDirection` | `"forward"` / `"backward"` / `"both"` / `"none"` | `"left"`、`1` |
| 所有 `is*` 布尔字段 | `true` / `false` | `"true"`（字符串）、`1`（数字） |
| 所有 ID 数组字段 | `string[]` | 包含非字符串元素 |

校验失败时报错并终止，不写入 SDK：

```json
{
  "ok": false,
  "command": "edit-rem",
  "error": "Type validation failed: field 'type' value 'document' is not a valid RemTypeValue. Valid values: concept, descriptor, portal, default"
}
```

**2. 只读字段保护**：替换后如果只读字段（[R] / [R-F]）的值发生变化，CLI 应**忽略该变更**并返回警告，继续执行其他合法变更。

```json
{
  "ok": true,
  "command": "edit-rem",
  "changes": ["highlightColor: null → \"Red\""],
  "warnings": ["Field 'children' is read-only and was ignored", "Field 'updatedAt' is read-only and was ignored"]
}
```

**3. 语义一致性校验**：检查字段间的逻辑依赖关系。

| 规则 | 说明 |
|------|------|
| `todoStatus` 需要 `isTodo=true` | 如果 `isTodo=false` 但 `todoStatus` 被设为 `"Finished"`，报警告 |
| `positionAmongstSiblings` 与 `parent` 联动 | 如果同时改了 `parent` 和 `positionAmongstSiblings`，合并为一次 `setParent(newParent, newPosition)` 调用 |
| `type` 不可设为 `"portal"` | Portal 只能通过 `createPortal()` 创建，不可通过 `setType()` 设置 |

### 写保护三道防线

参照 Claude Code 的 Edit 工具安全机制，RemNote CLI 在 write 路径上设置三道防线，确保 AI 的每次写操作都基于准确、最新的认知。

#### 核心概念：缓存 = AI 的认知

守护进程（daemon）内存中维护一个 Rem 对象缓存（`Map<remId, serializedJSON>`），语义上代表 **AI 当前认为的 RemNote 数据库状态**。这个缓存不是性能优化手段，而是安全机制的基础。

> **为什么缓存在 daemon 而不在 CLI 命令进程？** 每次 CLI 命令调用（`read-rem`、`edit-rem` 等）都是独立的 OS 进程，进程结束内存即释放。守护进程是长生命周期进程，天然适合持有跨命令调用的缓存状态。会话 = daemon 生命周期：`connect` 启动 → 会话开始，`disconnect` 关闭 → 会话结束，缓存全部清空。

缓存规则：

- `read-rem` 返回 JSON 的同时，在缓存中存入该版本（key = remId）
- 对同一个 remId 再次 `read-rem`，覆盖更新缓存（AI 刷新了认知）
- **write 失败时，不自动更新缓存**——AI 必须主动 re-read 才能同步认知
- 多 Rem 模式的 read 也会更新缓存（以 Rem 为粒度，批量写入所有涉及的 Rem 对象）
- 无 TTL 过期机制——第二道防线（写前变更检测）已能捕获所有陈旧数据
- 内存控制：LRU 策略，上限 200 条目，超出时淘汰最久未访问的条目

#### 第一道防线：先读后写门卫（Read-before-Write Gate）

**硬性规则**：如果目标 Rem 没有在当前会话中被 read 过（即缓存中不存在），`edit-rem` 直接拒绝执行。

```
remnote-cli edit-rem rem_xyz ...
→ 检查缓存：rem_xyz 不存在
→ 报错："Rem rem_xyz has not been read yet. Read it first before editing."
```

这确保 AI 不可能凭"记忆"或"猜测"去修改一个它没有实际查看过的 Rem。即使 AI 在上一轮对话中读过，新会话（新的 daemon 进程）的缓存是空的，必须重新 read。

#### 第二道防线：写前变更检测（Modification Detection）

**核心逻辑**：`edit-rem` 执行写入前，先通过 Plugin 从 RemNote SDK 重新抓取目标 Rem 的当前状态，与缓存中的版本做对比。如果不一致，说明 Rem 在 AI read 之后被外部修改过（用户手动编辑、其他插件修改、另一个 AI 会话修改等）。

```
remnote-cli edit-rem rem_abc123 --old-str ... --new-str ...
→ 第一道防线通过（缓存存在）
→ 通过 Plugin 从 SDK 抓取 rem_abc123 的当前对象，序列化为 JSON
→ 与缓存中的 JSON 做全文比对
→ 不一致！
→ 报错："Rem rem_abc123 has been modified since last read. Please read it again before editing."
→ 缓存不更新（AI 的认知仍停留在旧版本，必须主动 read 刷新）
```

对比方式：直接比较序列化后的 JSON 字符串。不做字段级 diff，因为任何字段的变化（包括 updatedAt 时间戳）都意味着 Rem 被动过。

> **为什么 write 失败后不自动更新缓存？** 如果失败时自动把最新版本写入缓存，AI 可能会在下一次 edit-rem 中使用基于"它从未真正看过"的内容来构造 old_str。缓存代表的是 AI 的认知，AI 没有 read 过就不应该"知道"新内容。这迫使 AI 走正确的流程：read → 理解变更 → 重新构造 edit。

#### 第三道防线：精确字符串匹配（Exact String Match）

**标准 str_replace 规则**：old_str 必须在缓存的 JSON 中精确且唯一地匹配。

- 零次匹配 → 报错：`"old_str not found in the serialized JSON of rem {remId}"`
- 多次匹配 → 报错并返回每个匹配项的上下文，让 AI 知道如何区分

多次匹配的报错格式：

```json
{
  "error": "old_str matched 2 times in rem rem_abc123, must be unique.",
  "matches": [
    {
      "index": 0,
      "context": "...\"text\": \"人工智能\", \"b\": true },\n    >>>\"的分支，参见\"<<<,\n    { \"type\": \"rem_reference\"..."
    },
    {
      "index": 1,
      "context": "...\"nextReview\": null },\n    >>>\"的分支，参见\"<<<,\n    \"这是补充说明\"..."
    }
  ],
  "hint": "Include more surrounding context in old_str to uniquely identify the target match."
}
```

`>>>` 和 `<<<` 标记匹配位置，前后各展示约 50 个字符的上下文。AI 看到这个就知道两个匹配分别在 JSON 的什么位置，从而扩大 old_str 范围来确保唯一。

即使前两道防线都通过了，这第三道也能兜底——如果 AI 的 old_str 构造有误（记错了内容、格式不对），也不会产生错误修改。

#### 三道防线的协作流程

```
edit-rem(remId, old_str, new_str)
│
├─ [防线 1] daemon 缓存中是否存在 remId？
│  ├─ 不存在 → 报错 "has not been read yet"，终止
│  └─ 存在 → 继续
│
├─ [防线 2] 通过 Plugin 从 SDK 重新抓取 Rem，与缓存对比
│  ├─ 不一致 → 报错 "has been modified since last read"，缓存不更新，终止
│  └─ 一致 → 继续
│
├─ [防线 3] 在缓存的 JSON 中执行 str_replace
│  ├─ old_str 零次匹配 → 报错 "not found"，终止
│  ├─ old_str 多次匹配 → 报错 "matched N times" + 返回各匹配项上下文，终止
│  └─ 唯一匹配 → 执行替换，得到 modified JSON
│
├─ 解析 modified JSON
│  ├─ JSON 解析失败 → 报错 "invalid JSON: {parseError}"，终止
│  └─ 解析成功 → 继续
│
├─ [后处理] 对比 original 和 modified，推导变更字段
│  │
│  ├─ 类型合规校验：每个变更字段的新值是否符合 RemObject 类型定义
│  │  └─ 不合规 → 报错 "Type validation failed: ..."，终止
│  │
│  ├─ 只读字段保护：变更字段是否为 [R] 或 [R-F] 只读字段
│  │  └─ 是 → 收集警告，从变更列表中剔除，继续
│  │
│  ├─ 语义一致性校验：字段间逻辑依赖是否满足
│  │  ├─ todoStatus 需 isTodo=true → 不满足则警告
│  │  ├─ type 不可设为 "portal" → 违反则报错终止
│  │  └─ parent + positionAmongstSiblings 同时变更 → 合并为一次 setParent 调用
│  │
│  └─ 变更列表为空（全是只读字段被忽略）→ 返回成功 + 警告，无实际写入
│
├─ 通过 Plugin 调用 SDK 方法写入
│  ├─ SDK 调用失败 → 报错 "Failed to update: {sdkError}"，缓存不更新，终止
│  └─ 写入成功 → 更新缓存为 modified 版本（只读字段用 SDK 最新值）
│
└─ 返回成功 + 变更摘要 + 警告列表（如有）
```

#### 完整错误处理表

| 阶段 | 错误场景 | CLI 响应 | 缓存动作 | 是否终止 |
|------|---------|-----------|---------|---------|
| 防线 1 | Rem 未被 read 过 | `"Rem {remId} has not been read yet. Read it first before editing."` | 无 | 终止 |
| 防线 2 | Rem 被外部修改 | `"Rem {remId} has been modified since last read. Please read it again before editing."` | **不更新** | 终止 |
| 防线 3 | old_str 未匹配 | `"old_str not found in the serialized JSON of rem {remId}"` | 不变 | 终止 |
| 防线 3 | old_str 多次匹配 | `"old_str matched {n} times"` + 返回各匹配项上下文 | 不变 | 终止 |
| 后处理 | 替换后 JSON 非法 | `"Replacement resulted in invalid JSON: {parseError}"` | 不变 | 终止 |
| 后处理 | 字段值类型不合法 | `"Type validation failed: field '{field}' value '{value}' is not valid"` | 不变 | 终止 |
| 后处理 | 修改只读字段 | 警告：`"Field '{field}' is read-only and was ignored"` + 继续 | 正常更新 | **不终止** |
| 后处理 | 语义不一致 | 警告：如 `"todoStatus requires isTodo=true"` + 继续 | 正常更新 | **不终止** |
| 写入 | SDK 调用失败 | `"Failed to update field '{field}': {sdkError}"` | **不更新** | 终止 |
| 写入 | Rem 不存在 | `"Rem {remId} not found"` | 清除该条目 | 终止 |

#### 缓存生命周期总结

```
read-rem(id)       → 写入/覆盖 daemon 缓存[id]
edit-rem(id) 成功   → 更新 daemon 缓存[id] 为修改后版本
edit-rem(id) 失败   → 缓存[id] 不变（AI 认知不变，必须 re-read）
connect             → 启动 daemon，缓存为空（新会话）
disconnect          → 关闭 daemon，缓存全部清空（会话结束）
LRU 淘汰（>200条）  → 淘汰最久未访问的条目（被淘汰的 Rem 需要重新 read）
```

---


## 设计决策记录

### 为什么选择 JSON 而不是 YAML/Markdown？

- **保真度**：JSON 能无损表示 RichText 的所有元素类型和嵌套属性，YAML 和 Markdown 都会有信息损失
- **round-trip 安全**：JSON parse → stringify 的 round-trip 是确定性的，不会引入格式歧义
- **解析简单**：CLI 端用 `JSON.parse()` 即可，不需要额外的解析器
- **AI 能力**：所有主流 LLM 对 JSON 的生成和编辑能力都很强

### 为什么用 str_replace 而不是 JSON Patch (RFC 6902)？

- **通用性**：str_replace 是所有编程 AI 都熟悉的模式（OpenCode、Claude Code 等都在用），JSON Patch 不是
- **直觉性**：AI 直接看到文本，直接说"把这段换成那段"，比构造 `{ "op": "replace", "path": "/text/1/b", "value": true }` 更自然
- **灵活度**：一次 str_replace 可以跨字段修改（虽然不推荐），JSON Patch 则需要多个操作

### 为什么不直接暴露 SDK 方法作为独立命令？

- **命令数量爆炸**：setText、setBackText、addTag、removeTag、setType、setFlashcardType…… 几十个命令，每个都要单独的参数定义
- **AI 选择负担**：命令越多，LLM 选择正确命令的准确率越低
- **组合操作困难**：同时改文本和标签，需要调两个命令，有事务一致性问题
- **str_replace 模式一个命令搞定所有修改**，AI 只需要知道"读对象、改文本、写回去"
