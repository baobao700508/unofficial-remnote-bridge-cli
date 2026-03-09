# Headless Chrome 自动启动功能 — 需求与实现文档

## 一、需求背景

remnote-bridge 原有的 connect 命令要求用户手动打开浏览器访问 RemNote 页面，Plugin 才能通过 WebSocket 与 daemon 建立连接。这在以下场景中不可用：

- 远程服务器（无 GUI）
- CI/CD 流水线
- Docker 容器
- 任何需要全自动运行的 AI Agent 环境

**核心需求**：让 daemon 自动启动一个无头 Chrome，加载 RemNote 页面，实现零人工干预的全自动连接。

## 二、设计决策

### 2.1 两阶段分离：setup + connect --headless

| 阶段 | 命令 | 环境要求 | 频率 |
|:-----|:-----|:---------|:-----|
| 登录 | `remnote-bridge setup` | 需要桌面环境（GUI Chrome） | 一次性 |
| 运行 | `remnote-bridge connect --headless` | 无需 GUI | 每次启动 |

**为什么分两步**：RemNote 登录需要用户交互（输入密码、2FA 等），无法在无头模式下完成。通过 setup 将登录态持久化到 Chrome profile 目录，之后 headless 模式复用该 profile 即可跳过登录。

### 2.2 依赖选择

- 使用 `puppeteer-core`（不捆绑 Chrome），用户系统上的 Chrome/Chromium 即可
- Chrome 路径自动检测 + 配置文件可覆盖

### 2.3 生命周期归属

HeadlessBrowser 由 daemon 管理，注入到 BridgeServer。符合现有架构：

```
daemon（进程管理）
  ├── BridgeServer（WS 通信）
  ├── PluginServer（Plugin 服务：默认静态文件服务器，--dev 时为 webpack-dev-server）
  └── HeadlessBrowserManager（Chrome 进程）← 新增
```

> **注意**：headless 模式默认使用静态文件服务器（预构建 plugin，秒级启动），不需要 webpack-dev-server。
> 这与自动化环境（CI/CD、Docker、无 GUI 服务器）的"快速启动"需求天然契合。

## 三、新增/修改文件清单

> `setup`、`connect --headless`、`health --diagnose/--reload` 均属基础设施命令，不经过 Plugin 的 bridge→services 链路，不适用同态命名规则。

### 命令层（src/cli/）

| 文件 | 类型 | 说明 |
|:-----|:-----|:-----|
| `src/cli/commands/setup.ts` | 新增 | setup 命令：首次登录引导 |
| `src/cli/daemon/headless-browser.ts` | 新增 | HeadlessBrowserManager 类：Chrome 进程生命周期管理（放 daemon/ 因属于进程管理范畴） |
| `src/cli/commands/connect.ts` | 修改 | 新增 `--headless`、`--remote-debugging-port` 选项（已有 `--dev` 选项） |
| `src/cli/commands/health.ts` | 修改 | 新增 `--diagnose`、`--reload` 选项 |
| `src/cli/daemon/daemon.ts` | 修改 | 集成 HeadlessBrowserManager 启停，diagnose/reload 在此处理（不在 ws-server） |
| `src/cli/server/ws-server.ts` | 修改 | status 响应附加 headless 信息；diagnose/reload 请求转发到 daemon 注入的回调（server 本身不包含诊断逻辑） |
| `src/cli/protocol.ts` | 修改 | 新增 `StatusResult.headless`、`DiagnoseResult` 类型 |
| `src/cli/main.ts` | 修改 | 注册 setup 命令、connect 新选项、health 新选项 |
| `package.json` | 修改 | 新增 puppeteer-core 依赖 |

### 接入层（skill/ + src/mcp/）— 必须同步更新

| 文件 | 类型 | 说明 |
|:-----|:-----|:-----|
| `skills/remnote-bridge/SKILL.md` | 修改 | 新增 setup、connect --headless、health --diagnose/--reload 的简要说明 |
| `skills/remnote-bridge/instructions/setup.md` | 新增 | setup 命令详细文档 |
| `skills/remnote-bridge/instructions/connect.md` | 修改 | 补充 --headless、--remote-debugging-port 选项说明 |
| `skills/remnote-bridge/instructions/health.md` | 修改 | 补充 --diagnose、--reload 选项说明 |
| `src/mcp/instructions.ts` | 修改 | 同步更新 headless 相关说明 |
| `src/mcp/tools/infra-tools.ts` | 修改 | 新增 setup 工具注册（如需 MCP 暴露） |

