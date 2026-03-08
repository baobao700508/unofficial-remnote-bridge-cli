/**
 * remnote-bridge MCP Server 入口
 *
 * 通过 FastMCP 将 RemNote 知识库操作暴露为 MCP 工具。
 * 所有业务逻辑委托给 remnote-bridge CLI（通过 daemon-client 子进程调用）。
 */

import { FastMCP } from 'fastmcp';
import { SERVER_INSTRUCTIONS } from './instructions.js';
import { registerReadTools } from './tools/read-tools.js';
import { registerEditTools } from './tools/edit-tools.js';
import { registerInfraTools } from './tools/infra-tools.js';
import { OUTLINE_FORMAT_CONTENT } from './resources/outline-format.js';
import { REM_OBJECT_FIELDS_CONTENT } from './resources/rem-object-fields.js';
import { EDIT_TREE_GUIDE_CONTENT } from './resources/edit-tree-guide.js';
import { ERROR_REFERENCE_CONTENT } from './resources/error-reference.js';
import { SEPARATOR_FLASHCARD_CONTENT } from './resources/separator-flashcard.js';

export async function startMcpServer(): Promise<void> {
  const server = new FastMCP({
    name: 'remnote-bridge',
    version: '0.1.2',
    instructions: SERVER_INSTRUCTIONS,
  });

  registerInfraTools(server);
  registerReadTools(server);
  registerEditTools(server);

  // Resources
  server.addResource({
    uri: 'remnote://outline-format',
    name: 'Markdown 大纲格式规范',
    mimeType: 'text/markdown',
    async load() {
      return { text: OUTLINE_FORMAT_CONTENT };
    },
  });

  server.addResource({
    uri: 'remnote://rem-object-fields',
    name: 'RemObject 字段完整参考',
    mimeType: 'text/markdown',
    async load() {
      return { text: REM_OBJECT_FIELDS_CONTENT };
    },
  });

  server.addResource({
    uri: 'remnote://edit-tree-guide',
    name: 'edit_tree 操作指南',
    mimeType: 'text/markdown',
    async load() {
      return { text: EDIT_TREE_GUIDE_CONTENT };
    },
  });

  server.addResource({
    uri: 'remnote://error-reference',
    name: '错误诊断与恢复参考',
    mimeType: 'text/markdown',
    async load() {
      return { text: ERROR_REFERENCE_CONTENT };
    },
  });

  server.addResource({
    uri: 'remnote://separator-flashcard',
    name: '分隔符与闪卡参考',
    mimeType: 'text/markdown',
    async load() {
      return { text: SEPARATOR_FLASHCARD_CONTENT };
    },
  });

  await server.start({ transportType: 'stdio' });
}
