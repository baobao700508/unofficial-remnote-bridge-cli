# connect

> 启动守护进程，建立 CLI ↔ Plugin 通信通道。这是所有业务命令的前置步骤。

---

## 功能

`connect` 以 fork 子进程方式启动后台守护进程（daemon），daemon 内部启动三个服务：

| 服务 | 槽位 0 端口 | 用途 |
|------|------------|------|
| WS Server | 29100 | CLI 命令 ↔ daemon ↔ Plugin 的双向通信 |
| Plugin 服务 | 29101 | 将 remnote-plugin 加载到 RemNote 浏览器（默认静态服务器，`--dev` 时为 webpack-dev-server） |
| ConfigServer | 29102 | HTTP 配置管理界面 |

daemon 启动后脱离父进程（detached），CLI 进程退出但 daemon 继续运行。

---

## 多实例支持（`--instance`）

`connect` 支持通过 `--instance <name>` 启动多个独立的 daemon 实例，每个实例连接不同的 RemNote 知识库。

```bash
# 默认实例
remnote-bridge connect

# 指定实例名
remnote-bridge connect --instance work
remnote-bridge connect --instance personal

# JSON 模式
remnote-bridge --json connect --instance work
```

**槽位机制**：系统最多支持 4 个并发实例，每个实例占用一个槽位（固定端口组）：

| 槽位 | WS 端口 | Plugin 服务端口 | 配置端口 |
|:-----|:--------|:---------------|:---------|
| 0 | 29100 | 29101 | 29102 |
| 1 | 29110 | 29111 | 29112 |
| 2 | 29120 | 29121 | 29122 |
| 3 | 29130 | 29131 | 29132 |

**实例名解析优先级**：CLI `--instance` 参数 > 环境变量 `REMNOTE_BRIDGE_INSTANCE` > 默认值 `default`。

**⚠️ `headless` 是保留实例名**：`--instance headless` 会直接报错。headless 模式必须使用专用的 `--headless` 全局选项（见下方 Headless 模式章节）。

**首次使用多实例时**，用户需在 RemNote 中为每个实例分别配置 dev plugin URL（对应各自的 Plugin 服务端口）。

---

## 两种模式

### 标准模式（默认）

启动 daemon 后需要用户手动在 RemNote 中加载 Plugin。适用于用户已打开 RemNote 的场景。

### Headless 模式（`--headless`）

自动启动 headless Chrome 加载 Plugin，无需用户操作。适用于无 GUI 环境或全自动连接场景。

**前置条件**：必须先执行 `setup` 完成 RemNote 登录。

```bash
# 首次：先 setup 登录
remnote-bridge setup

# 然后启动 headless 连接
remnote-bridge connect --headless

# JSON 模式
remnote-bridge --json connect --headless
```

Headless 模式下 Plugin 可能需要 10-30 秒才能连接到 daemon，使用 `health` 确认就绪。

`--headless` 是全局选项，headless 会话中**所有命令都需要带上**：

```bash
remnote-bridge --headless connect    # 启动
remnote-bridge --headless health     # 检查
remnote-bridge --headless read-rem --json '{"remId":"..."}'  # 业务命令
remnote-bridge --headless disconnect # 结束
```

排查工具：`health --diagnose`（截图+状态+console 错误）、`health --reload`（重载 Chrome 页面）。

---

## ⚠️ 标准模式：connect 后需要用户配合

`connect`（不传 `--headless`）成功只意味着 daemon 和 Plugin 服务已启动，**Plugin 并未自动连接**。用户必须在 RemNote 中完成以下操作：

### 首次使用（RemNote 从未加载过此插件）

1. 打开 RemNote 桌面端或网页端
2. 点击左侧边栏底部的插件图标（拼图形状）
3. 点击「开发你的插件」（Develop Your Plugin）
4. 在输入框中填入 connect 输出的 Plugin 服务地址（如 `http://localhost:29101`）
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
正在启动守护进程（实例: default，槽位: 0）...
守护进程已启动（PID: 12345，实例: default）
  WS Server:         ws://127.0.0.1:29100
  Plugin 服务:       http://localhost:29101
  配置页面:          http://127.0.0.1:29102
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
  "instance": "default",
  "pid": 12345,
  "wsPort": 29100,
  "devServerPort": 29101,
  "configPort": 29102,
  "slotIndex": 0,
  "timeoutMinutes": 30,
  "headless": false,
  "portChanged": false,
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

