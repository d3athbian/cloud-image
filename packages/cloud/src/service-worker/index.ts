import type { SWRequest, SWResponse } from './sw';

export type MessageType = 
  | 'fetch'
  | 'cache-get'
  | 'cache-set'
  | 'cache-delete'
  | 'cache-clear'
  | 'stats'
  | 'ping'
  | 'init'
  | 'destroy';

export { generateMessageId, createSWRequest } from './sw';

export interface ServiceWorkerConfig {
  scope?: string;
  debug?: boolean;
}

export interface CloudEngineConfig {
  maxSize?: number;
  defaultTTL?: number;
  debug?: boolean;
}

const DEFAULT_CONFIG: Required<CloudEngineConfig> = {
  maxSize: 100 * 1024 * 1024,
  defaultTTL: 7 * 24 * 60 * 60 * 1000,
  debug: false,
};

class ServiceWorkerClient {
  private registration: ServiceWorkerRegistration | null = null;
  private controller: ServiceWorker | null = null;
  private pending = new Map<string, { resolve: (r: SWResponse) => void; reject: (e: Error) => void }>();
  private debug: boolean;
  private fallbackMode = false;
  private memoryCache = new Map<string, { data: ArrayBuffer; metadata: Record<string, unknown> }>();
  private stats = {
    hits: 0,
    misses: 0,
    itemCount: 0,
    totalSize: 0,
    evictionCount: 0,
  };

  constructor(debug = false) {
    this.debug = debug;
  }

  async init(config?: ServiceWorkerConfig): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      this.fallbackMode = true;
      this.log('[SW Client] Service Workers not supported, using fallback mode');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register(
        '/sw.js',
        config?.scope ? { scope: config.scope } : undefined
      );

      this.log('[SW Client] Service Worker registered');

      if (this.registration.active) {
        this.controller = this.registration.active;
      } else if (this.registration.installing) {
        await new Promise<void>((resolve) => {
          if (this.registration?.installing) {
            this.registration.installing.addEventListener('statechange', () => {
              if (this.registration?.active) {
                this.controller = this.registration.active;
                resolve();
              }
            });
          }
        });
      }

      navigator.serviceWorker.addEventListener('message', this.handleMessage.bind(this));
      
      return true;
    } catch (error) {
      this.fallbackMode = true;
      this.log('[SW Client] SW registration failed, using fallback:', error);
      return false;
    }
  }

  private handleMessage(event: MessageEvent<SWResponse>): void {
    const pending = this.pending.get(event.data.id);
    if (pending) {
      pending.resolve(event.data);
      this.pending.delete(event.data.id);
    }
  }

  private async sendMessage<T>(type: MessageType, payload?: unknown): Promise<SWResponse<T>> {
    if (this.fallbackMode) {
      return this.fallbackMessage<T>(type, payload);
    }

    const request = createSWRequest<T>(type, payload);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(request.id);
        reject(new Error(`Message ${type} timed out`));
      }, 30000);

      this.pending.set(request.id, {
        resolve: resolve as (r: SWResponse) => void,
        reject,
      });

      if (this.controller) {
        this.controller.postMessage(request);
      } else {
        this.fallbackMessage<T>(type, payload)
          .then(resolve)
          .catch(reject);
      }
    });
  }

  private async fallbackMessage<T>(type: MessageType, payload?: unknown): Promise<SWResponse<T>> {
    const id = crypto.randomUUID();
    
    switch (type) {
      case 'fetch': {
        const { url } = payload as { url: string };
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          
          this.memoryCache.set(url, {
            data: arrayBuffer,
            metadata: {
              size: arrayBuffer.byteLength,
              mimeType: blob.type,
              cachedAt: Date.now(),
              accessedAt: Date.now(),
              accessCount: 1,
            },
          });

          this.stats.itemCount = this.memoryCache.size;
          this.stats.hits++;
          this.stats.totalSize += arrayBuffer.byteLength;

          const blobUrl = URL.createObjectURL(blob);
          return { id, type: 'success', payload: { blobUrl, fromCache: false, size: arrayBuffer.byteLength, mimeType: blob.type } } as SWResponse<T>;
        } catch (error) {
          this.stats.misses++;
          return { id, type: 'error', error: error instanceof Error ? error.message : 'Fetch failed' } as SWResponse<T>;
        }
      }
      case 'stats': {
        return { id, type: 'success', payload: this.stats } as SWResponse<T>;
      }
      case 'cache-clear': {
        this.memoryCache.clear();
        this.stats = { hits: 0, misses: 0, itemCount: 0, totalSize: 0, evictionCount: 0 };
        return { id, type: 'success', payload: { cleared: true } } as SWResponse<T>;
      }
      case 'ping': {
        return { id, type: 'success', payload: { alive: true } } as SWResponse<T>;
      }
      default:
        return { id, type: 'error', error: 'Operation not supported in fallback mode' } as SWResponse<T>;
    }
  }

  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log(...args);
    }
  }

  isFallbackMode(): boolean {
    return this.fallbackMode;
  }

  isReady(): boolean {
    return !this.fallbackMode || this.controller !== null;
  }

  async get(url: string): Promise<string | null> {
    this.log('[SW Client] Getting:', url);

    if (this.fallbackMode) {
      const response = await this.sendMessage<{ blobUrl: string; fromCache: boolean; size: number; mimeType: string }>('fetch', { url });
      if (response.type === 'success' && response.payload) {
        return response.payload.blobUrl;
      }
      return null;
    }

    try {
      const response = await this.sendMessage<{ blobUrl: string; fromCache: boolean; size: number; mimeType: string }>('fetch', { url });
      
      if (response.type === 'success' && response.payload) {
        return response.payload.blobUrl;
      }
      
      return null;
    } catch (error) {
      this.log('[SW Client] Get failed:', error);
      return null;
    }
  }

  async set(url: string, data: ArrayBuffer, metadata: Record<string, unknown>): Promise<void> {
    if (this.fallbackMode) {
      this.memoryCache.set(url, { data, metadata });
      return;
    }

    await this.sendMessage('cache-set', { url, data, metadata });
  }

  async delete(url: string): Promise<boolean> {
    if (this.fallbackMode) {
      return this.memoryCache.delete(url);
    }

    const response = await this.sendMessage<{ deleted: boolean }>('cache-delete', { url });
    return response.type === 'success' && response.payload?.deleted === true;
  }

  async clear(): Promise<void> {
    if (this.fallbackMode) {
      this.memoryCache.clear();
      return;
    }

    await this.sendMessage('cache-clear');
  }

  async getStats(): Promise<typeof this.stats> {
    if (this.fallbackMode) {
      return this.stats;
    }

    const response = await this.sendMessage<typeof this.stats>('stats');
    return response.payload || this.stats;
  }

  async ping(): Promise<boolean> {
    try {
      const response = await this.sendMessage<{ alive: boolean }>('ping');
      return response.type === 'success' && response.payload?.alive === true;
    } catch {
      return this.fallbackMode;
    }
  }
}

let clientInstance: ServiceWorkerClient | null = null;

export function createCloudEngine(config?: CloudEngineConfig): ServiceWorkerClient {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  if (!clientInstance) {
    clientInstance = new ServiceWorkerClient(finalConfig.debug);
  }
  
  return clientInstance;
}

export { ServiceWorkerClient };
export type { CloudEngineConfig as CloudEngineConfig };
export type { ServiceWorkerConfig };