# CLAUDE.md

本文件为 Claude Code 在此仓库中工作提供指导。

---

## Project: remnote-bridge-cli

RemNote 自动化桥接工具集，通过插件 + CLI + Skills/MCP 的分层架构，将 RemNote 知识库能力暴露给 AI Agent。

## Repository Structure

```
remnote-bridge-cli/
├── remnote-cli/          # 核心命令行工具
├── remnote-plugin/       # RemNote 官方框架插件（Node.js/TypeScript）
├── remnote-skills/       # Agent Skills（Markdown 格式）
├── remnote-mcp/          # MCP Server（Node.js/TypeScript/FastMCP）
├── scripts/              # 脚本工具
├── docs/                 # 项目文档
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
- **层边界**: 各层（remnote-plugin、remnote-cli、remnote-skills、remnote-mcp）保持独立

## Tech Stack

| 层 | 语言/框架 | 状态 |
|--------|----------|------|
| remnote-plugin | Node.js / TypeScript / RemNote Plugin SDK | 待开发 |
| remnote-cli | Node.js / TypeScript / Commander.js | 待开发 |
| remnote-skills | Markdown (SKILL.md) | 待开发 |
| remnote-mcp | Node.js / TypeScript / FastMCP | 待开发 |

## Architecture Reference

详见根目录 `AGENTS.md` 中的架构图和分层说明。
