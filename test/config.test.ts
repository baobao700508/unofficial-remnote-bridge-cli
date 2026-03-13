import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { loadConfig, saveConfig, configFilePath, DEFAULT_CONFIG, DEFAULT_DEFAULTS } from '../src/cli/config.js';

describe('loadConfig', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'remnote-config-test-'));
    fs.mkdirSync(path.join(tmpDir, 'instances'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('配置文件不存在时返回默认值', () => {
    const config = loadConfig(tmpDir);
    expect(config.daemonTimeoutMinutes).toBe(DEFAULT_CONFIG.daemonTimeoutMinutes);
    expect(config.defaults).toEqual(DEFAULT_DEFAULTS);
  });

  it('读取全局配置文件并合并默认值', () => {
    const configPath = path.join(tmpDir, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({ daemonTimeoutMinutes: 60 }));

    const config = loadConfig(tmpDir);
    expect(config.daemonTimeoutMinutes).toBe(60);
    expect(config.defaults).toEqual(DEFAULT_DEFAULTS);
  });

  it('配置文件损坏时返回默认值', () => {
    const configPath = path.join(tmpDir, 'config.json');
    fs.writeFileSync(configPath, 'invalid json{{{');

    const config = loadConfig(tmpDir);
    expect(config.daemonTimeoutMinutes).toBe(DEFAULT_CONFIG.daemonTimeoutMinutes);
  });

  it('端口字段始终使用默认值（由 slots.json 管理）', () => {
    const configPath = path.join(tmpDir, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({ wsPort: 9999, devServerPort: 9090 }));

    const config = loadConfig(tmpDir);
    expect(config.wsPort).toBe(DEFAULT_CONFIG.wsPort);
    expect(config.devServerPort).toBe(DEFAULT_CONFIG.devServerPort);
  });
});

describe('saveConfig', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'remnote-config-test-'));
    fs.mkdirSync(path.join(tmpDir, 'instances'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('保存配置时去掉端口字段', () => {
    const configPath = path.join(tmpDir, 'config.json');
    saveConfig(configPath, {
      wsPort: 29100,
      devServerPort: 29101,
      configPort: 29102,
      daemonTimeoutMinutes: 45,
      defaults: { ...DEFAULT_DEFAULTS },
    });

    const saved = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    expect(saved.wsPort).toBeUndefined();
    expect(saved.devServerPort).toBeUndefined();
    expect(saved.configPort).toBeUndefined();
    expect(saved.daemonTimeoutMinutes).toBe(45);
    expect(saved.defaults).toBeDefined();
  });
});

describe('configFilePath', () => {
  it('返回全局配置文件路径', () => {
    const filePath = configFilePath();
    expect(filePath).toContain('config.json');
  });

  it('传入自定义目录时返回自定义路径', () => {
    const filePath = configFilePath('/tmp/custom-dir');
    expect(filePath).toBe('/tmp/custom-dir/config.json');
  });
});
