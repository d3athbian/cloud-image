import {
  CacheConfig,
  CacheEntry,
  CacheStats,
  CircuitBreakerConfig,
  CircuitBreakerState,
  NetworkStatus,
  WorkerMessage,
  WorkerResponse,
} from './types';
import { ImageCache } from './cache';

export class ImageEngine {
  private cache: ImageCache;
  private worker: Worker | null = null;
  private messageHandlers: Map<string, (response: WorkerResponse) => void> = new Map();
  private circuitBreaker: CircuitBreaker;
  private networkStatus: NetworkStatus = {
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    bandwidth: 'unknown',
  };

  constructor(config: Partial<CacheConfig> = {}) {
    this.cache = new ImageCache(config);
    this.circuitBreaker = new CircuitBreaker();
    this.setupNetworkListeners();
  }

  async init(): Promise<void> {
    this.worker = this.createEmbeddedWorker();
    await this.setupWorkerCommunication();
  }

  async get(url: string): Promise<string | null> {
    const cached = await this.cache.get(url);
    
    if (cached) {
      const blob = new Blob([cached.data], { type: cached.metadata.mimeType });
      return URL.createObjectURL(blob);
    }

    if (this.circuitBreaker.getState() === 'open') {
      return null;
    }

    try {
      const result = await this.fetchFromWorker(url);
      if (result) {
        return result;
      }
      this.circuitBreaker.recordSuccess();
      return null;
    } catch {
      this.circuitBreaker.recordFailure();
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
  }

  async delete(url: string): Promise<boolean> {
    return this.cache.delete(url);
  }

  async clear(): Promise<void> {
    await this.cache.clear();
  }

  async getStats(): Promise<CacheStats> {
    return this.cache.getStats();
  }

  getNetworkStatus(): NetworkStatus {
    return { ...this.networkStatus };
  }

  getCircuitBreakerState(): CircuitBreakerState {
    return this.circuitBreaker.getState();
  }

  destroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.cache.clear();
  }

  private createEmbeddedWorker(): Worker {
    const workerCode = `
      self.onmessage = async (event) => {
        const { id, type, payload } = event.data;
        
        try {
          switch (type) {
            case 'fetch':
              const response = await fetch(payload.url);
              const blob = await response.blob();
              const arrayBuffer = await blob.arrayBuffer();
              self.postMessage({ id, type: 'success', payload: { data: arrayBuffer, mimeType: blob.type } });
              break;
            default:
              self.postMessage({ id, type: 'error', error: 'Unknown message type' });
          }
        } catch (error) {
          self.postMessage({ id, type: 'error', error: error.message });
        }
      };
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    return new Worker(URL.createObjectURL(blob));
  }

  private setupWorkerCommunication(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.worker) {
        resolve();
        return;
      }

      this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const handler = this.messageHandlers.get(event.data.id);
        if (handler) {
          handler(event.data);
          this.messageHandlers.delete(event.data.id);
        }
      };

      resolve();
    });
  }

  private async fetchFromWorker(url: string): Promise<string | null> {
    if (!this.worker) {
      return this.fetchDirect(url);
    }

    return new Promise((resolve) => {
      const id = crypto.randomUUID();
      
      this.messageHandlers.set(id, async (response) => {
        if (response.type === 'success' && response.payload) {
          const { data, mimeType } = response.payload as { data: ArrayBuffer; mimeType: string };
          await this.set(url, data, {
            size: data.byteLength,
            mimeType,
            cachedAt: Date.now(),
            accessedAt: Date.now(),
            accessCount: 0,
          });
          const blob = new Blob([data], { type: mimeType });
          resolve(URL.createObjectURL(blob));
        } else {
          resolve(null);
        }
      });

      this.worker!.postMessage({ id, type: 'fetch', payload: { url } });
    });
  }

  private async fetchDirect(url: string): Promise<string | null> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      await this.set(url, arrayBuffer, {
        size: arrayBuffer.byteLength,
        mimeType: blob.type,
        cachedAt: Date.now(),
        accessedAt: Date.now(),
        accessCount: 0,
      });
      return URL.createObjectURL(blob);
    } catch {
      return null;
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

class CircuitBreaker {
  private state: CircuitBreakerState = 'closed';
  private failures = 0;
  private lastFailureTime = 0;
  private config: CircuitBreakerConfig = {
    failureThreshold: 3,
    resetTimeout: 30000,
  };

  getState(): CircuitBreakerState {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
        this.state = 'half-open';
      }
    }
    return this.state;
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.config.failureThreshold) {
      this.state = 'open';
    }
  }

  recordSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }
}
