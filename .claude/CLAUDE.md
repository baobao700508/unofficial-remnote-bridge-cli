# CLAUDE.md

本文件为 Claude Code 在此仓库中工作提供指导。

---

## Project: remnote-bridge-cli

RemNote 自动化桥接工具集，通过插件 + CLI + Skills/MCP 的分层架构，将 RemNote 知识库能力暴露给 AI Agent。

## Repository Structure

```
remnote-bridge-cli/
├── CLI/                  # 核心命令行工具
├── REMNOTE-PLUGIN/       # RemNote 官方框架插件（Node.js/TypeScript）
├── PROJECT-SKILLS/       # Agent Skills（Markdown 格式）
├── MCP-PROJECT/          # MCP Server（Python/FastMCP）
├── reference_repository/ # 参考项目（已 gitignore）
├── AGENTS.md             # Agent 导航地图
└── .claude/
    └── rules/
        └── AGENTS.md -> ../../AGENTS.md
```

## Key Rules

- **语言**: 文档和注释使用中文，代码标识符使用英文
- **参考**: 任何修改前先查阅 `reference_repository/` 中的对应实现
- **Git**: 未经明确要求不创建 commit
- **模块边界**: 各子模块（CLI、REMNOTE-PLUGIN、PROJECT-SKILLS、MCP-PROJECT）保持独立

## Tech Stack

| 子模块 | 语言/框架 | 状态 |
|--------|----------|------|
| REMNOTE-PLUGIN | Node.js / TypeScript / RemNote Plugin SDK | 待开发 |
| CLI | 待定 | 待讨论 |
| PROJECT-SKILLS | Markdown (SKILL.md) | 待开发 |
| MCP-PROJECT | Python / FastMCP | 待开发 |

## Architecture Reference

详见根目录 `AGENTS.md` 中的架构图和模块说明。
