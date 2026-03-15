# addon

> 管理增强项目（addon）：查看状态、安装、卸载。

---

## 功能

`addon` 命令组管理 remnote-bridge 的增强项目（如 `remnote-rag` 语义搜索）。增强项目是独立安装的可选组件，扩展核心功能。

三个子命令：

| 子命令 | 功能 |
|:-------|:-----|
| `addon list` | 查看所有可用增强项目的状态 |
| `addon install <name>` | 安装并启用指定增强项目 |
| `addon uninstall <name>` | 卸载指定增强项目 |

---

## 用法

### 人类模式

```bash
# 查看所有增强项目
remnote-bridge addon list

# 安装增强项目
remnote-bridge addon install remnote-rag

# 卸载增强项目
remnote-bridge addon uninstall remnote-rag

# 卸载并清理数据目录
remnote-bridge addon uninstall remnote-rag --purge
```

### JSON 模式

```bash
remnote-bridge --json addon list
remnote-bridge --json addon install remnote-rag
remnote-bridge --json addon uninstall remnote-rag
```

---

## JSON 输出

### addon list

```json
{
  "ok": true,
  "command": "addon-list",
  "addons": [
    {
      "name": "remnote-rag",
      "enabled": true,
      "installed": true,
      "settingsValid": true,
      "missingSettings": [],
      "description": "语义搜索增强"
    }
  ]
}
```

### addon install（成功）

```json
{
  "ok": true,
  "command": "addon-install",
  "name": "remnote-rag",
  "action": "installed"
}
```

### addon install（已安装）

```json
{
  "ok": true,
  "command": "addon-install",
  "name": "remnote-rag",
  "action": "already-installed"
}
```

### addon uninstall

```json
{
  "ok": true,
  "command": "addon-uninstall",
  "name": "remnote-rag",
  "purged": false
}
```

### 失败

```json
{
  "ok": false,
  "command": "addon-install",
  "name": "unknown-addon",
  "error": "未知的增强项目: unknown-addon。可用项目: remnote-rag"
}
```

---

## 退出码

| 退出码 | 含义 |
|:-------|:-----|
| 0 | 操作成功 |
| 1 | 操作失败（未知名称、安装/卸载错误等） |

---

## 幂等性

- `addon install`：已安装时返回 `action: "already-installed"`，自动标记为启用
- `addon uninstall`：已卸载时安全返回

---

## 配置依赖

增强项目的启用/禁用状态保存在全局配置 `~/.remnote-bridge/config.json` 中。每个 addon 的独立配置存储在 `~/.remnote-bridge/addons/<name>/config.json` 中。安装后需要在配置页面或配置文件中填写必需的配置项（如 API Key）。
