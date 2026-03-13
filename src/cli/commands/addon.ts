/**
 * addon 命令组
 *
 * 管理增强项目（addon）的安装、卸载和状态查看。
 * - addon list          查看所有增强项目状态
 * - addon install <name>  安装指定增强项目
 * - addon uninstall <name> [--purge]  卸载指定增强项目
 */

import { loadConfig, configFilePath, saveConfig } from '../config.js';
import type { BridgeConfig } from '../config.js';
import { AddonManager } from '../addon/addon-manager.js';
import { ADDON_REGISTRY } from '../addon/registry.js';
import { jsonOutput } from '../utils/output.js';

export interface AddonOptions {
  json?: boolean;
  purge?: boolean;
}

export async function addonListCommand(options: AddonOptions = {}): Promise<void> {
  const { json } = options;
  const config = loadConfig();
  const manager = new AddonManager(config);
  const statuses = await manager.listAll();

  if (json) {
    jsonOutput({ ok: true, command: 'addon-list', addons: statuses });
  } else {
    if (statuses.length === 0) {
      console.log('暂无已注册的增强项目');
      return;
    }
    console.log('增强项目列表：\n');
    for (const s of statuses) {
      const enableTag = s.enabled ? '[已启用]' : '[已禁用]';
      const installTag = s.installed ? '[已安装]' : '[未安装]';
      const settingsTag = !s.settingsValid ? ` [缺少配置: ${s.missingSettings.join(', ')}]` : '';
      console.log(`  ${s.name}  ${enableTag} ${installTag}${settingsTag}  ${s.description}`);
    }
  }
}

export async function addonInstallCommand(name: string, options: AddonOptions = {}): Promise<void> {
  const { json } = options;

  if (!ADDON_REGISTRY.has(name)) {
    const available = [...ADDON_REGISTRY.keys()].join(', ');
    if (json) {
      jsonOutput({ ok: false, command: 'addon-install', error: `未知 addon: ${name}。可选: ${available}` });
    } else {
      console.error(`错误: 未知 addon「${name}」。可选: ${available}`);
    }
    process.exitCode = 1;
    return;
  }

  const config = loadConfig();
  const manager = new AddonManager(config);

  // 检查是否已安装
  const alreadyInstalled = await manager.isInstalled(name);
  if (alreadyInstalled) {
    if (json) {
      jsonOutput({ ok: true, command: 'addon-install', name, action: 'already-installed' });
    } else {
      console.log(`${name} 已安装`);
    }
    // 确保配置中标记为 enabled
    setAddonEnabled(config, name, true);
    return;
  }

  try {
    await manager.install(name, json ? undefined : (msg) => console.log(msg));

    // 安装成功，自动启用
    setAddonEnabled(config, name, true);

    if (json) {
      jsonOutput({ ok: true, command: 'addon-install', name, action: 'installed' });
    } else {
      console.log(`\n${name} 安装成功并已启用`);

      // 检查必需配置
      const validation = manager.validateSettings(name);
      if (!validation.valid) {
        console.log(`\n注意：以下配置项尚未设置: ${validation.missing.join(', ')}`);
        console.log(`请在 .remnote-bridge.json 的 addons.${name}.settings 中配置`);
      }
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (json) {
      jsonOutput({ ok: false, command: 'addon-install', name, error: errorMsg });
    } else {
      console.error(`错误: ${name} 安装失败 — ${errorMsg}`);
    }
    process.exitCode = 1;
  }
}

export async function addonUninstallCommand(name: string, options: AddonOptions = {}): Promise<void> {
  const { json, purge } = options;

  if (!ADDON_REGISTRY.has(name)) {
    const available = [...ADDON_REGISTRY.keys()].join(', ');
    if (json) {
      jsonOutput({ ok: false, command: 'addon-uninstall', error: `未知 addon: ${name}。可选: ${available}` });
    } else {
      console.error(`错误: 未知 addon「${name}」。可选: ${available}`);
    }
    process.exitCode = 1;
    return;
  }

  const config = loadConfig();
  const manager = new AddonManager(config);

  try {
    await manager.uninstall(name, purge, json ? undefined : (msg) => console.log(msg));

    // 卸载后在配置中禁用
    setAddonEnabled(config, name, false);

    if (json) {
      jsonOutput({ ok: true, command: 'addon-uninstall', name, purged: purge ?? false });
    } else {
      console.log(`\n${name} 卸载成功${purge ? '（数据已清理）' : ''}`);
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (json) {
      jsonOutput({ ok: false, command: 'addon-uninstall', name, error: errorMsg });
    } else {
      console.error(`错误: ${name} 卸载失败 — ${errorMsg}`);
    }
    process.exitCode = 1;
  }
}

// ── 辅助：更新配置文件 ──

function setAddonEnabled(config: BridgeConfig, name: string, enabled: boolean): void {
  if (!enabled) {
    if (!config.addons?.[name]) return;
    config.addons[name].enabled = false;
  } else {
    if (!config.addons) config.addons = {};
    if (!config.addons[name]) config.addons[name] = { enabled: true };
    else config.addons[name].enabled = true;
  }

  try {
    saveConfig(configFilePath(), config);
  } catch {
    // 写配置失败不阻塞主流程
  }
}
