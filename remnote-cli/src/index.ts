#!/usr/bin/env node
/**
 * remnote-cli 主入口
 *
 * 命令层：封装 RemNote 操作为统一 CLI 命令。
 * 当前支持的命令：connect、health、disconnect、read-rem、edit-rem
 */

import { Command } from 'commander';
import { connectCommand } from './commands/connect';
import { healthCommand } from './commands/health';
import { disconnectCommand } from './commands/disconnect';
import { readRemCommand } from './commands/read-rem';
import { editRemCommand } from './commands/edit-rem';
import { readTreeCommand } from './commands/read-tree';
import { editTreeCommand } from './commands/edit-tree';

const program = new Command();

/**
 * --json 模式下解析 JSON 输入参数。
 * 返回 null 表示解析失败（已输出错误并设置 exitCode）。
 */
function parseJsonInput(command: string, jsonStr: string | undefined, requiredFields: string[] = []): any | null {
  if (!jsonStr) {
    console.log(JSON.stringify({ ok: false, command, error: '--json 模式需要传入 JSON 参数，例如: command --json \'{"remId":"..."}\''}));
    process.exitCode = 1;
    return null;
  }
  let input: any;
  try {
    input = JSON.parse(jsonStr);
  } catch {
    console.log(JSON.stringify({ ok: false, command, error: `JSON 解析失败: ${jsonStr}` }));
    process.exitCode = 1;
    return null;
  }
  if (!input.remId) {
    console.log(JSON.stringify({ ok: false, command, error: 'JSON 参数中缺少 remId 字段' }));
    process.exitCode = 1;
    return null;
  }
  for (const field of requiredFields) {
    if (input[field] === undefined) {
      console.log(JSON.stringify({ ok: false, command, error: `JSON 参数中缺少 ${field} 字段` }));
      process.exitCode = 1;
      return null;
    }
  }
  return input;
}

program
  .name('unofficial-remnote-bridge')
  .description('Unofficial RemNote Bridge — 连接 CLI 与 RemNote 插件')
  .version('0.1.0')
  .option('--json', '以 JSON 格式输出（适用于程序化调用）');

program
  .command('connect')
  .description('启动守护进程（WS Server + webpack-dev-server），等待 Plugin 连接')
  .action(async () => {
    const { json } = program.opts();
    await connectCommand({ json });
  });

program
  .command('health')
  .description('检查守护进程、Plugin 连接和 SDK 状态')
  .action(async () => {
    const { json } = program.opts();
    await healthCommand({ json });
  });

program
  .command('disconnect')
  .description('停止守护进程，释放端口和资源')
  .action(async () => {
    const { json } = program.opts();
    await disconnectCommand({ json });
  });

program
  .command('read-rem [remIdOrJson]')
  .description('读取单个 Rem 的完整 JSON 对象')
  .option('--fields <fields>', '只返回指定字段（逗号分隔）')
  .option('--full', '输出全部 51 个字段（含 R-F 低频字段）')
  .option('--includePowerup', '包含 Powerup 系统数据（默认过滤）')
  .action(async (remIdOrJson: string | undefined, cmdOpts: { fields?: string; full?: boolean; includePowerup?: boolean }) => {
    const { json } = program.opts();
    if (json) {
      const input = parseJsonInput('read-rem', remIdOrJson);
      if (!input) return;
      await readRemCommand(input.remId, { json, fields: input.fields?.join(','), full: input.full, includePowerup: input.includePowerup });
    } else {
      if (!remIdOrJson) { console.error('错误: 缺少 remId'); process.exitCode = 1; return; }
      await readRemCommand(remIdOrJson, { json, ...cmdOpts });
    }
  });

program
  .command('read-tree [remIdOrJson]')
  .description('读取 Rem 子树并序列化为 Markdown 大纲')
  .option('--depth <depth>', '展开深度（默认 3，-1 = 全部展开）')
  .option('--includePowerup', '包含 Powerup 系统数据（默认过滤）')
  .action(async (remIdOrJson: string | undefined, cmdOpts: { depth?: string; includePowerup?: boolean }) => {
    const { json } = program.opts();
    if (json) {
      const input = parseJsonInput('read-tree', remIdOrJson);
      if (!input) return;
      await readTreeCommand(input.remId, { json, depth: input.depth?.toString(), includePowerup: input.includePowerup });
    } else {
      if (!remIdOrJson) { console.error('错误: 缺少 remId'); process.exitCode = 1; return; }
      await readTreeCommand(remIdOrJson, { json, ...cmdOpts });
    }
  });

program
  .command('edit-tree [remIdOrJson]')
  .description('通过 str_replace 编辑 Rem 子树结构（行级增/删/移/重排）')
  .option('--old-str <oldStr>', '要替换的原始文本片段')
  .option('--new-str <newStr>', '替换后的新文本片段')
  .action(async (remIdOrJson: string | undefined, cmdOpts: { oldStr?: string; newStr?: string }) => {
    const { json } = program.opts();
    if (json) {
      const input = parseJsonInput('edit-tree', remIdOrJson, ['oldStr', 'newStr']);
      if (!input) return;
      await editTreeCommand(input.remId, { json, oldStr: input.oldStr, newStr: input.newStr });
    } else {
      if (!remIdOrJson) { console.error('错误: 缺少 remId'); process.exitCode = 1; return; }
      if (!cmdOpts.oldStr || !cmdOpts.newStr) { console.error('错误: --old-str 和 --new-str 是必需的'); process.exitCode = 1; return; }
      await editTreeCommand(remIdOrJson, { json, oldStr: cmdOpts.oldStr, newStr: cmdOpts.newStr });
    }
  });

program
  .command('edit-rem [remIdOrJson]')
  .description('通过 str_replace 编辑 Rem 的 JSON 字段')
  .option('--old-str <oldStr>', '要替换的原始文本片段')
  .option('--new-str <newStr>', '替换后的新文本片段')
  .action(async (remIdOrJson: string | undefined, cmdOpts: { oldStr?: string; newStr?: string }) => {
    const { json } = program.opts();
    if (json) {
      const input = parseJsonInput('edit-rem', remIdOrJson, ['oldStr', 'newStr']);
      if (!input) return;
      await editRemCommand(input.remId, { json, oldStr: input.oldStr, newStr: input.newStr });
    } else {
      if (!remIdOrJson) { console.error('错误: 缺少 remId'); process.exitCode = 1; return; }
      if (!cmdOpts.oldStr || !cmdOpts.newStr) { console.error('错误: --old-str 和 --new-str 是必需的'); process.exitCode = 1; return; }
      await editRemCommand(remIdOrJson, { json, oldStr: cmdOpts.oldStr, newStr: cmdOpts.newStr });
    }
  });

program.parse();
