/**
 * read-rem-in-tree 命令
 *
 * 一次调用同时完成 read-tree + 对树中每个 Rem 执行 read-rem。
 * 返回 outline + remObjects，同时建立 tree 和 rem 双重缓存。
 */

import { sendDaemonRequest } from '../daemon/send-request.js';
import { jsonOutput, handleCommandError } from '../utils/output.js';

export interface ReadRemInTreeOptions {
  json?: boolean;
  depth?: string;
  maxNodes?: string;
  maxSiblings?: string;
  ancestorLevels?: string;
  fields?: string | string[];
  full?: boolean;
  includePowerup?: boolean;
}

export async function readRemInTreeCommand(remId: string, options: ReadRemInTreeOptions = {}): Promise<void> {
  const { json } = options;
  const depth = options.depth !== undefined ? parseInt(options.depth, 10) : undefined;
  const maxNodes = options.maxNodes !== undefined ? parseInt(options.maxNodes, 10) : undefined;
  const maxSiblings = options.maxSiblings !== undefined ? parseInt(options.maxSiblings, 10) : undefined;
  const ancestorLevels = options.ancestorLevels !== undefined ? parseInt(options.ancestorLevels, 10) : undefined;

  if ((depth !== undefined && isNaN(depth)) || (maxNodes !== undefined && isNaN(maxNodes)) || (maxSiblings !== undefined && isNaN(maxSiblings)) || (ancestorLevels !== undefined && isNaN(ancestorLevels))) {
    const errMsg = '--depth, --max-nodes, --max-siblings, --ancestor-levels must be numbers';
    if (json) {
      jsonOutput({ ok: false, command: 'read-rem-in-tree', error: errMsg });
    } else {
      console.error(`错误: ${errMsg}`);
    }
    process.exitCode = 1;
    return;
  }

  // 构造 payload
  const payload: Record<string, unknown> = { remId, depth, maxNodes, maxSiblings, ancestorLevels };
  if (options.includePowerup) payload.includePowerup = true;
  if (options.full) payload.full = true;
  if (options.fields) {
    payload.fields = Array.isArray(options.fields)
      ? options.fields
      : options.fields.split(',').map(f => f.trim()).filter(Boolean);
  }

  let result: unknown;
  try {
    result = await sendDaemonRequest('read_rem_in_tree', payload);
  } catch (err) {
    handleCommandError(err, 'read-rem-in-tree', json);
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
    jsonOutput({
      ok: true, command: 'read-rem-in-tree', data,
      ...(ancestors ? { ancestors } : {}),
      ...(cacheOverridden ? { cacheOverridden } : {}),
      ...(powerupFiltered ? { powerupFiltered } : {}),
    });
  } else {
    if (cacheOverridden) {
      console.warn(`注意: Tree ${cacheOverridden.id} 的缓存（${cacheOverridden.previousCachedAt}）已被本次 read 覆盖`);
    }
    if (powerupFiltered) {
      console.warn(`⚠ 已过滤 Powerup 系统数据（${powerupFiltered.tags} 个 Tag、${powerupFiltered.children} 个隐藏子 Rem）。`);
    }
    if (ancestors && ancestors.length > 0) {
      const pathParts = [...ancestors].reverse().map(a => {
        const topMark = a.isTopLevel ? ' [top]' : '';
        return `${a.name} (${a.id}${topMark})`;
      });
      console.log(`<!-- ancestors: ${pathParts.join(' > ')} -->`);
    }
    // 输出 outline
    console.log(data.outline);
    // 输出 remObjects 摘要
    const remObjects = data.remObjects as Record<string, unknown> | undefined;
    if (remObjects) {
      const count = Object.keys(remObjects).length;
      console.log(`\n--- ${count} RemObjects ---`);
      console.log(JSON.stringify(remObjects, null, 2));
    }
  }
}
