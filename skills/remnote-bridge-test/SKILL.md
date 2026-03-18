---
name: remnote-bridge-test
description: "remnote-bridge 项目的 MCP 测试执行框架。支持两种模式：(A) 新功能测试——动态规划测试方案；(B) 回归测试——跑固定基线用例确认没退化。通过低智能 subagent 在干净上下文中执行，配合 Chrome 严格截图验收，内置自循环修复流程（test→审计→验收→归因→fix→retest）。当用户提到：测试、test、回归测试、regression、跑测试、验证功能、测试 MCP、新功能验收——都应触发此 skill。即使只说'测一下'也应触发。"
---

# remnote-bridge 测试框架

## ⛔⛔⛔ 你（主 agent）的角色红线 — 读完再做任何事 ⛔⛔⛔

**你是调度员，不是执行者。** 违反以下任何一条 = 测试流程作废。

### ✅ 白名单（你只能做这些，其他一律禁止）

1. 基础设施：`connect()`（⛔ 禁止 headless）、`disconnect()`、`health`、`npm run build`
2. 浏览器：Claude in Chrome 刷新 RemNote、截图
3. 派 **haiku subagent** 执行测试用例（用 §3 模板）
4. 审计 subagent transcript
5. **仅在 Step 4 Chrome 验收时**用 `read_rem` 补充确认截图看不清的字段（如 practiceDirection）
6. 写 workspace 文件（transcript.md、screenshot、results.md）
7. 写 bug 报告 → 派 **修复 agent** 去修（见 Step 7）← 你自己不碰代码、不碰 MCP 工具

### ❌ 黑名单（做了任何一项 = 作废）

- 自己调用 `edit_tree` / `edit_rem` / `read_tree` / `search` / `read_globe` / `read_context`
- 自己调用 `read_rem` 去调试问题（`read_rem` **只能**用在 Step 4 Chrome 验收辅助，不能用在其他任何时候）
- 自己执行 Bash 跑 `remnote-bridge` CLI 命令
- 跳过 haiku subagent 直接测试
- **修复后自己验证**而不是重新派 subagent（→ 见 Step 8）
- `connect(headless=true)` 或 `--headless`
- 要求用户手动操作（你有 Claude in Chrome，自己动手）
- 搜索测试页面（ID 在 §2 写死：`kLrIOHJLyMd8Y2lyA`）
- 自己读/写项目源码（`src/`、`remnote-plugin/`、`skills/`）——修 bug 派 agent 去做

**⛔ 典型违规场景（全部真实发生过）：**

| 你做了什么 | 为什么错 |
|:----------|:---------|
| subagent 报告 edit_rem 失败 → 你自己调 read_rem 调查 → 自己调 edit_rem 修复 | 你在当执行者，不是调度员 |
| 调 search/read_globe 找测试页面 | 测试页面 ID 写死了，不需要搜 |
| 修完 bug 后自己调 read_rem 确认修复效果 | 必须重新派 subagent 重测 |
| subagent 测试不过 → 你自己跑一遍同样的命令 | 这证明不了文档对 haiku 有效 |
| 自己打开 src/ 下的文件定位 bug、自己改代码 | 修 bug 是修复 agent 的事，你只写 bug 报告 |

---

## §1 总览

**目的**：验证 remnote-bridge 的 MCP 工具在低智能模型下能否仅凭文档完成操作，并通过 Chrome 截图确认实际效果。

**双重目标**：

| 维度 | 测什么 | 怎么暴露 |
|:-----|:-------|:---------|
| **文档质量** | 低智能模型能否仅凭文档完成操作 | haiku subagent 空上下文执行 |
| **工具能力** | 工具在各种场景下是否可靠 | Chrome 截图严格验收 |

**两种模式**：
- **模式 A — 新功能测试**：分析变更 → 动态规划用例 → 按 §5 设计 → 进入核心循环
- **模式 B — 回归测试**：从 `references/regression-suite.md` 选用例 → 进入核心循环

**核心循环**：Step 1（选用例）→ Step 2（派 subagent）→ Step 3（审计 transcript）→ Step 4（Chrome 验收）→ Step 5（综合判定）→ Step 6（归因）→ Step 7（修复）→ Step 8（重测）

---

## §2 测试环境

### 测试页面

默认：`kLrIOHJLyMd8Y2lyA`（"MCP 测试"文档）

- 不操作测试页面本身，只在其子节点下创建
- 数据加前缀（日期+功能，如 `[0317-flashcard]`）
- 每轮测试前确认页面下无残留或已清理

### 模型配置

| 角色 | 模型 | 原因 |
|:-----|:-----|:-----|
| 执行者 | **haiku** | 暴露文档质量问题 |
| 验收者 | 当前模型（主 agent） | Chrome 截图严格对比 + 独立审计 |
| 对照组 | sonnet（可选） | 区分 Doc 问题 vs Model 限制 |

### 连接（⛔ 禁止 headless）

