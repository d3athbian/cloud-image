import { CacheConfig, CacheEntry, CacheStats, DEFAULT_CACHE_CONFIG } from './types';
import { ImageCache } from './cache';
import { createAdapter, type PlatformAdapter } from '../adapters/factory';
import { createCloudEngine, ServiceWorkerClient } from '../service-worker/index';
import { CircuitBreaker } from './circuit-breaker';
import { ImageValidator } from './image-validator';
import { Time } from '../config/constants';
import { logger } from '../utils/logger';
import { getNetworkMonitor, type NetworkStatus } from './network';

const log = logger.ImageEngine;

export class ImageEngine {
  private cache: ImageCache;
  private swClient: ServiceWorkerClient;
  private networkMonitor = getNetworkMonitor();
  private adapter: PlatformAdapter | null = null;
  private platform: string = 'memory';
  private pendingRequests: Map<string, Promise<string | null>> = new Map();
  private activeControllers: Map<string, AbortController> = new Map();
  private debug: boolean;
  private circuitBreaker: CircuitBreaker;
  private objectURLs: Set<string> = new Set();
  private imageValidator: ImageValidator;

  constructor(config: Partial<CacheConfig> = {}) {
    const finalConfig = { ...config };
    this.debug = finalConfig.debug ?? false;
    this.imageValidator = new ImageValidator({ maxSize: finalConfig.maxSize });
    
    this.adapter = createAdapter({ platformOverride: finalConfig.platformOverride });
    this.platform = this.adapter.platform;
    this.cache = new ImageCache(finalConfig);
    this.cache.setAdapter(this.adapter);
    this.swClient = createCloudEngine({ debug: this.debug });
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: Time.CIRCUIT_BREAKER_RESET,
    });
  }

  async init(): Promise<void> {
    this.log('[ImageEngine] Starting init...');
    this.cache.init();
    
    this.log('[ImageEngine] SW init starting...');
    try {
      const swEnabled = await this.swClient.init();
      
      if (!swEnabled) {
        this.log('[ImageEngine] Service Worker unavailable, using fallback mode');
      } else {
        this.log('[ImageEngine] Service Worker active');
      }
    } catch (err) {
      this.log('[ImageEngine] SW init failed:', err);
    }
    
    this.log(`[ImageEngine] Initialized with ${this.platform} adapter`);
  }

  private translateError(error: unknown, context: string): string {
    if (error instanceof Error) {
      if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
        return 'network_unavailable';
      }
      if (error.message.includes('QuotaExceeded') || error.message.includes('quota')) {
        return 'storage_full';
      }
      if (error.message.includes('InvalidState') || error.message.includes('closing')) {
        return 'storage_corrupted';
      }
      if (error.message.includes('timeout')) {
        return 'timeout';
      }
    }
    return context;
  }

  private onAdapterError?(error: unknown, operation: 'get' | 'set' | 'delete'): void;

  setAdapterErrorCallback(callback: (error: unknown, operation: 'get' | 'set' | 'delete') => void): void {
    this.onAdapterError = callback;
  }

  private shouldUseOfflineFallback(): boolean {
    const status = this.networkMonitor.getStatus();
    return !status.online || status.bandwidth === 'unknown';
  }

  async get(url: string): Promise<string | null> {
    // Bandwidth unknown or offline → direct to cache fallback (NO network)
    if (this.shouldUseOfflineFallback()) {
      this.log('[ImageEngine] Offline/unknown bandwidth, skipping network');
      // Skip directly to adapter fallback
    } else if (!this.swClient.isFallbackMode()) {
      if (this.pendingRequests.has(url)) {
        return this.pendingRequests.get(url)!;
      }

      // Check circuit breaker before attempting network request
      const cbState = this.circuitBreaker.getState();
      if (cbState === 'open') {
        this.log('[ImageEngine] Circuit breaker open, skipping network');
      } else {
        const pending = this.swClient.get(url);
        this.pendingRequests.set(url, pending);
        
        try {
          const result = await pending;
          this.pendingRequests.delete(url);
          this.circuitBreaker.recordSuccess();
          return result;
        } catch (error) {
          this.pendingRequests.delete(url);
          this.circuitBreaker.recordFailure();
          this.log('[ImageEngine] SW get failed:', this.translateError(error, 'sw_error'));
        }
      }
    }
    
    // Fallback: use adapter directly (web/memory adapter with IndexedDB)
    try {
      const entry = await this.cache.get(url);
      if (entry) {
        const blob = new Blob([entry.data], { type: entry.metadata.mimeType });
        const objectUrl = URL.createObjectURL(blob);
        this.objectURLs.add(objectUrl);
        return objectUrl;
      }
    } catch (adapterError) {
      this.log('[ImageEngine] Adapter failed:', this.translateError(adapterError, 'adapter_error'));
    }
    
    // Final fallback: direct fetch with circuit breaker protection
    try {
      const controller = new AbortController();
      this.activeControllers.set(url, controller);
      
      const response = await this.circuitBreaker.execute(async () => {
        const cbState = this.circuitBreaker.getState();
        if (cbState === 'open') {
          throw new Error('Circuit breaker open');
        }
        return await fetch(url, { signal: controller.signal });
      });
      
      this.activeControllers.delete(url);
      
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      
      // Image validation - only cache if valid, but ALWAYS return image to user
      const validation = await this.imageValidator.validate(arrayBuffer);
      
      if (!validation.valid) {
        log.warn(`Image validation failed for ${url}: ${validation.error}`);
      }
      
      // Non-blocking cache write - only cache if valid, but return image anyway
      if (validation.valid) {
        const newEntry: CacheEntry = {
          url,
          data: arrayBuffer,
          metadata: {
            size: arrayBuffer.byteLength,
            mimeType: blob.type,
            cachedAt: Date.now(),
            accessedAt: Date.now(),
            accessCount: 1,
          },
          qualityTier: 'high',
          upgradeable: false,
          state: 'validated',
        };
        
        this.cache.set(newEntry).catch(err => {
          this.log('[ImageEngine] Cache write failed (non-blocking):', err);
          if (this.onAdapterError) {
            this.onAdapterError(err, 'set');
          }
        });
      }
      
      const objectUrl = URL.createObjectURL(blob);
      this.objectURLs.add(objectUrl);
      return objectUrl;
    } catch (fetchError) {
      this.activeControllers.delete(url);
      this.circuitBreaker.recordFailure();
      this.log('[ImageEngine] All fallbacks failed:', this.translateError(fetchError, 'fetch_error'));
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
      state: 'cached',
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

  async updateViewportStatus(url: string, isInViewport: boolean): Promise<void> {
    await this.cache.updateViewportStatus(url, isInViewport);
  }

  getNetworkStatus() {
    return this.networkMonitor.getStatus();
  }

  getNetworkMonitor() {
    return this.networkMonitor;
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

  has(url: string): boolean {
    return this.cache.has(url);
  }

  destroy(): void {
    // Cancel all in-flight requests
    for (const [url, controller] of this.activeControllers) {
      controller.abort(new Error('ImageEngine destroyed'));
      this.log(`[ImageEngine] Aborted request: ${url}`);
    }
    this.activeControllers.clear();
    
    // Clean up all created object URLs to prevent memory leaks
    for (const url of this.objectURLs) {
      URL.revokeObjectURL(url);
    }
    this.objectURLs.clear();
    
    if (this.adapter) {
      this.adapter.destroy();
    }
    this.cache.clear();
  }

  private log(...args: unknown[]): void {
    if (this.debug) {
      log.debug(...args);
    }
  }
}