/**
 * 多实例注册表
 *
 * 管理最多 4 个 daemon 实例的端口槽位分配。
 * 所有运行时文件存放在 ~/.remnote-bridge/：
 *   config.json    — 全局配置
 *   slots.json     — 4 组端口定义
 *   registry.json  — instance → slot 映射
 *   instances/N.pid — 槽位 PID 文件（JSON）
 *   instances/N.log — 槽位日志
 */

import fs from 'fs';
import path from 'path';
import { isDaemonAlive } from './pid.js';
import { GLOBAL_DIR, ensureGlobalDir } from '../config.js';

// ── 常量 ──

export const MAX_SLOTS = 4;

const SLOTS_FILE = path.join(GLOBAL_DIR, 'slots.json');
const REGISTRY_FILE = path.join(GLOBAL_DIR, 'registry.json');
const INSTANCES_DIR = path.join(GLOBAL_DIR, 'instances');

export interface SlotPorts {
  wsPort: number;
  devServerPort: number;
  configPort: number;
}

/** 默认 4 组端口槽位（29100 段，高位端口避免冲突） */
export const DEFAULT_SLOTS: readonly SlotPorts[] = [
  { wsPort: 29100, devServerPort: 29101, configPort: 29102 },
  { wsPort: 29110, devServerPort: 29111, configPort: 29112 },
  { wsPort: 29120, devServerPort: 29121, configPort: 29122 },
  { wsPort: 29130, devServerPort: 29131, configPort: 29132 },
];

export interface RegistryEntry {
  index: number;
  instance: string;
  pid: number;
  wsPort: number;
  devServerPort: number;
  configPort: number;
  startedAt: string;
}

export interface Registry {
  version: number;
  slots: (RegistryEntry | null)[];
}

// ── slots.json ──

export function loadSlots(): SlotPorts[] {
  try {
    const raw = fs.readFileSync(SLOTS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === MAX_SLOTS) {
      return parsed;
    }
  } catch {
    // 不存在或损坏
  }
  // 自动生成默认
  ensureGlobalDir();
  const slots = [...DEFAULT_SLOTS];
  fs.writeFileSync(SLOTS_FILE, JSON.stringify(slots, null, 2) + '\n', 'utf-8');
  return slots;
}

// ── registry.json ──

export function loadRegistry(): Registry {
  try {
    const raw = fs.readFileSync(REGISTRY_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && parsed.version === 1 && Array.isArray(parsed.slots)) {
      // 确保 slots 数组长度正确
      while (parsed.slots.length < MAX_SLOTS) parsed.slots.push(null);
      return parsed;
    }
  } catch {
    // 不存在或损坏
  }
  return { version: 1, slots: new Array(MAX_SLOTS).fill(null) };
}

export function saveRegistry(registry: Registry): void {
  ensureGlobalDir();
  const tmpPath = REGISTRY_FILE + '.tmp.' + process.pid;
  fs.writeFileSync(tmpPath, JSON.stringify(registry, null, 2) + '\n', 'utf-8');
  fs.renameSync(tmpPath, REGISTRY_FILE);
}

// ── 槽位操作 ──

/** 清理 stale 槽位（进程已死但注册表未更新） */
export function cleanStaleSlots(registry: Registry): boolean {
  let changed = false;
  for (let i = 0; i < registry.slots.length; i++) {
    const entry = registry.slots[i];
    if (entry && !isDaemonAlive(entry.pid)) {
      registry.slots[i] = null;
      // 清理对应的 PID 文件
      try { fs.unlinkSync(instancePidPath(i)); } catch { /* ignore */ }
      changed = true;
    }
  }
  if (changed) {
    saveRegistry(registry);
  }
  return changed;
}

/** 根据 instance 名查找已分配的槽位 */
export function findSlotByInstance(registry: Registry, instanceId: string): RegistryEntry | null {
  return registry.slots.find((e) => e?.instance === instanceId) ?? null;
}

/** 分配一个空闲槽位，返回槽位索引；无空闲返回 null */
export function allocateSlot(
  registry: Registry,
  instanceId: string,
  pid: number,
): RegistryEntry | null {
  const slots = loadSlots();
  const freeIndex = registry.slots.findIndex((e) => e === null);
  if (freeIndex === -1) return null;

  const ports = slots[freeIndex];
  const entry: RegistryEntry = {
    index: freeIndex,
    instance: instanceId,
    pid,
    wsPort: ports.wsPort,
    devServerPort: ports.devServerPort,
    configPort: ports.configPort,
    startedAt: new Date().toISOString(),
  };

  registry.slots[freeIndex] = entry;
  saveRegistry(registry);
  return entry;
}

/** 释放指定 instance 的槽位 */
export function releaseSlot(registry: Registry, instanceId: string): void {
  for (let i = 0; i < registry.slots.length; i++) {
    if (registry.slots[i]?.instance === instanceId) {
      registry.slots[i] = null;
      break;
    }
  }
  saveRegistry(registry);
}

// ── 实例路径 ──

/** 槽位 PID 文件路径 */
export function instancePidPath(slotIndex: number): string {
  return path.join(INSTANCES_DIR, `${slotIndex}.pid`);
}

/** 槽位日志文件路径 */
export function instanceLogPath(slotIndex: number): string {
  return path.join(INSTANCES_DIR, `${slotIndex}.log`);
}

// ── 实例标识解析 ──

/**
 * 解析实例标识。
 *
 * 优先级：REMNOTE_HEADLESS（最高，覆盖一切）> cliArg > REMNOTE_BRIDGE_INSTANCE > "default"
 */
export function resolveInstanceId(cliArg?: string): string {
  // headless 模式覆盖 --instance，固定实例名
  if (process.env.REMNOTE_HEADLESS === '1') return 'headless';
  if (cliArg) return cliArg;
  const fromEnv = process.env.REMNOTE_BRIDGE_INSTANCE;
  if (fromEnv) return fromEnv;
  return 'default';
}

// ── 满载报错信息 ──

export function formatSlotsFullError(registry: Registry): string {
  const lines = [`错误: 已达最大实例数上限（${MAX_SLOTS}），无可用槽位。`, '', '运行中的实例:'];
  for (const entry of registry.slots) {
    if (entry) {
      lines.push(`  槽位 ${entry.index}: ${entry.instance} (PID: ${entry.pid})`);
    }
  }
  lines.push('', '请先执行 `remnote-bridge --instance <name> disconnect` 释放槽位。');
  return lines.join('\n');
}
