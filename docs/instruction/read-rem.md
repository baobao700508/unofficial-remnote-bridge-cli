# read-rem

> 读取单个 Rem 的完整属性，返回 RemObject（51 字段的标准化数据对象）。

---

## 功能

`read-rem` 通过 Rem ID 读取一个 Rem 的所有可获取属性，返回标准化的 RemObject。读取结果会被缓存在 daemon 内存中，供后续 `edit-rem` 使用。

核心能力：
- 返回 51 个字段的完整 Rem 数据（默认 34 个，`--full` 时 51 个）
- 支持 `--fields` 指定字段子集
- 支持 Powerup 噪音过滤（默认过滤）
- 自动缓存，为 `edit-rem` 建立编辑基础

---

## 用法

### 人类模式

```bash
remnote read-rem <remId> [--fields <fieldList>] [--full] [--includePowerup]
```

| 参数/选项 | 类型 | 必需 | 说明 |
|-----------|------|:----:|------|
| `remId` | string（位置参数） | 是 | Rem ID |
| `--fields <fieldList>` | string | 否 | 逗号分隔的字段列表，返回指定字段子集 |
| `--full` | boolean | 否 | 输出全部 51 个字段（含 R-F 低频字段） |
| `--includePowerup` | boolean | 否 | 包含 Powerup 系统数据（默认过滤） |

输出示例：

```
{
  "id": "kLrIOHJLyMd8Y2lyA",
  "text": [...],
  "type": "concept",
  ...
}
```

### JSON 模式

```bash
remnote read-rem --json '{"remId":"kLrIOHJLyMd8Y2lyA"}'
```

---

## JSON 输入参数

| 字段 | 类型 | 必需 | 说明 |
|------|------|:----:|------|
| `remId` | string | 是 | Rem ID |
| `fields` | string[] | 否 | 字段数组，返回指定字段子集（始终包含 `id`） |
| `full` | boolean | 否 | 返回全部 51 个字段 |
| `includePowerup` | boolean | 否 | 包含 Powerup 系统数据 |

---

## JSON 输出

### 成功

