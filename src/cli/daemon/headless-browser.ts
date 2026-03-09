/**
 * Headless Chrome 管理器
 *
 * 使用 puppeteer-core 启动无头浏览器，自动导航到 RemNote 页面。
 * 支持 user data dir（持久化登录态）和远程调试端口（远程操作）。
 *
 * 健康监控：
 * - 监听页面崩溃 / 导航失败 / Chrome 断连，自动重载
 * - 捕获 console.error 写入日志
 * - 暴露结构化状态供 health / diagnose 使用
 * - 支持截图诊断（AI agent 可用来排查页面卡在哪）
 */

import path from 'path';
import fs from 'fs';
import type { Browser, Page } from 'puppeteer-core';

export type HeadlessStatus = 'stopped' | 'starting' | 'running' | 'crashed' | 'reloading';

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

export interface HeadlessDiagnostics {
  status: HeadlessStatus;
  chromeConnected: boolean;
  pageUrl: string | null;
  reloadCount: number;
  lastError: string | null;
  recentConsoleErrors: string[];
}

/** 最多保留最近 N 条 console.error */
const MAX_CONSOLE_ERRORS = 20;
/** 自动重载最大次数（防止无限循环） */
const MAX_AUTO_RELOADS = 5;
/** 重载间隔（秒） */
const RELOAD_DELAY_MS = 10_000;

/**
 * 在常见位置查找 Chrome/Chromium 可执行文件
 */
