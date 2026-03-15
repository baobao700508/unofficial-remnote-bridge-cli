/**
 * search 命令
 *
 * 在知识库中按文本搜索 Rem。
 * - --limit N 结果数量上限（默认 20）
 * - --json 结构化 JSON 输出
 *
 * 配置驱动：检查 addons.remnote-rag.enabled 决定是否使用 RAG 语义搜索。
 * 已启用且已安装时使用 RAG，否则降级到 SDK 搜索。
 */

import { execFile } from 'node:child_process';
import { sendDaemonRequest } from '../daemon/send-request.js';
import { loadConfig } from '../config.js';
import { jsonOutput, handleCommandError } from '../utils/output.js';

const RAG_TIMEOUT_MS = 10_000;

export interface SearchOptions {
  json?: boolean;
  limit?: string;
}

interface RagSearchResult {
  ok: boolean;
  results: Array<{
    remId: string;
    text: string;
    backText: string | null;
    ancestorPath: string[];
    type: string;
    isDocument: boolean;
    tags: string[];
    score: number;
  }>;
  totalFound: number;
  error?: string;
}

/**
 * 尝试通过 remnote-rag 子进程进行语义搜索（配置驱动）。
 *
 * 1. 检查 addons.remnote-rag.enabled — 未启用则跳过
 * 2. remnote-rag 从 ~/.remnote-bridge/addons/remnote-rag/config.json 读取配置
 * 3. 未安装（ENOENT）、超时、JSON 解析失败、ok:false 均返回 null（静默降级）
 */
async function tryRagSearch(query: string, numResults: number): Promise<RagSearchResult | null> {
  const config = loadConfig();
  const ragConfig = config.addons?.['remnote-rag'];
  if (!ragConfig?.enabled) {
    return null;
  }

  const jsonPayload = JSON.stringify({ query, numResults });
  const args = ['search', '--json', jsonPayload];

  try {
    const stdout = await new Promise<string>((resolve, reject) => {
      execFile('remnote-rag', args, {
        timeout: RAG_TIMEOUT_MS,
        maxBuffer: 5 * 1024 * 1024,
      }, (error, stdout) => {
        if (error) {
          // execFile 的 error 对象包含 stdout，尝试从中提取 RAG 的诊断信息
          const output = (stdout ?? '').trim();
          if (output) {
            try {
              const errData = JSON.parse(output);
              if (errData?.error) {
                reject(new Error(`remnote-rag: ${errData.error}`));
                return;
              }
            } catch {
              // stdout 不是有效 JSON，忽略
            }
          }
          reject(error);
          return;
        }
        resolve(stdout.trim());
      });
    });

    const parsed: unknown = JSON.parse(stdout);
    if (typeof parsed !== 'object' || parsed === null || !('ok' in parsed) || !('results' in parsed)) {
      return null;
    }
    const result = parsed as RagSearchResult;
    if (!result.ok || !Array.isArray(result.results)) {
      return null;
    }
    return result;
  } catch (err) {
    // 静默降级，但保留诊断信息到 stderr 供调试
    if (err instanceof Error && err.message.startsWith('remnote-rag:')) {
      process.stderr.write(`[search] RAG 降级: ${err.message}\n`);
    }
    return null;
  }
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

  // 尝试 RAG 语义搜索
  const ragResult = await tryRagSearch(query, numResults ?? 20);
  if (ragResult !== null) {
    if (json) {
      jsonOutput({ ok: true, command: 'search', data: { query, ...ragResult, source: 'rag' } });
    } else {
      if (ragResult.results.length === 0) {
        console.log(`未找到与 "${query}" 相关的结果 (RAG)`);
      } else {
        console.log(`搜索 "${query}"，找到 ${ragResult.totalFound} 条结果 (RAG 语义搜索)：\n`);
        for (const item of ragResult.results) {
          const docTag = item.isDocument ? ' [Doc]' : '';
          const typeTag = item.type !== 'default' ? ` [${item.type}]` : '';
          const path = item.ancestorPath.length > 0 ? ` (${item.ancestorPath.join(' > ')})` : '';
          const score = ` [${(item.score * 100).toFixed(0)}%]`;
          console.log(`  [${item.remId}]${docTag}${typeTag}${score} ${item.text}${path}`);
          if (item.backText) {
            console.log(`    → ${item.backText}`);
          }
        }
      }
    }
    return;
  }

  // 降级到 SDK 搜索
  let result: unknown;
  try {
    result = await sendDaemonRequest('search', { query, numResults });
  } catch (err) {
    handleCommandError(err, 'search', json);
    return;
  }

  const data = result as { query: string; results: Array<{ remId: string; text: string; isDocument: boolean }>; totalFound: number };

  if (json) {
    jsonOutput({ ok: true, command: 'search', data: { ...data, source: 'sdk' } });
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