## 四、各模块详细实现

### 4.1 setup 命令

**文件**：`src/cli/commands/setup.ts`

**职责**：在有 GUI 的环境中打开真实 Chrome，让用户登录 RemNote，将登录态保存到持久化的 Chrome profile。

**关键流程**：

1. `hasDisplay()` 检测桌面环境
   - Linux: 检查 `DISPLAY` / `WAYLAND_DISPLAY` 环境变量
   - macOS / Windows: 始终返回 true
   - 无桌面 → 报错提示使用远程桌面或 X11 转发

2. `findChromePath()` 自动定位 Chrome
   - Linux: `/usr/bin/google-chrome-stable` → `chromium-browser` → `/snap/bin/chromium`
   - macOS: `/Applications/Google Chrome.app/...`
   - Windows: Program Files 多路径扫描
   - 找不到 → 报错

3. 检查 `.setup-done` 标记文件是否已存在
   - 已存在 → 返回 `{ alreadyDone: true }`

4. 以 GUI 模式启动 Chrome
   - `child_process.spawn(chromePath, ['--user-data-dir=...', remNoteUrl])`
   - 用户完成登录后自行关闭浏览器

5. Chrome 退出 → 写入 `.setup-done` 标记（含时间戳）

**标记文件位置**：`~/.remnote-bridge/chrome-profile/.setup-done`

**JSON 模式**：

`setup` 无位置参数，`--json` 仅改变输出格式：

```bash
remnote-bridge --json setup
```

```json
{ "ok": true, "command": "setup", "profileDir": "~/.remnote-bridge/chrome-profile", "alreadyDone": false }
```

### 4.2 HeadlessBrowserManager

**文件**：`src/cli/daemon/headless-browser.ts`

**职责**：管理无头 Chrome 的完整生命周期——启动、导航、监控、自动恢复、诊断、截图、关闭。

#### 4.2.1 构造参数

```typescript
interface HeadlessBrowserOptions {
  remNoteUrl: string;              // RemNote 页面 URL（来自 Plugin 服务，默认 http://localhost:8080）
  chromePath?: string;             // Chrome 路径（默认自动检测）
  userDataDir?: string;            // profile 目录（默认 ~/.remnote-bridge/chrome-profile）
  remoteDebuggingPort?: number;    // 远程调试端口（可选）
  onLog?: (msg: string, level: 'info' | 'warn' | 'error') => void;
}
```

#### 4.2.2 状态机

```
stopped → starting → running ⇄ reloading
                       ↓
                    crashed → (auto-reload) → reloading → running
```

类型定义：`type HeadlessStatus = 'stopped' | 'starting' | 'running' | 'crashed' | 'reloading'`

#### 4.2.3 启动流程（`start()`）

1. `puppeteer.connect` / `puppeteer.launch`
   - `--headless=new`（新版 headless 模式）
   - `--no-sandbox`（容器环境兼容）
   - `--disable-gpu`、`--disable-dev-shm-usage`
   - `--user-data-dir=<profile>`（复用 setup 时的登录态）
   - 可选 `--remote-debugging-port=<port>`

2. 创建新页面，导航到 `remNoteUrl`
   - `waitUntil: 'domcontentloaded'`

3. 注册监控回调
   - `page.on('error')` → 标记 crashed，触发自动重载
   - `page.on('close')` → 触发自动重载
   - `page.on('console')` → 捕获 error 级别日志（最近 20 条）
   - `browser.on('disconnected')` → 标记 crashed

4. 状态 → `running`

#### 4.2.4 自动恢复机制

**触发条件**：

- 页面崩溃（page error 事件）
- 页面被关闭
- 导航失败
- Chrome 进程断连

**恢复策略**：

- 等待 10 秒后重试（`RELOAD_DELAY_MS = 10000`）
- 最多连续重试 5 次（`MAX_AUTO_RELOADS = 5`）
- 每次重载：创建新 page → 导航到 remNoteUrl → 重新注册监控
- 超过 5 次 → 停止自动恢复，记录错误

#### 4.2.5 诊断接口

**`getDiagnostics()`** 返回：

