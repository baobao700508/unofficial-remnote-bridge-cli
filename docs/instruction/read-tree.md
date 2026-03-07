# read-tree

> 将 Rem 子树序列化为 Markdown 大纲，支持深度/节点预算控制和祖先路径追溯。

---

## 功能

`read-tree` 通过 Rem ID 读取一棵子树，将其序列化为带缩进和元数据注释的 Markdown 大纲文本。读取结果会被缓存在 daemon 内存中，供后续 `edit-tree` 使用。

核心能力：
- 递归展开子树，输出人类可读的 Markdown 大纲
- 三个维度的预算控制：深度（depth）、全局节点上限（maxNodes）、单层兄弟上限（maxSiblings）
- 祖先路径追溯（ancestorLevels），提供上下文定位
- Powerup 噪音过滤（默认过滤）
- Portal 感知：识别 Portal 类型并输出引用的 Rem ID
- 自动缓存，为 `edit-tree` 建立编辑基础

---

## 用法

### 人类模式

```bash
remnote read-tree <remId> [--depth N] [--max-nodes N] [--max-siblings N] [--ancestor-levels N] [--includePowerup]
```

| 参数/选项 | 类型 | 必需 | 默认值 | 说明 |
|-----------|------|:----:|--------|------|
| `remId` | string（位置参数） | 是 | — | 子树根节点的 Rem ID |
| `--depth` | integer | 否 | 3 | 递归展开深度（-1 = 无限） |
| `--max-nodes` | integer | 否 | 200 | 全局节点上限（预算控制） |
| `--max-siblings` | integer | 否 | 20 | 单个父节点下的最大可见子节点数 |
| `--ancestor-levels` | integer | 否 | 0 | 向上追溯祖先层数（上限 10） |
| `--includePowerup` | boolean | 否 | false | 包含 Powerup 系统数据（默认过滤） |

输出示例：

```
<!-- ancestors: 知识库 (root_id [top]) > 项目 (proj_id) -->
# 项目概览 <!--kLrIOHJLyMd8Y2lyA type:concept doc-->
  第一部分 <!--id1-->
    小节 1.1 <!--id1_1-->
    小节 1.2 → 答案 <!--id1_2-->
  第二部分 <!--id2 children:5-->
```

### JSON 模式

```bash
remnote read-tree --json '{"remId":"kLrIOHJLyMd8Y2lyA","depth":2,"maxSiblings":10}'
```

---

## JSON 输入参数

| 字段 | 类型 | 必需 | 说明 |
|------|------|:----:|------|
| `remId` | string | 是 | 子树根节点 Rem ID |
| `depth` | number | 否 | 递归展开深度（-1 = 无限） |
| `maxNodes` | number | 否 | 全局节点上限 |
| `maxSiblings` | number | 否 | 单个父节点下的最大可见子节点数 |
| `ancestorLevels` | number | 否 | 向上追溯祖先层数（上限 10） |
| `includePowerup` | boolean | 否 | 包含 Powerup 系统数据 |

---

## JSON 输出

### 成功

