import {
  CacheEntry,
  CacheConfig,
  CacheStats,
  DEFAULT_CACHE_CONFIG,
} from './types';

export class ImageCache {
  private entries: Map<string, CacheEntry> = new Map();
  private config: Required<CacheConfig>;
  private stats: CacheStats = {
    itemCount: 0,
    totalSize: 0,
    hitRate: 0,
    missRate: 0,
    evictionCount: 0,
  };
  private hits = 0;
  private misses = 0;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
  }

  async get(url: string): Promise<CacheEntry | null> {
    const entry = this.entries.get(url);
    
    if (!entry) {
      this.misses++;
      this.updateRates();
      return null;
    }

    if (this.isExpired(entry)) {
      await this.delete(url);
      this.misses++;
      this.updateRates();
      return null;
    }

    entry.metadata.accessedAt = Date.now();
    entry.metadata.accessCount++;
    this.hits++;
    this.updateRates();
    
    return entry;
  }

  async set(entry: CacheEntry): Promise<void> {
    const existingEntry = this.entries.get(entry.url);
    
    if (existingEntry) {
      this.stats.totalSize -= existingEntry.metadata.size;
    }

    if (this.shouldEvict(entry.metadata.size)) {
      await this.evict(entry.metadata.size);
    }

    this.entries.set(entry.url, {
      ...entry,
      metadata: {
        ...entry.metadata,
        cachedAt: Date.now(),
        accessedAt: Date.now(),
        accessCount: 1,
      },
    });

    this.stats.itemCount = this.entries.size;
    this.stats.totalSize += entry.metadata.size;
  }

  async delete(url: string): Promise<boolean> {
    const entry = this.entries.get(url);
    
    if (!entry) {
      return false;
    }

    this.entries.delete(url);
    this.stats.itemCount = this.entries.size;
    this.stats.totalSize -= entry.metadata.size;
    
    return true;
  }

  async clear(): Promise<void> {
    this.entries.clear();
    this.stats.itemCount = 0;
    this.stats.totalSize = 0;
    this.hits = 0;
    this.misses = 0;
    this.updateRates();
  }

  async getStats(): Promise<CacheStats> {
    return { ...this.stats };
  }

  private isExpired(entry: CacheEntry): boolean {
    if (!entry.expiresAt) {
      const ttlExpired = Date.now() - entry.metadata.cachedAt > this.config.defaultTTL;
      if (ttlExpired) return true;
    } else {
      if (entry.expiresAt < Date.now()) return true;
    }
    return false;
  }

  private shouldEvict(incomingSize: number): boolean {
    const projectedSize = this.stats.totalSize + incomingSize;
    return projectedSize > this.config.maxSize * 0.9;
  }

  private async evict(incomingSize: number): Promise<void> {
    const targetSize = this.config.maxSize * 0.8;
    const entries = Array.from(this.entries.values());
    
    const scoredEntries = entries
      .filter((e) => this.isExpired(e))
      .map((e) => ({ entry: e, score: 0 }));

    if (scoredEntries.length === 0) {
      const nonExpired = entries
        .filter((e) => !this.isExpired(e))
        .map((e) => ({
          entry: e,
          score: this.calculateScore(e),
        }))
        .sort((a, b) => a.score - b.score);

      const toEvict: CacheEntry[] = [];
      let evictedSize = 0;
      const batchSize = this.config.maxSize * 0.2;

      for (const { entry } of nonExpired) {
        if (evictedSize >= batchSize && this.stats.totalSize - evictedSize <= targetSize) {
          break;
        }
        toEvict.push(entry);
        evictedSize += entry.metadata.size;
      }

      for (const entry of toEvict) {
        this.entries.delete(entry.url);
        this.stats.evictionCount++;
      }
    } else {
      for (const { entry } of scoredEntries) {
        this.entries.delete(entry.url);
        this.stats.evictionCount++;
      }
    }

    this.stats.itemCount = this.entries.size;
    this.stats.totalSize = Array.from(this.entries.values()).reduce(
      (sum, e) => sum + e.metadata.size,
      0
    );
  }

  private calculateScore(entry: CacheEntry): number {
    const recencyFactor = 1 - (Date.now() - entry.metadata.accessedAt) / this.config.defaultTTL;
    const normalizedAccess = Math.min(entry.metadata.accessCount / 100, 1);
    
    return normalizedAccess * 0.6 + Math.max(0, recencyFactor) * 0.4;
  }

  private updateRates(): void {
    const total = this.hits + this.misses;
    this.stats.hitRate = total > 0 ? this.hits / total : 0;
    this.stats.missRate = total > 0 ? this.misses / total : 0;
  }
}
