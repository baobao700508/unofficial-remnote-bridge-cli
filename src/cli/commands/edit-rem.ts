/**
 * edit-rem 命令
 *
 * 直接修改 Rem 的属性字段。
 * 两道防线保证安全：缓存存在性、并发检测。
 * - 退出码：0 成功 / 1 业务错误 / 2 守护进程不可达
 */

import { sendDaemonRequest } from '../daemon/send-request.js';
import { jsonOutput, handleCommandError } from '../utils/output.js';

export interface EditRemOptions {
  json?: boolean;
  changes: Record<string, unknown>;
}

interface EditRemResult {
  ok: boolean;
  changes: string[];
  warnings: string[];
  error?: string;
  appliedChanges?: string[];
  failedField?: string;
}

export async function editRemCommand(remId: string, options: EditRemOptions): Promise<void> {
  const { json, changes } = options;

  let result: unknown;
  try {
    result = await sendDaemonRequest('edit_rem', { remId, changes });
  } catch (err) {
    handleCommandError(err, 'edit-rem', json);
    return;
  }

  const editResult = result as EditRemResult;

  if (json) {
    jsonOutput({
      ok: editResult.ok,
      command: 'edit-rem',
      changes: editResult.changes,
      warnings: editResult.warnings,
      ...(editResult.error ? { error: editResult.error } : {}),
      ...(editResult.appliedChanges ? { appliedChanges: editResult.appliedChanges } : {}),
      ...(editResult.failedField ? { failedField: editResult.failedField } : {}),
    });
  } else {
    if (editResult.ok) {
      if (editResult.changes.length === 0) {
        console.log('无变更（未发现可写入的变更字段）');
      } else {
        console.log(`已更新字段: ${editResult.changes.join(', ')}`);
      }
    } else {
      console.error(`错误: ${editResult.error}`);
      if (editResult.appliedChanges && editResult.appliedChanges.length > 0) {
        console.error(`警告: 部分写入已生效: ${editResult.appliedChanges.join(', ')}`);
        console.error('请重新 read-rem 获取当前状态');
      }
    }

    for (const warning of editResult.warnings) {
      console.warn(`警告: ${warning}`);
    }
  }

  if (!editResult.ok) {
    process.exitCode = 1;
  }
}
