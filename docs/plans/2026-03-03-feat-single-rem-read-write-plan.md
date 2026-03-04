---
title: "feat: 实现单 Rem 模式读写命令 (read-rem / edit-rem)"
type: feat
status: active
date: 2026-03-03
origin: docs/初始需求/remnote-cli-single-rem-spec.md
---

# feat: 实现单 Rem 模式读写命令 (read-rem / edit-rem)

## Overview

实现 remnote-cli 的首批业务命令：`read-rem`（读取单个 Rem 对象的完整 JSON）和 `edit-rem`（通过 str_replace 编辑 Rem 的 JSON 序列化）。这是整个 CLI 工具的核心数据通路——所有后续命令（搜索、批量编辑、多 Rem 模式等）都将复用此基础设施。

需求规格见 `docs/初始需求/remnote-cli-single-rem-spec.md`。

## Problem Statement / Motivation

当前项目状态：
- CLI 只有基础设施命令（connect/disconnect/health），没有业务命令
- WS Server 的 `handleCliRequest()` 只处理 `get_status`，请求转发到 Plugin 是 TODO
- Plugin 的 `message-router` 为空骨架，`services/` 无业务实现
- 需要打通 CLI → daemon → Plugin → SDK 的完整数据通路

## Proposed Solution

分四个阶段实现，每阶段可独立验证：

1. **Phase 1**：WS 请求转发基础设施（daemon ↔ Plugin 双向通信）
2. **Phase 2**：`read-rem` 命令（端到端读取 + daemon 缓存）
3. **Phase 3**：`edit-rem` 命令（三道防线 + str_replace + 后处理校验）
4. **Phase 4**：测试

## Technical Considerations

### 架构决策（SpecFlow 分析结果）

以下决策来源于 SpecFlow 分析中发现的设计缺口，在实现前必须确认：

**D1. Daemon 编排角色**

daemon 对不同 action 承担不同角色：
- `read_rem`：转发给 Plugin + 缓存响应（简单中继 + 缓存）
- `edit_rem`：多步编排（防线检查 → 子请求 → str_replace → 校验 → 子请求 → 缓存更新）

daemon 向 Plugin 发起**子请求**：生成新的请求 ID，通过 `pluginSocket` 发送 BridgeRequest，等待匹配 ID 的 BridgeResponse。需要一个 `pendingRequests: Map<requestId, { resolve, reject, timer }>` 来关联。

**D2. 确定性 JSON 序列化**

防线 2 通过 JSON 字符串全文对比检测外部修改。必须保证两次序列化同一个 Rem 产生相同字符串。

方案：在 Plugin 的 `readRem()` service 中，按 RemObject 接口的**字段声明顺序**组装对象（而非依赖 SDK 返回顺序）。RichText 元素内部按 key 字母序排列。使用 `JSON.stringify(obj, null, 2)` 统一格式。

**D3. 多字段部分失败策略**

SDK 无事务支持。一次 edit-rem 可能变更多个字段，对应多个独立 SDK 调用。

策略：**顺序执行，首个失败即终止**。返回已成功和失败的字段列表。缓存不更新（迫使 AI re-read 获取实际状态）。

```json
{
  "ok": false,
  "command": "edit-rem",
  "error": "Failed to update field 'highlightColor': SDK error message",
  "appliedChanges": ["text"],
  "failedField": "highlightColor",
  "warning": "Partial update: 'text' was applied before failure. Re-read to sync."
}
```

**D4. `--fields` 与缓存的交互**

- Plugin 始终从 SDK 获取**完整 RemObject**
- daemon 始终缓存**完整 JSON**
- `--fields` 仅过滤 daemon 返回给 CLI 的输出
- AI 应使用**不带 `--fields`** 的输出来构造 edit-rem 的 `old_str`（因为 str_replace 在完整缓存 JSON 上执行）

**D5. 写入后缓存刷新**

edit-rem 成功后，daemon 再发一次 `read_rem` 子请求到 Plugin，获取完整最新 RemObject，用于更新缓存。这确保缓存中的只读字段（尤其 `updatedAt`）反映 SDK 最新状态，防止下次 edit-rem 的防线 2 误报。