```
connect()（不带参数）→ Claude in Chrome 刷新 RemNote → health 三层全绿
```

- `connect` 禁止传 `headless=true`，CLI 禁止 `--headless`（headless Chrome 是独立实例，Claude in Chrome 看不到）
- 禁止要求用户手动操作——你有 Claude in Chrome，**自己刷新**
- health 不通 → 再刷新一次 → 再 health → 仍不通则停止报告

### 并行执行约束（⚠️ 重要经验）

多个 subagent **共享同一个 daemon 进程和 Plugin 连接**。并行执行会导致：

- **daemon 连接竞争**：多个 subagent 同时调用 connect/disconnect 会互相干扰，导致连接状态不一致
- **缓存污染**：一个 subagent 的 edit 操作会使另一个 subagent 的缓存失效，触发并发检测防线
- **Plugin 连接断开**：高频操作（44+ 次 MCP 调用）可能导致 Plugin 连接中断，后续 subagent 全部失败

**规则**：

| 用例类型 | 可否并行 | 原因 |
|:---------|:---------|:-----|
| 涉及 connect/disconnect 的用例（如 L1-01） | ❌ 必须串行 | 会干扰其他 subagent 的连接 |
| 长耗时用例（如 L3-02、L4 级别） | ❌ 必须串行 | 高频操作可能耗尽 Plugin 连接 |
| 同级别内的短用例（如 L2-01~04） | ✅ 可以并行 | 各自创建独立数据，互不干扰 |
| 不同级别的只读用例（如 L1-02） | ✅ 可以并行 | 只读操作不影响缓存 |

**最佳实践**：同一级别内的 2-3 个短用例可以并行派发；L1-01 单独跑完后再跑其他用例；L3+ 级别用例逐个串行执行。

### 数据前缀规则

MCP 和 Skill 两个 subagent 在同一页面下创建数据，**必须用不同前缀**避免混淆：

| 接口 | 回归测试 | 新功能测试 |
|:-----|:---------|:-----------|
| MCP | `[日期-级别编号]`，如 `[0317-L2-01]` | `[日期-功能名]`，如 `[0317-flashcard]` |
| Skill | `[日期-级别编号s]`，如 `[0317-L2-01s]` | `[日期-功能名s]`，如 `[0317-flashcards]` |

Skill 接口加 `s` 后缀（**s** = Skill）。这样两个 subagent 创建的数据在测试页面上一目了然。

---

## §3 核心循环（8 步完整流程）

> **这是整个框架最关键的部分。每一步都内联在此，不需要跳转任何外部文件。**

### Step 1：选择/编写用例

**回归测试**：读 `references/regression-suite.md`，选择要执行的级别和用例。每个用例包含 task_description + 断言 + Chrome 验证点。

**新功能测试**：按 §5 的规划原则动态设计用例。

每个用例必须包含：
1. 明确的 task_description（步骤化、具体、包含验证步骤）
2. Chrome 验证清单（看什么、什么算对）
3. 数据前缀

### Step 2：构造 subagent 并执行

使用 haiku subagent 执行测试。

#### 双接口策略

| 用例级别 | MCP 接口 | Skill（CLI）接口 | 原因 |
|:---------|:---------|:-----------------|:-----|
| **L1-L2** | ✅ 必须 | ✅ 必须 | 基础功能，验证两侧文档都能用 |
| **L3** | ✅ 必须 | 🟡 推荐（时间允许时） | 组合场景，双接口有价值但非必需 |
| **L4-L5** | ✅ 必须 | ❌ 跳过 | 大规模/边界用例，双接口 ROI 低 |

一侧过另一侧不过说明对应接口的文档有问题。

隔离通过 **prompt 纪律** 实现（Claude Code 的 Agent 工具不支持自定义 `subagent_type` 限制工具集）：
- MCP 模板：明确禁止使用 Bash/Read/Glob，只用 `mcp__remnote-bridge__*` 工具
- Skill 模板：明确禁止使用 MCP 工具，只用 Bash + Read 执行 CLI 命令

> **⚠️ 上下文污染**：subagent 会继承 MCP SERVER_INSTRUCTIONS 和所有工具描述，无法真正隔离上下文。但通过 prompt 纪律约束 subagent 只使用指定接口——如果它仍然调用了被禁止的工具，审计时（Step 3）会捕获并标 FAIL。

#### 🚫 作弊行为定义（以下任一行为 = 测试无效）

> 此约束同时适用于 MCP 模板和 Skill 模板。

1. **读取项目源代码**（`src/`、`remnote-plugin/` 下的任何文件）——源码不是你的信息来源
2. **不调用工具就报告工具的行为或返回值**（"根据代码分析..."、"预期错误信息为..."——这是理论分析，不是测试）
3. **从错误信息中推导内部实现而非按文档指引恢复**（读源码"理解"工具行为）
4. **声称完成了某步骤但没有对应的工具调用**（空洞报告）

#### 遇到错误时的正确做法

