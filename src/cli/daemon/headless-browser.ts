/**
 * Headless Chrome 浏览器管理器
 *
 * 在 daemon 中启动 headless Chrome 加载 RemNote Plugin 页面，
 * 实现无 GUI 环境下的全自动连接。
 *
 * 属于进程管理层（daemon/），与 static-server.ts、dev-server.ts 平级。
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import type { Browser, Page } from 'puppeteer-core';
import type { HeadlessStatus, HeadlessDiagnostics } from '../protocol.js';

// ── 工具函数（setup 命令复用） ──

/**
 * 按平台自动检测 Chrome/Chromium 路径。
 * 返回 null 表示未找到。
 */
export function findChromePath(): string | null {
  const platform = os.platform();

  const candidates: string[] = [];

  if (platform === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    );
  } else if (platform === 'win32') {
    const programFiles = process.env['PROGRAMFILES'] || 'C:\\Program Files';
    const programFilesX86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';
    const localAppData = process.env['LOCALAPPDATA'] || '';
    candidates.push(
      path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    );
  } else {
    // Linux
    candidates.push(
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/snap/bin/chromium',
    );
  }

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/**
 * 检测是否有桌面环境（GUI）。
 * macOS/Windows 始终返回 true，Linux 检查 DISPLAY/WAYLAND_DISPLAY。
 */
export function hasDisplay(): boolean {
  const platform = os.platform();
  if (platform === 'darwin' || platform === 'win32') return true;
  return !!(process.env['DISPLAY'] || process.env['WAYLAND_DISPLAY']);
}

/**
 * 返回 headless Chrome 的默认 profile 目录。
 */
export function getDefaultProfileDir(): string {
  return path.join(os.homedir(), '.remnote-bridge', 'chrome-profile');
}

/**
 * 返回 setup 完成标记文件路径。
 */
export function getSetupDonePath(): string {
  return path.join(getDefaultProfileDir(), '.setup-done');
}

// ── Chrome PID 文件管理（孤儿进程清理） ──

const HEADLESS_PID_FILENAME = '.headless-pid';

function getHeadlessPidPath(): string {
  return path.join(os.homedir(), '.remnote-bridge', HEADLESS_PID_FILENAME);
}

/**
 * 将 Chrome 进程 PID 写入文件，供孤儿清理使用。
 */
function writeHeadlessPid(pid: number): void {
  const filePath = getHeadlessPidPath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, String(pid), 'utf-8');
}

/**
 * 删除 Chrome PID 文件。
 */
function removeHeadlessPid(): void {
  try {
    fs.unlinkSync(getHeadlessPidPath());
  } catch {
    // 文件不存在则忽略
  }
}

/**
 * 清理孤儿 headless Chrome 进程。
 * 读取 PID 文件，如果对应进程仍在运行则 kill，最后删除 PID 文件。
 * 在 disconnect 和 connect --headless 启动前调用。
 */
export function cleanupOrphanChrome(onLog?: (msg: string) => void): void {
  const pidPath = getHeadlessPidPath();
  let pidStr: string;
  try {
    pidStr = fs.readFileSync(pidPath, 'utf-8').trim();
  } catch {
    return; // 无 PID 文件，无需清理
  }

  const pid = parseInt(pidStr, 10);
  if (isNaN(pid)) {
    removeHeadlessPid();
    return;
  }

  // 检查进程是否仍在运行
  try {
    process.kill(pid, 0); // 不发信号，仅检查存在性
  } catch {
    // 进程已不存在，清理 PID 文件即可
    removeHeadlessPid();
    return;
  }

  // 进程仍在运行 → kill 它
  onLog?.(`发现孤儿 headless Chrome 进程 (PID: ${pid})，正在清理...`);
  try {
    process.kill(pid, 'SIGTERM');
    // 给 Chrome 1 秒优雅退出（同步等待，每 50ms 检查一次，避免忙轮询）
    const start = Date.now();
    while (Date.now() - start < 1000) {
      try {
        process.kill(pid, 0);
      } catch {
        break; // 已退出
      }
      // 同步 sleep 50ms，避免 CPU 忙等待
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
    }
    // 如果还没退出，强杀
    try {
      process.kill(pid, 0);
      process.kill(pid, 'SIGKILL');
      onLog?.(`孤儿 Chrome 进程 (PID: ${pid}) 已强制终止`);
    } catch {
      onLog?.(`孤儿 Chrome 进程 (PID: ${pid}) 已清理`);
    }
  } catch {
    // kill 失败，可能已退出
  }
  removeHeadlessPid();
}

