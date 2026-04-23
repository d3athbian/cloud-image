import type { PlatformAdapter } from "../adapters/types";
import { logger } from "../utils/logger";
import { type CacheConfig, type CacheEntry, type CacheStats, DEFAULT_CACHE_CONFIG } from "./types";

const log = logger.ImageCache;

class SimpleMutex {
  private queue: Array<() => void> = [];
  private locked = false;

  async acquire(): Promise<() => void> {
    if (!this.locked) {
      this.locked = true;
      return () => {
        this.locked = false;
        this.releaseNext();
      };
    }
    return new Promise((resolve) => {
      this.queue.push(() => {
        this.locked = true;
        resolve(() => {
          this.locked = false;
          this.releaseNext();
        });
      });
    });
  }

  private releaseNext(): void {
    const next = this.queue.shift();
    if (next) next();
  }
}

export class ImageCache {
  private entries: Map<string, CacheEntry> = new Map();
  private config: Required<Omit<CacheConfig, "platformOverride">> & { platformOverride?: string };
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
  private lock = new SimpleMutex();

  constructor(config: Partial<CacheConfig> = {}, adapter?: PlatformAdapter) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config } as Required<
      Omit<CacheConfig, "platformOverride">
    > & { platformOverride?: string };
    this.adapter = adapter ?? null;
  }

  setAdapter(adapter: PlatformAdapter): void {
    this.adapter = adapter;
  }

  async init(): Promise<void> {
    if (this.adapter) {
      this.adapter.init().catch((err) => log.warn("Adapter init failed:", err));
      this.loadFromAdapter().catch((err) => log.warn("Load failed:", err));
    }
  }

  private async loadFromAdapter(): Promise<void> {
    if (!this.adapter) return;

    try {
      const keys = await this.adapter.keys();
      for (const url of keys) {
        const entry = await this.adapter.get(url);
        if (entry) {
          const validated = this.validateCacheEntry(entry);
          if (!validated.valid) {
            log.warn(`[ImageCache] Skipping invalid entry ${url}:`, validated.errors);
            continue;
          }
          if (!this.isExpired(validated.entry)) {
            if (!validated.entry.metadata.accessCount) {
              validated.entry.metadata.accessCount = 0;
            }
            if (!validated.entry.metadata.accessedAt) {
              validated.entry.metadata.accessedAt = validated.entry.metadata.cachedAt || Date.now();
            }
            this.entries.set(url, validated.entry);
            this.stats.totalSize += validated.entry.metadata.size;
          }
        }
      }
      this.stats.itemCount = this.entries.size;
    } catch (error) {
      log.warn("[ImageCache] Failed to load from adapter:", error);
    }
  }

  private validateCacheEntry(entry: CacheEntry): {
    valid: boolean;
    entry: CacheEntry;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!entry.url || typeof entry.url !== "string") {
      errors.push("Missing or invalid url");
    }
    if (!entry.data || !(entry.data instanceof ArrayBuffer)) {
      errors.push("Missing or invalid data (not ArrayBuffer)");
    }
    if (!entry.metadata) {
      errors.push("Missing metadata");
    } else {
      if (typeof entry.metadata.size !== "number" || entry.metadata.size <= 0) {
        errors.push("Invalid metadata.size (must be positive number)");
      }
      if (typeof entry.metadata.cachedAt !== "number") {
        errors.push("Missing metadata.cachedAt");
      }
      if (typeof entry.metadata.accessedAt !== "number") {
        errors.push("Missing metadata.accessedAt");
      }
      if (typeof entry.metadata.accessCount !== "number") {
        errors.push("Missing metadata.accessCount");
      }
    }
    if (!entry.state) {
      errors.push("Missing state (defaulting to cached)");
      entry.state = "cached";
    }

    return {
      valid: errors.length === 0,
      entry,
      errors,
    };
  }

  async get(url: string): Promise<CacheEntry | null> {
    const release = await this.lock.acquire();
    try {
      return await this.getInternal(url);
    } finally {
      release();
    }
  }

  has(url: string): boolean {
    return this.entries.has(url);
  }

  private async getInternal(url: string): Promise<CacheEntry | null> {
    const entry = this.entries.get(url);

    if (!entry) {
      if (this.adapter) {
        const adapterEntry = await this.adapter.get(url);
        if (adapterEntry && !this.isExpired(adapterEntry)) {
          this.hits++;
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
      await this.adapter.set(entry).catch(log.warn);
    }

    return entry;
  }

  async set(entry: CacheEntry): Promise<void> {
    const release = await this.lock.acquire();
    try {
      await this.setInternal(entry);
    } finally {
      release();
    }
  }

  private async setInternal(entry: CacheEntry): Promise<void> {
    const existingEntry = this.entries.get(entry.url);

    if (existingEntry) {
      this.stats.totalSize -= existingEntry.metadata.size;
      this.stats.totalSize += entry.metadata.size;
    } else {
      while (this.shouldEvict(entry.metadata.size)) {
        await this.evict(entry.metadata.size);
      }
      this.stats.totalSize += entry.metadata.size;
    }

    const newEntry: CacheEntry = {
      ...entry,
      state: "cached",
      metadata: {
        ...entry.metadata,
        cachedAt: Date.now(),
        accessedAt: Date.now(),
        accessCount: entry.metadata.accessCount || 1,
      },
    };

    this.entries.set(entry.url, newEntry);
    this.stats.itemCount = this.entries.size;

    if (this.adapter) {
      try {
        await this.adapter.set(newEntry);
      } catch (adapterError) {
        log.error("[ImageCache] Persistence failed for", entry.url, adapterError);
        this.entries.delete(entry.url);
        this.stats.itemCount = this.entries.size;
        this.stats.totalSize -= newEntry.metadata.size;
        throw new Error(`Cache write failed for ${entry.url}: ${adapterError}`);
      }
    }
  }

  async delete(url: string): Promise<boolean> {
    const release = await this.lock.acquire();
    try {
      return await this.deleteInternal(url);
    } finally {
      release();
    }
  }

  private async deleteInternal(url: string): Promise<boolean> {
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
      await this.adapter.delete(url).catch(log.warn);
    }

    return true;
  }

  async clear(): Promise<void> {
    const release = await this.lock.acquire();
    try {
      this.entries.clear();
      this.stats.itemCount = 0;
      this.stats.totalSize = 0;
      this.hits = 0;
      this.misses = 0;
      this.updateRates();

      if (this.adapter) {
        await this.adapter.clear().catch(log.warn);
      }
    } finally {
      release();
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
        log.warn("[ImageCache] Failed to get adapter stats:", error);
      }
    }
    return { ...this.stats };
  }

  getAdapterPlatform(): string {
    return this.adapter?.platform ?? "memory";
  }

  private isExpired(entry: CacheEntry): boolean {
    const ttlExpired = Date.now() - entry.metadata.cachedAt > this.config.defaultTTL;
    if (ttlExpired) return true;

    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      return true;
    }
    return false;
  }

  private shouldEvict(incomingSize: number): boolean {
    const projectedSize = this.stats.totalSize + incomingSize;
    return projectedSize > this.config.maxSize * 0.9;
  }

  private async evict(_incomingSize: number): Promise<void> {
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
      const targetCapacity = targetSize;
      const currentSize = this.stats.totalSize;
      const neededCapacity = currentSize + (_incomingSize ?? 0) - targetCapacity;

      for (const { entry } of nonExpired) {
        if (evictedSize >= neededCapacity) {
          break;
        }
        toEvict.push(entry);
        evictedSize += entry.metadata.size;
      }

      for (const entry of toEvict) {
        this.entries.delete(entry.url);
        this.stats.evictionCount++;
        if (this.adapter) {
          await this.adapter.delete(entry.url).catch(log.warn);
        }
      }
    } else {
      for (const { entry } of scoredEntries) {
        this.entries.delete(entry.url);
        this.stats.evictionCount++;
        if (this.adapter) {
          await this.adapter.delete(entry.url).catch(log.warn);
        }
      }
    }

    this.stats.itemCount = this.entries.size;
    this.stats.totalSize = Array.from(this.entries.values()).reduce(
      (sum, e) => sum + e.metadata.size,
      0,
    );
  }

  private calculateScore(entry: CacheEntry): number {
    const ttl = this.config.defaultTTL || 1;
    const recencyFactor = Math.max(0, 1 - (Date.now() - entry.metadata.accessedAt) / ttl);
    const normalizedAccess = Math.min(entry.metadata.accessCount / 100, 1);

    const viewportBonus = entry.metadata.isInViewport
      ? 0.3
      : entry.metadata.lastViewportSeen && Date.now() - entry.metadata.lastViewportSeen < 300000
        ? 0.15
        : 0;

    return normalizedAccess * 0.4 + recencyFactor * 0.3 + viewportBonus;
  }

  async updateViewportStatus(url: string, isInViewport: boolean): Promise<void> {
    const entry = this.entries.get(url);
    if (entry) {
      entry.metadata.isInViewport = isInViewport;
      if (isInViewport) {
        entry.metadata.lastViewportSeen = Date.now();
      }
      if (this.adapter) {
        await this.adapter.set(entry).catch((err) => log.warn("Viewport update failed:", err));
      }
    }
  }

  private updateRates(): void {
    const total = this.hits + this.misses;
    this.stats.hitRate = total > 0 ? this.hits / total : 0;
    this.stats.missRate = total > 0 ? this.misses / total : 0;
  }
}