export function findChromePath(): string | null {
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
export function defaultUserDataDir(): string {
  const home = process.env['HOME'] || process.env['USERPROFILE'] || '/tmp';
  return path.join(home, '.remnote-bridge', 'chrome-profile');
}

export class HeadlessBrowserManager {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private options: HeadlessBrowserOptions;

  // 状态追踪
  private _status: HeadlessStatus = 'stopped';
  private _reloadCount = 0;
  private _lastError: string | null = null;
  private _consoleErrors: string[] = [];
  private _isShuttingDown = false;

  constructor(options: HeadlessBrowserOptions) {
    this.options = options;
  }

  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    this.options.onLog?.(message, level);
  }

  /**
   * 启动无头浏览器并导航到 RemNote 页面。
   * 如果已启动则跳过。
   */
  async start(): Promise<void> {
    if (this.browser) return;

    this._isShuttingDown = false;
    this._status = 'starting';
    this._reloadCount = 0;
    this._lastError = null;
    this._consoleErrors = [];

    const { remNoteUrl, remoteDebuggingPort } = this.options;

    const chromePath = this.options.chromePath || findChromePath();
    if (!chromePath) {
      this._status = 'crashed';
      this._lastError = '未找到 Chrome/Chromium';
      throw new Error(
        '未找到 Chrome/Chromium。请安装 Chrome 或通过 .remnote-bridge.json 中的 headless.chromePath 指定路径',
      );
    }

    const userDataDir = this.options.userDataDir || defaultUserDataDir();
    fs.mkdirSync(userDataDir, { recursive: true });

    this.log(`[headless] 启动 Chrome: ${chromePath}`, 'info');
    this.log(`[headless] User Data Dir: ${userDataDir}`, 'info');
    if (remoteDebuggingPort) {
      this.log(`[headless] 远程调试端口: ${remoteDebuggingPort}`, 'info');
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

    this.log('[headless] Chrome 已启动', 'info');

    // 监控 Chrome 进程断连
    this.browser.on('disconnected', () => {
      if (this._isShuttingDown) return;
      this.log('[headless] Chrome 进程断连', 'error');
      this._status = 'crashed';
      this._lastError = 'Chrome 进程断连（可能 OOM 或崩溃）';
      this.browser = null;
      this.page = null;
    });

    // 打开页面并设置监控
    await this.navigateAndMonitor(remNoteUrl);
    this._status = 'running';
  }

  /**
   * 导航到目标页面并挂载监控事件。
   */
  private async navigateAndMonitor(url: string): Promise<void> {
    if (!this.browser) throw new Error('Browser not started');

    const page = await this.browser.newPage();
    this.page = page;

    // 捕获 console.error → 写日志 + 缓存
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = `[console.error] ${msg.text()}`;
        this.log(`[headless] ${text}`, 'error');
        this._consoleErrors.push(text);
        if (this._consoleErrors.length > MAX_CONSOLE_ERRORS) {
          this._consoleErrors.shift();
        }
      }
    });

    // 页面崩溃监控
    page.on('error', (err) => {
      this.log(`[headless] 页面崩溃: ${err.message}`, 'error');
      this._lastError = `页面崩溃: ${err.message}`;
      this._status = 'crashed';
      this.scheduleReload();
    });

    // 页面关闭（不应该发生，但以防万一）
    page.on('close', () => {
      if (this._isShuttingDown) return;
      this.log('[headless] 页面被关闭', 'warn');
      this.page = null;
      this.scheduleReload();
    });

    // 导航
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      this.log(`[headless] 已导航到 ${url}`, 'info');
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.log(`[headless] 导航失败: ${errMsg}`, 'error');
      this._lastError = `导航失败: ${errMsg}`;
      this._status = 'crashed';
      this.scheduleReload();
    }
  }

  /**
   * 自动重载（延迟后重新导航），带最大次数限制。
   */
  private scheduleReload(): void {
    if (this._isShuttingDown) return;
    if (this._reloadCount >= MAX_AUTO_RELOADS) {
      this.log(`[headless] 已达最大自动重载次数 (${MAX_AUTO_RELOADS})，停止重试`, 'error');
      this._lastError = `连续 ${MAX_AUTO_RELOADS} 次重载失败，已停止自动恢复。可通过 diagnose 查看详情`;
      return;
    }

    this._reloadCount++;
    this._status = 'reloading';
    this.log(`[headless] ${RELOAD_DELAY_MS / 1000}s 后自动重载（第 ${this._reloadCount}/${MAX_AUTO_RELOADS} 次）`, 'warn');

    setTimeout(async () => {
      if (this._isShuttingDown) return;
      try {
        // 关掉旧页面
        if (this.page && !this.page.isClosed()) {
          await this.page.close().catch(() => {});
        }
        this.page = null;

        // Chrome 进程还在？重新开页面
        if (this.browser?.connected) {
          await this.navigateAndMonitor(this.options.remNoteUrl);
          this._status = 'running';
          this.log('[headless] 重载成功', 'info');
        } else {
          this.log('[headless] Chrome 已断连，无法重载', 'error');
          this._status = 'crashed';
          this._lastError = 'Chrome 已断连，需要 disconnect + connect --headless 重启';
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        this.log(`[headless] 重载失败: ${errMsg}`, 'error');
        this._lastError = `重载失败: ${errMsg}`;
        this._status = 'crashed';
        this.scheduleReload(); // 继续重试（直到达上限）
      }
    }, RELOAD_DELAY_MS);
  }

  /**
   * 关闭浏览器。
   */
  async stop(): Promise<void> {
    if (!this.browser) return;
    this._isShuttingDown = true;
    this._status = 'stopped';

    try {
      await this.browser.close();
    } catch {
      // 忽略关闭时的错误
    }
    this.browser = null;
    this.page = null;
  }

  isRunning(): boolean {
    return this.browser !== null && this.browser.connected;
  }

  /**
   * 获取结构化诊断信息（供 get_status / health / diagnose 使用）。
   */
  getDiagnostics(): HeadlessDiagnostics {
    let pageUrl: string | null = null;
    try {
      if (this.page && !this.page.isClosed()) {
        pageUrl = this.page.url();
      }
    } catch {
      // page 可能已失效
    }

    return {
      status: this._status,
      chromeConnected: this.browser?.connected ?? false,
      pageUrl,
      reloadCount: this._reloadCount,
      lastError: this._lastError,
      recentConsoleErrors: [...this._consoleErrors],
    };
  }

  /**
   * 截图诊断：将当前页面截图保存到指定路径，返回路径。
   * 用于 AI agent 排查页面状态。
   */
  async takeScreenshot(outputPath?: string): Promise<string | null> {
    if (!this.page || this.page.isClosed()) {
      this.log('[headless] 无法截图：页面不存在或已关闭', 'warn');
      return null;
    }

    const screenshotPath = outputPath || path.join(
      this.options.userDataDir || defaultUserDataDir(),
      '..',
      'diagnose-screenshot.png',
    );

    try {
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      this.log(`[headless] 截图已保存: ${screenshotPath}`, 'info');
      return screenshotPath;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.log(`[headless] 截图失败: ${errMsg}`, 'error');
      return null;
    }
  }

  /**
   * 手动触发重载（重置重载计数，AI agent 可在自动重载用尽后调用）。
   */
  async manualReload(): Promise<boolean> {
    if (!this.browser?.connected) {
      this.log('[headless] Chrome 已断连，无法重载', 'error');
      return false;
    }

    this._reloadCount = 0; // 重置计数
    this.log('[headless] 手动重载触发', 'info');

    try {
      if (this.page && !this.page.isClosed()) {
        await this.page.close().catch(() => {});
      }
      this.page = null;
      await this.navigateAndMonitor(this.options.remNoteUrl);
      this._status = 'running';
      this._lastError = null;
      this.log('[headless] 手动重载成功', 'info');
      return true;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this._lastError = `手动重载失败: ${errMsg}`;
      this._status = 'crashed';
      this.log(`[headless] 手动重载失败: ${errMsg}`, 'error');
      return false;
    }
  }
}
