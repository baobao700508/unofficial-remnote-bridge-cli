# Headless Chrome 自动启动与诊断

> 本文档描述 `auto-start-headless-chrome` 分支的改动内容。

---

## 背景

之前 `connect` 命令启动守护进程后，需要用户手动在浏览器中打开 RemNote 并激活插件，Plugin 才能通过 WebSocket 连回 daemon。这对 AI agent（如 Claude Code）来说不可行——agent 没有桌面，无法手动操作浏览器。

本次改动让整个流程可以在无人值守的服务器上自动完成。

## 整体流程

```
第一次（有桌面的机器上）：
  remnote-bridge setup
    → 打开有界面的 Chrome
    → 用户登录 RemNote
    → 关闭浏览器 → 写入 .setup-done 标记
    → 登录态持久化到 ~/.remnote-bridge/chrome-profile/

后续（可在无桌面环境）：
  remnote-bridge connect --headless
    → daemon 启动 WS Server + webpack-dev-server
    → Puppeteer 启动无头 Chrome，复用已保存的登录态
    → Chrome 加载 RemNote 页面 → 插件激活 → Plugin 连回 daemon
    → 完整链路自动建立

出问题时：
  remnote-bridge health --json        ← 看哪层断了
  remnote-bridge diagnose --json      ← Chrome 详细状态 + 截图 + console 错误
  remnote-bridge diagnose --reload    ← 手动重载页面
```

## 新增文件

| 文件 | 说明 |
|------|------|
| `src/cli/commands/setup.ts` | `setup` 命令：首次登录引导 |
| `src/cli/commands/diagnose.ts` | `diagnose` 命令：headless 诊断与修复 |
| `src/cli/daemon/headless-browser.ts` | `HeadlessBrowserManager`：Chrome 生命周期管理 |

## 修改文件

| 文件 | 改动 |
|------|------|
| `src/cli/commands/connect.ts` | 新增 `--headless` / `--remoteDebuggingPort` 选项 |
| `src/cli/daemon/daemon.ts` | 集成 HeadlessBrowserManager，传入 WS Server |
| `src/cli/server/ws-server.ts` | 新增 `diagnose`、`headless_reload` 内部 action；`get_status` 附加 headless 状态 |
| `src/cli/protocol.ts` | `StatusResult` 增加 `headless` 字段；新增 `DiagnoseResult` 类型 |
| `src/cli/commands/health.ts` | 显示 Chrome 状态行 |
| `src/cli/config.ts` | 新增 `HeadlessConfig` 配置（chromePath / userDataDir / remoteDebuggingPort） |
| `src/cli/main.ts` | 注册 `setup`、`diagnose` 命令 |
| `package.json` | 新增 `puppeteer-core` 依赖 |

---

## 新增命令

### `remnote-bridge setup`

首次使用引导。打开有界面的 Chrome 让用户登录 RemNote，关闭后写入 `.setup-done` 标记。

- 检测桌面环境（Linux 下检查 `DISPLAY` / `WAYLAND_DISPLAY`），沙箱/SSH/Docker 中会报错
- 登录态持久化到 `~/.remnote-bridge/chrome-profile/`（user data dir）
- 已完成时提示跳过

### `remnote-bridge connect --headless`

在 daemon 启动后自动启动无头 Chrome：

1. 检查 `.setup-done` 标记（未 setup 则报错）
2. 通过环境变量 `REMNOTE_HEADLESS=1` 通知 daemon
3. daemon 内 `HeadlessBrowserManager` 使用 puppeteer-core 启动 Chrome
4. 导航到 `http://localhost:<devServerPort>`（webpack-dev-server 提供的插件页面）
5. Chrome 复用已保存的登录态，RemNote 加载后插件自动激活

可选 `--remote-debugging-port <port>` 暴露 Chrome DevTools 远程调试端口。

### `remnote-bridge diagnose`

AI agent 专用的诊断命令：

```bash
# 查看完整状态
remnote-bridge diagnose --json

# 返回：
{
  "headless": {
    "status": "running",          // stopped/starting/running/crashed/reloading
    "chromeConnected": true,
    "pageUrl": "http://localhost:8080",
    "reloadCount": 0,
    "lastError": null,
    "recentConsoleErrors": [],
    "screenshotPath": "/home/user/.remnote-bridge/diagnose-screenshot.png"
  },
  "pluginConnected": true,
  "sdkReady": true,
  "logFile": "/path/to/.remnote-bridge.log"
}

# 手动重载 Chrome 页面
remnote-bridge diagnose --reload
```

---

## HeadlessBrowserManager 健康监控

### 自动监控（无需干预）

| 事件 | 行为 |
|------|------|
| 页面崩溃（`page.on('error')`） | 标记 `crashed`，10s 后自动重载页面 |
| 导航失败 | 标记 `crashed`，10s 后自动重载页面 |
| Chrome 进程断连 | 标记 `crashed`，记录错误（可能 OOM） |
| 页面 `console.error` | 写入 daemon 日志，缓存最近 20 条 |
| 自动重载上限 | 最多 5 次，超过后停止自动恢复 |

### 暴露给外部的接口

| 方法 | 用途 |
|------|------|
| `getDiagnostics()` | 返回结构化状态（供 `get_status`、`diagnose` 使用） |
| `takeScreenshot()` | 截图保存到文件（供 AI agent 查看页面状态） |
| `manualReload()` | 手动重载（重置重试计数，供 `diagnose --reload` 使用） |

---

## 配置

`.remnote-bridge.json` 新增 `headless` 字段：

```json
{
  "headless": {
    "chromePath": "/usr/bin/google-chrome",
    "userDataDir": "~/.remnote-bridge/chrome-profile",
    "remoteDebuggingPort": 9222
  }
}
```

所有字段可选，有默认值。`chromePath` 默认自动查找系统 Chrome。

---

## AI Agent 排查流程

```
connect --headless 后命令报 "Plugin 未连接"
  │
  ├─ remnote-bridge health --json
  │    看 headless.status 和 pluginConnected
  │
  ├─ remnote-bridge diagnose --json
  │    看 recentConsoleErrors、screenshotPath、lastError
  │
  ├─ 截图显示登录页？
  │    → 登录态过期，需在有桌面的机器上重新 setup
  │
  ├─ Chrome crashed / 断连？
  │    → remnote-bridge diagnose --reload
  │    → 还不行 → disconnect + connect --headless
  │
  └─ 查完整日志
       → cat .remnote-bridge.log
```

---

## 层边界说明

本次改动符合项目分层约束：

- `HeadlessBrowserManager` 放在 `src/cli/daemon/`（基础设施层），不涉及业务编排
- `diagnose`、`headless_reload` 是基础设施命令，不经过 Plugin 的 bridge→services 链路
- WS Server 只负责路由，诊断逻辑委托给 `HeadlessBrowserManager`
- `setup` 命令不涉及 daemon/WS/Plugin，独立运行
