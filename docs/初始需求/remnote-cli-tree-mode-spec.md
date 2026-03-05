# RemNote CLI - 大范围（树）模式读写规范

## 概述

大范围模式是 RemNote CLI 的结构编辑模式。以某个 Rem 为中心，读取其子树的结构大纲，AI 通过 str_replace 对大纲进行行级别的增、删、移、重排操作。CLI 解析变更后通过 Plugin 批量调用 RemNote SDK 写回。

### 核心定位：结构编辑器

- **最小操作单位是一行（一个 Rem）**，不可以修改行内内容
- 只支持：新增行、删除行、移动行（改变父节点）、重排行（同级换顺序）
- 行内内容修改一律走单 Rem 模式的 `edit-rem`
- 这不是"文档编辑器"，更像是 `mkdir` + `mv` + `rm` + `reorder` 的结构操作视图

### 与单 Rem 模式的分工

| 操作 | 大范围模式 | 单 Rem 模式 |
|------|-----------|------------|
| 查看子树结构 | ✓ | ✗ |
| 新增 Rem | ✓ | ✗ |
| 删除 Rem | ✓ | ✗ |
| 移动 Rem（改变父节点） | ✓ | ✗ |
| 重排兄弟 Rem 顺序 | ✓ | ✗ |
| 修改 Rem 文本内容 | ✗ | ✓ |
| 修改 RichText 格式 | ✗ | ✓ |
| 修改闪卡属性 | ✗ | ✓ |
| 修改标签 | ✗ | ✓ |
| 修改 Powerup 属性 | ✗ | ✓ |

### 为什么不允许修改已有行的内容

已有 Rem 的 RichText 可能包含 Markdown 无法表达的信息（特定颜色高亮、音频嵌入、插件元素、cloze hint 等）。如果允许在大范围模式里修改行内容：

```
读路径：RichText → toMarkdown() → "**线粒体** :: 细胞的发电站"
                                    （高亮颜色、音频等信息已丢失）

写路径："**线粒体** :: 细胞的能量工厂" → parseFromMarkdown() → 新 RichText
                                    （一个"干净"的新 RichText，原有额外格式信息被冲掉）
```

AI 只改了一个词，但 round-trip 会静默破坏用户数据。因此大范围模式硬性禁止修改已有行内容。

唯一的例外是**新增行**——没有旧数据，不存在损失，`parseFromMarkdown()` 完美适用。

---

## 序列化格式

### 行格式

每个 Rem 序列化为一行，格式为：

```
{缩进}{Markdown 内容} <!--{remId} {元数据}-->
```

各部分说明：

| 部分 | 说明 |
|------|------|
| 缩进 | 两个空格为一级，表示在树中的深度（相对于 read 的根 Rem） |
| Markdown 内容 | 见下方「行内容拼接规则」 |
| `<!--` `-->` | HTML 注释标记，包裹 Rem ID 和元数据 |
| remId | Rem 的唯一 ID |
| 元数据 | 可选的 key:value 对，空格分隔 |

### 行内容拼接规则

> `toMarkdown()` 是 RichText 级别 API（接受 RichText 数组，不是 Rem 对象）。
> 分隔符（`::`、`;;`、`>>`、`<<`、`<>`）不存储在 RichText 里，是根据 Rem 字段反向推导的。
> 因此**行内容必须由 CLI/Plugin 自行拼接**。

行内容 = `toMarkdown(rem.text)` + 分隔符 + `toMarkdown(rem.backText)`（如果有 backText）。

分隔符的反向推导依据以下 4 个维度（优先级从高到低）：

