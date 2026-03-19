/**
 * 配置加载
 *
 * 从 ~/.remnote-bridge/config.json 读取全局配置，合并默认值。
 * 文件不存在时使用全部默认值，不报错。
 *
 * 端口字段由 slots.json 管理，不再出现在配置文件中。
 * BridgeConfig 仍保留端口字段（填充默认值），供旧代码兼容。
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

// ── 全局目录 ──

/** ~/.remnote-bridge/ — 所有运行时文件的根目录 */
export const GLOBAL_DIR = path.join(os.homedir(), '.remnote-bridge');

/** 确保全局目录和 instances/ 子目录存在 */
export function ensureGlobalDir(): void {
  fs.mkdirSync(path.join(GLOBAL_DIR, 'instances'), { recursive: true });
}

export interface DefaultsConfig {
  // 共享
  maxNodes: number;
  maxSiblings: number;
  cacheMaxSize: number;
  // read-tree
  readTreeDepth: number;
  readTreeAncestorLevels: number;
  readTreeIncludePowerup: boolean;
  // read-globe
  readGlobeDepth: number;
  // read-context
  readContextMode: 'focus' | 'page';
  readContextAncestorLevels: number;
  readContextDepth: number;
  // read-rem-in-tree
  readRemInTreeMaxNodes: number;
  // search
  searchNumResults: number;
}

export const DEFAULT_DEFAULTS: Readonly<DefaultsConfig> = {
  maxNodes: 200,
  maxSiblings: 20,
  cacheMaxSize: 200,
  readTreeDepth: 3,
  readTreeAncestorLevels: 0,
  readTreeIncludePowerup: false,
  readRemInTreeMaxNodes: 50,
  readGlobeDepth: -1,
  readContextMode: 'page',
  readContextAncestorLevels: 2,
  readContextDepth: 3,
  searchNumResults: 20,
};

/** 单个 addon 的用户配置（仅控制启用状态，具体配置存储在 addon 独立文件中） */
export interface AddonUserConfig {
  enabled: boolean;
}

/** addons 配置：addon 名称 → 用户配置 */
export type AddonsConfig = Record<string, AddonUserConfig>;

export interface BridgeConfig {
  wsPort: number;
  devServerPort: number;
  configPort: number;
  daemonTimeoutMinutes: number;
  defaults: DefaultsConfig;
  addons?: AddonsConfig;
}

export const DEFAULT_CONFIG: Readonly<BridgeConfig> = {
  wsPort: 29100,
  devServerPort: 29101,
  configPort: 29102,
  daemonTimeoutMinutes: 30,
  defaults: { ...DEFAULT_DEFAULTS },
};

const CONFIG_FILENAME = 'config.json';
const LEGACY_CONFIG_FILENAME = '.remnote-bridge.json';

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && value > 0;
}

function mergeDefaults(parsed: Partial<DefaultsConfig> | undefined): DefaultsConfig {
  if (!parsed) return { ...DEFAULT_DEFAULTS };
  return {
    maxNodes: isPositiveNumber(parsed.maxNodes) ? parsed.maxNodes : DEFAULT_DEFAULTS.maxNodes,
    maxSiblings: isPositiveNumber(parsed.maxSiblings) ? parsed.maxSiblings : DEFAULT_DEFAULTS.maxSiblings,
    cacheMaxSize: isPositiveNumber(parsed.cacheMaxSize) ? parsed.cacheMaxSize : DEFAULT_DEFAULTS.cacheMaxSize,
    readTreeDepth: typeof parsed.readTreeDepth === 'number' ? parsed.readTreeDepth : DEFAULT_DEFAULTS.readTreeDepth,
    readTreeAncestorLevels: typeof parsed.readTreeAncestorLevels === 'number' && parsed.readTreeAncestorLevels >= 0
      ? parsed.readTreeAncestorLevels : DEFAULT_DEFAULTS.readTreeAncestorLevels,
    readTreeIncludePowerup: typeof parsed.readTreeIncludePowerup === 'boolean'
      ? parsed.readTreeIncludePowerup : DEFAULT_DEFAULTS.readTreeIncludePowerup,
    readRemInTreeMaxNodes: isPositiveNumber(parsed.readRemInTreeMaxNodes) ? parsed.readRemInTreeMaxNodes : DEFAULT_DEFAULTS.readRemInTreeMaxNodes,
    readGlobeDepth: typeof parsed.readGlobeDepth === 'number' ? parsed.readGlobeDepth : DEFAULT_DEFAULTS.readGlobeDepth,
    readContextMode: parsed.readContextMode === 'focus' || parsed.readContextMode === 'page'
      ? parsed.readContextMode : DEFAULT_DEFAULTS.readContextMode,
    readContextAncestorLevels: typeof parsed.readContextAncestorLevels === 'number' && parsed.readContextAncestorLevels >= 0
      ? parsed.readContextAncestorLevels : DEFAULT_DEFAULTS.readContextAncestorLevels,
    readContextDepth: typeof parsed.readContextDepth === 'number' ? parsed.readContextDepth : DEFAULT_DEFAULTS.readContextDepth,
    searchNumResults: isPositiveNumber(parsed.searchNumResults) ? parsed.searchNumResults : DEFAULT_DEFAULTS.searchNumResults,
  };
}

