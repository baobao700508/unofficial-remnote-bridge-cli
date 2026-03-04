# Rem 对象字段映射：数据库原始字段 vs SDK RemObject

> 探索日期: 2026-03-03
> 数据库位置: `~/remnote/remnote-<userId>/remnote.db`（SQLite）
> 数据表: `quanta`（所有 Rem 存储在此表，字段 `_id`, `doc`(JSON), `x`）
> 记录数: 8286

---

## 1. 核心结论

### 1.1 children 不在数据库中存储

数据库中 **没有** `children` 字段。SDK 的 `RemObject.children` 是通过查询所有 `parent == thisRemId` 的记录，按 `f`（fractional index）排序后反向组装的。

### 1.2 SDK RemObject 只暴露了少量直接属性

SDK 的 `RemObject` 直接可读属性只有 8 个：

| SDK 属性 | 类型 | 数据库字段 |
|:--|:--|:--|
| `_id` | `RemId` | `_id` |
| `createdAt` | `number` | `createdAt`（毫秒时间戳） |
| `localUpdatedAt` | `number` | 无直接对应，可能是 `p`（见下文） |
| `updatedAt` | `number` | `u`（毫秒时间戳） |
| `parent` | `RemId \| null` | `parent` |
| `children` | `RemId[]` | **不存储**——通过反查 `parent` + 按 `f` 排序获得 |
| `type` | `RemType` | `type`（1=Concept, 2=Descriptor, 6=Portal） |
| `text` | `RichTextInterface` | `key`（RichText 数组） |
| `backText` | `RichTextInterface` | `value`（RichText 数组 或 null） |

### 1.3 大量信息需要通过 SDK 方法获取

数据库中有 50+ 字段，但 SDK 不直接暴露它们，而是通过 RPC 方法逐个访问（如 `getFontSize()`、`getHighlightColor()` 等）。

---

## 2. 数据库字段完整映射

### 2.1 通用字段（所有 Rem 都有）

| 数据库字段 | 频次 | 含义 | SDK 对应 |
|:--|:--|:--|:--|
| `_id` | 8286 | Rem 唯一 ID | `RemObject._id` |
| `createdAt` | 8286 | 创建时间（毫秒时间戳） | `RemObject.createdAt` |
| `m` | 8286 | 创建时间（与 createdAt 相同值） | 内部冗余 |
| `key` | 8286 | **正面文本**（RichText 数组） | `RemObject.text` |
| `parent` | 8286 | 父 Rem ID（null=顶级） | `RemObject.parent` |
| `v` | 8286 | 版本号（观察到值=4） | 内部版本管理 |
| `y` | 8286 | 最后同步时间戳 | 可能是 `localUpdatedAt` |
| `x` | 8286 | 排序权重/序号（递增整数） | 内部 |
| `z` | 8286 | 数据源标识（1=系统默认, 3=用户创建） | 内部 |
| `owner` | 8286 | 知识库 ID | 内部 |

### 2.2 时间戳与版本字段

| 数据库字段 | 频次 | 含义 |
|:--|:--|:--|
| `u` | 8026 | **最后修改时间**（毫秒）→ SDK `updatedAt` |
| `p` | 6316 | **本地最后更新时间** → 可能对应 SDK `localUpdatedAt` |
| `o` | 8201 | 最后原始（origin）更新时间 |
| `<field>,u` | - | 某字段的最后更新时间戳（如 `key,u`, `type,u`） |
| `<field>,o` | - | 某字段的 origin 更新时间戳 |
| `v,u` | - | 版本字段的更新时间 |

### 2.3 内容与结构字段

| 数据库字段 | 频次 | 含义 | SDK 对应 |
|:--|:--|:--|:--|
| `key` | 8286 | 正面文本（RichText 数组） | `text` |
| `value` | 3792 | 背面文本（RichText 数组/null） | `backText` |
| `type` | 2886 | Rem 类型：1=Concept, 2=Descriptor, 6=Portal | `type` / `getType()` |
| `f` | 8237 | 兄弟间排序索引（分数索引如 `"a0"`, `"a1"`, `"a3"`, `"a*"`） | `positionAmongstSiblings()` |
| `parent` | 8286 | 父 Rem ID | `parent` / `getParentRem()` |
| `tp` | 2323 | 标签/Powerup 映射 `{remId: {t:bool, ",u":timestamp}}` | `getTagRems()` / `hasPowerup()` |

### 2.4 闪卡（Flashcard）相关字段

