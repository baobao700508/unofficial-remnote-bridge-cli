/**
 * ReadHandler — read-rem 请求的业务编排
 *
 * 职责：
 * 1. 转发到 Plugin 获取完整 RemObject
 * 2. 序列化为 JSON 字符串并缓存（完整版本）
 * 3. 根据 fields/full 参数过滤字段返回给 CLI
 */

import { RemCache } from './rem-cache.js';
import { filterRemFields } from './rem-field-filter.js';

export class ReadHandler {
  constructor(
    private cache: RemCache,
    private forwardToPlugin: (action: string, payload: Record<string, unknown>) => Promise<unknown>,
    private onLog?: (message: string, level: 'info' | 'warn' | 'error') => void,
  ) {}

  async handleReadRem(payload: Record<string, unknown>): Promise<unknown> {
    const remId = payload.remId as string;
    if (!remId) {
      throw new Error('缺少 remId 参数');
    }

    // 检查旧缓存
    const cacheKey = 'rem:' + remId;
    const previousCachedAt = this.cache.getCreatedAt(cacheKey);

    const includePowerup = (payload.includePowerup as boolean) ?? false;

    // 转发到 Plugin
    const remObject = await this.forwardToPlugin('read_rem', { remId, includePowerup });

    // 缓存完整 RemObject 对象
    this.cache.set(cacheKey, remObject);
    this.onLog?.(`缓存 Rem ${remId.slice(0, 8)}...`, 'info');

    // 字段过滤
    const fields = payload.fields as string[] | undefined;
    const full = payload.full as boolean | undefined;

    let result = filterRemFields(remObject as Record<string, unknown>, { full, fields });

    // 附加缓存覆盖提示
    if (previousCachedAt) {
      result._cacheOverridden = { id: remId, previousCachedAt };
    }

    return result;
  }
}