- 读错误信息 → 根据错误信息调整参数 → 重试
- 如果连续失败 3 次 → 报告失败，说明尝试了什么、错误信息是什么
- **绝不**通过读源码来"理解"工具行为

#### MCP 测试模板

```
Agent(
  description="MCP {test_name}",
  model="haiku",
  prompt="""
你是一个 AI 助手，正在使用 RemNote 知识库 MCP 工具完成一个任务。

## ⛔ 工具限制（红线）

你**只能**使用 `mcp__remnote-bridge__*` 系列工具（如 mcp__remnote-bridge__health、mcp__remnote-bridge__read_tree 等）。

**以下行为直接判定测试无效（使用即判定无效，不是"禁止但可以试试"）**：
- Bash（禁止执行任何命令行）
- Read / Write / Edit（禁止读写任何文件）
- Glob / Grep（禁止搜索任何文件）
- Agent（禁止派生子代理）

**你没有权限访问项目源码。你的唯一信息来源是工具描述和工具返回值。**

## 测试环境（先读这个）

- 测试页面 ID：**{test_page_rem_id}**（直接使用此 ID，**禁止调用 search 或 read_globe 去找测试页面**）
- 所有数据必须创建在此页面的**子节点**下，不要修改测试页面本身
- 创建的数据请以 "{test_prefix}" 开头命名（MCP 接口用原始前缀如 `[0317-L2-01]`）

## ⛔ 禁止 headless 模式

connect 时**绝对禁止**传 headless=true。必须使用标准模式连接（不带任何参数调用 connect）。

## 🚫 作弊行为定义

以下任一行为 = 测试无效：
1. 读取项目源代码（src/、remnote-plugin/ 下的任何文件）
2. 不调用工具就报告工具的行为或返回值（"理论分析"不是测试）
3. 声称完成了某步骤但没有对应的工具调用
4. 使用 headless 模式连接

## 遇到错误时

- 读错误信息 → 根据错误信息调整参数 → 重试
- 连续失败 3 次 → 报告失败，说明尝试了什么、每次的错误信息
- **绝不**通过其他途径"理解"工具行为，错误信息本身就是你的指引

## 任务

{task_description}

## 输出要求

完成后报告：
1. 每一步操作（工具名 + 关键参数）
2. 每步结果（成功/失败 + 关键返回值）
3. 最终状态总结
4. 遇到的任何错误或困惑
"""
)
```

#### Skill 测试模板

```
Agent(
  description="Skill {test_name}",
  model="haiku",
  prompt="""
你是一个 AI 助手，通过 CLI 命令操作 RemNote 知识库。

## ⛔ 工具限制（红线）

你**只能**使用以下工具：
- Bash（执行 `remnote-bridge <command> --json` 命令）
- Read（**仅限**阅读 `skills/remnote-bridge/` 目录下的 Skill 文档）

**以下行为直接判定测试无效（使用即判定无效，不是"禁止但可以试试"）**：
- 任何 `mcp__remnote-bridge__*` 工具（禁止使用 MCP 接口）
- Write / Edit（禁止写文件）
- Glob / Grep（禁止搜索文件）
- Agent（禁止派生子代理）
- Read 读取 `src/`、`remnote-plugin/` 下的任何源码文件

**你没有权限访问项目源码。你的唯一信息来源是 Skill 文档和 CLI 命令返回值。**

## ⛔ 禁止 headless 模式

CLI 命令**绝对禁止**加 `--headless` 参数。必须使用标准模式连接。

## 🚫 作弊行为定义

以下任一行为 = 测试无效：
1. 读取项目源代码（src/、remnote-plugin/ 下的任何文件）
2. 不调用工具就报告工具的行为或返回值（"理论分析"不是测试）
3. 声称完成了某步骤但没有对应的工具调用
4. 使用 headless 模式连接

## 遇到错误时

- 读错误信息 → 根据错误信息调整参数 → 重试
- 连续失败 3 次 → 报告失败，说明尝试了什么、每次的错误信息
- **绝不**通过其他途径"理解"工具行为，错误信息本身就是你的指引

## 使用说明

- 先阅读 Skill 文档：用 Read 读取 `skills/remnote-bridge/SKILL.md`
- 所有命令格式：`remnote-bridge <command> --json '<JSON参数>'`
- 例如：`remnote-bridge health --json`
- 例如：`remnote-bridge read-tree --json '{"remId":"xxx","depth":2}'`

## 测试环境（先读这个）

- 测试页面 ID：**{test_page_rem_id}**（直接使用此 ID，**禁止搜索测试页面**）
- 所有数据必须创建在此页面的**子节点**下，不要修改测试页面本身
- 创建的数据请以 "{test_prefix}" 开头命名（Skill 接口用带 s 后缀的前缀如 `[0317-L2-01s]`）

## 任务

{task_description}

## 输出要求

完成后报告：
1. 每一步操作（命令 + 关键参数）
2. 每步结果（成功/失败 + 关键返回值）
3. 最终状态总结
4. 遇到的任何错误或困惑
"""
)
```

