# setup

> 启动 Chrome 浏览器让用户登录 RemNote，保存登录凭证到本地 profile。这是 headless 模式（`connect --headless`）的前置步骤。

---

## 功能

`setup` 启动一个有界面的 Chrome 窗口（使用独立 profile 目录 `~/.remnote-bridge/chrome-profile`），打开 RemNote 登录页面。用户在浏览器中完成登录后关闭 Chrome，命令写入 `.setup-done` 标记并返回。

后续 `connect --headless` 使用相同 profile 目录，复用已保存的登录凭证，实现免登录的 headless 连接。

---

## 前置条件

- 需要**桌面环境（GUI）**，无 GUI 环境会报错
- 需要系统安装 Chrome/Chromium

---

## 用法

### 人类模式

```bash
remnote-bridge setup
```

输出示例：

```
正在启动 Chrome...
请在浏览器中登录 RemNote，完成后关闭浏览器窗口。
setup 完成！
  profile 目录: /Users/xxx/.remnote-bridge/chrome-profile
现在可以使用 `remnote-bridge connect --headless` 启动无头连接。
```

### JSON 模式

```bash
remnote-bridge --json setup
```

---

## JSON 输出

### 首次 setup

```json
{
  "ok": true,
  "command": "setup",
  "profileDir": "/Users/xxx/.remnote-bridge/chrome-profile",
  "alreadyDone": false
}
```

### 已完成 setup

```json
{
  "ok": true,
  "command": "setup",
  "profileDir": "/Users/xxx/.remnote-bridge/chrome-profile",
  "alreadyDone": true
}
```

### 失败

```json
{
  "ok": false,
  "command": "setup",
  "error": "未检测到桌面环境（无 DISPLAY/WAYLAND_DISPLAY），setup 需要 GUI 才能登录"
}
```

---

## AI Agent 使用流程

setup 会弹出 Chrome 窗口，用户需要完成两件事：登录 RemNote + 配置 dev plugin。

### 交互步骤

1. 调用 `setup`
2. **立即告知用户**：
   > 已打开 Chrome 浏览器。请完成以下操作：
   > 1. 登录 RemNote
   > 2. 在 RemNote 中配置开发插件：点击左下角插件图标 → 开发你的插件 → 输入 `http://localhost:8080`
   > 3. 完成后彻底退出 Chrome（macOS 请按 Cmd+Q，仅关窗口不够）
3. 等待 `setup` 命令返回（阻塞式，超时 600 秒）
4. 收到成功 → 继续执行 `connect --headless`

### setup 之后

`setup` 只需执行一次。登录凭证和 plugin 配置都已保存，之后每次只需 `connect --headless` 即可自动连接，无需用户操作。

如果后续 headless 模式下 Plugin 始终不连接，可能是 RemNote 登录 session 过期，需重新 setup（删除 `~/.remnote-bridge/chrome-profile/.setup-done` 后重新执行）。

---

## 幂等性

已完成 setup 后重复调用返回 `ok: true, alreadyDone: true`，不会再次打开 Chrome。

如需重新登录（切换账号），删除 `~/.remnote-bridge/chrome-profile/.setup-done` 文件后重新执行。

---

## 退出码

| 退出码 | 含义 |
|--------|------|
| 0 | 成功（首次完成或已完成） |
| 1 | 失败（无 GUI、无 Chrome、超时等） |

---

## 产生的文件

| 文件 | 位置 | 说明 |
|------|------|------|
| Chrome profile | `~/.remnote-bridge/chrome-profile/` | Chrome 用户数据（含登录凭证） |
| `.setup-done` | `~/.remnote-bridge/chrome-profile/.setup-done` | setup 完成标记（JSON，含时间戳） |