```
hasMultilineChildren = children 中有 isCardItem == true 的子 Rem

if type == "concept" and hasMultilineChildren:
    → toMarkdown(text) + " ::>"
elif type == "concept":
    → toMarkdown(text) + " :: " + toMarkdown(backText)
elif type == "descriptor" and hasMultilineChildren:
    → toMarkdown(text) + " ;;>"
elif type == "descriptor":
    → toMarkdown(text) + " ;; " + toMarkdown(backText)
elif backText != null:
    if practiceDirection == "forward":
        → toMarkdown(text) + " >> " + toMarkdown(backText)
    elif practiceDirection == "backward":
        → toMarkdown(text) + " << " + toMarkdown(backText)
    elif practiceDirection == "both":
        → toMarkdown(text) + " <> " + toMarkdown(backText)
elif hasMultilineChildren:
    → toMarkdown(text) + " >>>"
elif text 数组中包含 cloze 对象 ({cId, i:"m"}):
    → toMarkdown(text)  （cloze 由 toMarkdown 自行处理为 {{...}} 语法）
else:
    → toMarkdown(text)  （纯文本，无分隔符）
```

完整的 10 种分隔符映射参考：[docs/rem-type-mapping/README.md](../rem-type-mapping/README.md)

> **实测验证（2026-03-05）：** 上述映射规则通过浏览器模拟输入 + CLI `read-rem --full` 回读对比验证，覆盖所有 10 种分隔符类型。

### 元数据字段

| 字段 | 说明 | 示例 |
|------|------|------|
| `fc` | 闪卡类型 | `fc:concept`, `fc:descriptor`, `fc:forward`, `fc:backward`, `fc:both`, `fc:multiline`, `fc:cloze` |
| `role` | 子 Rem 在闪卡中的角色 | `role:card-item` |
| `type` | Rem 类型（非默认时） | `type:document`, `type:portal` |
| `tags` | 标签数量（仅提示） | `tags:3` |
| `children` | 未展开的子节点数量 | `children:12` |

> **元数据是只读的**。大范围模式下 AI 不可通过修改元数据来改变 Rem 属性。元数据仅供 AI 了解结构上下文。要修改属性，走单 Rem 模式。

#### `fc` 元数据的推导规则

`fc` 标签告诉 AI 这个 Rem 是什么类型的闪卡，推导依据与行内容拼接的分隔符判断一致：

| 分隔符 | fc 值 | 推导条件 |
|:--|:--|:--|
| `::` | `fc:concept` | type=concept, backText 有值 |
| `;;` | `fc:descriptor` | type=descriptor, backText 有值 |
| `>>` | `fc:forward` | type=default, backText 有值, practiceDirection=forward |
| `<<` | `fc:backward` | type=default, backText 有值, practiceDirection=backward |
| `<>` | `fc:both` | type=default, backText 有值, practiceDirection=both |
| `>>>` | `fc:multiline` | type=default, hasMultilineChildren |
| `::>` | `fc:concept-multiline` | type=concept, hasMultilineChildren |
| `;;>` | `fc:descriptor-multiline` | type=descriptor, hasMultilineChildren |
| `{{}}` | `fc:cloze` | text 中包含 cloze 对象 |
| （无） | 不输出 fc | type=default, 无 backText, 无 multiline children, 无 cloze |

#### `role` 元数据的推导规则

| role 值 | 推导条件 |
|:--|:--|
| `role:card-item` | `isCardItem == true`（多行闪卡的答案行） |
| 不输出 role | `isCardItem` 为 false 或未设置 |

### 完整示例

一棵子树的序列化结果：

```
机器学习笔记 <!--doc001 type:document-->
  监督学习 <!--rem002-->
    线性回归 :: 最基本的回归模型 <!--rem003 fc:concept-->
    逻辑回归 :: 用于分类问题 <!--rem004 fc:concept-->
    什么是过拟合？ >> 模型在训练数据上表现好但泛化能力差 <!--rem005 fc:basic-forward-->
  无监督学习 <!--rem006-->
    聚类分析 <!--rem007-->
      K-means <!--rem008-->
      DBSCAN <!--rem009-->
    降维方法 <!--rem010-->
  强化学习 <!--rem011-->
    什么是 Q-learning？ >>> <!--rem012 fc:multiline-front-->
      一种无模型的强化学习算法 <!--rem013 role:card-item-->
      通过学习动作价值函数来选择最优策略 <!--rem014 role:card-item-->
```

### 新增行的格式

新增行**不带 ID 标记**，CLI 通过有无 `<!--...-->` 来区分已有 Rem 和新建 Rem：

```
  新增的内容行
```

