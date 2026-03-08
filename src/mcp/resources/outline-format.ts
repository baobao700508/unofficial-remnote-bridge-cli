export const OUTLINE_FORMAT_CONTENT = `
# Markdown 大纲格式规范

read_tree / read_globe / read_context 的输出核心是 Markdown 大纲文本。edit_tree 基于此大纲进行结构编辑。

---

## 1. 行结构

每行的完整格式为：

\\\`\\\`\\\`
{缩进}{Markdown 前缀}{内容}{箭头分隔符}{backText} <!-- {remId} {元数据标记} -->
\\\`\\\`\\\`

- **缩进**：每级 2 个空格，根节点 0 个空格
- **remId**：该行对应的 Rem ID（edit_tree 新增行无 remId）
- **元数据标记**：空格分隔的属性标记

---

## 2. Markdown 前缀

| 前缀 | 含义 | 对应字段 |
|:-----|:-----|:---------|
| \\\`# \\\` | H1 标题 | fontSize: 'H1' |
| \\\`## \\\` | H2 标题 | fontSize: 'H2' |
| \\\`### \\\` | H3 标题 | fontSize: 'H3' |
| \\\`- [ ] \\\` | 未完成待办 | isTodo: true, todoStatus: 'Unfinished' |
| \\\`- [x] \\\` | 已完成待办 | isTodo: true, todoStatus: 'Finished' |
| \\\`\\\\\\\`...\\\\\\\`\\\` | 代码块 | isCode: true |
| \\\`---\\\` | 分隔线 | Divider Powerup |

---

## 3. 箭头分隔符

### 有 backText 的箭头

| 箭头 | 格式 | practiceDirection |
|:-----|:-----|:------------------|
| \\\` → \\\` | text → backText | forward |
| \\\` ← \\\` | text ← backText | backward |
| \\\` ↔ \\\` | text ↔ backText | both |

### 多行闪卡的箭头

| 箭头 | 格式 | practiceDirection | 说明 |
|:-----|:-----|:------------------|:-----|
| \\\` ↓\\\`（尾部） | text ↓ | forward | 无 backText |
| \\\` ↑\\\`（尾部） | text ↑ | backward | 无 backText |
| \\\` ↕\\\`（尾部） | text ↕ | both | 无 backText |
| \\\` ↓ \\\` | text ↓ backText | forward | 有 backText |
| \\\` ↑ \\\` | text ↑ backText | backward | 有 backText |
| \\\` ↕ \\\` | text ↕ backText | both | 有 backText |

---

## 4. 元数据标记

| 标记 | 含义 | 何时出现 |
|:-----|:-----|:---------|
| \\\`type:concept\\\` | concept 类型 | type 不为 default 时 |
| \\\`type:descriptor\\\` | descriptor 类型 | type 不为 default 时 |
| \\\`type:portal\\\` | Portal 类型 | type 为 portal 时 |
| \\\`refs:id1,id2,...\\\` | Portal 引用的 Rem | 仅 portal |
| \\\`doc\\\` | isDocument = true | 独立于 type |
| \\\`top\\\` | 顶层 Rem | 无父节点 |
| \\\`children:N\\\` | 折叠子节点数 | 深度超限且有子节点 |
| \\\`role:card-item\\\` | 多行答案行 | isCardItem = true |
| \\\`tag:Name(id)\\\` | 标签 | 每个 tag 一个 |

---

## 5. 省略占位符

### 精确省略（sibling 裁剪）
\\\`\\\`\\\`
<!--...elided {N} siblings (parent:{parentId} range:{from}-{to} total:{total})-->
\\\`\\\`\\\`

### 非精确省略（预算耗尽）
\\\`\\\`\\\`
<!--...elided >={N} nodes (parent:{parentId} range:{from}-{to} total:{total})-->
\\\`\\\`\\\`

---

## 6. edit-tree 新增行的特殊格式

### 新增 Portal 行

在 edit-tree 的 newStr 中，用以下格式新增 Portal：

\\\`\\\`\\\`
<!--portal refs:id1,id2-->      新增 Portal 并引用 id1、id2
<!--portal-->                   新增空 Portal（无引用）
\\\`\\\`\\\`

与已有 Portal 行（\\\`<!--remId type:portal refs:id1,id2-->\\\`）不同，新增 Portal 行没有 remId，以 \\\`<!--portal\\\` 开头。

### 新增行的 metadata-only 注释

新增行（无 remId）可在行尾用 HTML 注释指定类型、文档属性和标签，格式为仅包含元数据标记（不含 remId）：

\\\`\\\`\\\`
新概念 <!--type:concept-->
新文档页 <!--type:concept doc-->
带标签 <!--type:descriptor tag:数学(tag01)-->
多标记组合 <!--type:concept doc tag:基础(tag02) tag:数学(tag01)-->
\\\`\\\`\\\`

支持的标记：\\\`type:concept\\\`、\\\`type:descriptor\\\`、\\\`doc\\\`、\\\`tag:Name(id)\\\`（可多个）。

---

## 7. 完整示例

\\\`\\\`\\\`markdown
# 数据结构 <!--kLr type:concept doc top-->
  ## 线性结构 <!--ABC type:concept-->
    数组 → Array <!--DEF-->
    链表 ↓ <!--GHI type:concept-->
      单向链表 <!--JKL role:card-item-->
      双向链表 <!--MNO role:card-item-->
    - [x] 复习完成 <!--PQR-->
  ## 树结构 <!--VWX type:concept children:8-->
  <!--...elided 3 siblings (parent:kLr range:3-5 total:6)-->
  嵌入视图 <!--p01 type:portal refs:ref1,ref2-->
  重要概念 <!--QRS tag:数学(tag01) tag:基础(tag02)-->
\\\`\\\`\\\`
`;
