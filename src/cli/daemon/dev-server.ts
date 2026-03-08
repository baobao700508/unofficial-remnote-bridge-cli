/**
 * webpack-dev-server 子进程管理
 *
 * 在 remnote-plugin 目录下启动 npm run dev。
 */

import { spawn, execSync, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

export interface DevServerOptions {
  pluginDir: string;
  port: number;
  onLog?: (message: string, level: 'info' | 'warn' | 'error') => void;
  onExit?: (code: number | null) => void;
}

export class DevServerManager {
  private child: ChildProcess | null = null;
  private options: DevServerOptions;

  constructor(options: DevServerOptions) {
    this.options = options;
  }

  /**
   * 启动 webpack-dev-server。
   * 如果 remnote-plugin 目录不存在，抛出错误。
   */
  start(): void {
    const { pluginDir, port, onLog, onExit } = this.options;

    if (!fs.existsSync(path.join(pluginDir, 'package.json'))) {
      throw new Error(`Plugin 目录不存在或缺少 package.json: ${pluginDir}`);
    }

    // 首次使用或依赖不完整时自动安装 plugin 依赖
    // 仅检查 node_modules 目录是否存在不够健壮——目录可能存在但关键依赖缺失
    const nodeModulesDir = path.join(pluginDir, 'node_modules');
    const hasCompleteDeps =
      fs.existsSync(nodeModulesDir) &&
      fs.existsSync(path.join(nodeModulesDir, '.package-lock.json'));
    if (!hasCompleteDeps) {
      onLog?.('[dev-server] remnote-plugin 依赖缺失或不完整，正在安装...', 'info');
      execSync('npm install', { cwd: pluginDir, stdio: 'pipe' });
      onLog?.('[dev-server] 依赖安装完成', 'info');
    }

    // 通过环境变量传递端口
    // shell: true 确保 Windows 上能找到 npm.cmd
    this.child = spawn('npm', ['run', 'dev'], {
      cwd: pluginDir,
      env: { ...process.env, PORT: String(port) },
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
      onLog?.(`webpack-dev-server 退出 (code: ${code})`, code === 0 ? 'info' : 'error');
      this.child = null;
      onExit?.(code);
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
