---
title: "feat: 实现 read-tree / edit-tree 树模式读写命令"
type: feat
status: completed
date: 2026-03-04
origin: docs/初始需求/remnote-cli-tree-mode-spec.md
---

# feat: 实现 read-tree / edit-tree 树模式读写命令

## Overview

在现有单 Rem 模式（read-rem / edit-rem）基础上，新增**树模式**命令。`read-tree` 读取某个 Rem 的子树并序列化为带缩进的 Markdown 大纲；`edit-tree` 通过 str_replace 对大纲进行行级结构操作（增/删/移/重排），CLI 解析 diff 后批量调用 Plugin SDK 写回。

树模式只管结构，**硬性禁止**修改已有行内容（round-trip 有损），内容修改一律走 `edit-rem`。

## Problem Statement / Motivation

当前 CLI 只有单 Rem 模式，AI Agent 无法：
- 查看知识库的层次结构
- 批量创建/删除/移动/重排 Rem
- 在结构层面组织知识

树模式是 AI Agent 操作 RemNote 知识库的核心能力缺口。

## Proposed Solution

遵循现有架构模式，在**三层**分别新增实现：

### 同态命名映射

**CLI 命令级同态命名**（红线要求）：

| CLI 命令 | 协议 action | Plugin service 文件 | Plugin service 函数 |
|:--|:--|:--|:--|
| `read-tree` | `read_tree` | `read-tree.ts` | `readTree()` |
| `edit-tree` | — | — | — |

> `edit-tree` 没有直接对应的 Plugin service。与 `edit-rem` → `write_rem_fields` 的模式一致：CLI handler 解析 diff 后调用多个**内部原子操作** action。

**内部原子操作 action**（非 CLI 命令，不适用同态命名红线）：

| 协议 action | Plugin service 文件 | Plugin service 函数 | 说明 |
|:--|:--|:--|:--|
| `create_rem` | `create-rem.ts` | `createRem()` | 创建新 Rem |
| `delete_rem` | `delete-rem.ts` | `deleteRem()` | 删除 Rem |
| `move_rem` | `move-rem.ts` | `moveRem()` | 移动 Rem（改变父节点） |
| `reorder_children` | `reorder-children.ts` | `reorderChildren()` | 重排 children 顺序 |

### 数据流

```
read-tree:
  CLI command → daemon → TreeReadHandler
    → forwardToPlugin('read_tree', {remId, depth})
    → Plugin readTree(): 递归遍历子树 + toMarkdown() 序列化
    → 返回 Markdown 大纲
    → TreeReadHandler 缓存大纲（key = 'tree:{remId}'）→ 返回给 CLI

edit-tree:
  CLI command → daemon → TreeEditHandler
    → 防线 1: 检查 'tree:{remId}' 缓存存在
    → 防线 2: forwardToPlugin('read_tree') 重建大纲，与缓存逐字对比
    → 防线 3: str_replace 精确匹配
    → 解析新旧大纲为两棵树，ID 级 diff
    → 逐项执行操作（forwardToPlugin 各子操作 action）
    → 成功后重跑 readTree 更新缓存（key = 'tree:{remId}'）
```

## Technical Considerations

### 架构决策

**D1: 序列化在 Plugin 层完成**

`toMarkdown()` 是 RemNote SDK API，只能在 Plugin 中调用。因此树的遍历 + Markdown 序列化必须在 Plugin 的 `readTree()` service 中完成，CLI 收到的已经是最终的 Markdown 大纲文本。

防线 2 的"重跑 read-tree 逻辑"也是一次 `forwardToPlugin('read_tree')` 调用，复用同一个 service。

**D2: 缓存键隔离——调用方传带前缀的 key**

树模式缓存 Markdown 大纲文本，单 Rem 模式缓存 JSON 字符串。两者使用**同一个 `RemCache` 实例**（在 `ws-server.ts` 中创建并注入），通过**调用方传入带前缀的 key** 隔离：

