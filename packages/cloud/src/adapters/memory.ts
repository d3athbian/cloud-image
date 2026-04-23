import { Size, Time } from "../config/constants";
import type { CacheEntry } from "../core/types";
import type { PlatformAdapter } from "./types";

export class MemoryAdapter implements PlatformAdapter {
  readonly platform = "memory" as const;
  private cache = new Map<string, CacheEntry>();
  private size = 0;
  private maxSize: number;

  constructor(maxSizeBytes = Size.MEMORY_ADAPTER_DEFAULT) {
    this.maxSize = maxSizeBytes;
  }

  async init(): Promise<void> {
    this.cache.clear();
    this.size = 0;
  }

  async get(url: string): Promise<CacheEntry | null> {
    const entry = this.cache.get(url);
    if (entry) {
      entry.metadata.accessedAt = Date.now();
      entry.metadata.accessCount++;
      return entry;
    }
    return null;
  }

  async set(entry: CacheEntry): Promise<void> {
    const existing = this.cache.get(entry.url);
    if (existing) {
      this.size -= existing.metadata.size;
    }
    if (this.size + entry.metadata.size > this.maxSize) {
      await this.evictLRU(entry.metadata.size);
    }
    this.cache.set(entry.url, { ...entry });
    this.size += entry.metadata.size;
  }

  async delete(url: string): Promise<boolean> {
    const entry = this.cache.get(url);
    if (entry) {
      this.size -= entry.metadata.size;
      this.cache.delete(url);
      return true;
    }
    return false;
  }

  async has(url: string): Promise<boolean> {
    return this.cache.has(url);
  }

  async keys(): Promise<string[]> {
    return Array.from(this.cache.keys());
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.size = 0;
  }

  async getSize(): Promise<number> {
    return this.size;
  }

  destroy(): void {
    this.cache.clear();
    this.size = 0;
  }

  evictLRU(bytesNeeded: number): CacheEntry[] {
    const evicted: CacheEntry[] = [];
    let freed = 0;

    const entries = Array.from(this.cache.values())
      .map((e) => ({
        entry: e,
        score:
          e.metadata.accessCount * 0.6 +
          (1 - (Date.now() - e.metadata.accessedAt) / Time.DEFAULT_TTL) * 0.4,
      }))
      .sort((a, b) => a.score - b.score);

    for (const { entry } of entries) {
      if (freed >= bytesNeeded) break;
      evicted.push(entry);
      freed += entry.metadata.size;
    }

    for (const entry of evicted) {
      this.delete(entry.url);
    }

    return evicted;
  }
}

export function createMemoryAdapter(maxSizeBytes?: number): PlatformAdapter {
  return new MemoryAdapter(maxSizeBytes);
}

export default createMemoryAdapter;
