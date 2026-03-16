# edit-tree Patch/Diff 格式重构

## What This Is

将 `edit-tree` 的输入格式从 str_replace（oldStr/newStr 文本替换）重构为 patch/diff 格式（Rem ID 锚点 + 缩进定位）。面向 AI Agent 用户，目标是在保持准确性的前提下大幅降低 Token 消耗。

## Core Value

**用最少的 Token 精确表达树结构编辑意图。** 一种格式覆盖所有操作（create/delete/move/reorder），复用现有 diffTrees 引擎。

## Requirements

### Validated

- ✓ edit-tree 四种结构操作（create/delete/move/reorder）通过 diffTrees 自动推导 — existing
- ✓ 三道防线（缓存存在性检查、乐观并发检测、匹配校验）— existing
- ✓ 安全检测（children_captured、orphan_detected、folded_delete、elided_modified、root_modified）— existing
- ✓ Plugin 层原子操作（create_rem/delete_rem/move_rem/reorder_children）— existing
- ✓ read-tree 输出带 Rem ID + 缩进的大纲格式 — existing
- ✓ read-tree 祖先感知（ancestorLevels 参数）— existing
- ✓ 缓存自动更新机制（edit-tree 成功后自动 re-read 刷新缓存）— existing

### Active

- [ ] 新输入格式：patch/diff 替代 str_replace
- [ ] 上下文行用缩进 + Rem ID（不含内容文本）做锚点
- [ ] 新增行（`+`）带缩进 + 内容
- [ ] 删除行（`-`）带缩进 + Rem ID
- [ ] 支持多 hunk（`...` 分隔），move 等跨区域操作必需
- [ ] patch 解析器：解析 diff 格式，提取 hunk 列表
- [ ] patch 应用器：将 hunk 基于 Rem ID 匹配应用到缓存大纲，生成新大纲
- [ ] 锚点校验：缩进必须与缓存大纲完全匹配
- [ ] 冲突检测：同一 patch 内 hunk 间的 ID 引用冲突（删除后引用等）
- [ ] 全层同态更新：CLI 命令、Handler、MCP 工具、Skill 文档同步
- [ ] 旧 str_replace 接口完全移除（不保留向后兼容）

### Out of Scope

- 行内内容编辑 — edit-tree 设计之初就禁止修改已有 Rem 内容（content_modified 防线），内容编辑走 edit-rem
- 根节点同级操作 — 不允许在 read-tree 根节点的同级插入/删除（超出子树范围）
- 新建 Rem 的跨 hunk 引用 — 新建的 Rem 没有 ID，后续 hunk 不能引用它，需要拆成两次调用
- read-tree 输出格式变更 — read-tree 格式不变，patch 直接复用现有格式中的缩进和 Rem ID

## Context

### 当前 str_replace 的问题

1. **Token 浪费**：AI 必须在 oldStr 中复制完整行内容（含 Rem ID、元数据注释、正文）才能定位。即使只改一行，也需要额外的上下文行来保证唯一匹配。
2. **单次单处**：每次调用只能替换一处。改多个不相邻的地方需要多次调用，每次都要复制上下文。
3. **匹配脆弱**：oldStr 必须和缓存大纲逐字匹配（含缩进空格数量）。据 Aider 调研数据，str_replace 13% 的失败率中 77% 是 oldStr 匹配不到。

### 新 patch/diff 格式的优势

1. **Token 高效**：上下文行只写 `<!--remId-->`（~20 字符），省掉完整内容文本（可能 50-100+ 字符/行）。
2. **天然精确**：Rem ID 是绝对地址、天然唯一，不存在匹配歧义。双锚点（上下各一个 ID）提供 between 语义。
3. **多 hunk 支持**：move 等跨区域操作在一次调用内完成，diffTrees 能正确识别为 move 而非 delete+create。
4. **全复用**：patch 应用后生成新大纲，走现有 diffTrees → TreeOps → Plugin 原子操作链路，防线和安全检测全部继承。

### 行业调研结论

