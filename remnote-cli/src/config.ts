/**
 * 配置加载
 *
 * 从项目根目录读取 .remnote-bridge.json，合并默认值。
 * 文件不存在时使用全部默认值，不报错。
 */

import fs from 'fs';
import path from 'path';

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
  readGlobeDepth: -1,
  readContextMode: 'focus',
  readContextAncestorLevels: 2,
  readContextDepth: 3,
  searchNumResults: 20,
};

export interface BridgeConfig {
  wsPort: number;
  devServerPort: number;
  configPort: number;
  daemonTimeoutMinutes: number;
  defaults: DefaultsConfig;
}

export const DEFAULT_CONFIG: Readonly<BridgeConfig> = {
  wsPort: 3002,
  devServerPort: 8080,
  configPort: 3003,
  daemonTimeoutMinutes: 30,
  defaults: { ...DEFAULT_DEFAULTS },
};

const CONFIG_FILENAME = '.remnote-bridge.json';

function isValidPort(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 65535;
}

/**
 * 查找项目根目录（monorepo 根：包含 .git 目录的最近祖先）
 *
 * 从 startDir 向上查找 .git 目录，找到即返回。
 * 到达文件系统根仍未找到时回退到 cwd。
 */
export function findProjectRoot(startDir: string = process.cwd()): string {
  let dir = path.resolve(startDir);
  while (true) {
    // 优先匹配 .git 目录（monorepo 根标识）
    if (fs.existsSync(path.join(dir, '.git'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      // 到达文件系统根，回退到 cwd
      return process.cwd();
    }
    dir = parent;
  }
}

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
    readGlobeDepth: typeof parsed.readGlobeDepth === 'number' ? parsed.readGlobeDepth : DEFAULT_DEFAULTS.readGlobeDepth,
    readContextMode: parsed.readContextMode === 'focus' || parsed.readContextMode === 'page'
      ? parsed.readContextMode : DEFAULT_DEFAULTS.readContextMode,
    readContextAncestorLevels: typeof parsed.readContextAncestorLevels === 'number' && parsed.readContextAncestorLevels >= 0
      ? parsed.readContextAncestorLevels : DEFAULT_DEFAULTS.readContextAncestorLevels,
    readContextDepth: typeof parsed.readContextDepth === 'number' ? parsed.readContextDepth : DEFAULT_DEFAULTS.readContextDepth,
    searchNumResults: isPositiveNumber(parsed.searchNumResults) ? parsed.searchNumResults : DEFAULT_DEFAULTS.searchNumResults,
  };
}

/**
 * 加载配置。不存在时返回默认值。
 */
export function loadConfig(projectRoot?: string): BridgeConfig {
  const root = projectRoot ?? findProjectRoot();
  const configPath = path.join(root, CONFIG_FILENAME);

  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_CONFIG, defaults: { ...DEFAULT_DEFAULTS } };
  }

  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<BridgeConfig & { defaults?: Partial<DefaultsConfig> }>;

    const config: BridgeConfig = {
      wsPort: isValidPort(parsed.wsPort) ? parsed.wsPort : DEFAULT_CONFIG.wsPort,
      devServerPort: isValidPort(parsed.devServerPort) ? parsed.devServerPort : DEFAULT_CONFIG.devServerPort,
      configPort: isValidPort(parsed.configPort) ? parsed.configPort : DEFAULT_CONFIG.configPort,
      daemonTimeoutMinutes:
        typeof parsed.daemonTimeoutMinutes === 'number' && parsed.daemonTimeoutMinutes > 0
          ? parsed.daemonTimeoutMinutes
          : DEFAULT_CONFIG.daemonTimeoutMinutes,
      defaults: mergeDefaults(parsed.defaults),
    };

    // 端口冲突校验
    const ports = [config.wsPort, config.devServerPort, config.configPort];
    if (new Set(ports).size !== ports.length) {
      throw new Error('wsPort, devServerPort, configPort must be different');
    }

    return config;
  } catch {
    // 配置文件损坏时使用默认值
    return { ...DEFAULT_CONFIG, defaults: { ...DEFAULT_DEFAULTS } };
  }
}

/**
 * 获取配置文件路径
 */
export function configFilePath(projectRoot?: string): string {
  const root = projectRoot ?? findProjectRoot();
  return path.join(root, CONFIG_FILENAME);
}

/**
 * 原子写入配置文件（写临时文件 → rename）
 */
export function saveConfig(filePath: string, config: BridgeConfig): void {
  const tmpPath = filePath + '.tmp.' + process.pid;
  fs.writeFileSync(tmpPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  fs.renameSync(tmpPath, filePath);
}

/**
 * PID 文件路径
 */
export function pidFilePath(projectRoot?: string): string {
  const root = projectRoot ?? findProjectRoot();
  return path.join(root, '.remnote-bridge.pid');
}

/**
 * 日志文件路径
 */
export function logFilePath(projectRoot?: string): string {
  const root = projectRoot ?? findProjectRoot();
  return path.join(root, '.remnote-bridge.log');
}
