/**
 * 基础设施工具：setup、connect、disconnect、health
 */

import { z } from 'zod';
import type { FastMCP } from 'fastmcp';
import { callCli, setHeadlessMode } from '../daemon-client.js';
import { formatDataJson } from '../format.js';

export function registerInfraTools(server: FastMCP): void {
  // -------------------------------------------------------------------------
  // setup
  // -------------------------------------------------------------------------
  server.addTool({
    name: 'setup',
    description:
      '启动 Chrome 浏览器让用户登录 RemNote，保存登录凭证到本地 profile。这是使用 headless 模式（connect --headless）的前置步骤。\n\nsetup 只负责登录——配置 dev plugin 是 connect 之后的事。\n\n调用后 Chrome 窗口会弹出，你需要立即告知用户："已打开 Chrome，请在浏览器中登录 RemNote，完成后用 Cmd+Q（macOS）或关闭窗口彻底退出 Chrome"。此工具会阻塞等待用户关闭 Chrome 后返回结果。\n\n幂等：已完成 setup 后重复调用返回 alreadyDone: true。\n超时：600 秒（用户可能需要较长时间完成登录、2FA 验证等）。\n前置条件：需要桌面环境（GUI），无 GUI 环境会报错。\n关联工具：connect（启动会话，传 headless 参数实现无人值守连接）',
    parameters: z.object({}),
    execute: async () => {
      const response = await callCli('setup', undefined, { timeoutMs: 600_000 });
      return formatDataJson(response);
    },
  });

  // -------------------------------------------------------------------------
  // connect
  // -------------------------------------------------------------------------
  server.addTool({
    name: 'connect',
    description:
      '启动守护进程（daemon），建立 CLI 与 RemNote Plugin 之间的通信通道。这是所有业务命令（read_rem、edit_rem、search 等）的前置步骤。\n\n适用场景：\n- 开始一次 RemNote 操作会话前，必须先调用此工具\n- 不确定 daemon 是否在运行时，也可安全调用（幂等）\n\n两种模式：\n- 标准模式（默认）：启动 daemon 后需要用户在 RemNote 中手动加载 Plugin\n- Headless 模式（headless=true）：自动启动 headless Chrome 加载 Plugin，无需用户操作。需先完成 setup（保存登录凭证）\n\nHeadless 模式会话持久化：connect(headless=true) 后，MCP Server 自动记住 headless 状态，后续所有工具调用（health、read_rem、edit_rem 等）自动路由到 headless 实例，无需额外参数。disconnect 或 clean 后自动清除。\n\n输出：返回 JSON，关键字段 ok、alreadyRunning、instance、slotIndex、pid、wsPort、headless。\n幂等：重复调用不会启动多个 daemon。daemon 默认 30 分钟无活动自动关闭。\n关联工具：setup（headless 前置）、disconnect（结束会话）、health（检查状态）',
    parameters: z.object({
      headless: z.boolean().optional().describe('启用 headless 模式：自动启动 Chrome 加载 Plugin（需先 setup）'),
    }),
    execute: async (args) => {
      // headless 模式：connect 前先设置，确保 callCli 注入 --headless
      if (args.headless) setHeadlessMode(true);
      try {
        const response = await callCli('connect', undefined, {
          timeoutMs: 90_000,
        });
        return formatDataJson(response);
      } catch (e) {
        // connect 失败时清除 headless 状态
        if (args.headless) setHeadlessMode(false);
        throw e;
      }
    },
  });

  // -------------------------------------------------------------------------
  // disconnect
  // -------------------------------------------------------------------------
  server.addTool({
    name: 'disconnect',
    description:
      '停止守护进程，释放所有端口、清空内存缓存、结束当前会话。自动清除 headless 模式状态。\n\n适用场景：\n- 操作完成后主动释放资源\n- 需要重置连接状态（例如排查问题时先 disconnect 再 connect）\n\n输出：返回 JSON，关键字段 ok、wasRunning（之前是否在运行）、instance、pid。\n幂等：daemon 未运行时调用也返回 ok: true。\n所有缓存随 daemon 退出清空，下次 connect 后需重新 read。\n关联工具：connect（启动会话）、health（检查状态）',
    parameters: z.object({}),
    execute: async () => {
      const response = await callCli('disconnect');
      setHeadlessMode(false);
      return formatDataJson(response);
    },
  });

  // -------------------------------------------------------------------------
  // health
  // -------------------------------------------------------------------------
  server.addTool({
    name: 'health',
    description:
      '检查系统三层状态（daemon 守护进程 / Plugin 连接 / SDK 就绪），用于诊断连接问题。\n\n两种模式：\n- 全量模式（默认）：返回所有活跃实例的状态，字段 instances 是数组，每个元素包含 instance、slotIndex、daemon、plugin（含 isTwin 孪生标记）、sdk、timeoutRemaining\n- 单实例模式（headless 会话中自动触发）：返回当前实例的状态，结构与之前相同但 plugin 多了 isTwin 字段\n\nplugin.isTwin 表示 Plugin 连接是否为"孪生连接"——即 Plugin 的 twinSlotIndex 与 daemon 的槽位索引匹配。孪生连接优先级更高，可抢占非孪生连接。\n\n三层有严格依赖：daemon 运行 → Plugin 连接 → SDK 就绪。\nok 为 false 时：无活跃实例则 connect；Plugin 未连接则确认 RemNote 已打开（或使用 headless 模式）；SDK 未就绪则等待重试。\n\n--diagnose 模式（headless 专用）：截图 + 详细状态 + console 错误 + 排查建议。\n--reload 模式（headless 专用）：重载 headless Chrome 页面。\n\n只读不写，不改变任何状态（--reload 除外）。\n关联工具：connect（启动）、disconnect（结束）',
    parameters: z.object({
      diagnose: z.boolean().optional().describe('诊断 headless Chrome（截图 + 状态 + console 错误）'),
      reload: z.boolean().optional().describe('重载 headless Chrome 页面'),
    }),
    execute: async (args) => {
      const flags: string[] = [];
      if (args.diagnose) flags.push('--diagnose');
      if (args.reload) flags.push('--reload');
      const response = await callCli('health', undefined, {
        flags: flags.length > 0 ? flags : undefined,
      });
      return formatDataJson(response);
    },
  });

  // -------------------------------------------------------------------------
  // addon
  // -------------------------------------------------------------------------
  server.addTool({
    name: 'addon',
    description:
      '管理增强项目（addon）：查看状态、安装、卸载。\n\n增强项目是独立安装的可选组件，扩展核心功能（如 remnote-rag 语义搜索）。\n\n操作：\n- action="list"：查看所有可用增强项目的状态（已安装/未安装、已启用/已禁用、缺失配置）\n- action="install"：安装并启用指定增强项目（name 必填）\n- action="uninstall"：卸载指定增强项目（name 必填，可选 purge 清理数据目录）\n\n安装后需在配置页面中填写必需的配置项（如 API Key）。\n不需要 daemon 运行。',
    parameters: z.object({
      action: z.enum(['list', 'install', 'uninstall']).describe('操作类型'),
      name: z.string().optional().describe('增强项目名称（install/uninstall 时必填）'),
      purge: z.boolean().optional().describe('卸载时清理数据目录（仅 uninstall 有效）'),
    }),
    execute: async (args) => {
      const flags: string[] = [args.action];
      if (args.name) flags.push(args.name);
      if (args.purge) flags.push('--purge');
      const response = await callCli('addon', undefined, {
        flags,
      });
      return formatDataJson(response);
    },
  });

  // -------------------------------------------------------------------------
  // clean
  // -------------------------------------------------------------------------
  server.addTool({
    name: 'clean',
    description:
      '清理所有 daemon 进程、PID 文件、日志、注册表和 addon 数据。\n\n适用场景：\n- daemon 进程残留，disconnect 无法正常停止时\n- 端口被占用，多次启动失败后\n- 注册表损坏需要重置\n- 完整重装，清除所有状态从零开始\n\n⚠️ 破坏性操作——会停止所有 daemon、清空所有缓存和注册表。执行后需重新 connect。\n不需要 daemon 运行。',
    parameters: z.object({}),
    execute: async () => {
      const response = await callCli('clean');
      setHeadlessMode(false);
      return formatDataJson(response);
    },
  });
}
