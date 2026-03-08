# RemNote CLI - Portal 支持规范

## 概述

Portal 是 RemNote 中的特殊 Rem 类型，它不承载自身内容（text/backText 均为空），而是引用其他 Rem 在当前位置展示。Portal 只能通过 `createPortal()` 创建，不能通过 `setType()` 将已有 Rem 转为 Portal。

本规范定义 Portal 在 read-rem / edit-rem（单 Rem 模式）和 read-tree / edit-tree（树模式）中的完整行为。

### 核心问题

Portal Rem 的 51 个字段中，只有 7 个有意义（id、type、portalType、portalDirectlyIncludedRem、parent、positionAmongstSiblings、children），其余 44 个字段都是空值/默认值。当前 read-rem 对 Portal 和普通 Rem 使用相同的 34 字段输出，既浪费 token 又不直觉。

此外，Portal 的核心数据 `portalDirectlyIncludedRem` 在当前 edit-handler 中被标记为 READ_ONLY_FIELDS，完全不可通过 edit-rem 修改。修改 Portal 引用列表需要调用 `addToPortal()` / `removeFromPortal()` 这两个动作方法，现有 write-rem-fields 中没有对应实现。

### 与现有模式的关系

| 操作 | 树模式（edit-tree） | 单 Rem 模式（edit-rem） |
|------|---------------------|------------------------|
| 创建 Portal | ✓ 新增一行纯参数 Portal | ✗ |
| 删除 Portal | ✓ 删除该行 | ✗ |
| 移动 Portal | ✓ 改变缩进/位置 | ✗（可通过 parent 字段） |
| 修改 Portal 引用列表 | ✗（结构编辑不碰行内内容） | ✓ str_replace 简化 JSON |
| 查看 Portal 详情 | ✓ 大纲中一行元数据 | ✓ 简化 JSON 格式 |

---

## 一、单 Rem 模式：read-rem 对 Portal 的简化输出

### 检测条件

当 read-rem 返回的 RemObject 满足 `type === 'portal'` 时，自动切换为 Portal 简化格式。

### 简化格式

```json
{
  "id": "abc123",
  "type": "portal",
  "portalType": "portal",
  "portalDirectlyIncludedRem": ["remId1", "remId2", "remId3"],
  "parent": "parentRemId",
  "positionAmongstSiblings": 3,
  "children": ["remId1", "remId2", "remId3"],
  "createdAt": 1709000000000,
  "updatedAt": 1709000000000
}
```

#### 字段说明

| 字段 | 读写 | 说明 |
|------|------|------|
| `id` | R | Rem 唯一 ID |
| `type` | R | 固定为 `"portal"` |
| `portalType` | R | Portal 子类型：`"portal"` / `"embedded_queue"` / `"scaffold"` / `"search_portal"` |
| `portalDirectlyIncludedRem` | **Portal-W** | Portal 引用的 Rem ID 数组。**使用 SDK 原名**。通过 `addToPortal()` / `removeFromPortal()` 修改 |
| `parent` | RW | 父 Rem ID |
| `positionAmongstSiblings` | RW | 在兄弟间的位置 |
| `children` | R | 子 Rem ID 数组（与 `portalDirectlyIncludedRem` 基本重叠） |
| `createdAt` | R | 创建时间 |
| `updatedAt` | R | 最后更新时间 |

> **命名决策**：`portalDirectlyIncludedRem` 保持 SDK 原名，不简化为 `refs`。read-tree 元数据标记中使用简名 `refs:`（已有实现）。

#### `--fields` 和 `--full` 行为

- `--fields`：仍然可以指定任意字段（从完整 RemObject 中取），但默认输出使用上述简化格式
- `--full`：返回完整 51 字段的 RemObject（不做 Portal 简化）

#### 与普通 Rem 的区分

| 维度 | 普通 Rem | Portal Rem |
|------|----------|------------|
| 默认输出字段数 | 34 个 | 9 个 |
| 核心内容字段 | text、backText | portalDirectlyIncludedRem |
| 缓存 | 完整 51 字段 JSON | 完整 51 字段 JSON（不变） |

> **缓存不变**：read-handler 缓存的始终是完整 RemObject JSON（防线 2 需要用来做并发检测）。简化格式只影响返回给 AI 的输出。

---

## 二、单 Rem 模式：edit-rem 对 Portal 的写入支持

### str_replace 工作流

