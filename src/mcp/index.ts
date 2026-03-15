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

export async function startMcpServer(): Promise<void> {
  const server = new FastMCP({
    name: 'remnote-bridge',
    version: '0.1.3',
    instructions: SERVER_INSTRUCTIONS,
  });

  registerInfraTools(server);
  registerReadTools(server);
  registerEditTools(server);

  await server.start({ transportType: 'stdio' });
}
