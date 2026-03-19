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
remnote-bridge edit-tree <remId> --old-str <text> --new-str <text>
```

| 参数/选项 | 类型 | 必需 | 说明 |
|-----------|------|:----:|------|
| `remId` | string（位置参数） | 是 | 已 read-tree 过的子树根节点 Rem ID |
| `--old-str` | string | 是 | 待替换的原始文本片段（必须精确匹配缓存中的大纲） |
| `--new-str` | string | 是 | 替换后的新文本片段 |

### JSON 模式

```bash
remnote-bridge edit-tree --json '{"remId":"kLrIOHJLyMd8Y2lyA","oldStr":"  旧行 <!--id1-->","newStr":"  新行\n  旧行 <!--id1-->"}'
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
  "error": "守护进程未运行，请先执行 remnote-bridge connect"
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

## 两种写法：模板模式与完整匹配模式

已有行（带 `<!--remId-->` 注释的行）在 oldStr/newStr 中支持两种写法：

### 模板模式（优先使用）

用 `{{remId}}` 引用已有行，系统在 str_replace 前自动展开为完整行内容（不含缩进）。节省 token、减少复制错误。

```
# 重排
oldStr: "    {{id1_1}}\n    {{id1_2}}"
newStr: "    {{id1_2}}\n    {{id1_1}}"

# 移动（改变缩进 = 改变父节点）
oldStr: "  {{idA}}\n    {{idT}}\n  {{idB}}"
newStr: "  {{idA}}\n  {{idB}}\n    {{idT}}"

# 删除（必须同时删子行）
oldStr: "    {{idA}}\n    {{idA1}}\n    {{idB}}"
newStr: "    {{idB}}"

# 新增（新增行手动写，已有行用模板）
oldStr: "  {{idZ}}"
newStr: "  新增行\n  {{idZ}}"
```

**模板规则**：
- `{{remId}}` 展开为**不含缩进**的完整行内容，缩进由你控制
- 只匹配纯字母数字（`[a-zA-Z0-9]+`），与 RemNote cloze 语法 `{{text}}` 不冲突
- 匹配到但不在缓存大纲中的 `{{xxx}}` 原样保留（可能是 cloze），并输出 templateWarnings
- 新增行没有 remId，不能用模板表示

### 完整匹配模式（回退）

直接从大纲复制已有行的完整内容（含 `<!--remId 元数据-->`）。

```
# 重排
oldStr: "    动态数组 <!--id1_1 type:concept-->\n    静态数组 <!--id1_2 type:concept-->"
newStr: "    静态数组 <!--id1_2 type:concept-->\n    动态数组 <!--id1_1 type:concept-->"

# 移动
oldStr: "  子节点 A <!--idA-->\n    目标行 <!--idT-->\n  子节点 B <!--idB-->"
newStr: "  子节点 A <!--idA-->\n  子节点 B <!--idB-->\n    目标行 <!--idT-->"
```

### ⚠️ 回退策略

**优先使用模板模式**。但如果模板模式连续 2+ 次因 ID 错误导致 `old_str not found`，说明当前上下文不足以准确引用 ID——**立即切换到完整匹配模式**（重新 read_tree，从最新大纲复制完整行内容），不要反复重试模板。

---

## 支持的操作

### 新增行

在 newStr 中添加**无 remId 注释**的新行。新行可以使用 Markdown 前缀和箭头分隔符来设置属性。

```
# 模板模式
oldStr: "  {{idA}}"
newStr: "  新增节点\n  {{idA}}"

# 完整匹配模式
oldStr: "  子节点 A <!--idA-->"
newStr: "  新增节点\n  子节点 A <!--idA-->"
```

#### 新增行的 Markdown 前缀

| 前缀 | 效果 |
|------|------|
| `# text` | 创建 H1 标题 |
| `## text` | 创建 H2 标题 |
| `### text` | 创建 H3 标题 |
| `- [ ] text` | 创建未完成待办 |
| `- [x] text` | 创建已完成待办 |
| `1. text` | 创建有序列表项 |
| `` `text` `` | 创建代码块 |
| `---` | 创建分隔线 |

前缀可组合叠加，解析顺序为 Header → Todo → Quote → ListItem → Code。例如 `## - [ ] text` 创建 H2 + 未完成待办。

> **⚠️ 有序列表必须用 `1. ` 前缀**
>
> RemNote 的有序列表采用 Lazy Numbering 风格——所有列表项统一写 `1. `，RemNote 按层级自动编号为 1./2./3./A./B./I./II. 等。
>
> - **正确**：`1. 第一项`、`1. 第二项`、`1. 第三项`（全部用 `1. `）
> - **错误**：`2. 第二项`、`3. 第三项`（手动编号无意义，RemNote 会忽略）
>
> 系统会容错处理 `2. `~`9. ` 前缀（自动归一化为 `isListItem=true` 并返回 `templateWarnings` 警告），但 `10. ` 及以上不会被识别为有序列表，而是作为纯文本保留。

