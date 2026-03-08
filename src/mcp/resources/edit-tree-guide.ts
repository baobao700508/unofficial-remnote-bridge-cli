export const EDIT_TREE_GUIDE_CONTENT = `
# edit-tree 操作指南

edit_tree 通过 str_replace 对 Markdown 大纲进行结构编辑（行级增/删/移/重排），禁止修改已有行内容。

---

## 前置条件

必须先 \\\`read_tree\\\` 同一个 remId，建立缓存后才能 \\\`edit_tree\\\`。跳过会触发防线 1 错误。

---

## 支持的操作

### 1. 新增行

在 newStr 中添加**无 remId 注释**的新行。通过缩进确定父子关系。

\\\`\\\`\\\`
oldStr:
  子节点 A <!--idA-->

newStr:
  新增节点
  子节点 A <!--idA-->
\\\`\\\`\\\`

#### 新增行的 Markdown 前缀

| 前缀 | 效果 |
|------|------|
| \\\`# text\\\` | 创建 H1 标题 |
| \\\`## text\\\` | 创建 H2 标题 |
| \\\`### text\\\` | 创建 H3 标题 |
| \\\`- [ ] text\\\` | 创建未完成待办 |
| \\\`- [x] text\\\` | 创建已完成待办 |
| \\\`\\\\\\\`text\\\\\\\`\\\` | 创建代码块 |
| \\\`---\\\` | 创建分隔线 |

#### 新增行的箭头分隔符

| 箭头 | 格式 | 效果 |
|------|------|------|
| \\\` → \\\` | \\\`问题 → 答案\\\` | 创建 forward 闪卡（单行） |
| \\\` ← \\\` | \\\`问题 ← 答案\\\` | 创建 backward 闪卡（单行） |
| \\\` ↔ \\\` | \\\`问题 ↔ 答案\\\` | 创建 both 闪卡（单行） |
| \\\` ↓ \\\` | \\\`问题 ↓ 答案\\\` | 创建 forward 多行闪卡（有 backText） |
| \\\` ↑ \\\` | \\\`问题 ↑ 答案\\\` | 创建 backward 多行闪卡（有 backText） |
| \\\` ↕ \\\` | \\\`问题 ↕ 答案\\\` | 创建 both 多行闪卡（有 backText） |
| \\\` ↓\\\` | \\\`问题 ↓\\\` | 创建 forward 多行闪卡（子节点为答案） |
| \\\` ↑\\\` | \\\`问题 ↑\\\` | 创建 backward 多行闪卡 |
| \\\` ↕\\\` | \\\`问题 ↕\\\` | 创建 both 多行闪卡 |

#### 新增行的元数据注释

新增行可以在行尾添加 HTML 注释来指定元数据属性（注意：没有 remId，以 \\\`type:\\\`/\\\`doc\\\`/\\\`tag:\\\` 开头）：

\\\`\\\`\\\`
新概念 <!--type:concept-->
新描述 <!--type:descriptor-->
新文档 <!--doc-->
带标签 <!--tag:TagName(tagRemId)-->
组合使用 <!--type:concept doc tag:Physics(abc123)-->
\\\`\\\`\\\`

| 标记 | 效果 |
|------|------|
| \\\`type:concept\\\` | 设置 Rem 类型为 Concept |
| \\\`type:descriptor\\\` | 设置 Rem 类型为 Descriptor |
| \\\`doc\\\` | 将 Rem 标记为 Document |
| \\\`tag:Name(remId)\\\` | 添加指定 remId 的 Tag（可多个） |

与已有行行尾标记的区别：
- 已有行：\\\`文本 <!--remId type:concept doc-->\\\`（以 remId 开头）
- 新增行：\\\`文本 <!--type:concept doc-->\\\`（无 remId，直接以属性开头）

#### 嵌套新增

新增行下面可以再嵌套新增行，通过缩进表示父子关系：

\\\`\\\`\\\`
newStr:
  父节点 ↓
    答案行 1
    答案行 2
  子节点 A <!--idA-->
\\\`\\\`\\\`

嵌套新增行的父 ID 通过内部占位标记管理，创建顺序保证从浅到深。

#### ⚠️ 插入位置

新行**不能**插在一个有子节点的 Rem 和它的 children 之间，否则 children 会被新行"劫持"，触发 \\\`children_captured\\\` 错误。新行必须插在目标层级所有兄弟的**末尾**。

### 2. 删除行

从 newStr 中移除带 remId 的行。**必须同时删除该行的所有可见子行**，否则报 orphan_detected 错误。

\\\`\\\`\\\`
oldStr:
  子节点 A <!--idA-->
    孙节点 A1 <!--idA1-->
  子节点 B <!--idB-->

newStr:
  子节点 B <!--idB-->
\\\`\\\`\\\`

删除操作按深度**从深到浅**执行（先删子后删父）。

### 3. 移动行

改变行的缩进级别或位置，使其移动到新的父节点下：

\\\`\\\`\\\`
oldStr:
  子节点 A <!--idA-->
    目标行 <!--idT-->
  子节点 B <!--idB-->

newStr:
  子节点 A <!--idA-->
  子节点 B <!--idB-->
    目标行 <!--idT-->
\\\`\\\`\\\`

### 4. 重排行

调换同级行的顺序：

\\\`\\\`\\\`
oldStr:
  子节点 A <!--idA-->
  子节点 B <!--idB-->
  子节点 C <!--idC-->

newStr:
  子节点 C <!--idC-->
  子节点 A <!--idA-->
  子节点 B <!--idB-->
\\\`\\\`\\\`

---

## 禁止的操作

| 操作 | 错误类型 | 错误信息 | 替代方案 |
|------|----------|----------|----------|
| 修改已有行内容 | \\\`content_modified\\\` | Content modification of existing Rem is not allowed in tree edit mode. | 使用 \\\`edit_rem\\\` |
| 删除/修改根节点 | \\\`root_modified\\\` | Root node cannot be changed, deleted or moved. | — |
| 删除有隐藏子节点的行 | \\\`folded_delete\\\` | Cannot delete {id} because it has {N} hidden children. | 用更大的 depth 重新 read_tree |
| 删除行但保留子节点 | \\\`orphan_detected\\\` | Cannot delete {id} because it has children that were not removed. | 同时删除所有子行 |
| 删除/修改省略占位符 | \\\`elided_modified\\\` | Cannot delete or modify elided region directly. | 用更大的 depth/maxSiblings 重新 read_tree 展开 |
| 缩进跳级 | \\\`indent_skip\\\` | 缩进跳级：行 ... 的缩进级别为 N，但找不到上一级的父节点。 | 检查缩进是否正确（每级 2 空格） |
| 新行劫持已有子节点 | \\\`children_captured\\\` | New line "..." accidentally captured existing children (...). | 把新行插到兄弟末尾，不要插在父 Rem 和 children 之间 |

---

## 操作执行顺序

diff 算法生成的操作按以下顺序排列并执行：

\\\`\\\`\\\`
1. Create（新增）  — 按出现顺序，从浅到深
2. Move（移动）    — 父节点变更的行
3. Reorder（重排） — 同父节点内顺序变更
4. Delete（删除）  — 按深度从深到浅
\\\`\\\`\\\`

---

## practiceDirection 保护机制

RemNote SDK 存在已知 bug：\\\`setIsCardItem(true)\\\` 会偷偷设置 \\\`practiceDirection: "forward"\\\`，而 \\\`setIsCardItem(false)\\\` 不会清除。

**新增行（create）**：当父节点是多行闪卡（含 ↓↑↕ 箭头）时，新创建的子行需要 \\\`isCardItem: true\\\`。设置后立即用 \\\`practiceDirection: 'none'\\\` 覆盖 SDK 副作用。

**移动行（move）**：
- 移入多行父节点：设 \\\`isCardItem: true\\\` + \\\`practiceDirection: 'none'\\\`
- 移出多行父节点：设 \\\`isCardItem: false\\\` + \\\`practiceDirection: 'none'\\\`
- 例外：如果 Rem 自身有合法的 practiceDirection（箭头分隔符），保留不覆盖

---

## 示例 1：在指定位置插入新行

\\\`\\\`\\\`
oldStr:
  子节点 A <!--idA-->

newStr:
  新增行
  子节点 A <!--idA-->
\\\`\\\`\\\`

结果：在子节点 A 之前插入一个新 Rem。

## 示例 2：删除一个带子节点的行

\\\`\\\`\\\`
oldStr:
  子节点 A <!--idA-->
    孙节点 A1 <!--idA1-->
    孙节点 A2 <!--idA2-->
  子节点 B <!--idB-->

newStr:
  子节点 B <!--idB-->
\\\`\\\`\\\`

结果：删除子节点 A 及其所有子节点（必须一起删除）。

## 示例 3：创建带多行闪卡的结构

\\\`\\\`\\\`
oldStr:
  子节点 A <!--idA-->

newStr:
  什么是线性回归？ ↓
    一种基本的回归分析方法
    假设因变量与自变量呈线性关系
  子节点 A <!--idA-->
\\\`\\\`\\\`

结果：创建一个多行 forward 闪卡，问题为"什么是线性回归？"，两个子行自动成为答案（isCardItem=true）。

## 示例 4：创建 Portal

Portal 新增行使用 \\\`<!--portal refs:id1,id2-->\\\` 语法（无文本内容，纯参数行）：

\\\`\\\`\\\`
oldStr:
  子节点 A <!--idA-->

newStr:
  <!--portal refs:refId1,refId2-->
  子节点 A <!--idA-->
\\\`\\\`\\\`

结果：创建一个 Portal，引用 refId1 和 refId2 两个 Rem。

空 Portal（无引用）：

\\\`\\\`\\\`
  <!--portal-->
\\\`\\\`\\\`

Portal 新增行与已有 Portal 行的区别：
- 已有 Portal：\\\`<!--remId type:portal refs:id1,id2-->\\\`（有 remId）
- 新增 Portal：\\\`<!--portal refs:id1,id2-->\\\`（无 remId，以 \\\`portal\\\` 关键字开头）

删除 Portal 与删除普通行相同——从 newStr 中移除该 Portal 行即可。

**注意**：修改已有 Portal 的引用列表（增删引用的 Rem）请使用 \\\`edit_rem\\\`，通过 str_replace 修改简化 JSON 中的 \\\`portalDirectlyIncludedRem\\\` 数组。
`;