额外一次网络往返，但**正确性优先于性能**。

**D6. `aliases` 字段标记为只读**

`aliases` 的 SDK 写入方法是 `getOrCreateAliasWithText(text)`，需要**文本**参数而非 ID。而 RemObject 中 `aliases` 是 `string[]`（ID 数组）。接口不匹配。

v1 方案：将 `aliases` 从 [RW] 降级为 [R]，不允许通过 edit-rem 修改。后续可提供独立命令 `add-alias <remId> <text>`。

关联影响：
- `remnote-plugin/src/types.ts`：`aliases` 标注从 `[RW]` 改为 `[R]`
- `docs/初始需求/remnote-cli-single-rem-spec.md`：字段映射表中删除 aliases 行，只读字段列表中添加 aliases
- RW 字段总数从 21 降为 20，R 字段总数从 13 升为 14

**D7. 并发控制**

v1 不实现 per-remId 锁。依赖防线 2 的乐观并发检测。承认 TOCTOU 窗口风险——防线 2 检查通过到 SDK 写入之间的极短窗口内，外部修改会被覆盖。对于当前单用户场景，风险可接受。

**D8. 超时设置**

| 通信跳段 | 超时 | 说明 |
|:--|:--|:--|
| CLI → daemon WS | 30 秒 | CLI 命令进程等待 daemon 响应 |
| daemon → Plugin 子请求 | 15 秒 | daemon 等待 Plugin 响应 |
| Plugin SDK 调用 | 10 秒 | 单个 SDK 方法调用上限 |

## System-Wide Impact

### Interaction Graph

```
CLI 命令进程 (read-rem / edit-rem)
    ↓ WS connect + send BridgeRequest
Daemon ws-server.ts handleCliRequest()
    ├─ read_rem: 转发给 Plugin + 缓存响应
    └─ edit_rem: 编排（防线检查 → 子请求 read_rem → str_replace → 子请求 write_rem_fields）
        ↓ 发送 BridgeRequest 子请求到 pluginSocket
Plugin websocket-client.ts handleMessage()
    ↓ 调用 messageHandler (message-router)
Plugin message-router.ts
    ├─ case 'read_rem'          → readRem(plugin, payload)       → services/read-rem.ts
    └─ case 'write_rem_fields'  → writeRemFields(plugin, payload) → services/write-rem-fields.ts（内部 action，无对应 CLI 命令）
Plugin services
    ↓ 调用 RemNote SDK (plugin.rem.findOne → getters / setters)
    ↑ 返回 BridgeResponse
Daemon
    ↓ 缓存 RemObject (LRU Map)
    ↓ --fields / --full 过滤（仅 read_rem）
    ↑ 返回给 CLI
CLI
    ↓ 格式化输出 (human-readable / --json)
```

### Error Propagation

```
SDK 错误 → Plugin services catch → BridgeResponse.error → daemon → CLI error output
Plugin WS 断连 → daemon "Plugin 未连接" → CLI error output
daemon 子请求超时 → daemon timeout error → CLI error output
CLI WS 连接失败 → CLI "守护进程未运行" → exit code 2
```

### State Lifecycle Risks

- **部分写入风险**：多字段 edit-rem 中间某个 SDK 调用失败，已写入的字段无法回滚。缓存不更新，AI 必须 re-read。
- **LRU 淘汰**：被淘汰的 Rem 在下次 edit-rem 时触发防线 1 拒绝。AI 需 re-read。
- **daemon 重启**：缓存全部丢失。所有 Rem 需要重新 read。

### API Surface Parity

| 接口 | 需要变更 | 共用代码路径 |
|:--|:--|:--|
| `remnote-cli read-rem` | 新增 | CLI → daemon → Plugin `readRem()` |
| `remnote-cli edit-rem` | 新增 | CLI → daemon (编排) → Plugin `readRem()` + `writeRemFields()` |
| WS 协议 `read_rem` action | 新增 | daemon 转发 + 缓存 |
| WS 协议 `write_rem_fields` action | 新增（内部） | daemon edit-rem 编排的写入子请求 |

---

## Implementation Phases

### Phase 1: WS 请求转发基础设施