```json
{
  "ok": true,
  "command": "read-tree",
  "data": {
    "outline": "# 项目概览 <!--kLrIOHJLyMd8Y2lyA type:concept doc-->\n  第一部分 <!--id1-->\n...",
    "rootId": "kLrIOHJLyMd8Y2lyA",
    "depth": 3,
    "nodeCount": 25
  },
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

### 成功（含祖先路径）

```json
{
  "ok": true,
  "command": "read-tree",
  "data": {
    "outline": "...",
    "rootId": "kLrIOHJLyMd8Y2lyA",
    "depth": 2,
    "nodeCount": 18
  },
  "ancestors": [
    { "id": "proj_id", "name": "项目", "childrenCount": 8, "isDocument": false },
    { "id": "root_id", "name": "知识库", "childrenCount": 15, "isDocument": true, "isTopLevel": true }
  ],
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

### 成功（含缓存覆盖提示 + Powerup 过滤统计）

```json
{
  "ok": true,
  "command": "read-tree",
  "data": { "...": "..." },
  "cacheOverridden": {
    "id": "kLrIOHJLyMd8Y2lyA",
    "previousCachedAt": "2026-03-06T09:55:00.000Z"
  },
  "powerupFiltered": { "tags": 3, "children": 5 },
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

### Rem 不存在

```json
{
  "ok": false,
  "command": "read-tree",
  "error": "Rem not found: kLrIOHJLyMd8Y2lyA",
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

### daemon 不可达

```json
{
  "ok": false,
  "command": "read-tree",
  "error": "守护进程未运行，请先执行 remnote connect",
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

---

## Markdown 大纲格式

read-tree 的核心输出是 Markdown 大纲文本。每一行对应一个 Rem 节点。

### 行结构

每行的格式为：

```
{缩进}{Markdown 前缀}{内容}{箭头分隔符}{backText} <!-- {remId} {元数据标记} -->
```

- **缩进**：每级 2 个空格（根节点 0 个空格）
- **Markdown 前缀**：映射 Rem 的格式属性
- **内容**：Rem 的 text 字段（已通过 SDK 转为 Markdown）
- **箭头分隔符**：表示 practiceDirection（闪卡方向）
- **remId**：该行对应的 Rem ID
- **元数据标记**：空格分隔的属性标记

### Markdown 前缀（由外到内）

前缀的嵌套顺序与序列化一致：Header → Todo → Code。

| 前缀 | 含义 | 对应字段 |
|------|------|----------|
| `# ` | H1 标题 | `fontSize: 'H1'` |
| `## ` | H2 标题 | `fontSize: 'H2'` |
| `### ` | H3 标题 | `fontSize: 'H3'` |
| `- [ ] ` | 未完成待办 | `isTodo: true, todoStatus: 'Unfinished'` |
| `- [x] ` | 已完成待办 | `isTodo: true, todoStatus: 'Finished'` |
| `` `...` `` | 代码块 | `isCode: true` |
| `---` | 分隔线 | Divider Powerup |

### 箭头分隔符

箭头仅编码 **practiceDirection**（闪卡练习方向），不编码 type。type 由元数据标记承载。

#### 有 backText 的箭头（中间箭头）

| 箭头 | 格式 | practiceDirection |
|------|------|-------------------|
| ` → ` | `text → backText` | forward |
| ` ← ` | `text ← backText` | backward |
| ` ↔ ` | `text ↔ backText` | both |

#### 多行闪卡的箭头

多行闪卡（Multiline Card）的答案在子节点中，不在 backText 中。

| 箭头 | 格式 | practiceDirection | 说明 |
|------|------|-------------------|------|
| ` ↓ ` | `text ↓ backText` | forward | 有 backText 的多行 |
| ` ↑ ` | `text ↑ backText` | backward | 有 backText 的多行 |
| ` ↕ ` | `text ↕ backText` | both | 有 backText 的多行 |
| ` ↓`（尾部） | `text ↓` | forward | 无 backText 的多行 |
| ` ↑`（尾部） | `text ↑` | backward | 无 backText 的多行 |
| ` ↕`（尾部） | `text ↕` | both | 无 backText 的多行 |

### 元数据标记

行尾 `<!-- -->` 注释中的标记，空格分隔。

| 标记 | 含义 | 何时出现 |
|------|------|----------|
| `type:concept` | Rem 类型为 concept | type 不为 default 时 |
| `type:descriptor` | Rem 类型为 descriptor | type 不为 default 时 |
| `type:portal` | Portal 类型 | type 为 portal 时 |
| `refs:id1,id2,...` | Portal 直接引用的 Rem ID | 仅 portal 类型 |
| `doc` | isDocument = true | 独立于 type |
| `role:card-item` | isCardItem = true | 多行闪卡的答案行 |
| `children:N` | 折叠的子节点数量 | 深度超限且有子节点时 |
| `tag:Name(id)` | 已附加的标签 | 每个 tag 一个标记 |
| `top` | 知识库顶层 Rem | 无父节点时 |

### 完整示例

```markdown
# 数据结构 <!--kLr type:concept doc top-->
  ## 线性结构 <!--ABC type:concept-->
    数组 → Array <!--DEF-->
    链表 ↓ <!--GHI type:concept-->
      单向链表 <!--JKL role:card-item-->
      双向链表 <!--MNO role:card-item-->
    - [x] 复习完成 <!--PQR-->
    `quickSort()` <!--STU-->
  ## 树结构 <!--VWX type:concept children:8-->
  <!--...elided 3 siblings (parent:kLr range:3-5 total:6)-->
```

---

## 省略占位符

当子节点数超过 maxSiblings 或全局预算耗尽时，自动插入省略行。

### 精确省略（sibling 裁剪）

```
<!--...elided {N} siblings (parent:{parentId} range:{from}-{to} total:{total})-->
```

当 `children.length > maxSiblings` 时触发。保留前 70%（向上取整）+ 后 30%（向下取整），中间用省略行替代。

### 非精确省略（全局预算耗尽）

```
<!--...elided >={N} nodes (parent:{parentId} range:{from}-{to} total:{total})-->
```

当全局 `maxNodes` 预算耗尽时触发。`>=N` 表示被省略的节点数不精确（可能还有后代）。

### 字段说明

| 字段 | 含义 |
|------|------|
| `N` 或 `>=N` | 被省略的节点数 |
| `siblings` / `nodes` | 精确省略用 siblings，非精确用 nodes |
| `parent:{id}` | 省略占位的父 Rem ID |
| `range:{from}-{to}` | 被省略节点在父节点 children 中的索引范围 |
| `total:{total}` | 父节点的总 children 数 |

---

## 预算控制

三个维度协作限制输出规模，优先级：depth > maxSiblings > maxNodes。

### depth（递归深度）

- 控制子树展开的层数。根节点 = 深度 0
- 当 `currentDepth >= depth` 且有子节点时，子树**折叠**——不递归展开，输出 `children:N` 标记
- `-1` = 无深度限制

### maxSiblings（单层兄弟上限）

- 每个父节点下最多展示 maxSiblings 个子节点
- 超限时保留前 70%（`ceil(max * 0.7)`）+ 后 30%（`floor(max * 0.3)`），中间插入精确省略行
- 示例：maxSiblings=20, 实际 100 个子节点 → 展示前 14 + 后 6，中间省略 80 个

### maxNodes（全局节点上限）

- 整棵树遍历的节点总预算
- 每访问一个节点，预算递减 1
- 预算耗尽后，剩余节点生成非精确省略占位符

---

## 祖先路径

当 `ancestorLevels > 0` 时，向上追溯根节点的祖先链。

### 输出格式（人类模式）

由远及近显示祖先路径，追加在大纲前面：

```
<!-- ancestors: 知识库 (root_id [top]) > 项目 (proj_id) > 子模块 (sub_id) -->
```

### JSON 模式

`ancestors` 数组，元素顺序由近及远（根的直接父亲在前，最远祖先在后）：

```json
{
  "ancestors": [
    { "id": "sub_id", "name": "子模块", "childrenCount": 3, "isDocument": false },
    { "id": "proj_id", "name": "项目", "childrenCount": 8, "isDocument": true },
    { "id": "root_id", "name": "知识库", "childrenCount": 15, "isDocument": true, "isTopLevel": true }
  ]
}
```

### 限制

- 上限 10 层（超过 10 被钳位为 10）
- 遇到无父节点的顶级 Rem 时提前停止
- 最远祖先标记 `isTopLevel: true`（如果它是顶级 Rem）

---

## Portal 感知

read-tree 能识别 Portal 类型的 Rem 并输出其引用信息。

```markdown
嵌入的知识 <!--portal_id type:portal refs:ref_id1,ref_id2-->
```

- `type:portal`：标记为 Portal 类型
- `refs:id1,id2,...`：该 Portal 直接引用的 Rem ID 列表（不递归展开）

Portal 检测依据：`rem.type === 6`（RemNote SDK 内部编码）。

---

## Powerup 过滤

默认 `includePowerup=false`，过滤 Powerup 产生的噪音数据：

| 过滤对象 | 过滤条件 | 说明 |
|----------|----------|------|
| **tags** | `isPowerup()=true` 的 Tag | 系统 Powerup Tag（标题、高亮、代码等） |
| **children** | `isPowerupProperty()` / `isPowerupSlot()` / `isPowerupPropertyListItem()` / `isPowerupEnum()` 为 true 的子 Rem | Powerup 产生的隐藏子 Rem |

过滤统计通过 `powerupFiltered` 字段返回。`--includePowerup` 可恢复完整数据。

---

## 缓存行为

| 时机 | 行为 |
|------|------|
| 读取成功 | 大纲文本写入 `cache.set('tree:' + remId, outline)` |
| 参数缓存 | 同时缓存 `tree-depth:`、`tree-maxNodes:`、`tree-maxSiblings:`（供 edit-tree 并发检测复现查询） |
| 已有缓存 | 覆盖旧缓存，返回 `cacheOverridden` 元数据 |
| 缓存用途 | 供 `edit-tree` 的三道防线使用 |
| 缓存存储 | daemon 内存中的 LRU 缓存（最大 200 条目） |
| 缓存清空 | daemon 关闭时自动消失 |

---

## 内部流程

```
1. CLI 解析参数（remId, depth, maxNodes, maxSiblings, ancestorLevels, includePowerup）
2. sendRequest → WS → daemon
3. daemon TreeReadHandler:
   ├─ 应用默认值（config.ts）
   ├─ 记录旧缓存时间（若存在）
   ├─ forwardToPlugin('read_tree', payload)
   ├─ Plugin 端：
   │   ├─ plugin.rem.findOne(remId)
   │   ├─ 递归遍历子树（buildNode）
   │   │   ├─ depth 检查 → 折叠/展开
   │   │   ├─ maxSiblings → sliceSiblings() 省略
   │   │   ├─ maxNodes → 全局预算递减
   │   │   └─ Powerup 过滤（可选）
   │   ├─ 祖先链构建（ancestorLevels > 0 时）
   │   └─ tree-serializer 序列化为 Markdown 大纲
   ├─ 缓存大纲文本 + 读取参数
   └─ 附加 _cacheOverridden 元数据（若之前有缓存）
4. CLI 格式化输出
```

---

## 退出码

| 退出码 | 含义 | 触发条件 |
|:------:|------|----------|
| 0 | 成功 | 树读取成功 |
| 1 | 业务错误 | Rem 不存在、Plugin 未连接等 |
| 2 | daemon 不可达 | daemon 未运行或 WS 连接失败 |

---

## 输出字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `data.outline` | string | Markdown 大纲文本（核心输出） |
| `data.rootId` | string | 根节点 Rem ID |
| `data.depth` | number | 实际使用的展开深度 |
| `data.nodeCount` | number | 树中总节点数 |
| `ancestors` | AncestorInfo[] | 祖先路径（仅 ancestorLevels > 0 时） |
| `cacheOverridden` | object | 之前有缓存时附加 |
| `powerupFiltered` | object | Powerup 过滤统计（`tags` + `children` 数量） |

---

## 配置依赖

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `defaults.readTreeDepth` | 3 | 默认递归深度 |
| `defaults.maxNodes` | 200 | 默认全局节点上限 |
| `defaults.maxSiblings` | 20 | 默认单层兄弟上限 |
| `defaults.readTreeAncestorLevels` | 0 | 默认祖先追溯层数 |
| `defaults.readTreeIncludePowerup` | false | 默认是否包含 Powerup |
| `defaults.cacheMaxSize` | 200 | 缓存条目上限 |