#### 新增行的箭头分隔符

箭头分隔符分为两类：**中间箭头**（有 backText）和**尾部箭头**（无 backText，子节点为答案）。

**中间箭头**（格式：`问题 {箭头} 答案`）：

| 箭头 | 效果 |
|------|------|
| ` → ` | forward 闪卡（单行） |
| ` ← ` | backward 闪卡（单行） |
| ` ↔ ` | both 闪卡（单行） |
| ` ↓ ` | forward 多行闪卡（带 backText） |
| ` ↑ ` | backward 多行闪卡（带 backText） |
| ` ↕ ` | both 多行闪卡（带 backText） |

**尾部箭头**（格式：`问题 {箭头}`，子节点为答案）：

| 箭头 | 效果 |
|------|------|
| ` ↓` | forward 多行闪卡 |
| ` ↑` | backward 多行闪卡 |
| ` ↕` | both 多行闪卡 |

> 已知限制：使用 indexOf 匹配第一个箭头，如果新增行内容本身包含箭头字符（如 `A → B → C`），会被误切割为 text + backText。

#### 新增行的元数据注释

在新增行末尾添加 HTML 注释可设置 Rem 属性（type、isDocument、tag）。注意：这是**不含 remId 的纯元数据注释**，与已有行的行尾标记（`<!--remId metadata-->`）格式不同。

语法：`<!--token1 token2 ...-->`

| token | 效果 |
|-------|------|
| `type:concept` | 设置 Rem 类型为 concept |
| `type:descriptor` | 设置 Rem 类型为 descriptor |
| `doc` | 设置 isDocument = true |
| `tag:Name(tagRemId)` | 添加标签（括号内为标签 Rem 的 ID） |

示例：

```
  新概念节点 <!--type:concept doc-->
  新描述节点 <!--type:descriptor tag:MyTag(tagId123)-->
```

多个 token 之间用空格分隔，可任意组合。

#### Portal 新增行

在 newStr 中使用 Portal 专用注释创建新的 Portal：

```
<!--portal refs:remId1,remId2-->
<!--portal-->
```

- `refs:` 后面跟逗号分隔的 Rem ID 列表，指定 Portal 引用的目标 Rem
- 不带 `refs:` 则创建空 Portal
- Portal 创建分两步执行：先调用 `create_portal` 创建空 Portal 并设置父节点/位置，再逐个调用 `add_to_portal` 添加引用

示例：

```
# 模板模式
oldStr: "  {{idA}}"
newStr: "  <!--portal refs:refId1,refId2-->\n  {{idA}}"

# 完整匹配模式
oldStr: "  子节点 A <!--idA-->"
newStr: "  <!--portal refs:refId1,refId2-->\n  子节点 A <!--idA-->"
```

#### 嵌套新增

新增行下面可以再嵌套新增行，通过缩进表示父子关系：

```
# 模板模式
oldStr: "  {{idA}}"
newStr: "  父节点 ↓\n    答案行 1\n    答案行 2\n  {{idA}}"

# 完整匹配模式
oldStr: "  子节点 A <!--idA-->"
newStr: "  父节点 ↓\n    答案行 1\n    答案行 2\n  子节点 A <!--idA-->"
```

嵌套新增行的父 ID 通过内部占位标记 `__new_N__` 管理，创建顺序保证从浅到深。

#### ⚠️ 插入位置：必须在兄弟末尾

新行**不能**插在一个有子节点的 Rem 和它的 children 之间，否则 children 会被新行"劫持"，触发 `children_captured` 错误。

```
❌ 错误（模板）：
oldStr: "  {{idA}}"   newStr: "  {{idA}}\n  新行"   ← idA 有子节点，新行劫持 children！
❌ 错误（完整匹配）：
oldStr: "  水分子 ↓ <!--idA-->"   newStr: "  水分子 ↓ <!--idA-->\n  新行"   ← 同理

✅ 正确：插在末尾
oldStr: "  {{idZ}}"   newStr: "  {{idZ}}\n  新行"
```

#### 两步操作：创建新节点并移入已有 children

如果需要"创建一个新父节点，把已有的 children 移到它下面"，必须分两步完成：

1. **第一次 edit-tree**：在兄弟末尾创建新节点
2. **第二次 edit-tree**：新节点已获得 remId，将已有行的缩进改到新节点下（走正常 move 逻辑）

这是因为新增行没有 remId，diff 算法无法区分"移动到新父节点"和"重新创建"。

### 删除行

从 newStr 中移除带 remId 的行。**必须同时删除该行的所有可见子行**，否则报 orphan_detected 错误。

```
# 模板模式
oldStr: "  {{idA}}\n    {{idA1}}\n  {{idB}}"
newStr: "  {{idB}}"

# 完整匹配模式
oldStr: "  子节点 A <!--idA-->\n    孙节点 A1 <!--idA1-->\n  子节点 B <!--idB-->"
newStr: "  子节点 B <!--idB-->"
```

