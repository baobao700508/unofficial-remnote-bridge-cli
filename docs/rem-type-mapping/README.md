# Rem 类型与分隔符映射完整参考

> 基于 RemNote Plugin SDK，通过浏览器模拟输入 + CLI `read-rem` 回读实测验证。
> 最后验证时间：2026-03-05
> 环境：RemNote Web + remnote-plugin dev server + remnote-cli daemon
>
> **验证状态说明：**
> - ✅ 实测验证 — 通过浏览器输入分隔符，再用 CLI `read-rem --full` 回读 Rem Object 对比
> - 📖 来自 SDK 类型定义 — 从官方文档推导，未经实际输入测试

---

## 1. 总览：分隔符 → Rem Object 映射表

RemNote 中用户输入的分隔符决定了 Rem Object 的 `type`、`backText`、`practiceDirection` 等字段。
以下是 10 种分隔符的完整映射：

| 分隔符 | type | text | backText | practiceDirection | 特殊行为 | 验证 |
|:--|:--|:--|:--|:--|:--|:--|
| （无） | `default` | 全部内容 | `null` | `forward` | 无闪卡行为 | ✅ |
| `::` | **`concept`** | 前半部分 | 后半部分 | **`both`** | 双向闪卡（↔） | ✅ |
| `;;` | **`descriptor`** | 前半部分 | 后半部分 | `forward` | 单向闪卡（→） | ✅ |
| `>>` | `default` | 前半部分 | 后半部分 | `forward` | 只改 backText，不改 type | ✅ |
| `<<` | `default` | 前半部分 | 后半部分 | **`backward`** | 反向闪卡（←） | ✅ |
| `<>` | `default` | 前半部分 | 后半部分 | **`both`** | 双向闪卡但 type 不变 | ✅ |
| `>>>` | `default` | 仅问题部分 | **`null`** | `forward` | 答案在子 Rem（isCardItem=true） | ✅ |
| `::>` | **`concept`** | 仅问题部分 | **`null`** | **`both`** | concept + 多行答案（子 Rem isCardItem=true） | ✅ |
| `;;>` | **`descriptor`** | 仅问题部分 | **`null`** | `forward` | descriptor + 多行答案（子 Rem isCardItem=true） | ✅ |
| `{{}}` | `default` | 包含 cloze 对象 | `null` | `forward` | text 中嵌入 `{cId, i:"m", text}` | ✅ |

---

## 2. 关键维度分析

### 2.1 只有两个分隔符改变 type ✅ 实测验证

绝大多数分隔符保持 `type = "default"`，只有 `::` 和 `;;`（及其多行变体）会改变 type：

| type | 对应分隔符 |
|:--|:--|
| `default` | （无）、`>>`、`<<`、`<>`、`>>>`、`{{}}` |
| `concept` | `::`、`::>` |
| `descriptor` | `;;`、`;;>` |

### 2.2 practiceDirection 是区分方向的关键 ✅ 实测验证

| practiceDirection | 含义 | 对应分隔符 |
|:--|:--|:--|
| `forward` | 正向（→）：看 text 回忆 backText | `;;`、`>>`、`>>>`、`;;>`、`{{}}`、（无） |
| `backward` | 反向（←）：看 backText 回忆 text | `<<` |
| `both` | 双向（↔）：正反两个方向都练习 | `::`、`<>`、`::>` |

### 2.3 backText 的三种模式 ✅ 实测验证

| 模式 | backText | 答案位置 | 对应分隔符 |
|:--|:--|:--|:--|
| **有 backText** | `[...RichText]` | 分隔符后半部分 | `::`、`;;`、`>>`、`<<`、`<>` |
| **无 backText（子 Rem）** | `null` | 子 Rem（isCardItem=true） | `>>>`、`::>`、`;;>` |
| **无 backText（cloze）** | `null` | text 内嵌 cloze 对象 | `{{}}` |

---

## 3. 单行分隔符详解

### 3.1 Concept — `::` ✅ 实测验证

将 Rem 标记为**概念（concept）**类型，分隔符前后拆分为 text 和 backText，双向练习。

```jsonc
// 输入：线性回归 :: 最基本的回归模型
// Rem Object 变化：
{
  "type": "concept",           // ← 从 default 变为 concept
  "text": ["线性回归"],
  "backText": ["最基本的回归模型"],  // ← 分隔符后的内容
  "practiceDirection": "both"  // ← 双向
}
```

UI 显示：`线性回归 ↔ 最基本的回归模型`（双向箭头）

### 3.2 Descriptor — `;;` ✅ 实测验证

将 Rem 标记为**描述符（descriptor）**类型，分隔符前后拆分，单向练习。

```jsonc
// 输入：细胞核 ;; 控制细胞活动的中心
{
  "type": "descriptor",        // ← 从 default 变为 descriptor
  "text": ["细胞核"],
  "backText": ["控制细胞活动的中心"],
  "practiceDirection": "forward"  // ← 保持 forward
}
```

