/**
 * health 命令
 *
 * 检查守护进程、Plugin 连接、SDK 状态，输出 ✅/❌ 列表。
 *
 * 两种模式：
 * - 全量模式（默认）：遍历注册表所有活跃实例，逐个查询状态
 * - 单实例模式（--instance / --headless）：只查询指定实例
 *
 * 退出码：
 * - 0：全部健康
 * - 1：部分不健康
 * - 2：无活跃实例 / 守护进程不可达
 */

import {
  resolveInstanceId,
  loadRegistry,
  cleanStaleSlots,
  findSlotByInstance,
  type RegistryEntry,
} from '../daemon/registry.js';
import { sendDaemonRequest, DaemonNotRunningError, DaemonUnreachableError } from '../daemon/send-request.js';
import type { StatusResult, DiagnoseResult, ReloadResult } from '../protocol.js';
import { jsonOutput } from '../utils/output.js';

export interface HealthOptions {
  json?: boolean;
  diagnose?: boolean;
  reload?: boolean;
  instance?: string;
}

export async function healthCommand(options: HealthOptions = {}): Promise<void> {
  const { json, diagnose, reload } = options;

  // --diagnose 和 --reload 不能同时使用
  if (diagnose && reload) {
    const error = '--diagnose 和 --reload 不能同时使用';
    if (json) {
      jsonOutput({ ok: false, command: 'health', error });
    } else {
      console.error(error);
    }
    process.exitCode = 1;
    return;
  }

  // --diagnose / --reload 走单实例模式（不变）
  if (diagnose || reload) {
    const instanceId = resolveInstanceId(options.instance);
    const registry = loadRegistry();
    cleanStaleSlots(registry);
    const entry = findSlotByInstance(registry, instanceId);

    if (!entry) {
      const error = `守护进程未运行（实例: ${instanceId}），请先执行 remnote-bridge connect`;
      if (json) {
        jsonOutput({ ok: false, command: 'health', error });
      } else {
        console.error(error);
      }
      process.exitCode = 2;
      return;
    }

    if (diagnose) {
      await handleDiagnose(entry, instanceId, options);
    } else {
      await handleReload(entry, instanceId, options);
    }
    return;
  }

  // 判断全量 vs 单实例
  const isExplicitInstance = !!options.instance || process.env.REMNOTE_HEADLESS === '1';

  if (isExplicitInstance) {
    await handleSingleInstance(options);
  } else {
    await handleAllInstances(options);
  }
}

// ── 单实例模式 ──

async function handleSingleInstance(options: HealthOptions): Promise<void> {
  const { json } = options;
  const instanceId = resolveInstanceId(options.instance);
  const registry = loadRegistry();
  cleanStaleSlots(registry);
  const entry = findSlotByInstance(registry, instanceId);

  if (!entry) {
    if (json) {
      jsonOutput({
        ok: false, command: 'health', exitCode: 2,
        instance: instanceId,
        daemon: { running: false },
        plugin: { connected: false },
        sdk: { ready: false },
        error: `守护进程未运行（实例: ${instanceId}），请先执行 remnote-bridge connect`,
      });
    } else {
      console.log(`❌ 守护进程  未运行（实例: ${instanceId}）`);
      console.log('❌ Plugin    未连接');
      console.log('❌ SDK       不可用');
      console.log('\n提示: 执行 `remnote-bridge connect` 启动守护进程');
    }
    process.exitCode = 2;
    return;
  }

  let status: StatusResult;
  try {
    status = await sendDaemonRequest('get_status', {}, { instance: options.instance }) as StatusResult;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (json) {
      jsonOutput({
        ok: false, command: 'health', exitCode: 2,
        instance: instanceId,
        daemon: { running: true, pid: entry.pid, reachable: false },
        plugin: { connected: false },
        sdk: { ready: false },
        error: errorMsg,
      });
    } else {
      console.log(`❌ 守护进程  不可达（实例: ${instanceId}）`);
      console.log('❌ Plugin    未连接');
      console.log('❌ SDK       不可用');
      console.log(`\n错误: ${errorMsg}`);
    }
    process.exitCode = 2;
    return;
  }

  const allHealthy = status.pluginConnected && status.sdkReady;
  const exitCode = allHealthy ? 0 : 1;

  if (json) {
    jsonOutput({
      ok: allHealthy, command: 'health', exitCode,
      instance: instanceId, slotIndex: entry.index,
      daemon: { running: true, pid: entry.pid, reachable: true, uptime: status.uptime },
      plugin: { connected: status.pluginConnected, isTwin: status.pluginIsTwin },
      sdk: { ready: status.sdkReady },
      timeoutRemaining: status.timeoutRemaining,
      ...(status.headless ? { headless: status.headless } : {}),
    });
  } else {
    printInstanceStatus(entry, instanceId, status);
  }

  process.exitCode = exitCode;
}

