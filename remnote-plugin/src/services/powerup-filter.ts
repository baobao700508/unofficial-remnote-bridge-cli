/**
 * powerup-filter — Powerup 噪音过滤工具
 *
 * RemNote 的格式设置（fontSize、highlightColor、isCode 等）底层通过 Powerup 机制实现，
 * 会向 Rem 注入隐藏的 Tag 和 descriptor 子 Rem。这些在 UI 中不可见，对 AI Agent 是噪音。
 */

import type { PluginRem as Rem } from '@remnote/plugin-sdk';

/** 判断 Rem 是否为 Powerup 产生的隐藏子 Rem */
export async function isNoisyPowerupChild(rem: Rem): Promise<boolean> {
  const [a, b, c, d] = await Promise.all([
    rem.isPowerupProperty(),
    rem.isPowerupSlot(),
    rem.isPowerupPropertyListItem(),
    rem.isPowerupEnum(),
  ]);
  return a || b || c || d;
}

/** 批量过滤：返回非 Powerup 隐藏子 Rem */
export async function filterNoisyChildren(rems: Rem[]): Promise<Rem[]> {
  const flags = await Promise.all(rems.map(isNoisyPowerupChild));
  return rems.filter((_, i) => !flags[i]);
}

/** 过滤 Tag：去掉 isPowerup=true 的系统 Tag */
export async function filterNoisyTags(tagRems: Rem[]): Promise<Rem[]> {
  const flags = await Promise.all(tagRems.map(t => t.isPowerup()));
  return tagRems.filter((_, i) => !flags[i]);
}
