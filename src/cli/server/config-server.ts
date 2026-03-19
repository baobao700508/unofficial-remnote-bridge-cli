/**
 * ConfigServer — HTTP 配置管理服务器
 *
 * 绑定 127.0.0.1:<configPort>，提供可视化配置页面。
 * - GET /          — 返回内联 HTML/CSS/JS 配置页面
 * - GET /api/config — 返回当前配置 JSON
 * - POST /api/config — 校验 → saveConfig → 返回成功
 * - POST /api/restart — 调用 onRestart() 回调 → 返回成功
 */

import http from 'http';
import { BridgeConfig, DefaultsConfig, DEFAULT_CONFIG, DEFAULT_DEFAULTS, loadConfig, saveConfig, configFilePath, loadAddonConfig, saveAddonConfig } from '../config.js';

export interface ConfigServerOptions {
  port: number;
  host?: string;
  onRestart: () => Promise<void>;
  onLog?: (message: string, level: 'info' | 'warn' | 'error') => void;
}

export class ConfigServer {
  private server: http.Server | null = null;
  private _actualPort: number = 0;
  private options: ConfigServerOptions;

  /** 实际监听的端口（可能与 options.port 不同，若原端口被占用则 OS 自动分配） */
  get actualPort(): number { return this._actualPort; }

  constructor(options: ConfigServerOptions) {
    this.options = options;
  }

  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    this.options.onLog?.(message, level);
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const host = this.options.host ?? '127.0.0.1';

      const tryListen = (port: number) => {
        this.server = http.createServer((req, res) => this.handleRequest(req, res));

        this.server.on('error', (err: NodeJS.ErrnoException) => {
          if (err.code === 'EADDRINUSE' && port !== 0) {
            this.log(`端口 ${port} 被占用，尝试自动分配...`, 'warn');
            this.server = null;
            tryListen(0);
          } else {
            this.log(`ConfigServer 错误: ${err.message}`, 'error');
            reject(err);
          }
        });

        this.server.listen(port, host, () => {
          this._actualPort = (this.server!.address() as { port: number }).port;
          if (this._actualPort !== this.options.port) {
            this.log(`端口 ${this.options.port} 被占用，ConfigServer 自动分配到 ${this._actualPort}`, 'warn');
          }
          this.log(`ConfigServer 监听 ${host}:${this._actualPort}`);
          resolve();
        });
      };

      tryListen(this.options.port);
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.server = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const url = req.url ?? '/';

    // 安全响应头
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Cache-Control', 'no-store');

    try {
      if (req.method === 'GET' && url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(this.renderPage());
        return;
      }

      if (req.method === 'GET' && url === '/api/config') {
        const config = loadConfig();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(config));
        return;
      }