// ── HeadlessBrowserManager ──

export interface HeadlessBrowserOptions {
  remNoteUrl: string;
  chromePath?: string;
  userDataDir?: string;
  remoteDebuggingPort?: number;
  onLog?: (message: string, level: 'info' | 'warn' | 'error') => void;
}

const MAX_AUTO_RELOAD = 5;
const AUTO_RELOAD_DELAY_MS = 10_000;
const CONSOLE_ERROR_BUFFER_SIZE = 20;

export class HeadlessBrowserManager {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private status: HeadlessStatus = 'stopped';
  private reloadCount = 0;
  private lastError: string | null = null;
  private consoleErrors: string[] = [];
  private options: Required<Pick<HeadlessBrowserOptions, 'remNoteUrl'>> & HeadlessBrowserOptions;
  private autoReloadTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: HeadlessBrowserOptions) {
    this.options = options;
  }

  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    this.options.onLog?.(message, level);
  }

  /**
   * 启动 headless Chrome，打开 RemNote Plugin 页面。
   * 不等待 Plugin WS 连接建立——Plugin 自行连接，health 检测状态。
   */
  async start(): Promise<void> {
    this.status = 'starting';
    this.log('[headless] 正在启动 Chrome...');

    const chromePath = this.options.chromePath ?? findChromePath();
    if (!chromePath) {
      this.status = 'crashed';
      this.lastError = '未找到 Chrome/Chromium，请通过 --chrome-path 指定路径';
      throw new Error(this.lastError);
    }

    const userDataDir = this.options.userDataDir ?? getDefaultProfileDir();
    fs.mkdirSync(userDataDir, { recursive: true });

    try {
      // 动态 import puppeteer-core（避免未安装时报错）
      const puppeteer = await import('puppeteer-core');

      const launchOptions: Record<string, unknown> = {
        executablePath: chromePath,
        headless: 'shell' as const,
        userDataDir,
        args: [
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-gpu',
          '--disable-dev-shm-usage',
        ],
      };

      if (this.options.remoteDebuggingPort) {
        (launchOptions.args as string[]).push(
          `--remote-debugging-port=${this.options.remoteDebuggingPort}`,
        );
      }

      this.browser = await puppeteer.default.launch(launchOptions);
      this.page = await this.browser.newPage();

      // console 监控：仅收集 error 级别
      this.page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = `[${new Date().toISOString()}] ${msg.text()}`;
          this.consoleErrors.push(text);
          if (this.consoleErrors.length > CONSOLE_ERROR_BUFFER_SIZE) {
            this.consoleErrors.shift();
          }
        }
      });

      // 页面崩溃/关闭 → 自动恢复
      this.page.on('close', () => {
        if (this.status === 'running') {
          this.log('[headless] 页面意外关闭，将尝试自动恢复', 'warn');
          this.scheduleAutoReload();
        }
      });

      this.browser.on('disconnected', () => {
        if (this.status === 'running' || this.status === 'reloading') {
          this.log('[headless] Chrome 进程断开', 'warn');
          this.status = 'crashed';
          this.lastError = 'Chrome 进程断开';
          this.browser = null;
          this.page = null;
        }
      });

      // 导航到 RemNote Plugin 页面
      await this.page.goto(this.options.remNoteUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });

      this.status = 'running';

      // 记录 Chrome PID 供孤儿清理使用
      const chromePid = this.browser.process()?.pid;
      if (chromePid) {
        writeHeadlessPid(chromePid);
        this.log(`[headless] Chrome PID: ${chromePid}`);
      }

      this.log(`[headless] Chrome 已启动，页面: ${this.options.remNoteUrl}`);
    } catch (err) {
      this.status = 'crashed';
      this.lastError = err instanceof Error ? err.message : String(err);
      this.log(`[headless] 启动失败: ${this.lastError}`, 'error');
      // 尝试清理
      try { await this.browser?.close(); } catch { /* ignore */ }
      this.browser = null;
      this.page = null;
      throw err;
    }
  }

  /**
   * 关闭 Chrome 和页面。
   */
  async stop(): Promise<void> {
    if (this.autoReloadTimer) {
      clearTimeout(this.autoReloadTimer);
      this.autoReloadTimer = null;
    }

    this.status = 'stopped';
    this.log('[headless] 正在关闭 Chrome...');

    try {
      if (this.page) {
        await this.page.close().catch(() => {});
        this.page = null;
      }
      if (this.browser) {
        await this.browser.close().catch(() => {});
        this.browser = null;
      }
    } catch (err) {
      this.log(`[headless] 关闭时出错: ${err}`, 'warn');
    }

    removeHeadlessPid();
    this.log('[headless] Chrome 已关闭');
  }

  /**
   * 获取诊断信息。
   */
  getDiagnostics(): HeadlessDiagnostics {
    return {
      status: this.status,
      chromeConnected: this.browser !== null && this.browser.connected,
      pageUrl: this.page?.url() ?? null,
      reloadCount: this.reloadCount,
      lastError: this.lastError,
      recentConsoleErrors: [...this.consoleErrors],
    };
  }

  /**
   * 截图当前页面，返回截图文件路径。
   */
  async takeScreenshot(): Promise<string | null> {
    if (!this.page) return null;

    const dir = path.join(os.homedir(), '.remnote-bridge');
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `headless-screenshot-${Date.now()}.png`);

    try {
      await this.page.screenshot({ path: filePath, fullPage: true });
      this.log(`[headless] 截图已保存: ${filePath}`);
      return filePath;
    } catch (err) {
      this.log(`[headless] 截图失败: ${err}`, 'warn');
      return null;
    }
  }

  /**
   * 手动重载页面（重置 reloadCount）。
   */
  async manualReload(): Promise<void> {
    this.log('[headless] 手动重载...');
    this.reloadCount = 0;
    await this.doReload();
  }

  private scheduleAutoReload(): void {
    if (this.reloadCount >= MAX_AUTO_RELOAD) {
      this.status = 'crashed';
      this.lastError = `自动恢复次数已达上限 (${MAX_AUTO_RELOAD})`;
      this.log(`[headless] ${this.lastError}`, 'error');
      return;
    }

    this.autoReloadTimer = setTimeout(async () => {
      this.autoReloadTimer = null;
      try {
        await this.doReload();
      } catch (err) {
        this.log(`[headless] 自动恢复失败: ${err}`, 'error');
      }
    }, AUTO_RELOAD_DELAY_MS);
  }

  private async doReload(): Promise<void> {
    this.status = 'reloading';
    this.reloadCount++;

    try {
      // 如果浏览器已断开，需要重新启动
      if (!this.browser || !this.browser.connected) {
        this.log('[headless] 浏览器已断开，重新启动...', 'warn');
        this.browser = null;
        this.page = null;
        await this.start();
        return;
      }

      // 关闭旧页面，创建新页面
      if (this.page) {
        await this.page.close().catch(() => {});
      }

      this.page = await this.browser.newPage();

      // 重新注册 console 监控
      this.page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = `[${new Date().toISOString()}] ${msg.text()}`;
          this.consoleErrors.push(text);
          if (this.consoleErrors.length > CONSOLE_ERROR_BUFFER_SIZE) {
            this.consoleErrors.shift();
          }
        }
      });

      this.page.on('close', () => {
        if (this.status === 'running') {
          this.log('[headless] 页面意外关闭，将尝试自动恢复', 'warn');
          this.scheduleAutoReload();
        }
      });

      await this.page.goto(this.options.remNoteUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });

      this.status = 'running';
      this.lastError = null;
      this.log(`[headless] 重载完成 (第 ${this.reloadCount} 次)`);
    } catch (err) {
      this.status = 'crashed';
      this.lastError = err instanceof Error ? err.message : String(err);
      this.log(`[headless] 重载失败: ${this.lastError}`, 'error');
      throw err;
    }
  }
}
