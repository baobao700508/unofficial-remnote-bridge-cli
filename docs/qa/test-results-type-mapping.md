# Rem 类型映射探测 — 测试结果

> 执行日期: 2026-03-05
> 方法: 浏览器模拟输入 + CLI read-rem 回读对比
> 环境: RemNote Web + remnote-plugin dev server + remnote-cli daemon

---

## 总结：类型映射表

| 分隔符 | type | text | backText | practiceDirection | 特殊行为 |
|:--|:--|:--|:--|:--|:--|
| （无） | `default` | 全部内容 | `null` | `forward` | 无闪卡行为 |
| `::` | **`concept`** | 前半部分 | 后半部分 | **`both`** | 双向闪卡（↔） |
| `;;` | **`descriptor`** | 前半部分 | 后半部分 | `forward` | 单向闪卡（→） |
| `>>` | `default` | 前半部分 | 后半部分 | `forward` | 只改 backText，不改 type |
| `<<` | `default` | 前半部分 | 后半部分 | **`backward`** | 反向闪卡（←） |
| `<>` | `default` | 前半部分 | 后半部分 | **`both`** | 双向闪卡但 type 不变 |
| `>>>` | `default` | 仅问题部分 | **`null`** | `forward` | 答案在子 Rem（isCardItem=true） |
| `::>` | **`concept`** | 仅问题部分 | **`null`** | **`both`** | concept + 多行答案（子 Rem isCardItem=true） |
| `;;>` | **`descriptor`** | 仅问题部分 | **`null`** | `forward` | descriptor + 多行答案（子 Rem isCardItem=true） |
| `{{}}` | `default` | 包含 cloze 对象 | `null` | `forward` | text 中嵌入 `{cId, i:"m", text}` |

---

## 关键结论

### 1. 只有四个分隔符改变 type

- `::` → `concept`
- `;;` → `descriptor`
- `::>` → `concept`（多行变体）
- `;;>` → `descriptor`（多行变体）
- 其余所有分隔符（`>>`、`<<`、`<>`、`>>>`、`{{}}`）保持 `default`

### 2. practiceDirection 是区分方向的关键

| practiceDirection | 对应分隔符 |
|:--|:--|
| `forward` | `;;`、`>>`、`>>>`、`{{}}`、（无分隔符） |
| `backward` | `<<` |
| `both` | `::`、`<>` |

### 3. backText 的三种模式

- **有 backText**：`::`、`;;`、`>>`、`<<`、`<>` — 分隔符将文本拆分为 text + backText
- **无 backText（答案在子 Rem）**：`>>>` — backText 为 null，答案存储在子 Rem 中
- **无 backText（cloze 内嵌）**：`{{}}` — backText 为 null，填空信息直接嵌入 text 数组

### 4. Multi-line 系列（`>>>`、`::>`、`;;>`）的特殊结构

三种多行分隔符共享相同的子 Rem 结构，区别仅在父 Rem 的 type 和 practiceDirection：

| 分隔符 | 父 type | 父 practiceDirection |
|:--|:--|:--|
| `>>>` | `default` | `forward` |
| `::>` | `concept` | `both` |
| `;;>` | `descriptor` | `forward` |

```
父 Rem:
  type: default / concept / descriptor
  text: ["问题部分"]
  backText: null          ← 多行模式 backText 始终为 null
  children: [child1, child2, ...]

子 Rem (每个答案行):
  type: default
  text: ["答案内容"]
  isCardItem: true    ← 这是关键标记
  backText: null
```

### 5. Cloze (`{{}}`) 的 RichText 结构

text 数组中，普通文本和 cloze 对象交替出现：

```json
[
  "光合作用将",
  {"cId": "5506641149349538", "i": "m", "text": "光能"},
  "转化为",
  {"cId": "685871812182677", "i": "m", "text": "化学能"},
  " "
]
```

- `cId`：cloze 唯一 ID（字符串化的数字）
- `i`：`"m"` 表示这是一个 cloze marker
- `text`：被遮盖的文本内容

---

## read-tree 序列化规则（推导）

根据以上结论，从 Rem Object 反向还原分隔符的规则：

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

---

## 各 Case 详细数据

### Case 1: 普通文本

**输入**: `这是一个普通行`

**UI 观察**: 普通文本显示，无闪卡标记

**Rem Object 变化**:
| 字段 | Before | After |
|:--|:--|:--|
| type | default | default |
| text | ["test-1-plain"] | ["这是一个普通行"] |
| backText | null | null |
| children | [] | [] |
| isCardItem | false | false |
| practiceDirection | forward | forward |

**结论**: 普通文本仅改变 text 内容，其余不变

### Case 2: Concept — `::`

**输入**: `线性回归 :: 最基本的回归模型`

**UI 观察**: 显示为 `线性回归 ↔ 最基本的回归模型`（双向箭头）

**Rem Object 变化**:
| 字段 | Before | After |
|:--|:--|:--|
| type | default | **concept** |
| text | ["test-2-concept"] | ["线性回归"] |
| backText | null | **["最基本的回归模型"]** |
| children | [] | [] |
| isCardItem | false | false |
| practiceDirection | forward | **both** |

**结论**: `::` 改变 type 为 concept，拆分 text/backText，设置 practiceDirection 为 both

### Case 3: Descriptor — `;;`

**输入**: `细胞核 ;; 控制细胞活动的中心`

**UI 观察**: 显示为 `细胞核 → 控制细胞活动的中心`（单向箭头）

