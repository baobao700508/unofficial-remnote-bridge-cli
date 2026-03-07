# edit-tree

> 通过 str_replace 对 Markdown 大纲进行结构编辑（行级增/删/移/重排），禁止修改已有行内容。

---

## 功能

`edit-tree` 基于 `read-tree` 缓存的 Markdown 大纲，使用 str_replace 替换文本片段，解析新旧大纲的结构差异，自动生成并执行原子操作。

核心能力：
- **新增行**：在大纲中插入无 remId 的新行，支持 Markdown 前缀和箭头分隔符
- **删除行**：从大纲中移除带 remId 的行（必须同时删除所有子行）
- **移动行**：改变行的缩进层级或移到不同父节点下
- **重排行**：调换同级行的顺序
- 三道防线保障数据安全（缓存存在性、乐观并发检测、精确匹配）
- SDK bug 自动修复（practiceDirection 保护）

**核心限制**：仅支持结构操作，**禁止修改已有行的内容**——内容修改走 `edit-rem`。

---

## 用法

### 人类模式

```bash
remnote edit-tree <remId> --old-str <text> --new-str <text>
```

| 参数/选项 | 类型 | 必需 | 说明 |
|-----------|------|:----:|------|
| `remId` | string（位置参数） | 是 | 已 read-tree 过的子树根节点 Rem ID |
| `--old-str` | string | 是 | 待替换的原始文本片段（必须精确匹配缓存中的大纲） |
| `--new-str` | string | 是 | 替换后的新文本片段 |

### JSON 模式

```bash
remnote edit-tree --json '{"remId":"kLrIOHJLyMd8Y2lyA","oldStr":"  旧行 <!--id1-->","newStr":"  新行\n  旧行 <!--id1-->"}'
```

---

## JSON 输入参数

| 字段 | 类型 | 必需 | 说明 |
|------|------|:----:|------|
| `remId` | string | 是 | 子树根节点 Rem ID |
| `oldStr` | string | 是 | 待替换的原始文本片段 |
| `newStr` | string | 是 | 替换后的新文本片段 |

---

## JSON 输出

### 成功

```json
{
  "ok": true,
  "command": "edit-tree",
  "operations": [
    { "type": "create", "content": "新节点", "parentId": "abc123", "position": 0 },
    { "type": "move", "remId": "def456", "fromParentId": "abc123", "toParentId": "ghi789", "position": 1 },
    { "type": "reorder", "parentId": "abc123", "order": ["child1", "child2", "child3"] },
    { "type": "delete", "remId": "xyz789" }
  ]
}
```

### 无结构变更

```json
{
  "ok": true,
  "command": "edit-tree",
  "operations": []
}
```

### 缓存未建立

```json
{
  "ok": false,
  "command": "edit-tree",
  "error": "Tree rooted at kLrIOHJLyMd8Y2lyA has not been read yet. Use read-tree first."
}
```

### 并发冲突

```json
{
  "ok": false,
  "command": "edit-tree",
  "error": "Tree rooted at kLrIOHJLyMd8Y2lyA has been modified since last read-tree. Please read-tree again."
}
```

### old_str 匹配失败

```json
{
  "ok": false,
  "command": "edit-tree",
  "error": "old_str not found in the tree outline of kLrIOHJLyMd8Y2lyA"
}
```

```json
{
  "ok": false,
  "command": "edit-tree",
  "error": "old_str matches 3 locations in the tree outline of kLrIOHJLyMd8Y2lyA. Make old_str more specific to match exactly once."
}
```

### 禁止操作

```json
{
  "ok": false,
  "command": "edit-tree",
  "error": "Content modification of existing Rem is not allowed in tree edit mode.",
  "modified_rems": [
    { "remId": "abc123", "original_content": "旧文本", "new_content": "新文本" }
  ],
  "hint": "Use edit-rem abc123 --old-str ... --new-str ... for content changes."
}
```

### daemon 不可达

```json
{
  "ok": false,
  "command": "edit-tree",
  "error": "守护进程未运行，请先执行 remnote connect"
}
```

---

## 三道防线

### 防线 1：缓存存在性检查

```
必须先 read-tree → 建立缓存 → 再 edit-tree
```

检查 `cache.get('tree:' + remId)` 是否存在。不存在则拒绝编辑。

### 防线 2：乐观并发检测

```
用 read-tree 时的相同参数（depth, maxNodes, maxSiblings）重新从 Plugin 获取最新大纲 → 与缓存对比
```

