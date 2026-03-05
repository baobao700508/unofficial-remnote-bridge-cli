# Powerup 渲染机制研究

> 基于 RemNote Plugin SDK，通过实际实验验证 Powerup 对 Rem 前端渲染的影响。
> 最后验证时间：2026-03-05
>
> **验证状态说明：**
> - ✅ 实验验证 — 通过自动化脚本创建独立 Rem + SDK 调用 + read-rem/read-tree 读取完整数据
> - ✅🗑 删除实验 — 通过 `edit-tree` 实际删除 Powerup 子 Rem 并在浏览器中观察渲染变化
> - 📖 推断 — 基于实验结果和 SDK 数据结构推导，未做删除/恢复测试

---

## 1. 核心发现：Rem 渲染的三层决定机制 ✅

### 1.1 本质：复用 RemNote 的 Tag + Property 继承

Powerup 渲染**不是**一套独立的特殊机制，而是复用了 RemNote 本身的 **Tag + Property 继承**特性：

1. **任何 Rem 都可以作为 Tag** 标记别的 Rem，同时它可以定义自己拥有哪些 Property（`isProperty=true` 的子 Rem）
2. **当 Tag 应用到目标 Rem 时**，Tag 携带的 Property 会以**复制粘贴**（而非 Portal 引用）的方式，直接成为目标 Rem 的子 Rem
3. **前端渲染引擎**读取这些 Tag 引用和 Property 子 Rem 来决定 UI 样式

