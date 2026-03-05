# RemNote Bridge CLI — 完整 QA 测试计划

> 版本: v0.1.0
> 日期: 2026-03-04
> 测试工具: CLI (npx tsx) + Claude in Chrome (UI 验证)
> 测试环境: macOS Darwin 25.1.0 / Node.js v22.12.0 / Chrome

---

## 目录

1. [Executive Summary](#1-executive-summary)
2. [测试范围](#2-测试范围)
3. [测试策略](#3-测试策略)
4. [测试环境](#4-测试环境)
5. [入口/出口标准](#5-入口出口标准)
6. [风险评估](#6-风险评估)
7. [手动测试用例](#7-手动测试用例)
   - 7.1 connect 命令
   - 7.2 health 命令
   - 7.3 disconnect 命令
   - 7.4 read-rem 命令
   - 7.5 edit-rem 命令（重点）
   - 7.6 edit-rem 逐字段覆盖测试（20 个可写字段）
   - 7.7 edit-rem 三道防线测试
   - 7.8 edit-rem 只读字段拦截测试
8. [回归测试套件](#8-回归测试套件)
9. [Bug 报告](#9-bug-报告)

---

## 1. Executive Summary

- **被测对象**: remnote-bridge-cli 的 5 个 CLI 命令（connect / health / disconnect / read-rem / edit-rem）
- **测试重点**: `edit-rem` 对 RemObject 每个可写字段的端到端验证，包括 CLI 返回值正确性 + RemNote UI 实时变化
- **关键风险**: 端口冲突导致静默失败、health 输出重复 bug、并发编辑数据丢失
- **RichText 测试**: 已在先前会话中完成 84 组合交叉矩阵测试，本轮不重复

---

## 2. 测试范围

### In Scope

| 模块 | 测试类型 | 优先级 |
|:--|:--|:--|
| `connect` | 功能 + 错误分支 | P0 |
| `health` | 功能 + JSON/人类输出 | P0 |
| `disconnect` | 功能 + 错误分支 | P0 |
| `read-rem` | 功能 + 字段过滤 | P0 |
| `edit-rem` 基础流程 | str_replace + UI 验证 | P0 |
| `edit-rem` 20 个可写字段 | 逐字段写入 + UI 反映 | P0 |
| `edit-rem` 三道防线 | 缓存/并发/匹配 | P0 |
| `edit-rem` 只读字段 | 警告拦截 | P1 |
| `--json` 模式 | 全命令覆盖 | P1 |
| 退出码 | 0/1/2 正确性 | P1 |

### Out of Scope

- RichText 行内格式化（已完成 7×12 矩阵测试）
- Plugin 内部 SDK 调用链（黑盒测试不涉及）
- remnote-skills / remnote-mcp（待开发）
- 性能和负载测试

---

## 3. 测试策略

### 方法

- **黑盒测试**: 通过 CLI 命令输入/输出验证
- **端到端验证**: CLI 操作 → 浏览器 RemNote UI 变化确认（Claude in Chrome 截图对比）
- **正向 + 反向测试**: 每个功能同时测试成功路径和失败路径
- **边界值分析**: 空值、null、超长字符串、特殊字符
- **等价类划分**: boolean 字段统一测试模式、枚举字段遍历所有值

### 测试流程

```
1. connect 启动守护进程
2. health 验证三项全绿
3. 在 RemNote 中准备测试数据（创建测试文档 + 子 Rem）
4. read-rem 读取目标 Rem
5. edit-rem 修改字段
6. Chrome 截图验证 UI 变化
7. read-rem 确认写入结果
8. 恢复原始状态（edit-rem 改回）
9. disconnect 清理
```

---

## 4. 测试环境

| 项 | 详情 |
|:--|:--|
| OS | macOS Darwin 25.1.0 |
| Node.js | v22.12.0 |
| 运行方式 | `npx tsx src/index.ts` (开发模式) |
| WS Server | ws://127.0.0.1:3002 |
| webpack-dev-server | http://localhost:8080 |
| 浏览器 | Google Chrome (RemNote 网页版) |
| UI 验证工具 | Claude in Chrome MCP |
| RemNote 账户 | Liangjian (已登录) |
| 测试文档 | "mcp" (ID: KBhhq0frjpSdMTleT) |

---

## 5. 入口/出口标准

### Entry Criteria

- [ ] 守护进程可正常启动（端口 3002 + 8080 空闲）
- [ ] Plugin 已连接（health 三项全绿）
- [ ] RemNote 浏览器页面已打开
- [ ] 测试文档 "mcp" 存在且有子 Rem

### Exit Criteria

- [ ] 所有 P0 测试用例执行完毕
- [ ] 95%+ 测试用例通过
- [ ] 所有 Critical/High bug 已记录
- [ ] 回归测试套件通过

---

## 6. 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|:--|:--|:--|:--|
| 端口被占用导致 connect 静默失败 | 高 | 高 | 测试前检查端口；已知 bug 需修复 |
| RemNote 服务不可用 | 低 | 高 | 使用本地知识库；检查网络 |
| 并发编辑触发防线 2 | 中 | 中 | 测试期间不在浏览器中手动编辑 |
| SDK API 变更 | 低 | 高 | 检查 SDK 版本一致性 |
| health 重复输出影响脚本解析 | 高 | 中 | 使用 --json 模式规避 |

---

## 7. 手动测试用例

---

### 7.1 connect 命令

#### TC-CONN-001: 正常启动守护进程

**优先级:** P0 | **类型:** 功能

**前置条件:**
- 端口 3002 和 8080 均空闲
- 无残留 `.remnote-bridge.pid` 文件
- RemNote 浏览器已打开

**测试步骤:**

1. 执行 `npx tsx src/index.ts connect`
   **预期:** 输出包含 "正在启动守护进程..." 和 "守护进程已启动（PID: XXXXX）"
2. 检查 WS Server 和 webpack-dev-server 地址输出
   **预期:** 输出 `ws://127.0.0.1:3002` 和 `http://localhost:8080`
3. 检查超时信息
   **预期:** 输出 "超时: 30 分钟无 CLI 交互后自动关闭"
4. 检查退出码
   **预期:** 退出码 0
5. 检查 PID 文件
   **预期:** `.remnote-bridge.pid` 文件存在且包含有效 PID

---

#### TC-CONN-002: 重复启动（已在运行）

**优先级:** P0 | **类型:** 边界

**前置条件:** 守护进程已在运行

**测试步骤:**

1. 执行 `npx tsx src/index.ts connect`
   **预期:** 输出 "守护进程已在运行（PID: XXXXX）"
2. 检查退出码
   **预期:** 退出码 0（不报错）
3. 检查原守护进程未受影响
   **预期:** `health` 仍然三项全绿

---

#### TC-CONN-003: 端口 8080 被占用

**优先级:** P0 | **类型:** 错误分支

**前置条件:** 端口 8080 被其他进程占用

**测试步骤:**

1. 启动占用 8080 的进程: `python3 -m http.server 8080 &`
2. 执行 `npx tsx src/index.ts connect`
   **预期:** 应报错 "端口 8080 被占用" 或类似提示
3. 检查退出码
   **预期:** 退出码 1
4. 检查 PID 文件
   **预期:** 不应残留 PID 文件
5. 清理: 杀掉 python 进程

**已知问题:** 当前实现中 connect 可能先返回成功再崩溃（见 BUG-001）

---

#### TC-CONN-004: 端口 3002 被占用

**优先级:** P1 | **类型:** 错误分支

**前置条件:** 端口 3002 被其他进程占用

**测试步骤:**

1. 启动占用 3002 的进程
2. 执行 `npx tsx src/index.ts connect`
   **预期:** 报错提示端口被占用
3. 检查退出码和 PID 文件清理

---

#### TC-CONN-005: stale PID 文件清理

**优先级:** P1 | **类型:** 边界

**前置条件:** 存在 PID 文件但对应进程已不存在

**测试步骤:**

1. 手动创建 `.remnote-bridge.pid` 文件，写入一个不存在的 PID（如 99999）
2. 执行 `npx tsx src/index.ts connect`
   **预期:** 自动清理 stale PID，正常启动新守护进程
3. 检查日志
   **预期:** 日志应记录 stale PID 清理

---

#### TC-CONN-006: --json 模式输出

**优先级:** P1 | **类型:** 功能

**测试步骤:**

1. 执行 `npx tsx src/index.ts connect --json`
   **预期:** 输出一行合法 JSON: `{"ok":true,"command":"connect","alreadyRunning":false,"pid":XXXXX,"wsPort":3002,"devServerPort":8080,"timeoutMinutes":30}`
2. 验证 JSON 结构
   **预期:** 包含 `ok`、`command`、`pid`、`wsPort`、`devServerPort`、`timeoutMinutes` 字段

---

### 7.2 health 命令

#### TC-HLTH-001: 全部健康

**优先级:** P0 | **类型:** 功能

**前置条件:** 守护进程运行中 + Plugin 已连接

**测试步骤:**

1. 执行 `npx tsx src/index.ts health`
   **预期:** 三行 ✅ 输出（守护进程/Plugin/SDK）
2. 检查退出码
   **预期:** 退出码 0

---

#### TC-HLTH-002: 守护进程未运行

**优先级:** P0 | **类型:** 错误分支

**前置条件:** 守护进程未启动

**测试步骤:**

1. 执行 `npx tsx src/index.ts health`
   **预期:** 三行 ❌ 输出 + 提示 "执行 `remnote connect` 启动守护进程"
2. 检查退出码
   **预期:** 退出码 2
3. **检查输出是否重复**
   **预期:** 每条状态只输出一次（已知 BUG-002: 当前重复输出两次）

---

#### TC-HLTH-003: --json 模式

**优先级:** P1 | **类型:** 功能

**测试步骤:**

1. 执行 `npx tsx src/index.ts health --json`（守护进程运行中）
   **预期:** 一行合法 JSON，包含 `ok`、`command`、`exitCode`、`daemon`、`plugin`、`sdk`、`timeoutRemaining`
2. 执行 `npx tsx src/index.ts health --json`（守护进程未运行）
   **预期:** `{"ok":false,"command":"health","exitCode":2,...}`

---

#### TC-HLTH-004: Plugin 未连接（守护进程运行但 Plugin 断开）

**优先级:** P1 | **类型:** 边界

**前置条件:** 守护进程运行中，关闭 RemNote 浏览器页面

**测试步骤:**

1. 关闭 RemNote 页面（断开 Plugin）
2. 执行 `npx tsx src/index.ts health`
   **预期:** 守护进程 ✅，Plugin ❌，SDK ❌
3. 检查退出码
   **预期:** 退出码 1

---

### 7.3 disconnect 命令

#### TC-DISC-001: 正常停止

**优先级:** P0 | **类型:** 功能

**前置条件:** 守护进程运行中

**测试步骤:**

1. 执行 `npx tsx src/index.ts disconnect`
   **预期:** 输出 "正在停止守护进程（PID: XXXXX）..." 和 "守护进程已停止"
2. 检查退出码
   **预期:** 退出码 0
3. 检查 PID 文件
   **预期:** `.remnote-bridge.pid` 已删除
4. 检查端口释放
   **预期:** 3002 和 8080 端口均释放

---

#### TC-DISC-002: 守护进程未运行时 disconnect

**优先级:** P1 | **类型:** 边界

**前置条件:** 守护进程未运行

**测试步骤:**

1. 执行 `npx tsx src/index.ts disconnect`
   **预期:** 输出 "守护进程未在运行" 或类似提示
2. 检查退出码
   **预期:** 退出码 0（幂等操作）

---

#### TC-DISC-003: --json 模式

**优先级:** P1 | **类型:** 功能

**测试步骤:**

1. 执行 `npx tsx src/index.ts disconnect --json`
   **预期:** `{"ok":true,"command":"disconnect","wasRunning":true,"pid":XXXXX,"forced":false}`

---

### 7.4 read-rem 命令

#### TC-READ-001: 读取文档 Rem

**优先级:** P0 | **类型:** 功能

**前置条件:** 守护进程 + Plugin 就绪

**测试步骤:**

1. 执行 `npx tsx src/index.ts read-rem KBhhq0frjpSdMTleT`
   **预期:** 输出格式化 JSON，包含 id/text/type/isDocument/children 等字段
2. 验证 `isDocument` 为 `true`
3. 验证 `text` 为 `["mcp"]`

---

#### TC-READ-002: --json 模式

**优先级:** P0 | **类型:** 功能

**测试步骤:**

1. 执行 `npx tsx src/index.ts read-rem --json KBhhq0frjpSdMTleT`
   **预期:** 一行合法 JSON，包含 `ok`、`command`、`data` 字段
2. 验证 `data` 中默认不包含 R-F 字段（isPowerup、deepRemsBeingReferenced 等）

---

#### TC-READ-003: --fields 过滤

**优先级:** P1 | **类型:** 功能

**测试步骤:**

1. 执行 `npx tsx src/index.ts read-rem --fields text,type KBhhq0frjpSdMTleT`
   **预期:** 只返回 `id`、`text`、`type` 三个字段

---

#### TC-READ-004: --full 模式

**优先级:** P1 | **类型:** 功能

**测试步骤:**

1. 执行 `npx tsx src/index.ts read-rem --full KBhhq0frjpSdMTleT`
   **预期:** 输出包含 R-F 字段（isPowerup 等全部 51 个字段）

---

#### TC-READ-005: 不存在的 Rem ID

**优先级:** P0 | **类型:** 错误分支

**测试步骤:**

1. 执行 `npx tsx src/index.ts read-rem nonexistent123`
   **预期:** 报错信息
2. 检查退出码
   **预期:** 退出码 1

---

#### TC-READ-006: 守护进程未运行时 read-rem

**优先级:** P1 | **类型:** 错误分支

**前置条件:** 守护进程未运行

**测试步骤:**

1. 执行 `npx tsx src/index.ts read-rem KBhhq0frjpSdMTleT`
   **预期:** 报错 "守护进程未运行"
2. 检查退出码
   **预期:** 退出码 2

---

### 7.5 edit-rem 命令（基础流程）

#### TC-EDIT-001: 修改纯文本字段 (text)

**优先级:** P0 | **类型:** 功能 + UI 验证

**前置条件:** 已 read-rem 读取目标 Rem

**测试步骤:**

1. `read-rem --json KBhhq0frjpSdMTleT` 读取当前状态
2. `edit-rem --json --old-str '"mcp"' --new-str '"mcp-qa-test"' KBhhq0frjpSdMTleT`
   **预期 CLI:** `{"ok":true,"command":"edit-rem","changes":["text"],"warnings":[]}`
3. **Chrome 截图验证:** 文档标题变为 "mcp-qa-test"，左侧栏同步更新
4. 恢复: `edit-rem --old-str '"mcp-qa-test"' --new-str '"mcp"' KBhhq0frjpSdMTleT`

---

#### TC-EDIT-002: 未先 read 就 edit（防线 1）

**优先级:** P0 | **类型:** 防线

**前置条件:** disconnect 后重新 connect（清空缓存）

**测试步骤:**

1. `connect` → `health` 确认连接
2. 直接 `edit-rem --old-str "x" --new-str "y" KBhhq0frjpSdMTleT`（不先 read）
   **预期:** 报错 "has not been read yet"
3. 检查退出码
   **预期:** 退出码 1

---

#### TC-EDIT-003: old_str 不存在（防线 3）

**优先级:** P0 | **类型:** 防线

**前置条件:** 已 read 目标 Rem

**测试步骤:**

1. `read-rem KBhhq0frjpSdMTleT`
2. `edit-rem --old-str "这个字符串不存在" --new-str "x" KBhhq0frjpSdMTleT`
   **预期:** 报错 "old_str not found"
3. 检查退出码
   **预期:** 退出码 1

---

#### TC-EDIT-004: old_str 多次匹配（防线 3）

**优先级:** P0 | **类型:** 防线

**前置条件:** 已 read 目标 Rem

**测试步骤:**

1. `read-rem --json KBhhq0frjpSdMTleT`
2. 找到在 JSON 中出现多次的字符串（如 `"string"`）
3. `edit-rem --old-str '"string"' --new-str '"other"' KBhhq0frjpSdMTleT`
   **预期:** 报错 "matches X locations ... Make old_str more specific"
4. 检查退出码
   **预期:** 退出码 1

---

#### TC-EDIT-005: 并发修改检测（防线 2）

**优先级:** P0 | **类型:** 防线

**前置条件:** 已 read 目标 Rem

**测试步骤:**

1. `read-rem KBhhq0frjpSdMTleT` 缓存 Rem
2. 在 RemNote 浏览器中手动修改该 Rem 的内容
3. `edit-rem --old-str "mcp" --new-str "mcp-test" KBhhq0frjpSdMTleT`
   **预期:** 报错 "has been modified since last read"
4. 检查退出码
   **预期:** 退出码 1

---

#### TC-EDIT-006: 替换产生无效 JSON

**优先级:** P1 | **类型:** 防线

**前置条件:** 已 read 目标 Rem

**测试步骤:**

1. `read-rem KBhhq0frjpSdMTleT`
2. `edit-rem --old-str '"mcp"' --new-str '"mcp' KBhhq0frjpSdMTleT`（缺少引号）
   **预期:** 报错 "produced invalid JSON"
3. 检查退出码
   **预期:** 退出码 1

---

#### TC-EDIT-007: 修改只读字段

**优先级:** P1 | **类型:** 防线

**前置条件:** 已 read 目标 Rem

**测试步骤:**

1. `read-rem --json KBhhq0frjpSdMTleT`
2. 尝试修改 `createdAt` 时间戳
   `edit-rem --old-str '"createdAt": 1772576549156' --new-str '"createdAt": 9999999999999' KBhhq0frjpSdMTleT`
   **预期:** 返回成功但 warnings 包含 "Field 'createdAt' is read-only and was ignored"
3. 检查 changes 为空数组
4. 确认 RemNote 中无实际变化

---

#### TC-EDIT-008: --json 模式错误输出

**优先级:** P1 | **类型:** 功能

**测试步骤:**

1. `edit-rem --json --old-str "不存在" --new-str "x" KBhhq0frjpSdMTleT`
   **预期:** `{"ok":false,"command":"edit-rem","error":"old_str not found..."}`
2. 验证 JSON 格式正确，包含 `ok`、`command`、`error` 字段

---

#### TC-EDIT-009: 守护进程未运行时 edit-rem

**优先级:** P1 | **类型:** 错误分支

**前置条件:** 守护进程未运行

**测试步骤:**

1. `edit-rem --old-str "x" --new-str "y" someId`
   **预期:** 报错 "守护进程未运行"
2. 检查退出码
   **预期:** 退出码 2

---

### 7.6 edit-rem 逐字段覆盖测试（20 个可写字段）

> **测试方法:** 对每个可写字段执行 read → edit → Chrome 截图 → read 验证 → 恢复
>
> **测试 Rem 准备:** 在 "mcp" 文档下创建一个纯文本子 Rem 作为测试目标
>
> **20 个可写字段清单:** text, backText, type, isDocument, parent, fontSize, highlightColor,
> isTodo, todoStatus, isCode, isQuote, isListItem, isCardItem, isSlot, isProperty,
> enablePractice, practiceDirection, tags, sources, positionAmongstSiblings

---

#### TC-FIELD-001: text — 修改正面文本

**优先级:** P0 | **类型:** 字段覆盖 + UI

**测试步骤:**

1. read-rem 获取测试 Rem
2. edit-rem 修改 text 字段: `["原始文本"]` → `["修改后的文本"]`
   **预期 CLI:** changes 包含 "text"
3. **Chrome 验证:** Rem 内容在页面上显示为 "修改后的文本"
4. read-rem 确认字段已更新
5. 恢复原始值

---

#### TC-FIELD-002: backText — 修改背面文本

**优先级:** P0 | **类型:** 字段覆盖 + UI

**前置条件:** 测试 Rem 为 descriptor 类型（有 backText）

**测试步骤:**

1. read-rem 获取一个 descriptor Rem
2. edit-rem 修改 backText 字段
   **预期 CLI:** changes 包含 "backText"
3. **Chrome 验证:** 在 RemNote 中展开该 Rem，背面文本已更新
4. read-rem 确认
5. 恢复

---

#### TC-FIELD-003: backText — 设置为 null（移除背面文本）

**优先级:** P1 | **类型:** 边界

**测试步骤:**

1. read-rem 获取有 backText 的 Rem
2. edit-rem 将 backText 从 `["xxx"]` 改为 `null`
   **预期 CLI:** changes 包含 "backText"
3. **Chrome 验证:** Rem 变为无背面文本状态
4. 恢复

---

#### TC-FIELD-004: type — 更改 Rem 类型

**优先级:** P0 | **类型:** 字段覆盖 + UI

**测试步骤 A — default → concept:**

1. read-rem 获取 type 为 "default" 的 Rem
2. edit-rem: `"type": "default"` → `"type": "concept"`
   **预期 CLI:** changes 包含 "type"
3. **Chrome 验证:** Rem 类型图标/样式变化
4. read-rem 确认 type 为 "concept"

**测试步骤 B — concept → descriptor:**

1. edit-rem: `"type": "concept"` → `"type": "descriptor"`
   **预期 CLI:** changes 包含 "type"
3. **Chrome 验证:** Rem 显示为 descriptor 样式

**测试步骤 C — 恢复 → default:**

1. edit-rem 恢复为 "default"

---

#### TC-FIELD-005: isDocument — 切换文档标志

**优先级:** P0 | **类型:** 字段覆盖 + UI

**测试步骤:**

1. read-rem 获取一个非文档 Rem (isDocument: false)
2. edit-rem: `"isDocument": false` → `"isDocument": true`
   **预期 CLI:** changes 包含 "isDocument"
3. **Chrome 验证:** Rem 变为文档（可在左侧栏看到）
4. 恢复: 改回 false
5. **Chrome 验证:** Rem 从左侧栏消失

---

#### TC-FIELD-006: parent — 移动 Rem 到另一个父节点

**优先级:** P0 | **类型:** 字段覆盖 + UI

**前置条件:** 存在两个父级文档，子 Rem 在其中一个下面

**测试步骤:**

1. read-rem 获取子 Rem，记录当前 parent
2. edit-rem 修改 parent 为另一个文档的 ID
   **预期 CLI:** changes 包含 "parent"
3. **Chrome 验证:** 子 Rem 出现在新父文档下，原父文档中消失
4. 恢复原始 parent

---

#### TC-FIELD-007: fontSize — 设置标题大小

**优先级:** P0 | **类型:** 字段覆盖 + UI

**测试步骤 A — null → "H1":**

1. read-rem 获取 fontSize 为 null 的 Rem
2. edit-rem: `"fontSize": null` → `"fontSize": "H1"`
   **预期 CLI:** changes 包含 "fontSize"
3. **Chrome 验证:** Rem 文本变为 H1 大号标题样式

**测试步骤 B — "H1" → "H2":**

1. edit-rem: `"fontSize": "H1"` → `"fontSize": "H2"`
3. **Chrome 验证:** 文本缩小为 H2 标题

**测试步骤 C — "H2" → "H3":**

1. edit-rem: `"fontSize": "H2"` → `"fontSize": "H3"`
3. **Chrome 验证:** 文本缩小为 H3 标题

**测试步骤 D — "H3" → null（恢复正文）:**

1. edit-rem: `"fontSize": "H3"` → `"fontSize": null`
3. **Chrome 验证:** 文本恢复普通大小

---

#### TC-FIELD-008: highlightColor — 设置高亮颜色

**优先级:** P0 | **类型:** 字段覆盖 + UI

**需遍历的值:** `null`, `"Red"`, `"Orange"`, `"Yellow"`, `"Green"`, `"Blue"`, `"Purple"`

**测试步骤（以 Red 为例）:**

1. read-rem 获取 highlightColor 为 null 的 Rem
2. edit-rem: `"highlightColor": null` → `"highlightColor": "Red"`
   **预期 CLI:** changes 包含 "highlightColor"
3. **Chrome 验证:** Rem 行背景变为红色
4. 依次测试其他颜色值
5. 恢复: 改回 null
6. **Chrome 验证:** 高亮消失

---

#### TC-FIELD-009: isTodo — 切换待办标志

**优先级:** P0 | **类型:** 字段覆盖 + UI

**测试步骤:**

1. read-rem 获取 isTodo 为 false 的 Rem
2. edit-rem: `"isTodo": false` → `"isTodo": true`
   **预期 CLI:** changes 包含 "isTodo"
3. **Chrome 验证:** Rem 前出现待办复选框（未勾选）
4. 恢复: 改回 false
5. **Chrome 验证:** 复选框消失

---

#### TC-FIELD-010: todoStatus — 设置待办状态

**优先级:** P0 | **类型:** 字段覆盖 + UI

**前置条件:** 目标 Rem 的 isTodo 为 true

**测试步骤 A — null → "Finished":**

1. 确保 isTodo 为 true
2. edit-rem: `"todoStatus": null` → `"todoStatus": "Finished"`
   **预期 CLI:** changes 包含 "todoStatus"
3. **Chrome 验证:** 复选框变为已勾选状态（划线）

**测试步骤 B — "Finished" → "Unfinished":**

1. edit-rem: `"todoStatus": "Finished"` → `"todoStatus": "Unfinished"`
3. **Chrome 验证:** 复选框变为未勾选状态

**测试步骤 C — 语义一致性警告:**

1. 将 isTodo 设为 false
2. 尝试设置 todoStatus
   **预期:** warnings 包含 "Setting 'todoStatus' without 'isTodo: true' may have no effect"

---

#### TC-FIELD-011: isCode — 切换代码块

**优先级:** P0 | **类型:** 字段覆盖 + UI

**测试步骤:**

1. read-rem 获取 isCode 为 false 的 Rem
2. edit-rem: `"isCode": false` → `"isCode": true`
   **预期 CLI:** changes 包含 "isCode"
3. **Chrome 验证:** Rem 内容渲染为代码块样式（灰色背景、等宽字体）
4. 恢复: 改回 false
5. **Chrome 验证:** 恢复普通文本样式

---

#### TC-FIELD-012: isQuote — 切换引用块

**优先级:** P0 | **类型:** 字段覆盖 + UI

**测试步骤:**

1. read-rem 获取 isQuote 为 false 的 Rem
2. edit-rem: `"isQuote": false` → `"isQuote": true`
   **预期 CLI:** changes 包含 "isQuote"
3. **Chrome 验证:** Rem 显示引用块样式（左侧竖线 + 缩进）
4. 恢复: 改回 false

---

#### TC-FIELD-013: isListItem — 切换有序列表项

**优先级:** P1 | **类型:** 字段覆盖 + UI

**测试步骤:**

1. read-rem 获取 isListItem 为 false 的 Rem
2. edit-rem: `"isListItem": false` → `"isListItem": true`
   **预期 CLI:** changes 包含 "isListItem"
3. **Chrome 验证:** Rem 前出现数字序号
4. 恢复

---

#### TC-FIELD-014: isCardItem — 切换卡片项

**优先级:** P1 | **类型:** 字段覆盖 + UI

**测试步骤:**

1. edit-rem: `"isCardItem": false` → `"isCardItem": true`
   **预期 CLI:** changes 包含 "isCardItem"
3. **Chrome 验证:** 观察卡片项样式变化
4. 恢复

---

#### TC-FIELD-015: isSlot — 切换 Powerup 插槽

**优先级:** P2 | **类型:** 字段覆盖

**测试步骤:**

1. edit-rem: `"isSlot": false` → `"isSlot": true`
   **预期 CLI:** changes 包含 "isSlot"
2. read-rem 确认写入成功
3. 恢复

---

#### TC-FIELD-016: isProperty — 切换属性标志

**优先级:** P2 | **类型:** 字段覆盖

**测试步骤:**

1. edit-rem: `"isProperty": false` → `"isProperty": true`
   **预期 CLI:** changes 包含 "isProperty"
2. read-rem 确认写入成功
3. 恢复

---

#### TC-FIELD-017: enablePractice — 切换间隔重复

**优先级:** P1 | **类型:** 字段覆盖

**测试步骤:**

1. read-rem 获取 enablePractice 的当前值
2. edit-rem 切换其布尔值
   **预期 CLI:** changes 包含 "enablePractice"
3. read-rem 确认写入成功
4. 恢复

---

#### TC-FIELD-018: practiceDirection — 设置练习方向

**优先级:** P1 | **类型:** 字段覆盖

**需遍历的值:** `"forward"`, `"backward"`, `"both"`, `"none"`

**测试步骤:**

1. read-rem 获取当前 practiceDirection
2. 依次 edit-rem 为每个值并 read-rem 确认
   **预期 CLI:** 每次 changes 包含 "practiceDirection"
3. 恢复原始值

---

#### TC-FIELD-019: tags — 添加/移除标签

**优先级:** P0 | **类型:** 字段覆盖 + UI

**前置条件:** 知道一个可用的 tag Rem ID

**测试步骤 A — 添加标签:**

1. read-rem 获取当前 tags 数组（如 `[]`）
2. edit-rem 将 tags 从 `[]` 改为 `["tagRemId"]`
   **预期 CLI:** changes 包含 "tags"
3. **Chrome 验证:** Rem 下方出现标签标记
4. read-rem 确认 tags 已更新

**测试步骤 B — 移除标签:**

1. edit-rem 将 tags 从 `["tagRemId"]` 改为 `[]`
   **预期 CLI:** changes 包含 "tags"
3. **Chrome 验证:** 标签标记消失

---

#### TC-FIELD-020: positionAmongstSiblings — 改变兄弟间位置

**优先级:** P1 | **类型:** 字段覆盖 + UI

**前置条件:** 父 Rem 有 3+ 个子 Rem

**测试步骤 A — 单独修改位置（不改 parent）:**

1. read-rem 获取某个子 Rem，记录 positionAmongstSiblings（如 0）
2. edit-rem: `"positionAmongstSiblings": 0` → `"positionAmongstSiblings": 2`
   **预期 CLI:** changes 包含 "positionAmongstSiblings"
3. **Chrome 验证:** Rem 在父文档中的位置从第一个移到第三个
4. read-rem 确认新位置

**测试步骤 B — 同时修改 parent + position（联动）:**

1. edit-rem 同时修改 parent 和 positionAmongstSiblings
   **预期 CLI:** changes 包含 "parent" 和 "positionAmongstSiblings"
3. **Chrome 验证:** Rem 移到新父级的指定位置

**测试步骤 C — 位置超出范围（钳位）:**

1. edit-rem 设置 positionAmongstSiblings 为一个很大的数（如 999）
   **预期:** 被钳位到末尾位置
3. **Chrome 验证:** Rem 出现在兄弟列表末尾

4. 恢复原始位置

---

#### TC-FIELD-021: sources — 添加/移除来源

**优先级:** P1 | **类型:** 字段覆盖

**测试步骤:**

1. read-rem 获取当前 sources 数组
2. edit-rem 添加一个 source ID
   **预期 CLI:** changes 包含 "sources"
3. read-rem 确认 sources 已更新
4. edit-rem 移除该 source
5. read-rem 确认恢复

---

### 7.7 edit-rem 三道防线详细测试

#### TC-GUARD-001: 防线 1 — 未读直接编辑（各种 Rem ID）

**优先级:** P0 | **类型:** 防线

**测试步骤:**

1. disconnect → connect（清空缓存）
2. 尝试 edit-rem 各种未读的 Rem ID
   **预期:** 全部报错 "has not been read yet"

---

#### TC-GUARD-002: 防线 2 — 浏览器手动修改后编辑

**优先级:** P0 | **类型:** 防线

**测试步骤:**

1. read-rem 读取 Rem
2. 在 Chrome RemNote 中手动修改该 Rem 文本
3. 等待 2 秒（确保同步）
4. edit-rem 尝试修改
   **预期:** 报错 "has been modified since last read"
5. read-rem 重新读取
6. edit-rem 再次修改
   **预期:** 成功

---

#### TC-GUARD-003: 防线 3 — 空 old_str

**优先级:** P1 | **类型:** 边界

**测试步骤:**

1. read-rem 读取 Rem
2. `edit-rem --old-str "" --new-str "inject" <remId>`
   **预期:** 行为取决于实现——空字符串可能匹配多处或每处

---

#### TC-GUARD-004: 防线 3 — old_str 包含 JSON 特殊字符

**优先级:** P1 | **类型:** 边界

**测试步骤:**

1. read-rem 读取 Rem
2. 使用包含 `\n`、`\t`、`"` 等转义字符的 old_str
   **预期:** 正确匹配 JSON 序列化中的转义字符

---

### 7.8 edit-rem 只读字段拦截测试

#### TC-RO-001: 修改 id 字段

**优先级:** P1 | **类型:** 只读拦截

**测试步骤:**

1. read-rem 读取 Rem
2. edit-rem 尝试修改 id 值
   **预期:** warnings 包含 "Field 'id' is read-only and was ignored"，changes 为空

---

#### TC-RO-002: 修改 children 字段

**优先级:** P1 | **类型:** 只读拦截

**测试步骤:**

1. edit-rem 尝试修改 children 数组
   **预期:** warnings 包含 "Field 'children' is read-only and was ignored"

---

#### TC-RO-003: 修改 createdAt / updatedAt

**优先级:** P1 | **类型:** 只读拦截

**测试步骤:**

1. edit-rem 尝试修改时间戳
   **预期:** warnings 包含只读警告，无实际变更

---

#### TC-RO-004: 同时修改可写字段 + 只读字段

**优先级:** P1 | **类型:** 混合

**测试步骤:**

1. 构造一个 old_str → new_str 同时改变 text 和 createdAt
   **预期:** text 被更新（出现在 changes），createdAt 被忽略（出现在 warnings）

---

## 8. 回归测试套件

---

### 8.1 Smoke Test（15 分钟）

> 每次代码变更后必须执行

| # | 测试 | 命令 | 预期 | 通过? |
|:--|:--|:--|:--|:--|
| S1 | 启动守护进程 | `connect` | PID + 端口输出 | |
| S2 | 健康检查 | `health` | 三项 ✅ | |
| S3 | 读取 Rem | `read-rem --json <id>` | ok:true + data | |
| S4 | 编辑 Rem | `edit-rem --old-str A --new-str B <id>` | ok:true + changes | |
| S5 | UI 验证 | Chrome 截图 | 文本已更新 | |
| S6 | 恢复编辑 | `edit-rem --old-str B --new-str A <id>` | ok:true | |
| S7 | --json 模式 | `health --json` | 合法 JSON | |
| S8 | 停止守护进程 | `disconnect` | "已停止" | |
| S9 | 断开后 health | `health` | 三项 ❌ + 退出码 2 | |

### 8.2 关键路径回归（30 分钟）

> 每次发版前必须执行

| # | 测试 | 覆盖 |
|:--|:--|:--|
| K1 | S1-S9 Smoke 全部 | 基本功能 |
| K2 | TC-CONN-002 重复启动 | 幂等性 |
| K3 | TC-CONN-005 stale PID | 错误恢复 |
| K4 | TC-EDIT-002 未读直接编辑 | 防线 1 |
| K5 | TC-EDIT-003 old_str 不存在 | 防线 3 |
| K6 | TC-EDIT-005 并发修改 | 防线 2 |
| K7 | TC-EDIT-006 无效 JSON | 后处理 |
| K8 | TC-EDIT-007 只读字段 | 字段保护 |
| K9 | TC-FIELD-001 text | 核心可写字段 |
| K10 | TC-FIELD-007 fontSize (H1/H2/H3/null) | 枚举覆盖 |
| K11 | TC-FIELD-008 highlightColor (全颜色) | 枚举覆盖 |
| K12 | TC-FIELD-009 isTodo | 布尔切换 |
| K13 | TC-FIELD-010 todoStatus + 语义警告 | 联动校验 |
| K14 | TC-FIELD-019 tags 添加/移除 | Diff 算法 |
| K15 | TC-READ-005 不存在的 Rem ID | 错误处理 |

### 8.3 完整回归（2 小时）

> 发版前完整执行一次

包含 8.2 全部 + 以下补充：

| # | 测试 |
|:--|:--|
| F1 | TC-FIELD-002 ~ TC-FIELD-020 所有可写字段 |
| F2 | TC-RO-001 ~ TC-RO-004 所有只读字段拦截 |
| F3 | TC-GUARD-001 ~ TC-GUARD-004 全部防线边界 |
| F4 | TC-CONN-003 端口 8080 占用 |
| F5 | TC-CONN-004 端口 3002 占用 |
| F6 | TC-HLTH-004 Plugin 断连 |
| F7 | TC-DISC-002 未运行时 disconnect |
| F8 | TC-READ-003 --fields 过滤 |
| F9 | TC-READ-004 --full 模式 |
| F10 | 全命令 --json 模式覆盖 |

### 通过标准

| 级别 | 标准 |
|:--|:--|
| **PASS** | 所有 P0 通过 + 90%+ P1 通过 + 无 Critical bug |
| **FAIL（阻塞发版）** | 任何 P0 失败 / 发现 Critical bug / 数据丢失 |
| **CONDITIONAL** | P1 失败有 workaround + 已记录 |

---

## 9. Bug 报告

---

### BUG-001: connect 在端口冲突时报成功但守护进程立即崩溃

**严重程度:** High | **优先级:** P1
**类型:** 功能 | **状态:** Open

**环境:**
- macOS Darwin 25.1.0 / Node.js v22.12.0
- remnote-cli dev 模式 (npx tsx)

**描述:**
当端口 8080 被其他进程占用时，`connect` 命令成功收到 daemon 的 ready 消息并输出 "守护进程已启动"，但 webpack-dev-server 随后因 EADDRINUSE 崩溃，导致守护进程自动退出。用户看到的是成功输出，实际上守护进程已不存在。

**复现步骤:**
1. 启动占用 8080 端口的进程: `python3 -m http.server 8080`
2. 执行 `npx tsx src/index.ts connect`
3. 观察输出: "守护进程已启动（PID: XXXXX）" ← 误导性成功
4. 执行 `npx tsx src/index.ts health`
5. 观察: "守护进程未运行"

**预期行为:**
connect 应等待 webpack-dev-server 也成功启动后才返回 ready，或在 dev-server 崩溃后及时通知 CLI 进程。

**实际行为:**
daemon 在 WS Server 启动后立即发送 ready 消息，此时 webpack-dev-server 尚未完成端口绑定。CLI 收到 ready 后断开与子进程的连接（`child.unref()`），无法感知后续的崩溃。

**影响:** 用户误以为连接成功，后续命令全部失败，排查困难。

**日志证据:**
```
Error: listen EADDRINUSE: address already in use :::8080
[ERROR] webpack-dev-server 退出 (code: 1)
[ERROR] webpack-dev-server 异常退出，守护进程关闭
[INFO] PID 文件已删除
```

**建议修复:**
在 daemon.ts 中，ready 消息应在 WS Server + webpack-dev-server **都**成功绑定端口后才发送。

---

### BUG-002: health 命令非 JSON 模式下输出重复

**严重程度:** Medium | **优先级:** P2
**类型:** UI/输出 | **状态:** Open

**环境:**
- macOS Darwin 25.1.0 / Node.js v22.12.0
- remnote-cli dev 模式 (npx tsx)

**描述:**
当守护进程未运行时，执行 `health` 命令（非 --json 模式），三行 ❌ 状态信息和提示语被重复输出两次。

**复现步骤:**
1. 确保守护进程未运行
2. 执行 `npx tsx src/index.ts health`
3. 观察输出

**预期行为:**
```
❌ 守护进程  未运行
❌ Plugin    未连接
❌ SDK       不可用

提示: 执行 `remnote connect` 启动守护进程
```

**实际行为:**
```
❌ 守护进程  未运行
❌ Plugin    未连接
❌ SDK       不可用

提示: 执行 `remnote connect` 启动守护进程

❌ 守护进程  未运行
❌ Plugin    未连接
❌ SDK       不可用

提示: 执行 `remnote connect` 启动守护进程
```

**影响:** 混淆用户，脚本解析可能出错。--json 模式不受影响。

**可能原因:** `healthCommand` 函数可能被调用了两次（检查 Commander.js 的 action 注册是否重复），或 index.ts 中注册了两次 health 命令。

---

### BUG-003: connect 后 PID 文件不存在（daemon 快速崩溃场景）

**严重程度:** Low | **优先级:** P3
**类型:** 功能 | **状态:** Open（与 BUG-001 关联）

**描述:**
当 daemon 因端口冲突等原因快速崩溃时，PID 文件在 daemon 清理流程中被删除，但 connect 命令已经返回成功。此时 health/edit-rem 等命令正确报告"守护进程未运行"，但用户无法理解为什么刚 connect 成功就不可用了。

**建议:** 随 BUG-001 一起修复。

---

## 附录

### A. 可写字段速查表

| 字段 | 类型 | 有效值 | UI 可观测 |
|:--|:--|:--|:--|
| `text` | `RichText` | 字符串数组/富文本对象 | ✅ 文本内容 |
| `backText` | `RichText \| null` | 同上 / null | ✅ 背面文本 |
| `type` | `string` | `"concept"` / `"descriptor"` / `"default"` | ✅ 类型图标 |
| `isDocument` | `boolean` | true / false | ✅ 左侧栏出现/消失 |
| `parent` | `string \| null` | Rem ID / null | ✅ 位置移动 |
| `fontSize` | `string \| null` | `"H1"` / `"H2"` / `"H3"` / null | ✅ 字号变化 |
| `highlightColor` | `string \| null` | `"Red"` / `"Orange"` / `"Yellow"` / `"Green"` / `"Blue"` / `"Purple"` / null | ✅ 背景色 |
| `isTodo` | `boolean` | true / false | ✅ 复选框 |
| `todoStatus` | `string \| null` | `"Finished"` / `"Unfinished"` / null | ✅ 勾选状态 |
| `isCode` | `boolean` | true / false | ✅ 代码块样式 |
| `isQuote` | `boolean` | true / false | ✅ 引用块样式 |
| `isListItem` | `boolean` | true / false | ✅ 序号 |
| `isCardItem` | `boolean` | true / false | ⚠️ 需验证 |
| `isSlot` | `boolean` | true / false | ⚠️ Powerup 专用 |
| `isProperty` | `boolean` | true / false | ⚠️ Tag 专用 |
| `enablePractice` | `boolean` | true / false | ⚠️ 需在练习模式验证 |
| `practiceDirection` | `string` | `"forward"` / `"backward"` / `"both"` / `"none"` | ⚠️ 需在练习模式验证 |
| `tags` | `string[]` | Rem ID 数组 | ✅ 标签标记 |
| `sources` | `string[]` | Rem ID 数组 | ⚠️ 需验证 |
| `positionAmongstSiblings` | `number \| null` | 0-based 位置索引 | ✅ 顺序变化 |

### B. 只读字段清单（31 个）

`id`, `children`, `isTable`, `portalType`, `portalDirectlyIncludedRem`, `propertyType`, `aliases`, `remsBeingReferenced`, `deepRemsBeingReferenced`, `remsReferencingThis`, `taggedRem`, `ancestorTagRem`, `descendantTagRem`, `descendants`, `siblingRem`, `portalsAndDocumentsIn`, `allRemInDocumentOrPortal`, `allRemInFolderQueue`, `timesSelectedInSearch`, `lastTimeMovedTo`, `schemaVersion`, `embeddedQueueViewMode`, `createdAt`, `updatedAt`, `localUpdatedAt`, `lastPracticed`, `isPowerup`, `isPowerupEnum`, `isPowerupProperty`, `isPowerupPropertyListItem`, `isPowerupSlot`

### C. 退出码定义

| 退出码 | 含义 | 触发场景 |
|:--|:--|:--|
| 0 | 成功 | 命令正常完成 |
| 1 | 业务错误 | 防线拒绝、Plugin 未连接、Rem 不存在等 |
| 2 | 基础设施错误 | 守护进程未运行、不可达 |
