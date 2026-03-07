# Rem 类型映射探测 — QA 测试计划

> 日期: 2026-03-04
> 方法: 浏览器模拟输入 + CLI read-rem 回读对比
> 目的: 确定各闪卡分隔符（`::`、`;;`、`>>`等）对 Rem Object 字段的精确影响

---

## 核心方法

**不使用 SDK API 猜测行为**，而是以 RemNote 真实 UI 行为作为事实源：

```
1. 创建空 Rem
2. CLI read-rem 读取 → "before" 快照
3. 浏览器模拟人类输入分隔符文本
4. CLI read-rem 再读 → "after" 快照
5. diff before/after → 精确知道分隔符改了哪些字段
```

---

## 前置条件

- [ ] CLI 守护进程已运行（`remnote-bridge connect`）
- [ ] RemNote 在浏览器中打开
- [ ] Plugin dev server 运行中（`cd remnote-plugin && npm run dev`）
- [ ] 有一个已知的测试文档（如 "mcp 测试"），记下其 Rem ID

---

## 测试用例

### 准备：创建测试 Rem

在 "mcp 测试" 文档下创建若干空的子 Rem（可以手动创建或通过 CLI），记录每个 Rem 的 ID。每个测试用例需要一个独立的空 Rem。

### Case 1: 基线 — 普通文本

| 步骤 | 操作 | 命令/动作 |
|:--|:--|:--|
| 1a | 读取空 Rem | `remnote-bridge read-rem <id1> --json` → 保存为 `before-plain.json` |
| 1b | 浏览器输入 | 在该 Rem 中输入 `这是一个普通行` |
| 1c | 读取已改 Rem | `remnote-bridge read-rem <id1> --json` → 保存为 `after-plain.json` |
| 1d | 对比 | diff before/after，记录 text 字段变化 |

### Case 2: Concept — 双冒号 `::`

| 步骤 | 操作 | 命令/动作 |
|:--|:--|:--|
| 2a | 读取空 Rem | `remnote-bridge read-rem <id2> --json` → `before-concept.json` |
| 2b | 浏览器输入 | 输入 `线性回归 :: 最基本的回归模型` |
| 2c | 读取已改 Rem | `remnote-bridge read-rem <id2> --json` → `after-concept.json` |
| 2d | 对比 | **重点关注**：type 是否变为 1 (CONCEPT)？text 和 backText 怎么拆分？ |

### Case 3: Descriptor — 双分号 `;;`

| 步骤 | 操作 | 命令/动作 |
|:--|:--|:--|
| 3a | 读取空 Rem | `remnote-bridge read-rem <id3> --json` → `before-descriptor.json` |
| 3b | 浏览器输入 | 输入 `细胞核 ;; 控制细胞活动的中心` |
| 3c | 读取已改 Rem | `remnote-bridge read-rem <id3> --json` → `after-descriptor.json` |
| 3d | 对比 | **重点关注**：type 是否变为 2 (DESCRIPTOR)？text/backText 拆分？ |

### Case 4: Forward Arrow — `>>`

| 步骤 | 操作 |
|:--|:--|
| 4a | 读取空 Rem |
| 4b | 浏览器输入 `什么是过拟合？ >> 模型在训练数据上表现好但泛化能力差` |
| 4c | 读取已改 Rem |
| 4d | **重点**：type 变成什么？是 CONCEPT 还是 DESCRIPTOR？还是一样是 DEFAULT？ |

### Case 5: Backward Arrow — `<<`

| 步骤 | 操作 |
|:--|:--|
| 5b | 浏览器输入 `模型泛化能力差 << 什么是过拟合？` |
| 5d | **重点**：和 Case 4 的 type 一样吗？text/backText 顺序是否反转？ |

### Case 6: Bidirectional — `<>`

| 步骤 | 操作 |
|:--|:--|
| 6b | 浏览器输入 `DNA <> 脱氧核糖核酸` |
| 6d | **重点**：type 是什么？practiceDirection 字段是否变为 "both"？ |

### Case 7: Multi-line — `>>>`

| 步骤 | 操作 |
|:--|:--|
| 7b | 浏览器输入 `什么是机器学习？ >>>` |
| 7c | 读取 Rem |
| 7d | **重点**：type 是什么？backText 是什么？ |
| 7e | 在 Multi-line 区域里输入子行（按 Enter 添加 2-3 行） |
| 7f | 再次读取父 Rem + 各子 Rem |
| 7g | **重点**：子行在 children 里？子行的 isCardItem 是 true？子行有 backText 吗？ |

### Case 8: Cloze — `{{}}`

| 步骤 | 操作 |
|:--|:--|
| 8b | 浏览器输入 `光合作用将{{光能}}转化为{{化学能}}` |
| 8d | **重点**：text 中的 cloze 元素长什么样？有 cId 吗？ |

---

## 每个 Case 需要记录的字段

对比 before/after 时，重点关注以下字段的变化：

```
type          — Rem 类型（concept / descriptor / default / portal）
text          — 前面部分的 RichText 数组
backText      — 后面部分的 RichText 数组（分隔符后面的内容去哪了？）
children      — 子 Rem ID 列表（Multi-line 子行在这里？）
isCardItem    — 是否为闪卡子项
practiceDirection — 练习方向（forward / backward / both / none）
```

---

## 结果记录模板

每个 Case 完成后，填入以下模板：

```markdown
### Case N: [名称]

**输入**: `[在浏览器中输入的文本]`

**UI 观察**: [在 RemNote 中看到的视觉效果]

**Rem Object 变化**:
| 字段 | Before | After |
|:--|:--|:--|
| type | default | ? |
| text | [] | ? |
| backText | undefined | ? |
| children | [] | ? |
| isCardItem | false | ? |
| practiceDirection | ? | ? |

**结论**: [这个分隔符做了什么]
```

---

## 预期产出

| 产出 | 用途 |
|:--|:--|
| **类型映射表** | 分隔符 → type 值 + text/backText 拆分规则 |
| **Multi-line 结构图** | 子行存储方式、isCardItem 行为 |
| **read-tree 序列化规则** | 知道怎么从 Rem Object 反向还原出分隔符 |

这些结论将直接更新 brainstorm 文档和初始需求。