### 已在运行

```json
{
  "ok": true,
  "command": "connect",
  "alreadyRunning": true,
  "instance": "default",
  "pid": 12345,
  "wsPort": 29100,
  "devServerPort": 29101,
  "configPort": 29102,
  "slotIndex": 0,
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

### 启动失败

```json
{
  "ok": false,
  "command": "connect",
  "error": "已达最大实例数上限（4），无可用槽位"
}
```

---

## 启动流程

```
1. 解析实例名（--instance / 环境变量 / 默认 'default'）

2. 加载注册表，清理过期槽位
   ├─ 实例已在运行 → 返回 ok + alreadyRunning: true
   └─ 未运行 → 继续

3. 分配槽位（第一个空闲槽位）
   ├─ 无空闲 → 报错 "已达最大实例数上限（4）"
   └─ 有空闲 → 占位

4. fork 守护进程（detached, 传入 SLOT_INDEX / SLOT_WS_PORT 等环境变量）

5. daemon 内部按顺序启动：
   ├─ WS Server（必须成功，否则 daemon 退出）
   ├─ ConfigServer（非关键，失败不阻塞）
   └─ Plugin 服务（默认静态服务器；--dev 时为 webpack-dev-server）

6. daemon 通过 IPC 发送 ready 信号给父进程

7. 父进程（CLI）收到 ready → 更新注册表 → 输出结果 → 退出
   ├─ 60 秒内未收到 → 超时失败，释放槽位
   └─ 收到 error → 启动失败，释放槽位
```

---

## Windows 注意事项

- **默认模式秒级启动**：使用预构建 plugin，无需安装依赖
- **`--dev` 模式首次较慢**：会自动安装 remnote-plugin 的依赖（约 600+ 个包），在 Windows 上可能需要 30-60 秒。connect 命令的超时为 60 秒
- **`--dev` 依赖自动修复**：如果 webpack-dev-server 因依赖损坏而崩溃，daemon 会自动执行清洁重装（删除 node_modules + package-lock.json 后重新安装）并重试，最多重试 2 次，无需手动干预
- **端口残留**：多次 connect 失败后可能出现端口被占用（`EADDRINUSE`），先执行 `remnote-bridge disconnect`（或 `remnote-bridge clean` 清理所有实例），如仍有残留可通过 `netstat -ano | findstr 29100` 定位 PID 后 `taskkill /F /PID <pid>` 强制终止

---

## 超时机制

daemon 启动后开始计时，默认 **30 分钟无 CLI 交互**自动关闭（执行优雅 shutdown）。每次收到 CLI 请求时重置计时器。

超时时间可通过配置文件 `~/.remnote-bridge/config.json` 的 `daemonTimeoutMinutes` 字段调整。

---

## 幂等性

重复调用 `connect` 是安全的。如果 daemon 已在运行，命令直接返回 `ok: true, alreadyRunning: true`，不会启动第二个实例。

---

## 退出码

| 退出码 | 含义 |
|--------|------|
| 0 | 启动成功，或已在运行 |
| 1 | 启动失败（超时、端口冲突、Plugin 服务异常等） |

---

## 配置依赖

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| daemonTimeoutMinutes | 30 | 无活动自动关闭的分钟数 |

端口由槽位自动分配（29100/29110/29120/29130 系列），通过 `~/.remnote-bridge/slots.json` 自定义。

配置文件位置：`~/.remnote-bridge/config.json`（全局配置，所有实例共享）。

---

## 产生的文件

| 文件 | 位置 | 生命周期 |
|------|------|----------|
| `{slotIndex}.pid` | `~/.remnote-bridge/instances/` | daemon 运行期间存在，关闭时删除 |
| `{slotIndex}.log` | `~/.remnote-bridge/instances/` | 追加写入，跨会话保留 |
| `registry.json` | `~/.remnote-bridge/` | 记录实例→槽位映射，进程退出后自动清理 |
| `slots.json` | `~/.remnote-bridge/` | 槽位端口定义，不存在时自动生成默认值 |
