/**
 * 配置加载
 *
 * 从项目根目录读取 .remnote-bridge.json，合并默认值。
 * 文件不存在时使用全部默认值，不报错。
 */

import fs from 'fs';
import path from 'path';

export interface BridgeConfig {
  wsPort: number;
  devServerPort: number;
  daemonTimeoutMinutes: number;
}

export const DEFAULT_CONFIG: Readonly<BridgeConfig> = {
  wsPort: 3002,
  devServerPort: 8080,
  daemonTimeoutMinutes: 30,
};

const CONFIG_FILENAME = '.remnote-bridge.json';

/**
 * 查找项目根目录（monorepo 根：包含 .git 目录的最近祖先）
 *
 * 优先找 .git（monorepo 根），回退到包含 remnote-plugin/ 的目录，
 * 最后回退到 cwd。
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

/**
 * 加载配置。不存在时返回默认值。
 */
export function loadConfig(projectRoot?: string): BridgeConfig {
  const root = projectRoot ?? findProjectRoot();
  const configPath = path.join(root, CONFIG_FILENAME);

  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_CONFIG };
  }

  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<BridgeConfig>;
    return {
      wsPort: typeof parsed.wsPort === 'number' ? parsed.wsPort : DEFAULT_CONFIG.wsPort,
      devServerPort:
        typeof parsed.devServerPort === 'number'
          ? parsed.devServerPort
          : DEFAULT_CONFIG.devServerPort,
      daemonTimeoutMinutes:
        typeof parsed.daemonTimeoutMinutes === 'number'
          ? parsed.daemonTimeoutMinutes
          : DEFAULT_CONFIG.daemonTimeoutMinutes,
    };
  } catch {
    // 配置文件损坏时使用默认值
    return { ...DEFAULT_CONFIG };
  }
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
