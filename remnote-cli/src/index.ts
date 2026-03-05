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
  .command('read-rem <remId>')
  .description('读取单个 Rem 的完整 JSON 对象')
  .option('--fields <fields>', '只返回指定字段（逗号分隔）')
  .option('--full', '输出全部 51 个字段（含 R-F 低频字段）')
  .action(async (remId: string, cmdOpts: { fields?: string; full?: boolean }) => {
    const { json } = program.opts();
    await readRemCommand(remId, { json, ...cmdOpts });
  });

program
  .command('read-tree <remId>')
  .description('读取 Rem 子树并序列化为 Markdown 大纲')
  .option('--depth <depth>', '展开深度（默认 3，-1 = 全部展开）')
  .action(async (remId: string, cmdOpts: { depth?: string }) => {
    const { json } = program.opts();
    await readTreeCommand(remId, { json, ...cmdOpts });
  });

program
  .command('edit-tree <remId>')
  .description('通过 str_replace 编辑 Rem 子树结构（行级增/删/移/重排）')
  .requiredOption('--old-str <oldStr>', '要替换的原始文本片段')
  .requiredOption('--new-str <newStr>', '替换后的新文本片段')
  .action(async (remId: string, cmdOpts: { oldStr: string; newStr: string }) => {
    const { json } = program.opts();
    await editTreeCommand(remId, { json, ...cmdOpts });
  });

program
  .command('edit-rem <remId>')
  .description('通过 str_replace 编辑 Rem 的 JSON 字段')
  .requiredOption('--old-str <oldStr>', '要替换的原始文本片段')
  .requiredOption('--new-str <newStr>', '替换后的新文本片段')
  .action(async (remId: string, cmdOpts: { oldStr: string; newStr: string }) => {
    const { json } = program.opts();
    await editRemCommand(remId, { json, ...cmdOpts });
  });

program.parse();
