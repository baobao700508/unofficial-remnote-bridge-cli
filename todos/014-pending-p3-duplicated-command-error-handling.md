---
status: pending
priority: p3
issue_id: "014"
tags: [code-review, quality, pattern]
dependencies: []
---

# 命令文件重复的错误处理模式

## Problem Statement

`read-rem.ts`、`edit-rem.ts` 等命令文件中有大量重复的 try/catch + DaemonNotRunningError/DaemonUnreachableError 判断逻辑。随着命令增多，重复代码会膨胀。

## Findings

- **来源**: kieran-typescript-reviewer, pattern-recognition-specialist
- **位置**: `remnote-cli/src/commands/read-rem.ts`, `edit-rem.ts`
- **证据**: 相同的 catch 分支在多个命令文件中复制粘贴

## Proposed Solutions

### Solution A: 提取公共的命令执行包装函数
- 创建 `withDaemonRequest(action, payload, options)` 包装函数
- 统一处理错误分类和 JSON 输出格式化
- **Pros**: 消除重复
- **Cons**: 需要灵活的 options 设计
- **Effort**: Small
- **Risk**: Low

## Technical Details

- **Affected files**: `remnote-cli/src/commands/*.ts`

## Acceptance Criteria

- [ ] 错误处理逻辑只有一份
- [ ] 新增命令不需要复制 catch 代码

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-04 | 代码审查发现 | 来自 kieran-typescript-reviewer + pattern-recognition |