UI 显示：`细胞核 → 控制细胞活动的中心`（单向箭头）

### 3.3 Forward — `>>` ✅ 实测验证

不改变 type（保持 `default`），只拆分 text/backText，正向练习。

```jsonc
// 输入：什么是过拟合？ >> 模型在训练数据上表现好但泛化能力差
{
  "type": "default",           // ← 不变
  "text": ["什么是过拟合？"],
  "backText": ["模型在训练数据上表现好但泛化能力差"],
  "practiceDirection": "forward"
}
```

### 3.4 Backward — `<<` ✅ 实测验证

不改变 type，拆分 text/backText，**反向**练习。

```jsonc
// 输入：模型泛化能力差 << 什么是过拟合？
{
  "type": "default",
  "text": ["模型泛化能力差"],
  "backText": ["什么是过拟合？"],
  "practiceDirection": "backward"  // ← 反向
}
```

UI 显示：`模型泛化能力差 ← 什么是过拟合？`（反向箭头）

### 3.5 Bidirectional — `<>` ✅ 实测验证

不改变 type，拆分 text/backText，双向练习。与 `::` 的区别在于 `<>` 不改变 type。

```jsonc
// 输入：DNA <> 脱氧核糖核酸
{
  "type": "default",           // ← 不变（区别于 :: 的 concept）
  "text": ["DNA"],
  "backText": ["脱氧核糖核酸"],
  "practiceDirection": "both"  // ← 双向
}
```

UI 显示：`DNA ↔ 脱氧核糖核酸`（双向箭头）

---

## 4. 多行分隔符详解 ✅ 实测验证

三种多行分隔符（`>>>`、`::>`、`;;>`）共享相同的子 Rem 结构，区别仅在父 Rem 的 `type` 和 `practiceDirection`。

### 4.1 共同结构

```jsonc
// 父 Rem
{
  "type": "default | concept | descriptor",  // 取决于分隔符类型
  "text": ["问题部分"],
  "backText": null,          // ← 多行模式 backText 始终为 null
  "children": ["childId1", "childId2", ...],
  "practiceDirection": "forward | both"
}

// 子 Rem（每个答案行）
{
  "type": "default",
  "text": ["答案内容"],
  "isCardItem": true,        // ← 标记为答案行的关键字段
  "backText": null
}
```

### 4.2 三种多行分隔符对比

| 分隔符 | 父 type | 父 practiceDirection | 使用场景 |
|:--|:--|:--|:--|
| `>>>` | `default` | `forward` | 普通多行问答 |
| `::>` | `concept` | `both` | 概念型多行问答 |
| `;;>` | `descriptor` | `forward` | 描述型多行问答 |

### 4.3 `>>>` — 普通多行 ✅ 实测验证

```jsonc
// 输入：什么是机器学习？ >>>
//   → 答案行一
//   → 答案行二

// 父 Rem
{
  "type": "default",
  "text": ["什么是机器学习？"],
  "backText": null,
  "children": ["childId1", "childId2"],
  "practiceDirection": "forward"
}

// 子 Rem（答案行一）
{"text": ["答案行一"], "isCardItem": true, "type": "default"}

// 子 Rem（答案行二）
{"text": ["答案行二"], "isCardItem": true, "type": "default"}
```

### 4.4 `::>` — 概念型多行 ✅ 实测验证

```jsonc
// 输入：什么是深度学习？ ::>
//   → 使用多层神经网络

// 父 Rem
{
  "type": "concept",           // ← concept
  "text": ["什么是深度学习？"],
  "backText": null,
  "children": ["childId1"],
  "practiceDirection": "both"  // ← 双向
}

// 子 Rem
{"text": ["使用多层神经网络"], "isCardItem": true, "type": "default"}
```

### 4.5 `;;>` — 描述型多行 ✅ 实测验证

```jsonc
// 输入：列举光合作用的产物 ;;>
//   → 氧气和葡萄糖

// 父 Rem
{
  "type": "descriptor",       // ← descriptor
  "text": ["列举光合作用的产物"],
  "backText": null,
  "children": ["childId1"],
  "practiceDirection": "forward"  // ← 正向
}

// 子 Rem
{"text": ["氧气和葡萄糖"], "isCardItem": true, "type": "default"}
```

---

## 5. Cloze（完形填空）`{{}}` ✅ 实测验证

Cloze 不使用 backText，而是在 text RichText 数组中嵌入 cloze 对象。

```jsonc
// 输入：光合作用将{{光能}}转化为{{化学能}}

// Rem Object
{
  "type": "default",
  "text": [
    "光合作用将",
    {"cId": "5506641149349538", "i": "m", "text": "光能"},
    "转化为",
    {"cId": "685871812182677", "i": "m", "text": "化学能"},
    " "
  ],
  "backText": null,
  "practiceDirection": "forward"
}
```

