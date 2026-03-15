/**
 * MCP 返回值格式化工具
 *
 * 两种模式：
 * - formatFrontmatter：YAML frontmatter + body（read 类工具）
 * - formatDataJson：剥离 wrapper 的 JSON（action/infra 工具）
 */

import type { CliResponse } from './types.js';

// ---------------------------------------------------------------------------
// 模式 A：Frontmatter + Body
// ---------------------------------------------------------------------------

/**
 * 将元数据序列化为 YAML frontmatter，拼接 body 内容。
 *
 * - null/undefined 的值自动跳过
 * - 数字/布尔：裸值（`nodeCount: 42`）
 * - 字符串：JSON 引号（`mode: "focus"`）
 * - 数组/对象：JSON 内联（`ancestors: [{"id":"x"}]`）
 * - 无元数据时省略 `---` 分隔符，直接返回 body
 */
export function formatFrontmatter(
  meta: Record<string, unknown>,
  body: string,
): string {
  const entries = Object.entries(meta).filter(
    ([, v]) => v !== undefined && v !== null,
  );
  if (entries.length === 0) return body;

  const lines = entries.map(([k, v]) => {
    if (typeof v === 'number' || typeof v === 'boolean') return `${k}: ${v}`;
    return `${k}: ${JSON.stringify(v)}`;
  });

  return `---\n${lines.join('\n')}\n---\n\n${body}`;
}

// ---------------------------------------------------------------------------
// 模式 B：Data JSON（剥离 ok/command/timestamp wrapper）
// ---------------------------------------------------------------------------

/**
 * 从 CLI 响应中剥离 ok/command/timestamp，返回剩余字段的 JSON。
 *
 * 用于 action/infra 工具——AI 不需要看到冗余的 wrapper 字段。
 * callCli 已在 ok===false 时抛出 CliError，成功路径 ok 始终为 true。
 */
export function formatDataJson(response: CliResponse): string {
  const { ok: _ok, command: _cmd, timestamp: _ts, ...rest } = response;
  return JSON.stringify(rest, null, 2);
}