所谓"Powerup"只是 RemNote 对这套通用机制的一个特定应用——系统内置了一批 `isPowerup=true` 的 Tag（如"标题""高亮""待办"），前端渲染引擎识别这些 Tag 并据此改变 Rem 的视觉表现。而 Property 在早期 SDK 中被称为 **Slot**，两者是同一概念的不同名称（详见 [术语辨析：Slot vs Property](../vocabulary-definition/README.md#1-slot-vs-property-)）。

### 1.2 三层结构

一个 Rem 的前端渲染效果由三层机制**共同决定**：

```
+-----------------------------------------------------+
| 第 1 层：Tag 引用（tags 数组）                       |
| -> 决定"启用了哪些 Powerup 效果"                     |
| -> 存储在 Rem 的 tags 字段中（Rem ID 数组）          |
| -> 每个 Powerup Tag 本身是一个 isPowerup=true 的 Rem |
+-----------------------------------------------------+
| 第 2 层：Property 子 Rem（隐藏的 children）          |
| -> 决定"启用效果的具体参数值"                         |
| -> Tag 携带的 Property 被复制到目标 Rem 下            |
| -> 以 [属性名] ;; [属性值] 的 descriptor 格式存储     |
| -> 在 UI 中隐藏，但 SDK/read-tree 可读取              |
| -> 只有"有参数"的 Powerup 才会生成子 Rem             |
+-----------------------------------------------------+
| 第 3 层：Tag 定义（Tag Rem 本身的结构）              |
| -> 决定"这个 Tag/Powerup 有哪些可配置 Property"      |
| -> Tag Rem 下的 isProperty=true 子 Rem 定义了可用字段 |
+-----------------------------------------------------+
```

**关键结论：**

- 删除 Property 子 Rem（第 2 层）-> 效果退化为**默认值**，但不完全消失 ✅🗑
- 只要 Tag 引用（第 1 层）还在 -> 效果本身**不会消失** ✅🗑
- 要**彻底去除**某个 Powerup 效果 -> 使用 `removePowerup(code)`，它会同时清除 Tag 引用 + 删除所有参数子 Rem ✅ 实测验证
- **并非所有渲染方法都走 Powerup 机制** — `setType`、`setBackText`、`setEnablePractice`、`setPracticeDirection` 是纯字段修改，不注入 Tag ✅

---

## 2. 内置 Powerup Tag 完整映射表 ✅

通过自动化测试脚本 `test-powerup-rendering.ts`，对 32 种 SDK 方法逐一创建独立 Rem 并读取 tags 字段，得到完整映射：

### 2.1 Powerup Tag ID 与名称

| Tag ID | 显示名称 | SDK Powerup Code | isPowerup |
|:-------|:---------|:-----------------|:----------|
| `i61Wvdp7JvF8gMcXI` | 标题 | Header (`r`) | true |
| `TBOrcFVvsbb3nqzaV` | 高亮 | Highlight (`h`) | true |
| `qZCqTU5tuHPEcQe79` | 代码 | Code (`cd`) | true |
| `AKYa8egYA5GScbRsB` | 引用 | Quote (`qt`) | true |
| `cujNVOENY8RRfZmbT` | 列表项 | List (`i`) | true |
| `JWIPjFAJKUMTDcmgB` | 待办 | Todo (`t`) | true |
| `KLfxDpBzvpCpAiNsK` | 卡片条目 | MultiLineCard (`w`) | true |
| `HtkQ8Eke0me1tcaO2` | 文档 | Document (`o`) | true |
| `vD8KGEg5dkj9bzkRn` | 模板插槽 | Slot (`y`) | true |
| `aQSmCBONEoIGhnNuX` | 稍后编辑 | EditLater (`e`) | true |
| `ShTHp9MOVR6Jt7Ij0` | 分割线 | Divider (`dv`) | true |

> **注意：** Tag ID 是知识库级别的，不同用户的知识库中同一 Powerup 的 Tag ID 不同。上表为本测试知识库的实际值。

### 2.2 共用 Tag 的 SDK 方法

| 共用的 Tag | 共用的 SDK 方法 |
|:-----------|:---------------|
| 卡片条目 (`KLfxDpBzvpCpAiNsK`) | `setIsCardItem(true)` 和 `addPowerup('w')` (MultiLineCard) |
| 模板插槽 (`vD8KGEg5dkj9bzkRn`) | `setIsSlot(true)` 和 `setIsProperty(true)` |

---

## 3. SDK 方法的完整行为矩阵 ✅

### 3.1 走 Powerup 机制的方法（注入 Tag + 可选子 Rem）

| SDK 方法 | 注入的 Tag（名称） | 隐藏子 Rem | 子 Rem 内容 |
|:---------|:-------------------|:-----------|:------------|
| `setFontSize('H1')` | 标题 | 有 | `[Size] ;; [H1]` (descriptor) |
| `setFontSize('H2')` | 标题 | 有 | `[Size] ;; [H2]` (descriptor) |
| `setFontSize('H3')` | 标题 | 有 | `[Size] ;; [H3]` (descriptor) |
| `setHighlightColor('Red')` | 高亮 | 有 | `[Color] ;; [Red]` (descriptor) |
| `setHighlightColor('Blue')` | 高亮 | 有 | `[Color] ;; [Blue]` (descriptor) |
| `setHighlightColor('Green')` | 高亮 | 有 | `[Color] ;; [Green]` (descriptor) |
| `setIsTodo(true)` | 待办 | 有 | `[Status] ;; [Unfinished]` (descriptor) |
| `setTodoStatus('Finished')` | 待办 | 有 | `[Status] ;; [Finished]` (descriptor) |
| `setIsDocument(true)` | 文档 | 有 | `[Status] ;; [Draft]` (descriptor) |
| `setIsCode(true)` | 代码 | 无 | — |
| `setIsQuote(true)` | 引用 | 无 | — |
| `setIsListItem(true)` | 列表项 | 无 | — |
| `setIsCardItem(true)` | 卡片条目 | 无 | — |
| `setIsSlot(true)` | 模板插槽 | 无 | — |
| `setIsProperty(true)` | 模板插槽 | 无 | — |

**规律：有参数的 Powerup（字号值、颜色值、状态值）会生成隐藏 descriptor 子 Rem；无参数的 Powerup（开/关型）只注入 Tag。**

### 3.2 不走 Powerup 机制的方法（纯字段修改，tags 为空）

| SDK 方法 | 效果 | 数据存储方式 |
|:---------|:-----|:------------|
| `setType(CONCEPT)` / `setType(DESCRIPTOR)` | 文字粗体 / 正常字重 | Rem 的 `type` 字段（枚举值） |
| `setBackText(...)` | 产生正反面（闪卡方向标记 `fc:forward`） | Rem 的 `backText` 字段 |
| `setEnablePractice(true)` | 启用间隔重复 | Rem 内部属性 |
| `setPracticeDirection('forward')` | 设置闪卡方向 | Rem 内部属性 |

### 3.3 addPowerup 与 setter 的对比 ✅

`addPowerup` 只添加 Tag，不创建参数子 Rem。而对应的 setter 方法会同时添加 Tag **和** 参数子 Rem：

| setter 方法 | addPowerup 方法 | 注入 Tag 相同？ | 区别 |
|:------------|:---------------|:---------------|:-----|
| `setFontSize('H1')` | `addPowerup('r')` | 相同 (`i61Wvdp7JvF8gMcXI`) | setter 额外生成 `[Size] ;; [H1]` 子 Rem |
| `setHighlightColor('Red')` | `addPowerup('h')` | 相同 (`TBOrcFVvsbb3nqzaV`) | setter 额外生成 `[Color] ;; [Red]` 子 Rem |
| `setIsTodo(true)` | `addPowerup('t')` | 相同 (`JWIPjFAJKUMTDcmgB`) | **两者都**生成 `[Status] ;; [Unfinished]` 子 Rem |
| `setIsDocument(true)` | `addPowerup('o')` | 相同 (`HtkQ8Eke0me1tcaO2`) | **两者都**生成 `[Status] ;; [Draft]` 子 Rem |
| `setIsCode(true)` | `addPowerup('cd')` | 相同 (`qZCqTU5tuHPEcQe79`) | 行为完全一致（都只注入 Tag，无子 Rem） |
| `setIsQuote(true)` | `addPowerup('qt')` | 相同 (`AKYa8egYA5GScbRsB`) | 行为完全一致 |
| `setIsListItem(true)` | `addPowerup('i')` | 相同 (`cujNVOENY8RRfZmbT`) | 行为完全一致 |
| `setIsCardItem(true)` | `addPowerup('w')` | 相同 (`KLfxDpBzvpCpAiNsK`) | 行为完全一致 |

**结论：** 对于无参数的 Powerup，setter 和 `addPowerup` 完全等价。对于有参数的 Powerup（Header/Highlight），setter 是 `addPowerup` + `setPowerupProperty` 的快捷封装。但 Todo 和 Document 是例外——`addPowerup` 也会自动生成默认参数子 Rem。

### 3.4 setPowerupProperty 与 setter 的细微差异 ✅

| 操作 | 子 Rem 属性值格式 |
|:-----|:-----------------|
| `setFontSize('H1')` | `[Size] ;; [H1]` — 属性值是 **Rem 引用链接** |
| `setPowerupProperty('r', 'Size', ['H1'])` | `[Size] ;; H1` — 属性值是**纯文本字符串** |
| `setHighlightColor('Red')` | `[Color] ;; [Red]` — 属性值是 **Rem 引用链接** |
| `setPowerupProperty('h', 'Color', ['Red'])` | `[Color] ;; Red` — 属性值是**纯文本字符串** |

setter 使用 Rem 引用指向全局枚举值 Rem，`setPowerupProperty` 直接写入纯文本。两者在 UI 渲染上效果相同，但数据结构不同。

---

## 4. 已知的 Powerup 属性完整列表 ✅

| Powerup (Tag 名称) | 属性名 | 用途 | 已知枚举值 | 验证方式 |
|:-------------------|:-------|:-----|:----------|:---------|
| 标题 (Header) | Size | 字号控制 | H1, H2, H3 | ✅ 自动化测试 |
| 高亮 (Highlight) | Color | 整行高亮颜色 | Red, Orange, Yellow, Green, Blue, Purple | ✅ 自动化测试 + SDK 签名 |
| 待办 (Todo) | Status | 完成状态 | Unfinished, Finished | ✅ 自动化测试 |
| 文档 (Document) | Status | 文档状态 | Draft | ✅ 自动化测试 |
| 高亮 (Highlight) | Hide Bullets | 是否隐藏子弹点 | true, false | 📖 read-tree 观察到 |

**无参数的 Powerup（不生成子 Rem）：** 代码、引用、列表项、卡片条目、模板插槽、稍后编辑、分割线。

---

## 5. 删除实验记录 ✅🗑

### 5.1 实验环境

- 目标 Rem：`qa-test-item`（ID: `dtiQHcUJ2iEcQewZV`）
- 所在文档：`mcp`（ID: `KBhhq0frjpSdMTleT`）
- 操作工具：`edit-tree` 命令的 `str_replace` 模式
- 验证方式：RemNote 浏览器端截图对比

### 5.2 基线状态

read-tree 输出：

```
qa-test-item ;;  <!--dtiQHcUJ2iEcQewZV fc:descriptor tags:3-->
  [Size] ;; [H1] <!--RbNkVE039abw4L5sd fc:descriptor-->
  [Color] ;; [Red] <!--nLLTUQZksPuLIe8il fc:descriptor-->
```

UI 渲染：红色高亮背景 + H1 大字体加粗斜体

tags 数组内容（3 个引用）：

| Tag 名称 | Tag ID | Powerup |
|:---------|:-------|:--------|
| 标题 | `i61Wvdp7JvF8gMcXI` | Header (`r`) |
| 高亮 | `TBOrcFVvsbb3nqzaV` | Highlight (`h`) |
| 标签组 | `yj9EeMQi0NIiCEgCE` | 未知（非渲染相关） |

### 5.3 实验步骤与结果

| 步骤 | 操作 | 删除的 Rem ID | 渲染变化 | 验证状态 |
|:-----|:-----|:-------------|:---------|:---------|
| 0 | 基线（无操作） | -- | 红色高亮 + H1 大字体加粗斜体 | ✅ |
| 1 | 删除 `[Size] ;; [H1]` | `RbNkVE039abw4L5sd` | H1 大字体**消失**，变为普通大小斜体；红色高亮**保留** | ✅🗑 |
| 2 | 删除 `[Color] ;; [Red]` | `nLLTUQZksPuLIe8il` | 红色高亮**变淡**（变为淡粉色默认底色），未完全消失 | ✅🗑 |

### 5.4 关键观察

**观察 1：删除参数值 != 删除效果** ✅🗑

删除 `[Size] ;; [H1]` 后，H1 字号效果消失，但"标题"Tag 引用仍在 `tags` 数组中。
删除 `[Color] ;; [Red]` 后，红色消失但仍有淡粉色底色，因为"高亮"Tag 引用仍在。

**结论：** Powerup 子 Rem 只是参数值，Tag 引用才是效果的开关。删除参数值后效果退化为默认值，不会完全关闭。

**观察 2：Tag 引用是效果存在的根本条件** 📖

即使所有 Powerup 子 Rem 都被删除（第 2 层清空），只要 `tags` 数组中还引用了对应的 Powerup Tag（第 1 层），RemNote 前端仍会渲染该效果的默认样式。

**观察 3：Powerup 属性的存储格式** ✅

Powerup 属性值以 `descriptor` 类型的子 Rem 存储：

```
[属性名 Rem 引用] ;; [属性值 Rem 引用] <!--remId fc:descriptor-->
```

- 属性名和属性值都是 Rem 引用（Markdown 链接格式），指向全局定义的属性/枚举 Rem
- 每个属性值子 Rem 的 `fc:descriptor` 标记表明它是 descriptor 闪卡类型
- 这些子 Rem 在 RemNote UI 中**完全隐藏**，但通过 SDK 的 `getChildrenRem()` 或 `read-tree` 可以读取

---

## 6. 与 RichText 行内格式的对比

Rem 的视觉格式化有两套独立机制：

| 机制 | 作用范围 | 存储位置 | 控制粒度 |
|:-----|:---------|:---------|:---------|
| **RichText 行内格式** | Rem 内部的文字片段 | `text`/`backText` 的 JSON 数组中 | 字符级（某几个字加粗） |
| **Powerup 渲染** | 整个 Rem 块 | 隐藏子 Rem + Tag 引用 | Rem 级（整行高亮/变大） |

两者不冲突，可以叠加。例如一个 Rem 可以同时：
- 通过 Powerup 设置整行红色高亮 + H1 字号
- 通过 RichText 内部的 `h` 字段给某几个字加绿色高亮

详见 [RichText 底层 JSON 格式参考](../richtext-format/README.md)。

---

## 7. 对项目的意义

### 7.1 read-tree 输出中的 Powerup 行

`read-tree` 会输出 Powerup 子 Rem（如 `[Size] ;; [H1]`），这些行在 RemNote UI 中不可见。
AI Agent 在使用 `edit-tree` 时需要理解：
- 这些行**不是用户创建的内容**，是 RemNote 自动生成的元数据
- 删除这些行会**改变 Rem 的渲染效果**（退化为默认值）
- 修改这些行的内容（如把 `[H1]` 改成 `[H2]`）**不被 edit-tree 支持**（D8 禁止内容变更）

### 7.2 read-rem 中 tags 字段的 Powerup 污染

通过 `read-rem` 读取 Rem 的 `tags` 字段时，会混合返回：
- 用户手动添加的普通 Tag
- SDK 自动注入的 Powerup Tag（如"标题"、"高亮"、"待办"等）

两者在数据结构上无法区分（都是 Rem ID），需要通过 `isPowerup` 属性判断。

### 7.3 SDK 方法选择指南

| 需求 | 推荐方法 | 原因 |
|:-----|:---------|:-----|
| 设置标题字号 | `setFontSize('H1')` | 自动处理 Tag + 参数子 Rem |
| 设置整行高亮 | `setHighlightColor('Red')` | 同上 |
| **清除整行高亮** | `removePowerup('h')` | `setHighlightColor(null)` 被 SDK 拒绝，需通过 removePowerup 从底层清除 ✅ 实测验证 |
| 切换代码/引用/列表 | `setIsCode(true)` 等 | 与 `addPowerup` 等价，语义更清晰 |
| 切换 Rem 类型 | `setType(CONCEPT)` | 纯字段修改，不涉及 Powerup |
| 精确控制 Powerup 属性 | `addPowerup()` + `setPowerupProperty()` | 两步操作，属性值为纯文本 |

#### removePowerup 行为详解（2026-03-05 实测 + SDK CHANGELOG 确认）

`removePowerup(code)` 会**同时**执行三件事：
1. 从 `tags` 数组移除对应的 Powerup Tag 引用（第 1 层）
2. 删除所有 Powerup 参数子 Rem / slots（第 2 层）
3. 对应的 getter（如 `getHighlightColor()`）恢复返回 `null`

SDK CHANGELOG 原文：*"Added `Rem.removePowerup(powerupCode)`. It will always remove all powerup slots."*

**实测数据（highlightColor Blue → null）：**

| 字段 | `setHighlightColor('Blue')` 后 | `removePowerup('h')` 后 |
|:-----|:-------------------------------|:------------------------|
| `highlightColor` | `"Blue"` | `null` |
| `tags` | 含 `TBOrcFVvsbb3nqzaV`（高亮 Tag） | 已移除 |
| `children` | 含 `[Color] ;; [Blue]` descriptor 子 Rem | 已清空 |

### 7.4 未来可能的 Powerup 操作命令

如需通过 CLI 控制 Powerup 属性，可能需要：
- 专门的 `set-powerup` / `remove-powerup` 命令
- 通过 SDK 的 `addPowerup()` / `removePowerup()` / `setPowerupProperty()` 等 API
- 而非通过 `edit-tree` 的 str_replace 方式（太底层、太脆弱）

---

## 8. 待验证问题

- [x] 清除 `tags` 数组中的 Tag 引用后，Powerup 效果是否完全消失？→ **已验证（2026-03-05）**：`removePowerup('h')` 同时移除 Tag 引用 + 所有参数子 Rem，高亮效果完全消失。SDK CHANGELOG 明确记载："It will always remove all powerup slots."
- [ ] `标签组` Tag（`yj9EeMQi0NIiCEgCE`）的具体作用是什么？
- [ ] Portal Rem（`type:portal`）在 Powerup 体系中的角色是什么？
- [ ] 删除 Tag 引用但保留 Powerup 子 Rem 会怎样？（与删除实验相反的操作）
- [ ] `setPowerupProperty` 写入纯文本 vs setter 写入 Rem 引用，是否影响后续 SDK 读取行为？

---

## 9. 自动化测试脚本

### 9.1 测试脚本

文件：`remnote-plugin/src/test-scripts/test-powerup-rendering.ts`

设计原则：
- **一个 Rem 只用一种 SDK 方法**，避免效果叠加导致无法归因
- 每个 Rem 在 SDK 调用前后各拍一次快照（tags、children、hasPowerup、12 个渲染字段）
- 自动 diff 前后快照，生成结构化报告

### 9.2 测试覆盖

共 32 个用例，分四类：

| 类别 | 用例数 | 内容 |
|:-----|:-------|:-----|
| 专属 setter | 18 | setFontSize x3, setHighlightColor x3, setIsCode/Quote/ListItem/Todo/TodoStatus/CardItem/Document, setType x2, setIsSlot/Property, setBackText |
| addPowerup | 10 | Header, Highlight, Code, Quote, Todo, List, EditLater, Document, MultiLineCard, Divider |
| setPowerupProperty | 2 | Header+Size+H1, Highlight+Color+Red |
| 练习相关 | 2 | setEnablePractice, setPracticeDirection |

### 9.3 数据读取方式

测试 Rem 创建后，通过以下方式读取完整数据：
- `read-tree <mcp-doc-id> --depth 2 --json` 获取树结构（含隐藏子 Rem）
- `read-rem <rem-id> --fields tags --json` 逐个读取 tags 数组中的具体 Tag ID
- `read-rem <tag-id> --fields text,isPowerup --json` 读取 Tag Rem 的名称和 Powerup 标记

---

## 10. 信息来源

| 来源 | 日期 | 贡献内容 |
|:-----|:-----|:---------|
| **自动化探测脚本** `test-powerup-rendering.ts` | 2026-03-05 | 32 种 SDK 方法的完整 Tag/子 Rem 行为矩阵 |
| **CLI 批量读取** `read-rem --fields tags` | 2026-03-05 | 每个测试 Rem 的具体 Tag ID |
| **CLI 读取 Tag Rem** `read-rem <tagId>` | 2026-03-05 | 11 个 Powerup Tag 的名称和 isPowerup 确认 |
| **删除实验** | 2026-03-04 | 逐个删除 qa-test-item 的 Powerup 子 Rem，截图观察渲染变化 |
| **read-tree 输出** | 2026-03-04 | mcp 文档完整树结构，包含 Powerup 子 Rem 和 Portal |
| SDK 文档 `advanced_powerups.md` | — | Powerup 官方概念说明 |
| SDK 文档 `api_enums_BuiltInPowerupCodes.md` | — | 33 个内置 Powerup Code 枚举值 |