```json
{
  "ok": true,
  "command": "read-rem",
  "data": {
    "id": "kLrIOHJLyMd8Y2lyA",
    "text": [{ "i": "m", "text": "示例文本", "b": true }],
    "backText": null,
    "type": "concept",
    "isDocument": false,
    "parent": "parentRemId",
    "children": ["childId1", "childId2"],
    "fontSize": null,
    "highlightColor": null,
    "isTodo": false,
    "todoStatus": null,
    "...": "（共 34 个字段，--full 时 51 个）"
  },
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

### 成功（含缓存覆盖提示）

当该 Rem 之前已有缓存时，输出中附加 `cacheOverridden` 字段：

```json
{
  "ok": true,
  "command": "read-rem",
  "data": { "...": "RemObject" },
  "cacheOverridden": {
    "id": "kLrIOHJLyMd8Y2lyA",
    "previousCachedAt": "2026-03-06T09:55:00.000Z"
  },
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

### 成功（含 Powerup 过滤统计）

当默认过滤了 Powerup 系统数据时：

```json
{
  "ok": true,
  "command": "read-rem",
  "data": { "...": "RemObject" },
  "powerupFiltered": { "tags": 3, "children": 5 },
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

### Rem 不存在

```json
{
  "ok": false,
  "command": "read-rem",
  "error": "Rem not found: kLrIOHJLyMd8Y2lyA",
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

### daemon 不可达

```json
{
  "ok": false,
  "command": "read-rem",
  "error": "守护进程未运行，请先执行 remnote connect",
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

---

## 内部流程

```
1. CLI 解析参数（remId, fields, full, includePowerup）
2. sendRequest → WS → daemon
3. daemon ReadHandler:
   ├─ 记录旧缓存时间（若存在）
   ├─ forwardToPlugin('read_rem', { remId, includePowerup })
   ├─ Plugin 端：
   │   ├─ plugin.rem.findOne(remId) → 获取 SDK Rem 对象
   │   ├─ 并行调用 40+ SDK getter（text, backText, type, children, tags...）
   │   ├─ 构造 RemObject（含 RichText key 排序，确保序列化确定性）
   │   └─ 可选：Powerup 噪音过滤（filterNoisyTags + filterNoisyChildren）
   ├─ 缓存完整 JSON：cache.set('rem:' + remId, fullJson)
   ├─ 字段过滤：
   │   ├─ --full → 返回全部 51 字段
   │   ├─ --fields → 返回指定字段 + id
   │   └─ 默认 → 排除 R-F 字段（返回 34 字段）
   └─ 附加 _cacheOverridden 元数据（若之前有缓存）
4. CLI 格式化输出（人类模式 pretty-print / JSON 模式单行）
```

---

## RemObject 完整字段表

RemObject 共 51 个字段，按读写权限分为三类：

- **RW**（20 个）：可读可写，SDK 有对应的 setter
- **R**（14 个）：只读，默认输出
- **R-F**（17 个）：只读，仅 `--full` 模式输出（低频 / 可由其他字段推导）

### 核心标识

| 字段 | 类型 | 权限 | 说明 |
|------|------|:----:|------|
| `id` | `string` | R | Rem 唯一 ID |

### 内容

| 字段 | 类型 | 权限 | 说明 |
|------|------|:----:|------|
| `text` | `RichText` | RW | 正面文本（RichText 数组） |
| `backText` | `RichText \| null` | RW | 背面文本。null=无背面；设值即产生闪卡正反面结构 |

### 类型系统

| 字段 | 类型 | 权限 | 说明 |
|------|------|:----:|------|
| `type` | `RemTypeValue` | RW | `concept` / `descriptor` / `default` / `portal` |
| `isDocument` | `boolean` | RW | 是否作为独立文档页面。独立于 type |

### 结构

| 字段 | 类型 | 权限 | 说明 |
|------|------|:----:|------|
| `parent` | `string \| null` | RW | 父 Rem ID。null=顶级 |
| `children` | `string[]` | R | 子 Rem ID 有序数组 |

### 格式 / 显示

| 字段 | 类型 | 权限 | 说明 |
|------|------|:----:|------|
| `fontSize` | `FontSize \| null` | RW | 标题大小：`H1` / `H2` / `H3`。null=普通 |
| `highlightColor` | `HighlightColor \| null` | RW | 高亮颜色（9 种）。null=无高亮 |

### 状态标记

| 字段 | 类型 | 权限 | 说明 |
|------|------|:----:|------|
| `isTodo` | `boolean` | RW | 是否待办。设为 true 时自动初始化 todoStatus |
| `todoStatus` | `TodoStatus \| null` | RW | `Finished` / `Unfinished`。需先 isTodo=true |
| `isCode` | `boolean` | RW | 是否代码块 |
| `isQuote` | `boolean` | RW | 是否引用块 |
| `isListItem` | `boolean` | RW | 是否列表项（有序列表样式） |
| `isCardItem` | `boolean` | RW | 是否卡片项（多行答案行标记） |
| `isTable` | `boolean` | R | 是否表格（只读） |
| `isSlot` | `boolean` | RW | 是否 Powerup 插槽。与 isProperty 底层相同 |
| `isProperty` | `boolean` | RW | 是否 Tag 属性（表格列）。与 isSlot 底层相同 |

### Powerup 系统标识

| 字段 | 类型 | 权限 | 说明 |
|------|------|:----:|------|
| `isPowerup` | `boolean` | R-F | 是否 Powerup |
| `isPowerupEnum` | `boolean` | R-F | 是否 Powerup 枚举 |
| `isPowerupProperty` | `boolean` | R-F | 是否 Powerup 属性 |
| `isPowerupPropertyListItem` | `boolean` | R-F | 是否 Powerup 属性列表项 |
| `isPowerupSlot` | `boolean` | R-F | 是否 Powerup 插槽 |

### Portal 专用

| 字段 | 类型 | 权限 | 说明 |
|------|------|:----:|------|
| `portalType` | `PortalType \| null` | R | Portal 子类型。仅 type=portal 时有值 |
| `portalDirectlyIncludedRem` | `string[]` | R | Portal 直接包含的 Rem ID |

### 属性类型

| 字段 | 类型 | 权限 | 说明 |
|------|------|:----:|------|
| `propertyType` | `PropertyTypeValue \| null` | R | 属性数据类型（当此 Rem 是 Tag 的属性时） |

### 练习设置

| 字段 | 类型 | 权限 | 说明 |
|------|------|:----:|------|
| `enablePractice` | `boolean` | RW | 是否启用间隔重复练习 |
| `practiceDirection` | `PracticeDirection` | RW | 练习方向：`forward` / `backward` / `both` / `none` |

### 关联 — 直接关系

| 字段 | 类型 | 权限 | 说明 |
|------|------|:----:|------|
| `tags` | `string[]` | RW | 标签 Rem ID 数组。写入时使用 diff 机制（add/remove） |
| `sources` | `string[]` | RW | 来源 Rem ID 数组。写入时使用 diff 机制 |
| `aliases` | `string[]` | R | 别名 Rem ID 数组 |

### 关联 — 引用关系

| 字段 | 类型 | 权限 | 说明 |
|------|------|:----:|------|
| `remsBeingReferenced` | `string[]` | R | 本 Rem 引用的其他 Rem |
| `deepRemsBeingReferenced` | `string[]` | R-F | 本 Rem 深层引用的 Rem |
| `remsReferencingThis` | `string[]` | R | 引用本 Rem 的 Rem（反向链接） |

### 关联 — 标签体系

| 字段 | 类型 | 权限 | 说明 |
|------|------|:----:|------|
| `taggedRem` | `string[]` | R | 被本 Rem 标记的 Rem（本 Rem 作为 tag 时） |
| `ancestorTagRem` | `string[]` | R-F | 祖先标签 Rem（标签继承链） |
| `descendantTagRem` | `string[]` | R-F | 后代标签 Rem（标签继承链） |

### 关联 — 层级遍历

| 字段 | 类型 | 权限 | 说明 |
|------|------|:----:|------|
| `descendants` | `string[]` | R | 所有后代 Rem |
| `siblingRem` | `string[]` | R | 兄弟 Rem |
| `portalsAndDocumentsIn` | `string[]` | R-F | 所在的 Portal 和文档 |
| `allRemInDocumentOrPortal` | `string[]` | R-F | 文档/Portal 中的所有 Rem |
| `allRemInFolderQueue` | `string[]` | R-F | 文件夹队列中的 Rem |

### 位置 / 统计

| 字段 | 类型 | 权限 | 说明 |
|------|------|:----:|------|
| `positionAmongstSiblings` | `number \| null` | RW | 在兄弟间的位置（0 起始） |
| `timesSelectedInSearch` | `number` | R-F | 搜索中被选次数 |
| `lastTimeMovedTo` | `number` | R-F | 上次移动时间（毫秒时间戳） |
| `schemaVersion` | `number` | R-F | Schema 版本号 |

### 队列视图

| 字段 | 类型 | 权限 | 说明 |
|------|------|:----:|------|
| `embeddedQueueViewMode` | `boolean` | R-F | 嵌入式队列视图模式 |

### 元数据 / 时间戳

| 字段 | 类型 | 权限 | 说明 |
|------|------|:----:|------|
| `createdAt` | `number` | R | 创建时间（毫秒时间戳） |
| `updatedAt` | `number` | R | 最后更新时间（毫秒时间戳） |
| `localUpdatedAt` | `number` | R-F | 本地最后更新时间 |
| `lastPracticed` | `number` | R-F | 上次练习时间 |

---

## 枚举类型参考

### RemTypeValue

| 值 | 含义 | UI 表现 |
|----|------|---------|
| `concept` | 概念（双向闪卡） | 文字加粗 |
| `descriptor` | 描述（单向闪卡） | 正常字重 |
| `default` | 普通 Rem | 正常字重 |
| `portal` | 嵌入引用容器 | 紫色左边框（只读，不可通过 setType 设置） |

### FontSize

| 值 | UI 表现 |
|----|---------|
| `H1` | 超大粗体 |
| `H2` | 大粗体 |
| `H3` | 中粗体 |

### TodoStatus

| 值 | UI 表现 |
|----|---------|
| `Finished` | 蓝色已勾选 + 文本删除线 |
| `Unfinished` | 空心未勾选 |

### HighlightColor

```
Red | Orange | Yellow | Green | Blue | Purple | Gray | Brown | Pink
```

### PortalType

| 值 | 含义 |
|----|------|
| `portal` | 标准 Portal |
| `embedded_queue` | 嵌入式队列视图 |
| `scaffold` | 脚手架模式 |
| `search_portal` | 搜索 Portal |

### PracticeDirection

| 值 | 含义 |
|----|------|
| `forward` | 正向：看 text 回忆 backText |
| `backward` | 反向：看 backText 回忆 text |
| `both` | 双向：正反两个方向都练习 |
| `none` | 不生成闪卡 |

### PropertyTypeValue

```
text | number | date | checkbox | single_select | multi_select | url | image | title | definition | created_at | last_updated | 0
```

`0` 表示隐式文本类型（IMPLICIT_TEXT）。

---

## 字段输出层级

| 模式 | 输出字段数 | 说明 |
|------|:----------:|------|
| 默认 | 34 | RW + R 字段，覆盖常用场景 |
| `--full` | 51 | 全部字段（含 R-F 低频字段） |
| `--fields` | 自选 + id | 仅返回指定字段（始终包含 id） |

### R-F 字段列表（默认不输出，`--full` 时输出）

```
isPowerup, isPowerupEnum, isPowerupProperty, isPowerupPropertyListItem, isPowerupSlot,
deepRemsBeingReferenced,
ancestorTagRem, descendantTagRem,
portalsAndDocumentsIn, allRemInDocumentOrPortal, allRemInFolderQueue,
timesSelectedInSearch, lastTimeMovedTo, schemaVersion,
embeddedQueueViewMode,
localUpdatedAt, lastPracticed
```

---

## RichText 格式

RemObject 中的 `text` 和 `backText` 字段使用 RichText 格式——一个 JSON 数组，每个元素为纯字符串或带 `i` 字段的格式化对象。

### 元素类型

| `i` 值 | 含义 | 核心字段 |
|--------|------|----------|
| （纯 string） | 纯文本片段 | — |
| `"m"` | 带格式文本 | `text` + 格式标记 |
| `"q"` | Rem 引用 | `_id`（被引用 Rem ID） |
| `"i"` | 图片 | `url`, `width`, `height` |
| `"x"` | LaTeX | `text` |
| `"a"` | 音频 | `url` |

### 行内格式标记（`i:"m"` 元素内）

| 字段 | 类型 | 含义 |
|------|------|------|
| `b` | `true` | 加粗 |
| `l` | `true` | 斜体 |
| `u` | `true` | 下划线 |
| `h` | `number` | 高亮颜色（1=红, 2=橙, 3=黄, 4=绿, 5=蓝, 6=紫） |
| `tc` | `number` | 文字颜色 |
| `code` | `true` | 行内代码 |
| `cId` | `string` | 完形填空 ID |
| `iUrl` | `string` | 外部链接 URL |

### 序列化确定性

RichText 对象元素内部按 **key 字母序排列**（Plugin 端 `sortRichTextKeys()` 处理），确保同一内容的序列化 JSON 始终一致。这对 `edit-rem` 的 str_replace 和乐观并发检测至关重要。

---

## Powerup 过滤

默认 `includePowerup=false` 时，系统会过滤掉 Powerup 产生的噪音数据：

| 过滤对象 | 过滤条件 | 说明 |
|----------|----------|------|
| **tags** | `isPowerup()=true` 的 Tag | 系统 Powerup Tag（如"标题"、"高亮"、"代码"等） |
| **children** | `isPowerupProperty()` / `isPowerupSlot()` / `isPowerupPropertyListItem()` / `isPowerupEnum()` 为 true 的子 Rem | Powerup 产生的隐藏子 Rem（如 `[Size];;[H1]` descriptor） |

过滤统计通过 `powerupFiltered` 字段返回（如 `{"tags": 3, "children": 5}`）。

`--includePowerup` 可恢复完整数据，用于调试或分析 Powerup 机制。

---

## 缓存行为

| 时机 | 行为 |
|------|------|
| 读取成功 | 完整 JSON 写入缓存 `cache.set('rem:' + remId, fullJson)` |
| 已有缓存 | 覆盖旧缓存，返回 `cacheOverridden` 元数据 |
| 缓存用途 | 供 `edit-rem` 的三道防线使用（存在性检查 + 乐观并发检测 + str_replace） |
| 缓存存储 | daemon 内存中的 LRU 缓存（最大 200 条目） |
| 缓存清空 | daemon 关闭时自动消失 |

**重要**：缓存存储的是 **完整 RemObject**（含 R-F 字段），不受 `--fields` / `--full` 选项影响。字段过滤仅作用于返回给 CLI 的输出。

---

## 退出码

| 退出码 | 含义 | 触发条件 |
|:------:|------|----------|
| 0 | 成功 | Rem 读取成功 |
| 1 | 业务错误 | Rem 不存在、Plugin 未连接等 |
| 2 | daemon 不可达 | daemon 未运行或 WS 连接失败 |

---

## 输出字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `data` | RemObject | Rem 的完整属性对象 |
| `cacheOverridden` | object | 之前有缓存时附加：`id`=Rem ID、`previousCachedAt`=旧缓存创建时间 |
| `powerupFiltered` | object | Powerup 过滤统计：`tags`=被过滤的 Tag 数、`children`=被过滤的子 Rem 数 |
