/**
 * ContextReadHandler — read-context 请求的业务编排
 *
 * 职责：转发到 Plugin 获取上下文视图，返回结果。
 */

export interface ContextReadResult {
  nodeCount: number;
  outline: string;
  breadcrumb: string[];
  mode: 'focus' | 'page';
}

export class ContextReadHandler {
  constructor(
    private forwardToPlugin: (action: string, payload: Record<string, unknown>) => Promise<unknown>,
  ) {}

  async handleReadContext(payload: Record<string, unknown>): Promise<ContextReadResult> {
    const mode = (payload.mode as string) ?? 'focus';
    const ancestorLevels = (payload.ancestorLevels as number) ?? 2;
    const depth = (payload.depth as number) ?? 3;
    const maxNodes = (payload.maxNodes as number) ?? 200;
    const maxSiblings = (payload.maxSiblings as number) ?? 20;

    return await this.forwardToPlugin('read_context', {
      mode, ancestorLevels, depth, maxNodes, maxSiblings,
    }) as ContextReadResult;
  }
}