- 成熟产品（Aider、OpenAI v4a patch、Claude Code multi_edit）均支持多段编辑
- Search/replace 在大模型上整体准确率最高（GPT-4.1: 96%, Claude Sonnet: ~90%），但我们的场景中 Rem ID 做锚点比纯文本匹配更精确
- Claude 模型对 diff 格式合规率 99.2%+，格式不是瓶颈

### 设计详解

**read-tree 输出**（不变）：
```
项目概述 <!--r doc-->
  技术架构 <!--a-->
    前端 <!--a1-->
    后端 <!--a2-->
  产品需求 <!--b-->
  时间规划 <!--c-->
    Q1 <!--c1-->
```

**edit-tree 新输入**（patch 格式）：

Create（在 a2 后面加同级新行）：
```diff
    <!--a2-->
+    数据库
  <!--b-->
```

Delete（删除 b）：
```diff
    <!--a2-->
-  <!--b-->
  <!--c-->
```

Reorder（A1 和 A2 互换）：
```diff
  <!--a-->
-    <!--a1-->
    <!--a2-->
+    <!--a1-->
```

Move（A1 从 A 下移到 C 下）：
```diff
  <!--a-->
-    <!--a1-->
    <!--a2-->
...
    <!--c1-->
+    <!--a1-->
```

**系统处理流程**：
1. 解析 patch → 提取 hunk 列表
2. 通过 Rem ID + 缩进匹配到缓存大纲中的精确行
3. 应用增删 → 生成新大纲
4. diffTrees(旧大纲, 新大纲) → 推导 TreeOps
5. 执行 TreeOps → Plugin 原子操作（不变）
6. 成功后 re-read 更新缓存（不变）

### 影响范围

| 层 | 文件 | 改动 |
|---|---|---|
| CLI 命令层 | `src/cli/commands/edit-tree.ts` | 参数解析（patch 字符串替代 oldStr/newStr） |
| 业务编排层 | `src/cli/handlers/tree-edit-handler.ts` | str_replace 逻辑替换为 patch 解析+应用 |
| 新增模块 | `src/cli/handlers/patch-parser.ts`（暂定） | patch 解析器 + 应用器 |
| 解析层 | `src/cli/handlers/tree-parser.ts` | 不变（diffTrees 全复用） |
| Plugin 层 | `remnote-plugin/src/services/*` | 不变 |
| MCP 层 | `src/mcp/tools/edit-tools.ts` | 参数 schema 更新 |
| Skill 文档 | `skills/remnote-bridge/instructions/edit-tree.md` | 重写 |
| MCP instructions | `src/mcp/instructions.ts` | 同步更新 |

## Constraints

- **层边界**：patch 解析器属于 CLI handlers 层，不可渗入 Plugin 层或 MCP 层
- **同态命名**：CLI 命令名 `edit-tree`、协议 action `edit_tree`、services 函数名不变
- **缩进规则**：每级 2 个空格，与 read-tree 输出一致，patch 中的缩进必须完全匹配
- **接入层同步**：Skill 文档和 MCP tool description 必须同步更新

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 用 Rem ID 而非数字行号做锚点 | Rem ID 稳定唯一不漂移，数字行号在编辑后会偏移 | — Pending |
| patch/diff 格式而非 ID-based 操作列表 | 一种格式覆盖四种操作，复用 diffTrees；操作列表需要单独处理 move/reorder/position 语义 | — Pending |
| 上下文行只写 ID 不写内容 | Token 效率最大化，ID 天然唯一无需内容辅助定位 | — Pending |
| 支持多 hunk（`...` 分隔） | move 必须在同一次 diff 中看到 `-` 和 `+` 才能被识别，拆两次会变成 delete | — Pending |
| 完全替换 str_replace，不保留旧接口 | 减少维护负担，两种模式并存增加复杂度且无明显收益 | — Pending |
| 不改 read-tree 输出格式 | patch 直接复用现有输出中的缩进和 Rem ID，零改动 | — Pending |

---
*Last updated: 2026-03-16 after initialization*
