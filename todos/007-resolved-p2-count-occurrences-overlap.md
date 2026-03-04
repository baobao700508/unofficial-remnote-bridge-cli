---
status: resolved
priority: p2
issue_id: "007"
tags: [code-review, bug]
dependencies: []
---

# countOccurrences 允许重叠匹配，与 String.replace 行为不一致

## Problem Statement

`edit-handler.ts` 的 `countOccurrences` 函数使用 `pos += 1` 前进（允许重叠匹配），但实际的 `String.replace` 是非重叠的。这导致 "恰好出现 1 次" 的防线检查可能给出错误判断。

例如：在字符串 `"aaa"` 中搜索 `"aa"` — `countOccurrences` 返回 2，但 `String.replace` 只会替换第一个。

## Findings

- **来源**: kieran-typescript-reviewer
- **位置**: `remnote-cli/src/handlers/edit-handler.ts` — `countOccurrences` 函数
- **证据**: `pos += 1` 而非 `pos += needle.length`

## Proposed Solutions

### Solution A: 改为 pos += needle.length
- **Pros**: 一行修复，与 String.replace 行为一致
- **Cons**: 无
- **Effort**: Small
- **Risk**: Low

## Technical Details

- **Affected files**: `remnote-cli/src/handlers/edit-handler.ts`

## Acceptance Criteria

- [x] countOccurrences 与 String.replace 的匹配行为一致（非重叠）
- [ ] 添加单元测试覆盖重叠边界情况

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-04 | 代码审查发现 | 来自 kieran-typescript-reviewer |
| 2026-03-04 | 已修复 | pos += 1 改为 pos += needle.length |
