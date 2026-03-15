# clean

> 清理所有 daemon 进程、PID 文件、日志、注册表和 addon 数据。

---

## 功能

`clean` 执行全面清理，适用于系统状态异常或需要彻底重置的场景。

按顺序执行以下清理步骤：

1. **停止所有运行中的 daemon**（遍历注册表，SIGTERM → 5 秒后 SIGKILL）
2. **清理实例文件**（`~/.remnote-bridge/instances/` 下的 PID 和日志文件）
3. **清理注册表**（`~/.remnote-bridge/registry.json`）
4. **清理旧版项目根文件**（`.remnote-bridge.pid`、`.remnote-bridge.log`、`.remnote-bridge.json`，向后兼容）
5. **清理已安装的 Skill**（`~/.claude/skills/remnote-bridge/`）
6. **清理 addon 数据目录**（如 remnote-rag 的索引数据）

---

## 用法

### 人类模式

```bash
remnote-bridge clean
```

输出示例：

```
  已删除: /Users/xxx/.remnote-bridge/instances/0.pid
  已删除: /Users/xxx/.remnote-bridge/instances/0.log
  已删除: /Users/xxx/.remnote-bridge/registry.json

清理完成，共删除 3 项
```

### JSON 模式

```bash
remnote-bridge --json clean
```

---

## JSON 输出

### 清理成功

```json
{
  "ok": true,
  "command": "clean",
  "removed": [
    "/Users/xxx/.remnote-bridge/instances/0.pid",
    "/Users/xxx/.remnote-bridge/instances/0.log",
    "/Users/xxx/.remnote-bridge/registry.json"
  ]
}
```

### 部分失败

```json
{
  "ok": false,
  "command": "clean",
  "removed": ["/Users/xxx/.remnote-bridge/instances/0.pid"],
  "errors": ["删除失败: /Users/xxx/.remnote-bridge/instances/0.log — EPERM"]
}
```

### 无需清理

```json
{
  "ok": true,
  "command": "clean",
  "removed": []
}
```

---

## 退出码

| 退出码 | 含义 |
|:-------|:-----|
| 0 | 清理完成（包括无需清理的情况） |

---

## 适用场景

| 场景 | 说明 |
|:-----|:-----|
| daemon 进程残留 | `disconnect` 无法正常停止时 |
| 端口被占用 | 多次启动失败后的端口残留 |
| 注册表损坏 | 注册表文件不一致时重置 |
| 完整重装 | 清除所有状态从零开始 |

---

## AI Agent 注意事项

- `clean` 是**破坏性操作**——会停止所有 daemon、清空所有缓存和注册表
- 执行 `clean` 后需要重新 `connect` 才能继续操作
- 通常只在排查问题或重置环境时使用，正常流程不需要
