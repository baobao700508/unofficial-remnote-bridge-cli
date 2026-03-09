/**
 * health 命令
 *
 * 检查守护进程、Plugin 连接、SDK 状态，输出 ✅/❌ 列表。
 * --diagnose：headless 深度诊断（截图 + console 错误 + 排查建议）
 * --reload：手动触发 headless Chrome 页面重载
 *
 * 退出码：
 * - 0：全部健康
 * - 1：部分不健康
 * - 2：守护进程不可达
 */

import { findProjectRoot, pidFilePath } from '../config.js';
import { checkDaemon } from '../daemon/pid.js';
import { sendDaemonRequest } from '../daemon/send-request.js';
import type { StatusResult, DiagnoseResult } from '../protocol.js';
import { jsonOutput } from '../utils/output.js';

export interface HealthOptions {
  json?: boolean;
  diagnose?: boolean;
  reload?: boolean;
}

export async function healthCommand(options: HealthOptions = {}): Promise<void> {
  const { json, diagnose, reload } = options;
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

  // --reload：触发 headless Chrome 页面重载
  if (reload) {
    try {
      const result = await sendDaemonRequest('headless_reload', {}, { timeout: 30_000 }) as { ok: boolean; error?: string };
      if (json) {
        jsonOutput({ ok: result.ok, command: 'health', action: 'reload', error: result.error });
      } else {
        if (result.ok) {
          console.log('Headless Chrome 重载成功');
        } else {
          console.error(`重载失败: ${result.error}`);
        }
      }
      process.exitCode = result.ok ? 0 : 1;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (json) {
        jsonOutput({ ok: false, command: 'health', action: 'reload', error: msg });
      } else {
        console.error(`重载失败: ${msg}`);
      }
      process.exitCode = 1;
    }
    return;
  }

  // --diagnose：headless 深度诊断
  if (diagnose) {
    try {
      const result = await sendDaemonRequest('diagnose', {}, { timeout: 15_000 }) as DiagnoseResult;

      if (json) {
        jsonOutput({ ok: true, command: 'health', ...result });
      } else {
        console.log('=== Headless Chrome 诊断 ===');
        console.log(`  状态:          ${result.headless.status}`);
        console.log(`  Chrome 连接:   ${result.headless.chromeConnected ? '✅' : '❌'}`);
        console.log(`  页面 URL:      ${result.headless.pageUrl ?? '(无)'}`);
        console.log(`  自动重载次数:  ${result.headless.reloadCount}`);
        if (result.headless.lastError) {
          console.log(`  最后错误:      ${result.headless.lastError}`);
        }
        console.log('');
        console.log(`  Plugin:        ${result.pluginConnected ? '✅ 已连接' : '❌ 未连接'}`);
        console.log(`  SDK:           ${result.sdkReady ? '✅ 就绪' : '❌ 未就绪'}`);
        console.log(`  日志文件:      ${result.logFile}`);

        if (result.headless.screenshotPath) {
          console.log(`  截图:          ${result.headless.screenshotPath}`);
        }

        if (result.headless.recentConsoleErrors.length > 0) {
          console.log(`\n=== 最近 Console 错误（${result.headless.recentConsoleErrors.length} 条）===`);
          for (const e of result.headless.recentConsoleErrors) {
            console.log(`  ${e}`);
          }
        }

        // 排查建议
        if (!result.pluginConnected) {
          console.log('\n=== 排查建议 ===');
          if (result.headless.status === 'crashed') {
            console.log('  Chrome 已崩溃，尝试: remnote-bridge health --reload');
          } else if (!result.headless.chromeConnected) {
            console.log('  Chrome 进程已丢失，需要重启: remnote-bridge disconnect && remnote-bridge connect --headless');
          } else {
            console.log('  Chrome 在运行但 Plugin 未连接，可能原因:');
            console.log('    - RemNote 页面未完全加载（查看截图确认）');
            console.log('    - 登录态过期（需重新 setup）');
            console.log('    - 尝试重载: remnote-bridge health --reload');
          }
          console.log(`  查看完整日志: cat ${result.logFile}`);
        }
      }
      process.exitCode = 0;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (json) {
        jsonOutput({ ok: false, command: 'health', error: msg });
      } else {
        console.error(`诊断失败: ${msg}`);
      }
      process.exitCode = 1;
    }
    return;
  }

  // 默认：基础状态检查
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
