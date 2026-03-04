/**
 * read-rem 命令
 *
 * 读取单个 Rem 的完整 JSON 对象。
 * - 默认输出 [RW] + [R] 字段（34 个）
 * - --full 输出全部 51 个字段（含 [R-F]）
 * - --fields 指定输出字段子集
 * - 退出码：0 成功 / 1 业务错误 / 2 守护进程不可达
 */

import { sendDaemonRequest, DaemonNotRunningError, DaemonUnreachableError } from '../daemon/send-request';

export interface ReadRemOptions {
  json?: boolean;
  fields?: string;
  full?: boolean;
}

export async function readRemCommand(remId: string, options: ReadRemOptions = {}): Promise<void> {
  const { json, fields, full } = options;

  // 构造 payload
  const payload: Record<string, unknown> = { remId };
  if (full) {
    payload.full = true;
  } else if (fields) {
    payload.fields = fields.split(',').map(f => f.trim()).filter(Boolean);
  }

  let result: unknown;
  try {
    result = await sendDaemonRequest('read_rem', payload);
  } catch (err) {
    if (err instanceof DaemonNotRunningError) {
      if (json) {
        console.log(JSON.stringify({ ok: false, command: 'read-rem', error: err.message }));
      } else {
        console.error(`错误: ${err.message}`);
      }
      process.exitCode = 2;
      return;
    }
    if (err instanceof DaemonUnreachableError) {
      if (json) {
        console.log(JSON.stringify({ ok: false, command: 'read-rem', error: err.message }));
      } else {
        console.error(`错误: ${err.message}`);
      }
      process.exitCode = 2;
      return;
    }
    // 业务错误（Rem not found, Plugin 未连接等）
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (json) {
      console.log(JSON.stringify({ ok: false, command: 'read-rem', error: errorMsg }));
    } else {
      console.error(`错误: ${errorMsg}`);
    }
    process.exitCode = 1;
    return;
  }

  if (json) {
    console.log(JSON.stringify({ ok: true, command: 'read-rem', data: result }));
  } else {
    // 人类可读：格式化 JSON 输出
    console.log(JSON.stringify(result, null, 2));
  }
}