// ── 全量模式 ──

async function handleAllInstances(options: HealthOptions): Promise<void> {
  const { json } = options;
  const registry = loadRegistry();
  cleanStaleSlots(registry);

  const activeEntries = registry.slots.filter((e): e is RegistryEntry => e !== null);

  if (activeEntries.length === 0) {
    if (json) {
      jsonOutput({
        ok: false, command: 'health', exitCode: 2,
        instances: [],
        error: '没有活跃的实例，请执行 remnote-bridge connect 启动守护进程',
      });
    } else {
      console.log('没有活跃的实例。执行 `remnote-bridge connect` 启动守护进程。');
    }
    process.exitCode = 2;
    return;
  }

  const instances: Record<string, unknown>[] = [];
  let allHealthy = true;
  let anyUnreachable = false;

  for (const entry of activeEntries) {
    try {
      const status = await sendDaemonRequest('get_status', {}, { instance: entry.instance }) as StatusResult;
      const healthy = status.pluginConnected && status.sdkReady;
      if (!healthy) allHealthy = false;

      instances.push({
        instance: entry.instance,
        slotIndex: entry.index,
        daemon: { running: true, pid: entry.pid, reachable: true, uptime: status.uptime },
        plugin: { connected: status.pluginConnected, isTwin: status.pluginIsTwin },
        sdk: { ready: status.sdkReady },
        timeoutRemaining: status.timeoutRemaining,
        ...(status.headless ? { headless: status.headless } : {}),
      });

      if (!json) {
        if (instances.length > 1) console.log('');
        printInstanceStatus(entry, entry.instance, status);
      }
    } catch {
      allHealthy = false;
      anyUnreachable = true;

      instances.push({
        instance: entry.instance,
        slotIndex: entry.index,
        daemon: { running: true, pid: entry.pid, reachable: false },
        plugin: { connected: false },
        sdk: { ready: false },
      });

      if (!json) {
        if (instances.length > 1) console.log('');
        console.log(`=== 实例: ${entry.instance}（槽位 ${entry.index}）===`);
        console.log(`❌ 守护进程  不可达（PID: ${entry.pid}）`);
        console.log('❌ Plugin    未连接');
        console.log('❌ SDK       不可用');
      }
    }
  }

  const exitCode = allHealthy ? 0 : anyUnreachable ? 2 : 1;

  if (json) {
    jsonOutput({
      ok: allHealthy, command: 'health', exitCode,
      instances,
    });
  }

  process.exitCode = exitCode;
}

// ── diagnose / reload ──

