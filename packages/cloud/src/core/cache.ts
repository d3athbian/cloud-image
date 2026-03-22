import {
  CacheEntry,
  CacheConfig,
  CacheStats,
  DEFAULT_CACHE_CONFIG,
} from './types';
import type { PlatformAdapter } from '../adapters/types';

export class ImageCache {
  private entries: Map<string, CacheEntry> = new Map();
  private config: Required<Omit<CacheConfig, 'platformOverride'>> & { platformOverride?: string };
  private stats: CacheStats = {
    itemCount: 0,
    totalSize: 0,
    hitRate: 0,
    missRate: 0,
    evictionCount: 0,
  };
  private hits = 0;
  private misses = 0;
  private adapter: PlatformAdapter | null = null;
  private adapterInitPromise: Promise<void> | null = null;

  constructor(config: Partial<CacheConfig> = {}, adapter?: PlatformAdapter) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config } as Required<Omit<CacheConfig, 'platformOverride'>> & { platformOverride?: string };
    this.adapter = adapter ?? null;
  }

  setAdapter(adapter: PlatformAdapter): void {
    this.adapter = adapter;
  }

  async init(): Promise<void> {
    if (this.adapter) {
      await this.adapter.init();
      await this.loadFromAdapter();
    }
  }

  private async loadFromAdapter(): Promise<void> {
    if (!this.adapter) return;
    
    try {
      const keys = await this.adapter.keys();
      for (const url of keys) {
        const entry = await this.adapter.get(url);
        if (entry && !this.isExpired(entry)) {
          this.entries.set(url, entry);
          this.stats.totalSize += entry.metadata.size;
        }
      }
      this.stats.itemCount = this.entries.size;
    } catch (error) {
      console.warn('[ImageCache] Failed to load from adapter:', error);
    }
  }

  async get(url: string): Promise<CacheEntry | null> {
    const entry = this.entries.get(url);
    
    if (!entry) {
      if (this.adapter) {
        const adapterEntry = await this.adapter.get(url);
        if (adapterEntry && !this.isExpired(adapterEntry)) {
          this.misses++;
          this.updateRates();
          adapterEntry.metadata.accessedAt = Date.now();
          adapterEntry.metadata.accessCount++;
          this.entries.set(url, adapterEntry);
          this.stats.totalSize += adapterEntry.metadata.size;
          this.stats.itemCount = this.entries.size;
          return adapterEntry;
        }
      }
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
    
    if (this.adapter) {
      await this.adapter.set(entry).catch(console.warn);
    }
    
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

    const newEntry: CacheEntry = {
      ...entry,
      metadata: {
        ...entry.metadata,
        cachedAt: Date.now(),
        accessedAt: Date.now(),
        accessCount: entry.metadata.accessCount || 1,
      },
    };

    this.entries.set(entry.url, newEntry);
    this.stats.itemCount = this.entries.size;
    this.stats.totalSize += entry.metadata.size;

    if (this.adapter) {
      await this.adapter.set(newEntry).catch(console.warn);
    }
  }

  async delete(url: string): Promise<boolean> {
    const entry = this.entries.get(url);
    
    if (!entry) {
      if (this.adapter) {
        const existed = await this.adapter.delete(url);
        return existed;
      }
      return false;
    }

    this.entries.delete(url);
    this.stats.itemCount = this.entries.size;
    this.stats.totalSize -= entry.metadata.size;
    
    if (this.adapter) {
      await this.adapter.delete(url).catch(console.warn);
    }
    
    return true;
  }

  async clear(): Promise<void> {
    this.entries.clear();
    this.stats.itemCount = 0;
    this.stats.totalSize = 0;
    this.hits = 0;
    this.misses = 0;
    this.updateRates();
    
    if (this.adapter) {
      await this.adapter.clear().catch(console.warn);
    }
  }

  async getStats(): Promise<CacheStats> {
    if (this.adapter) {
      try {
        const adapterSize = await this.adapter.getSize();
        this.stats.totalSize = adapterSize;
        const keys = await this.adapter.keys();
        this.stats.itemCount = keys.length;
      } catch (error) {
        console.warn('[ImageCache] Failed to get adapter stats:', error);
      }
    }
    return { ...this.stats };
  }

  getAdapterPlatform(): string {
    return this.adapter?.platform ?? 'memory';
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
        if (this.adapter) {
          await this.adapter.delete(entry.url).catch(console.warn);
        }
      }
    } else {
      for (const { entry } of scoredEntries) {
        this.entries.delete(entry.url);
        this.stats.evictionCount++;
        if (this.adapter) {
          await this.adapter.delete(entry.url).catch(console.warn);
        }
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
