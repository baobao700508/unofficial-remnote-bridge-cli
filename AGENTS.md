# AGENTS.md - AI 代理开发指引

> 目标：让 Agent 在最短时间内拿到"做事所需信息 + 必须遵守的红线 + 常见踩坑经验 + 可下钻的结构地图"。
> 原则：**宏观信息 20–40 行**；**约束单点权威**；**经验只记踩坑**；**微观信息按代码目录就近存放**。

---

## 1. 宏观信息

- **项目是什么**：RemNote 自动化桥接工具集（remnote-bridge-cli），将 RemNote 知识库能力暴露给 AI Agent。
- **核心架构**：三层协作——remnote-plugin（桥接层）→ remnote-cli（命令层）→ remnote-skills / remnote-mcp（接入层）。
- **参考项目**：`reference_repository/`（[remnote-mcp-bridge](https://github.com/robert7/remnote-mcp-bridge) 克隆，已 gitignore）。
- **数据流向**：

```text
AI Assistants (Claude Code / OpenClaw / etc.)
    ↕
remnote-skills (Markdown Skills)  +  remnote-mcp (FastMCP Server)
    ↕                                    ↕
                  remnote-cli (核心命令层)
                      ↕
              remnote-plugin (RemNote 插件)
                      ↕
                  RemNote SDK
```

- **技术栈总览**：

| 层 | 语言/框架 | 状态 |
|:--|:--|:--|
| remnote-plugin | Node.js / TypeScript / RemNote Plugin SDK | 开发中 |
| remnote-cli | Node.js / TypeScript / Commander.js | 开发中 |
| remnote-skills | Markdown (SKILL.md) | 待开发 |
| remnote-mcp | Node.js / TypeScript / FastMCP | 待开发 |

- **我应该从哪里开始看**：
  - 约束红线：见本文件第 2 节
  - 踩坑经验：见本文件第 3 节
  - 目录地图与接口契约：见本文件第 4 节

---

## 2. 约束（红线 / 强约束）

> **红线** = 一票否决，违反即退回；**强约束** = 必须遵守，特殊情况需说明理由。

### 2.1 层边界（红线）

#### 2.1.1 职责划分

| 层 | 职责 | 禁止事项 |
|:--|:--|:--|
| remnote-plugin | 通过 RemNote SDK 与知识库交互，暴露 WebSocket API | 禁止包含 CLI 逻辑或 MCP 协议代码 |
| remnote-cli | 封装 RemNote 操作为统一命令接口 | 禁止直接调用 RemNote SDK（必须通过 remnote-plugin） |
| remnote-skills | 定义 Agent 可调用的技能（Markdown） | 禁止包含运行时代码逻辑 |
| remnote-mcp | 通过 MCP 协议暴露 RemNote 操作为标准工具 | 禁止绕过 remnote-cli 直连 remnote-plugin |

#### 2.1.2 依赖方向

依赖方向：上层 → 下层，**禁止反向**。

```
remnote-skills / remnote-mcp (接入层)
    ↓
remnote-cli (命令层)
    ↓
remnote-plugin (桥接层)
    ↓
RemNote SDK
```

- **禁止**：remnote-plugin 依赖 remnote-cli 或接入层
- **禁止**：remnote-cli 依赖 remnote-skills 或 remnote-mcp
- **允许**：接入层（remnote-skills、remnote-mcp）可同时依赖 remnote-cli

#### 2.1.3 Plugin 内部分层（红线）

remnote-plugin 内部分为**核心链**和**宿主层**两部分：

```
核心链（业务数据流）：bridge → services → utils
宿主层（独立）：widgets（插件入口 + 状态展示）
```

##### 各层职责边界

| 层 | 目录 | 职责 | 包含什么 | 禁止什么 |
|:--|:--|:--|:--|:--|
| **widgets** | `src/widgets/` | RemNote 插件宿主入口 + 状态展示面板 | React 组件、插件生命周期（onActivate/onDeactivate）、UI 渲染 | 禁止包含业务逻辑（不得直接调用 RemNote SDK 的数据操作 API） |
| **bridge** | `src/bridge/` | WS 传输 + 请求路由 | websocket-client（连接管理、协议处理）、message-router（按 action 分发到 services） | 禁止包含 RemNote SDK 调用；禁止包含业务数据转换逻辑 |
| **services** | `src/services/` | 业务操作实现 | 每个文件封装一条完整的 RemNote SDK 操作链 | 禁止管理 WS 连接；禁止依赖 bridge 或 widgets |
| **utils** | `src/utils/` | 无状态纯函数辅助工具 | 富文本解析、内容渲染、Rem 分类等纯函数 | 禁止有副作用；禁止依赖任何其他层 |

##### 关键区分

- **bridge vs services**：bridge 解决「怎么通信」（传输协议、连接管理、请求路由），services 解决「做什么」（调用 RemNote SDK 执行具体操作）。两者界限是：**bridge 不碰 RemNote SDK，services 不碰 WebSocket**。
- **widgets vs bridge**：widgets 通过构造 `WebSocketClient` 实例并调用 `connect()`/`disconnect()` 来启停连接，通过 `setMessageHandler()` 注入 message-router 创建的处理器。widgets **只做接线和展示**，不参与请求处理流程。

##### 同态命名规则（红线）

CLI 业务命令、协议 action、services 文件/函数之间**必须保持同态映射**——从任一层的名称可以机械地推导出其他层的名称：

```
CLI 命令名 (kebab-case)     →  remnote read-note
                                    ↕ 同态
协议 action (snake_case)     →  { action: "read_note", ... }
                                    ↕ 同态
message-router case          →  case 'read_note': return readNote(plugin, payload)
                                    ↕ 同态
services 文件名 (kebab-case)  →  services/read-note.ts
                                    ↕ 同态
services 导出函数 (camelCase) →  export async function readNote(...)
```

| CLI 命令 | 协议 action | message-router case | services 文件 | services 函数 |
|:--|:--|:--|:--|:--|
| `read-note` | `read_note` | `case 'read_note'` | `read-note.ts` | `readNote()` |
| `create-note` | `create_note` | `case 'create_note'` | `create-note.ts` | `createNote()` |
| `search` | `search` | `case 'search'` | `search.ts` | `search()` |
| `search-by-tag` | `search_by_tag` | `case 'search_by_tag'` | `search-by-tag.ts` | `searchByTag()` |

**新增业务命令时，必须在所有四层同时添加同态命名的对应实现。**

> 注意：`connect`、`disconnect`、`health` 是 CLI 的**基础设施命令**（管理守护进程生命周期），不经过 Plugin 的 bridge→services 链路，因此不适用同态命名规则。

##### 依赖方向（红线）

- **核心链**依赖方向单向：bridge → services → utils，**禁止反向**
- **widgets** 可依赖 bridge（接线和读状态），但不属于核心链
- **禁止**：bridge / services / utils 依赖 widgets
- **禁止**：utils 依赖 services / bridge
- **禁止**：services 依赖 bridge
- **检查工具**：`node scripts/check-layer-deps.js`（同时检查跨层和 Plugin 内部依赖）

### 2.2 SDK 文档时效性（强约束）

`docs/RemNote API Reference/INDEX.md` 头部记录了爬取时间。若距上次爬取超过 **7 天**，必须先执行 `./scripts/crawl-remnote-docs.sh` 更新文档，再继续开发任务。

### 2.3 CLI 命令输出规范（红线）

所有 remnote-cli 命令**必须**同时支持人类可读输出和 `--json` 结构化输出。

#### 规则

- 全局 flag `--json` 已在 `index.ts` 注册，通过 `program.opts()` 获取，传递给各命令函数
- **新增命令时必须实现 `--json` 模式**，否则 Agent（Skills / MCP）无法可靠解析输出
- JSON 模式下：仅输出**一行**合法 JSON 到 stdout，**禁止**混入人类可读文本
- JSON 输出**必须**包含 `ok`（boolean）和 `command`（string）字段
- 失败时**必须**包含 `error`（string）字段

#### JSON 输出结构约定

```jsonc
// 成功
{ "ok": true,  "command": "<命令名>", ...命令特定字段 }
// 失败
{ "ok": false, "command": "<命令名>", "error": "<错误描述>", ...可选上下文 }
```

#### 命令函数签名约定

```typescript
export interface XxxOptions {
  json?: boolean;
}
export async function xxxCommand(options: XxxOptions = {}): Promise<void> { ... }
```

---

## 3. 经验

> 记录常见、易错的开发流程和踩坑经验，防止 Agent 重复犯错。


---

## 4. 微观信息

> 本层级的结构地图和关键路径，遵守唯一事实源原则。

### 4.1 目录结构

```
remnote-bridge-cli/
├── remnote-cli/              # 核心命令行工具（开发中）
├── remnote-plugin/           # RemNote 官方框架插件（开发中）
│   └── src/
│       ├── widgets/          # 宿主层：插件入口 + 状态展示
│       ├── bridge/           # 核心链入口：WS 传输 + 消息路由
│       ├── services/         # 核心链：业务操作（与 CLI 命令同态命名）
│       └── utils/            # 核心链：无状态纯函数辅助工具
├── remnote-skills/           # Agent Skills - Markdown 格式（待开发）
├── remnote-mcp/              # MCP Server - Node.js/TypeScript/FastMCP（待开发）
├── scripts/                  # 脚本工具
├── docs/                     # 项目文档
│   └── RemNote API Reference/  # RemNote Plugin SDK 文档（151 页）
├── reference_repository/     # 参考项目（只读，已 gitignore）
├── AGENTS.md                 # 本文件（Agent 导航地图）
├── .gitignore
└── .claude/
    ├── CLAUDE.md             # Claude Code 项目指导
    ├── rules/
    │   └── AGENTS.md → ../../AGENTS.md（符号链接）
    └── skills/
```

### 4.2 RemNote Plugin SDK 文档

> 完整索引已通过符号链接自动加载：`.claude/rules/REMNOTE-SDK-INDEX.md` → `docs/RemNote API Reference/INDEX.md`
> 文档位于 `docs/RemNote API Reference/`，共 151 页，用 `Glob`/`Grep` 按需查找。更新命令：`./scripts/crawl-remnote-docs.sh`

### 4.3 Agent 信息获取指南（重要）

> **核心原则**：本文档只记录**长期不变的架构惯例和约束**。具体模块清单、文件路径、函数签名等**易变信息**，Agent 必须通过工具实时获取，**禁止**依赖文档中的静态列表或凭记忆猜测。

#### 三种工具，按场景选用

| 工具 | 适用场景 | 典型用法 |
|:-----|:-----|:-----|
| **`codebase-retrieval` MCP** | 不确定位置、需要语义理解 | "云盘上传的实现在哪里？"、"权限校验的完整链路" |
| **`Glob` / `Grep`** | 已知模式或关键词的精确搜索 | `Glob("src/domains/**/index.ts")`、`Grep("requirePermission")` |
| **`Explore Agent`** | 多轮搜索、深入理解的复杂探索 | "理解整个认证+权限体系的实现细节和调用链" |

#### 必须使用工具的场景（红线）

1. **开始任务前**：用 `codebase-retrieval` 搜索相关代码，了解现状
2. **编辑文件前**：用 `codebase-retrieval` 查询涉及的所有符号和依赖
3. **大范围修改 / 重构**：用 `codebase-retrieval` + `Glob`/`Grep` 确认完整影响范围
4. **不确定当前有哪些层**：用 `Glob` 扫描目录结构

**禁止**：跳过搜索直接猜测代码结构、层列表或实现方式。

### 4.4 命名约定

本项目中 remnote-plugin、remnote-cli、remnote-skills、remnote-mcp 统一称为**"层"**，不称"模块"。因为它们是横向分割的架构分层，不是纵向分割的功能模块。

| 称呼 | 对应目录 | 角色 |
|:--|:--|:--|
| 桥接层 | `remnote-plugin/` | 通过 RemNote SDK 与知识库交互 |
| 命令层 | `remnote-cli/` | 封装操作为统一 CLI 命令 |
| 接入层 | `remnote-skills/` + `remnote-mcp/` | 暴露给 AI Agent（Skills / MCP） |

### 4.5 会话与缓存架构

#### 会话定义

- **会话（Session）= 守护进程（daemon）的生命周期**
- `remnote-cli connect` 启动守护进程 → 会话开始
- `remnote-cli disconnect` 关闭守护进程 → 会话结束，缓存全部清空
- 每次 CLI 命令调用（`read-rem`、`edit-rem` 等）都是**独立的 OS 进程**，命令进程本身无状态
- 守护进程是 remnote-cli 层的内部组件，不违反层间依赖方向

#### 缓存存储位置

- 缓存存储在**守护进程的内存中**（daemon 是长生命周期进程，CLI 命令是短生命周期进程）
- CLI 命令通过 IPC 与 daemon 通信，读写缓存
- 守护进程关闭 → 缓存自然消失，无需 TTL 过期机制
- 内存控制：LRU 策略，上限 200 条目

#### 为什么不需要 TTL

- 第二道防线（写前变更检测）已能捕获所有陈旧数据——每次 write 前都会从 SDK 重新抓取最新状态对比
- 如果 Rem 未被外部修改，旧缓存仍然有效，无论多久前 read 的
- TTL 引入不必要的复杂度（僵尸条目、过期不自动删除的歧义语义）