AI 通过 str_replace 修改简化 JSON 中的 `portalDirectlyIncludedRem` 数组：

```bash
# 添加一个引用
edit-rem abc123 --old-str '"portalDirectlyIncludedRem": ["remId1", "remId2"]' \
                --new-str '"portalDirectlyIncludedRem": ["remId1", "remId2", "remId3"]'

# 移除一个引用
edit-rem abc123 --old-str '"portalDirectlyIncludedRem": ["remId1", "remId2"]' \
                --new-str '"portalDirectlyIncludedRem": ["remId1"]'
```

### edit-handler 的 Portal 专用路径

当 edit-handler 检测到被编辑的 Rem 是 Portal（`type === 'portal'`）时：

#### 防线不变

三道防线（缓存存在性、并发检测、str_replace 精确匹配）完全不变。

#### str_replace 的操作对象

**问题**：缓存中存储的是完整 51 字段 JSON，但 AI 看到的是 9 字段简化 JSON。str_replace 的 oldStr 来自简化输出，在完整 JSON 上匹配不到。

**方案**：对 Portal Rem，edit-handler 内部使用**简化 JSON**作为 str_replace 的操作目标：

1. 防线 1：检查缓存存在性（`'rem:' + remId`），不变
2. 防线 2：从 Plugin 重新获取完整 RemObject，序列化为完整 JSON 与缓存对比，不变
3. **str_replace**：将缓存的完整 JSON 转换为简化 JSON，在简化 JSON 上执行 str_replace
4. 解析 str_replace 后的简化 JSON，推导变更字段
5. 调用专用写入路径

#### 变更推导与写入

对比 str_replace 前后的简化 JSON，推导出变更的字段：

| 变更字段 | 写入方式 |
|---------|---------|
| `portalDirectlyIncludedRem` | diff 数组，新增的调 `addToPortal()`，移除的调 `removeFromPortal()` |
| `parent` | 调 `setParent()` |
| `positionAmongstSiblings` | 调 `setParent(parent, position)` |
| 其他字段（id、type、portalType、children、createdAt、updatedAt） | 只读，变更产生 warning |

#### `portalDirectlyIncludedRem` 的 diff 逻辑

```
旧值：["remId1", "remId2", "remId3"]
新值：["remId1", "remId4"]

diff：
  移除：remId2, remId3 → 对每个调 rem.removeFromPortal(portal)
  新增：remId4          → 对每个调 rem.addToPortal(portal)
```

注意调用方向：`addToPortal()` 和 `removeFromPortal()` 是在**被引用的 Rem** 上调用，参数是 Portal Rem。

```typescript
// 添加引用：被引用 Rem.addToPortal(portal)
const targetRem = await plugin.rem.findOne(remId4);
await targetRem.addToPortal(portalRem);

// 移除引用：被引用 Rem.removeFromPortal(portal)
const targetRem = await plugin.rem.findOne(remId2);
await targetRem.removeFromPortal(portalRem);
```

---

## 三、树模式：edit-tree 创建 Portal

### 现状

当前 edit-tree 的新增行只支持纯内容 + Markdown 前缀（Header、Todo、Code、箭头分隔符）。新增行通过 `parsePowerupPrefix()` 解析后调用 `create_rem` 创建。

Portal 无法通过 `create_rem` 创建——SDK 要求使用专用的 `createPortal()` API。

### 新增行创建 Portal

#### 语法

Portal 新增行**没有文本内容**（Portal Rem 的 text 为空），整行是纯参数：

```
  <!--portal refs:remId1,remId2-->
```

格式说明：

| 部分 | 说明 |
|------|------|
| 缩进 | 与普通行相同，两个空格一级，决定父节点 |
| `<!--portal` | Portal 行的开始标记 |
| `refs:remId1,remId2` | Portal 引用的 Rem ID 列表，逗号分隔 |
| `-->` | 结束标记 |

#### 与已有行的 Portal 表示对比

```
# 已有 Portal（read-tree 输出），有 remId：
 <!--abc123 type:portal refs:remId1,remId2-->

# 新增 Portal（edit-tree 输入），无 remId：
 <!--portal refs:remId1,remId2-->
```

区别：
- 已有行的 `<!--` 后面第一个 token 是 remId（如 `abc123`），后面跟 `type:portal`
- 新增行的 `<!--` 后面第一个 token 是关键字 `portal`，没有 remId

#### 解析规则

tree-parser 的 `parseLine()` 需要识别新增 Portal 行：

