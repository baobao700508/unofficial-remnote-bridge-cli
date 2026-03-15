# install-skill

> 将 remnote-bridge Skill 安装到 AI Agent 环境中。

---

## 功能

`install-skill` 将 Skill 文档（SKILL.md + instructions/*.md）安装到 AI Agent 可发现的位置。支持两种安装方式：

| 方式 | 说明 |
|:-----|:-----|
| Vercel Skills CLI（默认） | 通过 `npx skills add` 安装，适用于支持 Vercel Skills 生态的 Agent |
| Claude Code 直接复制（fallback） | 将文件复制到 `~/.claude/skills/remnote-bridge/`，仅适用于 Claude Code |

---

## 用法

```bash
# 通过 Vercel Skills CLI 安装（推荐）
remnote-bridge install-skill

# 直接复制到 Claude Code skills 目录
remnote-bridge install-skill-copy
```

---

## 安装逻辑

### install-skill

1. 检测 `npx` 是否可用
2. 可用 → 执行 `npx skills add baobao700508/unofficial-remnote-bridge-cli -s remnote-bridge`
3. 不可用或执行失败 → 自动 fallback 到文件复制模式

### install-skill-copy

直接将 Skill 文件从 npm 包内复制到 `~/.claude/skills/remnote-bridge/`：
- `SKILL.md`
- `instructions/*.md`（所有 Markdown 文件）

---

## 退出码

| 退出码 | 含义 |
|:-------|:-----|
| 0 | 安装成功 |
| 1 | 安装失败（找不到源文件、权限不足等） |

---

## AI Agent 注意事项

- 此命令通常由用户在初始设置时手动执行，Agent 一般不需要调用
- 安装完成后，Agent 即可通过 Skill 接口发现和使用 remnote-bridge 功能
