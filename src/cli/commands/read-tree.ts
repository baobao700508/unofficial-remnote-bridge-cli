/**
 * read-tree 命令
 *
 * 读取 Rem 子树并序列化为带缩进的 Markdown 大纲。
 * - --depth N 控制展开深度（默认 3，-1 = 全部展开）
 * - --json 结构化 JSON 输出
 * - 退出码：0 成功 / 1 业务错误 / 2 守护进程不可达
 */

import { sendDaemonRequest } from '../daemon/send-request.js';
import { jsonOutput, handleCommandError } from '../utils/output.js';

export interface ReadTreeOptions {
  json?: boolean;
  depth?: string;
  maxNodes?: string;
  maxSiblings?: string;
  ancestorLevels?: string;
  includePowerup?: boolean;
}

export async function readTreeCommand(remId: string, options: ReadTreeOptions = {}): Promise<void> {
  const { json } = options;
  const depth = options.depth !== undefined ? parseInt(options.depth, 10) : undefined;
  const maxNodes = options.maxNodes !== undefined ? parseInt(options.maxNodes, 10) : undefined;
  const maxSiblings = options.maxSiblings !== undefined ? parseInt(options.maxSiblings, 10) : undefined;
  const ancestorLevels = options.ancestorLevels !== undefined ? parseInt(options.ancestorLevels, 10) : undefined;

  if ((depth !== undefined && isNaN(depth)) || (maxNodes !== undefined && isNaN(maxNodes)) || (maxSiblings !== undefined && isNaN(maxSiblings)) || (ancestorLevels !== undefined && isNaN(ancestorLevels))) {
    const errMsg = '--depth, --max-nodes, --max-siblings, --ancestor-levels must be numbers';
    if (json) {
      jsonOutput({ ok: false, command: 'read-tree', error: errMsg });
    } else {
      console.error(`错误: ${errMsg}`);
    }
    process.exitCode = 1;
    return;
  }

  let result: unknown;
  try {
    result = await sendDaemonRequest('read_tree', {
      remId, depth, maxNodes, maxSiblings, ancestorLevels,
      includePowerup: options.includePowerup,
    });
  } catch (err) {
    handleCommandError(err, 'read-tree', json);
    return;
  }

  const data = result as Record<string, unknown>;
  const cacheOverridden = data._cacheOverridden as { id: string; previousCachedAt: string } | undefined;
  delete data._cacheOverridden;
  const powerupFiltered = data.powerupFiltered as { tags: number; children: number } | undefined;
  delete data.powerupFiltered;
  const ancestors = data.ancestors as Array<{ id: string; name: string; childrenCount: number; isDocument: boolean; isTopLevel?: boolean }> | undefined;
  delete data.ancestors;

  if (json) {
    jsonOutput({ ok: true, command: 'read-tree', data, ...(ancestors ? { ancestors } : {}), ...(cacheOverridden ? { cacheOverridden } : {}), ...(powerupFiltered ? { powerupFiltered } : {}) });
  } else {
    if (cacheOverridden) {
      console.warn(`注意: Tree ${cacheOverridden.id} 的缓存（${cacheOverridden.previousCachedAt}）已被本次 read 覆盖`);
    }
    if (powerupFiltered) {
      console.warn(`⚠ 已过滤 Powerup 系统数据（${powerupFiltered.tags} 个 Tag、${powerupFiltered.children} 个隐藏子 Rem）。`);
      console.warn('  Powerup 是 RemNote 的格式渲染机制，其产生的 Tag 和子 Rem 在 UI 中不可见。');
      console.warn('  如需查看完整数据，请加 --includePowerup 选项。');
    }
    if (ancestors && ancestors.length > 0) {
      // 由近及远 → 反转为由远及近，构建路径
      const pathParts = [...ancestors].reverse().map(a => {
        const topMark = a.isTopLevel ? ' [top]' : '';
        return `${a.name} (${a.id}${topMark})`;
      });
      console.log(`<!-- ancestors: ${pathParts.join(' > ')} -->`);
    }
    console.log(data.outline);
  }
}
