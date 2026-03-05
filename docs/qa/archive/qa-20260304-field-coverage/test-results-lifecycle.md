# connect/health/disconnect 生命周期测试结果

测试时间: 2026-03-04 17:30
测试分支: feat/cli-connect-health
CLI 入口: npx ts-node remnote-cli/src/index.ts

## 测试汇总
- 总数: 9
- PASS: 9
- FAIL: 0

---

## 详细结果

### TC-CONN-001: 首次 connect 成功 -- PASS

**步骤 1**: disconnect 确保干净状态
```
输入: disconnect --json
输出: {"ok":true,"command":"disconnect","wasRunning":true,"pid":99655,"forced":false}
```

**步骤 2**: health 验证 daemon 未运行
```
输入: health --json
输出: {"ok":false,"command":"health","exitCode":2,"daemon":{"running":false},"plugin":{"connected":false},"sdk":{"ready":false}}
退出码: 2
```

**步骤 3**: connect
```
输入: connect --json
输出: {"ok":true,"command":"connect","alreadyRunning":false,"pid":6650,"wsPort":3002,"devServerPort":8080,"timeoutMinutes":30}
```

**步骤 4**: 验证 ok:true -- 确认

**步骤 5**: health 验证三项全绿（等待 3 秒让 Plugin 连接）
```
输入: health --json
输出: {"ok":true,"command":"health","exitCode":0,"daemon":{"running":true,"pid":6650,"reachable":true,"uptime":8},"plugin":{"connected":true},"sdk":{"ready":true},"timeoutRemaining":1799}
```

**结果**: PASS -- daemon 启动成功，Plugin 连接成功，SDK 就绪

---

### TC-CONN-002: 重复 connect -- PASS

**前置**: daemon 已在运行（PID 6650）

```
输入: connect --json
输出: {"ok":true,"command":"connect","alreadyRunning":true,"pid":6650,"wsPort":3002,"devServerPort":8080}
```

**结果**: PASS -- 返回 ok:true 且 alreadyRunning:true，正确处理了重复连接场景（幂等行为）

---

### TC-CONN-003: connect 后 Plugin 恢复 -- PASS

**验证**: connect 后等待 3 秒，health 检查 plugin.connected

```
输入: health --json
输出: {"ok":true,...,"plugin":{"connected":true},"sdk":{"ready":true},...}
```

**结果**: PASS -- Plugin 在 connect 后 3 秒内完成 WebSocket 重连

---

### TC-HLTH-001: health 正常输出 (JSON) -- PASS

**验证 JSON 结构**: 需包含 ok, command, daemon, plugin, sdk

```
输入: health --json
输出: {"ok":true,"command":"health","exitCode":0,"daemon":{"running":true,"pid":6650,"reachable":true,"uptime":20},"plugin":{"connected":true},"sdk":{"ready":true},"timeoutRemaining":1800}
```

**结构校验**:
- ok: true (boolean) -- 存在
- command: "health" (string) -- 存在
- daemon: {running, pid, reachable, uptime} -- 存在
- plugin: {connected} -- 存在
- sdk: {ready} -- 存在
- 额外字段: exitCode, timeoutRemaining

**结果**: PASS -- JSON 结构完整，所有必需字段均存在

---

### TC-HLTH-002: health 无 daemon 时 -- PASS

**前置**: 已 disconnect

```
输入: health --json
输出: {"ok":false,"command":"health","exitCode":2,"daemon":{"running":false},"plugin":{"connected":false},"sdk":{"ready":false}}
退出码: 2
```

**结果**: PASS -- daemon.running=false，exitCode=2 正确反映无守护进程状态

---

### TC-HLTH-003: health 人类可读输出 -- PASS

**daemon 运行时**:
```
输入: health（不加 --json）
输出:
  ✅ 守护进程  运行中（PID: 6650，已运行 25 秒）
  ✅ Plugin    已连接
  ✅ SDK       就绪

  超时: 30 分钟 后自动关闭
```

**daemon 未运行时**:
```
输入: health（不加 --json）
输出:
  ❌ 守护进程  未运行
  ❌ Plugin    未连接
  ❌ SDK       不可用

  提示: 执行 `remnote connect` 启动守护进程
```

**BUG-002 验证**: 通过 stdout/stderr 分离测试确认，stdout 仅输出一份内容，无重复。之前工具界面显示的"重复"是因为 exit code 非零时工具同时展示了 stdout 和 error 区域导致的视觉假象。

**结果**: PASS -- 人类可读输出格式清晰，无重复输出

---

### TC-DISC-001: disconnect 成功 -- PASS

**步骤 1**: disconnect
```
输入: disconnect --json
输出: {"ok":true,"command":"disconnect","wasRunning":true,"pid":6650,"forced":false}
```

**步骤 2**: 验证 ok:true -- 确认

**步骤 3**: health 验证 daemon 已停止
```
输入: health --json
输出: {"ok":false,"command":"health","exitCode":2,"daemon":{"running":false},"plugin":{"connected":false},"sdk":{"ready":false}}
```

**结果**: PASS -- disconnect 正常关闭守护进程，health 确认 daemon 已停止

---

### TC-DISC-002: 重复 disconnect -- PASS

**前置**: 已 disconnect，daemon 未运行

```
输入: disconnect --json
输出: {"ok":true,"command":"disconnect","wasRunning":false}
```

**结果**: PASS -- 返回 ok:true 且 wasRunning:false，幂等处理无错误

---

### TC-DISC-003: disconnect 后 PID 文件清理 -- PASS

**PID 文件位置**: `<项目根>/.remnote-bridge.pid`（来源: `remnote-cli/src/config.ts:82-84`）

```
输入: ls -la .remnote-bridge.pid
输出: No such file or directory
```

**结果**: PASS -- PID 文件在 disconnect 后被正确清理

---

## 发现的 Bug

无新发现的 Bug。

### BUG-002 澄清

此前报告的 "health 重复输出" 问题（BUG-002）经本次测试验证为**误报**：
- 通过 stdout/stderr 分离测试（`1>/tmp/stdout.txt 2>/tmp/stderr.txt`），确认 stdout 仅输出一行内容
- stderr 在所有测试用例中均为空
- 之前观察到的"重复"是测试工具在进程 exit code 非零时同时展示 stdout 内容和 error 区域导致的视觉假象

---

## 环境恢复

测试完成后已重新执行 connect，守护进程已恢复运行：
```
connect --json 输出: {"ok":true,"command":"connect","alreadyRunning":true,"pid":7756,"wsPort":3002,"devServerPort":8080}
health --json 输出: {"ok":true,...,"daemon":{"running":true,"pid":7756},"plugin":{"connected":true},"sdk":{"ready":true},...}
```
