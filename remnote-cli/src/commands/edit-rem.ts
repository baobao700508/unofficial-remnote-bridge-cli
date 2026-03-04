/**
 * edit-rem 命令
 *
 * 通过 str_replace 编辑 Rem 的 JSON 序列化。
 * 三道防线保证安全：缓存存在性、并发检测、精确匹配。
 * - 退出码：0 成功 / 1 业务错误 / 2 守护进程不可达
 */

import { sendDaemonRequest, DaemonNotRunningError, DaemonUnreachableError } from '../daemon/send-request';

export interface EditRemOptions {
  json?: boolean;
  oldStr: string;
  newStr: string;
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
  const { json, oldStr, newStr } = options;

  let result: unknown;
  try {
    result = await sendDaemonRequest('edit_rem', { remId, oldStr, newStr });
  } catch (err) {
    if (err instanceof DaemonNotRunningError) {
      if (json) {
        console.log(JSON.stringify({ ok: false, command: 'edit-rem', error: err.message }));
      } else {
        console.error(`错误: ${err.message}`);
      }
      process.exitCode = 2;
      return;
    }
    if (err instanceof DaemonUnreachableError) {
      if (json) {
        console.log(JSON.stringify({ ok: false, command: 'edit-rem', error: err.message }));
      } else {
        console.error(`错误: ${err.message}`);
      }
      process.exitCode = 2;
      return;
    }
    // 业务错误（防线拒绝、Plugin 未连接等）
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (json) {
      console.log(JSON.stringify({ ok: false, command: 'edit-rem', error: errorMsg }));
    } else {
      console.error(`错误: ${errorMsg}`);
    }
    process.exitCode = 1;
    return;
  }

  const editResult = result as EditRemResult;

  if (json) {
    console.log(JSON.stringify({
      ok: editResult.ok,
      command: 'edit-rem',
      changes: editResult.changes,
      warnings: editResult.warnings,
      ...(editResult.error ? { error: editResult.error } : {}),
      ...(editResult.appliedChanges ? { appliedChanges: editResult.appliedChanges } : {}),
      ...(editResult.failedField ? { failedField: editResult.failedField } : {}),
    }));
  } else {
    if (editResult.ok) {
      if (editResult.changes.length === 0) {
        console.log('无变更（old_str 和 new_str 产生相同结果）');
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
