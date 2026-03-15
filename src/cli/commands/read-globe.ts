/**
 * read-globe 命令
 *
 * 读取知识库全局概览（仅 Document 层级）。
 * - --depth N 控制 Document 嵌套深度（默认 -1 无限）
 * - --max-nodes N 全局节点上限（默认 200）
 * - --max-siblings N 每个父节点下展示的 children 上限（默认 20）
 * - --json 结构化 JSON 输出
 */

import { sendDaemonRequest } from '../daemon/send-request.js';
import { jsonOutput, handleCommandError } from '../utils/output.js';

export interface ReadGlobeOptions {
  json?: boolean;
  depth?: string;
  maxNodes?: string;
  maxSiblings?: string;
}

export async function readGlobeCommand(options: ReadGlobeOptions = {}): Promise<void> {
  const { json } = options;
  const depth = options.depth !== undefined ? parseInt(options.depth, 10) : undefined;
  const maxNodes = options.maxNodes !== undefined ? parseInt(options.maxNodes, 10) : undefined;
  const maxSiblings = options.maxSiblings !== undefined ? parseInt(options.maxSiblings, 10) : undefined;

  if ((depth !== undefined && isNaN(depth)) || (maxNodes !== undefined && isNaN(maxNodes)) || (maxSiblings !== undefined && isNaN(maxSiblings))) {
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
    handleCommandError(err, 'read-globe', json);
    return;
  }

  const data = result as Record<string, unknown>;

  if (json) {
    jsonOutput({ ok: true, command: 'read-globe', data });
  } else {
    console.log(data.outline);
  }
}
