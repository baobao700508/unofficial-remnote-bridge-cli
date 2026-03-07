# Hierarchy and Navigation — 层级与导航

> RemNote 的树形层级结构和导航相关术语。

---

## Parent（父节点）

共享同一层级中的直接上级 Rem。SDK: `rem.parent` 返回父 Rem ID。CLI: `read-rem` 返回 `parent` 字段。

## Child / Children（子节点）

父 Rem 下的直接子级 Rem，构成有序列表。SDK: `rem.children` 返回子 Rem ID 数组，顺序即 UI 显示顺序。CLI: `read-tree` 显示完整子树。

## Ancestor（祖先节点）

从当前 Rem 到根 Rem 路径上的所有节点。SDK: 无直接 API，需递归获取 `parent`。CLI: `read-tree` 的 `--ancestors` 模式可获取祖先链。

## Descendant（后代节点）

当前 Rem 下所有层级的子孙节点。SDK: 无直接 API，需递归遍历 `children`。CLI: `read-tree` 默认展示所有后代。

## Sibling（兄弟节点）

共享同一 Parent 的 Rem。SDK: `parent` 字段间接判断。CLI: `read-tree` 可见同级。

---

## Hierarchy（层级结构）

| 维度 | 内容 |
|:-----|:-----|
| **用户侧** | RemNote 的核心组织方式——所有 Rem 构成一棵巨大的树。缩进代表层级关系 |
| **SDK 侧** | 通过 `parent` / `children` 字段构建层级；`setParent(parentId, position?)` 移动节点 |
| **CLI 操作** | `read-tree` 以缩进树形展示层级；`edit-tree` 支持在树中增删改 |

---

## Breadcrumb（面包屑 / 祖先链）

| 维度 | 内容 |
|:-----|:-----|
| **用户侧** | 文档顶部显示的路径导航，从根文档到当前 Rem 的完整路径 |
| **SDK 侧** | 无直接 API，需递归 `parent` 构建 |
| **CLI 操作** | `read-tree` 和 `read-context` 输出中包含祖先链信息 |

---

## Zoom（聚焦）

| 维度 | 内容 |
|:-----|:-----|
| **用户侧** | 点击 Rem 的 bullet 或使用 Ctrl+Alt+Z，将该 Rem 作为独立页面查看，隐藏其他同级内容 |
| **SDK 侧** | `plugin.window.setFocusedRem(remId)` 设置聚焦 Rem |
| **CLI 操作** | 暂不支持 |

> 深入参考：-> [Help Center: Zooming In to Rems](../RemNote%20Help%20Center/zooming-in-to-rems.md)

---

## Position 的两种含义

| API | 含义 | 参数来源 |
|:----|:-----|:---------|
| `positionAmongstSiblings()` | 在**所有**兄弟中的位置（0 起始） | 无参数 |
| `positionAmongstVisibleSiblings(portalId?)` | 在**可见**兄弟中的位置（折叠状态影响） | 需要 Portal 上下文 |
| `setParent(parentId, position?)` | 移动到新父级的指定位置 | position 可选 |

`positionAmongstSiblings` 是静态数据（不依赖视图），`positionAmongstVisibleSiblings` 依赖 Portal 折叠状态。

---

## Pane / Split Screen（窗格 / 分屏）

| 维度 | 内容 |
|:-----|:-----|
| **用户侧** | 将编辑区分为左右两个窗格，同时查看两个文档 |
| **SDK 侧** | `plugin.window` 命名空间 |
| **CLI 操作** | 暂不支持 |

> 深入参考：-> [Help Center: Using Multiple Panes](../RemNote%20Help%20Center/using-multiple-panes-split-screen.md)

---

## Tab（标签页）

| 维度 | 内容 |
|:-----|:-----|
| **用户侧** | 类似浏览器标签页，每个标签页打开一个文档 |
| **SDK 侧** | `plugin.window` 命名空间 |
| **CLI 操作** | 暂不支持 |

> 深入参考：-> [Help Center: Tabs](../RemNote%20Help%20Center/tabs.md)

---

## Omnibar（全能搜索栏）

| 维度 | 内容 |
|:-----|:-----|
| **用户侧** | Ctrl+P 或点击顶部搜索栏，可快速搜索 Rem、打开文档、执行命令 |
| **SDK 侧** | 不直接暴露 |
| **CLI 操作** | `search` 命令提供类似功能 |

> 深入参考：-> [Help Center: Using the Omnibar](../RemNote%20Help%20Center/using-the-omnibar.md)

---

## /-menu（斜杠菜单）

用户侧：在编辑区输入 `/` 弹出的命令菜单，可插入各种元素和格式。SDK: 插件可通过 `plugin.app.registerCommand()` 注册自定义斜杠命令。

---

## Zen Mode（禅模式）

用户侧：隐藏侧边栏和其他 UI 元素，只保留编辑区，减少干扰。SDK: 不直接暴露。

> 深入参考：-> [Help Center: Zen Mode](../RemNote%20Help%20Center/zen-mode.md)

---

## Daily Document（每日文档）

| 维度 | 内容 |
|:-----|:-----|
| **用户侧** | 以日期命名的自动创建文档，用于日记和每日笔记 |
| **SDK 侧** | `plugin.date` 命名空间；可通过日期获取对应的 Daily Doc Rem |
| **CLI 操作** | 暂不支持 |

> 深入参考：-> [Help Center: Daily Documents](../RemNote%20Help%20Center/daily-documents.md)

---

## Stub（桩节点）

| 维度 | 内容 |
|:-----|:-----|
| **用户侧** | 被引用但尚未有实际内容的 Rem，显示为灰色 |
| **SDK 侧** | `rem.isStub()` 判断 |
| **CLI 操作** | `read-rem` 可读取 |

> 深入参考：-> [Help Center: Stubs](../RemNote%20Help%20Center/stubs.md)
