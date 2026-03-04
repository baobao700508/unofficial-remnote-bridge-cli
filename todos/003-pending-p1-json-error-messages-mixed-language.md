---
status: pending
priority: p1
issue_id: "003"
tags: [code-review, architecture]
dependencies: []
---

# --json 模式下错误消息中英文混杂

## Problem Statement

在 `--json` 结构化输出模式下，错误消息混合了中文和英文（如 "Plugin 未连接，请确认 RemNote 已打开且插件已激活"）。Agent（Skills / MCP）依赖机器可解析的 JSON 输出，中文消息难以被程序可靠匹配和处理。

## Findings

- **来源**: agent-native-reviewer, architecture-strategist
- **位置**: 多处 — `ws-server.ts:243`, `send-request.ts:21`, `daemon/pid.ts`, 各 command 文件
- **证据**: error 字段包含中文描述，无 errorCode 分类字段
- **影响**: Agent 无法通过字符串匹配可靠识别错误类型

## Proposed Solutions

### Solution A: 添加 errorCode 字段 + 保留中文 message
- JSON 输出增加 `errorCode` 字段（如 `PLUGIN_NOT_CONNECTED`, `DAEMON_NOT_RUNNING`）
- `error` 字段保留中文（人类可读），Agent 通过 `errorCode` 分类
- **Pros**: 向后兼容，人类和 Agent 都能用
- **Cons**: 需要定义 errorCode 枚举
- **Effort**: Medium
- **Risk**: Low

### Solution B: 错误消息全部改为英文
- **Pros**: 简单直接
- **Cons**: 人类可读输出也变英文，与项目中文风格不一致
- **Effort**: Small
- **Risk**: Medium（影响用户体验）

## Recommended Action

（待评审后决定）

## Technical Details

- **Affected files**: `remnote-cli/src/server/ws-server.ts`, `remnote-cli/src/daemon/send-request.ts`, `remnote-cli/src/commands/*.ts`, `remnote-cli/src/protocol.ts`
- **Components**: 所有产生错误消息的位置

## Acceptance Criteria

- [ ] --json 模式下每个错误都有机器可解析的 errorCode
- [ ] errorCode 枚举有完整定义
- [ ] 人类可读模式下仍显示友好的中文消息

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-04 | 代码审查发现 | 来自 agent-native-reviewer + architecture-strategist |

## Resources

- PR branch: `feat/cli-connect-health`