```json
{
  "status": "running",
  "chromeConnected": true,
  "pageUrl": "http://localhost:8080",
  "reloadCount": 0,
  "lastError": null,
  "recentConsoleErrors": []
}
```

**`takeScreenshot(outputPath?)`**：

- 默认保存到 `~/.remnote-bridge/headless-screenshot-<timestamp>.png`
- 返回截图文件路径
- 用于 `health --diagnose` 的可视化排查

**`manualReload()`**：

- 手动触发页面重载
- 重置自动重载计数器（给用户"再试一次"的机会）

### 4.3 connect --headless

**文件**：`src/cli/commands/connect.ts`

**新增选项**：

| 选项 | 类型 | 说明 |
|:-----|:-----|:-----|
| `--headless` | boolean | 启用无头 Chrome 模式 |
| `--remote-debugging-port <port>` | number | Chrome 远程调试端口 |

**流程变更**：

原有流程：

```
connect → fork daemon → 等待 Plugin 手动连接
```

新增逻辑：

```
connect --headless
  ↓
检查 .setup-done 是否存在
  ↓ 不存在 → 报错："尚未完成登录设置。请先运行: remnote-bridge setup"
  ↓ 存在
通过环境变量传递配置给 daemon 子进程：
  REMNOTE_HEADLESS=1
  REMNOTE_HEADLESS_REMOTE_PORT=<port>  (如指定)
  ↓
daemon 收到后自动启动 HeadlessBrowserManager
```

**JSON 模式**：

`connect` 无位置参数，`--json` 仅改变输出格式。headless 相关选项通过 `--flag` 传递：

```bash
# 人类模式
remnote-bridge connect --headless --remote-debugging-port 9222

# JSON 模式
remnote-bridge --json connect --headless --remote-debugging-port 9222
```

JSON 输出：

```json
{
  "ok": true,
  "command": "connect",
  "pid": 12345,
  "wsPort": 3002,
  "devServerPort": 8080,
  "configPort": 3003,
  "headless": true,
  "remoteDebuggingPort": 9222
}
```

### 4.4 health 命令增强

**文件**：`src/cli/commands/health.ts`

**新增选项**：

| 选项 | 类型 | 说明 |
|:-----|:-----|:-----|
| `--diagnose` | boolean | 深度诊断（截图 + console 错误 + 排查建议） |
| `--reload` | boolean | 手动重载 headless Chrome 页面 |

#### 基础 health（无参数）

输出示例（headless 模式）：

```
daemon:    ✅ 运行中 (PID 12345, uptime 300s)
plugin:    ✅ 已连接
SDK:       ✅ 就绪
Chrome:    🟢 running (重载 0 次)
```

输出示例（普通模式）：

```
daemon:    ✅ 运行中 (PID 12345, uptime 300s)
plugin:    ✅ 已连接
SDK:       ✅ 就绪
（无 Chrome 行）
```

#### health --diagnose

前置检查：先调用 `get_status` 确认是 headless 模式，否则直接报错退出。

```
=== Headless Chrome 诊断 ===
  状态:          running
  Chrome 连接:   ✅
  页面 URL:      http://localhost:8080
  自动重载次数:  0
  最后错误:      (无)

  Plugin:        ✅ 已连接
  SDK:           ✅ 就绪
  日志文件:      ~/.remnote-bridge/daemon.log
  截图:          ~/.remnote-bridge/headless-screenshot-1709971200000.png

=== 排查建议 ===（仅 Plugin 未连接时显示）
  - Chrome 已崩溃 → 尝试 health --reload
  - Chrome 进程丢失 → 需要 disconnect + reconnect --headless
  - Chrome 在运行但 Plugin 未连接 → 查看截图确认页面状态
```

#### health --reload

- 成功：`Headless Chrome 重载成功`
- 失败：`重载失败: <错误原因>`

**JSON 输出（--diagnose）**：

```json
{ "ok": true, "command": "health", "diagnose": { "status": "running", "chromeConnected": true, "pageUrl": "http://localhost:8080", "reloadCount": 0, "lastError": null, "recentConsoleErrors": [], "screenshotPath": "~/.remnote-bridge/headless-screenshot-1709971200000.png" }, "pluginConnected": true, "sdkReady": true }
```

**JSON 输出（--reload）**：

```json
{ "ok": true, "command": "health", "reload": true }
```

#### 非 headless 模式保护

