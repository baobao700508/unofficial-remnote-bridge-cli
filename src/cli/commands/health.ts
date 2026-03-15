/**
 * health 命令
 *
 * 检查守护进程、Plugin 连接、SDK 状态，输出 ✅/❌ 列表。
 * - 全部健康 → 退出码 0
 * - 部分不健康 → 退出码 1
 * - 守护进程不可达 → 退出码 2
 */

import {
  resolveInstanceId,
  loadRegistry,
  cleanStaleSlots,
  findSlotByInstance,
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
  const instanceId = resolveInstanceId(options.instance);

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

  // 通过注册表检查 daemon 是否运行
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

  // --diagnose 模式
  if (diagnose) {
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
    return;
  }

  // --reload 模式
  if (reload) {
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
    return;
  }

  // 通过 WS 连接守护进程获取状态
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
      console.log('❌ 守护进程  不可达');
      console.log('❌ Plugin    未连接');
      console.log('❌ SDK       不可用');
      console.log(`\n错误: ${errorMsg}`);
    }
    process.exitCode = 2;
    return;
  }

  // 退出码
  const allHealthy = status.pluginConnected && status.sdkReady;
  const exitCode = allHealthy ? 0 : 1;

  if (json) {
    jsonOutput({
      ok: allHealthy, command: 'health', exitCode,
      instance: instanceId, slotIndex: entry.index,
      daemon: { running: true, pid: entry.pid, reachable: true, uptime: status.uptime },
      plugin: { connected: status.pluginConnected },
      sdk: { ready: status.sdkReady },
      timeoutRemaining: status.timeoutRemaining,
      ...(status.headless ? { headless: status.headless } : {}),
    });
  } else {
    console.log(`✅ 守护进程  运行中（PID: ${entry.pid}，实例: ${instanceId}，槽位: ${entry.index}，已运行 ${formatUptime(status.uptime)}）`);

    if (status.pluginConnected) {
      console.log('✅ Plugin    已连接');
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

    console.log(`\n超时: ${formatUptime(status.timeoutRemaining)} 后自动关闭`);
  }

  process.exitCode = exitCode;
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds} 秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours} 小时 ${mins} 分钟`;
}