- 缓存中同时存储了 `tree-depth:`、`tree-maxNodes:`、`tree-maxSiblings:` 用于复现查询
- 如果最新大纲与缓存不一致，拒绝编辑且**不更新缓存**——迫使 Agent 重新 read-tree

### 防线 3：str_replace 精确匹配

```
oldStr 必须在缓存大纲中恰好匹配 1 次
```

- 0 次匹配：`old_str not found`
- \>1 次匹配：`matches N locations, make old_str more specific`
- 精确 1 次：执行替换，得到修改后的大纲

---

## 支持的操作

### 新增行

在 newStr 中添加**无 remId 注释**的新行。新行可以使用 Markdown 前缀和箭头分隔符来设置属性。

```
oldStr:
  子节点 A <!--idA-->

newStr:
  新增节点
  子节点 A <!--idA-->
```

#### 新增行的 Markdown 前缀

| 前缀 | 效果 |
|------|------|
| `# text` | 创建 H1 标题 |
| `## text` | 创建 H2 标题 |
| `### text` | 创建 H3 标题 |
| `- [ ] text` | 创建未完成待办 |
| `- [x] text` | 创建已完成待办 |
| `` `text` `` | 创建代码块 |
| `---` | 创建分隔线 |

#### 新增行的箭头分隔符

| 箭头 | 格式 | 效果 |
|------|------|------|
| ` → ` | `问题 → 答案` | 创建 forward 闪卡（单行） |
| ` ← ` | `问题 ← 答案` | 创建 backward 闪卡（单行） |
| ` ↔ ` | `问题 ↔ 答案` | 创建 both 闪卡（单行） |
| ` ↓` | `问题 ↓` | 创建 forward 多行闪卡（子节点为答案） |
| ` ↑` | `问题 ↑` | 创建 backward 多行闪卡 |
| ` ↕` | `问题 ↕` | 创建 both 多行闪卡 |

#### 嵌套新增

新增行下面可以再嵌套新增行，通过缩进表示父子关系：

```
newStr:
  父节点 ↓
    答案行 1
    答案行 2
  子节点 A <!--idA-->
```

嵌套新增行的父 ID 通过内部占位标记 `__new_N__` 管理，创建顺序保证从浅到深。

### 删除行

从 newStr 中移除带 remId 的行。**必须同时删除该行的所有可见子行**，否则报 orphan_detected 错误。

```
oldStr:
  子节点 A <!--idA-->
    孙节点 A1 <!--idA1-->
  子节点 B <!--idB-->

newStr:
  子节点 B <!--idB-->
```

删除操作按深度**从深到浅**执行（先删子后删父），确保 RemNote SDK 不会拒绝操作。

### 移动行

改变行的缩进级别或位置，使其移动到新的父节点下：

```
oldStr:
  子节点 A <!--idA-->
    目标行 <!--idT-->
  子节点 B <!--idB-->

newStr:
  子节点 A <!--idA-->
  子节点 B <!--idB-->
    目标行 <!--idT-->
```

### 重排行

调换同级行的顺序：

```
oldStr:
  子节点 A <!--idA-->
  子节点 B <!--idB-->
  子节点 C <!--idC-->

newStr:
  子节点 C <!--idC-->
  子节点 A <!--idA-->
  子节点 B <!--idB-->
```

---

## 禁止的操作

| 操作 | 错误类型 | 错误信息 | 替代方案 |
|------|----------|----------|----------|
| 修改已有行内容 | `content_modified` | Content modification of existing Rem is not allowed in tree edit mode. | 使用 `edit-rem` |
| 删除/修改根节点 | `root_modified` | Root node cannot be changed, deleted or moved. | — |
| 删除有隐藏子节点的行 | `folded_delete` | Cannot delete {id} because it has {N} hidden children. | 用更大的 depth 重新 read-tree |
| 删除行但保留子节点 | `orphan_detected` | Cannot delete {id} because it has children that were not removed. | 同时删除所有子行 |
| 删除/修改省略占位符 | `elided_modified` | Cannot delete or modify elided region directly. | 用更大的 depth/maxSiblings 重新 read-tree 展开 |
| 缩进跳级 | `indent_skip` | 缩进跳级：行 ... 的缩进级别为 N，但找不到上一级的父节点。 | 检查缩进是否正确（每级 2 空格） |

---

## 操作执行顺序

diff 算法生成的操作按以下顺序排列并执行（在 `diffTrees` 中已排好）：

```
1. Create（新增）  — 按出现顺序，从浅到深
2. Move（移动）    — 父节点变更的行
3. Reorder（重排） — 同父节点内顺序变更
4. Delete（删除）  — 按深度从深到浅
```

