/**
 * breadcrumb.ts — 面包屑路径构建
 *
 * 纯函数辅助工具。被 read-globe、read-context 共享。
 */

import type { ReactRNPlugin, PluginRem as Rem } from '@remnote/plugin-sdk';

/**
 * 从 rem 向上追溯到根，返回路径名称数组（从根到当前）。
 */
export async function buildBreadcrumb(
  plugin: ReactRNPlugin,
  rem: Rem,
): Promise<string[]> {
  const path: string[] = [];
  let current: Rem | undefined = rem;

  while (current) {
    const text = await plugin.richText.toMarkdown(current.text ?? []);
    path.unshift(text.replace(/\n/g, ' ').trim() || current._id);
    current = await current.getParentRem();
  }

  return path;
}
