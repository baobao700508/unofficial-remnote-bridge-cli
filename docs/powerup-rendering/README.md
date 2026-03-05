# Powerup 渲染机制研究

> 基于 RemNote Plugin SDK，通过实际实验验证 Powerup 对 Rem 前端渲染的影响。
> 最后验证时间：2026-03-04
>
> **验证状态说明：**
> - ✅ 实验验证 — 通过 `edit-tree` 实际删除 Powerup 子 Rem 并在浏览器中观察渲染变化
> - 📖 推断 — 基于实验结果和 SDK 数据结构推导，未做删除/恢复测试
> - ❓ 待验证 — 发现了现象但尚未做对照实验

---

## 1. 核心发现：Rem 渲染的三层决定机制 ✅ 实验验证

一个 Rem 的前端渲染效果由三层机制**共同决定**：

```
┌─────────────────────────────────────────────────────┐
│ 第 1 层：Tag 引用（tags 数组）                       │
│ → 决定"启用了哪些 Powerup 效果"                     │
│ → 存储在 Rem 的 tags 字段中（Rem ID 数组）           │
├─────────────────────────────────────────────────────┤
│ 第 2 层：Powerup 子 Rem（隐藏的 children）           │
│ → 决定"启用效果的具体参数值"                         │
│ → 以 [属性名] ;; [属性值] 的 descriptor 格式存储     │
│ → 在 UI 中隐藏，但 SDK/read-tree 可读取              │
├─────────────────────────────────────────────────────┤
│ 第 3 层：Powerup Tag 定义（Tag Rem 本身的结构）      │
│ → 决定"这个 Powerup 有哪些可配置属性"及其默认值     │
│ → 是全局共享的模板定义                               │
└─────────────────────────────────────────────────────┘
```

**关键结论：**

- 删除 Powerup 子 Rem（第 2 层）→ 效果退化为**默认值**，但不完全消失
- 只要 Tag 引用（第 1 层）还在 → 效果本身**不会消失**
- 要**彻底去除**某个 Powerup 效果，需要同时清除 Tag 引用 + 删除 Powerup 子 Rem

---

## 2. 实验记录

### 2.1 实验环境

- 目标 Rem：`qa-test-item`（ID: `dtiQHcUJ2iEcQewZV`）
- 所在文档：`mcp`（ID: `KBhhq0frjpSdMTleT`）
- 操作工具：`edit-tree` 命令的 `str_replace` 模式
- 验证方式：RemNote 浏览器端截图对比

### 2.2 基线状态

read-tree 输出：

```
qa-test-item ;;  <!--dtiQHcUJ2iEcQewZV fc:descriptor tags:3-->
  [Size] ;; [H1] <!--RbNkVE039abw4L5sd fc:descriptor-->
  [Color] ;; [Red] <!--nLLTUQZksPuLIe8il fc:descriptor-->
```

UI 渲染：红色高亮背景 + H1 大字体加粗斜体

tags 数组内容（3 个引用）：

| Tag 名称 | Tag ID | 推断用途 |
|:---------|:-------|:---------|
| 标题 | `i61Wvdp7JvF8gMcXI` | Size Powerup 的 Tag 定义 |
| 高亮 | `TBOrcFVvsbb3nqzaV` | Color Powerup 的 Tag 定义 |
| 标签组 | `yj9EeMQi0NIiCEgCE` | 未知，待研究 |

### 2.3 实验步骤与结果

| 步骤 | 操作 | 删除的 Rem ID | 渲染变化 | 验证状态 |
|:-----|:-----|:-------------|:---------|:---------|
| 0 | 基线（无操作） | — | 红色高亮 + H1 大字体加粗斜体 | ✅ |
| 1 | 删除 `[Size] ;; [H1]` | `RbNkVE039abw4L5sd` | H1 大字体**消失**，变为普通大小斜体；红色高亮**保留** | ✅ |
| 2 | 删除 `[Color] ;; [Red]` | `nLLTUQZksPuLIe8il` | 红色高亮**变淡**（变为淡粉色默认底色），未完全消失 | ✅ |

### 2.4 关键观察

#### 观察 1：删除参数值 ≠ 删除效果 ✅

删除 `[Size] ;; [H1]` 后，H1 字号效果消失，但"标题"Tag 引用仍在 `tags` 数组中。
删除 `[Color] ;; [Red]` 后，红色消失但仍有淡粉色底色，因为"高亮"Tag 引用仍在。