async function handleDiagnose(entry: RegistryEntry, instanceId: string, options: HealthOptions): Promise<void> {
  const { json } = options;
  try {
    const result = await sendDaemonRequest('diagnose', {}, { instance: options.instance }) as DiagnoseResult | null;
    if (!result) {
      const error = '非 headless 模式，不支持 --diagnose';
      if (json) {
        jsonOutput({ ok: false, command: 'health', error });
      } else {
        console.error(error);
      }
      process.exitCode = 1;
      return;
    }
    if (json) {
      jsonOutput({ ok: true, command: 'health', mode: 'diagnose', instance: instanceId, ...result });
    } else {
      console.log('=== Headless Chrome 诊断 ===');
      console.log(`状态: ${result.headless.status}`);
      console.log(`Chrome 连接: ${result.headless.chromeConnected ? '是' : '否'}`);
      console.log(`页面 URL: ${result.headless.pageUrl ?? '无'}`);
      console.log(`重载次数: ${result.headless.reloadCount}`);
      console.log(`Plugin 连接: ${result.pluginConnected ? '是' : '否'}`);
      console.log(`SDK 就绪: ${result.sdkReady ? '是' : '否'}`);
      if (result.screenshotPath) {
        console.log(`截图: ${result.screenshotPath}`);
      }
      if (result.headless.lastError) {
        console.log(`\n最近错误: ${result.headless.lastError}`);
      }
      if (result.headless.recentConsoleErrors.length > 0) {
        console.log('\nConsole 错误:');
        for (const err of result.headless.recentConsoleErrors) {
          console.log(`  ${err}`);
        }
      }
      if (!result.headless.chromeConnected) {
        console.log('\n排查建议: Chrome 已断开，尝试 `health --reload` 重载');
      } else if (!result.pluginConnected) {
        console.log('\n排查建议: Chrome 运行中但 Plugin 未连接，可能页面加载异常，尝试 `health --reload`');
      } else if (!result.sdkReady) {
        console.log('\n排查建议: Plugin 已连接但 SDK 未就绪，等待几秒后重试');
      }
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (json) {
      jsonOutput({ ok: false, command: 'health', error: errorMsg });
    } else {
      console.error(`诊断失败: ${errorMsg}`);
    }
    process.exitCode = 1;
  }
}

async function handleReload(entry: RegistryEntry, instanceId: string, options: HealthOptions): Promise<void> {
  const { json } = options;
  try {
    const result = await sendDaemonRequest('headless_reload', {}, { instance: options.instance }) as ReloadResult;
    if (json) {
      jsonOutput({ ok: result.ok, command: 'health', mode: 'reload', instance: instanceId, error: result.error });
    } else {
      if (result.ok) {
        console.log('Headless Chrome 页面已重载');
      } else {
        console.error(`重载失败: ${result.error}`);
      }
    }
    process.exitCode = result.ok ? 0 : 1;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (json) {
      jsonOutput({ ok: false, command: 'health', mode: 'reload', error: errorMsg });
    } else {
      console.error(`重载失败: ${errorMsg}`);
    }
    process.exitCode = 1;
  }
}

// ── 共享输出 ──

function printInstanceStatus(entry: RegistryEntry, instanceId: string, status: StatusResult): void {
  console.log(`=== 实例: ${instanceId}（槽位 ${entry.index}）===`);
  console.log(`✅ 守护进程  运行中（PID: ${entry.pid}，已运行 ${formatUptime(status.uptime)}）`);

  if (status.pluginConnected) {
    const twinLabel = status.pluginIsTwin ? '孪生' : '非孪生';
    console.log(`✅ Plugin    已连接（${twinLabel}）`);
  } else {
    console.log('❌ Plugin    未连接');
  }

  if (status.sdkReady) {
    console.log('✅ SDK       就绪');
  } else {
    console.log('❌ SDK       未就绪');
  }

  if (status.headless) {
    const h = status.headless;
    const icon = h.status === 'running' ? '✅' : '❌';
    console.log(`${icon} Chrome     ${h.status}${h.lastError ? ` (${h.lastError})` : ''}`);
  }

  console.log(`超时: ${formatUptime(status.timeoutRemaining)} 后自动关闭`);
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds} 秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours} 小时 ${mins} 分钟`;
}
