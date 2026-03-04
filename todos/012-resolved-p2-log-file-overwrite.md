---
status: resolved
priority: p2
issue_id: "012"
tags: [code-review, quality]
dependencies: []
---

# daemon 日志文件使用覆盖模式，前次会话日志丢失

## Problem Statement

`daemon.ts:28` 使用 `{ flags: 'w' }` 创建日志流，每次 daemon 启动会覆盖前次日志。若用户需要排查上一次会话的问题，日志已丢失。

## Findings

- **来源**: performance-oracle
- **位置**: [daemon.ts:28](remnote-cli/src/daemon/daemon.ts#L28)
- **证据**: `fs.createWriteStream(logPath, { flags: 'w' })`

## Proposed Solutions

### Solution A: 改为追加模式 + 会话分隔符
- 使用 `{ flags: 'a' }`，每次启动写入分隔符标记
- 可选：保留最近 N 次会话或限制文件大小
- **Pros**: 保留历史日志
- **Cons**: 文件可能逐渐变大
- **Effort**: Small
- **Risk**: Low

## Technical Details

- **Affected files**: `remnote-cli/src/daemon/daemon.ts`

## Acceptance Criteria

- [x] daemon 重启后前次日志不丢失
- [ ] 日志文件大小有控制策略

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-04 | 代码审查发现 | 来自 performance-oracle |
| 2026-03-04 | 已修复 | flags 'w' → 'a' + 每次启动写入分隔符。文件大小控制暂缓（daemon 生命周期短，日志量小） |