新增行的内容使用 RemNote Markdown 语法，CLI 通过 Plugin 调用官方 `parseFromMarkdown()` 转为 RichText。支持的语法包括：

- 基础 Markdown：`**粗体**`、`*斜体*`、`` `代码` ``、`[链接](url)`、`$LaTeX$`
- RemNote 闪卡语法：`::`, `>>`, `<<`, `<>`, `;;`, `>>>`, `>>1.`, `{{cloze}}` 等
- RemNote 引用语法：`[[引用名]]`

> 这些语法的解析完全由官方 `parseFromMarkdown()` 负责，CLI 不做自行解析。

### 未展开子树的折叠表示

当子树超过 read 指定的深度时，显示折叠占位：

```
  降维方法 <!--rem010 children:5-->
```

`children:5` 告诉 AI 这个 Rem 下面有 5 个子节点未展开。AI 可以对这个 Rem 单独做 `read-tree` 来展开查看。

---

## 命令定义

### `read-tree` — 读取 Rem 子树结构

```
unofficial-remnote-bridge read-tree <remId> [--depth 3] [--json]
```

| 参数 | 说明 |
|------|------|
| `remId` | 作为根节点的 Rem ID |
| `--depth` | 展开深度。1 = 只显示直接子节点，2 = 两层，-1 = 全部展开。默认 3。 |
| `--json` | 结构化 JSON 输出 |

**返回值**：纯文本，即序列化后的树结构大纲。

### `edit-tree` — str_replace 编辑树结构

```
unofficial-remnote-bridge edit-tree <remId> --old-str <old_str> --new-str <new_str> [--json]
```

| 参数 | 说明 |
|------|------|
| `remId` | 子树根节点的 Rem ID（必须与之前 read-tree 的根一致） |
| `--old-str` | 要替换的原始文本片段。必须在该子树的序列化文本中精确且唯一地出现。 |
| `--new-str` | 替换后的新文本片段。 |
| `--json` | 结构化 JSON 输出 |

---

## 操作示例

以下示例均基于上文「完整示例」中的子树。

### 示例 1：新增一行（创建新 Rem）

在"聚类分析"下面添加新算法：

```
unofficial-remnote-bridge edit-tree doc001 \
  --old-str '      K-means <!--rem008-->\n      DBSCAN <!--rem009-->' \
  --new-str '      K-means <!--rem008-->\n      DBSCAN <!--rem009-->\n      层次聚类'
```

CLI 处理：
1. 检测到新行"层次聚类"（无 ID 标记）→ 新建 Rem
2. 根据缩进（3 级 = 6 个空格）→ 父节点为 rem007（聚类分析）
3. 位置在 rem009 之后 → 排序为末尾
4. 通过 Plugin 调用 `parseFromMarkdown("层次聚类")` → 得到 RichText
5. 通过 Plugin 调用 SDK：`createRem()` → `setText()` → `setParent(rem007)` → 排序到末尾

### 示例 2：删除一行

删除"逻辑回归"：

```
unofficial-remnote-bridge edit-tree doc001 \
  --old-str '    逻辑回归 :: 用于分类问题 <!--rem004 fc:concept-->\n' \
  --new-str ''
```

CLI 处理：
1. 检测到 rem004 从大纲中消失 → 标记为待删除
2. 返回确认信息（见「删除策略」章节）
3. 确认后通过 Plugin 调用 SDK：`rem.remove()`

### 示例 3：移动行（改变父节点）

把"K-means"从"聚类分析"下面移到"降维方法"下面：

```
unofficial-remnote-bridge edit-tree doc001 \
  --old-str '    聚类分析 <!--rem007-->\n      K-means <!--rem008-->\n      DBSCAN <!--rem009-->\n    降维方法 <!--rem010 children:5-->' \
  --new-str '    聚类分析 <!--rem007-->\n      DBSCAN <!--rem009-->\n    降维方法 <!--rem010 children:5-->\n      K-means <!--rem008-->'
```

CLI 处理：
1. rem008 原父节点 = rem007，新父节点 = rem010 → 移动操作
2. 通过 Plugin 调用 SDK：`rem008.setParent(rem010)`

