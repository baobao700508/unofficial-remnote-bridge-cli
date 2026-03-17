---
name: remnote-bridge-test
description: "remnote-bridge 项目的 MCP 和 Skill 测试规划与执行框架。支持两种模式：(A) 新功能测试——动态规划测试方案；(B) 回归测试——跑固定基线用例确认没退化。两种模式都通过低智能 subagent 在干净上下文中执行，配合 Chrome 严格截图验收，并内置自循环修复流程（test→grade→fix→retest）。当用户提到：测试、test、回归测试、regression、跑测试、验证功能、测试 MCP、测试 Skill、新功能验收——都应触发此 skill。即使只说'测一下'也应触发。"
---

# remnote-bridge 测试框架

两种测试模式 + 自循环修复：

- **模式 A — 新功能测试**：动态规划，针对具体变更生成用例
- **模式 B — 回归测试**：固定基线用例，确认已有功能没退化
- **自循环**：test → grade → 归因 → fix(文档/代码) → retest，直到全 PASS

---

## 1. 双重目标

| 维度 | 测什么 | 怎么暴露 |
|:-----|:-------|:---------|
| **文档质量** | 低智能模型能否仅凭文档完成操作 | haiku subagent 空上下文执行 |
| **工具能力** | 工具在各种场景下是否可靠 | Chrome 截图严格验收 |

---

## 2. 两种模式

### 模式 A：新功能测试

**触发时机**：新增功能、修改现有功能、修复 bug 后

```
分析变更 → 动态规划用例 → 执行 → 验收 → 自循环修复
```

详见 `references/test-planning.md`。

### 模式 B：回归测试

**触发时机**：发布前、大改后、定期检查

```
从回归基线中选择用例 → 执行 → 验收 → 自循环修复
```

回归用例按级别组织（L1 基础设施 → L5 极端边界），详见 `references/regression-suite.md`。

### 混合使用

新功能测试后通常跟一轮回归：先测新功能（模式 A），再跑受影响级别的回归用例（模式 B），确认改动没搞坏其他东西。

---

## 3. 自循环修复（核心流程）

直接使用 **Skill Creator**（`~/.claude/skills/skill-creator/`）的迭代基础设施来驱动 test → grade → fix → retest 循环。

### 关键引用

| Skill Creator 资源 | 本框架用途 |
|:-------------------|:-----------|
| `agents/grader.md` | 评分 subagent 输出——逐条 assertion pass/fail + evidence |
| `agents/analyzer.md` | 分析 benchmark 数据，发现聚合指标掩盖的模式 |
| `eval-viewer/generate_review.py` | 生成 HTML 结果查看器，让用户浏览每个测试的输出 + 截图 + 评分 |
| `scripts/aggregate_benchmark.py` | 聚合多轮结果为 benchmark.json（pass_rate / time / tokens） |
| `references/schemas.md` | grading.json / benchmark.json / eval_metadata.json 的 JSON 格式规范 |

### 循环步骤

```
Step 1: 派出 subagent（haiku）执行测试
        ├─ MCP 版 + Skill 版 可并行
        └─ 每个 run 保存到 remnote-bridge-test-workspace/iteration-N/eval-{id}/{with_skill,without_skill}/

Step 2: Chrome 严格截图验收（⚠️ 宁可误杀不可放过）
        └─ 截图存入 outputs/

Step 3: 评分（读 Skill Creator 的 agents/grader.md）
        ├─ 对每个 assertion 判 pass/fail + 引用 evidence
        ├─ 提取 claims 并验证
        └─ 输出 grading.json（格式见 Skill Creator references/schemas.md）

Step 4: 聚合 + 分析
        ├─ 运行 Skill Creator scripts/aggregate_benchmark.py 生成 benchmark.json
        ├─ 读 agents/analyzer.md 做分析 pass（发现聚合指标掩盖的模式）
        └─ 运行 eval-viewer/generate_review.py 生成 HTML 查看器

Step 5: 用户审阅 + 归因
        ├─ PASS → ✅ 进入下一个用例
        └─ FAIL → 归因：
            ├─ Doc（文档问题）→ 修改 Skill instructions 或 MCP description
            ├─ Tool（工具 bug）→ 修复 CLI/Plugin 代码
            ├─ Model（模型限制）→ sonnet 对照确认
            └─ Verify（验收差异）→ 深入调查 Plugin/SDK

Step 6: 修复 → retest（回到 Step 1，iteration-N+1）
        ├─ 每次只修一个问题
        ├─ generate_review.py --previous-workspace 对比前后变化
        └─ 停止条件：全 PASS，或剩余 FAIL 归因为 Model
```