- 单 Rem 模式：`cache.set('rem:' + remId, json)` — 需迁移现有 ReadHandler / EditHandler
- 树模式：`cache.set('tree:' + remId, outline)`

`RemCache` 接口不变，迁移安全——缓存在 daemon 内存中，daemon 重启后自然清空，无需兼容旧 key。

`ws-server.ts` 中 TreeReadHandler 和 TreeEditHandler 与现有 ReadHandler / EditHandler **共享同一个 `remCache` 实例**。

**D3: edit-tree 成功后更新缓存**

与 edit-rem 行为一致——edit-tree 执行所有 SDK 操作后，重新调用 `forwardToPlugin('read_tree')` 获取最新大纲并更新缓存。这确保连续 edit-tree 可行（工作流 3）。

**D4: 混合操作的执行顺序**

单次 edit-tree 中的操作按以下顺序执行：

1. **创建新 Rem**（按层级从浅到深，确保父节点先于子节点创建）
   - 如果新增行的父节点也是新增行，先创建父节点获取 remId，再创建子节点时引用该 remId
2. **移动已有 Rem**（父节点变化）
   - 已有 Rem 可以移动到新创建的 Rem 下——此时步骤 1 已经创建好了新 Rem
3. **重排 children**（同父节点内的位置变化）
4. **删除 Rem**（按层级从深到浅，确保子节点先于父节点删除）

**D5: 行尾标记解析策略（从右向左）**

Rem 文本可能包含 `<!--` 字符串。解析时从行尾开始匹配最后一个 `<!--{remId} {metadata}-->` 模式：

```
正则：/<!--(\S+)((?:\s+\S+:\S+)*)-->$/
```

- `(\S+)` 匹配 remId
- `((?:\s+\S+:\S+)*)` 匹配零或多个 ` key:value` 对
- `$` 确保从行尾匹配

**D6: 折叠节点删除策略**

删除带 `children:N` 标记的折叠节点时，报错并要求 AI 先 `read-tree` 展开后再操作：

```json
{
  "error": "Cannot delete rem010 (降维方法) because it has N hidden children. Use read-tree to expand first.",
  "hidden_children_count": 5
}
```

**D7: 根节点行为只读锚点**

大纲第一行（根节点）不可被删除、移动或修改。**检测时机**：解析修改后的大纲为树结构时，验证第一行的 remId 是否仍为原根节点，且缩进仍为 0 级。违反时报错。

**D8: 新增行在折叠节点下的位置**

新增行追加到该父节点的所有子节点（含不可见的）之后，即 `position = children.length`。AI 应知晓：折叠节点下新增的行会排在所有已有（不可见）子节点之后。

**D9: 元数据解析时只提取 remId，忽略元数据变更**

AI 在 str_replace 中可能无意修改元数据（如 `fc:concept` → `fc:forward`）。解析时只提取 remId，元数据部分不参与 diff 比较，也不会写回。

**D10: tree-serializer 的层归属**

序列化需要拆分为两部分：
- **SDK 调用部分**（toMarkdown、getChildrenRem 等）→ 放在 `services/read-tree.ts`
- **纯文本拼接部分**（分隔符推导 + 元数据拼接 + 缩进格式化）→ 放在 `utils/tree-serializer.ts`（无副作用的纯函数）

`read-tree.ts` 遍历子树获取每个 Rem 的原始数据（含 toMarkdown 结果），传给 `tree-serializer.ts` 的纯函数拼接为最终的大纲行。

### 性能考虑

- Plugin 的 `readTree()` 在 Plugin 侧一次性完成遍历和序列化，**单次 WS 往返**即可获取整棵树
- read-tree 设置节点数上限（默认 500），超出时报错并建议缩小 depth
- edit-tree 的子操作按序执行，每个操作一次 WS 往返
- **read-tree 的 Plugin 请求超时**可能需要大于默认 15 秒（500 节点树的遍历 + 序列化），实现时评估并按需调大

