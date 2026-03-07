# Linking and References — 链接与引用

> RemNote 中连接知识的各种机制：引用、Tag、Powerup、Portal 等。

---

## Rem Reference（Rem 引用）

| 维度 | 内容 |
|:-----|:-----|
| **用户侧** | 在编辑区输入 `[[` 搜索并插入对另一个 Rem 的引用，形成双向链接 |
| **SDK 侧** | RichText 中的 `{ _id: "remId", i: "q" }` 元素；`rem.remsReferencingThis()` 获取所有引用了本 Rem 的 Rem |
| **CLI 操作** | `read-rem` / `read-tree` 中引用显示为 `[[引用文本]]`；`search` 可搜索被引用的 Rem |
| **注意** | 引用是双向的——被引用的 Rem 可以通过 Backlink 看到谁引用了它 |

> 深入参考：-> [Help Center: Rem References](../RemNote%20Help%20Center/rem-references.md)

---

## Tag（标签）

| 维度 | 内容 |
|:-----|:-----|
| **用户侧** | 在编辑区输入 `##` 添加标签，用于分类和组织 Rem |
| **SDK 侧** | `rem.tags` 数组返回所有 Tag 的 Rem ID；`rem.addTag(tagRemId)` / `rem.removeTag(tagRemId)` 增删 |
| **CLI 操作** | `read-rem --full` 可见 `tags` 数组 |
| **注意** | Tag 本身也是一个 Rem——任何 Rem 都可以作为 Tag 标记其他 Rem |

> 深入参考：-> [Help Center: Tags](../RemNote%20Help%20Center/tags.md)

---

## Powerup vs Tag

**结论：Powerup 是一种特殊的 Tag，但不是所有 Tag 都是 Powerup。**

| 术语 | 含义 |
|:-----|:-----|
| **Tag** | 可以标记到 Rem 上的任意 Rem（通过 `addTag(remId)` 或 UI 中 `##` 输入） |
| **Powerup** | 带有特殊行为的系统 Tag（`isPowerup()=true`），影响 Rem 的渲染和功能 |

### 关系 ✅

- 每个 Powerup 都是一个 `isPowerup=true` 的 Rem，存在于知识库中
- 用户创建的普通 Tag（如"重要"、"待复习"）的 `isPowerup=false`
- `tags` 数组会混合返回两者，无法从数据结构区分，需逐个检查 `isPowerup`
- SDK 的 `setIsCode(true)` 等方法本质是 `addTag(对应PowerupTag的ID)`

### 内置 Powerup 列表（实测） ✅

| 显示名称 | Powerup Code | 对应 SDK 快捷方法 |
|:---------|:-------------|:-----------------|
| 标题 | Header (`r`) | `setFontSize()` |
| 高亮 | Highlight (`h`) | `setHighlightColor()` |
| 代码 | Code (`cd`) | `setIsCode()` |
| 引用 | Quote (`qt`) | `setIsQuote()` |
| 列表项 | List (`i`) | `setIsListItem()` |
| 待办 | Todo (`t`) | `setIsTodo()` |
| 卡片条目 | MultiLineCard (`w`) | `setIsCardItem()` |
| 文档 | Document (`o`) | `setIsDocument()` |
| 模板插槽 | Slot (`y`) | `setIsSlot()` / `setIsProperty()` |
| 稍后编辑 | EditLater (`e`) | — |
| 分割线 | Divider (`dv`) | — |

> 注意：Powerup Tag ID 是知识库级别的，不同用户的知识库中同一 Powerup 的 ID 不同。

---

## Portal（传送门）

| 维度 | 内容 |
|:-----|:-----|
| **用户侧** | 输入 `((` 创建的嵌入引用，显示被引用 Rem 的实时内容（编辑会同步） |
| **SDK 侧** | `type: "portal"` 的 Rem；`rem.createPortal()` 创建；Portal 的 `children` 包含被引用的 Rem |
| **CLI 操作** | `read-tree` 可见 Portal 节点（标记为 portal 类型） |
| **注意** | Portal 内容是**实时同步**的，不是复制——在 Portal 中编辑等同于编辑源 Rem |

> 深入参考：-> [Help Center: Portals](../RemNote%20Help%20Center/portals.md)

---

## Search Portal（搜索传送门）

| 维度 | 内容 |
|:-----|:-----|
| **用户侧** | 基于查询条件动态显示匹配 Rem 的 Portal，结果会随知识库变化自动更新 |
| **SDK 侧** | `SearchNamespace` 相关 API；Query 表达式通过 `QueryExpressionType` 等枚举定义 |
| **CLI 操作** | 暂不支持 |

> 深入参考：-> [Help Center: Search Portals](../RemNote%20Help%20Center/search-portals.md)

---

## Backlink（反向链接）

| 维度 | 内容 |
|:-----|:-----|
| **用户侧** | 文档底部显示的"被引用"列表，展示所有引用了当前 Rem 的其他 Rem |
| **SDK 侧** | `rem.remsReferencingThis()` 获取所有反向链接 |
| **CLI 操作** | 暂不支持直接查询反向链接 |

> 深入参考：-> [Help Center: Backlinks](../RemNote%20Help%20Center/backlinks.md)

---

## Link（外部链接）

| 维度 | 内容 |
|:-----|:-----|
| **用户侧** | 指向外部 URL 的超链接，通过粘贴 URL 或 Markdown 语法创建 |
| **SDK 侧** | RichText 中的 `{ i: "m", text: "显示文本", url: "https://..." }` 元素，通过 `iUrl` 字段标识 |
| **CLI 操作** | `read-rem` / `read-tree` 中显示为 `[文本](URL)` |

> 深入参考：-> [Help Center: Links](../RemNote%20Help%20Center/links.md)

---

## Pin（固定引用）

| 维度 | 内容 |
|:-----|:-----|
| **用户侧** | 将常用 Rem 固定到侧边栏顶部，方便快速访问 |
| **SDK 侧** | `rem.isPinned()`、`rem.setPinned(bool)` |
| **CLI 操作** | 暂不支持 |

> 深入参考：-> [Help Center: Pins](../RemNote%20Help%20Center/pins.md)

---

## Alias（别名）

| 维度 | 内容 |
|:-----|:-----|
| **用户侧** | Rem 的替代名称，搜索和引用时都能匹配到原始 Rem |
| **SDK 侧** | `rem.getAliases()` 获取别名列表；`rem.addAlias(text)` 添加 |
| **CLI 操作** | 暂不支持 |

> 深入参考：-> [Help Center: Aliases](../RemNote%20Help%20Center/aliases.md)

---

## Reference vs Tag vs Portal 辨析

| 机制 | 创建方式 | 本质 | 编辑同步 |
|:-----|:---------|:-----|:---------|
| **Reference** | `[[` | RichText 中的引用元素，指向目标 Rem | 否（只是指针） |
| **Tag** | `##` | 将目标 Rem 作为标签附加到当前 Rem | 否（分类标记） |
| **Portal** | `((` | 嵌入目标 Rem 的实时视图 | 是（编辑同步） |

> 深入参考：-> [Help Center: References vs Tags vs Portals](../RemNote%20Help%20Center/what-s-the-difference-between-references-tags-and-portals.md)
