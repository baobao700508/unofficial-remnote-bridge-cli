/**
 * AI Chat Python 环境管理
 *
 * 职责：
 * 1. 检测系统 Python 3.11+ 可用性
 * 2. 在项目根目录创建 .remnote-bridge-venv 虚拟环境
 * 3. 自动安装 ai-chat/requirements.txt 依赖
 * 4. 提供 venv 内的 python 可执行文件路径
 *
 * 策略：
 * - 首次启用 aiChat 时自动创建 venv + 安装依赖
 * - 后续启动检测 venv 存在性 + requirements.txt 变化（通过 hash 文件）
 * - 依赖变化时自动重新安装
 * - 所有操作均为同步阻塞（在 daemon 启动阶段执行，此时无请求需处理）
 */

import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { execFileSync, execSync } from 'child_process';

export interface AiChatEnvResult {
  pythonPath: string;      // venv 内 python 的绝对路径
  venvDir: string;         // venv 目录
  aiChatDir: string;       // ai-chat/ 源码目录
}

const VENV_DIR_NAME = '.remnote-bridge-venv';
const HASH_FILE_NAME = '.requirements-hash';

/**
 * 在系统 PATH 中查找可用的 Python 3.11+
 */
function findPython3(onLog?: (msg: string, level: 'info' | 'warn' | 'error') => void): string {
  const candidates = ['python3', 'python'];

  for (const cmd of candidates) {
    try {
      const version = execFileSync(cmd, ['--version'], {
        encoding: 'utf-8',
        timeout: 5000,
      }).trim();
      // "Python 3.12.1" → extract major.minor
      const match = version.match(/Python (\d+)\.(\d+)/);
      if (match) {
        const major = parseInt(match[1], 10);
        const minor = parseInt(match[2], 10);
        if (major === 3 && minor >= 11) {
          onLog?.(`找到 ${version} (${cmd})`, 'info');
          return cmd;
        }
        onLog?.(`${cmd} 版本过低: ${version} (需要 3.11+)`, 'warn');
      }
    } catch {
      // 命令不存在，跳过
    }
  }

  throw new Error(
    'Python 3.11+ 未找到。请安装 Python 3.11 或更高版本。\n' +
    '  macOS: brew install python@3.12\n' +
    '  Ubuntu: sudo apt install python3.12\n' +
    '  Windows: https://www.python.org/downloads/'
  );
}

/**
 * 计算 requirements.txt 的 hash，用于检测依赖变化
 */
function computeReqHash(reqPath: string): string {
  const content = fs.readFileSync(reqPath, 'utf-8');
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
}

/**
 * 检查 venv 是否存在且依赖是最新的
 */
function isVenvValid(venvDir: string, reqHash: string): boolean {
  const pythonPath = getVenvPython(venvDir);
  if (!fs.existsSync(pythonPath)) return false;

  const hashPath = path.join(venvDir, HASH_FILE_NAME);
  if (!fs.existsSync(hashPath)) return false;

  const storedHash = fs.readFileSync(hashPath, 'utf-8').trim();
  return storedHash === reqHash;
}

/**
 * 获取 venv 内 python 可执行文件路径
 */
function getVenvPython(venvDir: string): string {
  // Unix: venv/bin/python, Windows: venv/Scripts/python.exe
  const isWindows = process.platform === 'win32';
  return isWindows
    ? path.join(venvDir, 'Scripts', 'python.exe')
    : path.join(venvDir, 'bin', 'python');
}

/**
 * 获取 venv 内 pip 可执行文件路径
 */
function getVenvPip(venvDir: string): string {
  const isWindows = process.platform === 'win32';
  return isWindows
    ? path.join(venvDir, 'Scripts', 'pip.exe')
    : path.join(venvDir, 'bin', 'pip');
}

/**
 * 创建 venv 并安装依赖。
 * 如果 venv 已存在且依赖未变，直接返回。
 *
 * @param projectRoot 项目根目录（venv 将创建在此处）
 * @param packageRoot 包安装根目录（ai-chat/ 在此处）
 * @param onLog 日志回调
 * @returns venv python 路径 + 目录信息
 */
export function ensureAiChatEnv(
  projectRoot: string,
  packageRoot: string,
  onLog?: (msg: string, level: 'info' | 'warn' | 'error') => void,
): AiChatEnvResult {
  const aiChatDir = path.join(packageRoot, 'ai-chat');
  const reqPath = path.join(aiChatDir, 'requirements.txt');
  const venvDir = path.join(projectRoot, VENV_DIR_NAME);

  if (!fs.existsSync(reqPath)) {
    throw new Error(`ai-chat/requirements.txt 未找到: ${reqPath}`);
  }

  const reqHash = computeReqHash(reqPath);

  // 快速路径：venv 存在且依赖一致
  if (isVenvValid(venvDir, reqHash)) {
    onLog?.('AI Chat venv 已就绪（依赖未变）', 'info');
    return {
      pythonPath: getVenvPython(venvDir),
      venvDir,
      aiChatDir,
    };
  }

  // 需要创建或更新 venv
  const python3 = findPython3(onLog);

  // 创建 venv（如果不存在）
  if (!fs.existsSync(venvDir)) {
    onLog?.(`创建 Python venv: ${venvDir}`, 'info');
    execFileSync(python3, ['-m', 'venv', venvDir], {
      timeout: 30_000,
      stdio: 'pipe',
    });
  }

  // 升级 pip（避免旧版 pip 安装问题）
  onLog?.('升级 pip...', 'info');
  const venvPip = getVenvPip(venvDir);
  const venvPython = getVenvPython(venvDir);
  try {
    execFileSync(venvPython, ['-m', 'pip', 'install', '--upgrade', 'pip'], {
      timeout: 60_000,
      stdio: 'pipe',
    });
  } catch {
    onLog?.('pip 升级失败（继续安装依赖）', 'warn');
  }

  // 安装依赖
  onLog?.(`安装 AI Chat 依赖 (${reqPath})...`, 'info');
  try {
    execFileSync(venvPip, ['install', '-r', reqPath], {
      timeout: 120_000,
      stdio: 'pipe',
      cwd: aiChatDir,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`AI Chat 依赖安装失败: ${msg}`);
  }

  // 写入 hash 文件
  fs.writeFileSync(path.join(venvDir, HASH_FILE_NAME), reqHash, 'utf-8');
  onLog?.('AI Chat 依赖安装完成', 'info');

  return {
    pythonPath: venvPython,
    venvDir,
    aiChatDir,
  };
}
