# connect

> 启动守护进程，建立 CLI ↔ Plugin 通信通道。这是所有业务命令的前置步骤。

---

## 功能

`connect` 以 fork 子进程方式启动后台守护进程（daemon），daemon 内部启动三个服务：

| 服务 | 默认端口 | 用途 |
|------|----------|------|
| WS Server | 3002 | CLI 命令 ↔ daemon ↔ Plugin 的双向通信 |
| webpack-dev-server | 8080 | 将 remnote-plugin 热加载到 RemNote 浏览器 |
| ConfigServer | 3003 | HTTP 配置管理界面 |

daemon 启动后脱离父进程（detached），CLI 进程退出但 daemon 继续运行。

---

## ⚠️ connect 后需要用户配合

`connect` 成功只意味着 daemon 和 webpack-dev-server 已启动，**Plugin 并未自动连接**。用户必须在 RemNote 中完成以下操作：

### 首次使用（RemNote 从未加载过此插件）

1. 打开 RemNote 桌面端或网页端
2. 点击左侧边栏底部的插件图标（拼图形状）
3. 点击「开发你的插件」（Develop Your Plugin）
4. 在输入框中填入 `http://localhost:8080`（即 connect 输出的 webpack-dev-server 地址）
5. 等待插件加载完成

### 非首次使用（之前已加载过此插件）

只需**刷新 RemNote 页面**即可（浏览器 F5 或 Cmd+R），插件会自动重新连接到已启动的 daemon。

### AI Agent 注意事项

- 执行 `connect` 后，**必须立即告知用户完成上述操作**
- **禁止在 connect 后直接调用业务命令**——此时 Plugin 尚未连接，命令会报 "Plugin 未连接" 错误
- 引导用户完成操作后，用 `health` 确认三层就绪（daemon → Plugin → SDK），再执行业务命令

---

## 用法

### 人类模式

```bash
remnote-bridge connect
```

输出示例：

```
守护进程已启动（PID: 12345）
  WS Server:         ws://127.0.0.1:3002
  webpack-dev-server: http://localhost:8080
  配置页面:          http://127.0.0.1:3003
  超时: 30 分钟无 CLI 交互后自动关闭
```

### JSON 模式

```bash
remnote-bridge --json connect
```

---

## JSON 输出

### 首次启动

```json
{
  "ok": true,
  "command": "connect",
  "alreadyRunning": false,
  "pid": 12345,
  "wsPort": 3002,
  "devServerPort": 8080,
  "configPort": 3003,
  "timeoutMinutes": 30,
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

### 已在运行

```json
{
  "ok": true,
  "command": "connect",
  "alreadyRunning": true,
  "pid": 12345,
  "wsPort": 3002,
  "devServerPort": 8080,
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

### 启动失败

```json
{
  "ok": false,
  "command": "connect",
  "error": "守护进程启动超时（60 秒）",
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

---

## 启动流程

```
1. 检查 PID 文件 (.remnote-bridge.pid)
   ├─ 已在运行 → 返回 ok + alreadyRunning: true
   └─ 未运行 / stale PID → 继续

2. fork 守护进程（detached, stdio 全部 ignore）

3. daemon 内部按顺序启动：
   ├─ WS Server（必须成功，否则 daemon 退出）
   ├─ ConfigServer（非关键，失败不阻塞）
   └─ webpack-dev-server（含依赖自动安装 + 崩溃重试）

4. daemon 写入 PID 文件

5. daemon 通过 IPC 发送 ready 信号给父进程

6. 父进程（CLI）收到 ready → 输出结果 → 退出
   ├─ 60 秒内未收到 → 超时失败
   └─ 收到 error → 启动失败
```

---

## Windows 注意事项

- **首次 connect 较慢**：daemon 启动时会自动安装 remnote-plugin 的依赖（约 600+ 个包），在 Windows 上可能需要 30-60 秒。connect 命令的超时为 60 秒
- **依赖自动修复**：如果 webpack-dev-server 因依赖损坏而崩溃，daemon 会自动执行清洁重装（删除 node_modules + package-lock.json 后重新安装）并重试，最多重试 2 次，无需手动干预
- **端口残留**：多次 connect 失败后可能出现端口被占用（`EADDRINUSE`），先执行 `remnote-bridge disconnect`，如仍有残留可通过 `netstat -ano | findstr 3002` 定位 PID 后 `taskkill /F /PID <pid>` 强制终止

---

## 超时机制

daemon 启动后开始计时，默认 **30 分钟无 CLI 交互**自动关闭（执行优雅 shutdown）。每次收到 CLI 请求时重置计时器。

超时时间可通过配置文件 `.remnote-bridge.json` 的 `daemonTimeoutMinutes` 字段调整。

---

## 幂等性

重复调用 `connect` 是安全的。如果 daemon 已在运行，命令直接返回 `ok: true, alreadyRunning: true`，不会启动第二个实例。

---

## 退出码

| 退出码 | 含义 |
|--------|------|
| 0 | 启动成功，或已在运行 |
| 1 | 启动失败（超时、端口冲突、webpack-dev-server 异常等） |

---

## 配置依赖

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| wsPort | 3002 | WS Server 监听端口 |
| devServerPort | 8080 | webpack-dev-server 端口 |
| configPort | 3003 | ConfigServer 端口 |
| daemonTimeoutMinutes | 30 | 无活动自动关闭的分钟数 |

三个端口不允许冲突（配置加载时校验）。

---

## 产生的文件

| 文件 | 位置 | 生命周期 |
|------|------|----------|
| `.remnote-bridge.pid` | 项目根目录 | daemon 运行期间存在，关闭时删除 |
| `.remnote-bridge.log` | 项目根目录 | 追加写入，跨会话保留 |
