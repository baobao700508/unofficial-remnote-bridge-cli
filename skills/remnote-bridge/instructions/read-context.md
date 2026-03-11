# read-context

> 读取当前上下文视图，支持 focus（鱼眼）和 page（页面）两种模式，提供以焦点为中心的渐进式上下文。

---

## 功能

`read-context` 根据用户在 RemNote 中的当前位置，生成上下文感知的 Markdown 大纲。两种模式适用于不同场景：

- **focus 模式**（默认）：以当前焦点 Rem 为中心，向上追溯祖先，构建鱼眼视图——焦点完全展开，周围递减
- **page 模式**：以当前打开的页面 Rem 为根，均匀展开子树

核心能力：
- 鱼眼深度梯度（focus 模式）：焦点 depth=3、siblings depth=1、叔伯 depth=0
- 面包屑路径：输出从根到当前位置的完整路径
- 焦点标记：焦点 Rem 的文本前缀 `* `，便于快速定位
- 三个维度的预算控制：深度（depth/ancestorLevels）、全局节点上限（maxNodes）、单层兄弟上限（maxSiblings）
- Powerup 噪音过滤（硬编码过滤，无选项）
- Portal 感知：识别 Portal 类型并输出引用的 Rem ID
- **无缓存**——每次调用都从 SDK 获取最新数据

---

## 用法

### 人类模式

```bash
remnote-bridge read-context [--mode <mode>] [--ancestor-levels <N>] [--depth <N>] [--max-nodes <N>] [--max-siblings <N>] [--focus-rem-id <remId>]
```

| 参数/选项 | 类型 | 必需 | 说明 |
|-----------|------|:----:|------|
| `--mode <mode>` | string | 否 | 模式：`focus`（默认）或 `page` |
| `--ancestor-levels <N>` | integer | 否 | 向上追溯几层祖先（默认 2，仅 focus 模式） |
| `--depth <N>` | integer | 否 | 展开深度（默认 3，仅 page 模式） |
| `--max-nodes <N>` | integer | 否 | 全局节点上限（默认 200） |
| `--max-siblings <N>` | integer | 否 | 每个父节点下展示的 children 上限（默认 20） |
| `--focus-rem-id <remId>` | string | 否 | 指定鱼眼中心 Rem ID（仅 focus 模式，默认使用当前焦点） |

Focus 模式输出示例：

```
<!-- path: 机器学习笔记 > 监督学习 > 线性回归 -->
<!-- focus: 线性回归 (id3) -->
监督学习 <!--id1 doc-->
  逻辑回归 <!--id2 doc children:5-->
  * 线性回归 <!--id3 doc-->
    损失函数 <!--id4-->
      均方误差 <!--id5-->
      交叉熵 <!--id6-->
    梯度下降 <!--id7-->
    正则化 <!--id8 children:3-->
  决策树 <!--id9 doc children:8-->
```

Page 模式输出示例：

```
<!-- page: 机器学习笔记 -->
<!-- path: 机器学习笔记 -->
机器学习笔记 <!--kLr doc top-->
  监督学习 <!--id1 doc-->
    线性回归 <!--id3 doc-->
    逻辑回归 <!--id2 doc-->
  无监督学习 <!--id4 doc-->
    聚类 <!--id10-->
    降维 <!--id11-->
  <!--...elided 3 siblings (parent:kLr range:2-4 total:5)-->
```

### JSON 模式

```bash
remnote-bridge read-context --json '{"mode":"focus","ancestorLevels":3,"maxNodes":100}'
remnote-bridge read-context --json '{"mode":"focus","focusRemId":"kLrIOHJLyMd8Y2lyA","ancestorLevels":2}'
remnote-bridge read-context --json '{"mode":"page","depth":5,"maxSiblings":10}'
```

---

## JSON 输入参数

| 字段 | 类型 | 必需 | 说明 |
|------|------|:----:|------|
| `mode` | string | 否 | 模式：`"focus"` 或 `"page"`（默认 `"focus"`） |
| `ancestorLevels` | number | 否 | 向上追溯几层祖先（默认 2，仅 focus 模式） |
| `depth` | number | 否 | 展开深度（默认 3，仅 page 模式） |
| `maxNodes` | number | 否 | 全局节点上限（默认 200） |
| `maxSiblings` | number | 否 | 每个父节点下展示的 children 上限（默认 20） |
| `focusRemId` | string | 否 | 指定鱼眼中心 Rem ID（仅 focus 模式，默认使用当前焦点） |

---

## JSON 输出

### 成功（focus 模式）

```json
{
  "ok": true,
  "command": "read-context",
  "data": {
    "nodeCount": 42,
    "outline": "<!-- path: Root > Docs > My Note -->\n<!-- focus: My Note (remId1) -->\n* My Note <!--remId1 type:concept-->\n  SubItem <!--remId2-->\n...",
    "breadcrumb": ["Root", "Docs", "My Note"],
    "mode": "focus"
  },
  "timestamp": "2026-03-07T10:00:00.000Z"
}
```

### 成功（page 模式）