**目标**：让 daemon 能够将 CLI 请求转发给 Plugin 并返回结果。这是所有业务命令的前提。

#### 1.1 daemon 请求转发机制

**文件**：`remnote-cli/src/server/ws-server.ts`

当前 `handleCliRequest()` 第 214-219 行是 TODO。需要实现：

```typescript
// 新增：pending requests map
private pendingPluginRequests = new Map<string, {
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
}>();

// 新增：向 Plugin 发送子请求并等待响应
async forwardToPlugin(action: string, payload: Record<string, unknown>): Promise<unknown> {
  // 1. 检查 pluginSocket 可用
  // 2. 生成子请求 ID
  // 3. 发送 BridgeRequest 到 pluginSocket
  // 4. 返回 Promise，通过 pendingPluginRequests map 关联
  // 5. 超时 15 秒后 reject
}

// 修改：handlePluginMessage() 增加对 BridgeResponse 的处理
// 当收到 Plugin 返回的 BridgeResponse 时，从 pendingPluginRequests 中找到对应 promise 并 resolve
```

**修改 `handleCliRequest()`**：
```typescript
private async handleCliRequest(ws: WebSocket, request: BridgeRequest): void {
  this.onCliRequest?.();

  if (request.action === 'get_status') {
    // 现有逻辑不变
    return;
  }

  // 新增：转发给 Plugin
  try {
    const result = await this.forwardToPlugin(request.action, request.payload);
    ws.send(JSON.stringify({ id: request.id, result }));
  } catch (error) {
    ws.send(JSON.stringify({ id: request.id, error: error.message }));
  }
}
```

**关键**：需要区分 Plugin 发来的消息类型：
- `HelloMessage` → 握手（现有）
- `PongMessage` → 心跳响应（现有）
- `BridgeResponse`（有 `id` 无 `action`）→ **新增**：子请求的响应，路由到 pendingPluginRequests

#### 1.2 Plugin message-router 接受 plugin 参数

**文件**：`remnote-plugin/src/bridge/message-router.ts`

```typescript
// 当前签名（无 plugin）
export function createMessageRouter(): (request: BridgeRequest) => Promise<unknown>

// 改为
export function createMessageRouter(plugin: ReactRNPlugin): (request: BridgeRequest) => Promise<unknown>
```

switch 中添加 case（此阶段只注册，service 在 Phase 2 实现）。

#### 1.3 Plugin widgets 传递 plugin

**文件**：`remnote-plugin/src/widgets/index.tsx`

```typescript
// 当前
wsClient.setMessageHandler(createMessageRouter());

// 改为
wsClient.setMessageHandler(createMessageRouter(plugin));
```

#### 1.4 验证

- 手动测试：CLI 发送未知 action → daemon 转发 → Plugin 返回 `未实现的 action` 错误 → CLI 收到错误
- 确认 Plugin 的 `hello`/`pong` 消息不被误当做 BridgeResponse

---

### Phase 2: read-rem 命令

**目标**：端到端实现 `remnote-cli read-rem <remId>` 命令。

#### 2.1 Plugin service: read-rem.ts

**新建文件**：`remnote-plugin/src/services/read-rem.ts`

```typescript
export async function readRem(
  plugin: ReactRNPlugin,
  payload: { remId: string }
): Promise<RemObject>
```

核心逻辑：
1. `plugin.rem.findOne(payload.remId)` 获取 Rem 对象
2. 不存在 → throw Error `Rem not found`
3. 按 RemObject 接口**字段声明顺序**组装对象（确定性序列化）
4. 每个字段调用对应的 SDK getter（大量 await）
5. RichText 字段（text/backText）：取 SDK 返回值后，对每个 RichText 元素递归按 key 字母序排列（与 D2 确定性序列化对齐）
6. 返回完整 RemObject（daemon 负责过滤，Plugin 不关心 `--fields`/`--full`）

**SDK 调用映射**（每个字段对应的 getter）：

