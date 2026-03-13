/**
 * Addon 管理器
 *
 * 负责增强项目的安装、卸载、检测、环境变量映射和自动部署。
 */

import { execFile } from 'node:child_process';
import fs from 'fs';
import os from 'os';
import type { AddonDefinition } from './registry.js';
import { ADDON_REGISTRY } from './registry.js';
import type { AddonsConfig, AddonUserConfig, BridgeConfig } from '../config.js';

const DETECT_TIMEOUT_MS = 5_000;
const INSTALL_TIMEOUT_MS = 120_000;

export type LogFn = (message: string, level?: 'info' | 'warn' | 'error') => void;

export interface AddonStatus {
  name: string;
  description: string;
  enabled: boolean;
  installed: boolean;
  settingsValid: boolean;
  missingSettings: string[];
}

export interface AddonEnsureResult {
  name: string;
  action: 'already-installed' | 'installed' | 'failed';
  error?: string;
}

export class AddonManager {
  constructor(private config: BridgeConfig) {}

  /** 获取所有已注册 addon 的状态 */
  async listAll(): Promise<AddonStatus[]> {
    const entries = [...ADDON_REGISTRY.values()];
    const installedChecks = await Promise.all(entries.map((def) => this.isInstalled(def.name)));
    return entries.map((def, i) => {
      const userConfig = this.config.addons?.[def.name];
      const validation = this.validateSettings(def.name);
      return {
        name: def.name,
        description: def.description,
        enabled: userConfig?.enabled ?? false,
        installed: installedChecks[i],
        settingsValid: validation.valid,
        missingSettings: validation.missing,
      };
    });
  }

  /** 检测单个 addon 是否已安装 */
  async isInstalled(name: string): Promise<boolean> {
    const def = ADDON_REGISTRY.get(name);
    if (!def) return false;

    try {
      await this.execCommand(
        def.detectCommand.bin,
        def.detectCommand.args,
        DETECT_TIMEOUT_MS,
        this.buildEnv(name),
      );
      return true;
    } catch {
      return false;
    }
  }

  /** 安装单个 addon */
  async install(name: string, onLog?: LogFn): Promise<void> {
    const def = ADDON_REGISTRY.get(name);
    if (!def) {
      throw new Error(`未知 addon: ${name}。已注册: ${[...ADDON_REGISTRY.keys()].join(', ')}`);
    }

    const pkg = def.packageName ?? def.name;
    const spec = def.versionConstraint ? `${pkg}${def.versionConstraint}` : pkg;

    onLog?.(`正在安装 ${name}...`);

    switch (def.installer) {
      case 'pip':
        await this.pipInstall(spec, onLog);
        break;
      case 'npm':
        await this.execCommand('npm', ['install', '-g', spec], INSTALL_TIMEOUT_MS);
        break;
      default:
        throw new Error(`不支持的安装器类型: ${def.installer}`);
    }

    // 安装后验证
    const installed = await this.isInstalled(name);
    if (!installed) {
      throw new Error(`${name} 安装命令成功但检测仍不可用，请检查 PATH 配置`);
    }

    onLog?.(`${name} 安装成功`);
  }

  /** 卸载单个 addon */
  async uninstall(name: string, purge: boolean = false, onLog?: LogFn): Promise<void> {
    const def = ADDON_REGISTRY.get(name);
    if (!def) {
      throw new Error(`未知 addon: ${name}`);
    }

    const pkg = def.packageName ?? def.name;

    onLog?.(`正在卸载 ${name}...`);

    switch (def.installer) {
      case 'pip':
        await this.execCommand('pip', ['uninstall', '-y', pkg], INSTALL_TIMEOUT_MS);
        break;
      case 'npm':
        await this.execCommand('npm', ['uninstall', '-g', pkg], INSTALL_TIMEOUT_MS);
        break;
    }

    if (purge && def.dataDirs) {
      for (const dir of def.dataDirs) {
        const resolved = dir.replace(/^~/, os.homedir());
        if (fs.existsSync(resolved)) {
          fs.rmSync(resolved, { recursive: true, force: true });
          onLog?.(`已清理数据目录: ${resolved}`);
        }
      }
    }

    onLog?.(`${name} 卸载成功`);
  }

  /** 获取 addon 对应的环境变量（从 settings 映射） */
  getEnvVars(name: string): Record<string, string> {
    const def = ADDON_REGISTRY.get(name);
    if (!def) return {};

    const userConfig = this.config.addons?.[name];
    if (!userConfig?.settings) return {};

    const env: Record<string, string> = {};
    for (const [settingsKey, envVar] of Object.entries(def.envMapping)) {
      const val = userConfig.settings[settingsKey];
      if (val !== undefined && val !== null) {
        env[envVar] = String(val);
      }
    }
    return env;
  }

  /** 校验 addon 配置完整性 */
  validateSettings(name: string): { valid: boolean; missing: string[] } {
    const def = ADDON_REGISTRY.get(name);
    if (!def || !def.requiredSettings?.length) {
      return { valid: true, missing: [] };
    }

    const userConfig = this.config.addons?.[name];
    const settings = userConfig?.settings ?? {};
    const missing: string[] = [];

    for (const key of def.requiredSettings) {
      const val = settings[key];
      if (val === undefined || val === null || val === '') {
        missing.push(key);
      }
    }

    return { valid: missing.length === 0, missing };
  }

  /** connect 时自动安装所有已启用但未安装的 addon */
  async ensureEnabledAddons(onLog?: LogFn): Promise<AddonEnsureResult[]> {
    const results: AddonEnsureResult[] = [];

    for (const [name, def] of ADDON_REGISTRY) {
      const userConfig = this.config.addons?.[name];
      if (!userConfig?.enabled) continue;

      const installed = await this.isInstalled(name);
      if (installed) {
        results.push({ name, action: 'already-installed' });
        continue;
      }

      // 已启用但未安装 → 自动安装
      try {
        await this.install(name, onLog);
        results.push({ name, action: 'installed' });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        onLog?.(`addon ${name} 自动安装失败: ${errorMsg}`, 'warn');
        results.push({ name, action: 'failed', error: errorMsg });
      }
    }

    return results;
  }

  // ── 内部方法 ──

  private buildEnv(name: string): NodeJS.ProcessEnv {
    return { ...process.env, ...this.getEnvVars(name) };
  }

  private async pipInstall(spec: string, onLog?: LogFn): Promise<void> {
    try {
      await this.execCommand('pip', ['install', spec], INSTALL_TIMEOUT_MS);
    } catch {
      // 如果直接 pip install 失败，尝试 pip install --user
      onLog?.('pip install 失败，尝试 --user 模式...');
      await this.execCommand('pip', ['install', '--user', spec], INSTALL_TIMEOUT_MS);
    }
  }

  private execCommand(
    bin: string,
    args: string[],
    timeout: number,
    env?: NodeJS.ProcessEnv,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      execFile(bin, args, {
        timeout,
        maxBuffer: 5 * 1024 * 1024,
        env: env ?? process.env,
      }, (error, stdout, stderr) => {
        if (error) {
          const msg = stderr?.trim() || stdout?.trim() || error.message;
          reject(new Error(msg));
          return;
        }
        resolve(stdout.trim());
      });
    });
  }
}
