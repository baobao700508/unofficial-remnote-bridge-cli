/**
 * 轻量静态文件服务器
 *
 * 用 Node.js 内置 http 模块 serve remnote-plugin/dist/ 目录。
 * 替代 webpack-dev-server，用于非开发模式（预构建 plugin）。
 */

import http from 'http';
import fs from 'fs';
import path from 'path';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

export interface StaticServerOptions {
  distDir: string;
  port: number;
  onLog?: (message: string, level: 'info' | 'warn' | 'error') => void;
}

export class StaticServer {
  private server: http.Server | null = null;
  private options: StaticServerOptions;

  constructor(options: StaticServerOptions) {
    this.options = options;
  }

  start(): Promise<void> {
    const { distDir, port, onLog } = this.options;

    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        // CORS headers（与 webpack.config.js 一致）
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'baggage, sentry-trace');

        // OPTIONS preflight
        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        const urlPath = req.url?.split('?')[0] || '/';
        const filePath = path.join(distDir, urlPath === '/' ? 'index.html' : urlPath);

        // 防止目录遍历
        if (!filePath.startsWith(distDir)) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }

        fs.readFile(filePath, (err, data) => {
          if (err) {
            res.writeHead(404);
            res.end('Not Found');
            return;
          }
          const ext = path.extname(filePath);
          const contentType = MIME_TYPES[ext] || 'application/octet-stream';
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(data);
        });
      });

      this.server.on('error', (err) => {
        onLog?.(`[static-server] 启动失败: ${err.message}`, 'error');
        reject(err);
      });

      this.server.listen(port, '127.0.0.1', () => {
        onLog?.(`[static-server] 已启动 http://127.0.0.1:${port} (serving ${distDir})`, 'info');
        resolve();
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) {
        resolve();
        return;
      }
      this.server.close(() => {
        this.server = null;
        resolve();
      });
    });
  }

  isRunning(): boolean {
    return this.server !== null && this.server.listening;
  }
}
