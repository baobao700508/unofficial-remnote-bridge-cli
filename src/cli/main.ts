#!/usr/bin/env node
/**
 * remnote-bridge 主入口
 *
 * 伞命令：CLI 命令 + mcp 子命令 + install 子命令。
 */

import { createRequire } from 'module';
import { Command } from 'commander';
import { connectCommand } from './commands/connect.js';
import { healthCommand } from './commands/health.js';
import { disconnectCommand } from './commands/disconnect.js';
import { readRemCommand } from './commands/read-rem.js';
import { editRemCommand } from './commands/edit-rem.js';
import { readTreeCommand } from './commands/read-tree.js';
import { editTreeCommand } from './commands/edit-tree.js';
import { readGlobeCommand } from './commands/read-globe.js';
import { readContextCommand } from './commands/read-context.js';
import { searchCommand } from './commands/search.js';
import { installSkillCommand, installSkillCopyCommand } from './commands/install-skill.js';
import { cleanCommand } from './commands/clean.js';

const require = createRequire(import.meta.url);
const { version } = require('../../package.json');

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
  .name('remnote-bridge')
  .description('RemNote Bridge — CLI + MCP Server + Plugin')
  .version(version)
  .option('--json', '以 JSON 格式输出（适用于程序化调用）');

program
  .command('connect')
  .description('启动守护进程，等待 Plugin 连接')
  .option('--dev', '开发模式：使用 webpack-dev-server（支持 HMR）')
  .action(async (cmdOpts: { dev?: boolean }) => {
    const { json } = program.opts();
    await connectCommand({ json, dev: cmdOpts.dev });
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
  .option('--max-nodes <maxNodes>', '全局节点上限（默认 200）')
  .option('--max-siblings <maxSiblings>', '每个父节点下展示的 children 上限（默认 20）')
  .option('--ancestor-levels <ancestorLevels>', '向上追溯祖先层数（默认 0，上限 10）')
  .option('--includePowerup', '包含 Powerup 系统数据（默认过滤）')
  .action(async (remIdOrJson: string | undefined, cmdOpts: { depth?: string; maxNodes?: string; maxSiblings?: string; ancestorLevels?: string; includePowerup?: boolean }) => {
    const { json } = program.opts();
    if (json) {
      const input = parseJsonInput('read-tree', remIdOrJson);
      if (!input) return;
      await readTreeCommand(input.remId, {
        json,
        depth: input.depth?.toString(),
        maxNodes: input.maxNodes?.toString(),
        maxSiblings: input.maxSiblings?.toString(),
        ancestorLevels: input.ancestorLevels?.toString(),
        includePowerup: input.includePowerup,
      });
    } else {
      if (!remIdOrJson) { console.error('错误: 缺少 remId'); process.exitCode = 1; return; }
      await readTreeCommand(remIdOrJson, { json, ...cmdOpts });
    }
  });

program
  .command('read-globe [jsonStr]')
  .description('读取知识库全局概览（仅 Document 层级）')
  .option('--depth <depth>', 'Document 嵌套深度（默认 -1 无限）')
  .option('--max-nodes <maxNodes>', '全局节点上限（默认 200）')
  .option('--max-siblings <maxSiblings>', '每个父节点下展示的 children 上限（默认 20）')
  .action(async (jsonStr: string | undefined, cmdOpts: { depth?: string; maxNodes?: string; maxSiblings?: string }) => {
    const { json } = program.opts();
    if (json) {
      let input: Record<string, unknown> = {};
      if (jsonStr) {
        try { input = JSON.parse(jsonStr); } catch {
          console.log(JSON.stringify({ ok: false, command: 'read-globe', error: `JSON 解析失败: ${jsonStr}` }));
          process.exitCode = 1;
          return;
        }
      }
      await readGlobeCommand({
        json,
        depth: input.depth?.toString(),
        maxNodes: input.maxNodes?.toString(),
        maxSiblings: input.maxSiblings?.toString(),
      });
    } else {
      await readGlobeCommand({ json, ...cmdOpts });
    }
  });

program
  .command('read-context [jsonStr]')
  .description('读取当前上下文视图（focus 鱼眼 / page 页面）')
  .option('--mode <mode>', '模式：focus（默认）或 page')
  .option('--ancestor-levels <levels>', '向上追溯几层祖先（默认 2，仅 focus 模式）')
  .option('--depth <depth>', '展开深度（默认 3，仅 page 模式）')
  .option('--max-nodes <maxNodes>', '全局节点上限（默认 200）')
  .option('--max-siblings <maxSiblings>', '每个父节点下展示的 children 上限（默认 20）')
  .action(async (jsonStr: string | undefined, cmdOpts: { mode?: string; ancestorLevels?: string; depth?: string; maxNodes?: string; maxSiblings?: string }) => {
    const { json } = program.opts();
    if (json) {
      let input: Record<string, unknown> = {};
      if (jsonStr) {
        try { input = JSON.parse(jsonStr); } catch {
          console.log(JSON.stringify({ ok: false, command: 'read-context', error: `JSON 解析失败: ${jsonStr}` }));
          process.exitCode = 1;
          return;
        }
      }
      await readContextCommand({
        json,
        mode: input.mode as string | undefined,
        ancestorLevels: input.ancestorLevels?.toString(),
        depth: input.depth?.toString(),
        maxNodes: input.maxNodes?.toString(),
        maxSiblings: input.maxSiblings?.toString(),
      });
    } else {
      await readContextCommand({ json, ...cmdOpts });
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
      if (!cmdOpts.oldStr || cmdOpts.newStr === undefined) { console.error('错误: --old-str 和 --new-str 是必需的'); process.exitCode = 1; return; }
      await editTreeCommand(remIdOrJson, { json, oldStr: cmdOpts.oldStr, newStr: cmdOpts.newStr });
    }
  });

program
  .command('search [queryOrJson]')
  .description('在知识库中按文本搜索 Rem')
  .option('--limit <limit>', '结果数量上限（默认 20）')
  .action(async (queryOrJson: string | undefined, cmdOpts: { limit?: string }) => {
    const { json } = program.opts();
    if (json) {
      let input: Record<string, unknown> = {};
      if (queryOrJson) {
        try { input = JSON.parse(queryOrJson); } catch {
          console.log(JSON.stringify({ ok: false, command: 'search', error: `JSON 解析失败: ${queryOrJson}` }));
          process.exitCode = 1;
          return;
        }
      }
      if (!input.query) {
        console.log(JSON.stringify({ ok: false, command: 'search', error: 'JSON 参数中缺少 query 字段' }));
        process.exitCode = 1;
        return;
      }
      await searchCommand(input.query as string, { json, limit: input.numResults?.toString() });
    } else {
      if (!queryOrJson) { console.error('错误: 缺少搜索关键词'); process.exitCode = 1; return; }
      await searchCommand(queryOrJson, { json, ...cmdOpts });
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
      if (!cmdOpts.oldStr || cmdOpts.newStr === undefined) { console.error('错误: --old-str 和 --new-str 是必需的'); process.exitCode = 1; return; }
      await editRemCommand(remIdOrJson, { json, oldStr: cmdOpts.oldStr, newStr: cmdOpts.newStr });
    }
  });

// mcp 子命令
program.command('mcp')
  .description('启动 MCP Server（stdio）')
  .action(async () => {
    const { startMcpServer } = await import('../mcp/index.js');
    await startMcpServer();
  });

// install 子命令组
const installCmd = program.command('install').description('安装组件');
installCmd.command('skill')
  .description('安装 Skill（推荐使用 npx skills add，或 --copy 直接复制）')
  .option('--copy', '直接复制到 ~/.claude/skills/（不使用 Vercel Skills CLI）')
  .action(async (opts: { copy?: boolean }) => {
    if (opts.copy) {
      await installSkillCopyCommand();
    } else {
      await installSkillCommand();
    }
  });

program
  .command('clean')
  .description('清理所有残留文件（.pid / .log / .json / skill 目录）')
  .action(async () => {
    const { json } = program.opts();
    await cleanCommand({ json });
  });

program.parse();
