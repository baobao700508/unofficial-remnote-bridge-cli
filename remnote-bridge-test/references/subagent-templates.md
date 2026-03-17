# Subagent 提示词模板

MCP 和 Skill 两种接口的 subagent 提示词模板。每次测试时根据具体用例填充。

---

## 1. MCP 测试模板

MCP subagent 自动继承父进程的 MCP 工具配置，拥有 remnote-bridge 的所有 MCP 工具。它的知识来源**仅有** MCP 工具描述和 SERVER_INSTRUCTIONS。

```
你是一个 AI 助手，正在使用 RemNote 知识库操作工具完成一个任务。

你拥有一组 MCP 工具可以操作 RemNote 知识库。请仔细阅读每个工具的描述来了解用法。

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
```

### 派出参数

```python
Agent(
    description="MCP {test_name}",
    prompt=filled_template,
    model="haiku",  # 低智能暴露文档问题
)
```

---

## 2. Skill 测试模板

Skill subagent 需要自己读取 Skill 文档，然后用 Bash 执行 CLI 命令。

```
你是一个 AI 助手，需要使用 remnote-bridge 命令行工具操作 RemNote 知识库。

## 第一步：阅读文档

请先阅读以下文件了解工具用法：
1. {skill_path}/SKILL.md（主文档，先看命令决策和工作流部分）
2. 根据任务需要，阅读 {skill_path}/instructions/ 下的具体命令文档

## 任务

{task_description}

## 测试环境

- 测试页面 ID：{test_page_rem_id}
- 所有数据必须创建在此页面的**子节点**下，不要修改测试页面本身
- 创建的数据请以 "{test_prefix}" 开头命名

## 执行方式

使用 Bash 执行 `remnote-bridge` 命令。使用 `--json` 模式（参数打包为 JSON 字符串）。

## 输出要求

完成后报告：
1. 阅读了哪些文档
2. 每一步命令（完整命令行）
3. 每步结果（成功/失败 + 关键返回值）
4. 最终状态总结
5. 遇到的任何错误或文档不清楚的地方
```

### 派出参数

```python
Agent(
    description="Skill {test_name}",
    prompt=filled_template,
    model="haiku",
)
```

---

## 3. 占位符说明

| 占位符 | 说明 | 示例 |
|:-------|:-----|:-----|
| `{task_description}` | 具体测试任务，从测试计划中来 | "在测试页面下创建 3 个闪卡..." |
| `{test_page_rem_id}` | 测试页面 remId | `kLrIOHJLyMd8Y2lyA` |
| `{test_prefix}` | 数据命名前缀（日期+功能） | `[0317-flashcard]` |
| `{test_name}` | 测试名称（用于 Agent description） | `闪卡创建测试` |
| `{skill_path}` | Skill 文档绝对路径 | 项目根下 `skills/remnote-bridge` |

---

## 4. task_description 编写要点

### 好的 task_description

- **具体明确**：告诉 subagent 要创建什么数据、执行什么操作、预期什么结果
- **步骤化**：分 1234 步骤，低智能模型容易跟
- **包含验证**：最后一步要求 subagent 自己读回来确认

### 示例

```
在测试页面下创建一个知识结构并验证。

1. 确认连接正常（检查系统状态）
2. 读取测试页面的子树
3. 在测试页面下创建以下结构：
   - "[0317-cdf] 线性回归"（概念类型，双向闪卡，背面文本："最基本的回归模型"）
     - "[0317-cdf] 假设"（正向闪卡，背面文本："因变量与自变量呈线性关系"）
     - "[0317-cdf] 损失函数"（正向闪卡，背面文本："均方误差 MSE"）
4. 读取创建的结构，确认：
   - "线性回归" 的类型是 concept
   - "线性回归" 的 practiceDirection 是 both
   - 两个子节点的 practiceDirection 是 forward
   - 所有 backText 内容正确
```

### 避免

- ❌ "测试 edit-tree 功能"（太模糊）
- ❌ 不说创建什么数据就让 subagent 测试（数据从哪来？）
- ❌ 不包含验证步骤（subagent 做完就走，不知道对不对）

---

## 5. 基础设施检查

每个测试的第一步都应确认连接状态。如果连接不通，后续操作全部失败。

**MCP**："检查系统状态"→ subagent 应调用 `health` 工具
**Skill**："确认连接正常"→ subagent 应执行 `remnote-bridge health --json`

如果 subagent 报告连接错误，主 Agent 先自己确认 daemon 状态，排除环境问题后再重试。