`--diagnose` 和 `--reload` 在普通 connect 下直接返回错误：

> `--diagnose 和 --reload 仅在 headless 模式下可用（connect --headless）`

退出码 1，JSON 模式返回 `{ "ok": false, "command": "health", "error": "..." }`。

### 4.5 daemon 集成

**文件**：`src/cli/daemon/daemon.ts`

**启动顺序**：

1. 创建日志文件
2. 读取环境变量 `REMNOTE_HEADLESS` / `REMNOTE_HEADLESS_REMOTE_PORT`
3. 启动 WS Server
4. 启动 ConfigServer
5. 启动 Plugin 服务（默认静态文件服务器；`--dev` 时为 webpack-dev-server）
6. **【新增】** 如果 `REMNOTE_HEADLESS=1`：
   - a. 创建 HeadlessBrowserManager 实例
   - b. 调用 `headlessBrowser.start()`
   - c. 失败不阻塞 daemon（非致命，日志记录错误）
7. 写 PID 文件
8. 发送 ready 消息给父进程
9. 启动超时计时器

**关闭顺序**：

1. **【新增】** 关闭 HeadlessBrowserManager（需要 Plugin 服务还在运行时关）
2. 关闭 WS Server
3. 关闭 ConfigServer
4. 关闭 Plugin 服务（静态文件服务器 或 webpack-dev-server）
5. 删除 PID 文件

> headless browser 先于 Plugin 服务关闭，因为它依赖 Plugin 服务提供的页面。

### 4.6 WS Server 集成

**文件**：`src/cli/server/ws-server.ts`

> **层边界约束**：server 不碰业务逻辑。诊断和重载的具体实现在 daemon 层（HeadlessBrowserManager），server 仅负责转发。

BridgeServer 通过构造注入接收回调函数（而非直接依赖 HeadlessBrowserManager），新增三个内部 action 的转发：

| action | server 的职责 | 实际执行者 | 需要 Plugin 连接 |
|:-------|:-------------|:----------|:-----------------|
| `get_status` | 调用注入的 `getHeadlessStatus()` 回调，附加到 status 响应 | daemon（HeadlessBrowserManager） | 否 |
| `diagnose` | 调用注入的 `diagnoseHeadless()` 回调，返回结果 | daemon（HeadlessBrowserManager） | 否 |
| `headless_reload` | 调用注入的 `reloadHeadless()` 回调，返回结果 | daemon（HeadlessBrowserManager） | 否 |

这三个 action 都是 daemon 内部处理，不需要转发到 Plugin。server 通过回调注入保持与 headless 模块的解耦（与 handlers 通过 `forwardToPlugin` 回调解耦的模式一致）。

### 4.7 协议类型

**文件**：`src/cli/protocol.ts`

新增类型：

```typescript
// get_status 返回值增强
interface StatusResult {
  pluginConnected: boolean;
  sdkReady: boolean;
  uptime: number;
  timeoutRemaining: number;
  headless?: {                    // 仅 headless 模式存在
    status: string;
    chromeConnected: boolean;
    pageUrl: string | null;
    reloadCount: number;
    lastError: string | null;
  };
}

// diagnose 返回值（新增）
interface DiagnoseResult {
  headless: {
    status: string;
    chromeConnected: boolean;
    pageUrl: string | null;
    reloadCount: number;
    lastError: string | null;
    recentConsoleErrors: string[];
    screenshotPath: string | null;
  };
  pluginConnected: boolean;
  sdkReady: boolean;
  logFile: string;
}
```

## 五、配置

**配置文件**：`.remnote-bridge.json`

```json
{
  "headless": {
    "chromePath": "/usr/bin/google-chrome-stable",
    "userDataDir": "~/.remnote-bridge/chrome-profile",
    "remoteDebuggingPort": 9222
  }
}
```

所有字段可选，有合理默认值：

| 字段 | 默认值 |
|:-----|:-------|
| `chromePath` | 自动检测 |
| `userDataDir` | `~/.remnote-bridge/chrome-profile` |
| `remoteDebuggingPort` | 不启用 |

**优先级**：CLI 参数 > 环境变量 > 配置文件 > 默认值

## 六、数据流总览