1. 匹配模式：`<!--portal` 开头 + `-->` 结尾
2. 提取 refs：解析 `refs:id1,id2,...` 部分
3. 标记为新增 Portal 行（`remId = null`，`isPortal = true`）

#### 执行流程

tree-edit-handler 检测到新增行是 Portal 时：

1. `createPortal()`：在 Plugin 层调用 `plugin.rem.createPortal()` 创建空 Portal
2. `setParent()`：设置 Portal 的父节点和位置（根据缩进推断）
3. `addToPortal()`：对每个 ref，调用 `ref.addToPortal(portal)` 添加引用

#### 空 Portal

允许创建不带 refs 的空 Portal：

```
  <!--portal-->
```

此时只执行 `createPortal()` + `setParent()`，不调用 `addToPortal()`。

### edit-tree 新增行的参数扩展

#### 背景

当前 edit-tree 新增行的"参数"完全通过行内容的 Markdown 前缀传递（`# ` → H1、`- [ ] ` → Todo、反引号 → Code 等）。这些参数是内容的一部分，由 `parsePowerupPrefix()` 解析。

Portal 行引入了一种新模式：**纯参数行**（没有文本内容，整行都是参数）。这是一个特例，不改变普通新增行的参数传递方式。

#### 普通新增行 vs Portal 新增行

| 维度 | 普通新增行 | Portal 新增行 |
|------|-----------|--------------|
| 内容 | 有文本内容 | 无文本内容 |
| 参数来源 | 行内容的 Markdown 前缀 | `<!--portal ...-->` 注释标记 |
| 创建 API | `create_rem` + `write_rem_fields` | `createPortal()` + `setParent()` + `addToPortal()` |
| 行格式 | `  新的文本内容` | `  <!--portal refs:id1,id2-->` |

---

## 四、树模式：edit-tree 删除 Portal

删除 Portal 行与删除普通行行为一致：

1. 检测到已有 Portal 行从大纲中消失
2. 调用 `portal.remove()` 删除该 Portal Rem
3. Portal 被删除后，被引用的 Rem 不受影响（它们仍然存在于原始位置）

> Portal 下面在树中没有可编辑的子节点（引用展示由 RemNote 自动处理），所以不存在"孤儿检测"问题。

---

## 五、Plugin 层新增 Service

### 同态命名

| 操作 | CLI action | Plugin service 文件 | Plugin service 函数 |
|------|------------|-------------------|-------------------|
| 创建 Portal | `create_portal` | `create-portal.ts` | `createPortal()` |
| 添加 Portal 引用 | `add_to_portal` | `add-to-portal.ts` | `addToPortal()` |
| 移除 Portal 引用 | `remove_from_portal` | `remove-from-portal.ts` | `removeFromPortal()` |

### `create_portal` Service

```typescript
export async function createPortal(
  plugin: ReactRNPlugin,
  payload: { parentId: string; position?: number },
): Promise<{ remId: string }> {
  const portal = await plugin.rem.createPortal();
  if (!portal) throw new Error('Failed to create portal');
  const parent = await plugin.rem.findOne(payload.parentId);
  if (!parent) throw new Error(`Parent not found: ${payload.parentId}`);
  await portal.setParent(parent, payload.position);
  return { remId: portal._id };
}
```

### `add_to_portal` Service

```typescript
export async function addToPortal(
  plugin: ReactRNPlugin,
  payload: { portalId: string; remId: string },
): Promise<void> {
  const portal = await plugin.rem.findOne(payload.portalId);
  if (!portal) throw new Error(`Portal not found: ${payload.portalId}`);
  const rem = await plugin.rem.findOne(payload.remId);
  if (!rem) throw new Error(`Rem not found: ${payload.remId}`);
  await rem.addToPortal(portal);
}
```

### `remove_from_portal` Service

```typescript
export async function removeFromPortal(
  plugin: ReactRNPlugin,
  payload: { portalId: string; remId: string },
): Promise<void> {
  const portal = await plugin.rem.findOne(payload.portalId);
  if (!portal) throw new Error(`Portal not found: ${payload.portalId}`);
  const rem = await plugin.rem.findOne(payload.remId);
  if (!rem) throw new Error(`Rem not found: ${payload.remId}`);
  await rem.removeFromPortal(portal);
}
```

---

## 六、实现要点

### read-handler 变更

