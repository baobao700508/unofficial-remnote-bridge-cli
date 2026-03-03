#!/usr/bin/env node
/**
 * remnote-cli 主入口
 *
 * 命令层：封装 RemNote 操作为统一 CLI 命令。
 * 当前支持的命令：connect、health、disconnect
 */

import { Command } from 'commander';
import { connectCommand } from './commands/connect';
import { healthCommand } from './commands/health';
import { disconnectCommand } from './commands/disconnect';

const program = new Command();

program
  .name('remnote')
  .description('RemNote 桥接工具 — 连接 CLI 与 RemNote 插件')
  .version('0.1.0');

program
  .command('connect')
  .description('启动守护进程（WS Server + webpack-dev-server），等待 Plugin 连接')
  .action(async () => {
    await connectCommand();
  });

program
  .command('health')
  .description('检查守护进程、Plugin 连接和 SDK 状态')
  .action(async () => {
    await healthCommand();
  });

program
  .command('disconnect')
  .description('停止守护进程，释放端口和资源')
  .action(async () => {
    await disconnectCommand();
  });

program.parse();