#### 占位符

| 占位符 | 示例 |
|:-------|:-----|
| `{task_description}` | 从 Step 1 的用例中取 |
| `{test_page_rem_id}` | `kLrIOHJLyMd8Y2lyA` |
| `{test_prefix}` | MCP: `[0317-L2-01]`，Skill: `[0317-L2-01s]` |
| `{test_name}` | `L2-01 生成学习笔记` |

#### 持久化（subagent 返回后立即执行）

subagent 返回后，**立即**将其完整输出保存到 `remnote-bridge-test-workspace/{test_id}-{interface}/transcript.md`。不要等到最后统一保存。

#### task_description 要点

- 具体明确（告诉 subagent 要创建什么数据、执行什么操作、预期什么结果）
- 步骤化（分 1234 步骤，低智能模型容易跟）
- 包含验证（最后一步要求 subagent 自己读回来确认）
- 第一步总是检查系统健康状态

### Step 3：独立审计 subagent transcript（⚠️ 反放水）

**subagent 执行完毕后，必须独立审计其 transcript。** 详见 §3.5 反放水红线。

审计清单（6 项，**全部必检**）：

1. **逐条检查工具调用**：工具名、参数、返回值是否合理
2. **矛盾检测**：有无自相矛盾（见 §3.5 规则 2）
3. **完整性检查**：用例要求的每一步是否都执行了（见 §3.5 规则 5）
4. **结论独立判定**：不照抄 subagent 的自我报告，基于工具调用事实独立得出结论
5. **🚫 纪律违反检测**：subagent 是否调用了 Read/Glob/Grep 读取 `src/` 或 `remnote-plugin/` 下的文件？→ **立即 FAIL**（不论其他结果如何）。MCP 测试中调用 Bash/Read/Glob 任何一个也是纪律违反。Skill 测试中调用任何 `mcp__remnote-bridge__*` 也是纪律违反。**任何接口使用了 headless 模式（connect headless=true 或 --headless）也是纪律违反。**
6. **🚫 空洞报告检测**：subagent 是否报告了结果但没有对应的工具调用？（关键词："根据代码分析..."、"预期错误信息为..."、"理论上应该..."、"从源码可知..."）→ **立即 FAIL**

输出审计结论：
- 工具调用是否合理：是/否 + 具体问题
- 是否有跳步：是/否 + 跳过了哪些
- 是否有矛盾：是/否 + 矛盾描述
- 纪律违反：是/否 + 具体违反行为
- 空洞报告：是/否 + 具体空洞声称
- transcript 判定：PASS / FAIL / SUSPICIOUS

### Step 4：Chrome 验收

> **红线：宁可误杀，不可放过。CLI/MCP 返回 ok:true 不代表成功——只有 RemNote 界面中实际状态正确才算 PASS。**

#### 4.1 操作流程

1. `mcp__claude-in-chrome__tabs_context_mcp` 获取当前浏览器 tab
2. 导航到 RemNote 测试页面
3. **必须刷新页面**（`location.reload()`）——确保看到最新数据
4. 等待页面加载（2-3 秒）
5. 展开所有测试数据节点：
   - 找到测试前缀标记的节点（如 `[0317-L2-01]`）
   - **点击节点左侧的三角箭头**展开子节点（RemNote 的折叠/展开控件）
   - 逐级展开直到所有层级都可见
   - 如果节点很多，用 `mcp__claude-in-chrome__javascript_tool` 执行点击自动化
6. `mcp__claude-in-chrome__computer` 截图
7. **立即**将截图保存到 `remnote-bridge-test-workspace/{test_id}-{interface}/screenshot-{N}.png`

#### 4.2 七维度检查表

对照 subagent 报告的"最终状态"和用例预期，逐一检查：

| # | 维度 | 检查项 | 常见陷阱 |
|:--|:-----|:-------|:---------|
| 1 | **文本内容** | 文字完全一致、无多余/缺失 | Unicode 全角/半角差异；分隔符残留 |
| 2 | **结构层级** | 父子关系正确、节点数量、顺序 | 节点挂到错误父级；创建部分失败 |
| 3 | **Rem 类型** | concept 加粗、descriptor/default 正常 | type 设置未生效 |
| 4 | **闪卡** | 方向正确（箭头/分隔符）、backText 存在 | practiceDirection 设错；backText 为空 |
| 5 | **格式属性** | H1/H2/H3 大小、highlightColor、todo 复选框 | 属性设置未生效 |
| 6 | **Portal** | 紫色边框存在、引用内容正确 | Portal 创建但无引用 |
| 7 | **标签** | 标签存在且名称正确 | 引用了错误的 tag Rem |

每个维度标记：✅ PASS / ❌ FAIL / ⬜ 不涉及 / ❓ 无法确认

#### 4.3 辅助验证

截图无法确认某些属性时（如 practiceDirection、backText 内容），**补充使用 MCP 工具验证**：
- 用 `read_rem` 获取目标 Rem 的完整属性
- 与预期值逐字段对比
- 工具验证是**补充**手段，不能替代截图验证

