# disconnect

> 停止守护进程，释放端口、清空缓存、结束会话。

---

## 功能

`disconnect` 向守护进程发送 SIGTERM 信号，触发优雅关闭：

1. 关闭 WS Server（断开所有连接）
2. 关闭 ConfigServer
3. 停止 webpack-dev-server 子进程
4. 删除 PID 文件
5. 内存缓存随进程退出自动消失

---

## 用法

### 人类模式

```bash
remnote-bridge disconnect
```

输出示例：

```
正在停止守护进程（PID: 12345）...
守护进程已停止
```

### JSON 模式

```bash
remnote-bridge --json disconnect
```

---

## JSON 输出

### 正常停止

```json
{
  "ok": true,
  "command": "disconnect",
  "wasRunning": true,
  "pid": 12345,
  "forced": false,
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

### 强制终止（SIGTERM 超时后 SIGKILL）

```json
{
  "ok": true,
  "command": "disconnect",
  "wasRunning": true,
  "pid": 12345,
  "forced": true,
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

### 未在运行

```json
{
  "ok": true,
  "command": "disconnect",
  "wasRunning": false,
  "timestamp": "2026-03-06T10:00:00.000Z"
}
```

---

## 关闭流程

```
1. 检查 PID 文件
   └─ 未运行 → 返回 ok + wasRunning: false

2. 发送 SIGTERM
   ├─ 进程已退出 → 清理 PID 文件 → 返回 ok
   └─ 进程仍在 → 进入等待

3. 轮询等待退出（每 200ms 检查一次）
   ├─ 10 秒内退出 → 清理 PID 文件 → 返回 ok + forced: false
   └─ 超时未退出 → 发送 SIGKILL → 清理 PID 文件 → 返回 ok + forced: true
```

### daemon 优雅关闭（SIGTERM 触发）

daemon 收到 SIGTERM 后依次执行：

1. 停止超时计时器
2. 关闭 WS Server（所有 WS 连接断开）
3. 关闭 ConfigServer（HTTP 服务停止）
4. 停止 webpack-dev-server（先 SIGTERM，5 秒后 SIGKILL）
5. 删除 PID 文件
6. 关闭日志流
7. `process.exit(0)`

---

## 副作用

| 影响 | 说明 |
|------|------|
| **缓存清空** | 所有 `rem:*` 和 `tree:*` 缓存随 daemon 进程退出消失 |
| **Plugin 断开** | WS 连接关闭，Plugin 进入重连循环（指数退避） |
| **端口释放** | wsPort / devServerPort / configPort 全部释放 |
| **PID 文件删除** | `.remnote-bridge.pid` 被删除 |
| **日志保留** | `.remnote-bridge.log` 保留（追加写入，不删除） |

---

## 退出码

| 退出码 | 含义 |
|--------|------|
| 0 | 停止成功，或本来就未运行 |

`disconnect` 总是返回 `ok: true`，无论 daemon 是否在运行。

---

## 幂等性

重复调用 `disconnect` 是安全的。如果 daemon 已经停止，命令直接返回 `ok: true, wasRunning: false`。

---

## 输出字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `wasRunning` | boolean | 调用前 daemon 是否在运行 |
| `pid` | number | daemon 的进程 ID（仅 wasRunning=true 时） |
| `forced` | boolean | 是否使用 SIGKILL 强制终止（仅 wasRunning=true 时） |
