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

/** StaticServer 和 DevServerManager 的共享接口 */
export interface PluginServer {
  start(): void | Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;
}

export interface DiscoveryData {
  wsPort: number;
  configPort: number;
  instance: string;
  slotIndex: number;
}

export interface StaticServerOptions {
  distDir: string;
  port: number;
  onLog?: (message: string, level: 'info' | 'warn' | 'error') => void;
}

export class StaticServer implements PluginServer {
  private server: http.Server | null = null;
  private _actualPort: number = 0;
  private options: StaticServerOptions;
  private _discovery: DiscoveryData | null = null;

  /** 实际监听的端口（可能与 options.port 不同，若原端口被占用则 OS 自动分配） */
  get actualPort(): number { return this._actualPort; }

  constructor(options: StaticServerOptions) {
    this.options = options;
  }

  /** 动态更新 discovery 数据（daemon 启动后设置实际端口） */
  setDiscovery(data: DiscoveryData): void {
    this._discovery = data;
  }

  start(): Promise<void> {
    const { distDir, port, onLog } = this.options;

    const createHttpServer = () => http.createServer((req, res) => {
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

      // /api/discovery 端点：返回 daemon 端口信息，供 Plugin 自动发现
      if (urlPath === '/api/discovery') {
        if (this._discovery) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(this._discovery));
        } else {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'discovery not ready' }));
        }
        return;
      }

      // 多实例支持：非 default 实例动态修改 manifest.json 的 id 和 name，
      // 使 RemNote 能同时加载多个同源 Plugin（RemNote 按 id 去重）
      if (urlPath === '/manifest.json' && this._discovery && this._discovery.instance !== 'default') {
        const manifestPath = path.resolve(distDir, 'manifest.json');
        fs.readFile(manifestPath, 'utf-8', (err, raw) => {
          if (err) {
            res.writeHead(404);
            res.end('Not Found');
            return;
          }
          try {
            const manifest = JSON.parse(raw);
            const suffix = this._discovery!.instance;
            manifest.id = `${manifest.id}_${suffix}`;
            manifest.name = `${manifest.name} (${suffix})`;
            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            });
            res.end(JSON.stringify(manifest, null, 2));
          } catch {
            res.writeHead(500);
            res.end('manifest parse error');
          }
        });
        return;
      }

      const filePath = path.resolve(distDir, urlPath === '/' ? 'index.html' : '.' + urlPath);

      // 防止目录遍历（resolve 规范化后，确保仍在 distDir + sep 下）
      const safePrefix = distDir.endsWith(path.sep) ? distDir : distDir + path.sep;
      if (!filePath.startsWith(safePrefix) && filePath !== distDir) {
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
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        });
        res.end(data);
      });
    });

    return new Promise((resolve, reject) => {
      const tryListen = (listenPort: number) => {
        this.server = createHttpServer();

        this.server.on('error', (err: NodeJS.ErrnoException) => {
          if (err.code === 'EADDRINUSE' && listenPort !== 0) {
            onLog?.(`[static-server] 端口 ${listenPort} 被占用，尝试自动分配...`, 'warn');
            this.server = null;
            tryListen(0);
          } else {
            onLog?.(`[static-server] 启动失败: ${err.message}`, 'error');
            reject(err);
          }
        });

        this.server.listen(listenPort, '127.0.0.1', () => {
          this._actualPort = (this.server!.address() as { port: number }).port;
          if (this._actualPort !== port) {
            onLog?.(`[static-server] 端口 ${port} 被占用，自动分配到 ${this._actualPort}`, 'warn');
          }
          onLog?.(`[static-server] 已启动 http://127.0.0.1:${this._actualPort} (serving ${distDir})`, 'info');
          resolve();
        });
      };

      tryListen(port);
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
