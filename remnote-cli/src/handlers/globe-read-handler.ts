/**
 * GlobeReadHandler — read-globe 请求的业务编排
 *
 * 职责：转发到 Plugin 获取知识库概览，返回结果。
 * globe 是低频操作，不做缓存。
 */

import type { DefaultsConfig } from '../config';
import { DEFAULT_DEFAULTS } from '../config';

export interface GlobeReadResult {
  nodeCount: number;
  outline: string;
}

export class GlobeReadHandler {
  private defaults: DefaultsConfig;

  constructor(
    private forwardToPlugin: (action: string, payload: Record<string, unknown>) => Promise<unknown>,
    defaults?: DefaultsConfig,
  ) {
    this.defaults = defaults ?? DEFAULT_DEFAULTS;
  }

  async handleReadGlobe(payload: Record<string, unknown>): Promise<GlobeReadResult> {
    const depth = (payload.depth as number) ?? this.defaults.readGlobeDepth;
    const maxNodes = (payload.maxNodes as number) ?? this.defaults.maxNodes;
    const maxSiblings = (payload.maxSiblings as number) ?? this.defaults.maxSiblings;

    return await this.forwardToPlugin('read_globe', {
      depth, maxNodes, maxSiblings,
    }) as GlobeReadResult;
  }
}
