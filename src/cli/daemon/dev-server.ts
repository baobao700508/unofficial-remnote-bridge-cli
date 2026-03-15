/**
 * webpack-dev-server 子进程管理
 *
 * 在 remnote-plugin 目录下启动 npm run dev。
 * 具备崩溃重试和依赖自动修复能力。
 */

import { spawn, execSync, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import type { PluginServer } from './static-server.js';

export interface DevServerOptions {
  pluginDir: string;
  port: number;
  onLog?: (message: string, level: 'info' | 'warn' | 'error') => void;
  onExit?: (code: number | null) => void;
  maxRetries?: number;
}

export class DevServerManager implements PluginServer {
  private child: ChildProcess | null = null;
  private options: DevServerOptions;
  private retryCount = 0;
  private maxRetries: number;
  private stopping = false;

  constructor(options: DevServerOptions) {
    this.options = options;
    this.maxRetries = options.maxRetries ?? 2;
  }

  /**
   * 启动 webpack-dev-server。
   * 如果 remnote-plugin 目录不存在，抛出错误。
   */
  start(): void {
    const { pluginDir, port, onLog } = this.options;

    if (!fs.existsSync(path.join(pluginDir, 'package.json'))) {
      throw new Error(`Plugin 目录不存在或缺少 package.json: ${pluginDir}`);
    }

    this.ensureDependencies(false);
    this.spawnDevServer();
  }

  /**
   * 确保依赖完整。
   * @param cleanInstall true = 删除 node_modules 后重装（修复损坏）
   */
  private ensureDependencies(cleanInstall: boolean): void {
    const { pluginDir, onLog } = this.options;
    const nodeModulesDir = path.join(pluginDir, 'node_modules');
    const hasCompleteDeps =
      fs.existsSync(nodeModulesDir) &&
      fs.existsSync(path.join(nodeModulesDir, '.package-lock.json'));

    if (cleanInstall && fs.existsSync(nodeModulesDir)) {
      onLog?.('[dev-server] 检测到依赖损坏，正在清洁重装...', 'warn');
      // 删除 node_modules 和 package-lock.json 以彻底修复
      fs.rmSync(nodeModulesDir, { recursive: true, force: true });
      const lockFile = path.join(pluginDir, 'package-lock.json');
      if (fs.existsSync(lockFile)) {
        fs.unlinkSync(lockFile);
      }
    }

    if (cleanInstall || !hasCompleteDeps) {
      onLog?.('[dev-server] remnote-plugin 依赖缺失或不完整，正在安装...', 'info');
      execSync('npm install', { cwd: pluginDir, stdio: 'pipe' });
      onLog?.('[dev-server] 依赖安装完成', 'info');
    }
  }

  /**
   * 启动 dev-server 子进程并挂载事件监听。
   */
  private spawnDevServer(): void {
    const { pluginDir, port, onLog, onExit } = this.options;

    // shell: true 确保 Windows 上能找到 npm.cmd
    this.child = spawn('npm', ['run', 'dev'], {
      cwd: pluginDir,
      env: {
        ...process.env,
        PORT: String(port),
        // 供 webpack devServer.setupMiddlewares 劫持 /api/discovery
        DISCOVERY_WS_PORT: process.env.SLOT_WS_PORT ?? '',
        DISCOVERY_CONFIG_PORT: process.env.SLOT_CONFIG_PORT ?? '',
        DISCOVERY_INSTANCE: process.env.REMNOTE_BRIDGE_INSTANCE ?? '',
        DISCOVERY_SLOT_INDEX: process.env.SLOT_INDEX ?? '',
      },
      stdio: 'pipe',
      shell: true,
    });

    this.child.stdout?.on('data', (data) => {
      onLog?.(`[dev-server] ${data.toString().trim()}`, 'info');
    });

    this.child.stderr?.on('data', (data) => {
      onLog?.(`[dev-server] ${data.toString().trim()}`, 'warn');
    });

    this.child.on('exit', (code) => {
      this.child = null;

      // 正常退出或正在停止中，不重试
      if (code === 0 || this.stopping) {
        onLog?.(`webpack-dev-server 退出 (code: ${code})`, 'info');
        onExit?.(code);
        return;
      }

      onLog?.(`webpack-dev-server 异常退出 (code: ${code})`, 'error');

      // 尝试重试
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        const isCleanRetry = this.retryCount === 1;
        onLog?.(
          `[dev-server] 第 ${this.retryCount}/${this.maxRetries} 次重试` +
          (isCleanRetry ? '（清洁重装依赖）' : '') + '...',
          'warn',
        );

        try {
          // 第一次重试：清洁重装依赖（修复损坏的 node_modules）
          // 后续重试：直接重启
          this.ensureDependencies(isCleanRetry);
          this.spawnDevServer();
        } catch (err) {
          onLog?.(`[dev-server] 重试失败: ${(err as Error).message}`, 'error');
          onExit?.(code);
        }
      } else {
        onLog?.(`[dev-server] 已达最大重试次数 (${this.maxRetries})，放弃`, 'error');
        onExit?.(code);
      }
    });

    this.child.on('error', (err) => {
      onLog?.(`webpack-dev-server 启动失败: ${err.message}`, 'error');
      this.child = null;
      onExit?.(1);
    });
  }

  /**
   * 停止 webpack-dev-server。
   */
  stop(): Promise<void> {
    this.stopping = true;
    return new Promise((resolve) => {
      if (!this.child) {
        resolve();
        return;
      }

      // 5 秒后强制 kill
      const forceKillTimer = setTimeout(() => {
        if (this.child) {
          this.child.kill('SIGKILL');
          this.child = null;
          resolve();
        }
      }, 5000);

      this.child.on('exit', () => {
        clearTimeout(forceKillTimer);
        this.child = null;
        resolve();
      });

      this.child.kill('SIGTERM');
    });
  }

  isRunning(): boolean {
    return this.child !== null && !this.child.killed;
  }
}
