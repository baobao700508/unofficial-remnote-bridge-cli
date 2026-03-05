/**
 * read-tree 命令
 *
 * 读取 Rem 子树并序列化为带缩进的 Markdown 大纲。
 * - --depth N 控制展开深度（默认 3，-1 = 全部展开）
 * - --json 结构化 JSON 输出
 * - 退出码：0 成功 / 1 业务错误 / 2 守护进程不可达
 */

import { sendDaemonRequest, DaemonNotRunningError, DaemonUnreachableError } from '../daemon/send-request';

export interface ReadTreeOptions {
  json?: boolean;
  depth?: string;
}

export async function readTreeCommand(remId: string, options: ReadTreeOptions = {}): Promise<void> {
  const { json } = options;
  const depth = options.depth !== undefined ? parseInt(options.depth, 10) : 3;

  if (isNaN(depth)) {
    if (json) {
      console.log(JSON.stringify({ ok: false, command: 'read-tree', error: '--depth must be a number' }));
    } else {
      console.error('错误: --depth 必须是数字');
    }
    process.exitCode = 1;
    return;
  }

  let result: unknown;
  try {
    result = await sendDaemonRequest('read_tree', { remId, depth });
  } catch (err) {
    if (err instanceof DaemonNotRunningError || err instanceof DaemonUnreachableError) {
      if (json) {
        console.log(JSON.stringify({ ok: false, command: 'read-tree', error: (err as Error).message }));
      } else {
        console.error(`错误: ${(err as Error).message}`);
      }
      process.exitCode = 2;
      return;
    }
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (json) {
      console.log(JSON.stringify({ ok: false, command: 'read-tree', error: errorMsg }));
    } else {
      console.error(`错误: ${errorMsg}`);
    }
    process.exitCode = 1;
    return;
  }

  const data = result as { rootId: string; depth: number; nodeCount: number; outline: string };

  if (json) {
    console.log(JSON.stringify({ ok: true, command: 'read-tree', data }));
  } else {
    // 人类可读：直接输出大纲文本
    console.log(data.outline);
  }
}
