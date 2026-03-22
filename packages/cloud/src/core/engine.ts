import {
  CacheConfig,
  CacheEntry,
  CacheStats,
} from './types';
import { ImageCache } from './cache';
import { createAdapter, type PlatformAdapter } from '../adapters/factory';
import { createCloudEngine, ServiceWorkerClient } from '../service-worker/index';

export class ImageEngine {
  private cache: ImageCache;
  private swClient: ServiceWorkerClient;
  private networkStatus = {
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    bandwidth: 'unknown' as const,
  };
  private adapter: PlatformAdapter | null = null;
  private platform: string = 'memory';
  private pendingRequests: Map<string, Promise<string | null>> = new Map();
  private debug: boolean;

  constructor(config: Partial<CacheConfig> = {}) {
    const finalConfig = { ...config };
    this.debug = finalConfig.debug ?? false;
    
    this.adapter = createAdapter({ platformOverride: finalConfig.platformOverride });
    this.platform = this.adapter.platform;
    this.cache = new ImageCache(finalConfig);
    this.cache.setAdapter(this.adapter);
    this.swClient = createCloudEngine({ debug: this.debug });
    this.setupNetworkListeners();
  }

  async init(): Promise<void> {
    await this.cache.init();
    
    const swEnabled = await this.swClient.init();
    
    if (!swEnabled) {
      this.log('[ImageEngine] Service Worker unavailable, using fallback mode');
    } else {
      this.log('[ImageEngine] Service Worker active');
    }
    
    this.log(`[ImageEngine] Initialized with ${this.platform} adapter`);
  }

  async get(url: string): Promise<string | null> {
    if (this.swClient.isFallbackMode()) {
      return this.swClient.get(url);
    }

    if (this.pendingRequests.has(url)) {
      return this.pendingRequests.get(url)!;
    }

    const pending = this.swClient.get(url);
    this.pendingRequests.set(url, pending);
    
    try {
      const result = await pending;
      this.pendingRequests.delete(url);
      return result;
    } catch (error) {
      this.pendingRequests.delete(url);
      this.log('[ImageEngine] Get failed:', error);
      return null;
    }
  }

  async set(url: string, data: ArrayBuffer, metadata: CacheEntry['metadata']): Promise<void> {
    const entry: CacheEntry = {
      url,
      data,
      metadata,
      qualityTier: 'high',
      upgradeable: false,
    };
    await this.cache.set(entry);
    
    if (!this.swClient.isFallbackMode()) {
      await this.swClient.set(url, data, metadata);
    }
  }

  async delete(url: string): Promise<boolean> {
    const cacheDeleted = await this.cache.delete(url);
    
    if (!this.swClient.isFallbackMode()) {
      const swDeleted = await this.swClient.delete(url);
      return cacheDeleted || swDeleted;
    }
    
    return cacheDeleted;
  }

  async clear(): Promise<void> {
    await this.cache.clear();
    
    if (!this.swClient.isFallbackMode()) {
      await this.swClient.clear();
    }
  }

  async getStats(): Promise<CacheStats> {
    const cacheStats = await this.cache.getStats();
    
    if (!this.swClient.isFallbackMode()) {
      try {
        const swStats = await this.swClient.getStats();
        return {
          ...cacheStats,
          hitRate: swStats.hitRate,
          missRate: swStats.missRate,
          evictionCount: swStats.evictionCount,
        };
      } catch {
        return cacheStats;
      }
    }
    
    return cacheStats;
  }

  getNetworkStatus() {
    return { ...this.networkStatus };
  }

  getPlatform(): string {
    return this.platform;
  }

  isServiceWorkerActive(): boolean {
    return this.swClient.isReady();
  }

  isFallbackMode(): boolean {
    return this.swClient.isFallbackMode();
  }

  destroy(): void {
    if (this.adapter) {
      this.adapter.destroy();
    }
    this.cache.clear();
  }

  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log(...args);
    }
  }

  private setupNetworkListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.networkStatus.online = true;
    });

    window.addEventListener('offline', () => {
      this.networkStatus.online = false;
    });
  }
}