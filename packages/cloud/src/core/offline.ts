import { getNetworkMonitor } from "./network";
import type { CacheEntry } from "./types";

export interface OfflineStrategy {
  readonly name: string;
  checkAvailability(url: string): Promise<boolean>;
  getOfflineEntry(url: string): Promise<CacheEntry | null>;
  isOfflineMode(): boolean;
}

export class DefaultOfflineStrategy implements OfflineStrategy {
  readonly name = "default";
  private cache: Map<string, CacheEntry> = new Map();

  registerEntry(entry: CacheEntry): void {
    this.cache.set(entry.url, entry);
  }

  async checkAvailability(url: string): Promise<boolean> {
    return this.cache.has(url);
  }

  async getOfflineEntry(url: string): Promise<CacheEntry | null> {
    return this.cache.get(url) ?? null;
  }

  isOfflineMode(): boolean {
    return !getNetworkMonitor().isOnline();
  }

  clear(): void {
    this.cache.clear();
  }

  getCachedUrls(): string[] {
    return Array.from(this.cache.keys());
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

export class AggressiveOfflineStrategy implements OfflineStrategy {
  readonly name = "aggressive";
  private entries: Map<string, CacheEntry> = new Map();
  private maxEntries = 500;

  async checkAvailability(url: string): Promise<boolean> {
    return this.entries.has(url);
  }

  async getOfflineEntry(url: string): Promise<CacheEntry | null> {
    const entry = this.entries.get(url);
    if (entry) {
      entry.metadata.accessedAt = Date.now();
      entry.metadata.accessCount++;
      return entry;
    }
    return null;
  }

  isOfflineMode(): boolean {
    return !getNetworkMonitor().isOnline();
  }

  registerEntry(entry: CacheEntry): void {
    if (this.entries.size >= this.maxEntries) {
      const oldest = Array.from(this.entries.values())
        .sort((a, b) => a.metadata.accessedAt - b.metadata.accessedAt)
        .shift();
      if (oldest) {
        this.entries.delete(oldest.url);
      }
    }
    this.entries.set(entry.url, { ...entry });
  }

  clear(): void {
    this.entries.clear();
  }
}

export function createOfflineStrategy(type: "default" | "aggressive" = "default"): OfflineStrategy {
  switch (type) {
    case "aggressive":
      return new AggressiveOfflineStrategy();
    default:
      return new DefaultOfflineStrategy();
  }
}
