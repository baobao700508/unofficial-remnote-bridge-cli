/**
 * search service — 知识库文本搜索
 *
 * 同态命名：search (action) → search.ts (文件) → search (函数)
 *
 * 职责：调用 plugin.search.search() 搜索 Rem，返回结果列表
 */

import type { ReactRNPlugin } from '@remnote/plugin-sdk';
import { safeToMarkdown } from './rem-builder';

export interface SearchPayload {
  query: string;
  numResults?: number;
}

export interface SearchResultItem {
  remId: string;
  text: string;
  isDocument: boolean;
}

export interface SearchResult {
  query: string;
  results: SearchResultItem[];
  totalFound: number;
}

export async function search(
  plugin: ReactRNPlugin,
  payload: SearchPayload,
): Promise<SearchResult> {
  const { query, numResults = 20 } = payload;

  if (!query || query.trim() === '') {
    throw new Error('search query 不能为空');
  }

  const rems = await plugin.search.search([query], undefined, { numResults });

  const results: SearchResultItem[] = await Promise.all(
    rems.map(async (rem) => {
      const [markdownText, isDocument] = await Promise.all([
        safeToMarkdown(plugin, rem.text ?? []),
        rem.isDocument(),
      ]);
      return {
        remId: rem._id,
        text: markdownText.replace(/\n/g, ' '),
        isDocument,
      };
    }),
  );

  return {
    query,
    results,
    totalFound: results.length,
  };
}