### Step 5：综合判定

基于 Step 3（审计）和 Step 4（Chrome 验收），给出最终判定：

| 条件 | 判定 |
|:-----|:-----|
| 审计 PASS + Chrome 全维度 PASS | **PASS** |
| 审计或 Chrome 任一维度 FAIL | **FAIL** |
| Chrome 无法拍到 / 数据不存在 / 截图看不清 | **INCONCLUSIVE** |
| Chrome PASS 但审计发现矛盾 | **FAIL**（过程不可信） |

**立即**将判定结果追加到 `remnote-bridge-test-workspace/results.md`（格式见 §6）。每完成一个用例就追加，不要等所有用例跑完再统一写。

### Step 6：FAIL → 归因（5 问排查决策树）

当判定为 FAIL 时，按以下顺序排查根因：

**Q1：subagent 是否调用了正确的工具？**
- 否 → **Doc 问题**：文档没有清楚说明该用什么工具
- 是 → 继续 Q2

**Q2：subagent 传的参数正确吗？**
- 否 → **Doc 问题**：参数说明不清楚（检查 tool description / SERVER_INSTRUCTIONS）
- 是 → 继续 Q3

**Q3：工具返回了错误吗？**
- 是 → **Tool 问题**：CLI/Plugin 代码有 bug
- 否 → 继续 Q4

**Q4：工具返回 ok:true 但 Chrome 显示不对？**
- 是 → **Verify 问题**：Plugin/SDK 层行为异常（需深入调查）
- 否 → 继续 Q5

**Q5：用 sonnet 对照测试通过吗？**
- 是 → **Model 问题**：haiku 能力不足，不是文档问题
- 否 → 回到 Q1-Q4 重新排查

归因类别：`Doc` / `Tool` / `Model` / `Verify`

### Step 7：修复（⛔ 你不碰代码——写 bug 报告，派 agent 去修）

**你的角色是 QA 测试员，不是开发者。** 你只负责精确描述 bug，然后派一个修复 agent 去处理。

#### 7.1 写 bug 报告

根据 Step 6 归因，写一份精确的 bug 描述，包含：

```
1. 归因类别：Doc / Tool / Verify
2. 症状：subagent 做了什么，得到了什么结果，预期是什么
3. 相关证据：transcript 中的关键工具调用和返回值
4. 修复方向建议（可选）：你觉得可能是哪里的问题
```

#### 7.2 派修复 agent

```
Agent(
  description="Fix {bug_summary}",
  prompt="""
  ## Bug 报告

  {你在 7.1 写的 bug 描述}

  ## 归因类别与修复范围

  - Doc：改 MCP tool description + SERVER_INSTRUCTIONS（src/mcp/）+ 同步 Skill 文档（skills/remnote-bridge/）
  - Tool：修复 CLI/Plugin 代码（src/cli/ 或 remnote-plugin/）
  - Verify：调查 Plugin/SDK 行为（remnote-plugin/services/）

  ## 修复原则

  - 每次只修一个问题
  - Doc 修复必须同步更新 Skill 文档和 MCP 文档（两侧保持一致）
  - Tool 修复如果改了 Plugin（remnote-plugin/）必须：
    1. bump 三处版本号（manifest.json + package.json + settings.ts）
    2. 编译 Plugin：`npm run build:plugin`（根目录脚本，等效于 `cd remnote-plugin && npm run build`）
    3. 编译 CLI/MCP：`npm run build`（根目录 tsc，只编译 src/）
    4. 注意：根目录 `npm run build` **不会**自动编译 Plugin，两者必须分别执行
  - Tool 修复如果只改了 CLI/MCP（src/）：`npm run build` 即可
  - 修完后确认编译无报错
  """
)
```

归因为 **Model** 的不需要修复，在 results.md 中注明即可。

#### 7.3 修复 agent 返回后

**⛔⛔⛔ 停！不要动手验证！⛔⛔⛔**

你现在的冲动是"快调个 read_rem / edit_rem 确认一下"——**这正是每次都犯的错**。

你接下来**唯一**要做的事 → **Step 8：派 haiku subagent 重测**。
不是自己调 MCP 工具。不是"快速看一眼"。不是"确认一下就好"。不是自己打开源码检查。
直接去 Step 8。现在就去。

### Step 8：Retest（⚠️ 必须重新派 subagent）

修复后的重测准备：

1. **编译**：根据修复范围执行对应编译
   - 改了 `src/`：`npm run build`
   - 改了 `remnote-plugin/`：`npm run build:plugin && npm run build`
2. **重启 daemon**：`disconnect()` → `connect()`
3. **刷新 RemNote**：用 Claude in Chrome 刷新页面（改了 Plugin 时必须，让 RemNote 加载新版 Plugin）
4. **确认就绪**：`health` 三层全绿

然后**必须**回到 Step 2，重新派 haiku subagent 跑同一个用例。

