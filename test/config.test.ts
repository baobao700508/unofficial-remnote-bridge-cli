import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { loadConfig, DEFAULT_CONFIG, pidFilePath, logFilePath } from '../src/cli/config.js';

describe('loadConfig', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'remnote-test-'));
    // 创建 package.json 使 tmpDir 成为"项目根目录"
    fs.writeFileSync(path.join(tmpDir, 'package.json'), '{}');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('配置文件不存在时返回默认值', () => {
    const config = loadConfig(tmpDir);
    expect(config).toEqual(DEFAULT_CONFIG);
  });

  it('读取配置文件并合并默认值', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.remnote-bridge.json'),
      JSON.stringify({ wsPort: 4000 })
    );
    const config = loadConfig(tmpDir);
    expect(config.wsPort).toBe(4000);
    expect(config.devServerPort).toBe(DEFAULT_CONFIG.devServerPort);
    expect(config.daemonTimeoutMinutes).toBe(DEFAULT_CONFIG.daemonTimeoutMinutes);
  });

  it('完整配置文件', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.remnote-bridge.json'),
      JSON.stringify({ wsPort: 5000, devServerPort: 9090, daemonTimeoutMinutes: 60 })
    );
    const config = loadConfig(tmpDir);
    expect(config).toEqual({ wsPort: 5000, devServerPort: 9090, daemonTimeoutMinutes: 60 });
  });

  it('配置文件损坏时返回默认值', () => {
    fs.writeFileSync(path.join(tmpDir, '.remnote-bridge.json'), 'invalid json{{{');
    const config = loadConfig(tmpDir);
    expect(config).toEqual(DEFAULT_CONFIG);
  });

  it('配置值类型错误时使用默认值', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.remnote-bridge.json'),
      JSON.stringify({ wsPort: 'not-a-number', devServerPort: 9090 })
    );
    const config = loadConfig(tmpDir);
    expect(config.wsPort).toBe(DEFAULT_CONFIG.wsPort);
    expect(config.devServerPort).toBe(9090);
  });
});

describe('pidFilePath / logFilePath', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'remnote-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('返回正确的 PID 文件路径', () => {
    expect(pidFilePath(tmpDir)).toBe(path.join(tmpDir, '.remnote-bridge.pid'));
  });

  it('返回正确的日志文件路径', () => {
    expect(logFilePath(tmpDir)).toBe(path.join(tmpDir, '.remnote-bridge.log'));
  });
});
