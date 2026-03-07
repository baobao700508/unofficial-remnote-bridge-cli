# Search and Query — 搜索与查询

> RemNote 的搜索功能和查询语言相关术语。

---

## Global Search（全局搜索）

| 维度 | 内容 |
|:-----|:-----|
| **用户侧** | Ctrl+P 打开 Omnibar 后输入关键词搜索整个知识库 |
| **SDK 侧** | `plugin.search.search(query)` 执行全文搜索，返回匹配的 Rem 列表 |
| **CLI 操作** | `search <keyword>` 命令 |

> 深入参考：-> [Help Center: Searching Your Knowledge Base](../RemNote%20Help%20Center/searching-your-knowledge-base.md)

---

## Reference Search（引用搜索）

用户侧：在 `[[` 搜索框中搜索，用于查找要引用的 Rem。与 Global Search 使用同一底层搜索引擎，但搜索结果用于插入引用而非导航。

## Portal Search（Portal 搜索）

用户侧：在 `((` 搜索框中搜索，用于查找要嵌入为 Portal 的 Rem。

## Tag Search（Tag 搜索）

用户侧：在 `##` 搜索框中搜索，用于查找要添加为 Tag 的 Rem。

---

## Hierarchical Search（层级搜索）

| 维度 | 内容 |
|:-----|:-----|
| **用户侧** | 限定在特定文档或文件夹范围内的搜索，缩小搜索范围 |
| **SDK 侧** | 搜索 API 可通过参数限定范围 |
| **CLI 操作** | 暂不支持 |

> 深入参考：-> [Help Center: Hierarchical Search](../RemNote%20Help%20Center/hierarchical-search.md)

---

## Search Portal（搜索传送门）

| 维度 | 内容 |
|:-----|:-----|
| **用户侧** | 基于查询条件动态显示匹配 Rem 的 Portal，结果随知识库变化自动更新 |
| **SDK 侧** | `SearchNamespace` 相关 API；查询条件通过 `QueryExpressionType`、`QueryNodeType` 等枚举定义 |
| **CLI 操作** | 暂不支持 |

> 深入参考：-> [Help Center: Search Portals](../RemNote%20Help%20Center/search-portals.md)

---

## RemNote Query Language（查询语言）

| 维度 | 内容 |
|:-----|:-----|
| **用户侧** | Search Portal 中使用的查询条件语法，支持按 Tag、Property 值、日期等条件筛选 Rem |
| **SDK 侧** | 通过 `SearchPortal*QueryExpression` 系列接口定义查询表达式 |
| **CLI 操作** | 暂不支持 |

支持的查询条件类型：

| 条件类型 | 说明 |
|:---------|:-----|
| Text | 文本匹配 |
| Checkbox | 复选框状态 |
| Number | 数值比较 |
| Date | 日期范围 |
| Single Select | 单选值匹配 |
| Multi Select | 多选值匹配 |
| Rem Type | Rem 类型筛选 |
| Ref | 引用关系 |

> 深入参考：-> [Help Center: Searching with the RemNote Query Language](../RemNote%20Help%20Center/searching-with-the-remnote-query-language.md)

---

## Query Builder（查询构建器）

用户侧：Search Portal 中的图形化界面，通过下拉菜单和表单构建查询条件，无需手写查询语法。SDK: 对应 `SearchPortalGroupQueryNode`、`SearchPortalSlotQueryNode` 等接口。
