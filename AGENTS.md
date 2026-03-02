# AGENTS.md - AI 代理开发指引

> 目标：让 Agent 在最短时间内拿到"做事所需信息 + 必须遵守的红线 + 常见踩坑经验 + 可下钻的结构地图"。
> 原则：**宏观信息 20–40 行**；**约束单点权威**；**经验只记踩坑**；**微观信息按代码目录就近存放**。

---

## 1. 宏观信息

- **项目是什么**：RemNote 自动化桥接工具集（remnote-bridge-cli），将 RemNote 知识库能力暴露给 AI Agent。
- **核心架构**：四个子模块分层协作——REMNOTE-PLUGIN（桥接层）→ CLI（命令层）→ PROJECT-SKILLS / MCP-PROJECT（Agent 接入层）。
- **参考项目**：`reference_repository/`（[remnote-mcp-bridge](https://github.com/robert7/remnote-mcp-bridge) 克隆，已 gitignore）。
- **数据流向**：

```text
AI Assistants (Claude Code / OpenClaw / etc.)
    ↕
PROJECT-SKILLS (Markdown Skills)  +  MCP-PROJECT (FastMCP Server)
    ↕                                    ↕
                    CLI (核心命令层)
                      ↕
              REMNOTE-PLUGIN (RemNote 插件)
                      ↕
                  RemNote SDK
```

- **技术栈总览**：

| 子模块 | 语言/框架 | 状态 |
|:--|:--|:--|
| REMNOTE-PLUGIN | Node.js / TypeScript / RemNote Plugin SDK | 待开发 |
| CLI | 待定 | 待讨论 |
| PROJECT-SKILLS | Markdown (SKILL.md) | 待开发 |
| MCP-PROJECT | Python / FastMCP | 待开发 |

- **我应该从哪里开始看**：
  - 约束红线：见本文件第 2 节
  - 踩坑经验：见本文件第 3 节
  - 目录地图与接口契约：见本文件第 4 节

---

## 2. 约束（红线 / 强约束）

> **红线** = 一票否决，违反即退回；**强约束** = 必须遵守，特殊情况需说明理由。

### 2.1 模块边界（红线）

#### 2.1.1 职责划分

| 模块 | 职责 | 禁止事项 |
|:--|:--|:--|
| REMNOTE-PLUGIN | 通过 RemNote SDK 与知识库交互，暴露 WebSocket API | 禁止包含 CLI 逻辑或 MCP 协议代码 |
| CLI | 封装 RemNote 操作为统一命令接口 | 禁止直接调用 RemNote SDK（必须通过 REMNOTE-PLUGIN） |
| PROJECT-SKILLS | 定义 Agent 可调用的技能（Markdown） | 禁止包含运行时代码逻辑 |
| MCP-PROJECT | 通过 MCP 协议暴露 RemNote 操作为标准工具 | 禁止绕过 CLI 直连 REMNOTE-PLUGIN |

#### 2.1.2 依赖方向

依赖方向：上层 → 下层，**禁止反向**。

```
PROJECT-SKILLS / MCP-PROJECT (接入层)
    ↓
CLI (命令层)
    ↓
REMNOTE-PLUGIN (桥接层)
    ↓
RemNote SDK
```

- **禁止**：REMNOTE-PLUGIN 依赖 CLI 或接入层
- **禁止**：CLI 依赖 PROJECT-SKILLS 或 MCP-PROJECT
- **允许**：接入层（PROJECT-SKILLS、MCP-PROJECT）可同时依赖 CLI

---

## 3. 经验

> 记录常见、易错的开发流程和踩坑经验，防止 Agent 重复犯错。


---

## 4. 微观信息

> 本层级的结构地图和关键路径，遵守唯一事实源原则。

### 4.1 目录结构

```
remnote-bridge-cli/
├── CLI/                      # 核心命令行工具（待开发）
├── REMNOTE-PLUGIN/           # RemNote 官方框架插件（待开发）
├── PROJECT-SKILLS/           # Agent Skills - Markdown 格式（待开发）
├── MCP-PROJECT/              # MCP Server - Python/FastMCP（待开发）
├── reference_repository/     # 参考项目（只读，已 gitignore）
├── AGENTS.md                 # 本文件（Agent 导航地图）
├── .gitignore
└── .claude/
    ├── CLAUDE.md             # Claude Code 项目指导
    ├── rules/
    │   └── AGENTS.md → ../../AGENTS.md（符号链接）
    └── skills/
```

### 4.2 Agent 信息获取指南（重要）

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
4. **查询数据库结构**：先读 `supabase/schema.sql`，需实时数据时用 `supabase-admin` MCP
5. **不确定当前有哪些模块 / Section / Domain**：用 `Glob` 扫描目录结构

**禁止**：跳过搜索直接猜测代码结构、模块列表或实现方式。
