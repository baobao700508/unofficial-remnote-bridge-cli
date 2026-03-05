/**
 * read-tree 命令
 *
 * 读取 Rem 子树并序列化为带缩进的 Markdown 大纲。
 * - --depth N 控制展开深度（默认 3，-1 = 全部展开）
 * - --json 结构化 JSON 输出
 * - 退出码：0 成功 / 1 业务错误 / 2 守护进程不可达
 */

import { sendDaemonRequest, DaemonNotRunningError, DaemonUnreachableError } from '../daemon/send-request';
import { jsonOutput } from '../utils/output';

export interface ReadTreeOptions {
  json?: boolean;
  depth?: string;
}

export async function readTreeCommand(remId: string, options: ReadTreeOptions = {}): Promise<void> {
  const { json } = options;
  const depth = options.depth !== undefined ? parseInt(options.depth, 10) : 3;

  if (isNaN(depth)) {
    if (json) {
      jsonOutput({ ok: false, command: 'read-tree', error: '--depth must be a number' });
    } else {
      console.error('错误: --depth 必须是数字');
    }
    process.exitCode = 1;
    return;
  }

  let result: unknown;
  try {
    result = await sendDaemonRequest('read_tree', { remId, depth });
  } catch (err) {
    if (err instanceof DaemonNotRunningError || err instanceof DaemonUnreachableError) {
      if (json) {
        jsonOutput({ ok: false, command: 'read-tree', error: (err as Error).message });
      } else {
        console.error(`错误: ${(err as Error).message}`);
      }
      process.exitCode = 2;
      return;
    }
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (json) {
      jsonOutput({ ok: false, command: 'read-tree', error: errorMsg });
    } else {
      console.error(`错误: ${errorMsg}`);
    }
    process.exitCode = 1;
    return;
  }

  const data = result as Record<string, unknown>;
  const cacheOverridden = data._cacheOverridden as { id: string; previousCachedAt: string } | undefined;
  delete data._cacheOverridden;

  if (json) {
    jsonOutput({ ok: true, command: 'read-tree', data, ...(cacheOverridden ? { cacheOverridden } : {}) });
  } else {
    if (cacheOverridden) {
      console.warn(`注意: Tree ${cacheOverridden.id} 的缓存（${cacheOverridden.previousCachedAt}）已被本次 read 覆盖`);
    }
    console.log(data.outline);
  }
}