### 安全考虑

- 三道防线机制复用，适配到树模式的大纲文本格式
- 禁止修改已有行内容（内容变更检测 → 报错）
- 删除操作的孤儿检测 + 折叠子节点保护
- 根节点不可删除

## System-Wide Impact

- **新增 Plugin actions**：`read_tree`、`create_rem`、`delete_rem`、`move_rem`、`reorder_children`——需在 `message-router.ts` 中添加 5 个 case 分支
- **RemCache 键前缀迁移**：现有 `read-handler.ts` 和 `edit-handler.ts` 需要适配 `rem:` 前缀。缓存在内存中，daemon 重启后自然清空，无需兼容旧 key
- **ws-server.ts 需新增 handler 实例**：创建 TreeReadHandler 和 TreeEditHandler，注入同一个 remCache 实例
- **与单 Rem 模式的交互**：edit-rem 修改某个 Rem 后，该 Rem 所属的 tree 缓存在下次 edit-tree 防线 2 时自然失效（正确行为）

## Acceptance Criteria

### 功能需求

- [x] `read-tree <remId> --depth N` 返回正确格式的 Markdown 大纲
- [x] 大纲格式：`{缩进}{Markdown内容} <!--{remId} {元数据}-->`
- [x] 行内容拼接规则：正确推导 10 种分隔符（对照 `docs/rem-type-mapping/README.md`）
- [x] 元数据推导正确：`fc`、`role`、`type`、`tags`、`children`
- [x] `--depth` 参数正确控制展开深度（1/2/3/-1），默认 3
- [x] depth=0 只显示根节点本身，不展开子节点
- [x] 超过深度的子树显示折叠标记 `children:N`
- [x] `edit-tree` 支持新增行（无 ID 标记 → createRem）
- [x] `edit-tree` 支持删除行（ID 消失 → remove）
- [x] `edit-tree` 支持移动行（缩进变化 → setParent）
- [x] `edit-tree` 支持重排行（同级位置变化 → 重排 children）
- [x] 禁止修改已有行内容 → 报错并提示用 edit-rem
- [x] 新增行支持 RemNote Markdown 闪卡语法（通过 parseFromMarkdown）
- [x] 新增行支持嵌套父子关系（先创建父再创建子）
- [x] `--json` 输出符合项目规范（`ok`/`command`/`error` 字段）

### JSON 输出结构

**read-tree 成功：**
```jsonc
{
  "ok": true,
  "command": "read-tree",
  "data": {
    "rootId": "doc001",
    "depth": 3,
    "nodeCount": 14,
    "outline": "机器学习笔记 <!--doc001 type:document-->\n  监督学习 <!--rem002-->..."
  }
}
```

**edit-tree 成功：**
```jsonc
{
  "ok": true,
  "command": "edit-tree",
  "operations": [
    { "type": "create", "remId": "new_xxx", "parent": "rem007", "position": 2 },
    { "type": "delete", "remId": "rem004" },
    { "type": "move", "remId": "rem008", "from": "rem007", "to": "rem010" },
    { "type": "reorder", "parent": "doc001", "order": ["rem011", "rem002", "rem006"] }
  ]
}
```

**edit-tree 错误示例：**
```jsonc
// 内容变更禁止
{
  "ok": false, "command": "edit-tree",
  "error": "Content modification of existing Rem is not allowed in tree edit mode.",
  "modified_rems": [{ "remId": "rem003", "original_content": "...", "new_content": "..." }],
  "hint": "Use edit-rem rem003 --old-str ... --new-str ... for content changes."
}
// 孤儿检测
{
  "ok": false, "command": "edit-tree",
  "error": "Cannot delete rem006 because it has children that were not removed.",
  "orphaned_children": ["rem007", "rem010"]
}
// 折叠节点删除
{
  "ok": false, "command": "edit-tree",
  "error": "Cannot delete rem010 because it has 5 hidden children. Use read-tree to expand first.",
  "hidden_children_count": 5
}
```