1. `handleReadRem()` 在返回结果前，检测 `type === 'portal'`
2. 如果是 Portal 且不是 `--full` 或 `--fields` 模式，将完整 RemObject 精简为 9 字段格式
3. 缓存的完整 JSON 不受影响

### edit-handler 变更

1. `handleEditRem()` 在防线 2 通过后，检测缓存 JSON 中 `type === 'portal'`
2. Portal 路径：将完整 JSON → 简化 JSON → str_replace → 解析 → diff → 调用专用 service
3. 非 Portal 路径：保持现有逻辑不变
4. `portalDirectlyIncludedRem` 从 READ_ONLY_FIELDS 中移除（仅在 Portal 专用路径中处理，普通 Rem 该字段始终为空数组不受影响）

### tree-parser 变更

1. `parseLine()`：新增 Portal 行检测（`<!--portal ...-->` 模式）
2. 新增 `parsePortalLine()` 函数：提取 refs 列表
3. `OutlineNode` 接口扩展：添加 `isPortal?: boolean` 和 `portalRefs?: string[]` 字段
4. `TreeOp` 的 `create` 类型扩展：添加 `isPortal?: boolean` 和 `portalRefs?: string[]` 字段

### tree-edit-handler 变更

1. `create` 操作分支：检测 `op.isPortal`
2. Portal 路径：调用 `create_portal` → 逐个调用 `add_to_portal`
3. 非 Portal 路径：保持现有 `create_rem` + `write_rem_fields` 逻辑

### message-router 变更

1. 新增 `create_portal`、`add_to_portal`、`remove_from_portal` 三个 case
2. 路由到对应的 service 函数

---

## 七、典型工作流

### 工作流 1：在文档中创建 Portal

```bash
# 1. 查看文档结构
read-tree doc001 --depth 2

# 2. 在某个位置插入 Portal
edit-tree doc001 \
  --old-str '  监督学习 <!--rem002-->' \
  --new-str '  监督学习 <!--rem002-->\n  <!--portal refs:rem008,rem009-->'
```

### 工作流 2：修改 Portal 的引用列表

```bash
# 1. 读取 Portal 详情（得到简化 JSON）
read-rem portalId001

# 输出：
# {
#   "id": "portalId001",
#   "type": "portal",
#   "portalType": "portal",
#   "portalDirectlyIncludedRem": ["rem008", "rem009"],
#   ...
# }

# 2. 添加一个引用
edit-rem portalId001 \
  --old-str '"portalDirectlyIncludedRem": ["rem008", "rem009"]' \
  --new-str '"portalDirectlyIncludedRem": ["rem008", "rem009", "rem010"]'
```

### 工作流 3：删除 Portal

```bash
# 1. 查看文档结构
read-tree doc001 --depth 2

# 2. 删除 Portal 行
edit-tree doc001 \
  --old-str '  <!--portalId001 type:portal refs:rem008,rem009-->\n' \
  --new-str ''
```

---

## 八、设计决策记录

### 为什么 Portal 用简化格式而不是统一格式？

- Portal 的 51 字段中 44 个都是空值/默认值，输出这些字段纯粹浪费 token
- AI 需要编辑 `portalDirectlyIncludedRem`，在 34 字段的 JSON 中定位和编写 str_replace 更容易出错
- 简化格式让 Portal 的语义一目了然：它就是一个引用列表容器

### 为什么 read-rem 用 SDK 原名 `portalDirectlyIncludedRem`，read-tree 用简名 `refs:`？

- read-rem 是精细编辑模式，与 SDK 概念对齐减少认知负担
- read-tree 是大纲模式，每行空间有限，简名节省 token 且已有实现
- 两种场景的受众和用途不同，命名风格可以不同

### 为什么新增 Portal 行不走 `parsePowerupPrefix()` 而用 `<!--portal ...-->` 语法？

- Portal 没有文本内容，用 `parsePowerupPrefix()` 没有意义——没有 "clean content" 可言
- `<!--portal ...-->` 与已有 Portal 行的元数据标记格式一致（`<!--remId type:portal refs:...-->`），只是没有 remId
- 纯参数行是 Portal 的特例，不影响普通新增行的解析逻辑

### 为什么 `removeFromPortal()` 要实现？（SDK 标注"未测试"）

- 既然开放了 Portal 引用列表的编辑，移除引用是必要的对称操作
- `removeFromPortal()` 是 `addToPortal()` 的逆操作，SDK 提供了此方法
- 实现后需要通过实机测试验证行为
