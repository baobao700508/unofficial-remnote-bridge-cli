/**
 * diagnose 命令
 *
 * 输出 headless Chrome 诊断信息：浏览器状态、console 错误、截图路径。
 * AI agent 可用此命令排查 headless 连接问题。
 *
 * headless-reload 子功能也在这里，通过 --reload 触发。
 */

import { findProjectRoot, pidFilePath } from '../config.js';
import { checkDaemon } from '../daemon/pid.js';
import { sendDaemonRequest, DaemonNotRunningError, DaemonUnreachableError } from '../daemon/send-request.js';
import type { DiagnoseResult } from '../protocol.js';
import { jsonOutput } from '../utils/output.js';

export interface DiagnoseOptions {
  json?: boolean;
  reload?: boolean;
}

export async function diagnoseCommand(options: DiagnoseOptions = {}): Promise<void> {
  const { json, reload } = options;
  const projectRoot = findProjectRoot();
  const pidPath = pidFilePath(projectRoot);

  const daemonStatus = checkDaemon(pidPath);
  if (!daemonStatus.running) {
    if (json) {
      jsonOutput({ ok: false, command: 'diagnose', error: '守护进程未运行' });
    } else {
      console.error('守护进程未运行。请先执行 remnote-bridge connect');
    }
    process.exitCode = 2;
    return;
  }

  // --reload：触发手动重载
  if (reload) {
    try {
      const result = await sendDaemonRequest('headless_reload', {}, { timeout: 30_000 }) as { ok: boolean; error?: string };
      if (json) {
        jsonOutput({ ok: result.ok, command: 'diagnose', action: 'reload', error: result.error });
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
        jsonOutput({ ok: false, command: 'diagnose', action: 'reload', error: msg });
      } else {
        console.error(`重载失败: ${msg}`);
      }
      process.exitCode = 1;
    }
    return;
  }

  // 默认：输出诊断信息
  try {
    const result = await sendDaemonRequest('diagnose', {}, { timeout: 15_000 }) as DiagnoseResult;

    if (json) {
      jsonOutput({ ok: true, command: 'diagnose', ...result });
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
        for (const err of result.headless.recentConsoleErrors) {
          console.log(`  ${err}`);
        }
      }

      // 给出排查建议
      if (!result.pluginConnected) {
        console.log('\n=== 排查建议 ===');
        if (result.headless.status === 'crashed') {
          console.log('  Chrome 已崩溃，尝试: remnote-bridge diagnose --reload');
        } else if (!result.headless.chromeConnected) {
          console.log('  Chrome 进程已丢失，需要重启: remnote-bridge disconnect && remnote-bridge connect --headless');
        } else {
          console.log('  Chrome 在运行但 Plugin 未连接，可能原因:');
          console.log('    - RemNote 页面未完全加载（查看截图确认）');
          console.log('    - 登录态过期（需重新 setup）');
          console.log('    - 尝试重载: remnote-bridge diagnose --reload');
        }
        console.log(`  查看完整日志: cat ${result.logFile}`);
      }
    }
    process.exitCode = 0;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (json) {
      jsonOutput({ ok: false, command: 'diagnose', error: msg });
    } else {
      console.error(`诊断失败: ${msg}`);
    }
    process.exitCode = 1;
  }
}
