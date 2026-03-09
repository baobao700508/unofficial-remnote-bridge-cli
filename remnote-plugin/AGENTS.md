# remnote-plugin/ AGENTS.md

> 本文件为 AI Agent 提供此目录的关键上下文，防止误操作。

---

## 目录性质

`remnote-plugin/` 是一个**独立的 npm 项目**，有自己的 `package.json`、依赖树和构建流程。它通过 RemNote Plugin SDK 与 RemNote 交互，是整个 remnote-bridge 的桥接层。

---

## 不要删除的文件（红线）

### `.npmignore`

**用途**：覆盖 `.gitignore` 的 npm 打包行为，确保 `dist/` 被包含在发布的 npm 包中。

**背景**：

- `.gitignore` 包含 `dist/`（构建产物不提交到 git，这是正确的）
- 但根目录 `package.json` 的 `files` 字段需要包含 `remnote-plugin/dist/`（预构建 plugin，供生产模式的静态文件服务器使用）
- npm 的行为：子目录存在 `.gitignore` 时，会**覆盖**根 `package.json` 的 `files` 声明，导致 `dist/` 被排除
- `.npmignore` 存在时，npm **用它替代 `.gitignore`** 来决定打包内容
- `.npmignore` 故意**不包含 `dist/`**，从而让 `dist/` 正确打进 npm 包

**对比**：

| 文件 | 忽略 `dist/` | 忽略 `node_modules/` | 忽略 `PluginZip.zip` | 忽略 `schema.json` |
|:-----|:-------------|:---------------------|:---------------------|:-------------------|
| `.gitignore` | 是 | 是 | 是 | 是 |
| `.npmignore` | **否** | 是 | 是 | 是 |

**禁止**：删除 `.npmignore` 或将 `dist/` 加入其中。否则 `npm publish` 后用户安装的包将缺少预构建 plugin，默认模式（静态文件服务器）无法启动。

### `package-lock.json`

**用途**：锁定此目录 600+ 依赖的精确版本（React、RemNote SDK、webpack 等）。

**禁止**：随意删除。`npm run build:plugin` 依赖它来保证可复现构建。如需更新依赖，使用 `npm update` 而非删除后重建。

### `.gitignore`

**用途**：防止 `dist/`、`node_modules/` 等构建产物提交到 git。

**禁止**：删除 `dist/` 规则。构建产物不应进入版本控制。
