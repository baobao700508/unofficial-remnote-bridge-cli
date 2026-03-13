/**
 * clean 命令
 *
 * 清理 remnote-bridge 在本机产生的所有残留文件：
 * - 项目根：.remnote-bridge.pid / .remnote-bridge.log / .remnote-bridge.json
 * - 用户目录：~/.claude/skills/remnote-bridge/
 *
 * 如果守护进程仍在运行，先停止再清理。
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { findProjectRoot, pidFilePath, logFilePath, configFilePath } from '../config.js';
import { checkDaemon, removePid } from '../daemon/pid.js';
import { ADDON_REGISTRY } from '../addon/registry.js';
import { jsonOutput } from '../utils/output.js';

export interface CleanOptions {
  json?: boolean;
}

export async function cleanCommand(options: CleanOptions = {}): Promise<void> {
  const { json } = options;
  const projectRoot = findProjectRoot();
  const removed: string[] = [];
  const errors: string[] = [];

  // 1. 如果守护进程在运行，先停止
  const pidPath = pidFilePath(projectRoot);
  const status = checkDaemon(pidPath);
  if (status.running) {
    if (!json) {
      console.log(`守护进程运行中（PID: ${status.pid}），正在停止...`);
    }
    try {
      process.kill(status.pid, 'SIGTERM');
      // 等待最多 5 秒
      const start = Date.now();
      while (Date.now() - start < 5000) {
        try {
          process.kill(status.pid, 0);
          await new Promise(r => setTimeout(r, 200));
        } catch {
          break; // 进程已退出
        }
      }
      // 如果还没退出，强制终止
      try {
        process.kill(status.pid, 0);
        process.kill(status.pid, 'SIGKILL');
      } catch {
        // 已退出
      }
    } catch {
      // 进程可能已退出
    }
  }

  // 2. 清理项目根下的文件
  const projectFiles = [
    pidFilePath(projectRoot),
    logFilePath(projectRoot),
    configFilePath(projectRoot),
  ];

  for (const filePath of projectFiles) {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        removed.push(filePath);
        if (!json) {
          console.log(`  已删除: ${filePath}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${filePath}: ${msg}`);
        if (!json) {
          console.error(`  删除失败: ${filePath} — ${msg}`);
        }
      }
    }
  }

  // 3. 清理 ~/.claude/skills/remnote-bridge/
  const skillDir = path.join(os.homedir(), '.claude', 'skills', 'remnote-bridge');
  if (fs.existsSync(skillDir)) {
    try {
      fs.rmSync(skillDir, { recursive: true, force: true });
      removed.push(skillDir);
      if (!json) {
        console.log(`  已删除: ${skillDir}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${skillDir}: ${msg}`);
      if (!json) {
        console.error(`  删除失败: ${skillDir} — ${msg}`);
      }
    }
  }

  // 4. 清理 addon 数据目录
  for (const [, def] of ADDON_REGISTRY) {
    if (!def.dataDirs) continue;
    for (const dir of def.dataDirs) {
      const resolved = dir.replace(/^~/, os.homedir());
      if (fs.existsSync(resolved)) {
        try {
          fs.rmSync(resolved, { recursive: true, force: true });
          removed.push(resolved);
          if (!json) {
            console.log(`  已删除: ${resolved}`);
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`${resolved}: ${msg}`);
          if (!json) {
            console.error(`  删除失败: ${resolved} — ${msg}`);
          }
        }
      }
    }
  }

  // 5. 输出结果
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