| 数据库字段 | 频次 | 含义 | SDK 对应 |
|:--|:--|:--|:--|
| `enableBackSR` | 3409 | 是否启用反向间隔重复 | `getEnablePractice()` / `getPracticeDirection()` |
| `forget` | 3715 | 是否标记为"忘记" | 内部（卡片调度） |
| `efc` | 1860 | 是否启用正向卡片（enable forward card） | `getEnablePractice()` |
| `crt` | 1991 | 卡片调度数据 `{g:{}}` 等 | `getCards()` |
| `cd` | ? | 子孙中的卡片总数（card descendants） | 内部统计 |
| `cq` | ? | 子孙中待练习的卡片数（card queue） | 内部统计 |
| `dm` | ? | 学习状态分布 `{New:N, Acquiring:N, Growing:N, Stale:N}` | 内部统计 |

### 2.5 Powerup / 内置属性字段

| 数据库字段 | 频次 | 含义 | SDK 对应 |
|:--|:--|:--|:--|
| `rcrt` | ? | 此 Rem 是某个 powerup 的根（如 `"remtree_powerup"`, `"f"`, `"ip"`, `"ty"`） | `isPowerup()` |
| `rcrs` | ? | 此 Rem 是某个 powerup 的 slot（如 `"p.d"`, `"im.i"`, `"cd.l"`） | `isPowerupSlot()` |
| `rcrp` | ? | 此 Rem 是某个 powerup 的 property（如 `"b.u"`） | `isPowerupProperty()` |
| `e` | ? | 完整路径标识（如 `"u.p.d"`, `"u.remtree_powerup"`, `"s.parentId.b.u"`） | 内部 |
| `k` | 5543 | 查找键（`"parentName.remName"` 或 `"null.remName"`） | `findByName()` 的索引字段 |
| `ck` | ? | powerup code key（如 `"tree"`, `"treec"`, `"clo"`） | Powerup Code |
| `ft` | ? | 属性类型：`"text"`, `"single_select"`, `"checkbox"`, `"multi_select"` | `getPropertyType()` |

### 2.6 显示与格式字段

| 数据库字段 | 频次 | 含义 | SDK 对应 |
|:--|:--|:--|:--|
| `ih` | 2066 | 层级类型：`"h"`=heading, `"t"`=todo, `"e"`=? | `getFontSize()` / `isTodo()` 等 |
| `ie` | 2370 | 内嵌类型/编辑器信息（如 `"g.c"`, `"ip.s"`, `"b.h"`, `"au.a"` 等） | 各种 `is*()` 方法 |
| `iv` | 1860 | 可见性/展开状态（0 或 1） | 内部 |
| `folderOpen` | 369 | 文件夹是否展开 | `isFolder()` 相关 |
| `mh` | ? | 移动历史 `{remId: {m: {d: timestamp}}}` | `getLastTimeMovedTo()` |

### 2.7 AI 与导入相关字段

| 数据库字段 | 频次 | 含义 | SDK 对应 |
|:--|:--|:--|:--|
| `ai` | ? | AI 生成的定义 `{def: "..."}` | 无直接对应 |
| `autoImport` | ? | 是否自动导入 | 无 |
| `srcRemId` | ? | 来源 Rem ID | `getSources()` |
| `srcRemC` | ? | 来源 Rem 上下文标识 | 内部 |

---

## 3. SDK RemObject 方法 → 数据库字段推断映射

以下是 SDK 方法与其可能读取的数据库字段的对应关系：

| SDK 方法 | 返回类型 | 推断的数据库字段 |
|:--|:--|:--|
| `getType()` | `RemType` | `type` |
| `getChildrenRem()` | `RemObject[]` | 反查 `parent` + `f` 排序 |
| `getTagRems()` | `RemObject[]` | `tp` 中的 keys（RemId） |
| `hasPowerup(code)` | `boolean` | `tp` 中查找对应 powerup |
| `getFontSize()` | `'H1'\|'H2'\|'H3'\|undefined` | 可能与 `ih` 或 `ie` 中的 `"h"` 值相关 |
| `getHighlightColor()` | `string\|undefined` | 未确认具体字段 |
| `isDocument()` | `boolean` | 推断：顶级 Rem 或有特定标志 |
| `isFolder()` | `boolean` | `folderOpen` 字段的存在性 |
| `isTodo()` | `boolean` | `ih` == `"t"` |
| `isListItem()` | `boolean` | 未确认 |
| `isCardItem()` | `boolean` | 未确认 |
| `isQuote()` | `boolean` | 未确认 |
| `isCode()` | `boolean` | 未确认 |
| `getEnablePractice()` | `boolean` | `enableBackSR`, `efc` |
| `getPracticeDirection()` | `forward\|backward\|none\|both` | `enableBackSR` + `efc` 组合 |
| `getCards()` | `Card[]` | `crt` 字段 + 卡片调度系统 |
| `getSources()` | `RemObject[]` | `srcRemId` |
| `remsReferencingThis()` | `RemObject[]` | 全库搜索 `key`/`value` 中的 `{i:"q", _id:thisId}` |