```
                        ┌─────────────────────────────┐
                        │       用户首次使用           │
                        │   remnote-bridge setup       │
                        │         ↓                    │
                        │   GUI Chrome 打开 RemNote    │
                        │   用户登录 → 关闭浏览器      │
                        │         ↓                    │
                        │   .setup-done 写入 profile   │
                        └─────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  remnote-bridge connect --headless                               │
│    ↓                                                             │
│  检查 .setup-done → fork daemon (REMNOTE_HEADLESS=1)            │
│    ↓                                                             │
│  ┌─── daemon 进程 ──────────────────────────────────────────┐   │
│  │                                                           │   │
│  │  BridgeServer ◄──── WS ────► RemNote Plugin              │   │
│  │       ↑                            ↑                      │   │
│  │       │ 注入引用                    │ 页面内运行           │   │
│  │       │                            │                      │   │
│  │  HeadlessBrowserManager ───────► Chrome (headless)        │   │
│  │       │  - 监控崩溃                  │  - 加载 Plugin 页面│   │
│  │       │  - 自动重载 (≤5次)           │  - 运行 Plugin     │   │
│  │       │  - 截图诊断                  │  - WS 连回 daemon  │   │
│  │       │  - console 错误采集          │                     │   │
│  │                                                           │   │
│  │  PluginServer ──► serve Plugin ──► http://localhost:8080  │   │
│  │  （默认: 静态文件服务器 / --dev: webpack-dev-server）      │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                   │
│  remnote-bridge health                                           │
│    → get_status → daemon/plugin/SDK + Chrome 状态                │
│                                                                   │
│  remnote-bridge health --diagnose                                │
│    → diagnose → 截图 + console 错误 + 排查建议                    │
│                                                                   │
│  remnote-bridge health --reload                                  │
│    → headless_reload → 手动重载页面                               │
└──────────────────────────────────────────────────────────────────┘
```

## 七、错误处理与边界情况

| 场景 | 处理方式 |
|:-----|:---------|
| setup 在无 GUI 环境运行 | `hasDisplay()` 检测失败 → 报错提示使用 X11 转发 |
| Chrome 找不到 | `findChromePath()` 返回 null → 报错提示安装或配置 chromePath |
| `connect --headless` 但未 setup | 检查 `.setup-done` → 报错提示先运行 setup |
| Chrome 启动失败 | daemon 记录日志但继续运行（非致命），health 显示状态 |
| 页面崩溃 | 自动重载，10 秒延迟，最多 5 次 |
| 连续 5 次重载失败 | 停止自动恢复，`lastError` 记录原因，等待用户 `--reload` 或重启 |
| Chrome 进程彻底丢失 | `browser.disconnected` 事件 → 标记 crashed，需要 disconnect + reconnect |
| 登录态过期 | Plugin 无法连接 → `health --diagnose` 截图可确认 → 需要重新 setup |
| `--diagnose`/`--reload` 在普通模式 | 前置检查拦截 → 明确报错"仅在 headless 模式下可用" |

## 八、用户操作流程

```bash
# 1. 首次：在有桌面的机器上登录
remnote-bridge setup
# → 打开 Chrome，登录 RemNote，关闭浏览器

# 2. 日常：无头模式启动
remnote-bridge connect --headless
# → 自动启动 Chrome，加载 Plugin，建立连接

# 3. 检查状态
remnote-bridge health
# → 显示 daemon / plugin / SDK / Chrome 四项状态

# 4. 出问题时诊断
remnote-bridge health --diagnose
# → 截图 + console 错误 + 排查建议

# 5. 尝试恢复
remnote-bridge health --reload
# → 重载页面，重置自动恢复计数

# 6. 彻底重启
remnote-bridge disconnect
remnote-bridge connect --headless

# 7. 登录态过期，重新登录
remnote-bridge disconnect
remnote-bridge setup
remnote-bridge connect --headless
```

## 九、实施状态

> **本功能尚未实现。** 本文档为初始需求规范，记录设计决策和详细方案。
> 之前在 PR #2（`claude/auto-start-headless-chrome-NgiUT`）上有过原型探索，该 PR 已关闭，代码未合入 develop。
> 实施时需基于当前 develop 分支从头开发，并注意：
> - Plugin 服务已从 webpack-dev-server 改为默认静态文件服务器（PR #3），headless 模式天然适配
> - `PluginServer` 接口已统一（`static-server.ts` 导出），新增 HeadlessBrowserManager 时遵循同样的注入模式
