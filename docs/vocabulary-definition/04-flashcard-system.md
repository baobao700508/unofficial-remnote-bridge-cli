# Flashcard System — 闪卡系统

> RemNote 的闪卡（间隔重复）系统相关术语。
>
> **红线提醒：本项目不操控 Card / Flashcard。** Card 由 RemNote 根据 Rem 属性自动生成，我们只需操作 Rem 层面的属性。

---

## 分隔符体系概览

RemNote 中用户输入的分隔符决定了 Rem 的 `type`、`backText` 等字段，进而决定闪卡行为。

### 分隔符 → 字段映射

| 分隔符 | type | backText | 默认 practiceDirection | 用途 |
|:-------|:-----|:---------|:----------------------|:-----|
| （无） | `default` | `null` | — | 无闪卡行为 |
| `::` | `concept` | 后半部分 | `both` | 概念定义 |
| `;;` | `descriptor` | 后半部分 | `forward` | 描述属性 |
| `>>` | `default` | 后半部分 | `forward` | 正向问答 |
| `<<` | `default` | 后半部分 | `backward` | 反向问答 |
| `<>` | `default` | 后半部分 | `both` | 双向问答 |
| `>>>` | `default` | `null` | `forward` | 多行答案 |
| `::>` | `concept` | `null` | `both` | 概念型多行答案 |
| `;;>` | `descriptor` | `null` | `forward` | 描述型多行答案 |
| `{{}}` | `default` | `null` | `forward` | 完形填空 |

### 分隔符与方向是独立的两个维度

**关键区分：分隔符决定 type，不决定方向。** 上表中的 practiceDirection 仅为创建时的默认值，用户可以事后独立修改方向。

- `::` / `;;` 表达的是 **type**（concept / descriptor），不携带方向信息
- `>>` / `<<` / `<>` 表达的是 **direction**（forward / backward / both），type 固定为 default
- 因此，`::` / `;;` 无法像箭头那样直观表现方向——一个 concept Rem 可能是 forward、backward 或 both
- 同理，多行分隔符（`>>>`、`::>`、`;;>`）也无法体现方向变更

> **输出格式的局限**：当前 read-tree 使用分隔符还原行内容，这意味着如果用户将 concept 的方向改为 forward，输出中仍然显示 `::`，无法区分是默认的 both 还是被改过的 forward。方向信息需要通过元数据标记补充。

> 深入参考：-> [Rem 类型与分隔符映射完整参考](../rem-type-mapping/README.md)

---

## practiceDirection（练习方向）

| 值 | 含义 |
|:---|:-----|
| `forward` | 正向（→）：看 text 回忆 backText |
| `backward` | 反向（←）：看 backText 回忆 text |
| `both` | 双向（↔）：正反两个方向都练习 |

practiceDirection 是 Rem 的**独立属性**，与 type 分开存储。分隔符仅设置默认方向（见上方表格），用户可以事后将任意闪卡的方向改为 forward / backward / both。

SDK: `rem.practiceDirection` 字段。

---

## text / backText（正面 / 背面）

| 字段 | 含义 |
|:-----|:-----|
| `text` | Rem 的正面内容（RichText 数组），始终存在 |
| `backText` | Rem 的背面内容（RichText 数组或 `null`）。有 backText 表示有闪卡问答对 |

多行分隔符（`>>>`、`::>`、`;;>`）的 backText 为 `null`，答案存储在子 Rem 中（`isCardItem=true`）。

---

## isCardItem（多行答案行标记）

| 维度 | 内容 |
|:-----|:-----|
| **用户侧** | 多行闪卡（`>>>`、`::>`、`;;>`）的答案行，以箭头缩进显示 |
| **SDK 侧** | `rem.isCardItem()` 返回 `true`；Powerup Code: `BuiltInPowerupCodes.MultiLineCard` (`w`) |
| **CLI 操作** | `read-tree` 中标记为 `[答案行]` |

---

## Concept / Descriptor — CDF 框架

**Concept-Descriptor Framework（概念-描述符框架）** 是 RemNote 推荐的知识结构化方法：

| 术语 | 含义 | 分隔符 |
|:-----|:-----|:-------|
| **Concept** | 一个需要理解的概念/实体，type=`concept` | `::` 或 `::>` |
| **Descriptor** | 概念的某个属性/描述，type=`descriptor` | `;;` 或 `;;>` |