❌ 禁止自己跑命令验证修复效果
❌ 禁止"快速确认一下就行"
✅ 唯一正确做法：派 haiku subagent → 审计 → Chrome 验收 → 判定

**原因**：你自己验证通过不能说明文档+工具对 haiku 也 OK。测试的目标是验证文档质量，不是验证你的修复。

- 重测结果存入 `{test_id}/retest-N/` 目录
- 停止条件：PASS，或归因为 Model

---

## §3.5 反放水红线（验收者强制规则）

> **这 5 条规则是写给你（验收者/主 agent）的。你在 Step 3 和 Step 5 中必须严格遵守。**

### 规则 1：不信任 subagent 自我报告

- **禁止**照抄 subagent 说的"成功/失败"
- **必须**检查它实际调用了什么工具、传了什么参数、返回了什么
- **具体做法**：逐条检查 transcript 中的工具调用，对比参数和返回值是否合理
- subagent 说"已创建 3 个节点"→ 你要数它实际调了几次创建工具、每次返回了什么

### 规则 2：矛盾检测

以下任何一项出现，**立即标 FAIL**，不需要进一步分析：

- oldStr 和 newStr **完全相同**却声称修改成功
- 声称创建了 N 个节点但工具调用次数**明显不够**
- 声称操作成功但返回了 **error**
- 工具返回值与 subagent 报告的结果**不一致**

### 规则 3：Chrome 验证是唯一的 PASS 门槛

- Chrome 截图**无法拍到** / 数据不存在 / 截图看不清 → **不能标 PASS**，标 INCONCLUSIVE
- 工具返回 ok:true 但 Chrome 显示不对 → **FAIL**
- Chrome 显示正确但 transcript 有矛盾 → **FAIL**（过程不可信）
- **绝不能**因为"看起来差不多"就标 PASS——必须是"确认完全正确"

### 规则 4：INCONCLUSIVE 的处理

- INCONCLUSIVE **不等于** PASS，**不计入通过率**
- 必须查明原因后重测
- 常见原因：数据被清理了、页面没刷新、截图范围不够
- 在 results.md 中单独标记

### 规则 5：跳步检测

- 用例要求 5 步操作，subagent 只做了 3 步 → **不能只标部分 FAIL**
- 必须列出**所有跳过的步骤**，整体标 **FAIL**
- 跳步通常意味着文档不够清晰（归因 Doc）

---

## §4 Workspace 结构（⛔ 严格执行，不可自由发挥）

### 4.1 位置与生命周期

```
位置：项目根目录下 remnote-bridge-test-workspace/    ← 固定名，只有这一个
生命周期：每次测试开始时 rm -rf 清空并重建
```

**禁止**创建第二个 workspace 目录。**禁止**给目录名加日期后缀、iteration 前缀或任何变体。

### 4.2 内部结构（只允许以下形态）

```
remnote-bridge-test-workspace/
├── results.md                 # 汇总表（§6 格式）——每个用例判定后立即追加
├── L2-01-MCP/                 # 回归用例：{级别编号}-{接口}/
│   ├── transcript.md          # subagent 完整输出
│   └── screenshot-1.png       # Chrome 截图（可多张：screenshot-2.png ...）
├── L2-01-Skill/
│   ├── transcript.md
│   └── screenshot-1.png
├── L3-01-MCP/
│   ├── transcript.md
│   ├── screenshot-1.png
│   └── retest-1/              # 重测子目录（如有）
│       ├── transcript.md
│       └── screenshot-1.png
├── NEW-flashcard-01-MCP/      # 新功能用例：NEW-{功能名}-{编号}-{接口}/
│   ├── transcript.md
│   └── screenshot-1.png
└── ...
```

### 4.3 命名规则（锁死，违反 = 作废）

| 类型 | 格式 | 正确示例 | 错误示例 |
|:-----|:-----|:---------|:---------|
| 回归用例目录 | `L{级别}-{编号}-{接口}/` | `L1-01-MCP/`、`L2-03-Skill/` | ~~`L1-01/`~~（缺接口后缀） |
| 新功能用例目录 | `NEW-{功能名}-{编号}-{接口}/` | `NEW-flashcard-01-MCP/` | ~~`NEW-01-MCP/`~~（缺功能名） |
| 接口后缀 | **只允许** `-MCP` 或 `-Skill` | `L1-01-Skill/` | ~~`L1-01-CLI/`~~、~~`NEW-01/`~~ |
| 重测子目录 | `retest-{N}/` | `retest-1/`、`retest-2/` | ~~`retry/`~~、~~`iteration-1/`~~ |
| transcript 文件 | `transcript.md` | — | ~~`outputs/transcript.md`~~（禁止多层嵌套） |
| 截图文件 | `screenshot-{N}.png` | `screenshot-1.png` | ~~`screenshot.png`~~（必须带编号） |

**⛔ 禁止自创命名**：

