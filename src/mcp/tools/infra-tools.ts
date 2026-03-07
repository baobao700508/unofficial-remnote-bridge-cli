/**
 * 基础设施工具：connect、disconnect、health
 */

import { z } from 'zod';
import type { FastMCP } from 'fastmcp';
import { callCli } from '../daemon-client.js';

export function registerInfraTools(server: FastMCP): void {
  // -------------------------------------------------------------------------
  // connect
  // -------------------------------------------------------------------------
  server.addTool({
    name: 'connect',
    description:
      '启动守护进程（daemon），建立 CLI 与 RemNote Plugin 之间的通信通道。这是所有业务命令（read_rem、edit_rem、search 等）的前置步骤。\n\n适用场景：\n- 开始一次 RemNote 操作会话前，必须先调用此工具\n- 不确定 daemon 是否在运行时，也可安全调用（幂等）\n\n输出：返回 JSON，关键字段 ok、alreadyRunning（是否已运行）、pid、wsPort。\n幂等：重复调用不会启动多个 daemon。daemon 默认 30 分钟无活动自动关闭。\n关联工具：disconnect（结束会话）、health（检查状态）',
    parameters: z.object({}),
    execute: async () => {
      const response = await callCli('connect');
      return JSON.stringify(response, null, 2);
    },
  });

  // -------------------------------------------------------------------------
  // disconnect
  // -------------------------------------------------------------------------
  server.addTool({
    name: 'disconnect',
    description:
      '停止守护进程，释放所有端口、清空内存缓存、结束当前会话。\n\n适用场景：\n- 操作完成后主动释放资源\n- 需要重置连接状态（例如排查问题时先 disconnect 再 connect）\n\n输出：返回 JSON，关键字段 ok、wasRunning（之前是否在运行）、pid。\n幂等：daemon 未运行时调用也返回 ok: true。\n所有缓存随 daemon 退出清空，下次 connect 后需重新 read。\n关联工具：connect（启动会话）、health（检查状态）',
    parameters: z.object({}),
    execute: async () => {
      const response = await callCli('disconnect');
      return JSON.stringify(response, null, 2);
    },
  });

  // -------------------------------------------------------------------------
  // health
  // -------------------------------------------------------------------------
  server.addTool({
    name: 'health',
    description:
      '检查系统三层状态（daemon 守护进程 / Plugin 连接 / SDK 就绪），用于诊断连接问题。\n\n适用场景：\n- 业务命令失败时，首先调用 health 定位故障层级\n- 执行 connect 后确认通道是否完全就绪\n- 长时间未操作后，检查 daemon 是否仍在运行\n\n输出：返回 JSON，关键字段 ok（三层是否全部健康）、daemon.running、plugin.connected、sdk.ready、timeoutRemaining。\n三层有严格依赖：daemon 运行 → Plugin 连接 → SDK 就绪。\nok 为 false 时：daemon 未运行则 connect；Plugin 未连接则确认 RemNote 已打开；SDK 未就绪则等待重试。\n只读不写，不改变任何状态。\n关联工具：connect（启动）、disconnect（结束）',
    parameters: z.object({}),
    execute: async () => {
      const response = await callCli('health');
      return JSON.stringify(response, null, 2);
    },
  });
}