---

## 4. RichText 在数据库中的存储格式

`key`（正面）和 `value`（背面）字段存储的是 RichText 数组，格式与 SDK `RichTextInterface` 一致：

```jsonc
// 纯文本：直接是字符串
["这是纯文本"]

// 混合格式：字符串 + 富文本元素交替
["前缀", {"i":"m", "text":"加粗", "b":true}, "后缀"]

// Rem 引用
[{"i":"q", "_id":"someRemId", "content":false, "pin":false}]

// Cloze（完形填空）
["前缀", {"i":"m", "text":"答案", "cId":"clozeId"}, "后缀"]

// 图片
[{"i":"i", "url":"%LOCAL_FILE%...", "width":684, "height":220, "title":"filename.jpg"}]
```

### 标签（tp 字段）格式

```jsonc
{
  "remId1": {"t": true, ",u": 1741492029712},  // t=tagged, ,u=更新时间
  "remId2": {"t": false, ",u": 1762136554061}   // t=false 表示已取消标记
}
```

---

## 5. 分数索引排序（f 字段）

`f` 字段使用分数索引（fractional indexing）来确定兄弟间的顺序：

- `"a0"` → 第一个位置
- `"a1"` → 第二个位置
- `"a2n"` → 介于 a2 和 a3 之间的插入位置
- `"a*"` → 特殊位置标记

这种方案支持无冲突的并发插入（CRDT 友好）。

---

## 6. 对 CLI 实现的启示

### 6.1 获取完整 Rem 信息需要多次 SDK 调用

SDK 的 `findOne(remId)` 只返回基础属性（_id, text, backText, type, parent, children, timestamps）。要获取完整信息，必须调用一系列方法：

```typescript
const rem = await plugin.rem.findOne(remId);
// 基础属性已有：rem._id, rem.text, rem.backText, rem.type, rem.parent, rem.children

// 需要额外调用的方法：
const tags = await rem.getTagRems();
const fontSize = await rem.getFontSize();
const highlight = await rem.getHighlightColor();
const isDoc = await rem.isDocument();
const isFolder = await rem.isFolder();
const isTodo = await rem.isTodo();
const todoStatus = await rem.getTodoStatus();
const isQuote = await rem.isQuote();
const isCode = await rem.isCode();
const isListItem = await rem.isListItem();
const practiceDir = await rem.getPracticeDirection();
const sources = await rem.getSources();
const aliases = await rem.getAliases();
// ... 等等
```

### 6.2 建议的 CLI Rem 输出结构

根据数据库和 SDK 分析，CLI 应该组装出一个扁平化的完整 Rem 对象：

```jsonc
{
  // 基础（来自 RemObject 直接属性）
  "id": "remId",
  "text": [...],          // RichText 数组
  "textMarkdown": "...",  // toMarkdown() 的结果
  "backText": [...],      // RichText 数组
  "backTextMarkdown": "...",
  "type": "concept",      // concept | descriptor | portal | default
  "parent": "parentId",
  "children": ["childId1", "childId2"],
  "createdAt": 1741492029688,
  "updatedAt": 1752111092057,

  // 格式（来自各种 is*() 和 get*() 方法）
  "fontSize": "H1",       // H1 | H2 | H3 | null
  "highlightColor": null,
  "isDocument": false,
  "isFolder": false,
  "isTodo": false,
  "todoStatus": null,     // "Finished" | "Unfinished" | null
  "isQuote": false,
  "isCode": false,
  "isListItem": true,
  "isCardItem": false,

  // 关联（来自关系查询方法）
  "tags": ["tagRemId1", "tagRemId2"],
  "sources": ["sourceRemId"],
  "aliases": ["aliasRemId"],

  // 闪卡（来自练习相关方法）
  "practiceDirection": "forward",  // forward | backward | both | none
  "enablePractice": true
}
```