      if (req.method === 'POST' && url === '/api/config') {
        const body = await readBody(req);
        let parsed: unknown;
        try {
          parsed = JSON.parse(body);
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: '无效的 JSON' }));
          return;
        }

        const validation = validateConfigPayload(parsed);
        if (!validation.ok) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: validation.error }));
          return;
        }
        const newConfig = validation.config;

        // 端口冲突校验
        const ports = [newConfig.wsPort, newConfig.devServerPort, newConfig.configPort];
        if (new Set(ports).size !== ports.length) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'wsPort, devServerPort, configPort 不能重复' }));
          return;
        }

        const filePath = configFilePath();
        saveConfig(filePath, newConfig);
        this.log('配置已保存');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      if (req.method === 'POST' && url === '/api/restart') {
        this.log('收到软重启请求');
        try {
          await this.options.onRestart();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: String(err) }));
        }
        return;
      }

      // Addon 配置读取
      if (req.method === 'GET' && url.startsWith('/api/addon-config')) {
        const params = new URL(url, 'http://localhost').searchParams;
        const name = params.get('name');
        if (!name) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: '缺少 name 参数' }));
          return;
        }
        const addonConfig = loadAddonConfig(name);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, name, config: addonConfig ?? {} }));
        return;
      }

      // Addon 配置保存
      if (req.method === 'POST' && url === '/api/addon-config') {
        const body = await readBody(req);
        let parsed: unknown;
        try {
          parsed = JSON.parse(body);
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: '无效的 JSON' }));
          return;
        }
        const payload = parsed as Record<string, unknown>;
        if (!payload.name || typeof payload.name !== 'string' || typeof payload.config !== 'object' || !payload.config) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: '需要 name (string) 和 config (object) 字段' }));
          return;
        }
        saveAddonConfig(payload.name, payload.config as Record<string, unknown>);
        this.log(`addon ${payload.name} 配置已保存`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    } catch (err) {
      this.log(`请求处理错误: ${err}`, 'error');
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: String(err) }));
    }
  }

  private renderPage(): string {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>RemNote Bridge 配置</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; background: #f5f5f5; color: #333; }
  .container { max-width: 720px; margin: 40px auto; padding: 0 20px; }
  h1 { font-size: 24px; margin-bottom: 8px; }
  .subtitle { color: #666; margin-bottom: 24px; font-size: 14px; }
  .card { background: #fff; border-radius: 8px; padding: 24px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
  .card h2 { font-size: 16px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
  .field { display: flex; align-items: center; margin-bottom: 12px; }
  .field:last-child { margin-bottom: 0; }
  .field label { flex: 0 0 240px; font-size: 13px; color: #555; }
  .field input, .field select { flex: 1; padding: 6px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; }
  .field input:focus, .field select:focus { outline: none; border-color: #4a9eff; box-shadow: 0 0 0 2px rgba(74,158,255,.2); }
  .field .hint { font-size: 11px; color: #999; margin-left: 8px; white-space: nowrap; }
  .actions { display: flex; gap: 12px; margin-top: 24px; }
  button { padding: 8px 20px; border-radius: 6px; font-size: 14px; cursor: pointer; border: 1px solid #ddd; background: #fff; }
  button.primary { background: #4a9eff; color: #fff; border-color: #4a9eff; }
  button.primary:hover { background: #3a8eef; }
  button:hover { background: #f9f9f9; }
  .toast { position: fixed; top: 20px; right: 20px; padding: 12px 20px; border-radius: 6px; font-size: 14px; color: #fff; opacity: 0; transition: opacity .3s; z-index: 100; }
  .toast.success { background: #22c55e; }
  .toast.error { background: #ef4444; }
  .toast.show { opacity: 1; }
  .warning { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 12px; margin-bottom: 16px; font-size: 12px; color: #92400e; }
</style>
</head>
<body>
<div class="container">
  <h1>RemNote Bridge 配置</h1>
  <p class="subtitle">修改后需保存并重启才能生效</p>

  <div class="card">
    <h2>服务端口</h2>
    <div class="field">
      <label>WebSocket 端口 (wsPort)</label>
      <input type="number" id="wsPort" min="1" max="65535">
    </div>
    <div class="field">
      <label>Dev Server 端口 (devServerPort)</label>
      <input type="number" id="devServerPort" min="1" max="65535">
    </div>
    <div class="field">
      <label>配置页端口 (configPort)</label>
      <input type="number" id="configPort" min="1" max="65535">
      <span class="hint">变更需 disconnect→connect</span>
    </div>
    <div class="field">
      <label>守护进程超时 (分钟)</label>
      <input type="number" id="daemonTimeoutMinutes" min="1">
    </div>
  </div>

  <div class="card">
    <h2>共享默认值</h2>
    <div class="field">
      <label>最大节点数 (maxNodes)</label>
      <input type="number" id="maxNodes" min="1">
    </div>
    <div class="field">
      <label>最大同级数 (maxSiblings)</label>
      <input type="number" id="maxSiblings" min="1">
    </div>
    <div class="field">
      <label>缓存上限 (cacheMaxSize)</label>
      <input type="number" id="cacheMaxSize" min="1">
    </div>
  </div>

  <div class="card">
    <h2>read-tree 默认值</h2>
    <div class="field">
      <label>展开深度 (readTreeDepth)</label>
      <input type="number" id="readTreeDepth" min="-1">
      <span class="hint">-1 = 全部展开</span>
    </div>
    <div class="field">
      <label>祖先链层数 (readTreeAncestorLevels)</label>
      <input type="number" id="readTreeAncestorLevels" min="0">
    </div>
    <div class="field">
      <label>包含 Powerup (readTreeIncludePowerup)</label>
      <select id="readTreeIncludePowerup">
        <option value="false">否</option>
        <option value="true">是</option>
      </select>
    </div>
  </div>

  <div class="card">
    <h2>read-globe 默认值</h2>
    <div class="field">
      <label>展开深度 (readGlobeDepth)</label>
      <input type="number" id="readGlobeDepth" min="-1">
      <span class="hint">-1 = 全部展开</span>
    </div>
  </div>

  <div class="card">
    <h2>read-context 默认值</h2>
    <div class="field">
      <label>模式 (readContextMode)</label>
      <select id="readContextMode">
        <option value="page">page</option>
        <option value="focus">focus</option>
      </select>
    </div>
    <div class="field">
      <label>祖先链层数 (readContextAncestorLevels)</label>
      <input type="number" id="readContextAncestorLevels" min="0">
    </div>
    <div class="field">
      <label>展开深度 (readContextDepth)</label>
      <input type="number" id="readContextDepth" min="-1">
    </div>
  </div>

  <div class="card">
    <h2>search 默认值</h2>
    <div class="field">
      <label>结果数量 (searchNumResults)</label>
      <input type="number" id="searchNumResults" min="1">
    </div>
  </div>

  <div class="actions">
    <button class="primary" onclick="saveConfig()">保存配置</button>
    <button onclick="resetDefaults()">恢复默认值</button>
  </div>

  <h1 style="margin-top:40px;">增强项目配置</h1>
  <p class="subtitle">配置存储于 ~/.remnote-bridge/addons/&lt;name&gt;/config.json</p>

  <div class="card">
    <h2>remnote-rag（语义搜索增强）</h2>
    <h3 style="font-size:14px;margin-bottom:12px;color:#555;">Embedding 配置</h3>
    <div class="field">
      <label>API Key</label>
      <input type="password" id="rag-embedding-api-key">
    </div>
    <div class="field">
      <label>API Key 环境变量名</label>
      <input type="text" id="rag-embedding-api-key-env" placeholder="留空则使用上方 api_key">
    </div>
    <div class="field">
      <label>Base URL</label>
      <input type="text" id="rag-embedding-base-url">
    </div>
    <div class="field">
      <label>Model</label>
      <input type="text" id="rag-embedding-model">
    </div>
    <div class="field">
      <label>Dimensions</label>
      <input type="number" id="rag-embedding-dimensions" min="1">
    </div>

    <h3 style="font-size:14px;margin:16px 0 12px;color:#555;">Reranker 配置</h3>
    <div class="field">
      <label>启用 Reranker</label>
      <select id="rag-reranker-enabled">
        <option value="true">是</option>
        <option value="false">否</option>
      </select>
    </div>
    <div class="field">
      <label>API Key</label>
      <input type="password" id="rag-reranker-api-key">
    </div>
    <div class="field">
      <label>API Key 环境变量名</label>
      <input type="text" id="rag-reranker-api-key-env" placeholder="留空则使用 Embedding API Key">
    </div>
    <div class="field">
      <label>Base URL</label>
      <input type="text" id="rag-reranker-base-url">
    </div>
    <div class="field">
      <label>Model</label>
      <input type="text" id="rag-reranker-model">
    </div>
    <div class="field">
      <label>Top-K 倍数</label>
      <input type="number" id="rag-reranker-top-k-multiplier" min="1">
    </div>

    <h3 style="font-size:14px;margin:16px 0 12px;color:#555;">通用配置</h3>
    <div class="field">
      <label>最小文本长度 (min_text_length)</label>
      <input type="number" id="rag-min-text-length" min="1">
    </div>
    <div class="field">
      <label>批量大小 (batch_size)</label>
      <input type="number" id="rag-batch-size" min="1">
    </div>

    <div class="actions" style="margin-top:16px;">
      <button class="primary" onclick="saveAddonConfigUI()">保存 addon 配置</button>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
const DEFAULTS = ${JSON.stringify({ ...DEFAULT_CONFIG, defaults: { ...DEFAULT_DEFAULTS } })};

const TOP_FIELDS = ['wsPort', 'devServerPort', 'configPort', 'daemonTimeoutMinutes'];
const DEFAULTS_FIELDS = [
  'maxNodes', 'maxSiblings', 'cacheMaxSize',
  'readTreeDepth', 'readTreeAncestorLevels', 'readTreeIncludePowerup',
  'readGlobeDepth',
  'readContextMode', 'readContextAncestorLevels', 'readContextDepth',
  'searchNumResults'
];

function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 3000);
}

function fillForm(config) {
  TOP_FIELDS.forEach(k => {
    document.getElementById(k).value = config[k];
  });
  DEFAULTS_FIELDS.forEach(k => {
    const el = document.getElementById(k);
    const val = config.defaults[k];
    if (el.tagName === 'SELECT') {
      el.value = String(val);
    } else {
      el.value = val;
    }
  });
}

function readForm() {
  const config = { defaults: {} };
  TOP_FIELDS.forEach(k => {
    config[k] = Number(document.getElementById(k).value);
  });
  DEFAULTS_FIELDS.forEach(k => {
    const el = document.getElementById(k);
    if (k === 'readTreeIncludePowerup') {
      config.defaults[k] = el.value === 'true';
    } else if (k === 'readContextMode') {
      config.defaults[k] = el.value;
    } else {
      config.defaults[k] = Number(el.value);
    }
  });
  return config;
}

async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    const config = await res.json();
    fillForm(config);
  } catch (e) {
    showToast('加载配置失败: ' + e, 'error');
  }
}

async function saveConfig() {
  const config = readForm();
  // 端口冲突校验
  const ports = [config.wsPort, config.devServerPort, config.configPort];
  if (new Set(ports).size !== ports.length) {
    showToast('端口不能重复', 'error');
    return;
  }

  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    const result = await res.json();
    if (!result.ok) {
      showToast('保存失败: ' + result.error, 'error');
      return;
    }
    showToast('配置已保存', 'success');

    // 弹出确认框
    if (confirm('配置已保存。是否立即重启以应用配置？\\n\\n注意：如果修改了 configPort，当前页面将无法访问新端口。需要 disconnect→connect 重新启动。')) {
      try {
        const rr = await fetch('/api/restart', { method: 'POST' });
        const rrResult = await rr.json();
        if (rrResult.ok) {
          showToast('软重启成功', 'success');
          // 重新加载配置显示
          setTimeout(loadConfig, 1000);
        } else {
          showToast('重启失败: ' + rrResult.error, 'error');
        }
      } catch (e) {
        showToast('重启请求失败: ' + e, 'error');
      }
    }
  } catch (e) {
    showToast('保存请求失败: ' + e, 'error');
  }
}

function resetDefaults() {
  if (confirm('确定要恢复所有配置为默认值吗？')) {
    fillForm(DEFAULTS);
  }
}

// ── Addon 配置 ──

const RAG_FIELD_MAP = {
  'rag-embedding-api-key': ['embedding', 'api_key'],
  'rag-embedding-api-key-env': ['embedding', 'api_key_env'],
  'rag-embedding-base-url': ['embedding', 'base_url'],
  'rag-embedding-model': ['embedding', 'model'],
  'rag-embedding-dimensions': ['embedding', 'dimensions'],
  'rag-reranker-enabled': ['reranker', 'enabled'],
  'rag-reranker-api-key': ['reranker', 'api_key'],
  'rag-reranker-api-key-env': ['reranker', 'api_key_env'],
  'rag-reranker-base-url': ['reranker', 'base_url'],
  'rag-reranker-model': ['reranker', 'model'],
  'rag-reranker-top-k-multiplier': ['reranker', 'top_k_multiplier'],
  'rag-min-text-length': [null, 'min_text_length'],
  'rag-batch-size': [null, 'batch_size'],
};

function fillAddonForm(config) {
  for (const [elId, path] of Object.entries(RAG_FIELD_MAP)) {
    const el = document.getElementById(elId);
    if (!el) continue;
    const val = path[0] ? (config[path[0]] || {})[path[1]] : config[path[1]];
    if (val !== undefined && val !== null) {
      el.value = el.tagName === 'SELECT' ? String(val) : val;
    }
  }
}

function readAddonForm() {
  const config = { embedding: {}, reranker: {} };
  for (const [elId, path] of Object.entries(RAG_FIELD_MAP)) {
    const el = document.getElementById(elId);
    if (!el) continue;
    let val = el.value;
    if (elId.includes('dimensions') || elId.includes('multiplier') || elId.includes('text-length') || elId.includes('batch-size')) {
      val = Number(val);
    } else if (elId.includes('enabled')) {
      val = val === 'true';
    }
    if (path[0]) {
      config[path[0]][path[1]] = val;
    } else {
      config[path[1]] = val;
    }
  }
  return config;
}

async function loadAddonConfigUI() {
  try {
    const res = await fetch('/api/addon-config?name=remnote-rag');
    const data = await res.json();
    if (data.ok) fillAddonForm(data.config);
  } catch (e) { /* addon 可能未配置 */ }
}

async function saveAddonConfigUI() {
  const config = readAddonForm();
  try {
    const res = await fetch('/api/addon-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'remnote-rag', config }),
    });
    const result = await res.json();
    if (result.ok) showToast('addon 配置已保存', 'success');
    else showToast('保存失败: ' + result.error, 'error');
  } catch (e) {
    showToast('保存请求失败: ' + e, 'error');
  }
}

loadConfig();
loadAddonConfigUI();
</script>
</body>
</html>`;
  }
}

const MAX_BODY_SIZE = 1024 * 1024; // 1 MB

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalSize = 0;
    req.on('data', (chunk: Buffer) => {
      totalSize += chunk.length;
      if (totalSize > MAX_BODY_SIZE) {
        req.destroy();
        reject(new Error('请求体超过大小限制 (1 MB)'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

function isValidPort(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 65535;
}

function validateConfigPayload(raw: unknown): { ok: true; config: BridgeConfig } | { ok: false; error: string } {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, error: '配置必须是对象' };
  }
  const obj = raw as Record<string, unknown>;

  if (!isValidPort(obj.wsPort)) return { ok: false, error: 'wsPort 必须为有效端口号 (1-65535)' };
  if (!isValidPort(obj.devServerPort)) return { ok: false, error: 'devServerPort 必须为有效端口号 (1-65535)' };
  if (!isValidPort(obj.configPort)) return { ok: false, error: 'configPort 必须为有效端口号 (1-65535)' };
  if (typeof obj.daemonTimeoutMinutes !== 'number' || obj.daemonTimeoutMinutes <= 0) {
    return { ok: false, error: 'daemonTimeoutMinutes 必须为正数' };
  }

  if (obj.defaults !== undefined) {
    if (typeof obj.defaults !== 'object' || obj.defaults === null || Array.isArray(obj.defaults)) {
      return { ok: false, error: 'defaults 必须是对象' };
    }
  }

  return {
    ok: true,
    config: {
      wsPort: obj.wsPort as number,
      devServerPort: obj.devServerPort as number,
      configPort: obj.configPort as number,
      daemonTimeoutMinutes: obj.daemonTimeoutMinutes as number,
      defaults: obj.defaults
        ? { ...DEFAULT_DEFAULTS, ...(obj.defaults as Partial<DefaultsConfig>) }
        : { ...DEFAULT_DEFAULTS },
      addons: obj.addons as BridgeConfig['addons'],  // 仅保留 enabled 状态
    },
  };
}
