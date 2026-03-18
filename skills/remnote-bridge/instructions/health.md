# health

> 检查系统三层状态（daemon / Plugin / SDK），诊断连接问题。

---

## 功能

`health` 检查系统状态，支持两种模式：

1. **全量模式**（默认）：遍历注册表所有活跃实例，逐个查询三层状态
2. **单实例模式**（`--instance` / `--headless`）：只查询指定实例

每个实例的检查分两步：
1. **本地检查**：通过注册表查找实例，确认 daemon 进程是否存活
2. **远程检查**：通过 WS 连接 daemon，获取 Plugin 连接状态和 SDK 就绪状态

### 孪生连接

每个实例的 Plugin 连接会标记是否为**孪生连接**（`plugin.isTwin`）。孪生连接表示 Plugin 的 `twinSlotIndex` 与 daemon 的槽位索引匹配，优先级更高——孪生连接可以抢占非孪生连接。

---

## 用法

### 全量模式（默认）

```bash
remnote-bridge health
```

输出所有活跃实例的状态：

```
=== 实例: default（槽位 0）===
✅ 守护进程  运行中（PID: 12345，已运行 5 分钟）
✅ Plugin    已连接（孪生）
✅ SDK       就绪
超时: 25 分钟后自动关闭

=== 实例: headless（槽位 1）===
✅ 守护进程  运行中（PID: 12346，已运行 2 分钟）
✅ Plugin    已连接（非孪生）
✅ SDK       就绪
✅ Chrome     running
超时: 28 分钟后自动关闭
```

无活跃实例时：

```
没有活跃的实例。执行 `remnote-bridge connect` 启动守护进程。
```

### 单实例模式

```bash
# 指定实例
remnote-bridge --instance work health

# 检查 headless 实例
remnote-bridge --headless health
```

输出格式与之前相同，但只显示一个实例。

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

### 全量模式

```json
{
  "ok": true,
  "command": "health",
  "exitCode": 0,
  "instances": [
    {
      "instance": "default",
      "slotIndex": 0,
      "daemon": { "running": true, "pid": 12345, "reachable": true, "uptime": 300 },
      "plugin": { "connected": true, "isTwin": true },
      "sdk": { "ready": true },
      "timeoutRemaining": 1500
    },
    {
      "instance": "headless",
      "slotIndex": 1,
      "daemon": { "running": true, "pid": 12346, "reachable": true, "uptime": 120 },
      "plugin": { "connected": true, "isTwin": true },
      "sdk": { "ready": true },
      "timeoutRemaining": 1680,
      "headless": {
        "status": "running",
        "chromeConnected": true,
        "pageUrl": "http://localhost:29111",
        "reloadCount": 0,
        "lastError": null,
        "recentConsoleErrors": []
      }
    }
  ]
}
```

### 单实例模式 — 全部健康

```json
{
  "ok": true,
  "command": "health",
  "exitCode": 0,
  "instance": "default",
  "slotIndex": 0,
  "daemon": { "running": true, "pid": 12345, "reachable": true, "uptime": 300 },
  "plugin": { "connected": true, "isTwin": true },
  "sdk": { "ready": true },
  "timeoutRemaining": 1500
}
```

### 单实例模式 — daemon 未运行

```json
{
  "ok": false,
  "command": "health",
  "exitCode": 2,
  "instance": "default",
  "daemon": { "running": false },
  "plugin": { "connected": false },
  "sdk": { "ready": false },
  "error": "守护进程未运行（实例: default），请先执行 remnote-bridge connect"
}
```

### 全量模式 — 无活跃实例

```json
{
  "ok": false,
  "command": "health",
  "exitCode": 2,
  "instances": [],
  "error": "没有活跃的实例，请执行 remnote-bridge connect 启动守护进程"
}
```

---

## 检查项详解

| 检查项 | 检查方式 | 含义 |
|--------|----------|------|
| **daemon** | 注册表查找 + `kill(pid, 0)` 探活 | 守护进程是否在运行且可达 |
| **plugin** | daemon 内部的 `pluginConnected` 状态 | RemNote Plugin 是否已通过 WS 连接到 daemon |
| **plugin.isTwin** | Plugin hello 握手中的 `twinSlotIndex` | 是否为孪生连接（匹配 daemon 槽位索引） |
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
| 0 | 全部健康 | 所有实例三层均通过 |
| 1 | 部分不健康 | daemon 运行但 Plugin 未连接或 SDK 未就绪 |
| 2 | 不可达 | 无活跃实例，或 daemon 不可达 |

---

## 输出字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `instances` | array | 全量模式下所有实例的状态数组 |
| `daemon.running` | boolean | 进程是否存活 |
| `daemon.pid` | number | 进程 ID（仅运行时） |
| `daemon.reachable` | boolean | WS 连接是否成功（仅运行时） |
| `daemon.uptime` | number | 运行秒数（仅可达时） |
| `plugin.connected` | boolean | Plugin WS 连接是否建立 |
| `plugin.isTwin` | boolean | 是否为孪生连接 |
| `sdk.ready` | boolean | RemNote SDK 是否就绪 |
| `timeoutRemaining` | number | 距自动关闭的剩余秒数（仅可达时） |

---

## Headless 模式附加输出

### health 基础输出（headless 实例额外字段）

headless 实例额外包含 `headless` 对象：

```json
{
  "headless": {
    "status": "running",
    "chromeConnected": true,
    "pageUrl": "http://localhost:29101",
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
| 无活跃实例 | 未执行 connect / 已超时关闭 | 执行 `connect` |
| daemon 运行但不可达 | WS 端口被占用或配置不匹配 | 检查 `~/.remnote-bridge/slots.json` 中的端口配置 |
| Plugin 未连接（标准模式） | RemNote 未打开 / Plugin 未安装 / URL 不匹配 | 打开 RemNote，确认 Plugin 中的 WS URL 设置 |
| Plugin 未连接（headless 模式） | Chrome 页面加载异常 | `health --diagnose` 查看截图和状态，`health --reload` 重载页面 |
| SDK 未就绪 | 知识库加载中 / Plugin 异常 | 等待几秒后重试，或刷新 RemNote 页面 |
| Chrome 状态 crashed | headless Chrome 崩溃或断开 | `health --reload` 尝试恢复，或 disconnect + connect --headless 重启 |
