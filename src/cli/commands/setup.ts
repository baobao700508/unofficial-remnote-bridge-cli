/**
 * setup 命令
 *
 * 首次使用引导：打开有界面的 Chrome，让用户登录 RemNote。
 * 用户关闭浏览器后自动写入 .setup-done 标记，后续 connect --headless 可直接使用。
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { loadConfig, findProjectRoot } from '../config.js';
import { findChromePath, defaultUserDataDir } from '../daemon/headless-browser.js';
import { jsonOutput } from '../utils/output.js';

export const SETUP_DONE_FILE = '.setup-done';

export interface SetupOptions {
  json?: boolean;
}

/**
 * 检查是否已完成 setup（.setup-done 标记文件存在）
 */
export function isSetupDone(userDataDir?: string): boolean {
  const dir = userDataDir || defaultUserDataDir();
  return fs.existsSync(path.join(dir, SETUP_DONE_FILE));
}

/**
 * 检测是否在无桌面环境（沙箱、SSH、Docker 等）中运行。
 * setup 需要弹出有界面的 Chrome 窗口，无桌面环境下无法使用。
 */
function hasDisplay(): boolean {
  if (process.platform === 'win32' || process.platform === 'darwin') return true;
  // Linux：检查 DISPLAY 或 WAYLAND_DISPLAY 环境变量
  return !!(process.env['DISPLAY'] || process.env['WAYLAND_DISPLAY']);
}

export async function setupCommand(options: SetupOptions = {}): Promise<void> {
  const { json } = options;

  // 检查桌面环境
  if (!hasDisplay()) {
    const msg = 'setup 需要桌面环境来打开 Chrome 窗口，当前环境无法使用（沙箱 / SSH / Docker）。请在有桌面的机器上运行此命令';
    if (json) {
      jsonOutput({ ok: false, command: 'setup', error: msg });
    } else {
      console.error(msg);
    }
    process.exitCode = 1;
    return;
  }

  const projectRoot = findProjectRoot();
  const config = loadConfig(projectRoot);

  const userDataDir = config.headless?.userDataDir || defaultUserDataDir();
  const chromePath = config.headless?.chromePath || findChromePath();

  if (!chromePath) {
    const msg = '未找到 Chrome/Chromium。请安装 Chrome 或通过 .remnote-bridge.json 中的 headless.chromePath 指定路径';
    if (json) {
      jsonOutput({ ok: false, command: 'setup', error: msg });
    } else {
      console.error(msg);
    }
    process.exitCode = 1;
    return;
  }

  // 已完成 setup 的情况
  if (isSetupDone(userDataDir)) {
    if (json) {
      jsonOutput({ ok: true, command: 'setup', alreadyDone: true });
    } else {
      console.log('已完成登录设置。如需重新登录，请删除标记文件后重试：');
      console.log(`  rm ${path.join(userDataDir, SETUP_DONE_FILE)}`);
    }
    process.exitCode = 0;
    return;
  }

  // 创建 profile 目录
  fs.mkdirSync(userDataDir, { recursive: true });

  if (!json) {
    console.log('正在打开 Chrome，请在浏览器中登录 RemNote...');
    console.log('登录完成后，关闭浏览器窗口即可。');
  }

  // 启动有界面的 Chrome
  const chromeProcess = spawn(chromePath, [
    `--user-data-dir=${userDataDir}`,
    'https://www.remnote.com',
  ], {
    stdio: 'ignore',
    detached: false,
  });

  // 等待 Chrome 进程退出（用户关闭浏览器）
  const exitCode = await new Promise<number | null>((resolve) => {
    chromeProcess.on('exit', (code) => resolve(code));
    chromeProcess.on('error', (err) => {
      if (!json) {
        console.error(`Chrome 启动失败: ${err.message}`);
      }
      resolve(1);
    });
  });

  if (exitCode !== null && exitCode !== 0) {
    const msg = `Chrome 异常退出（退出码 ${exitCode}）`;
    if (json) {
      jsonOutput({ ok: false, command: 'setup', error: msg });
    } else {
      console.error(msg);
    }
    process.exitCode = 1;
    return;
  }

  // 写入 .setup-done 标记
  fs.writeFileSync(path.join(userDataDir, SETUP_DONE_FILE), new Date().toISOString());

  if (json) {
    jsonOutput({ ok: true, command: 'setup', profileDir: userDataDir });
  } else {
    console.log('登录设置完成！现在可以使用 remnote-bridge connect --headless 启动了。');
  }
  process.exitCode = 0;
}