function mergeAddons(parsed: Record<string, unknown> | undefined): AddonsConfig | undefined {
  if (!parsed || typeof parsed !== 'object') return undefined;

  const result: AddonsConfig = {};
  for (const [name, raw] of Object.entries(parsed)) {
    if (typeof raw !== 'object' || raw === null) continue;
    const obj = raw as Record<string, unknown>;
    result[name] = {
      enabled: typeof obj.enabled === 'boolean' ? obj.enabled : false,
    };
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * 解析配置 JSON（不含端口字段）。端口由 slots.json 管理，此处填充默认值。
 */
function parseConfig(raw: string): BridgeConfig {
  const parsed = JSON.parse(raw) as Partial<BridgeConfig & {
    defaults?: Partial<DefaultsConfig>;
    addons?: Record<string, unknown>;
  }>;

  return {
    // 端口填充默认值（实际使用 slots 分配的端口）
    wsPort: DEFAULT_CONFIG.wsPort,
    devServerPort: DEFAULT_CONFIG.devServerPort,
    configPort: DEFAULT_CONFIG.configPort,
    daemonTimeoutMinutes:
      typeof parsed.daemonTimeoutMinutes === 'number' && parsed.daemonTimeoutMinutes > 0
        ? parsed.daemonTimeoutMinutes
        : DEFAULT_CONFIG.daemonTimeoutMinutes,
    defaults: mergeDefaults(parsed.defaults),
    addons: mergeAddons(parsed.addons as Record<string, unknown> | undefined),
  };
}

/**
 * 全局配置文件路径 (~/.remnote-bridge/config.json)
 * @param configDir 可选，覆盖全局目录（测试用）
 */
export function configFilePath(configDir?: string): string {
  return path.join(configDir ?? GLOBAL_DIR, CONFIG_FILENAME);
}

/**
 * 加载配置。从 ~/.remnote-bridge/config.json 读取。
 * 不存在时返回默认值。
 * @param configDir 可选，覆盖全局目录（测试用）
 */
export function loadConfig(configDir?: string): BridgeConfig {
  const globalPath = configFilePath(configDir);

  // 全局配置存在 → 直接读取
  if (fs.existsSync(globalPath)) {
    try {
      return parseConfig(fs.readFileSync(globalPath, 'utf-8'));
    } catch {
      return { ...DEFAULT_CONFIG, defaults: { ...DEFAULT_DEFAULTS } };
    }
  }

  // 尝试从旧项目根迁移（仅在使用默认全局目录时）
  if (configDir) return { ...DEFAULT_CONFIG, defaults: { ...DEFAULT_DEFAULTS } };
  const legacyPath = findLegacyConfigPath();
  if (legacyPath) {
    try {
      const config = parseConfig(fs.readFileSync(legacyPath, 'utf-8'));
      // 迁移到全局（去掉端口字段）
      ensureGlobalDir();
      saveConfig(globalPath, config);
      return config;
    } catch {
      // 迁移失败，使用默认值
    }
  }

  return { ...DEFAULT_CONFIG, defaults: { ...DEFAULT_DEFAULTS } };
}

/**
 * 原子写入配置文件（写临时文件 → rename）。
 * 只写非端口字段。
 */
export function saveConfig(filePath: string, config: BridgeConfig): void {
  ensureGlobalDir();
  // 持久化时去掉端口字段（端口由 slots.json 管理）
  const persisted = {
    daemonTimeoutMinutes: config.daemonTimeoutMinutes,
    defaults: config.defaults,
    ...(config.addons ? { addons: config.addons } : {}),
  };
  const tmpPath = filePath + '.tmp.' + process.pid;
  fs.writeFileSync(tmpPath, JSON.stringify(persisted, null, 2) + '\n', { encoding: 'utf-8', mode: 0o600 });
  fs.renameSync(tmpPath, filePath);
}

// ── 旧配置迁移辅助 ──

/**
 * 查找项目根目录（monorepo 根：包含 .git 目录的最近祖先）。
 * 仅用于旧配置迁移，不再作为实例标识。
 */
export function findProjectRoot(startDir: string = process.cwd()): string {
  let dir = path.resolve(startDir);
  while (true) {
    if (fs.existsSync(path.join(dir, '.git'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      return process.cwd();
    }
    dir = parent;
  }
}

/**
 * 查找旧的项目根配置文件路径（.remnote-bridge.json）。
 * 存在时返回路径，不存在返回 null。
 */
function findLegacyConfigPath(): string | null {
  try {
    const root = findProjectRoot();
    const legacyPath = path.join(root, LEGACY_CONFIG_FILENAME);
    return fs.existsSync(legacyPath) ? legacyPath : null;
  } catch {
    return null;
  }
}

// ── Addon 独立配置 ──

/** addon 数据根目录 ~/.remnote-bridge/addons/<name>/ */
export function addonDataDir(name: string): string {
  return path.join(GLOBAL_DIR, 'addons', name);
}

/** addon 配置文件路径 ~/.remnote-bridge/addons/<name>/config.json */
export function addonConfigPath(name: string): string {
  return path.join(addonDataDir(name), 'config.json');
}

/** 读取 addon 配置 JSON（文件不存在返回 null） */
export function loadAddonConfig(name: string): Record<string, unknown> | null {
  const p = addonConfigPath(name);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** 保存 addon 配置 JSON（原子写入） */
export function saveAddonConfig(name: string, data: Record<string, unknown>): void {
  const dir = addonDataDir(name);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, 'config.json');
  const tmpPath = filePath + '.tmp.' + process.pid;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2) + '\n', { encoding: 'utf-8', mode: 0o600 });
  fs.renameSync(tmpPath, filePath);
}

