---
title: "refactor: edit-tree 从 str_replace 迁移到行号编辑"
type: refactor
status: draft
date: 2026-03-16
origin: 调研：str_replace Token 浪费 → 行号编辑可行性评估
---

# refactor: edit-tree 从 str_replace 迁移到行号编辑

## Overview

将 edit-tree 的输入格式从 str_replace（`oldStr` + `newStr`）迁移到**行号编辑**（`insert` / `replace` / `delete`）。AI 通过行号指定编辑位置，系统内部仍复用现有的 diff 管线。

**设计原则**：对 AI 来说就是"带行号的文本编辑"，不暴露任何内部操作概念。

预计 AI 侧 **Token 节省 60-80%**。

## Problem Statement / Motivation

### str_replace 的 Token 浪费

一个"在第 2 行后插入一行"的操作：

```jsonc
// 现状：AI 必须复制大量上下文来定位 — ~250 tokens
{
  "oldStr": "  数组 <!--id1-->\n    动态数组 <!--id1_1-->\n    静态数组 <!--id1_2-->",
  "newStr": "  数组 <!--id1-->\n    新增：哈希表\n    动态数组 <!--id1_1-->\n    静态数组 <!--id1_2-->"
}

// 行号编辑：直接说"在第 2 行后插入" — ~30 tokens
{ "after": 2, "content": "    新增：哈希表" }
```

浪费来自三个地方：
1. **oldStr 是定位开销**：AI 复制多行（含 17 字符 Rem ID）只是为了告诉系统"编辑哪里"
2. **newStr 重复未修改行**：首尾不变的行在 old 和 new 中各出现一次
3. **精确复制容易出错**：AI 精确复制 `<!--kLrIOHJLyMd8Y2lyA type:concept doc-->` 有 5-10% 错误率，导致 `old_str not found`

行号可以零成本完成定位，让 AI 只输出**真正变化的部分**。

### 大纲本身就是行号场景

read-tree 的输出中，每一行 = 一个 Rem。天然适合行号寻址：

```
L1  # 数据结构 <!--kLr doc-->
L2    数组 <!--id1-->
L3      动态数组 <!--id1_1-->
L4      静态数组 <!--id1_2-->
L5    链表 <!--id2-->
L6    树 <!--id3 children:5-->
```

AI 看到行号，直接说"在 L2 后插入"、"删除 L5"、"把 L3-L4 替换成新内容"。简单直接。

### 行号漂移不是问题

纯行号方案在代码编辑中有漂移问题（删第 3 行后第 5 行变第 4 行）。但我们的场景中：

- 每次 edit-tree 只做**一次编辑**（与现有 str_replace 一致）
- 编辑成功后自动 re-read 更新缓存 + 行号
- AI 使用的行号始终来自最新的 read-tree 输出
- 不需要批量操作，不存在漂移

## Proposed Solution

### 核心思路

**用行号代替文本匹配来定位，其余一切不变。**

现有管线：
```
oldStr + newStr → str_replace → 得到修改后大纲 → parseOutline → diffTrees → 原子操作
```

新管线：
```
行号编辑（insert/delete/replace）→ 对缓存大纲做行级操作 → 得到修改后大纲 → parseOutline → diffTrees → 原子操作
                                                          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                                          完全复用现有代码，一行不改
```

变化的只有**输入到"修改后大纲"这一步**。后面的 parseOutline、diffTrees、操作执行全部原封不动。

### 三种编辑动作

#### insert — 在某行后插入新内容

```jsonc
{ "remId": "kLr", "after": 2, "content": "    新增：哈希表" }
```

- `after`: 在第几行后面插入（0 = 在最前面插入）
- `content`: 要插入的内容（可多行，用 `\n` 分隔）
- 插入行遵循现有的 Markdown 前缀 + 箭头分隔符 + 元数据注释语法

#### delete — 删除指定行

```jsonc
{ "remId": "kLr", "delete": [3, 5] }
```

- `delete`: 行号范围 `[from, to]`（闭区间），删除第 3 行到第 5 行
- 删除单行：`[5, 5]`

#### replace — 替换指定行范围

```jsonc
{ "remId": "kLr", "replace": [3, 4], "content": "    动态数组 <!--id1_1-->\n    新增：字典数组\n    静态数组 <!--id1_2-->" }
```

- `replace`: 行号范围 `[from, to]`（闭区间）
- `content`: 替换后的内容

**move 操作**：AI 通过 replace 实现。选中包含源和目标的行范围，在 content 中调整行的位置/缩进即可（与现有 str_replace 中的 move 方式完全一致，只是定位从文本匹配改为行号）。

