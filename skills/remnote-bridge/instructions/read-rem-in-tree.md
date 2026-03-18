# read-rem-in-tree — 子树大纲 + 节点属性一次获取

> `read_tree` + `read_rem` 的完美结合体。一次调用同时获取 Markdown 大纲和每个节点的完整 RemObject JSON，建立双重缓存。

---

## 适用场景

- 需要同时查看子树结构和节点详细属性（如批量编辑前的全量读取）
- 一次调用建立 tree 缓存（供 `edit_tree`）和 rem 缓存（供 `edit_rem`）
- 替代连续调用 `read_tree` + 多次 `read_rem` 的场景

## 不适用场景

- 只需大纲不需属性 → 用 `read_tree`（更轻量）
- 只需单个 Rem 属性 → 用 `read_rem`
- 大规模子树（>50 节点） → 每节点 40+ SDK 调用，性能开销大

---

## 命令格式

```bash
# 人类模式
remnote-bridge read-rem-in-tree <remId> [options]

# JSON 模式
remnote-bridge --json read-rem-in-tree '{"remId":"...","depth":3,"maxNodes":50}'
```

## 参数

| 参数 | 类型 | 默认值 | 说明 |
|:-----|:-----|:-------|:-----|
| `remId` | string | **必需** | 子树根节点的 Rem ID |
| `depth` | number | 3 | 递归展开深度（-1 = 无限） |
| `maxNodes` | number | **50** | 全局节点总预算（注意比 read_tree 的 200 低） |
| `maxSiblings` | number | 20 | 单个父节点下最大可见子节点数 |
| `ancestorLevels` | number | 0 | 向上追溯祖先层数（上限 10） |
| `fields` | string[] | - | RemObject 字段过滤（只返回指定子集） |
| `full` | boolean | false | 返回全部 51 个 RemObject 字段 |
| `includePowerup` | boolean | false | 包含 Powerup 系统数据 |

## 输出

### JSON 模式

```jsonc
{
  "ok": true,
  "command": "read-rem-in-tree",
  "data": {
    "rootId": "kLr...",
    "depth": 3,
    "nodeCount": 15,
    "outline": "# 数据结构 <!--kLr type:concept doc-->\n  ...",
    "remObjects": {
      "kLr": { "id": "kLr", "text": [...], "type": "concept", ... },
      "ABC": { "id": "ABC", "text": [...], ... }
    }
  },
  "ancestors": [...],          // 可选
  "cacheOverridden": {...},    // 可选
  "powerupFiltered": {...}     // 可选
}
```

### 核心字段

- `outline`：Markdown 大纲文本，与 `read_tree` 输出格式完全一致
- `remObjects`：扁平 map `{ remId → RemObject }`，每个 RemObject 与 `read_rem` 输出一致
  - 默认启用 Token Slimming（省略默认值字段）
  - `fields` / `full` 参数控制过滤行为

## 缓存行为

| 缓存 Key | 内容 | 用途 |
|:---------|:-----|:-----|
| `tree:{remId}` | outline 大纲文本 | `edit_tree` 前置缓存 |
| `tree-depth:{remId}` 等 | 读取参数 | `edit_tree` 乐观并发检测 |
| `rem:{nodeRemId}` | 完整 RemObject（N 个） | `edit_rem` 前置缓存 |

总缓存条目：1(tree) + 3(参数) + N(rem) ≈ N+4。注意 LRU 上限 200。

## 典型工作流

```
read_rem_in_tree → 一次获取全部信息
  ↓
edit_tree 结构编辑（tree 缓存已就绪）
  +
edit_rem 属性编辑（rem 缓存已就绪）
```

## 关联工具

- `read_tree`：只需大纲，更轻量
- `read_rem`：只需单个 Rem 属性
- `edit_tree`：结构编辑（需先 read_tree 或 read_rem_in_tree）
- `edit_rem`：属性编辑（需先 read_rem 或 read_rem_in_tree）