| 实际出现过的违规 | 为什么错 |
|:----------------|:---------|
| `workspace-0318/` | 加了日期后缀 |
| `NEW-01-CLI/` | 接口后缀只允许 `-MCP` 或 `-Skill`，不存在 `-CLI` |
| `NEW-01/`、`NEW-02/` | 缺接口后缀 |
| `NEW-rit-01-MCP/` | 自创缩写 |
| `iteration-1/eval-tmpl-basic-MCP/with_skill/outputs/` | 自创多层嵌套结构 |

### 4.4 每个用例目录必须包含的文件

一个用例目录**至少**包含 2 个文件，否则该用例不完整：

```
{test_id}-{interface}/
├── transcript.md          # 必须：subagent 完整输出
└── screenshot-1.png       # 必须：Chrome 截图（至少 1 张）
```

**空目录 = 没有执行完**。禁止创建空目录"占位"。

### 4.5 持久化时机（每步紧跟一个写入）

| 步骤 | 产物 | 保存位置 | 时机 |
|:-----|:-----|:---------|:-----|
| Step 2 | subagent transcript | `{test_id}-{interface}/transcript.md` | subagent 返回后**立即** |
| Step 4 | Chrome 截图 | `{test_id}-{interface}/screenshot-{N}.png` | 截图后**立即** |
| Step 5 | 判定结果 | `results.md` 追加一行 | 判定后**立即** |

---

## §5 新功能测试规划

当有新功能或修改时，按以下原则动态规划测试方案。

### 5.1 变更分类

| 变更类型 | 示例 | 测试重点 |
|:---------|:-----|:---------|
| **新命令/工具** | 新增 `batch-edit` 命令 | 核心功能 + 参数组合 + 错误处理 |
| **现有命令修改** | edit-tree 支持新操作类型 | 新功能 + 原有功能不退化 |
| **Bug 修复** | 修复 edit-rem 的 tags diff 逻辑 | 复现原 bug + 修复后行为 + 相关回归 |
| **文档修改** | 重写 edit-tree instructions | 文档可理解性（haiku 能否仅凭新文档完成操作） |
| **Plugin 修改** | 修改 services/read-tree.ts | 受影响的 CLI 命令端到端测试 |
| **MCP 层修改** | 修改 tool description | MCP subagent 能否正确使用 |

### 5.2 影响范围清单

逐一确认：

- 涉及哪些 CLI 命令？
- 涉及哪些 MCP 工具？
- 改了参数/返回值格式吗？
- 改了错误信息/错误处理吗？
- 改了缓存行为或防线逻辑吗？
- 有跨命令/跨层的连带影响吗？

### 5.3 用例设计原则

**从简单到复杂**：先验证核心功能，再测边界。基础不行，复杂白测。

**自生成数据**：每个测试自己在测试页面下创建数据，不依赖预置状态。

**可验收性**：每个用例必须有明确的"Chrome 怎么看、看什么、对才算对"。

**适合低智能模型**：步骤清晰，不需要复杂推理。

### 5.4 不同变更类型的用例策略

**新功能**：
1. Happy path：最基本的正确用法（1-2 个）
2. 参数变体：不同参数组合（按需 1-3 个）
3. 与现有功能组合：新旧功能一起使用（1-2 个）
4. 边界情况：空值、极大值、非法值（按需）
5. 错误处理：预期的错误场景（1-2 个）

**Bug 修复**：
1. 复现用例：重现原始 bug 的精确场景
2. 修复验证：同样场景，预期正确行为
3. 回归用例：相关功能是否仍正常

**文档修改**：
1. 核心流程：文档中描述的主要流程能否走通
2. 新增说明：新增的指引是否清晰
3. 易混淆点：文档中容易误解的部分

### 5.5 用例模板

```
名称：简短描述（如 "edit-tree 新增行带 type 元数据"）
前缀：测试数据命名前缀（如 "[0317-meta]"）
目的：这个测试验证什么

task_description:
  1. 确认连接正常
  2. 读取测试页面子树
  3. 创建什么测试数据
  4. 执行什么操作
  5. 读取并验证结果

Chrome 验证：
  - 维度 1：预期状态
  - 维度 2：预期状态
```

### 5.6 粒度参考

| 太粗 ❌ | 合适 ✅ | 太细 ❌ |
|:--------|:--------|:--------|
| "测试 edit-tree" | "edit-tree 创建 3 个子节点并验证" | "edit-tree 创建 1 个节点" |
| "测试闪卡功能" | "创建正向+反向+双向闪卡并验证方向" | "创建 1 个正向闪卡" |

### 5.7 混合使用

新功能测试后通常跟一轮回归：先测新功能（模式 A），再跑受影响级别的回归用例（模式 B），确认改动没搞坏其他东西。

---

## §6 results.md 格式

所有测试结果记入 workspace 根目录的 `results.md`，使用 Markdown 表格：

### 汇总表