### 防线需求

- [x] 防线 1：未 read-tree 直接 edit-tree 报错
- [x] 防线 2：树被外部修改时 edit-tree 报错
- [x] 防线 3：old_str 不匹配或多次匹配时报错
- [x] edit-tree 成功后自动更新缓存（连续 edit-tree 可工作）

### 错误处理

- [x] 不存在的 remId → `Rem not found` 错误
- [x] 删除带可见子行但子行未被删除 → 孤儿错误
- [x] 删除折叠节点（children:N）→ 报错要求先展开
- [x] 删除/移动/修改根节点 → 报错
- [x] 内容变更检测 → 报错并提示用 edit-rem
- [x] 节点数超限（>500）→ 报错建议缩小 depth
- [x] 新增行缩进跳级（向上找不到"少一级"的行）→ 报错
- [x] old_str == new_str（无变更）→ 直接返回成功（noop）

### 分层需求

- [x] CLI 命令级同态命名（read-tree / read_tree / readTree）
- [x] 内部原子操作 action 与 service 同名（create_rem / createRem 等）
- [x] Plugin services 不碰 WS，CLI handlers 不碰 SDK
- [x] `node scripts/check-layer-deps.js` 通过
- [ ] 缓存键前缀迁移后 read-rem / edit-rem 回归测试通过

## Success Metrics

- read-tree 正确序列化包含所有 10 种分隔符类型的子树
- edit-tree 四种操作（增/删/移/重排）在端到端测试中全部通过
- 连续 edit-tree（不重新 read-tree）正常工作
- 三道防线在对应场景下全部触发

## Dependencies & Risks

### Dependencies

- 现有的 `RemCache`、`sendDaemonRequest`、`BridgeServer` 基础设施（已实现）
- RemNote SDK 的 `rem.getChildrenRem()`、`rem.remove()`、`rem.setParent()`、`plugin.rem.createRem()` 等 API
- Plugin SDK 的 `plugin.richText.toMarkdown()` 和 `plugin.richText.parseFromMarkdown()`

### Risks

| 风险 | 影响 | 缓解 |
|:--|:--|:--|
| `toMarkdown()` 产生多行输出 | 破坏"每 Rem 一行"假设 | 序列化时替换 `\n` 为空格；若影响代码块/表格格式则该 Rem 在 read-tree 中标记为"需用 read-rem 查看" |
| `toMarkdown()` 非确定性输出 | 防线 2 永远失败 | 实现前实测确认确定性；必要时在 Plugin 侧 normalize 输出 |
| 大树（500+ 节点）性能 | 防线 2 延迟高 | 设置节点上限 + 为 read_tree 单独设置更大超时 |
| `parseFromMarkdown()` 解析失败 | 新增行创建失败 | 捕获错误，返回详细错误信息含原始文本 |
| `[[引用名]]` 引用不存在的 Rem | 可能创建空 Rem | 由 parseFromMarkdown 官方行为决定，不做额外干预 |
| 缓存键前缀迁移影响现有功能 | read-rem / edit-rem 回归 | 缓存在内存中、daemon 重启即清空，迁移后跑回归测试 |
| SDK 无 `setChildrenOrder` API | 重排实现复杂度增加 | 实现前查阅 SDK Rem 类文档确认；备选方案：逐个 `setParent(parent, position)` |

### 待验证的 SDK 行为（实现前必须确认）

1. **`parseFromMarkdown("岭回归 :: 带 L2 正则化的线性回归")`** 是否自动拆分为 text/backText 并设 type=concept？还是只返回纯 RichText 数组？
2. **`rem.setParent(parent, position)`** 的 position 参数语义：0-based index？相对位置？是否自动更新原父节点的 children？
3. **`toMarkdown(richText)`** 是否对相同输入始终产生相同输出（确定性）？
4. **是否存在 `setChildrenOrder` 或等效 API**？