```json
{
  "ok": true,
  "command": "read-context",
  "data": {
    "nodeCount": 25,
    "outline": "<!-- page: My Note -->\n<!-- path: Root > Docs > My Note -->\nMy Note <!--remId1 doc-->\n  SubItem <!--remId2-->\n...",
    "breadcrumb": ["Root", "Docs", "My Note"],
    "mode": "page"
  },
  "timestamp": "2026-03-07T10:00:00.000Z"
}
```

### 无焦点 Rem（focus 模式）

```json
{
  "ok": false,
  "command": "read-context",
  "error": "当前没有聚焦的 Rem，请先在 RemNote 中点击一个 Rem",
  "timestamp": "2026-03-07T10:00:00.000Z"
}
```

### 无打开的页面（page 模式）

```json
{
  "ok": false,
  "command": "read-context",
  "error": "无法获取当前面板 ID，请确保有打开的页面",
  "timestamp": "2026-03-07T10:00:00.000Z"
}
```

### 参数错误

```json
{
  "ok": false,
  "command": "read-context",
  "error": "--mode must be \"focus\" or \"page\"",
  "timestamp": "2026-03-07T10:00:00.000Z"
}
```

```json
{
  "ok": false,
  "command": "read-context",
  "error": "numeric options must be numbers",
  "timestamp": "2026-03-07T10:00:00.000Z"
}
```

### daemon 不可达

```json
{
  "ok": false,
  "command": "read-context",
  "error": "守护进程未运行，请先执行 remnote-bridge connect",
  "timestamp": "2026-03-07T10:00:00.000Z"
}
```

---

## 内部流程

```
1. CLI 解析参数（mode, ancestorLevels, depth, maxNodes, maxSiblings, focusRemId）
2. sendRequest → WS → daemon
3. daemon ContextReadHandler:
   ├─ 合并配置默认值（config.ts）
   └─ forwardToPlugin('read_context', { mode, ancestorLevels, depth, maxNodes, maxSiblings, focusRemId })
4. Plugin 端 readContext() 分支：
   │
   ├─ mode === 'focus' → readContextFocus():
   │   ├─ focusRemId ? plugin.rem.findOne(focusRemId) : plugin.focus.getFocusedRem() → 获取焦点 Rem
   │   ├─ 向上追溯 ancestorLevels 层 → ancestorPath[]
   │   ├─ buildBreadcrumb(plugin, focusRem) → 面包屑路径
   │   ├─ 从最顶层祖先开始递归 buildFisheyeNode()：
   │   │   ├─ 获取子节点 → filterNoisyChildren（Powerup 过滤）
   │   │   ├─ 鱼眼深度梯度判断：
   │   │   │   ├─ 焦点本身 → depth=3，所有 children 可见
   │   │   │   ├─ 焦点的 siblings → buildShallowNode(depth=1, maxChildrenPreview=3)
   │   │   │   ├─ 祖先路径节点 → 继续鱼眼递归
   │   │   │   └─ 叔伯节点 → buildShallowNode(depth=0, maxChildrenPreview=0)
   │   │   ├─ sliceSiblings → maxSiblings 省略（前 70% + 后 30%）
   │   │   ├─ maxNodes 预算检查 → 超限时停止递归
   │   │   └─ Portal 感知（rem.type === 6 → getPortalDirectlyIncludedRem）
   │   ├─ 序列化为 Markdown 大纲
   │   │   ├─ 头部：<!-- path: ... --> + <!-- focus: Name (id) -->
   │   │   ├─ 焦点 Rem 文本前缀 * 标记
   │   │   └─ buildOutline() + 省略占位符
   │   └─ 返回 { nodeCount, outline, breadcrumb, mode: 'focus' }
   │
   └─ mode === 'page' → readContextPage():
       ├─ plugin.window.getFocusedPaneId() → 获取当前面板
       ├─ plugin.window.getOpenPaneRemId(paneId) → 获取页面 Rem ID
       ├─ plugin.rem.findOne(remId) → 加载 Rem 对象
       ├─ buildBreadcrumb(plugin, pageRem) → 面包屑路径
       ├─ 递归 buildSubtreeNode()：
       │   ├─ 获取子节点 → filterNoisyChildren（Powerup 过滤）
       │   ├─ depth 检查 → 到达 maxDepth 时折叠
       │   ├─ sliceSiblings → maxSiblings 省略（前 70% + 后 30%）
       │   ├─ maxNodes 预算检查 → 超限时停止递归
       │   └─ Portal 感知
       ├─ 序列化为 Markdown 大纲
       │   ├─ 头部：<!-- page: Name --> + <!-- path: ... -->
       │   └─ buildOutline() + 省略占位符
       └─ 返回 { nodeCount, outline, breadcrumb, mode: 'page' }
5. CLI 格式化输出（人类模式打印 outline / JSON 模式单行）
```

---

## 输出字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `data.outline` | string | Markdown 大纲文本（核心输出） |
| `data.nodeCount` | number | 树中节点总数 |
| `data.breadcrumb` | string[] | 从根到当前位置的路径数组 |
| `data.mode` | string | 实际使用的模式：`"focus"` 或 `"page"` |

