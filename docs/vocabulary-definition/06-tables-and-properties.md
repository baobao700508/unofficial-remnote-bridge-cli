# Tables and Properties — 表格与属性

> RemNote 的表格系统和属性（Property）机制相关术语。

---

## Simple Table（简单表格）

| 维度 | 内容 |
|:-----|:-----|
| **用户侧** | 通过 `/table` 命令创建的独立网格表格，类似 Excel 的行列结构 |
| **SDK 侧** | 特殊的 Rem 结构，行和列由子 Rem 组成 |
| **CLI 操作** | `read-tree` 可见表格结构 |

> 深入参考：-> [Help Center: Simple Tables](../RemNote%20Help%20Center/simple-tables.md)

---

## Advanced Table（高级表格）

| 维度 | 内容 |
|:-----|:-----|
| **用户侧** | 基于 Tag + Property 驱动的结构化表格。每行是一个被 Tag 标记的 Rem，每列是 Tag 的 Property |
| **SDK 侧** | 底层是标准的 Tag + Property 继承机制——Tag 定义列（Property），被标记的 Rem 构成行 |
| **CLI 操作** | `read-tree` 可见完整的 Tag-Property 结构 |
| **注意** | Advanced Table 不是独立的数据结构，而是 Tag + Property 继承机制的表格化展示 |

> 深入参考：-> [Help Center: Advanced Tables](../RemNote%20Help%20Center/advanced-tables.md)

---

## Property（属性）

| 维度 | 内容 |
|:-----|:-----|
| **用户侧** | Tag 的结构化数据字段，在 Advanced Table 中表现为表格的列 |
| **SDK 侧** | `isProperty=true` 的子 Rem；`rem.setIsProperty(true)` 设置；`rem.getTagPropertyValue(propertyId)` 读取值 |
| **CLI 操作** | `read-tree` 可见 Property 子 Rem |
| **注意** | Property 是通过 Tag 继承**复制**到目标 Rem 下的，不是引用。每个被标记的 Rem 拥有独立的 Property 副本 |

---

## PropertyType（属性类型）

Tag 的 Property 可以指定数据类型，限制用户输入：

| PropertyType 值 | 含义 |
|:----------------|:-----|
| `text` | 文本 |
| `number` | 数字 |
| `checkbox` | 复选框 |
| `single_select` | 单选 |
| `multi_select` | 多选 |
| `date` | 日期 |
| `image` | 图片 |
| `created_at` | 创建时间（系统自动填充） |
| `url` | URL |

SDK: `PropertyType` 枚举。注意使用**小写下划线**命名风格（如 `single_select`），与 SDK 其他枚举的 UPPER_SNAKE 风格不同。

---

## Template（模板）

| 维度 | 内容 |
|:-----|:-----|
| **用户侧** | 文档级模板，可用于批量创建具有相同结构的文档（如会议记录模板、日记模板） |
| **SDK 侧** | `BuiltInPowerupCodes.Template` Powerup |
| **CLI 操作** | 暂不支持 |

---

## Property vs Template

**结论：完全不同的概念，不要混淆。**

| 术语 | 粒度 | 含义 | 示例 |
|:-----|:-----|:-----|:-----|
| **Property** | Rem 级别 | Tag 下标记为 `isProperty=true` 的子 Rem，定义一个数据字段 | "高亮"Tag 的 `[Color]` Property |
| **Template** | 文档级别 | 一种内置 Powerup（`BuiltInPowerupCodes.Template`），整个文档作为模板 | 会议记录模板、日记模板 |

- Property 是结构化数据字段（键值对），参与 Powerup 渲染和表格系统
- Template 是内容模板（整个文档结构），用于批量创建相似文档
- Powerup 渲染机制只涉及 **Tag + Property**，不涉及 Template