典型结构：
```
线性回归 :: 最基本的回归模型        ← Concept
  假设 ;; 因变量与自变量呈线性关系   ← Descriptor（线性回归的属性）
  损失函数 ;; 均方误差 (MSE)        ← Descriptor
```

> 深入参考：-> [Help Center: Concept-Descriptor Framework](../RemNote%20Help%20Center/structuring-knowledge-with-the-concept-descriptor-framework.md)

---

## Universal Descriptor（通用描述符）

| 维度 | 内容 |
|:-----|:-----|
| **用户侧** | 以 `~` 前缀创建的描述符，可跨多个 Concept 复用。例如 `~定义` 可用于所有概念 |
| **SDK 侧** | `rem.isUniversalDescriptor()` |
| **CLI 操作** | `read-tree` 可见 |

> 深入参考：-> [Help Center: Universal Descriptors](../RemNote%20Help%20Center/universal-descriptors.md)

---

## Cloze（完形填空）

| 维度 | 内容 |
|:-----|:-----|
| **用户侧** | 用 `{{}}` 包裹文本，练习时该部分被遮盖，需要回忆 |
| **SDK 侧** | RichText 中的 `{ cId: "唯一ID", i: "m", text: "被遮盖文本" }` 元素 |
| **CLI 操作** | `read-tree` 中显示为 `{{被遮盖文本}}` |

> 深入参考：-> [Rem 类型与分隔符映射 - Cloze 章节](../rem-type-mapping/README.md#5-cloze完形填空-实测验证)

---

## Image Occlusion（图片遮挡）

| 维度 | 内容 |
|:-----|:-----|
| **用户侧** | 在图片上划定遮挡区域，练习时需要回忆被遮挡的部分 |
| **SDK 侧** | 特殊 Powerup 机制 |
| **CLI 操作** | 暂不支持 |

> 深入参考：-> [Help Center: Image Occlusion Cards](../RemNote%20Help%20Center/image-occlusion-cards.md)

---

## Extra Card Detail — ECD Power-up

| 维度 | 内容 |
|:-----|:-----|
| **用户侧** | 为闪卡添加额外提示或上下文信息，练习时显示在答案下方 |
| **SDK 侧** | `BuiltInPowerupCodes.ExtraCardDetail` |
| **CLI 操作** | 暂不支持 |

> 深入参考：-> [Help Center: Extra Card Detail](../RemNote%20Help%20Center/extra-card-detail-power-up.md)

---

## SRS 相关术语速查

以下术语来自间隔重复（Spaced Repetition System）领域，RemNote 内部使用但不通过 SDK 直接暴露：

| 术语 | 含义 |
|:-----|:-----|
| **Spaced Repetition** | 间隔重复——根据遗忘曲线安排复习时间的学习方法 |
| **Practice Queue** | 练习队列——当前需要复习的闪卡列表 |
| **Due for Review** | 到期复习——闪卡达到计划复习时间 |
| **Interval** | 间隔——两次复习之间的天数 |
| **Stability** | 稳定性——记忆保持的时间长度（FSRS 参数） |
| **Difficulty** | 难度——卡片的固有学习难度（FSRS 参数） |
| **Retrievability** | 可提取性——当前时刻能回忆起的概率（FSRS 参数） |
| **Desired Retention** | 期望保留率——用户设定的目标记忆保留概率 |
| **Leech** | 水蛭卡——反复遗忘的顽固卡片，需要重新组织内容 |
| **FSRS** | Free Spaced Repetition Scheduler——RemNote 当前使用的间隔重复算法 |
| **Anki SM-2** | SuperMemo 2 算法——Anki 使用的经典间隔重复算法，RemNote 也支持 |

> 深入参考：-> [Help Center: Getting Started with Spaced Repetition](../RemNote%20Help%20Center/getting-started-with-spaced-repetition.md)
> -> [Help Center: Dealing with Leech Cards](../RemNote%20Help%20Center/dealing-with-leech-cards.md)
> -> [Help Center: The Anki SM-2 Algorithm](../RemNote%20Help%20Center/the-anki-sm-2-spaced-repetition-algorithm.md)
