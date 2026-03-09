/**
 * Headless Chrome 管理器
 *
 * 使用 puppeteer-core 启动无头浏览器，自动导航到 RemNote 页面。
 * 支持 user data dir（持久化登录态）和远程调试端口（远程操作）。
 */

import path from 'path';
import fs from 'fs';
import type { Browser } from 'puppeteer-core';

export interface HeadlessBrowserOptions {
  /** RemNote 页面 URL（dev-server 提供的插件入口页面） */
  remNoteUrl: string;
  /** Chrome 可执行文件路径（不指定则自动查找） */
  chromePath?: string;
  /** 用户数据目录（持久化登录态、IndexedDB 等） */
  userDataDir?: string;
  /** 远程调试端口（0 或不设则不暴露） */
  remoteDebuggingPort?: number;
  onLog?: (message: string, level: 'info' | 'warn' | 'error') => void;
}

/**
 * 在常见位置查找 Chrome/Chromium 可执行文件
 */
function findChromePath(): string | null {
  const candidates: string[] = [];

  if (process.platform === 'linux') {
    candidates.push(
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/snap/bin/chromium',
    );
  } else if (process.platform === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    );
  } else if (process.platform === 'win32') {
    const programFiles = process.env['PROGRAMFILES'] || 'C:\\Program Files';
    const programFilesX86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';
    const localAppData = process.env['LOCALAPPDATA'] || '';
    candidates.push(
      path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    );
  }

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/**
 * 默认 user data dir 路径（~/.remnote-bridge/chrome-profile）
 */
function defaultUserDataDir(): string {
  const home = process.env['HOME'] || process.env['USERPROFILE'] || '/tmp';
  return path.join(home, '.remnote-bridge', 'chrome-profile');
}

export class HeadlessBrowserManager {
  private browser: Browser | null = null;
  private options: HeadlessBrowserOptions;

  constructor(options: HeadlessBrowserOptions) {
    this.options = options;
  }

  /**
   * 启动无头浏览器并导航到 RemNote 页面。
   * 如果已启动则跳过。
   */
  async start(): Promise<void> {
    if (this.browser) return;

    const { remNoteUrl, remoteDebuggingPort, onLog } = this.options;

    const chromePath = this.options.chromePath || findChromePath();
    if (!chromePath) {
      throw new Error(
        '未找到 Chrome/Chromium。请安装 Chrome 或通过 .remnote-bridge.json 中的 headless.chromePath 指定路径',
      );
    }

    const userDataDir = this.options.userDataDir || defaultUserDataDir();
    fs.mkdirSync(userDataDir, { recursive: true });

    onLog?.(`[headless] 启动 Chrome: ${chromePath}`, 'info');
    onLog?.(`[headless] User Data Dir: ${userDataDir}`, 'info');
    if (remoteDebuggingPort) {
      onLog?.(`[headless] 远程调试端口: ${remoteDebuggingPort}`, 'info');
    }

    const puppeteer = await import('puppeteer-core');

    const args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
    ];

    if (remoteDebuggingPort) {
      args.push(
        `--remote-debugging-port=${remoteDebuggingPort}`,
        '--remote-debugging-address=0.0.0.0',
      );
    }

    this.browser = await puppeteer.default.launch({
      headless: true,
      executablePath: chromePath,
      userDataDir,
      args,
    });

    onLog?.('[headless] Chrome 已启动', 'info');

    // 打开 RemNote 页面
    const page = await this.browser.newPage();
    await page.goto(remNoteUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    onLog?.(`[headless] 已导航到 ${remNoteUrl}`, 'info');
  }

  /**
   * 关闭浏览器。
   */
  async stop(): Promise<void> {
    if (!this.browser) return;

    try {
      await this.browser.close();
    } catch {
      // 忽略关闭时的错误
    }
    this.browser = null;
  }

  isRunning(): boolean {
    return this.browser !== null && this.browser.connected;
  }
}