| RemObject 字段 | SDK 调用 |
|:--|:--|
| `id` | `rem._id` |
| `text` | `rem.text` (属性) |
| `backText` | `rem.backText` (属性) |
| `type` | `await rem.getType()` → 转换为 RemTypeValue |
| `isDocument` | `await rem.isDocument()` |
| `parent` | `rem.parent` (属性) |
| `children` | `await rem.getChildrenRem()` → 取 ID 数组 |
| `fontSize` | `await rem.getFontSize()` |
| `highlightColor` | `await rem.getHighlightColor()` |
| `isTodo` | `await rem.isTodo()` |
| `todoStatus` | `await rem.getTodoStatus()` |
| `isCode` | `await rem.isCode()` |
| `isQuote` | `await rem.isQuote()` |
| `isListItem` | `await rem.isListItem()` |
| `isCardItem` | `await rem.isCardItem()` |
| `isTable` | `await rem.isTable()` |
| `isSlot` | `await rem.isSlot()` |
| `isProperty` | `await rem.isProperty()` |
| `enablePractice` | `await rem.getEnablePractice()` |
| `practiceDirection` | `await rem.getPracticeDirection()` |
| `tags` | `await rem.getTagRems()` → 取 ID 数组 |
| `sources` | `await rem.getSources()` → 取 ID 数组 |
| `aliases` | `await rem.getAliases()` → 取 ID 数组 |
| `positionAmongstSiblings` | `await rem.positionAmongstSiblings()` |
| ... | （其余只读字段类似） |

#### 2.2 Plugin message-router 注册

**文件**：`remnote-plugin/src/bridge/message-router.ts`

```typescript
case 'read_rem':
  return readRem(plugin, request.payload as { remId: string });
```

#### 2.3 Daemon 缓存层

**新建文件**：`remnote-cli/src/server/rem-cache.ts`

```typescript
export class RemCache {
  private cache = new Map<string, { json: string; lastAccess: number }>();
  private maxSize = 200;

  get(remId: string): string | null        // 返回缓存的 JSON 字符串
  set(remId: string, json: string): void   // 写入/覆盖，触发 LRU 淘汰
  has(remId: string): boolean              // 检查是否存在
  delete(remId: string): void              // 删除
  clear(): void                            // 清空所有
}
```

LRU 策略：每次 `get`/`set` 更新 `lastAccess`。`set` 时若超过 `maxSize`，淘汰 `lastAccess` 最小的条目。

#### 2.4 Daemon handleCliRequest 集成缓存

**文件**：`remnote-cli/src/server/ws-server.ts`

对 `read_rem` action 的处理：
1. 转发到 Plugin → 获取完整 RemObject
2. `JSON.stringify(remObject, null, 2)` 序列化
3. 以完整 JSON 存入 `RemCache`（无论 CLI 是否带了 --fields）
4. 根据请求中的 `fields`/`full` 参数过滤字段（从完整对象中摘取子集）
5. 返回过滤后的 RemObject 给 CLI（CLI 不做二次过滤）

#### 2.5 CLI 命令: read-rem.ts

**新建文件**：`remnote-cli/src/commands/read-rem.ts`

```typescript
export interface ReadRemOptions {
  json?: boolean;
  fields?: string;
  full?: boolean;
}

export async function readRemCommand(remId: string, options: ReadRemOptions = {}): Promise<void> {
  // 1. 读取 PID 文件，获取 daemon 端口
  // 2. 建立 WS 连接到 daemon
  // 3. 发送 { action: 'read_rem', payload: { remId, full } }
  // 4. 等待 BridgeResponse
  // 5. --json 模式：输出 { ok, command: 'read-rem', data: remObject }
  //    人类模式：格式化输出关键字段
}
```

注意：CLI 端的 WS 通信模式参考 `health.ts` 的 `getStatus()` 函数——建立连接、发请求、等响应、关闭连接。可提取为通用的 `sendDaemonRequest(action, payload)` 工具函数。

#### 2.6 CLI 注册命令

**文件**：`remnote-cli/src/index.ts`

```typescript
program
  .command('read-rem <remId>')
  .option('--fields <fields>', '只返回指定字段（逗号分隔）')
  .option('--full', '输出全部 51 个字段')
  .action(async (remId, cmdOpts) => {
    const { json } = program.opts();
    await readRemCommand(remId, { json, ...cmdOpts });
  });
```