## Implementation Outline

### Phase 1: 基础设施准备

**目标**：缓存键前缀迁移 + Plugin 层树遍历/序列化 service

涉及文件：
- `remnote-cli/src/handlers/read-handler.ts` — 缓存 key 改为 `'rem:' + remId`
- `remnote-cli/src/handlers/edit-handler.ts` — 缓存 key 改为 `'rem:' + remId`
- `remnote-plugin/src/services/read-tree.ts` — **新建**：readTree() 递归遍历子树，调用 toMarkdown，传给 serializer
- `remnote-plugin/src/utils/tree-serializer.ts` — **新建**：纯函数，接收 Rem 数据拼接为大纲行
- `remnote-plugin/src/bridge/message-router.ts` — 添加 `case 'read_tree'`

**关键接口定义：**

```typescript
// utils/tree-serializer.ts（纯函数，无副作用）
interface SerializableRem {
  id: string;
  markdownText: string;        // toMarkdown(rem.text) 的结果
  markdownBackText: string | null; // toMarkdown(rem.backText) 或 null
  type: string;                // 'concept' | 'descriptor' | 'default'
  hasMultilineChildren: boolean;
  practiceDirection: string;
  isCardItem: boolean;
  isDocument: boolean;
  isPortal: boolean;
  childrenCount: number;       // 用于折叠标记
  tagCount: number;
  hasCloze: boolean;           // text 中是否包含 cloze 对象
}

function serializeRemLine(rem: SerializableRem): string  // 不含缩进
function buildOutline(tree: OutlineTree): string          // 含缩进

// handlers/tree-parser.ts（CLI 侧纯函数）
interface OutlineNode {
  remId: string | null;         // null = 新增行
  depth: number;                // 缩进级别（0 = 根）
  rawContent: string;           // 去掉缩进和标记后的纯内容
  rawLine: string;              // 原始行文本
  children: OutlineNode[];
}

function parseOutline(text: string): OutlineNode[]
function diffTrees(oldTree: OutlineNode[], newTree: OutlineNode[]): TreeDiffResult
```

### Phase 2: read-tree 命令端到端

**目标**：`remnote-cli read-tree <remId> --depth N --json` 可用

涉及文件：
- `remnote-cli/src/commands/read-tree.ts` — **新建**：CLI 命令入口
- `remnote-cli/src/handlers/tree-read-handler.ts` — **新建**：缓存管理（key = `'tree:' + remId`）
- `remnote-cli/src/server/ws-server.ts` — 添加 `read_tree` action 分发，注入 TreeReadHandler（使用同一个 remCache）
- `remnote-cli/src/index.ts` — 注册 read-tree 命令

**命令函数签名：**

```typescript
export interface ReadTreeOptions {
  json?: boolean;
  depth?: number;  // 默认 3，-1 = 全部展开
}
export async function readTreeCommand(remId: string, options: ReadTreeOptions): Promise<void>
```

### Phase 3: edit-tree 命令 — diff 算法 + 防线

**目标**：`remnote-cli edit-tree <remId> --old-str ... --new-str ... --json` 可用

涉及文件：
- `remnote-cli/src/commands/edit-tree.ts` — **新建**：CLI 命令入口
- `remnote-cli/src/handlers/tree-edit-handler.ts` — **新建**：三道防线 + diff 调用 + 操作编排
- `remnote-cli/src/handlers/tree-parser.ts` — **新建**：大纲文本 ↔ 树结构解析 + diff
- `remnote-cli/src/server/ws-server.ts` — 添加 `edit_tree` action 分发，注入 TreeEditHandler

**命令函数签名：**

```typescript
export interface EditTreeOptions {
  json?: boolean;
  oldStr: string;
  newStr: string;
}
export async function editTreeCommand(remId: string, options: EditTreeOptions): Promise<void>
```

