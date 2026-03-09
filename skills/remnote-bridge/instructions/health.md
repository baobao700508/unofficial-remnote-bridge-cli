# health

> 检查系统三层状态（daemon / Plugin / SDK），诊断连接问题。

---

## 功能

`health` 分两步检查系统状态：

1. **本地检查**：读取 PID 文件，确认 daemon 进程是否存活
2. **远程检查**：通过 WS 连接 daemon，获取 Plugin 连接状态和 SDK 就绪状态

---

## 用法

### 人类模式

```bash
remnote-bridge health
```

输出示例（全部健康）：

```
✅ 守护进程  运行中（PID: 12345，已运行 5 分钟）
✅ Plugin    已连接
✅ SDK       就绪

超时: 25 分钟后自动关闭
```

输出示例（部分不健康）：

```
✅ 守护进程  运行中（PID: 12345，已运行 2 分钟）
❌ Plugin    未连接
❌ SDK       未就绪

超时: 28 分钟后自动关闭
```

输出示例（daemon 未运行）：

```
❌ 守护进程  未运行
❌ Plugin    未连接
❌ SDK       不可用

提示: 执行 `remnote-bridge connect` 启动守护进程
```

### JSON 模式

```bash
remnote-bridge --json health
```

### Headless 诊断模式

```bash
# 截图 + 详细状态 + console 错误 + 排查建议
remnote-bridge health --diagnose

# 重载 headless Chrome 页面
remnote-bridge health --reload
```

`--diagnose` 和 `--reload` 不能同时使用，仅在 headless 模式下可用。

---

## JSON 输出

### 全部健康

```json
{
  "ok": true,
  "command": "health",
  "exitCode": 0,
  "daemon": { "running": true, "pid": 12345, "reachable": true, "uptime": 300 },
  "plugin": { "connected": true },
  "sdk": { "ready": true },
  "timeoutRemaining": 1500,
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

### Plugin 未连接

```json
{
  "ok": false,
  "command": "health",
  "exitCode": 1,
  "daemon": { "running": true, "pid": 12345, "reachable": true, "uptime": 120 },
  "plugin": { "connected": false },
  "sdk": { "ready": false },
  "timeoutRemaining": 1680,
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

### daemon 未运行

```json
{
  "ok": false,
  "command": "health",
  "exitCode": 2,
  "daemon": { "running": false },
  "plugin": { "connected": false },
  "sdk": { "ready": false },
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

---

## 检查项详解

| 检查项 | 检查方式 | 含义 |
|--------|----------|------|
| **daemon** | PID 文件 + `kill(pid, 0)` 探活 | 守护进程是否在运行且可达 |
| **plugin** | daemon 内部的 `pluginConnected` 状态 | RemNote Plugin 是否已通过 WS 连接到 daemon |
| **sdk** | Plugin 的 hello 握手中的 `sdkReady` 字段 | RemNote SDK 是否就绪（知识库已加载，可调用 API） |

### 三层关系

```
daemon 运行 → Plugin 连接 → SDK 就绪
```

每一层都依赖前一层。如果 daemon 未运行，Plugin 和 SDK 一定不可用。

---

## 退出码

| 退出码 | 含义 | 触发条件 |
|--------|------|----------|
| 0 | 全部健康 | daemon 运行 + Plugin 已连接 + SDK 就绪 |
| 1 | 部分不健康 | daemon 运行但 Plugin 未连接或 SDK 未就绪 |
| 2 | 不可达 | daemon 未运行，或运行但 WS 连接失败 |

---

## 输出字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `daemon.running` | boolean | 进程是否存活 |
| `daemon.pid` | number | 进程 ID（仅运行时） |
| `daemon.reachable` | boolean | WS 连接是否成功（仅运行时） |
| `daemon.uptime` | number | 运行秒数（仅可达时） |
| `plugin.connected` | boolean | Plugin WS 连接是否建立 |
| `sdk.ready` | boolean | RemNote SDK 是否就绪 |
| `timeoutRemaining` | number | 距自动关闭的剩余秒数（仅可达时） |

---

## Headless 模式附加输出

### health 基础输出（headless 模式下额外字段）

headless 模式下 `health` 基础输出额外包含 `headless` 对象：

```json
{
  "ok": true,
  "command": "health",
  "exitCode": 0,
  "daemon": { "running": true, "pid": 12345, "reachable": true, "uptime": 300 },
  "plugin": { "connected": true },
  "sdk": { "ready": true },
  "timeoutRemaining": 1500,
  "headless": {
    "status": "running",
    "chromeConnected": true,
    "pageUrl": "http://localhost:8080",
    "reloadCount": 0,
    "lastError": null,
    "recentConsoleErrors": []
  }
}
```

### --diagnose 输出

```json
{
  "ok": true,
  "command": "health",
  "mode": "diagnose",
  "headless": { "status": "running", "chromeConnected": true, "pageUrl": "...", "reloadCount": 0, "lastError": null, "recentConsoleErrors": [] },
  "screenshotPath": "/Users/xxx/.remnote-bridge/headless-screenshot-1234567890.png",
  "pluginConnected": true,
  "sdkReady": true
}
```

### --reload 输出

```json
{
  "ok": true,
  "command": "health",
  "mode": "reload"
}
```

---

## 常见问题诊断

| 症状 | 可能原因 | 解决方案 |
|------|----------|----------|
| daemon 未运行 | 未执行 connect / 已超时关闭 | 执行 `connect` |
| daemon 运行但不可达 | WS 端口被占用或配置不匹配 | 检查 `.remnote-bridge.json` 中的 `wsPort` |
| Plugin 未连接（标准模式） | RemNote 未打开 / Plugin 未安装 / URL 不匹配 | 打开 RemNote，确认 Plugin 中的 WS URL 设置 |
| Plugin 未连接（headless 模式） | Chrome 页面加载异常 | `health --diagnose` 查看截图和状态，`health --reload` 重载页面 |
| SDK 未就绪 | 知识库加载中 / Plugin 异常 | 等待几秒后重试，或刷新 RemNote 页面 |
| Chrome 状态 crashed | headless Chrome 崩溃或断开 | `health --reload` 尝试恢复，或 disconnect + connect --headless 重启 |
