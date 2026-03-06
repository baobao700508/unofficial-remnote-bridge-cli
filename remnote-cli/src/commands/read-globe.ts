/**
 * read-globe 命令
 *
 * 读取知识库全局概览（仅 Document 层级）。
 * - --depth N 控制 Document 嵌套深度（默认 -1 无限）
 * - --max-nodes N 全局节点上限（默认 200）
 * - --max-siblings N 每个父节点下展示的 children 上限（默认 20）
 * - --json 结构化 JSON 输出
 */

import { sendDaemonRequest, DaemonNotRunningError, DaemonUnreachableError } from '../daemon/send-request';
import { jsonOutput } from '../utils/output';

export interface ReadGlobeOptions {
  json?: boolean;
  depth?: string;
  maxNodes?: string;
  maxSiblings?: string;
}

export async function readGlobeCommand(options: ReadGlobeOptions = {}): Promise<void> {
  const { json } = options;
  const depth = options.depth !== undefined ? parseInt(options.depth, 10) : -1;
  const maxNodes = options.maxNodes !== undefined ? parseInt(options.maxNodes, 10) : 200;
  const maxSiblings = options.maxSiblings !== undefined ? parseInt(options.maxSiblings, 10) : 20;

  if (isNaN(depth) || isNaN(maxNodes) || isNaN(maxSiblings)) {
    const errMsg = '--depth, --max-nodes, --max-siblings must be numbers';
    if (json) {
      jsonOutput({ ok: false, command: 'read-globe', error: errMsg });
    } else {
      console.error(`错误: ${errMsg}`);
    }
    process.exitCode = 1;
    return;
  }

  let result: unknown;
  try {
    result = await sendDaemonRequest('read_globe', { depth, maxNodes, maxSiblings });
  } catch (err) {
    if (err instanceof DaemonNotRunningError || err instanceof DaemonUnreachableError) {
      if (json) {
        jsonOutput({ ok: false, command: 'read-globe', error: (err as Error).message });
      } else {
        console.error(`错误: ${(err as Error).message}`);
      }
      process.exitCode = 2;
      return;
    }
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (json) {
      jsonOutput({ ok: false, command: 'read-globe', error: errorMsg });
    } else {
      console.error(`错误: ${errorMsg}`);
    }
    process.exitCode = 1;
    return;
  }

  const data = result as Record<string, unknown>;

  if (json) {
    jsonOutput({ ok: true, command: 'read-globe', data });
  } else {
    console.log(data.outline);
  }
}