### workspace 目录结构

遵循 Skill Creator 的 workspace 约定：

```
remnote-bridge-test-workspace/
├── iteration-1/
│   ├── eval-{test-id}-MCP/
│   │   ├── with_skill/outputs/       # subagent 输出 + 截图
│   │   ├── without_skill/outputs/    # baseline（可选：无 Skill/MCP 描述的对照）
│   │   ├── eval_metadata.json        # prompt + assertions
│   │   ├── grading.json              # Skill Creator grader 输出
│   │   └── timing.json               # token / duration
│   ├── eval-{test-id}-Skill/
│   │   └── ...
│   ├── benchmark.json                # aggregate_benchmark.py 输出
│   └── benchmark.md                  # 可读摘要
├── iteration-2/
│   └── ...
└── history.json
```

---

## 4. 测试环境

### 测试页面

默认：`kLrIOHJLyMd8Y2lyA`（"MCP 测试"文档）

- 不操作测试页面本身，只在其子节点下创建
- 数据加前缀（日期+功能，如 `[0317-flashcard]`）
- 每轮测试前确认页面下无残留或已清理

### 模型配置

| 角色 | 模型 | 原因 |
|:-----|:-----|:-----|
| 执行者 | **haiku** | 暴露文档质量问题 |
| 验收者 | 当前模型 | Chrome 截图严格对比 |
| 对照组 | sonnet | 区分 Doc 问题 vs Model 限制 |

### 前置条件

`health` 三层全绿。基础设施不通，后续没意义。

---

## 5. MCP vs Skill 隔离

每个用例在两个接口**分别**跑一遍：

| 接口 | subagent 能力 | 知识来源 |
|:-----|:-------------|:---------|
| **MCP** | MCP 工具（自动继承） | 仅工具描述 + SERVER_INSTRUCTIONS |
| **Skill** | Bash + Read | 仅 SKILL.md + instructions/*.md |

如果 MCP 过 Skill 不过（或反过来），说明某一侧的文档有问题。

---

## 6. Reference 索引

### 本 Skill 文档

| 文件 | 何时读取 |
|:-----|:---------|
| `references/test-planning.md` | 模式 A：规划新功能测试时 |
| `references/regression-suite.md` | 模式 B：选择回归用例时 |
| `references/subagent-templates.md` | 构造 subagent 提示词时 |
| `references/verification-guide.md` | Chrome 验收时（**每次都读**） |

### Skill Creator 引用（`~/.claude/skills/skill-creator/`）

| 文件 | 何时读取 |
|:-----|:---------|
| `agents/grader.md` | 评分 subagent 输出时——按其规范生成 grading.json |
| `agents/analyzer.md` | 聚合数据后做分析 pass 时 |
| `references/schemas.md` | 需要确认 grading.json / benchmark.json 格式时 |
| `eval-viewer/generate_review.py` | 生成 HTML 查看器供用户审阅时 |
| `scripts/aggregate_benchmark.py` | 聚合多个 eval 结果为 benchmark 时 |

---

## 7. 快速开始

### 新功能测试（模式 A）

```
1. 读 references/test-planning.md → 分析变更、规划用例
2. 确认 health 三层就绪
3. 读 references/subagent-templates.md → 填充 prompt
4. 派 haiku subagent（MCP）→ 读 references/verification-guide.md → 验收
5. 派 haiku subagent（Skill）→ 验收
6. FAIL？→ 归因 → 修复 → retest（自循环）
7. 全 PASS → 跑相关回归用例确认无退化
```

### 回归测试（模式 B）

```
1. 读 references/regression-suite.md → 选择级别
2. 确认 health 三层就绪
3. 从 L1 开始逐级执行（L1 不过则停止）
4. 每个用例：派 subagent → Chrome 验收
5. FAIL？→ 归因 → 修复 → retest
6. 全 PASS → 回归通过
```