**Rem Object 变化**:
| 字段 | Before | After |
|:--|:--|:--|
| type | default | **descriptor** |
| text | ["test-3-descriptor"] | ["细胞核"] |
| backText | null | **["控制细胞活动的中心"]** |
| children | [] | [] |
| isCardItem | false | false |
| practiceDirection | forward | forward |

**结论**: `;;` 改变 type 为 descriptor，拆分 text/backText，practiceDirection 保持 forward

### Case 4: Forward — `>>`

**输入**: `什么是过拟合？ >> 模型在训练数据上表现好但泛化能力差`

**UI 观察**: 显示为 `什么是过拟合？ → 模型在训练数据上表现好但泛化能力差`

**Rem Object 变化**:
| 字段 | Before | After |
|:--|:--|:--|
| type | default | default |
| text | ["test-4-forward"] | ["什么是过拟合？"] |
| backText | null | **["模型在训练数据上表现好但泛化能力差"]** |
| practiceDirection | forward | forward |

**结论**: `>>` 不改变 type，只拆分 text/backText，practiceDirection=forward

### Case 5: Backward — `<<`

**输入**: `模型泛化能力差 << 什么是过拟合？`

**UI 观察**: 显示为 `模型泛化能力差 ← 什么是过拟合？`（反向箭头）

**Rem Object 变化**:
| 字段 | Before | After |
|:--|:--|:--|
| type | default | default |
| text | ["test-5-backward"] | ["模型泛化能力差"] |
| backText | null | **["什么是过拟合？"]** |
| practiceDirection | forward | **backward** |

**结论**: `<<` 不改变 type，拆分 text/backText，practiceDirection 变为 backward

### Case 6: Bidirectional — `<>`

**输入**: `DNA <> 脱氧核糖核酸`

**UI 观察**: 显示为 `DNA ↔ 脱氧核糖核酸`（双向箭头）

**Rem Object 变化**:
| 字段 | Before | After |
|:--|:--|:--|
| type | default | default |
| text | ["test-6-bidirectional"] | ["DNA"] |
| backText | null | **["脱氧核糖核酸"]** |
| practiceDirection | forward | **both** |

**结论**: `<>` 不改变 type，拆分 text/backText，practiceDirection 变为 both

### Case 7: Multi-line — `>>>`

**输入**: `什么是机器学习？ >>>` + 子行 `答案行一`、`答案行二`

**UI 观察**: 显示为 `什么是机器学习？ ↓` + 缩进的答案区域

**父 Rem Object 变化**:
| 字段 | Before | After |
|:--|:--|:--|
| type | default | default |
| text | ["test-7-multiline"] | ["什么是机器学习？"] |
| backText | null | null |
| children | [] | ["t5cIigaDHpMEberqc", "Wn79Y52ojBhhlYpGg"] |
| practiceDirection | forward | forward |

**子 Rem（答案行一）**:
| 字段 | 值 |
|:--|:--|
| text | ["答案行一"] |
| isCardItem | **true** |
| backText | null |

**子 Rem（答案行二）**:
| 字段 | 值 |
|:--|:--|
| text | ["答案行二"] |
| isCardItem | **true** |
| backText | null |

**结论**: `>>>` 不设置 backText，答案存储在 isCardItem=true 的子 Rem 中

### Case 8: Cloze — `{{}}`

**输入**: `光合作用将{{光能}}转化为{{化学能}}`

**UI 观察**: `光能` 和 `化学能` 显示为蓝色填空高亮区域

**Rem Object 变化**:
| 字段 | Before | After |
|:--|:--|:--|
| type | default | default |
| text | ["test-8-cloze"] | ["光合作用将", {cloze:"光能"}, "转化为", {cloze:"化学能"}, " "] |
| backText | null | null |
| practiceDirection | forward | forward |

**Cloze 对象结构**: `{"cId": "5506641149349538", "i": "m", "text": "光能"}`

**结论**: `{{}}` 在 text RichText 数组中嵌入 cloze 对象，不使用 backText

### Case 9: Concept Multi-line — `::>`

**输入**: `什么是深度学习？ ::>` + 子行 `使用多层神经网络`

**UI 观察**: 显示为 **什么是深度学习？** ↕（粗体 + 双向箭头）+ 缩进的答案区域

**父 Rem Object 变化**:
| 字段 | Before | After |
|:--|:--|:--|
| type | default | **concept** |
| text | ["test-9-concept-multiline"] | ["什么是深度学习？"] |
| backText | null | null |
| children | [] | ["en1L5gGKz4lWKbqwJ"] |
| practiceDirection | forward | **both** |

**子 Rem**:
| 字段 | 值 |
|:--|:--|
| text | ["使用多层神经网络"] |
| isCardItem | **true** |
| type | default |

**结论**: `::>` = concept 的 type/both + 多行答案结构。backText 为 null，答案在子 Rem 中

### Case 10: Descriptor Multi-line — `;;>`

**输入**: `列举光合作用的产物 ;;>` + 子行 `氧气和葡萄糖`

**UI 观察**: 显示为 **列举光合作用的产物** ↓（粗体 + 下向箭头）+ 缩进的答案区域

**父 Rem Object 变化**:
| 字段 | Before | After |
|:--|:--|:--|
| type | default | **descriptor** |
| text | ["test-10-descriptor-multiline"] | ["列举光合作用的产物"] |
| backText | null | null |
| children | [] | ["gNIbzYBmHfTemkQCS"] |
| practiceDirection | forward | forward |

**子 Rem**:
| 字段 | 值 |
|:--|:--|
| text | ["氧气和葡萄糖"] |
| isCardItem | **true** |
| type | default |

**结论**: `;;>` = descriptor 的 type/forward + 多行答案结构。backText 为 null，答案在子 Rem 中
