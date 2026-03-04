---
title: "字符串搜索重叠匹配 + 定时器作用域泄漏"
category: logic-errors
severity: p2
date_solved: "2026-03-04"
components: [remnote-cli, daemon, handlers]
tags: [bug-fix, timer-leak, string-matching, code-review]
files_changed:
  - remnote-cli/src/daemon/send-request.ts
  - remnote-cli/src/handlers/edit-handler.ts
  - remnote-cli/src/daemon/daemon.ts
related_todos: ["005", "007", "012"]
---

# 字符串搜索重叠匹配 + 定时器作用域泄漏

## Problem

代码审查（7-agent 并行审查）发现 remnote-cli 中两个逻辑 Bug 和一个改进项：

### Bug 1: responseTimer 作用域泄漏（#005）

`send-request.ts` 中 `responseTimer` 声明在 `ws.on('open')` 回调内部，而 `ws.on('error')` 回调无法访问该变量。当 WS 连接成功建立后、响应到达前发生网络错误时，`responseTimer` 永远不会被清理，导致：
- 定时器到期后尝试 terminate 已关闭的 WebSocket
- Promise 可能被 reject 两次（error + timeout）

### Bug 2: countOccurrences 重叠匹配（#007）

`edit-handler.ts` 中 `countOccurrences()` 使用 `pos += 1` 步进（重叠匹配），而 `String.prototype.replace()` 是非重叠替换。当 `old_string` 存在自重叠模式时（如在 `"aaa"` 中搜索 `"aa"`），`countOccurrences` 返回 2 但 `replace` 只替换 1 次，导致 `uniqueness !== 1` 校验误判。

### 改进: 日志覆盖模式（#012）

`daemon.ts` 使用 `createWriteStream` 默认的 `flags: 'w'`（覆盖模式），每次 `remnote connect` 都会清空历史日志，不利于问题追溯。

## Root Cause

### Bug 1
JavaScript 闭包作用域问题。`let responseTimer` 在 `ws.on('open')` 回调函数体内声明，`ws.on('error')` 回调是另一个闭包，无法访问同级闭包中的变量。

### Bug 2
`countOccurrences` 实现时选择了 `pos += 1`（正则式重叠匹配行为），但实际消费方 `String.replace` 是非重叠的。两者语义不一致。

## Solution

### Bug 1: 提升 responseTimer 到 Promise 外层

```typescript
// Before — responseTimer 困在 open 回调作用域内
ws.on('open', () => {
  clearTimeout(connectTimer);
  const responseTimer = setTimeout(() => { /* ... */ }, responseTimeout);
  // ...
});
ws.on('error', (err) => {
  clearTimeout(connectTimer);
  // responseTimer 不可达！
  reject(new DaemonUnreachableError(err.message));
});

// After — responseTimer 提升到 Promise 作用域
return new Promise((resolve, reject) => {
  let responseTimer: ReturnType<typeof setTimeout> | null = null;
  // ...
  ws.on('open', () => {
    clearTimeout(connectTimer);
    responseTimer = setTimeout(() => { /* ... */ }, responseTimeout);
    // ...
  });
  ws.on('error', (err) => {
    clearTimeout(connectTimer);
    if (responseTimer) clearTimeout(responseTimer); // 现在可以清理
    reject(new DaemonUnreachableError(err.message));
  });
});
```

### Bug 2: 统一为非重叠步进

```typescript
// Before — 重叠匹配
pos += 1;

// After — 非重叠匹配，与 String.replace 行为一致
pos += needle.length;
```

### 改进: 日志追加模式 + 会话分隔符

```typescript
// Before
const logStream = fs.createWriteStream(logPath);

// After
const logStream = fs.createWriteStream(logPath, { flags: 'a' });
logStream.write(
  `\n${'='.repeat(60)}\n` +
  `[${new Date().toISOString()}] 守护进程启动 (PID: ${process.pid})\n` +
  `${'='.repeat(60)}\n`
);
```

## Prevention

### 编码规范

1. **定时器声明层级**：WS/事件驱动代码中，所有需要跨事件处理器共享的变量（定时器、状态标志），必须声明在最外层共享作用域。经验法则：如果变量需要在 cleanup 中清理，它的声明位置必须让所有 cleanup 路径都能访问。

2. **字符串搜索 vs 替换一致性**：当 `count` 函数和 `replace` 函数配对使用时，两者的匹配语义必须一致。推荐对 `countOccurrences` 添加注释说明其匹配模式。

3. **日志文件生命周期**：长生命周期进程的日志应默认追加模式，并用时间戳分隔会话。

### 审查检查清单

- [ ] 事件回调中声明的变量，是否需要被其他回调访问？
- [ ] 计数函数和替换函数的匹配语义是否一致？
- [ ] 文件写入是覆盖还是追加？是否符合预期？

## Verification

- Bug 1: 检查 `send-request.ts` 中 `responseTimer` 在 Promise 顶层声明，且 `ws.on('error')` 中有 `clearTimeout(responseTimer)`
- Bug 2: 检查 `edit-handler.ts` 中 `countOccurrences` 使用 `pos += needle.length`
- 改进: 检查 `daemon.ts` 中 `createWriteStream` 使用 `{ flags: 'a' }`

## Resources

- PR branch: `feat/cli-connect-health`
- Todo 005: `todos/005-resolved-p2-send-request-timer-leak.md`
- Todo 007: `todos/007-resolved-p2-count-occurrences-overlap.md`
- Todo 012: `todos/012-resolved-p2-log-file-overwrite.md`
