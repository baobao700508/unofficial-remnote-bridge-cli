/**
 * GlobeReadHandler — read-globe 请求的业务编排
 *
 * 职责：转发到 Plugin 获取知识库概览，返回结果。
 * globe 是低频操作，不做缓存。
 */

export interface GlobeReadResult {
  nodeCount: number;
  outline: string;
}

export class GlobeReadHandler {
  constructor(
    private forwardToPlugin: (action: string, payload: Record<string, unknown>) => Promise<unknown>,
  ) {}

  async handleReadGlobe(payload: Record<string, unknown>): Promise<GlobeReadResult> {
    const depth = (payload.depth as number) ?? -1;
    const maxNodes = (payload.maxNodes as number) ?? 200;
    const maxSiblings = (payload.maxSiblings as number) ?? 20;

    return await this.forwardToPlugin('read_globe', {
      depth, maxNodes, maxSiblings,
    }) as GlobeReadResult;
  }
}