每个操作通过 `forwardToPlugin` 调用对应的原子 SDK 操作：

| 操作 | Plugin action | payload |
|------|---------------|---------|
| create | `create_rem` + `write_rem_fields` | content, parentId, position + Markdown 属性 |
| delete | `delete_rem` | remId |
| move | `move_rem` + 条件性 `write_rem_fields` | remId, newParentId, position |
| reorder | `reorder_children` | parentId, order[] |

---

## practiceDirection 保护机制

RemNote SDK 存在已知 bug：

- `setIsCardItem(true)` 会**偷偷设置** `practiceDirection: "forward"`
- `setIsCardItem(false)` **不会清除** `practiceDirection`（不对称行为）

### 对策

**新增行（create）**：当父节点是多行闪卡（含 ↓↑↕ 箭头）时，新创建的子行需要 `isCardItem: true`。设置后立即用 `practiceDirection: 'none'` 覆盖 SDK 副作用。

**移动行（move）**：
- 移入多行父节点：设 `isCardItem: true` + `practiceDirection: 'none'`
- 移出多行父节点：设 `isCardItem: false` + `practiceDirection: 'none'`
- 例外：如果 Rem 自身有合法的 practiceDirection（箭头分隔符），保留不覆盖

---

## 缓存行为

| 场景 | 缓存行为 |
|------|----------|
| 全部操作成功 | 用相同参数重新 read-tree，更新 `tree:` 缓存 |
| 防线失败（1-3） | **不更新缓存**，迫使 Agent 重新 read-tree |
| Diff 错误 | **不更新缓存** |
| 操作执行中异常 | **不更新缓存**（已执行的操作保留，无回滚） |

---

## 退出码

| 退出码 | 含义 | 触发条件 |
|:------:|------|----------|
| 0 | 成功 | 操作成功或无结构变更（noop） |
| 1 | 业务错误 | 防线失败、Diff 错误、执行异常 |
| 2 | daemon 不可达 | daemon 未运行或 WS 连接失败 |

---

## 输出字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `operations` | TreeOp[] | 执行的原子操作列表 |
| `operations[].type` | string | 操作类型：`create` / `delete` / `move` / `reorder` |
| `error` | string | 失败时的错误消息 |
| `details` | object | Diff 错误时的详细信息（modified_rems、hint 等） |

---

## 内部流程

```
1. CLI 解析参数（remId, oldStr, newStr）
2. noop 检查：oldStr === newStr → 直接返回 ok
3. sendRequest → WS → daemon
4. daemon TreeEditHandler:
   ├─ 防线 1: cache.get('tree:' + remId) 存在？
   ├─ 防线 2: 用缓存的 depth/maxNodes/maxSiblings 重新 read-tree → 对比
   ├─ 防线 3: countOccurrences(cachedOutline, oldStr) === 1？
   ├─ modifiedOutline = cachedOutline.replace(oldStr, newStr)
   ├─ 解析新旧大纲为树（parseOutline）
   ├─ 对比差异（diffTrees）
   │   ├─ 根节点校验
   │   ├─ 省略行防线
   │   ├─ 内容变更检测
   │   ├─ 折叠删除防线
   │   ├─ 孤儿检测
   │   └─ 生成操作列表（create → move → reorder → delete）
   ├─ 逐项执行操作（forwardToPlugin 调用原子操作）
   │   ├─ create: create_rem + write_rem_fields
   │   ├─ move: move_rem + isCardItem 同步
   │   ├─ reorder: reorder_children
   │   └─ delete: delete_rem
   ├─ 全部成功 → 重新 read-tree 更新缓存
   └─ 返回 { ok: true, operations }
5. CLI 格式化输出
```

---

## 常见使用模式

### 在指定位置插入新行

```bash
remnote edit-tree kLr --old-str '  子节点 A <!--idA-->' --new-str '  新增行\n  子节点 A <!--idA-->'
```

### 删除一个叶子节点

```bash
remnote edit-tree kLr --old-str '    叶子节点 <!--leaf-->\n' --new-str ''
```

### 调换两个兄弟的顺序

```bash
remnote edit-tree kLr --old-str '  节点 A <!--idA-->\n  节点 B <!--idB-->' --new-str '  节点 B <!--idB-->\n  节点 A <!--idA-->'
```

### 将节点移到另一个父节点下

```bash
remnote edit-tree kLr --old-str '  旧父 <!--oldP-->\n    目标 <!--target-->\n  新父 <!--newP-->' --new-str '  旧父 <!--oldP-->\n  新父 <!--newP-->\n    目标 <!--target-->'
```
