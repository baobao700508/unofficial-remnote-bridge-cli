---
status: resolved
priority: p2
issue_id: "005"
tags: [code-review, quality, bug]
dependencies: []
---

# send-request.ts responseTimer 在 ws error 时未清理

## Problem Statement

`send-request.ts` 中的 `responseTimer` 只在收到响应时 `clearTimeout`，但在 `ws.on('error')` 路径中未清理，导致定时器泄漏（timer 到期后对已关闭的 ws 调用 terminate）。

## Findings

- **来源**: performance-oracle, kieran-typescript-reviewer
- **位置**: [send-request.ts:70-73](remnote-cli/src/daemon/send-request.ts#L70-L73) 和 [send-request.ts:100-103](remnote-cli/src/daemon/send-request.ts#L100-L103)
- **证据**: `ws.on('error')` 回调只清理了 `connectTimer`，没有清理 `responseTimer`
- **影响**: CLI 进程可能被残留 timer 阻止退出

## Proposed Solutions

### Solution A: 在 error handler 中也清理 responseTimer
- 将 `responseTimer` 声明提升到 `ws.on('open')` 之外，在 error handler 中也 clearTimeout
- **Pros**: 一行修复
- **Cons**: 无
- **Effort**: Small
- **Risk**: Low

## Technical Details

- **Affected files**: `remnote-cli/src/daemon/send-request.ts`

## Acceptance Criteria

- [x] ws error 事件触发时 responseTimer 被正确清理
- [x] CLI 进程在连接错误后能正常退出

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-04 | 代码审查发现 | 来自 performance-oracle + kieran-typescript-reviewer |
| 2026-03-04 | 已修复 | responseTimer 提升到外层作用域，ws.on('error') 中也 clearTimeout |
