/**
 * search 命令
 *
 * 在知识库中按文本搜索 Rem。
 * - --limit N 结果数量上限（默认 20）
 * - --json 结构化 JSON 输出
 */

import { sendDaemonRequest, DaemonNotRunningError, DaemonUnreachableError } from '../daemon/send-request';
import { jsonOutput } from '../utils/output';

export interface SearchOptions {
  json?: boolean;
  limit?: string;
}

export async function searchCommand(query: string, options: SearchOptions = {}): Promise<void> {
  const { json } = options;
  const numResults = options.limit !== undefined ? parseInt(options.limit, 10) : undefined;

  if (numResults !== undefined && isNaN(numResults)) {
    const errMsg = '--limit must be a number';
    if (json) {
      jsonOutput({ ok: false, command: 'search', error: errMsg });
    } else {
      console.error(`错误: ${errMsg}`);
    }
    process.exitCode = 1;
    return;
  }

  let result: unknown;
  try {
    result = await sendDaemonRequest('search', { query, numResults });
  } catch (err) {
    if (err instanceof DaemonNotRunningError || err instanceof DaemonUnreachableError) {
      if (json) {
        jsonOutput({ ok: false, command: 'search', error: (err as Error).message });
      } else {
        console.error(`错误: ${(err as Error).message}`);
      }
      process.exitCode = 2;
      return;
    }
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (json) {
      jsonOutput({ ok: false, command: 'search', error: errorMsg });
    } else {
      console.error(`错误: ${errorMsg}`);
    }
    process.exitCode = 1;
    return;
  }

  const data = result as { query: string; results: Array<{ remId: string; text: string; isDocument: boolean }>; totalFound: number };

  if (json) {
    jsonOutput({ ok: true, command: 'search', data });
  } else {
    if (data.results.length === 0) {
      console.log(`未找到与 "${data.query}" 相关的结果`);
    } else {
      console.log(`搜索 "${data.query}"，找到 ${data.totalFound} 条结果：\n`);
      for (const item of data.results) {
        const docTag = item.isDocument ? ' [Doc]' : '';
        console.log(`  [${item.remId}]${docTag} ${item.text}`);
      }
    }
  }
}
