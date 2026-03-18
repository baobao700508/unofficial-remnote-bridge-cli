---
name: remnote-bridge-test
description: "remnote-bridge 项目的 MCP 测试执行框架。支持两种模式：(A) 新功能测试——动态规划测试方案；(B) 回归测试——跑固定基线用例确认没退化。通过低智能 subagent 在干净上下文中执行，配合 Chrome 严格截图验收，内置自循环修复流程（test→审计→验收→归因→fix→retest）。当用户提到：测试、test、回归测试、regression、跑测试、验证功能、测试 MCP、新功能验收——都应触发此 skill。即使只说'测一下'也应触发。"
---

# remnote-bridge 测试框架

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

### 前置条件

`health` 三层全绿（daemon / Plugin / SDK）。基础设施不通，后续没意义。

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

- 回归测试：`[日期-级别编号]`，如 `[0317-L2-01]`
- 新功能测试：`[日期-功能名]`，如 `[0317-flashcard]`

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

使用 haiku subagent 执行测试。**每个用例必须在 MCP 和 Skill 两个接口各跑一遍**——一侧过另一侧不过说明对应接口的文档有问题。

隔离通过 **prompt 纪律** 实现（Claude Code 的 Agent 工具不支持自定义 `subagent_type` 限制工具集）：
- MCP 模板：明确禁止使用 Bash/Read/Glob，只用 `mcp__remnote-bridge__*` 工具
- Skill 模板：明确禁止使用 MCP 工具，只用 Bash + Read 执行 CLI 命令

> **⚠️ 上下文污染**：subagent 会继承 MCP SERVER_INSTRUCTIONS 和所有工具描述，无法真正隔离上下文。但通过 prompt 纪律约束 subagent 只使用指定接口——如果它仍然调用了被禁止的工具，审计时（Step 3）会捕获并标 FAIL。

#### MCP 测试模板