### 示例 4：重排兄弟顺序

把"强化学习"移到"监督学习"前面：

```
unofficial-remnote-bridge edit-tree doc001 \
  --old-str '  监督学习 <!--rem002-->\n' \
  --new-str '  强化学习 <!--rem011-->\n    什么是 Q-learning？ >>> <!--rem012 fc:multiline-front-->\n      一种无模型的强化学习算法 <!--rem013 role:card-item-->\n      通过学习动作价值函数来选择最优策略 <!--rem014 role:card-item-->\n  监督学习 <!--rem002-->\n'
```

CLI 处理：
1. rem011 及其子树位置变了，从末尾移到了开头
2. doc001 的 children 顺序从 [rem002, rem006, rem011] 变为 [rem011, rem002, rem006]
3. 通过 Plugin 调用 SDK：`doc001.setChildrenOrder([rem011, rem002, rem006])`

### 示例 5：新增带闪卡语法的行

新增一个 concept 闪卡：

```
unofficial-remnote-bridge edit-tree doc001 \
  --old-str '    线性回归 :: 最基本的回归模型 <!--rem003 fc:concept-->' \
  --new-str '    线性回归 :: 最基本的回归模型 <!--rem003 fc:concept-->\n    岭回归 :: 带 L2 正则化的线性回归'
```

CLI 处理：
1. 检测到新行"岭回归 :: 带 L2 正则化的线性回归"（无 ID 标记）
2. 通过 Plugin 调用 `parseFromMarkdown("岭回归 :: 带 L2 正则化的线性回归")`
3. 官方解析器自动识别 `::` → 创建的 Rem 自带 concept 闪卡属性
4. 根据缩进 → 父节点为 rem002（监督学习），排在 rem003 后面

---

## CLI 端实现要点

### 树 diff 算法

CLI 收到 `edit-tree` 后的处理流程：

```
1. [防线 1] 检查缓存中是否存在该子树
2. [防线 2] 重跑 read-tree 逻辑（获取最新 Rem → 转 Markdown），与缓存的 Markdown 逐字对比
3. [防线 3] 在缓存的大纲文本上执行 str_replace，要求唯一匹配
4. 解析修改前/后的大纲为两棵树（每行 → 节点，缩进 → 层级，行尾标记 → Rem ID）
5. 对比两棵树，生成增量操作列表（新增、删除、移动、重排）
6. 检查是否有已有行内容被修改（禁止操作）
7. 按增量操作列表逐项执行 SDK 调用
```

> **增量 diff 的关键**：edit-tree 不是"重建整棵树"，而是对比修改前后的差异，只执行发生变化的操作。未变动的 Rem 不产生任何 SDK 调用。

### ID 级对比规则

| 情况 | 判定依据 | 操作 |
|------|---------|------|
| 新行（无 ID 标记） | 行尾无 `<!--...-->` | 创建新 Rem |
| 已有行消失 | 旧树中的 ID 在新树中找不到 | 删除 Rem |
| 已有行位置不变 | 同 ID、同父节点、同排序位置 | 跳过 |
| 已有行缩进变化 | 同 ID、不同父节点 | 移动 Rem |
| 已有行排序变化 | 同 ID、同父节点、不同位置 | 重排 children |
| 已有行内容变化 | 同 ID、行文本（去掉标记后）与原文不同 | **拒绝，报错** |

### 内容变更检测

对每个带 ID 标记的行，CLI 需要比对行内容是否发生了变化：

```
原始行：  "    线性回归 :: 最基本的回归模型 <!--rem003 fc:concept-->"
提取内容： "线性回归 :: 最基本的回归模型"（去掉缩进和标记）

修改后行："    线性回归 :: 最强大的回归模型 <!--rem003 fc:concept-->"
提取内容： "线性回归 :: 最强大的回归模型"

内容不一致 → 报错
```

报错格式：

```json
{
  "error": "Content modification of existing Rem is not allowed in tree edit mode.",
  "modified_rems": [
    {
      "remId": "rem003",
      "original_content": "线性回归 :: 最基本的回归模型",
      "new_content": "线性回归 :: 最强大的回归模型"
    }
  ],
  "hint": "Use edit-rem rem003 --old-str ... --new-str ... for content changes."
}
```