#### 2.7 提取通用 daemon 通信工具

**新建文件**：`remnote-cli/src/daemon/send-request.ts`

从 `health.ts` 的 `getStatus()` 中提取通用模式：

```typescript
export async function sendDaemonRequest(
  action: string,
  payload: Record<string, unknown>,
  options?: { timeout?: number }
): Promise<unknown> {
  // 1. 读取 PID 文件获取端口
  // 2. 建立 WS 连接
  // 3. 发送 BridgeRequest
  // 4. 等待 BridgeResponse
  // 5. 超时处理
  // 6. 关闭连接
  // 7. 返回 result 或 throw error
}
```

`health.ts` 重构为使用此工具函数。

#### 2.8 read-rem 错误处理

| 错误场景 | CLI 响应 | exit code |
|:--|:--|:--|
| daemon 未运行 | `"守护进程未运行，请先执行 remnote-cli connect"` | 2 |
| Plugin 未连接 | `"Plugin 未连接，请确认 RemNote 已打开且插件已激活"` | 1 |
| remId 不存在 | `"Rem {remId} not found"` | 1 |
| SDK 调用超时 | `"Request timed out after 30s"` | 1 |
| remId 格式非法 | `"Invalid remId format: {remId}"` | 1 |

JSON 模式下统一格式：`{ "ok": false, "command": "read-rem", "error": "<消息>" }`

#### 2.9 验证

```bash
# 前置：启动 daemon + Plugin
remnote-cli connect

# 测试 read-rem
remnote-cli read-rem <some-rem-id>          # 人类可读输出
remnote-cli read-rem <some-rem-id> --json   # JSON 输出
remnote-cli read-rem <some-rem-id> --full   # 含 R-F 字段
remnote-cli read-rem nonexistent-id         # 错误处理
```

---

### Phase 3: edit-rem 命令

**目标**：实现完整的 `edit-rem` 命令，包含三道防线和后处理校验。

#### 3.1 Plugin service: write-rem-fields.ts

**新建文件**：`remnote-plugin/src/services/write-rem-fields.ts`

```typescript
export async function writeRemFields(
  plugin: ReactRNPlugin,
  payload: {
    remId: string;
    changes: Record<string, unknown>;  // 字段名 → 新值
  }
): Promise<{ applied: string[]; failed?: { field: string; error: string } }>
```

核心逻辑：
1. `plugin.rem.findOne(payload.remId)` 获取 Rem
2. 按顺序遍历 `changes` 中的字段
3. 每个字段调用对应的 SDK setter（参考规格中的字段→SDK 映射表）
4. 特殊处理：
   - `tags`：对比新旧数组，计算 add/remove diff，分别调用 `addTag`/`removeTag`
   - `sources`：同上，`addSource`/`removeSource`
   - `parent` + `positionAmongstSiblings` 联动：合并为一次 `setParent(parent, position)` 调用
5. 某个字段写入失败 → 立即终止，返回已成功列表和失败信息

#### 3.2 Plugin message-router 注册

```typescript
case 'write_rem_fields':
  return writeRemFields(plugin, request.payload as WriteRemFieldsPayload);
```

注意：`write_rem_fields` 是**内部 action**（daemon 编排用），没有对应的 CLI 命令。这是同态命名规则的一个例外——在规格中记录原因：edit-rem CLI 命令的处理逻辑分布在 daemon（缓存+防线+str_replace）和 Plugin（SDK 调用）两层。

#### 3.3 Daemon edit-rem 编排器

**新建文件**：`remnote-cli/src/server/edit-handler.ts`

```typescript
export class EditHandler {
  constructor(
    private cache: RemCache,
    private forwardToPlugin: (action: string, payload: Record<string, unknown>) => Promise<unknown>
  ) {}

  async handleEditRem(payload: {
    remId: string;
    oldStr: string;
    newStr: string;
  }): Promise<EditRemResult> {
    // 防线 1：检查缓存
    // 防线 2：从 Plugin 获取当前状态，与缓存对比
    // 防线 3：str_replace
    // 后处理校验
    // 发送 write_rem_fields 到 Plugin
    // 写入成功后 re-read 刷新缓存
    // 返回结果
  }
}
```