---

## Focus 模式：鱼眼深度梯度

focus 模式的核心特点是**渐进式展开**——离焦点越近，展开越深；离焦点越远，展开越浅：

| 节点角色 | 展开深度 | children 可见度 | 说明 |
|:---------|:---------|:---------------|:-----|
| 焦点本身 | depth=3 | 所有 children（受 maxSiblings 限制） | 完全展开 |
| 焦点的 siblings | depth=1 | 前 3 个 children | 浅层预览 |
| 祖先路径节点 | 递归展开 | 所有 children（受 maxSiblings 限制） | 沿路径展开 |
| 叔伯节点 | depth=0 | 不展开 | 仅显示标题 |

### 祖先追溯

`ancestorLevels` 控制从焦点 Rem 向上追溯几层祖先作为上下文起点：
- 默认 2：从焦点的祖父级开始展示
- 设为 0：仅展示焦点本身及其子树
- 更大的值提供更多上下文，但输出也更长

### 焦点标记

焦点 Rem 的 Markdown 文本以 `* ` 前缀标记，便于 Agent 在大纲中快速定位：

```
监督学习 <!--id1-->
  * 线性回归 <!--id3-->    ← 焦点 Rem
    损失函数 <!--id4-->
```

---

## 两种模式对比

| 维度 | focus 模式 | page 模式 |
|:-----|:----------|:----------|
| 触发点 | 当前焦点 Rem 或指定 `focusRemId` | 当前打开的页面 Rem |
| SDK 入口 | `focusRemId` ? `plugin.rem.findOne()` : `plugin.focus.getFocusedRem()` | `plugin.window.getFocusedPaneId()` → `getOpenPaneRemId()` |
| 深度参数 | `ancestorLevels`（向上几层） | `depth`（向下几层） |
| 展开策略 | 鱼眼（焦点完全展开，周围递减） | 均匀展开（全树同深度控制） |
| 大纲头注释 | `<!-- path: ... -->` + `<!-- focus: Name (id) -->` | `<!-- page: Name -->` + `<!-- path: ... -->` |
| 适用场景 | 精确定位到某个 Rem 的上下文 | 浏览整个页面的结构 |

---

## 与 read-tree 的关键差异

| 维度 | read-tree | read-context |
|:-----|:---------|:------------|
| 入口参数 | `remId`（指定 Rem） | 无（自动获取当前焦点/页面） |
| 展开规则 | 递归展开**所有** children | focus: 鱼眼梯度 / page: 均匀展开 |
| 面包屑 | 可选（`--ancestor-levels`） | **内置**（始终输出 breadcrumb） |
| 缓存 | 有（供 edit-tree 使用） | **无缓存** |
| 焦点标记 | 无 | focus 模式 `* ` 前缀 |
| Powerup 过滤选项 | `--includePowerup` | 硬编码过滤（无选项） |
| 序列化方式 | 完整字段（buildFullSerializableRem） | 最小字段（createMinimalSerializableRem） |

---

## 预算控制

三个维度协作限制输出规模：

### ancestorLevels / depth

- **focus 模式**：`ancestorLevels` 控制向上追溯几层祖先（默认 2）
- **page 模式**：`depth` 控制向下展开几层（默认 3，-1 为无限）
- 到达深度限制时折叠，标注 `children:N`

### maxSiblings（单层上限）

- 默认 20
- 超限时保留前 70%（`ceil(max * 0.7)`）+ 后 30%（`floor(max * 0.3)`），中间插入省略行

### maxNodes（全局节点上限）

- 默认 200
- 每访问一个节点，预算递减 1
- 预算耗尽后，剩余节点生成非精确省略占位符

---

## 退出码

| 退出码 | 含义 | 触发条件 |
|:------:|------|----------|
| 0 | 成功 | 读取成功 |
| 1 | 业务错误 | 参数无效、无焦点 Rem、Plugin 异常等 |
| 2 | daemon 不可达 | daemon 未运行或 WS 连接失败 |

---

## 配置依赖

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `defaults.readContextMode` | `"focus"` | 默认模式 |
| `defaults.readContextAncestorLevels` | 2 | focus 模式默认祖先层数 |
| `defaults.readContextDepth` | 3 | page 模式默认展开深度 |
| `defaults.maxNodes` | 200 | 默认全局节点上限 |
| `defaults.maxSiblings` | 20 | 默认单层兄弟上限 |

---

## 注意事项

- read-context **不缓存**结果——每次调用都重新从 SDK 获取最新数据
- focus 模式需要用户在 RemNote 中有焦点 Rem（光标需在某个 Rem 上）
- page 模式需要 RemNote 中有打开的页面
- 输出使用 `createMinimalSerializableRem` 序列化，不包含 backText、practiceDirection 等详细信息
- Powerup 过滤是硬编码的，无法通过参数关闭
- Portal 感知：Portal 类型的 Rem（`type === 6`）会标注 `type:portal` 和 `refs:{id1,id2,...}`
- 面包屑路径通过 `buildBreadcrumb()` 从当前 Rem 向上追溯到根构建，每层使用 Markdown 文本
