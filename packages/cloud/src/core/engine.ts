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
    // Try Service Worker first (preferred path for network interception)
    if (!this.swClient.isFallbackMode()) {
      if (this.pendingRequests.has(url)) {
        return this.pendingRequests.get(url)!;
      }

      const pending = this.swClient.get(url);
      this.pendingRequests.set(url, pending);
      
      try {
        const result = await pending;
        this.pendingRequests.delete(url);
        
        // Also cache locally via adapter for backup
        if (result && !result.includes('blob:')) {
          // SW returned URL directly, nothing to cache
        }
        
        return result;
      } catch (error) {
        this.pendingRequests.delete(url);
        this.log('[ImageEngine] SW get failed, trying adapter:', error);
        // Fall through to adapter fallback
      }
    }
    
    // Fallback: use adapter directly (web/memory adapter with IndexedDB)
    try {
      const entry = await this.cache.get(url);
      if (entry) {
        const blob = new Blob([entry.data], { type: entry.metadata.mimeType });
        return URL.createObjectURL(blob);
      }
    } catch (adapterError) {
      this.log('[ImageEngine] Adapter failed:', adapterError);
    }
    
    // Final fallback: direct fetch
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      
      // Cache for next time
      const newEntry: CacheEntry = {
        url,
        data: arrayBuffer,
        metadata: {
          size: arrayBuffer.byteLength,
          mimeType: blob.type,
          cachedAt: Date.now(),
          accessedAt: Date.now(),
          accessCount: 1,
          defaultTTL: 7 * 24 * 60 * 60 * 1000,
        },
        qualityTier: 'high',
        upgradeable: false,
      };
      await this.cache.set(newEntry);
      
      return URL.createObjectURL(blob);
    } catch (fetchError) {
      this.log('[ImageEngine] All fallbacks failed:', fetchError);
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