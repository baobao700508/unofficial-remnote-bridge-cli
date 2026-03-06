/**
 * elision.ts — 省略引擎辅助函数
 *
 * 纯函数、无副作用、不依赖其他层。
 * 被 read-tree、read-globe、read-context 共享。
 */

/** 省略描述信息 */
export interface ElidedInfo {
  count: number;
  parentId: string;
  rangeFrom: number;
  rangeTo: number;
  totalSiblings: number;
}

/**
 * 裁剪 siblings：当 children 数量超过 maxSiblings 时，
 * 保留前 70% + 后 30%，中间省略。
 *
 * @returns visible 索引数组 + 可选的省略信息
 */
export function sliceSiblings(
  totalCount: number,
  maxSiblings: number,
  parentId: string,
): { visibleIndices: { head: number; tail: number } | null; elided: ElidedInfo | null } {
  if (totalCount <= maxSiblings) {
    return { visibleIndices: null, elided: null };
  }

  const head = Math.ceil(maxSiblings * 0.7);
  const tail = Math.floor(maxSiblings * 0.3);

  return {
    visibleIndices: { head, tail },
    elided: {
      count: totalCount - head - tail,
      parentId,
      rangeFrom: head,
      rangeTo: totalCount - tail - 1,
      totalSiblings: totalCount,
    },
  };
}

/**
 * 检查全局预算是否耗尽。
 */
export function isBudgetExhausted(budget: { remaining: number }): boolean {
  return budget.remaining <= 0;
}
