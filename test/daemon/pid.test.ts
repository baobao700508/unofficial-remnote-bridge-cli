import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { writePid, readPidInfo, removePid, isProcessAlive, isDaemonAlive } from '../../src/cli/daemon/pid.js';
import type { PidInfo } from '../../src/cli/daemon/pid.js';

describe('PID 文件管理', () => {
  let tmpDir: string;
  let pidPath: string;

  const samplePidInfo: PidInfo = {
    pid: 12345,
    slotIndex: 0,
    instance: 'test-instance',
    wsPort: 29100,
    devServerPort: 29101,
    configPort: 29102,
  };

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'remnote-pid-test-'));
    pidPath = path.join(tmpDir, '0.pid');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('writePid / readPidInfo', () => {
    it('写入并读取 PID 信息（JSON 格式）', () => {
      writePid(pidPath, samplePidInfo);
      const info = readPidInfo(pidPath);
      expect(info).not.toBeNull();
      expect(info!.pid).toBe(12345);
      expect(info!.slotIndex).toBe(0);
      expect(info!.instance).toBe('test-instance');
      expect(info!.wsPort).toBe(29100);
      expect(info!.devServerPort).toBe(29101);
      expect(info!.configPort).toBe(29102);
    });

    it('文件不存在时返回 null', () => {
      expect(readPidInfo(pidPath)).toBeNull();
    });

    it('文件内容不是合法 JSON 时返回 null', () => {
      fs.writeFileSync(pidPath, 'not-valid-json');
      expect(readPidInfo(pidPath)).toBeNull();
    });

    it('JSON 缺少必要字段时返回 null', () => {
      fs.writeFileSync(pidPath, JSON.stringify({ foo: 'bar' }));
      expect(readPidInfo(pidPath)).toBeNull();
    });
  });

  describe('removePid', () => {
    it('删除 PID 文件', () => {
      writePid(pidPath, samplePidInfo);
      removePid(pidPath);
      expect(fs.existsSync(pidPath)).toBe(false);
    });

    it('文件不存在时不报错', () => {
      expect(() => removePid(pidPath)).not.toThrow();
    });
  });

  describe('isProcessAlive', () => {
    it('当前进程是存活的', () => {
      expect(isProcessAlive(process.pid)).toBe(true);
    });

    it('不存在的 PID 返回 false', () => {
      expect(isProcessAlive(999999)).toBe(false);
    });
  });

  describe('isDaemonAlive', () => {
    it('不存在的 PID 返回 false', () => {
      expect(isDaemonAlive(999999)).toBe(false);
    });

    it('非 daemon 进程返回 false（PID recycling 防护）', () => {
      // PID 1 (launchd/init) 存活但不是 daemon
      expect(isDaemonAlive(1)).toBe(false);
    });
  });
});