### 5.1 Cloze 对象结构

```jsonc
{
  "cId": "5506641149349538",  // cloze 唯一 ID（字符串化的数字）
  "i": "m",                   // 元素类型标识（与 RichText 格式一致）
  "text": "光能"              // 被遮盖的文本内容
}
```

- `cId`：每个 cloze 的唯一标识符，由 RemNote 自动生成
- `i: "m"`：表明 cloze 本质上是一个带 `cId` 标记的 RichText 文本元素
- `text`：练习时被遮盖、需要回忆的内容

> **与 RichText 格式的关系：** Cloze 对象就是 RichText 中 `i: "m"` 元素附加了 `cId` 字段。
> 详见 [richtext-format/README.md](../richtext-format/README.md) 第 3.1 节的 `cId` 字段说明。

---

## 6. 反向序列化规则（Rem Object → 分隔符）

从 Rem Object 可以**唯一确定**原始分隔符类型。判断顺序如下：

```
hasMultilineChildren = children 中有 isCardItem == true 的子 Rem

if type == "concept" and hasMultilineChildren:
    → text ::>
    （子 Rem 内容作为多行答案）
elif type == "concept":
    → text :: backText    (practiceDirection 一定是 both)
elif type == "descriptor" and hasMultilineChildren:
    → text ;;>
    （子 Rem 内容作为多行答案）
elif type == "descriptor":
    → text ;; backText    (practiceDirection 一定是 forward)
elif backText != null:
    if practiceDirection == "forward":
        → text >> backText
    elif practiceDirection == "backward":
        → text << backText
    elif practiceDirection == "both":
        → text <> backText
elif hasMultilineChildren:
    → text >>>
    （子 Rem 内容作为多行答案）
elif text 数组中包含 cloze 对象 ({cId, i:"m"}):
    → 拼接 text，cloze 对象还原为 {{text}}
else:
    → 纯文本（无分隔符）
```

### 6.1 判断维度

反向序列化依赖 4 个维度，优先级从高到低：

| 优先级 | 维度 | 区分的分隔符 |
|:--|:--|:--|
| 1 | `type`（concept / descriptor / default） | `::` vs `;;` vs 其他 |
| 2 | `hasMultilineChildren`（子 Rem 有 isCardItem） | `::>` / `;;>` / `>>>` vs 单行 |
| 3 | `backText` 是否为 null | 单行有 backText vs cloze / 纯文本 |
| 4 | `practiceDirection`（forward / backward / both） | `>>` vs `<<` vs `<>` |

---

## 7. 分隔符功能对比矩阵

### 7.1 按功能分类

| 功能 | 分隔符 | type 变化 | 方向 |
|:--|:--|:--|:--|
| **概念定义** | `::` | → concept | 双向 |
| **属性描述** | `;;` | → descriptor | 正向 |
| **简单问答** | `>>` | 不变 | 正向 |
| **反向问答** | `<<` | 不变 | 反向 |
| **双向问答** | `<>` | 不变 | 双向 |
| **多行问答** | `>>>` | 不变 | 正向 |
| **概念型多行** | `::>` | → concept | 双向 |
| **描述型多行** | `;;>` | → descriptor | 正向 |
| **完形填空** | `{{}}` | 不变 | 正向 |

### 7.2 `::` vs `<>` 的区别

两者都是双向（`practiceDirection: "both"`），但：

- `::` 将 type 改为 `concept`，Rem 名称变为粗体，在知识图谱中有语义
- `<>` 保持 type 为 `default`，只是一个双向闪卡，无语义标记

### 7.3 `;;` vs `>>` 的区别

两者都是正向（`practiceDirection: "forward"`），但：

- `;;` 将 type 改为 `descriptor`，表示该 Rem 是父 Rem 的属性描述
- `>>` 保持 type 为 `default`，只是一个简单的正向闪卡

---

## 8. 与其他文档的关系

| 文档 | 关联 |
|:--|:--|
| [richtext-format/README.md](../richtext-format/README.md) | Cloze 对象（`{cId, i:"m", text}`）是 RichText 格式的一部分 |
| [qa/test-results-type-mapping.md](../qa/test-results-type-mapping.md) | 本文档的原始测试数据（10 个 Case 的 before/after 完整对比） |
| [qa/test-plan-type-mapping.md](../qa/test-plan-type-mapping.md) | 测试计划和方法论说明 |

---

## 9. 信息来源

| 来源 | 贡献内容 |
|:--|:--|
| **浏览器模拟输入 + CLI read-rem 回读** | 所有 10 种分隔符的 Rem Object 字段变化实测数据 |
| RemNote Plugin SDK 文档 | `SetRemType` 枚举（concept / descriptor）、`practiceDirection` 字段定义 |
| RichText 格式文档 | Cloze 对象结构（`cId`、`i:"m"` 标识） |
