/**
 * RemCache — LRU 缓存，存储 Rem 的序列化 JSON
 *
 * 缓存存储在 daemon 内存中，生命周期与 daemon 一致。
 * disconnect 关闭 daemon → 缓存自然消失。
 */

export class RemCache {
  private cache = new Map<string, { json: string; lastAccess: number; createdAt: string }>();
  private maxSize: number;

  constructor(maxSize = 200) {
    this.maxSize = maxSize;
  }

  get(remId: string): string | null {
    const entry = this.cache.get(remId);
    if (!entry) return null;
    entry.lastAccess = Date.now();
    return entry.json;
  }

  /** 获取缓存条目的创建时间（ISO 8601），不存在返回 null */
  getCreatedAt(remId: string): string | null {
    const entry = this.cache.get(remId);
    return entry ? entry.createdAt : null;
  }

  set(remId: string, json: string): void {
    const now = Date.now();
    const createdAt = new Date(now).toISOString();

    if (this.cache.has(remId)) {
      const entry = this.cache.get(remId)!;
      entry.json = json;
      entry.lastAccess = now;
      entry.createdAt = createdAt;
      return;
    }

    // LRU 淘汰
    if (this.cache.size >= this.maxSize) {
      let oldestId: string | null = null;
      let oldestTime = Infinity;
      for (const [id, entry] of this.cache) {
        if (entry.lastAccess < oldestTime) {
          oldestTime = entry.lastAccess;
          oldestId = id;
        }
      }
      if (oldestId) {
        this.cache.delete(oldestId);
      }
    }

    this.cache.set(remId, { json, lastAccess: now, createdAt });
  }

  has(remId: string): boolean {
    return this.cache.has(remId);
  }

  delete(remId: string): void {
    this.cache.delete(remId);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}
