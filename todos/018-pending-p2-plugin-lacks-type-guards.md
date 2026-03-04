---
status: pending
priority: p2
issue_id: "018"
tags: [code-review, quality, typescript]
dependencies: []
---

# Plugin websocket-client.ts 缺少类型守卫

## Problem Statement

`websocket-client.ts` 的 `handleMessage()` 方法对收到的 WS 消息使用裸属性检查（`message.type === 'ping'`、`message.id && message.action`），而非类型守卫函数。`JSON.parse` 返回 `any`，没有类型 narrowing。

CLI 侧的 `protocol.ts` 已有完善的类型守卫（`isHelloMessage`、`isBridgeRequest`、`isBridgeResponse` 等），Plugin 侧缺少对称实现。

## Findings

- **来源**: kieran-typescript-reviewer, pattern-recognition-specialist
- **位置**: `remnote-plugin/src/bridge/websocket-client.ts` 第 154-183 行
- **证据**: `if (message.type === 'ping')` 等裸检查，`message` 为隐式 `any`
- **对比**: CLI 侧 `protocol.ts` 已有 5 个类型守卫函数

## Proposed Solutions

### Solution A: 在 Plugin bridge 层定义对称的类型守卫
- 在 `websocket-client.ts` 或新建 `protocol.ts` 中定义 `isPingMessage`、`isBridgeRequest` 等类型守卫
- `handleMessage` 中使用类型守卫替代裸属性检查
- **Pros**: 类型安全，与 CLI 侧风格一致
- **Cons**: 需新增约 30 行代码
- **Effort**: Small
- **Risk**: Low

### Solution B: 提取 Plugin 协议类型到独立文件
- 将 `websocket-client.ts` 中的 `HelloMessage`、`BridgeRequest` 等类型定义提取到 `bridge/protocol.ts`
- 同时在该文件中添加类型守卫
- **Pros**: 职责分离（连接管理 vs 协议定义），消除 message-router.ts 从 websocket-client.ts 导入 BridgeRequest 的语义混淆
- **Cons**: 多一个文件
- **Effort**: Small
- **Risk**: Low

## Recommended Action

（建议 Solution B，同时解决协议类型提取问题）

## Technical Details

- **Affected files**: `remnote-plugin/src/bridge/websocket-client.ts`, 可能新建 `remnote-plugin/src/bridge/protocol.ts`
- **Components**: WebSocketClient.handleMessage(), message-router.ts 的 import

## Acceptance Criteria

- [ ] Plugin 侧消息解析使用类型守卫函数
- [ ] `handleMessage` 中 `message` 变量有正确的类型 narrowing
- [ ] `message-router.ts` 从 `protocol.ts`（而非 websocket-client.ts）导入 `BridgeRequest`

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-04 | 7-agent 代码审查发现 | 来自 kieran-typescript-reviewer + pattern-recognition-specialist |

## Resources

- PR branch: `feat/cli-connect-health`
- 参考实现: `remnote-cli/src/protocol.ts`（CLI 侧的类型守卫）