### 删除策略

删除是危险操作。被删除的行可能有子树（子 Rem 及其后代）。CLI 区分两种情况：

**叶子节点删除**：直接执行。

**带子树的节点删除**：如果被删除的行在原始大纲中有可见的子行，且这些子行也同时被删除了（即 AI 删掉了整个子树），则执行。如果子行还在但父行被删了，报错——这意味着子行变成了"孤儿"，需要 AI 明确处理。

```json
{
  "error": "Cannot delete rem006 (无监督学习) because it has children that were not removed.",
  "orphaned_children": ["rem007", "rem010"],
  "hint": "Either remove all children too, or move them to another parent first."
}
```

### 新增行的父节点推断

新增行没有 ID，靠缩进和位置推断父节点：

```
1. 计算新行的缩进级别
2. 向上查找最近的缩进级别比它少一级的行
3. 该行对应的 Rem 就是新行的父节点
4. 新行在兄弟中的排序 = 它在该父节点的子行中的位置
```

示例：

```
  无监督学习 <!--rem006-->          ← 缩进 1 级
    聚类分析 <!--rem007-->          ← 缩进 2 级
    新增的方法                      ← 缩进 2 级，无 ID
    降维方法 <!--rem010-->          ← 缩进 2 级
```

"新增的方法"缩进 2 级，向上找到缩进 1 级的"无监督学习 rem006" → 父节点 = rem006，排在 rem007 和 rem010 之间。

---

## 写保护三道防线

与单 Rem 模式共享相同的三道防线机制，适配到树模式的具体行为：

### 缓存机制

`read-tree` 的完整流程：获取 Rem 子树 → 按规则转换为 Markdown 大纲 → 缓存 Markdown 大纲。

缓存内容：**仅 Markdown 大纲文本**。不缓存原始 Rem 对象。

> **为什么不缓存原始 Rem 对象？** 防线 2 对比的是 Markdown 大纲（重新获取 Rem → 重新转换 → 与缓存的 Markdown 逐字对比），整个流程不需要旧的 Rem 对象。

缓存策略：

- 缓存 key = 根 remId
- 同一 remId 的 `read-tree` 覆盖旧缓存（例如 depth 2 → depth 3，新大纲替换旧大纲）
- 无 TTL 过期机制——防线 2（写前变更检测）已能捕获所有陈旧数据。如果 Rem 未被外部修改，旧缓存始终有效
- 缓存生命周期 = 守护进程生命周期（disconnect 时自动清空）
- 内存控制：与单 Rem 模式共享 LRU 缓存池

### 第一道防线：先读后写

`edit-tree(remId)` 要求该 remId 的子树已被 `read-tree` 读取过且缓存存在。否则报错：

```
"Tree rooted at {remId} has not been read yet. Use read-tree first."
```

### 第二道防线：写前重跑 read-tree 逻辑

执行 str_replace 前，CLI **重新运行一遍 read-tree 的完整流程**（通过 Plugin 从 SDK 获取最新 Rem 对象 → 按相同规则转换为 Markdown 大纲），将**重建的 Markdown 大纲**与缓存的大纲逐字对比。

- 两份 Markdown 完全一致 → 数据未被外部修改，继续执行
- 存在差异 → 整个 edit-tree 操作被拒绝：

```
"Tree rooted at {remId} has been modified since last read-tree. Please read-tree again."
```

> **为什么对比 Markdown 而非逐个对比 Rem 对象**：大范围模式下 AI 的 old_str 匹配依赖整个大纲文本的一致性。对比最终的 Markdown 输出比逐字段对比 Rem 对象更直接——如果转换规则的输入（Rem 数据）没变，输出（Markdown）必然不变；而直接对比输出可以一步到位地覆盖所有可能的变更来源。

与单 Rem 模式一致：**失败时缓存不更新**，AI 必须重新 `read-tree`。

### 第三道防线：精确字符串匹配

与单 Rem 模式完全一致。old_str 必须在缓存的大纲文本中唯一匹配。多次匹配时返回各匹配项的上下文。