### 内部处理流程

```
1. 防线 1: 检查缓存存在
2. 防线 2: re-read 对比大纲（不变）
3. 行号校验: 行号在合法范围内？引用了省略行？
4. 行级编辑: 在缓存大纲上执行 insert/delete/replace → 得到修改后大纲
5. parseOutline + diffTrees（完全复用现有代码）
6. 执行原子操作（完全复用现有代码）
7. 成功后 re-read 更新缓存 + 行号映射
```

步骤 4 是唯一的新代码：简单的字符串行级操作（split lines → splice → join）。
步骤 5-7 = 现有 `handleEditTree` 中 str_replace 之后的全部代码，一行不改。

### edit-tree 返回更新后大纲

目前 edit-tree 成功后内部会 re-read 更新缓存，但**不返回新大纲给 AI**。这导致 AI 创建新 Rem 后不知道新 Rem 的 ID 和行号，被迫再调一次 read-tree。

改进：将 re-read 得到的更新大纲（带行号）一并返回：

```jsonc
{
  "ok": true,
  "operations": [...],
  "outline": "L1  # 数据结构 <!--kLr doc-->\nL2    数组 <!--id1-->\nL3    新建Rem <!--newId-->\n..."
}
```

这样 AI 一次 read-tree + N 次 edit-tree 就能完成所有操作，中间不需要再 read。这个改进**独立于行号方案**，str_replace 模式也应该做。

## Technical Design

### D1: read-tree 输出添加行号

在大纲每行前添加行号前缀 `L{N}  `（L + 数字 + 两个空格）：

```
L1  # 数据结构 <!--kLr doc-->
L2    数组 <!--id1-->
L3      动态数组 <!--id1_1-->
L4      静态数组 <!--id1_2-->
L5    链表 <!--id2-->
L6      <!--...elided 8 siblings maxSiblings=3-->
L7    树 <!--id3 children:5-->
```

- 行号从 1 开始，连续递增（含省略行）
- 行号前缀是**展示层概念**，不存储在缓存中
- 缓存中的 outline 仍是无行号的原始格式（防线 2 比对逻辑不变）
- 行号前缀在 **CLI 命令 / MCP 工具返回时**动态添加

**行号 → ID 映射**：read-tree 成功后，Handler 额外缓存 `tree-lines:{remId}` = `Map<number, { remId: string | null, isElided: boolean }>`。从无行号的大纲按行 split + parseLine 提取即可。

### D2: edit-tree 输入格式

JSON 模式输入通过字段存在性判断走新/旧路径：

```typescript
// 新路径：有 after / delete / replace 字段
{ remId: string; after: number; content: string }          // insert
{ remId: string; delete: [number, number] }                // delete
{ remId: string; replace: [number, number]; content: string } // replace

// 旧路径（deprecated）：有 oldStr + newStr 字段
{ remId: string; oldStr: string; newStr: string }
```

人类 CLI 模式保留 `--old-str` / `--new-str`（在终端手写行号操作不现实）。

### D3: 行级编辑实现

行级编辑是一个**纯函数**，输入缓存大纲 + 编辑指令，输出修改后大纲：

```typescript
function applyLineEdit(
  cachedOutline: string,
  edit: InsertEdit | DeleteEdit | ReplaceEdit,
): string {
  const lines = cachedOutline.split('\n');
  // insert: lines.splice(after, 0, ...newLines)
  // delete: lines.splice(from - 1, to - from + 1)
  // replace: lines.splice(from - 1, to - from + 1, ...newLines)
  return lines.join('\n');
}
```

得到修改后大纲后，直接喂给现有的 `parseOutline()` + `diffTrees()`。

### D4: 防线机制

| 防线 | 变更 | 说明 |
|:-----|:-----|:-----|
| 防线 1：缓存存在性 | **不变** | |
| 防线 2：乐观并发 | **不变** | |
| 防线 3 | **替换** | 从 str_replace 精确匹配 → 行号范围校验 |

新防线 3 的校验：
- 行号在 `[1, totalLines]` 范围内
- `from <= to`（范围有效）
- 引用的行不是省略行（`isElided`）
- insert 的 `after` 在 `[0, totalLines]` 范围内

**现有 diff 错误无需改动**：`content_modified`、`orphan_detected`、`folded_delete`、`root_modified` 等检查仍在 `diffTrees()` 中执行。行号编辑只是改变了"修改后大纲"的生成方式，diff 的输入输出不变。

### D5: MCP 工具接口

