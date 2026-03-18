/**
 * Plugin 常量
 *
 * 定义默认值和版本号。
 * 多 daemon 连接：Plugin 同时连接 ALL_WS_PORTS 对应的 4 个槽位。
 */

export const DEFAULT_PLUGIN_VERSION = '0.2.1';

/** 4 个固定 WS 端口，对应 4 个 daemon 槽位 */
export const ALL_WS_PORTS = [29100, 29110, 29120, 29130] as const;

/** 非孪生槽位周期扫描间隔（ms） */
export const SCAN_INTERVAL_MS = 18_000;