**防线 1 实现**：
```typescript
const cachedJson = this.cache.get(payload.remId);
if (!cachedJson) {
  throw new Error(`Rem ${payload.remId} has not been read yet. Read it first before editing.`);
}
```

**防线 2 实现**：
```typescript
const currentRemObject = await this.forwardToPlugin('read_rem', { remId: payload.remId });
const currentJson = JSON.stringify(currentRemObject, null, 2);
if (currentJson !== cachedJson) {
  // 不更新缓存
  throw new Error(`Rem ${payload.remId} has been modified since last read. Please read it again before editing.`);
}
```

**防线 3 实现**：
```typescript
const matches = findAllOccurrences(cachedJson, payload.oldStr);
if (matches.length === 0) {
  throw new Error(`old_str not found in the serialized JSON of rem ${payload.remId}`);
}
if (matches.length > 1) {
  throw new MatchError(matches, payload.remId); // 包含上下文信息
}
const modifiedJson = cachedJson.replace(payload.oldStr, payload.newStr);
```

**后处理校验**：
```typescript
// 1. JSON 解析
const modified = JSON.parse(modifiedJson);
const original = JSON.parse(cachedJson);

// 2. 推导变更字段
const changes: Record<string, unknown> = {};
const warnings: string[] = [];
for (const key of Object.keys(modified)) {
  if (JSON.stringify(modified[key]) !== JSON.stringify(original[key])) {
    if (isReadOnlyField(key)) {
      warnings.push(`Field '${key}' is read-only and was ignored`);
    } else {
      changes[key] = modified[key];
    }
  }
}

// 3. 类型合规校验（每个变更字段）
validateFieldTypes(changes); // 抛错 if 非法

// 4. 语义一致性校验
semanticCheck(original, modified, warnings); // todoStatus/isTodo 等

// 5. 空变更检查
if (Object.keys(changes).length === 0) {
  return { ok: true, changes: [], warnings };
}
```

**写入 + 缓存刷新**：
```typescript
// 发送变更到 Plugin
const writeResult = await this.forwardToPlugin('write_rem_fields', {
  remId: payload.remId,
  changes
});

// 写入成功 → 从 Plugin 重新获取完整 Rem 并更新缓存
const freshRemObject = await this.forwardToPlugin('read_rem', { remId: payload.remId });
const freshJson = JSON.stringify(freshRemObject, null, 2);
this.cache.set(payload.remId, freshJson);

return { ok: true, changes: Object.keys(changes), warnings };
```

#### 3.4 Daemon handleCliRequest 集成

**文件**：`remnote-cli/src/server/ws-server.ts`

```typescript
if (request.action === 'edit_rem') {
  const result = await this.editHandler.handleEditRem(request.payload);
  ws.send(JSON.stringify({ id: request.id, result }));
  return;
}
```

#### 3.5 CLI 命令: edit-rem.ts

**新建文件**：`remnote-cli/src/commands/edit-rem.ts`

```typescript
export interface EditRemOptions {
  json?: boolean;
  oldStr: string;
  newStr: string;
}

export async function editRemCommand(remId: string, options: EditRemOptions): Promise<void> {
  // 1. 通过 sendDaemonRequest 发送 edit_rem
  // 2. 处理响应
  // 3. --json: { ok, command: 'edit-rem', changes, warnings }
  //    人类模式: 列出变更摘要和警告
}
```

#### 3.6 CLI 注册命令

```typescript
program
  .command('edit-rem <remId>')
  .requiredOption('--old-str <oldStr>', '要替换的原始文本片段')
  .requiredOption('--new-str <newStr>', '替换后的新文本片段')
  .action(async (remId, cmdOpts) => {
    const { json } = program.opts();
    await editRemCommand(remId, { json, ...cmdOpts });
  });
```

#### 3.7 验证

```bash
# 先 read
remnote-cli read-rem <rem-id> --json

# 简单字段编辑
remnote-cli edit-rem <rem-id> \
  --old-str '"highlightColor": null' \
  --new-str '"highlightColor": "Red"'

# 未 read 直接 edit（应被防线 1 拒绝）
remnote-cli edit-rem <new-rem-id> \
  --old-str '...' --new-str '...'

# 外部修改后 edit（应被防线 2 拒绝）
# 在 RemNote UI 中修改 rem，然后 edit-rem

# 多次匹配（应被防线 3 拒绝并返回上下文）
```

