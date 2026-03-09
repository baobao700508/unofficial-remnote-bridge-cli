/**
 * setup 命令
 *
 * 启动有界面的 Chrome（使用共享 profile 目录），让用户登录 RemNote。
 * 登录完成后关闭 Chrome，写入 .setup-done 标记。
 * 后续 connect --headless 使用相同 profile 实现免登录。
 */

import fs from 'fs';
import { spawn } from 'child_process';
import {
  findChromePath,
  hasDisplay,
  getDefaultProfileDir,
  getSetupDonePath,
} from '../daemon/headless-browser.js';
import { jsonOutput } from '../utils/output.js';

export interface SetupOptions {
  json?: boolean;
}

export async function setupCommand(options: SetupOptions = {}): Promise<void> {
  const { json } = options;
  const profileDir = getDefaultProfileDir();
  const setupDonePath = getSetupDonePath();

  // 检查桌面环境
  if (!hasDisplay()) {
    const error = '未检测到桌面环境（无 DISPLAY/WAYLAND_DISPLAY），setup 需要 GUI 才能登录';
    if (json) {
      jsonOutput({ ok: false, command: 'setup', error });
    } else {
      console.error(error);
    }
    process.exitCode = 1;
    return;
  }

  // 检查 Chrome
  const chromePath = findChromePath();
  if (!chromePath) {
    const error = '未找到 Chrome/Chromium，请安装后重试';
    if (json) {
      jsonOutput({ ok: false, command: 'setup', error });
    } else {
      console.error(error);
    }
    process.exitCode = 1;
    return;
  }

  // 检查是否已完成 setup
  if (fs.existsSync(setupDonePath)) {
    if (json) {
      jsonOutput({ ok: true, command: 'setup', profileDir, alreadyDone: true });
    } else {
      console.log(`已完成 setup（profile: ${profileDir}）`);
      console.log('如需重新登录，请删除以下文件后重试：');
      console.log(`  ${setupDonePath}`);
    }
    process.exitCode = 0;
    return;
  }

  // 确保 profile 目录存在
  fs.mkdirSync(profileDir, { recursive: true });

  if (!json) {
    console.log('正在启动 Chrome...');
    console.log('请在浏览器中登录 RemNote，完成后关闭浏览器窗口。');
  }

  // 启动 Chrome（非 headless，用户可见）
  const child = spawn(chromePath, [
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    'https://www.remnote.com',
  ], {
    stdio: 'ignore',
    detached: false,
  });

  // 等待 Chrome 退出（超时 10 分钟）
  const exitCode = await new Promise<number | null>((resolve) => {
    const timeout = setTimeout(() => {
      child.kill();
      resolve(null);
    }, 600_000);

    child.on('exit', (code) => {
      clearTimeout(timeout);
      resolve(code);
    });

    child.on('error', (err) => {
      clearTimeout(timeout);
      resolve(-1);
    });
  });

  if (exitCode === null) {
    const error = 'Chrome 未在 10 分钟内关闭，setup 超时';
    if (json) {
      jsonOutput({ ok: false, command: 'setup', error });
    } else {
      console.error(error);
    }
    process.exitCode = 1;
    return;
  }

  // 写入 .setup-done 标记
  const doneData = {
    completedAt: new Date().toISOString(),
    chromePath,
    profileDir,
  };
  fs.writeFileSync(setupDonePath, JSON.stringify(doneData, null, 2));

  if (json) {
    jsonOutput({ ok: true, command: 'setup', profileDir, alreadyDone: false });
  } else {
    console.log('setup 完成！');
    console.log(`  profile 目录: ${profileDir}`);
    console.log('现在可以使用 `remnote-bridge connect --headless` 启动无头连接。');
  }
  process.exitCode = 0;
}
