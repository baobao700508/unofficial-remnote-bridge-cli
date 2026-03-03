/**
 * health 命令
 *
 * 检查守护进程、Plugin 连接、SDK 状态，输出 ✅/❌ 列表。
 * - 全部健康 → 退出码 0
 * - 部分不健康 → 退出码 1
 * - 守护进程不可达 → 退出码 2
 */

import WebSocket from 'ws';
import crypto from 'crypto';
import { loadConfig, pidFilePath, findProjectRoot } from '../config';
import { checkDaemon } from '../daemon/pid';
import type { BridgeResponse, StatusResult } from '../protocol';
import { isBridgeResponse } from '../protocol';

const CONNECT_TIMEOUT_MS = 5_000;
const RESPONSE_TIMEOUT_MS = 5_000;

export async function healthCommand(): Promise<void> {
  const projectRoot = findProjectRoot();
  const config = loadConfig(projectRoot);
  const pidPath = pidFilePath(projectRoot);

  // 先检查 PID 文件
  const daemonStatus = checkDaemon(pidPath);
  if (!daemonStatus.running) {
    console.log('❌ 守护进程  未运行');
    console.log('❌ Plugin    未连接');
    console.log('❌ SDK       不可用');
    console.log('\n提示: 执行 `remnote connect` 启动守护进程');
    process.exitCode = 2;
    return;
  }

  // 通过 WS 连接守护进程获取状态
  let status: StatusResult;
  try {
    status = await getStatus(config.wsPort);
  } catch (err) {
    console.log('❌ 守护进程  不可达');
    console.log('❌ Plugin    未连接');
    console.log('❌ SDK       不可用');
    console.log(`\n错误: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 2;
    return;
  }

  // 输出状态
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

  console.log(`\n超时: ${formatUptime(status.timeoutRemaining)} 后自动关闭`);

  // 退出码
  const allHealthy = status.pluginConnected && status.sdkReady;
  process.exitCode = allHealthy ? 0 : 1;
}

function getStatus(port: number): Promise<StatusResult> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}`);
    const requestId = crypto.randomUUID();

    const connectTimer = setTimeout(() => {
      ws.terminate();
      reject(new Error('连接守护进程超时'));
    }, CONNECT_TIMEOUT_MS);

    ws.on('open', () => {
      clearTimeout(connectTimer);

      const responseTimer = setTimeout(() => {
        ws.terminate();
        reject(new Error('等待响应超时'));
      }, RESPONSE_TIMEOUT_MS);

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (isBridgeResponse(msg) && msg.id === requestId) {
            clearTimeout(responseTimer);
            ws.close();
            if (msg.error) {
              reject(new Error(msg.error));
            } else {
              resolve(msg.result as StatusResult);
            }
          }
        } catch {
          // 忽略非 JSON 消息
        }
      });

      // 发送 get_status 请求
      ws.send(JSON.stringify({
        id: requestId,
        action: 'get_status',
        payload: {},
      }));
    });

    ws.on('error', (err) => {
      clearTimeout(connectTimer);
      reject(new Error(`无法连接守护进程: ${err.message}`));
    });
  });
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds} 秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours} 小时 ${mins} 分钟`;
}
