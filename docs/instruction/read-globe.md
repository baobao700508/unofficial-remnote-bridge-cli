# read-globe

> 读取知识库全局概览，仅展开 Document 层级，提供知识库的宏观结构视图。

---

## 功能

`read-globe` 获取知识库中所有顶层 Rem（`parent === null`），过滤出 Document 类型的节点，递归展开为 Markdown 大纲。非 Document 的子 Rem 不会递归展开，仅在元数据中标注 `children:N`。

核心能力：
- 仅展开 Document 层级，过滤非文档内容
- 三个维度的预算控制：深度（depth）、全局节点上限（maxNodes）、单层兄弟上限（maxSiblings）
- Powerup 噪音过滤（硬编码过滤，无选项）
- Portal 感知：识别 Portal 类型并输出引用的 Rem ID

---

## 用法

### 人类模式

```bash
remnote read-globe [--depth <N>] [--max-nodes <N>] [--max-siblings <N>]
```

| 参数/选项 | 类型 | 必需 | 说明 |
|-----------|------|:----:|------|
| `--depth <N>` | integer | 否 | Document 嵌套深度（默认 -1，无限展开） |
| `--max-nodes <N>` | integer | 否 | 全局节点上限（默认 200） |
| `--max-siblings <N>` | integer | 否 | 每个父节点下展示的 Document 子节点上限（默认 20） |

输出示例：

```
<!-- globe: 知识库概览 -->
机器学习笔记 <!--kLr doc top-->
  监督学习 <!--id1 doc-->
    线性回归 <!--id2 doc-->
    逻辑回归 <!--id3 doc-->
  无监督学习 <!--id4 doc children:3-->
项目管理 <!--id5 doc top-->
  <!--...elided 3 siblings (parent:id5 range:2-4 total:5)-->
数学基础 <!--id6 doc top-->
```

### JSON 模式

```bash
remnote read-globe --json '{"depth":-1,"maxNodes":100,"maxSiblings":10}'
```

---

## JSON 输入参数

| 字段 | 类型 | 必需 | 说明 |
|------|------|:----:|------|
| `depth` | number | 否 | Document 嵌套深度（-1 = 无限，默认 -1） |
| `maxNodes` | number | 否 | 全局节点上限（默认 200） |
| `maxSiblings` | number | 否 | 每个父节点下展示的 Document 子节点上限（默认 20） |

---

## JSON 输出

### 成功

```json
{
  "ok": true,
  "command": "read-globe",
  "data": {
    "nodeCount": 42,
    "outline": "<!-- globe: 知识库概览 -->\n机器学习笔记 <!--kLr doc top-->\n  监督学习 <!--id1 doc-->\n..."
  },
  "timestamp": "2026-03-07T10:00:00.000Z"
}
```

### daemon 不可达

```json
{
  "ok": false,
  "command": "read-globe",
  "error": "守护进程未运行，请先执行 remnote connect",
  "timestamp": "2026-03-07T10:00:00.000Z"
}
```

### 参数错误

```json
{
  "ok": false,
  "command": "read-globe",
  "error": "--depth, --max-nodes, --max-siblings must be numbers",
  "timestamp": "2026-03-07T10:00:00.000Z"
}
```

---

## 内部流程

```
1. CLI 解析参数（depth, maxNodes, maxSiblings）
2. sendRequest → WS → daemon
3. daemon GlobeReadHandler:
   ├─ 应用配置默认值（config.ts）
   └─ forwardToPlugin('read_globe', { depth, maxNodes, maxSiblings })
4. Plugin 端 readGlobe():
   ├─ plugin.rem.getAll() → 获取所有 Rem
   ├─ 过滤 parent === null 的顶层 Rem
   ├─ 并行检查 isDocument() → 仅保留 Document
   ├─ 递归构建 Document 树（buildGlobeNode）：
   │   ├─ 获取子节点 → filterNoisyChildren（Powerup 过滤）
   │   ├─ 二次过滤：仅保留 Document 子节点
   │   ├─ 统计非 Document 子节点数量（标注 children:N）
   │   ├─ depth 检查 → 折叠/展开
   │   ├─ sliceSiblings → maxSiblings 省略（前 70% + 后 30%）
   │   ├─ maxNodes 预算检查 → 超限时停止递归
   │   └─ Portal 感知（rem.type === 6 → getPortalDirectlyIncludedRem）
   ├─ 序列化为 Markdown 大纲
   │   ├─ 头部：<!-- globe: 知识库概览 -->
   │   ├─ 每个顶层 Document 调用 buildOutline()
   │   └─ 省略占位符调用 serializeElidedLine()
   └─ 返回 { nodeCount, outline }
5. CLI 格式化输出（人类模式打印 outline / JSON 模式单行）
```

---

## 输出字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `data.outline` | string | Markdown 大纲文本（核心输出） |
| `data.nodeCount` | number | 树中 Document 节点总数 |

---

## 与 read-tree 的关键差异

| 维度 | read-tree | read-globe |
|:-----|:---------|:----------|
| 入口参数 | `remId`（指定 Rem） | 无（整个知识库） |
| 展开规则 | 递归展开**所有** children | **仅递归展开 Document** 子节点 |
| 非 Document 处理 | 正常展开 | 不展开，标注 `children:N` |
| 默认 depth | 3 | -1（无限） |
| 缓存 | 有（供 edit-tree 使用） | **无缓存** |
| Powerup 过滤选项 | `--includePowerup` | 硬编码过滤（无选项） |
| 序列化方式 | 完整字段（buildFullSerializableRem） | 最小字段（createMinimalSerializableRem） |
| 祖先路径 | 支持 `--ancestor-levels` | 不支持 |

---

## 预算控制

三个维度协作限制输出规模：

### depth（Document 嵌套深度）

- 默认 -1（无限展开所有 Document 层级）
- 当 `currentDepth >= depth` 且有 Document 子节点时，折叠并标注 `children:N`

### maxSiblings（单层 Document 上限）

- 默认 20
- 超限时保留前 70%（`ceil(max * 0.7)`）+ 后 30%（`floor(max * 0.3)`），中间插入省略行

### maxNodes（全局节点上限）

- 默认 200
- 每访问一个 Document 节点，预算递减 1
- 预算耗尽后，剩余节点生成非精确省略占位符

---

## 退出码

| 退出码 | 含义 | 触发条件 |
|:------:|------|----------|
| 0 | 成功 | 读取成功 |
| 1 | 业务错误 | 参数非数字、Plugin 异常等 |
| 2 | daemon 不可达 | daemon 未运行或 WS 连接失败 |

---

## 配置依赖

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `defaults.readGlobeDepth` | -1 | 默认 Document 嵌套深度 |
| `defaults.maxNodes` | 200 | 默认全局节点上限 |
| `defaults.maxSiblings` | 20 | 默认单层兄弟上限 |

---

## 注意事项

- read-globe **不缓存**结果——每次调用都重新从 SDK 获取最新数据
- 输出中非 Document 子 Rem 的数量通过 `children:N` 标注，但不包含在 `nodeCount` 中
- Powerup 过滤是硬编码的，无法通过参数关闭
- 输出使用 `createMinimalSerializableRem` 序列化，不包含闪卡方向、backText 等详细信息——仅提供文档层级结构概览