```markdown
# 测试结果

日期：YYYY-MM-DD
触发原因：[回归测试 / 新功能：xxx]

## 汇总

| 指标 | 值 |
|:-----|:---|
| 总用例数 | N |
| PASS | N |
| FAIL | N |
| INCONCLUSIVE | N |
| 通过率 | N%（不含 INCONCLUSIVE） |

## 详细结果

| 用例 | 判定 | 归因 | 失败维度 | 备注 |
|:-----|:-----|:-----|:---------|:-----|
| L1-01 | PASS | — | — | — |
| L2-01 | FAIL | Doc | 结构层级 | subagent 未理解 edit-tree 缩进规则 |
| L2-02 | INCONCLUSIVE | — | — | 数据已被清理，Chrome 无法验证 |
| NEW-flash-01 | PASS | — | — | — |

## 失败详情

### L2-01：FAIL（Doc）

**审计发现**：
- subagent 调用了 edit_tree 但 oldStr 缩进错误
- 返回 "old_str not found" 错误
- subagent 没有重试，直接报告成功（矛盾！）

**Chrome 验证**：
- 结构层级 ❌：节点未创建

**归因**：文档中未强调缩进必须精确匹配

**修复**：更新 edit_tree tool description 中关于缩进的说明
```

### 重测记录

FAIL 修复后重测时，追加到同一个 results.md：

```markdown
## 重测记录

### L2-01 Retest-1（YYYY-MM-DD）

修复内容：更新 edit_tree tool description 缩进说明
判定：PASS
备注：subagent 第二次正确构造了 oldStr
```

---

## §7 Reference 索引

| 文件 | 何时读取 | 内容 |
|:-----|:---------|:-----|
| `references/regression-suite.md` | 模式 B：选择回归用例时 | 固定基线用例集（L1-L5），包含 task_description + 断言 + Chrome 验证点 |
| `references/verification-guide.md` | 需要深入了解验收细节时（可选） | Chrome 截图验收的完整版指南，核心内容已内联到 §3 Step 4 |

---

## §8 快速开始（⚠️ 你的实际执行入口 — 严格按此清单操作）

> **这是你开始测试时应该跟的步骤。不要凭记忆自由发挥，逐条执行。**

### 回归测试（模式 B）

**0. 创建 workspace（固定名，先清空）**
```
rm -rf remnote-bridge-test-workspace && mkdir remnote-bridge-test-workspace
```
⚠️ **固定名 `remnote-bridge-test-workspace/`**。禁止创建第二个目录。禁止加日期后缀。详见 §4。

**1. 编译 + 重启（每次测试前必须执行）**
```
a. npm run build                       ← 编译 CLI/MCP（src/ → dist/）
b. 如果 remnote-plugin/ 有改动：
   npm run build:plugin                ← 编译 Plugin（Webpack，独立于根 build）
c. disconnect()                        ← 停掉旧的 daemon（如果在运行的话）
d. connect()                           ← 重新启动（⛔ 不带参数，禁止 headless）
e. 用 Claude in Chrome 导航到 RemNote 并刷新页面  ← 你自己刷新，禁止叫用户操作
f. health 确认三层就绪
g. 不通 → 再刷新一次 → 再 health → 仍不通则停止，报告连接问题
```

⚠️ `npm run build`（根目录）**只编译 src/**，不会编译 Plugin。改了 `remnote-plugin/` 必须额外跑 `npm run build:plugin`。

**2. 选用例**
- 读 `references/regression-suite.md` → 选择级别和用例
- 从 L1 开始逐级执行（L1 不过则停止）
- 测试页面 ID = `kLrIOHJLyMd8Y2lyA`（§2 写死的，直接用，**禁止调 search/read_globe 去找**）

**3. 每个用例（⚠️ 你是调度员，不是执行者）**
```
a. 派 haiku subagent（用 §3 MCP/Skill 模板）     ← 你不能自己跑 MCP/CLI 命令
b. subagent 返回 → 立即写 transcript.md
c. 审计 transcript（6 项清单，见 Step 3）
d. Chrome 截图验收 → 立即保存 screenshot
e. 综合判定 → 立即追加 results.md
f. 如果 FAIL：
   归因（Step 6）→ 写 bug 报告 → 派修复 agent 去改代码（Step 7）← 你不碰代码
   → ⛔ 修复 agent 返回后不要自己验证 → 派 haiku subagent 重测（Step 8）
```

**4. 双接口策略**
- L1-L2 **必须** MCP + Skill 各跑一遍
- L3 推荐双接口（时间允许）
- L4-L5 仅 MCP

**5. 全 PASS → 回归通过**

### 新功能测试（模式 A）

**0. 创建 workspace（固定名，先清空）**（同回归测试步骤 0）

**1. 编译 + 重启**（同回归测试步骤 1：build → disconnect → connect → Chrome 刷新 → health）

**2. 规划用例**：按 §5 分析变更、设计用例

**3. 逐个用例执行**（同上 步骤 3，每步产物立即持久化）

**4. 全 PASS → 跑受影响级别的回归用例确认无退化**
