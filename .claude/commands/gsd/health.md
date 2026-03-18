---
name: gsd:health
description: Diagnose planning directory health and optionally repair issues
argument-hint: [--repair]
allowed-tools:
  - Read
  - Bash
  - Write
  - AskUserQuestion
---
<objective>
Validate `.planning/` directory integrity and report actionable issues. Checks for missing files, invalid configurations, inconsistent state, and orphaned plans.
</objective>

<execution_context>
@/Users/jinliangjian/Desktop/所有的项目/开发项目/remnote-bridge cli/.claude/get-shit-done/workflows/health.md
</execution_context>

<process>
Execute the health workflow from @/Users/jinliangjian/Desktop/所有的项目/开发项目/remnote-bridge cli/.claude/get-shit-done/workflows/health.md end-to-end.
Parse --repair flag from arguments and pass to workflow.
</process>
