import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { writePid, readPid, removePid, isProcessAlive, checkDaemon } from '../../src/daemon/pid';

describe('PID 文件管理', () => {
  let tmpDir: string;
  let pidPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'remnote-pid-test-'));
    pidPath = path.join(tmpDir, '.remnote-bridge.pid');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('writePid / readPid', () => {
    it('写入并读取 PID', () => {
      writePid(pidPath, 12345);
      expect(readPid(pidPath)).toBe(12345);
    });

    it('文件不存在时返回 null', () => {
      expect(readPid(pidPath)).toBeNull();
    });

    it('文件内容无效时返回 null', () => {
      fs.writeFileSync(pidPath, 'not-a-number');
      expect(readPid(pidPath)).toBeNull();
    });
  });

  describe('removePid', () => {
    it('删除 PID 文件', () => {
      writePid(pidPath, 12345);
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
      // 使用一个极大的 PID，极不可能存在
      expect(isProcessAlive(999999)).toBe(false);
    });
  });

  describe('checkDaemon', () => {
    it('无 PID 文件时返回 not running', () => {
      const result = checkDaemon(pidPath);
      expect(result.running).toBe(false);
    });

    it('PID 文件指向存活进程时返回 running', () => {
      writePid(pidPath, process.pid);
      const result = checkDaemon(pidPath);
      expect(result.running).toBe(true);
      if (result.running) {
        expect(result.pid).toBe(process.pid);
      }
    });

    it('stale PID 文件时清理并返回 not running', () => {
      writePid(pidPath, 999999);
      const result = checkDaemon(pidPath);
      expect(result.running).toBe(false);
      // PID 文件应已被清理
      expect(fs.existsSync(pidPath)).toBe(false);
    });
  });
});
