/**
 * read-rem 命令
 *
 * 读取单个 Rem 的完整 JSON 对象。
 * - 默认输出 [RW] + [R] 字段（34 个）
 * - --full 输出全部 51 个字段（含 [R-F]）
 * - --fields 指定输出字段子集
 * - 退出码：0 成功 / 1 业务错误 / 2 守护进程不可达
 */

import { sendDaemonRequest, DaemonNotRunningError, DaemonUnreachableError } from '../daemon/send-request.js';
import { jsonOutput } from '../utils/output.js';

export interface ReadRemOptions {
  json?: boolean;
  fields?: string;
  full?: boolean;
  includePowerup?: boolean;
}

export async function readRemCommand(remId: string, options: ReadRemOptions = {}): Promise<void> {
  const { json, fields, full, includePowerup } = options;

  // 构造 payload
  const payload: Record<string, unknown> = { remId };
  if (includePowerup) {
    payload.includePowerup = true;
  }
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
        jsonOutput({ ok: false, command: 'read-rem', error: err.message });
      } else {
        console.error(`错误: ${err.message}`);
      }
      process.exitCode = 2;
      return;
    }
    if (err instanceof DaemonUnreachableError) {
      if (json) {
        jsonOutput({ ok: false, command: 'read-rem', error: err.message });
      } else {
        console.error(`错误: ${err.message}`);
      }
      process.exitCode = 2;
      return;
    }
    // 业务错误（Rem not found, Plugin 未连接等）
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (json) {
      jsonOutput({ ok: false, command: 'read-rem', error: errorMsg });
    } else {
      console.error(`错误: ${errorMsg}`);
    }
    process.exitCode = 1;
    return;
  }

  const data = result as Record<string, unknown>;
  const cacheOverridden = data._cacheOverridden as { id: string; previousCachedAt: string } | undefined;
  delete data._cacheOverridden;
  const powerupFiltered = data.powerupFiltered as { tags: number; children: number } | undefined;
  delete data.powerupFiltered;

  if (json) {
    jsonOutput({ ok: true, command: 'read-rem', data, ...(cacheOverridden ? { cacheOverridden } : {}), ...(powerupFiltered ? { powerupFiltered } : {}) });
  } else {
    if (cacheOverridden) {
      console.warn(`注意: Rem ${cacheOverridden.id} 的缓存（${cacheOverridden.previousCachedAt}）已被本次 read 覆盖`);
    }
    if (powerupFiltered) {
      console.warn(`⚠ 已过滤 Powerup 系统数据（${powerupFiltered.tags} 个 Tag、${powerupFiltered.children} 个隐藏子 Rem）。`);
      console.warn('  Powerup 是 RemNote 的格式渲染机制，其产生的 Tag 和子 Rem 在 UI 中不可见。');
      console.warn('  如需查看完整数据，请加 --includePowerup 选项。');
    }
    console.log(JSON.stringify(data, null, 2));
  }
}