---

## 典型工作流

### 工作流 1：查看结构后精细编辑某个 Rem

```
unofficial-remnote-bridge read-tree doc001 --depth 2
→ 看到整体结构，发现 rem003 需要修改内容

unofficial-remnote-bridge read-rem rem003
→ 看到 rem003 的完整 RichText 对象

unofficial-remnote-bridge edit-rem rem003 --old-str ... --new-str ...
→ 精细修改内容
```

### 工作流 2：重组文档结构

```
unofficial-remnote-bridge read-tree doc001 --depth 3
→ 看到整体结构

unofficial-remnote-bridge edit-tree doc001 \
  --old-str '  强化学习 <!--rem011-->...' \
  --new-str '  强化学习 <!--rem011-->...\n  迁移学习\n    领域自适应\n    预训练模型'
→ 新增"迁移学习"及其子节点
```

### 工作流 3：批量结构调整 + 逐个内容修改

```
unofficial-remnote-bridge read-tree doc001 --depth -1
→ 完全展开

unofficial-remnote-bridge edit-tree doc001 ...  → 移动若干行
unofficial-remnote-bridge edit-tree doc001 ...  → 删除若干行
unofficial-remnote-bridge edit-tree doc001 ...  → 新增若干行

unofficial-remnote-bridge read-rem rem003  → unofficial-remnote-bridge edit-rem rem003 ...  → 改 rem003 内容
unofficial-remnote-bridge read-rem rem007  → unofficial-remnote-bridge edit-rem rem007 ...  → 改 rem007 内容
```

---

## 设计决策记录

### 为什么不用 YAML？

YAML 的结构清晰、元数据分离好，但在行级操作场景下劣势明显：

- **冗长**：一个 Rem 在 YAML 中占 3-4 行（id、text、children），行内标记方案只占 1 行。大范围模式可能涉及几十上百个 Rem，token 膨胀 3-5 倍。
- **str_replace 笨重**：重排两个 Rem 的顺序，行内标记方案交换两行即可，YAML 需要交换两个多行 block，复杂度高且易出错。
- **缩进敏感**：YAML 缩进错误导致解析失败，与 str_replace 的文本操作特性天然冲突。

行内标记方案下，每个 Rem 就是一行，增删移重排全是行级操作，与 str_replace 完美契合。

### 为什么用 toMarkdown 而不是 toString？

- **读写对称**：新增行使用 RemNote Markdown 语法，调 `parseFromMarkdown()` 写入。读出来也用 `toMarkdown()` 保持格式一致。AI 看到什么格式，写入时就用什么格式。
- **闪卡语法保留**：`toMarkdown()` 保留 `::`、`>>`、`{{}}` 等 RemNote 特有语法，AI 新增行时可以直接使用这些语法创建闪卡，由官方 `parseFromMarkdown()` 解析。
- **格式可辨识**：粗体、斜体、LaTeX 等格式以 Markdown 形式展示，比纯文本更有辨识度。

### 为什么不允许修改已有行内容？

- **round-trip 有损**：`toMarkdown()` → 修改 → `parseFromMarkdown()` 会丢失 Markdown 无法表达的 RichText 信息（特殊高亮颜色、音频嵌入、插件元素等）。
- **静默数据破坏**：AI 只改一个词，用户看不出来，但底层 RichText 被重建，额外格式信息全丢了。
- **职责清晰**：大范围模式管结构，单 Rem 模式管内容。没有灰色地带。
- **硬性约束优于软性约束**：CLI 层面拒绝执行，比在文档里"建议不要这样做"可靠得多。

### 为什么新增行使用 RemNote 特殊 Markdown 语法？

- **官方 parseFromMarkdown 开箱即用**：不需要 CLI 自己实现任何语法解析。
- **一步到位**：AI 写 `光合作用 :: 将光能转化为化学能`，直接创建出带 concept 闪卡属性的 Rem，不需要先创建再切单 Rem 模式改属性。
- **低学习成本**：RemNote 的 Markdown 闪卡语法本身就是面向用户的简洁语法，AI 理解和生成没有障碍。
