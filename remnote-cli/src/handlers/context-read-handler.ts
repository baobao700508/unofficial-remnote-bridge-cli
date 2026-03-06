/**
 * ContextReadHandler — read-context 请求的业务编排
 *
 * 职责：转发到 Plugin 获取上下文视图，返回结果。
 */

import type { DefaultsConfig } from '../config';
import { DEFAULT_DEFAULTS } from '../config';

export interface ContextReadResult {
  nodeCount: number;
  outline: string;
  breadcrumb: string[];
  mode: 'focus' | 'page';
}

export class ContextReadHandler {
  private defaults: DefaultsConfig;

  constructor(
    private forwardToPlugin: (action: string, payload: Record<string, unknown>) => Promise<unknown>,
    defaults?: DefaultsConfig,
  ) {
    this.defaults = defaults ?? DEFAULT_DEFAULTS;
  }

  async handleReadContext(payload: Record<string, unknown>): Promise<ContextReadResult> {
    const mode = (payload.mode as string) ?? this.defaults.readContextMode;
    const ancestorLevels = (payload.ancestorLevels as number) ?? this.defaults.readContextAncestorLevels;
    const depth = (payload.depth as number) ?? this.defaults.readContextDepth;
    const maxNodes = (payload.maxNodes as number) ?? this.defaults.maxNodes;
    const maxSiblings = (payload.maxSiblings as number) ?? this.defaults.maxSiblings;

    return await this.forwardToPlugin('read_context', {
      mode, ancestorLevels, depth, maxNodes, maxSiblings,
    }) as ContextReadResult;
  }
}