### Phase 4: edit-tree 子操作 — Plugin 写入 services

**目标**：增/删/移/重排操作通过 Plugin SDK 执行

涉及文件：
- `remnote-plugin/src/services/create-rem.ts` — **新建**：createRem + parseFromMarkdown + setParent
- `remnote-plugin/src/services/delete-rem.ts` — **新建**：rem.remove()
- `remnote-plugin/src/services/move-rem.ts` — **新建**：rem.setParent(newParent, position)
- `remnote-plugin/src/services/reorder-children.ts` — **新建**：设置 children 排序（优先用 setChildrenOrder，若无则逐个 setParent）
- `remnote-plugin/src/bridge/message-router.ts` — 添加 4 个 case 分支

### Phase 5: 测试 + 错误处理完善

**目标**：所有边界情况和错误路径覆盖

- 端到端测试：read-tree 序列化 10 种分隔符（对照 `docs/rem-type-mapping/README.md` 逐一验证）
- 端到端测试：edit-tree 四种操作各自独立测试
- 端到端测试：edit-tree 混合操作（同时新增 + 移动到新增 Rem 下）
- 端到端测试：连续 edit-tree（不重新 read-tree）
- 防线测试：三道防线各自触发
- 错误路径测试：内容修改禁止、孤儿检测、折叠节点删除、根节点保护、缩进跳级、不存在的 remId
- 回归测试：缓存键前缀迁移后 read-rem / edit-rem 正常工作
- 跨模式测试：read-tree → read-rem → edit-rem → edit-tree（防线 2 正确拒绝）

## Sources & References

### Internal References

- **需求规范**：[docs/初始需求/remnote-cli-tree-mode-spec.md](../初始需求/remnote-cli-tree-mode-spec.md)
- **分隔符映射**：[docs/rem-type-mapping/README.md](../rem-type-mapping/README.md)
- **RichText 格式参考**：[docs/richtext-format/README.md](../richtext-format/README.md)
- **单 Rem 模式计划**：[docs/plans/2026-03-03-feat-single-rem-read-write-plan.md](2026-03-03-feat-single-rem-read-write-plan.md)
- **踩坑记录**：[docs/solutions/logic-errors/string-search-and-timer-scope-bugs.md](../solutions/logic-errors/string-search-and-timer-scope-bugs.md) — countOccurrences 重叠匹配 Bug

### 关键现有代码（实现模式参考）

- ReadHandler 模式：`remnote-cli/src/handlers/read-handler.ts`
- EditHandler 三道防线：`remnote-cli/src/handlers/edit-handler.ts`
- Plugin readRem service：`remnote-plugin/src/services/read-rem.ts`
- message-router 分发：`remnote-plugin/src/bridge/message-router.ts`
- ws-server 请求分发：`remnote-cli/src/server/ws-server.ts`

### SpecFlow 分析关键发现

- **缓存键冲突**：read-tree 和 read-rem 的缓存必须隔离 → 决策 D2
- **edit-tree 后缓存更新**：必须更新，否则连续 edit-tree 不可用 → 决策 D3
- **折叠节点删除**：报错要求先展开 → 决策 D6
- **文本含 `<!--`**：从右向左解析行尾标记 → 决策 D5
- **混合操作顺序**：创建 → 移动 → 重排 → 删除 → 决策 D4
- **嵌套新增的创建顺序**：按层级从浅到深创建 → 决策 D4
- **tree-serializer 层归属**：SDK 调用在 services，纯函数在 utils → 决策 D10

### 需求规范待修正项

需求规范完整示例中的 `fc` 元数据值与推导规则表不一致：
- 示例 `fc:basic-forward` → 应为 `fc:forward`（以推导表为准）
- 示例 `fc:multiline-front` → 应为 `fc:multiline`（以推导表为准）

实现时以元数据推导规则表（需求规范第 119-134 行）为准。