```typescript
server.addTool({
  name: 'edit_tree',
  description: '通过行号对 read_tree 的大纲进行编辑...',
  parameters: z.object({
    remId: z.string().describe('根 Rem 的 ID（与 read_tree 时相同）'),
    // 三选一：insert / delete / replace
    after: z.number().optional().describe('insert 模式：在第几行后插入（0 = 最前面）'),
    delete: z.tuple([z.number(), z.number()]).optional().describe('delete 模式：删除行号范围 [from, to]'),
    replace: z.tuple([z.number(), z.number()]).optional().describe('replace 模式：替换行号范围 [from, to]'),
    content: z.string().optional().describe('insert/replace 的新内容（可多行）'),
  }),
});
```

## Token Savings Analysis

| 操作 | str_replace (tokens) | 行号编辑 (tokens) | 节省 |
|:-----|:---------------------|:------------------|:-----|
| 插入 1 行 | ~200（需 oldStr 上下文） | ~30（after + content） | **85%** |
| 删除 1 行 | ~150（需 oldStr+newStr） | ~15（delete 范围） | **90%** |
| 删除 3 行 | ~250 | ~15 | **94%** |
| 替换（移动/重排） | ~300 | ~120（仍需 content） | **60%** |
| read-tree 输出增加 | — | +4 字符/行（行号前缀） | 微量增加 |

**综合场景**（20 行大纲，删 1 行 + 新增 2 行，两次 edit-tree 调用）：
- str_replace：~500 tokens
- 行号编辑：~60 tokens
- 节省：**88%**

## System-Wide Impact

### 改动极小

| 文件 | 变更 | 代码量 |
|:-----|:-----|:-------|
| `tree-edit-handler.ts` | 新增 `handleLineEdit` 方法 + 路由 | ~50 行新增 |
| `tree-edit-handler.ts` | 新增 `applyLineEdit` 纯函数 | ~30 行新增 |
| `tree-read-handler.ts` | 缓存行号映射表 | ~15 行修改 |
| `commands/edit-tree.ts` | JSON 输入路由 | ~10 行修改 |
| `commands/read-tree.ts` | 输出添加行号前缀 | ~5 行修改 |
| `mcp/tools/edit-tools.ts` | 参数改为行号编辑 | 重写 ~40 行 |
| Skill 文档 | 重写 | ~300 行 |

**完全不改**：tree-parser.ts（parseOutline / diffTrees）、Plugin 层全部代码、防线 1+2、缓存架构。

### 向后兼容

- 人类 CLI 模式（`--old-str`/`--new-str`）：不变
- JSON 模式 `oldStr`/`newStr`：仍可用，走旧路径
- MCP 工具：切换到新参数（AI 透明迁移）
- 连续 edit-tree：不变（成功后自动更新缓存 + 行号）

## Implementation Outline

### Phase 1: read-tree 添加行号（~30 行代码）

- `commands/read-tree.ts`：输出时给每行加 `L{N}  ` 前缀
- `handlers/tree-read-handler.ts`：缓存行号映射表 `tree-lines:{remId}`
- 验证：read-tree 输出带行号，映射表正确

### Phase 2: edit-tree 行号路径（~80 行代码）

- `handlers/tree-edit-handler.ts`：新增 `applyLineEdit()` + `handleLineEdit()`
- `commands/edit-tree.ts`：JSON 输入路由（有 after/delete/replace → 新路径）
- 验证：insert/delete/replace 各操作端到端可用

### Phase 3: MCP + Skill 接入（文档为主）

- `mcp/tools/edit-tools.ts`：参数改为行号编辑
- `skills/remnote-bridge/instructions/edit-tree.md`：重写
- 验证：MCP 调用 + Skill 文档准确

## Risks & Mitigations

| 风险 | 缓解 |
|:-----|:-----|
| AI 不习惯行号编辑 | 行号编辑比 str_replace 更简单（行号可见、无需精确复制）；MCP description 提供示例 |
| replace 仍需复制完整行内容 | 对于移动/重排场景确实如此，但定位成本（oldStr）已消除，整体仍大幅节省 |
| 省略行有行号但不可操作 | 引用省略行时返回清晰错误消息 |

## Sources & References

- **现有实现**：[tree-edit-handler.ts](../../src/cli/handlers/tree-edit-handler.ts)、[tree-parser.ts](../../src/cli/handlers/tree-parser.ts)
- **原计划**：[2026-03-04-feat-tree-mode-read-write-plan.md](2026-03-04-feat-tree-mode-read-write-plan.md)
- **外部调研**：MCP 生态的 `mcp-text-editor`（行号式编辑）、Perplexity 调研（行号 + ID 混合方案的行业实践）
