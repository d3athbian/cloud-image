import type { DecodedImage } from './decoder';

export interface CacheEntry {
  url: string;
  data: ArrayBuffer;
  metadata: CacheMetadata;
  qualityTier: 'low' | 'medium' | 'high';
  upgradeable: boolean;
  cachedBandwidth?: number;
  expiresAt?: number;
}

export interface CacheMetadata {
  size: number;
  width?: number;
  height?: number;
  mimeType: string;
  cachedAt: number;
  accessedAt: number;
  accessCount: number;
  etag?: string;
  lastModified?: string;
}

export interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  evictionBatchSize: number;
}

const DEFAULT_CONFIG: Required<CacheConfig> = {
  maxSize: 100 * 1024 * 1024,
  defaultTTL: 7 * 24 * 60 * 60 * 1000,
  evictionBatchSize: 0.2,
};

export class CacheManager {
  private entries: Map<string, CacheEntry> = new Map();
  private config: Required<CacheConfig>;
  private totalSize = 0;
  private hits = 0;
  private misses = 0;
  private evictionCount = 0;
  private pendingRequests: Map<string, Promise<CacheEntry | null>> = new Map();

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config } as Required<CacheConfig>;
  }

  async get(url: string): Promise<CacheEntry | null> {
    const entry = this.entries.get(url);
    
    if (!entry) {
      this.misses++;
      return null;
    }

    if (this.isExpired(entry)) {
      await this.delete(url);
      this.misses++;
      return null;
    }

    entry.metadata.accessedAt = Date.now();
    entry.metadata.accessCount++;
    this.hits++;
    
    return entry;
  }

  async set(entry: CacheEntry): Promise<{ stored: boolean; evictedCount: number }> {
    const existing = this.entries.get(entry.url);
    const existingSize = existing?.metadata.size || 0;
    
    const projectedSize = this.totalSize - existingSize + entry.metadata.size;
    
    if (projectedSize > this.config.maxSize * 0.9) {
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
    this.totalSize = this.totalSize - existingSize + entry.metadata.size;

    return {
      stored: true,
      evictedCount: 0,
    };
  }

  async delete(url: string): Promise<boolean> {
    const entry = this.entries.get(url);
    if (!entry) return false;

    this.entries.delete(url);
    this.totalSize -= entry.metadata.size;
    return true;
  }

  async clear(): Promise<void> {
    this.entries.clear();
    this.totalSize = 0;
    this.hits = 0;
    this.misses = 0;
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      itemCount: this.entries.size,
      totalSize: this.totalSize,
      hitRate: total > 0 ? this.hits / total : 0,
      missRate: total > 0 ? this.misses / total : 0,
      evictionCount: this.evictionCount,
    };
  }

  private isExpired(entry: CacheEntry): boolean {
    if (entry.expiresAt) {
      return entry.expiresAt < Date.now();
    }
    return Date.now() - entry.metadata.cachedAt > this.config.defaultTTL;
  }

  private async evict(incomingSize: number): Promise<void> {
    const targetSize = this.config.maxSize * 0.8;
    
    const expiredEntries = Array.from(this.entries.values())
      .filter(e => this.isExpired(e))
      .sort((a, b) => a.metadata.cachedAt - b.metadata.cachedAt);

    for (const entry of expiredEntries) {
      if (this.totalSize - entry.metadata.size <= targetSize) break;
      await this.delete(entry.url);
      this.evictionCount++;
    }

    if (this.totalSize + incomingSize <= this.config.maxSize * 0.9) {
      return;
    }

    const nonExpired = Array.from(this.entries.values())
      .filter(e => !this.isExpired(e))
      .map(e => ({
        entry: e,
        score: this.calculateScore(e),
      }))
      .sort((a, b) => a.score - b.score);

    const batchSize = this.config.maxSize * this.config.evictionBatchSize;
    let evictedSize = 0;

    for (const { entry } of nonExpired) {
      if (evictedSize >= batchSize && this.totalSize - evictedSize <= targetSize) {
        break;
      }
      if (await this.delete(entry.url)) {
        evictedSize += entry.metadata.size;
        this.evictionCount++;
      }
    }
  }

  private calculateScore(entry: CacheEntry): number {
    const recencyFactor = 1 - (Date.now() - entry.metadata.accessedAt) / this.config.defaultTTL;
    const normalizedAccess = Math.min(entry.metadata.accessCount / 100, 1);
    return normalizedAccess * 0.6 + Math.max(0, recencyFactor) * 0.4;
  }

  deduplicate<T>(url: string, fetcher: () => Promise<T>): Promise<T> {
    const existing = this.pendingRequests.get(url);
    if (existing) {
      return existing as Promise<T>;
    }

    const promise = fetcher() as Promise<T>;
    this.pendingRequests.set(url, promise as unknown as Promise<CacheEntry | null>);
    
    promise.finally(() => {
      this.pendingRequests.delete(url);
    });
    
    return promise;
  }

  hasPendingRequest(url: string): boolean {
    return this.pendingRequests.has(url);
  }
}

let cacheManagerInstance: CacheManager | null = null;

export function getCacheManager(config?: Partial<CacheConfig>): CacheManager {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager(config);
  }
  return cacheManagerInstance;
}