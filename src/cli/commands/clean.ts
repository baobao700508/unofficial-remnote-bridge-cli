/**
 * clean 命令
 *
 * 清理 remnote-bridge 在本机产生的所有残留文件：
 * - ~/.remnote-bridge/instances/*.pid / *.log
 * - ~/.remnote-bridge/registry.json
 * - ~/.remnote-bridge/config.json（可选）
 * - 旧版项目根：.remnote-bridge.pid / .remnote-bridge.log / .remnote-bridge.json
 * - 用户目录：~/.claude/skills/remnote-bridge/
 *
 * 如果守护进程仍在运行，先停止再清理。
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { GLOBAL_DIR } from '../config.js';
import {
  loadRegistry,
  cleanStaleSlots,
  saveRegistry,
  instancePidPath,
  MAX_SLOTS,
} from '../daemon/registry.js';
import { isDaemonAlive } from '../daemon/pid.js';
import { ADDON_REGISTRY } from '../addon/registry.js';
import { jsonOutput } from '../utils/output.js';

export interface CleanOptions {
  json?: boolean;
}

export async function cleanCommand(options: CleanOptions = {}): Promise<void> {
  const { json } = options;
  const removed: string[] = [];
  const errors: string[] = [];

  // 1. 停止所有运行中的 daemon
  const registry = loadRegistry();
  for (const entry of registry.slots) {
    if (entry && isDaemonAlive(entry.pid)) {
      if (!json) {
        console.log(`守护进程运行中（PID: ${entry.pid}，实例: ${entry.instance}），正在停止...`);
      }
      try {
        process.kill(entry.pid, 'SIGTERM');
        const start = Date.now();
        while (Date.now() - start < 5000) {
          try {
            process.kill(entry.pid, 0);
            await new Promise(r => setTimeout(r, 200));
          } catch {
            break;
          }
        }
        try {
          process.kill(entry.pid, 0);
          process.kill(entry.pid, 'SIGKILL');
        } catch {
          // 已退出
        }
      } catch {
        // 进程可能已退出
      }
    }
  }

  // 2. 清理 ~/.remnote-bridge/instances/ 下的 PID 和日志文件
  const instancesDir = path.join(GLOBAL_DIR, 'instances');
  if (fs.existsSync(instancesDir)) {
    for (let i = 0; i < MAX_SLOTS; i++) {
      for (const ext of ['.pid', '.log']) {
        const filePath = path.join(instancesDir, `${i}${ext}`);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
            removed.push(filePath);
            if (!json) console.log(`  已删除: ${filePath}`);
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            errors.push(`${filePath}: ${msg}`);
            if (!json) console.error(`  删除失败: ${filePath} — ${msg}`);
          }
        }
      }
    }
  }

  // 3. 清理 registry.json
  const registryPath = path.join(GLOBAL_DIR, 'registry.json');
  if (fs.existsSync(registryPath)) {
    try {
      fs.unlinkSync(registryPath);
      removed.push(registryPath);
      if (!json) console.log(`  已删除: ${registryPath}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${registryPath}: ${msg}`);
      if (!json) console.error(`  删除失败: ${registryPath} — ${msg}`);
    }
  }

  // 4. 清理旧版项目根文件（向后兼容）
  try {
    const { findProjectRoot } = await import('../config.js');
    const projectRoot = findProjectRoot();
    const legacyFiles = [
      path.join(projectRoot, '.remnote-bridge.pid'),
      path.join(projectRoot, '.remnote-bridge.log'),
      path.join(projectRoot, '.remnote-bridge.json'),
    ];
    for (const filePath of legacyFiles) {
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          removed.push(filePath);
          if (!json) console.log(`  已删除（旧版）: ${filePath}`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`${filePath}: ${msg}`);
          if (!json) console.error(`  删除失败: ${filePath} — ${msg}`);
        }
      }
    }
  } catch {
    // findProjectRoot 失败不阻塞
  }

  // 5. 清理 ~/.claude/skills/remnote-bridge/
  const skillDir = path.join(os.homedir(), '.claude', 'skills', 'remnote-bridge');
  if (fs.existsSync(skillDir)) {
    try {
      fs.rmSync(skillDir, { recursive: true, force: true });
      removed.push(skillDir);
      if (!json) console.log(`  已删除: ${skillDir}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${skillDir}: ${msg}`);
      if (!json) console.error(`  删除失败: ${skillDir} — ${msg}`);
    }
  }

  // 6. 清理 addon 数据目录
  for (const [, def] of ADDON_REGISTRY) {
    if (!def.dataDirs) continue;
    for (const dir of def.dataDirs) {
      const resolved = dir.replace(/^~/, os.homedir());
      if (fs.existsSync(resolved)) {
        try {
          fs.rmSync(resolved, { recursive: true, force: true });
          removed.push(resolved);
          if (!json) console.log(`  已删除: ${resolved}`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`${resolved}: ${msg}`);
          if (!json) console.error(`  删除失败: ${resolved} — ${msg}`);
        }
      }
    }
  }

  // 7. 输出结果
  if (json) {
    jsonOutput({
      ok: errors.length === 0,
      command: 'clean',
      removed,
      ...(errors.length > 0 ? { errors } : {}),
    });
  } else {
    if (removed.length === 0 && errors.length === 0) {
      console.log('没有发现需要清理的文件');
    } else if (errors.length === 0) {
      console.log(`\n清理完成，共删除 ${removed.length} 项`);
    } else {
      console.log(`\n清理完成，删除 ${removed.length} 项，${errors.length} 项失败`);
    }
  }
}
