/**
 * edit-tree 命令
 *
 * 通过 str_replace 编辑 Rem 子树结构（行级增/删/移/重排）。
 * - 禁止修改已有行内容（走 edit-rem）
 * - --json 结构化 JSON 输出
 * - 退出码：0 成功 / 1 业务错误 / 2 守护进程不可达
 */

import { sendDaemonRequest, DaemonNotRunningError, DaemonUnreachableError } from '../daemon/send-request.js';
import { jsonOutput } from '../utils/output.js';

export interface EditTreeOptions {
  json?: boolean;
  oldStr: string;
  newStr: string;
}

export async function editTreeCommand(remId: string, options: EditTreeOptions): Promise<void> {
  const { json, oldStr, newStr } = options;

  let result: unknown;
  try {
    result = await sendDaemonRequest('edit_tree', { remId, oldStr, newStr });
  } catch (err) {
    if (err instanceof DaemonNotRunningError || err instanceof DaemonUnreachableError) {
      if (json) {
        jsonOutput({ ok: false, command: 'edit-tree', error: (err as Error).message });
      } else {
        console.error(`错误: ${(err as Error).message}`);
      }
      process.exitCode = 2;
      return;
    }
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (json) {
      jsonOutput({ ok: false, command: 'edit-tree', error: errorMsg });
    } else {
      console.error(`错误: ${errorMsg}`);
    }
    process.exitCode = 1;
    return;
  }

  const data = result as { ok: boolean; operations: unknown[]; error?: string; details?: unknown };

  if (!data.ok) {
    if (json) {
      jsonOutput({ ok: false, command: 'edit-tree', error: data.error, ...data.details as object });
    } else {
      console.error(`错误: ${data.error}`);
      if (data.details) {
        console.error(JSON.stringify(data.details, null, 2));
      }
    }
    process.exitCode = 1;
    return;
  }

  if (json) {
    jsonOutput({ ok: true, command: 'edit-tree', operations: data.operations });
  } else {
    if (data.operations.length === 0) {
      console.log('无结构变更。');
    } else {
      console.log(`执行了 ${data.operations.length} 个操作：`);
      for (const op of data.operations) {
        const o = op as Record<string, unknown>;
        console.log(`  - ${o.type}: ${JSON.stringify(o)}`);
      }
    }
  }
}
