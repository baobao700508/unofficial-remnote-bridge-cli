/**
 * health 命令
 *
 * 检查守护进程、Plugin 连接、SDK 状态，输出 ✅/❌ 列表。
 * - 全部健康 → 退出码 0
 * - 部分不健康 → 退出码 1
 * - 守护进程不可达 → 退出码 2
 */

import { findProjectRoot, pidFilePath } from '../config.js';
import { checkDaemon } from '../daemon/pid.js';
import { sendDaemonRequest, DaemonNotRunningError, DaemonUnreachableError } from '../daemon/send-request.js';
import type { StatusResult } from '../protocol.js';
import { jsonOutput } from '../utils/output.js';

export interface HealthOptions {
  json?: boolean;
}

export async function healthCommand(options: HealthOptions = {}): Promise<void> {
  const { json } = options;
  const projectRoot = findProjectRoot();
  const pidPath = pidFilePath(projectRoot);

  // 先检查 PID 文件
  const daemonStatus = checkDaemon(pidPath);
  if (!daemonStatus.running) {
    if (json) {
      jsonOutput({
        ok: false, command: 'health', exitCode: 2,
        daemon: { running: false },
        plugin: { connected: false },
        sdk: { ready: false },
      });
    } else {
      console.log('❌ 守护进程  未运行');
      console.log('❌ Plugin    未连接');
      console.log('❌ SDK       不可用');
      console.log('\n提示: 执行 `remnote-bridge connect` 启动守护进程');
    }
    process.exitCode = 2;
    return;
  }

  // 通过 WS 连接守护进程获取状态
  let status: StatusResult;
  try {
    status = await sendDaemonRequest('get_status') as StatusResult;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (json) {
      jsonOutput({
        ok: false, command: 'health', exitCode: 2,
        daemon: { running: true, pid: daemonStatus.pid, reachable: false },
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
      daemon: { running: true, pid: daemonStatus.pid, reachable: true, uptime: status.uptime },
      plugin: { connected: status.pluginConnected },
      sdk: { ready: status.sdkReady },
      headless: status.headless ?? null,
      timeoutRemaining: status.timeoutRemaining,
    });
  } else {
    console.log(`✅ 守护进程  运行中（PID: ${daemonStatus.pid}，已运行 ${formatUptime(status.uptime)}）`);

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

    // headless 模式下显示浏览器状态
    if (status.headless) {
      const h = status.headless;
      const chromeOk = h.chromeConnected && h.status === 'running';
      console.log(`${chromeOk ? '✅' : '❌'} Chrome     ${h.status}${h.lastError ? `（${h.lastError}）` : ''}`);
      if (h.reloadCount > 0) {
        console.log(`  自动重载次数: ${h.reloadCount}`);
      }
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
