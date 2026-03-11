/**
 * read-context 命令
 *
 * 读取当前上下文视图。
 * - --mode focus|page（默认 focus）
 * - --ancestor-levels N 向上追溯几层祖先（默认 2，仅 focus 模式）
 * - --depth N 展开深度（默认 3，仅 page 模式）
 * - --max-nodes N 全局节点上限（默认 200）
 * - --max-siblings N 每个父节点下展示的 children 上限（默认 20）
 * - --focus-rem-id <remId> 指定鱼眼中心 Rem ID（仅 focus 模式，默认使用当前焦点）
 * - --json 结构化 JSON 输出
 */

import { sendDaemonRequest, DaemonNotRunningError, DaemonUnreachableError } from '../daemon/send-request.js';
import { jsonOutput } from '../utils/output.js';

export interface ReadContextOptions {
  json?: boolean;
  mode?: string;
  ancestorLevels?: string;
  depth?: string;
  maxNodes?: string;
  maxSiblings?: string;
  focusRemId?: string;
}

export async function readContextCommand(options: ReadContextOptions = {}): Promise<void> {
  const { json } = options;
  const mode = options.mode || 'focus';

  if (mode !== 'focus' && mode !== 'page') {
    const errMsg = '--mode must be "focus" or "page"';
    if (json) {
      jsonOutput({ ok: false, command: 'read-context', error: errMsg });
    } else {
      console.error(`错误: ${errMsg}`);
    }
    process.exitCode = 1;
    return;
  }

  const ancestorLevels = options.ancestorLevels !== undefined ? parseInt(options.ancestorLevels, 10) : undefined;
  const depth = options.depth !== undefined ? parseInt(options.depth, 10) : undefined;
  const maxNodes = options.maxNodes !== undefined ? parseInt(options.maxNodes, 10) : undefined;
  const maxSiblings = options.maxSiblings !== undefined ? parseInt(options.maxSiblings, 10) : undefined;

  if ((ancestorLevels !== undefined && isNaN(ancestorLevels)) || (depth !== undefined && isNaN(depth)) || (maxNodes !== undefined && isNaN(maxNodes)) || (maxSiblings !== undefined && isNaN(maxSiblings))) {
    const errMsg = 'numeric options must be numbers';
    if (json) {
      jsonOutput({ ok: false, command: 'read-context', error: errMsg });
    } else {
      console.error(`错误: ${errMsg}`);
    }
    process.exitCode = 1;
    return;
  }

  let result: unknown;
  try {
    const reqPayload: Record<string, unknown> = { mode, ancestorLevels, depth, maxNodes, maxSiblings };
    if (options.focusRemId) reqPayload.focusRemId = options.focusRemId;
    result = await sendDaemonRequest('read_context', reqPayload);
  } catch (err) {
    if (err instanceof DaemonNotRunningError || err instanceof DaemonUnreachableError) {
      if (json) {
        jsonOutput({ ok: false, command: 'read-context', error: (err as Error).message });
      } else {
        console.error(`错误: ${(err as Error).message}`);
      }
      process.exitCode = 2;
      return;
    }
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (json) {
      jsonOutput({ ok: false, command: 'read-context', error: errorMsg });
    } else {
      console.error(`错误: ${errorMsg}`);
    }
    process.exitCode = 1;
    return;
  }

  const data = result as Record<string, unknown>;

  if (json) {
    jsonOutput({ ok: true, command: 'read-context', data });
  } else {
    console.log(data.outline);
  }
}