```
Agent(
  description="MCP {test_name}",
  model="haiku",
  prompt="""
你是一个 AI 助手，正在使用 RemNote 知识库 MCP 工具完成一个任务。

## ⛔ 工具限制（红线）

你**只能**使用 `mcp__remnote-bridge__*` 系列工具（如 mcp__remnote-bridge__health、mcp__remnote-bridge__read_tree 等）。

**禁止**使用以下工具，即使它们可用：
- Bash（禁止执行任何命令行）
- Read / Write / Edit（禁止读写文件）
- Glob / Grep（禁止搜索文件）

违反此限制 = 测试失败。

## 任务

{task_description}

## 测试环境

- 测试页面 ID：{test_page_rem_id}
- 所有数据必须创建在此页面的**子节点**下，不要修改测试页面本身
- 创建的数据请以 "{test_prefix}" 开头命名

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
- Read（阅读 Skill 文档）

**禁止**使用以下工具，即使它们可用：
- 任何 `mcp__remnote-bridge__*` 工具（禁止使用 MCP 接口）
- Write / Edit（禁止写文件）

违反此限制 = 测试失败。

## 使用说明

- 先阅读 Skill 文档：用 Read 读取 `skills/remnote-bridge/SKILL.md`
- 所有命令格式：`remnote-bridge <command> --json '<JSON参数>'`
- 例如：`remnote-bridge health --json`
- 例如：`remnote-bridge read-tree --json '{"remId":"xxx","depth":2}'`

## 任务

{task_description}

## 测试环境

- 测试页面 ID：{test_page_rem_id}
- 所有数据必须创建在此页面的**子节点**下，不要修改测试页面本身
- 创建的数据请以 "{test_prefix}" 开头命名

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
| `{test_prefix}` | `[0317-L2-01]` |
| `{test_name}` | `L2-01 生成学习笔记` |

#### 审计时检查工具纪律

Step 3 审计 transcript 时，**额外检查**：
- MCP 测试：subagent 是否调用了 Bash/Read/Glob？→ 如果是，标 FAIL（纪律违反）
- Skill 测试：subagent 是否调用了 `mcp__remnote-bridge__*`？→ 如果是，标 FAIL（纪律违反）

#### task_description 要点

- 具体明确（告诉 subagent 要创建什么数据、执行什么操作、预期什么结果）
- 步骤化（分 1234 步骤，低智能模型容易跟）
- 包含验证（最后一步要求 subagent 自己读回来确认）
- 第一步总是检查系统健康状态

### Step 3：独立审计 subagent transcript（⚠️ 反放水）

**subagent 执行完毕后，必须独立审计其 transcript。** 详见 §3.5 反放水红线。

审计清单：

1. **逐条检查工具调用**：工具名、参数、返回值是否合理
2. **矛盾检测**：有无自相矛盾（见 §3.5 规则 2）
3. **完整性检查**：用例要求的每一步是否都执行了（见 §3.5 规则 5）
4. **结论独立判定**：不照抄 subagent 的自我报告，基于工具调用事实独立得出结论

输出审计结论：
- 工具调用是否合理：是/否 + 具体问题
- 是否有跳步：是/否 + 跳过了哪些
- 是否有矛盾：是/否 + 矛盾描述
- transcript 判定：PASS / FAIL / SUSPICIOUS

### Step 4：Chrome 验收

> **红线：宁可误杀，不可放过。CLI/MCP 返回 ok:true 不代表成功——只有 RemNote 界面中实际状态正确才算 PASS。**

#### 4.1 操作流程

1. `mcp__claude-in-chrome__tabs_context_mcp` 获取当前浏览器 tab
2. 导航到 RemNote 测试页面
3. **必须刷新页面**（`location.reload()`）——确保看到最新数据
4. 等待页面加载（2-3 秒）
5. 展开所有测试数据节点（找到测试前缀标记的节点，展开所有层级）
6. `mcp__claude-in-chrome__computer` 截图

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

将结果记入 results.md（格式见 §6）。

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

### Step 7：修复

根据归因类别执行修复：

| 归因 | 修复方式 | 修改什么 |
|:-----|:---------|:---------|
| **Doc** | 改善文档描述 | MCP tool description + SERVER_INSTRUCTIONS（`src/mcp/`） |
| **Tool** | 修复 CLI/Plugin 代码 bug | `src/cli/` 或 `remnote-plugin/` |
| **Model** | 标记为模型限制，不修复 | results.md 中注明 |
| **Verify** | 深入调查 Plugin/SDK 行为 | `remnote-plugin/services/` 或上报 SDK bug |

**修复原则**：
- 每次只修一个问题
- Doc 修复后必须同步更新 Skill 文档和 MCP 文档（接入层文档同步红线）
- Tool 修复后如果改了 Plugin 必须 bump 版本号

### Step 8：Retest

修复后重新进入 Step 2，用同一个用例重测。

- 重测结果存入 `{test_id}/retest-N/` 目录
- 停止条件：全 PASS，或剩余 FAIL 归因为 Model

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

## §4 Workspace 结构

```
remnote-bridge-test-workspace/
├── results.md              # 所有结果汇总表（格式见 §6）
├── L2-01-MCP/
│   ├── transcript.md       # mcp-tester subagent 输出
│   └── screenshot.png      # Chrome 截图
├── L2-01-Skill/
│   ├── transcript.md       # skill-tester subagent 输出
│   └── screenshot.png
├── L3-01-MCP/
│   ├── transcript.md
│   ├── screenshot.png
│   └── retest-1/           # 重测（如有）
│       ├── transcript.md
│       └── screenshot.png
├── L3-01-Skill/
│   └── ...
├── NEW-flashcard-01-MCP/   # 新功能测试用例
│   └── ...
└── ...
```

**命名规则**：
- 回归用例：`L{级别}-{编号}-{接口}/`（如 `L2-01-MCP/`、`L2-01-Skill/`）
- 新功能用例：`NEW-{功能名}-{编号}-{接口}/`（如 `NEW-flashcard-01-MCP/`）
- 接口后缀：`-MCP` 或 `-Skill`，每个用例两个目录

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

## §8 快速开始

### 回归测试（模式 B）

```
1. 确认 health 三层就绪
2. 读 references/regression-suite.md → 选择级别和用例
3. 从 L1 开始逐级执行（L1 不过则停止）
4. 每个用例执行核心循环：
   Step 2 → 派 haiku subagent（用 §3 模板）
   Step 3 → 独立审计 transcript（遵守 §3.5 反放水）
   Step 4 → Chrome 截图验收（7 维度）
   Step 5 → 综合判定
   Step 6-8 → FAIL 则归因→修复→重测
5. 全 PASS → 回归通过，记入 results.md
```

### 新功能测试（模式 A）

```
1. 按 §5 分析变更、规划用例
2. 确认 health 三层就绪
3. 逐个用例执行核心循环（同上 Step 2-8）
4. 全 PASS → 跑受影响级别的回归用例确认无退化
5. 结果记入 results.md
```