删除操作按深度**从深到浅**执行（先删子后删父），确保 RemNote SDK 不会拒绝操作。

### 移动行

改变行的缩进级别或位置，使其移动到新的父节点下：

```
# 模板模式
oldStr: "  {{idA}}\n    {{idT}}\n  {{idB}}"
newStr: "  {{idA}}\n  {{idB}}\n    {{idT}}"

# 完整匹配模式
oldStr: "  子节点 A <!--idA-->\n    目标行 <!--idT-->\n  子节点 B <!--idB-->"
newStr: "  子节点 A <!--idA-->\n  子节点 B <!--idB-->\n    目标行 <!--idT-->"
```

### 重排行

调换同级行的顺序：

```
# 模板模式
oldStr: "  {{idA}}\n  {{idB}}\n  {{idC}}"
newStr: "  {{idC}}\n  {{idA}}\n  {{idB}}"

# 完整匹配模式
oldStr: "  子节点 A <!--idA-->\n  子节点 B <!--idB-->\n  子节点 C <!--idC-->"
newStr: "  子节点 C <!--idC-->\n  子节点 A <!--idA-->\n  子节点 B <!--idB-->"
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
| 新行劫持已有子节点 | `children_captured` | New line "..." accidentally captured existing children (...). | 把新行插到兄弟末尾，不要插在父 Rem 和 children 之间 |

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
| create（普通 Rem） | `create_rem` + `write_rem_fields` | content, parentId, position + Markdown 属性 + 元数据（type/doc/tag） |
| create（Portal） | `create_portal` + 逐个 `add_to_portal` | parentId, position + portalRefs |
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
   ├─ 模板展开: {{remId}} → 缓存中对应行的完整内容（不含缩进）
   ├─ 防线 3: countOccurrences(cachedOutline, expandedOldStr) === 1？
   ├─ modifiedOutline = cachedOutline.replace(expandedOldStr, expandedNewStr)
   ├─ 解析新旧大纲为树（parseOutline）
   ├─ 对比差异（diffTrees）
   │   ├─ 根节点校验
   │   ├─ 省略行防线
   │   ├─ 子节点劫持检测（children_captured）
   │   ├─ 内容变更检测
   │   ├─ 折叠删除防线
   │   ├─ 孤儿检测
   │   └─ 生成操作列表（create → move → reorder → delete）
   ├─ 逐项执行操作（forwardToPlugin 调用原子操作）
   │   ├─ create（普通）: create_rem + write_rem_fields（Markdown 属性 + 元数据）
   │   ├─ create（Portal）: create_portal + 逐个 add_to_portal
   │   ├─ move: move_rem + isCardItem 同步
   │   ├─ reorder: reorder_children
   │   └─ delete: delete_rem
   ├─ 全部成功 → 重新 read-tree 更新缓存
   └─ 返回 { ok: true, operations }
5. CLI 格式化输出
```

---

## 常见使用模式（JSON 模式）

> 优先使用模板模式；连续 2+ 次 `old_str not found` 则回退到完整匹配模式。

### 在指定位置插入新行

```bash
# 模板模式
remnote-bridge edit-tree --json '{"remId":"kLr","oldStr":"  {{idA}}","newStr":"  新增行\n  {{idA}}"}'

# 完整匹配模式
remnote-bridge edit-tree --json '{"remId":"kLr","oldStr":"  子节点 A <!--idA-->","newStr":"  新增行\n  子节点 A <!--idA-->"}'
```

### 删除一个叶子节点

```bash
remnote-bridge edit-tree --json '{"remId":"kLr","oldStr":"    {{leaf}}\n","newStr":""}'
```

### 调换两个兄弟的顺序

```bash
# 模板模式
remnote-bridge edit-tree --json '{"remId":"kLr","oldStr":"  {{idA}}\n  {{idB}}","newStr":"  {{idB}}\n  {{idA}}"}'

# 完整匹配模式
remnote-bridge edit-tree --json '{"remId":"kLr","oldStr":"  节点 A <!--idA-->\n  节点 B <!--idB-->","newStr":"  节点 B <!--idB-->\n  节点 A <!--idA-->"}'
```

### 将节点移到另一个父节点下

```bash
# 模板模式
remnote-bridge edit-tree --json '{"remId":"kLr","oldStr":"  {{oldP}}\n    {{target}}\n  {{newP}}","newStr":"  {{oldP}}\n  {{newP}}\n    {{target}}"}'

# 完整匹配模式
remnote-bridge edit-tree --json '{"remId":"kLr","oldStr":"  旧父 <!--oldP-->\n    目标 <!--target-->\n  新父 <!--newP-->","newStr":"  旧父 <!--oldP-->\n  新父 <!--newP-->\n    目标 <!--target-->"}'
```