---

### Phase 4: 测试

#### 4.1 单元测试

| 测试文件 | 测试内容 |
|:--|:--|
| `test/server/rem-cache.test.ts` | LRU 淘汰、get/set/has/delete/clear |
| `test/server/edit-handler.test.ts` | 三道防线、后处理校验、部分失败处理 |
| `test/commands/read-rem.test.ts` | 命令参数解析、--json/--fields/--full 输出、错误处理 |
| `test/commands/edit-rem.test.ts` | 命令参数解析、--json 输出、错误处理 |

#### 4.2 集成测试

需要 daemon + Plugin 运行：
- read-rem 端到端：CLI → daemon → Plugin → SDK → 返回
- edit-rem 端到端：read → edit → re-read 验证变更
- 防线 1/2/3 触发验证
- LRU 淘汰后 edit 被拒绝

---

## Acceptance Criteria

### Functional Requirements

- [ ] `remnote-cli read-rem <remId>` 返回完整 RemObject JSON
- [ ] `read-rem --fields text,tags` 只输出指定字段
- [ ] `read-rem --full` 输出全部 51 个字段
- [ ] `read-rem --json` 输出标准 JSON 格式（ok + command + data）
- [ ] `read-rem` 不存在的 remId 返回明确错误
- [ ] `remnote-cli edit-rem <remId> --old-str ... --new-str ...` 成功修改字段
- [ ] 防线 1：未 read 直接 edit 被拒绝
- [ ] 防线 2：外部修改后 edit 被拒绝
- [ ] 防线 3：old_str 不匹配或多次匹配被拒绝
- [ ] 后处理：类型不合法被拒绝
- [ ] 后处理：只读字段变更被忽略 + 警告
- [ ] 后处理：语义不一致产生警告
- [ ] edit-rem 成功后缓存正确更新
- [ ] LRU 缓存超过 200 条时正确淘汰
- [ ] daemon 关闭后缓存全部清空
- [ ] 所有命令同时支持人类可读和 --json 输出

### Quality Gates

- [ ] 所有新增代码有对应测试
- [ ] `node scripts/check-layer-deps.js` 通过（无分层违规）
- [ ] 同态命名规则遵守：read-rem / read_rem / read-rem.ts / readRem()
- [ ] --json 输出包含 ok + command 字段

## Dependencies & Risks

| 风险 | 缓解 |
|:--|:--|
| SDK getter 返回值类型与 RemObject 不一致 | Phase 2 首先实现一个字段端到端验证 |
| RichText 序列化不确定性 | 统一用字段声明顺序 + key 排序 |
| 多字段写入部分失败 | 明确策略：首个失败终止 + 报告 |
| TOCTOU 并发窗口 | v1 接受风险，后续可加 per-remId 锁 |
| `--old-str`/`--new-str` 的 shell 转义 | 支持 stdin 输入模式作为备选 |

## Sources & References

### Origin

- **需求规格**：[docs/初始需求/remnote-cli-single-rem-spec.md](../初始需求/remnote-cli-single-rem-spec.md) — 完整的命令定义、三道防线、后处理校验、缓存生命周期
- **RemObject 接口**：[remnote-plugin/src/types.ts](../../remnote-plugin/src/types.ts) — 51 字段定义

### Internal References

- 命令模式参考：`remnote-cli/src/commands/health.ts` — CLI→daemon WS 通信模板
- WS Server 扩展点：`remnote-cli/src/server/ws-server.ts:193-220` — `handleCliRequest()` TODO
- Plugin 路由骨架：`remnote-plugin/src/bridge/message-router.ts` — 空 switch
- SDK 使用模式参考：`remnote-plugin/src/services/test-rw-fields.ts` — 所有 setter 的实际调用
- 分层约束：`AGENTS.md` 2.1 节 — 层边界 + 同态命名
- 会话定义：`AGENTS.md` 4.5 节 — daemon 生命周期 = 会话