**结论：** Powerup 子 Rem 只是参数值，Tag 引用才是效果的开关。删除参数值后效果退化为默认值，不会完全关闭。

#### 观察 2：Tag 引用是效果存在的根本条件 📖 推断

即使所有 Powerup 子 Rem 都被删除（第 2 层清空），只要 `tags` 数组中还引用了对应的 Powerup Tag（第 1 层），RemNote 前端仍会渲染该效果的默认样式。

**待验证：** 如果进一步清除 `tags` 数组中的 Tag 引用，淡粉色底色是否会完全消失？

#### 观察 3：Powerup 属性的存储格式 ✅

Powerup 属性值以 `descriptor` 类型的子 Rem 存储：

```
[属性名 Rem 引用] ;; [属性值 Rem 引用] <!--remId fc:descriptor-->
```

- 属性名和属性值都是 Rem 引用（Markdown 链接格式），指向全局定义的属性/枚举 Rem
- 每个属性值子 Rem 的 `fc:descriptor` 标记表明它是 descriptor 闪卡类型
- 这些子 Rem 在 RemNote UI 中**完全隐藏**，但通过 SDK 的 `getChildrenRem()` 或 `read-tree` 可以读取

---

## 3. 与 RichText 行内格式的对比

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

## 4. 已知的内置 Powerup 属性

以下是从实验中观察到的 Powerup 属性（不完整，待补充）：

| 属性名 | 用途 | 已知枚举值 | 验证状态 |
|:-------|:-----|:----------|:---------|
| Size | 字号控制 | H1, H2, H3（推测） | ✅ 删除实验验证 |
| Color | 高亮颜色 | Red, Blue（已观察） | ✅ 删除实验验证 |
| Hide Bullets | 是否隐藏子弹点 | true, false | 📖 read-tree 观察到 |
| Status | 状态标记 | Draft（已观察） | 📖 read-tree 观察到 |

---

## 5. 对项目的意义

### 5.1 read-tree 输出中的 Powerup 行

`read-tree` 会输出 Powerup 子 Rem（如 `[Size] ;; [H1]`），这些行在 RemNote UI 中不可见。
AI Agent 在使用 `edit-tree` 时需要理解：
- 这些行**不是用户创建的内容**，是 RemNote 自动生成的元数据
- 删除这些行会**改变 Rem 的渲染效果**
- 修改这些行的内容（如把 `[H1]` 改成 `[H2]`）**不被 edit-tree 支持**（D8 禁止内容变更）

### 5.2 未来可能的 Powerup 操作命令

如需通过 CLI 控制 Powerup 属性，可能需要：
- 专门的 `set-powerup` / `remove-powerup` 命令
- 通过 SDK 的 `addPowerup()` / `removePowerup()` / `setPowerupProperty()` 等 API
- 而非通过 `edit-tree` 的 str_replace 方式（太底层、太脆弱）

---

## 6. 待验证问题

- [ ] 清除 `tags` 数组中的 Tag 引用后，Powerup 效果是否完全消失？
- [ ] Size 属性除了 H1 还有哪些枚举值？（H2、H3？）
- [ ] Color 属性的完整枚举值列表（与 RichText 的 RemColor 是否一致？）
- [ ] `标签组` Tag（`yj9EeMQi0NIiCEgCE`）的具体作用是什么？
- [ ] Portal Rem（`type:portal`）在 Powerup 体系中的角色是什么？
- [ ] 通过 SDK 的 `addPowerup()` 添加 Powerup 后，子 Rem 和 Tag 引用是否自动生成？
- [ ] 删除 Tag 引用但保留 Powerup 子 Rem 会怎样？（与当前实验相反的操作）

---

## 7. 信息来源

| 来源 | 贡献内容 |
|:-----|:---------|
| **删除实验** 2026-03-04 | 逐个删除 qa-test-item 的 Powerup 子 Rem，截图观察渲染变化 |
| **read-tree 输出** | mcp 文档完整树结构，包含 Powerup 子 Rem 和 Portal |
| **read-rem 输出** | qa-test-item 的 tags 数组内容及 Tag Rem 名称 |
| SDK 文档 `advanced_powerups.md` | Powerup 官方概念说明（待对照验证） |
