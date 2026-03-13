/**
 * Plugin 常量
 *
 * 定义默认值和版本号。
 * WS URL 通过 /api/discovery 端点自动发现，DEFAULT_WS_URL 仅作为兜底。
 */

// 默认值（discovery 失败时的兜底）
export const DEFAULT_WS_URL = 'ws://127.0.0.1:29100';
export const DEFAULT_PLUGIN_VERSION = '0.1.0';
