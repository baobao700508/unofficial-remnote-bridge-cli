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

- **核心链**依赖方向单向：bridge → services → utils，**禁止反向**
- **widgets** 是 RemNote 插件的宿主入口和展示面板，可依赖 bridge（接线和读状态），但不属于核心链
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
