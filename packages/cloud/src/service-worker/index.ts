import { Time } from '../config/constants';
import { logger } from '../utils/logger';
import type { MessageType, ServiceWorkerConfig, SWResponse } from './service-worker.type';

const log = logger.ServiceWorker;

const DEFAULT_CONFIG: Required<ServiceWorkerConfig> = {
  scope: '/',
  debug: false,
  timeout: Time.CIRCUIT_BREAKER_RESET,
};

function generateMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function createSWRequest(type: MessageType, payload?: unknown) {
  return {
    id: generateMessageId(),
    type,
    payload,
  } as { id: string; type: MessageType; payload?: unknown };
}

class ServiceWorkerClient {
  private registration: ServiceWorkerRegistration | null = null;
  private controller: ServiceWorker | null = null;
  private pending = new Map<
    string,
    { resolve: (r: SWResponse) => void; reject: (e: Error) => void }
  >();
  private debug: boolean;
  private fallbackMode = false;
  private memoryCache = new Map<string, { data: ArrayBuffer; metadata: Record<string, unknown> }>();
  private config: Required<ServiceWorkerConfig> = DEFAULT_CONFIG;
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
    if (config) {
      this.config = {
        scope: config.scope ?? DEFAULT_CONFIG.scope,
        debug: config.debug ?? DEFAULT_CONFIG.debug,
        timeout: config.timeout ?? DEFAULT_CONFIG.timeout,
      };
    }

    if (!('serviceWorker' in navigator)) {
      this.fallbackMode = true;
      this.log('[SW Client] Service Workers not supported, using fallback mode');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register(
        '/sw.js',
        this.config.scope !== DEFAULT_CONFIG.scope ? { scope: this.config.scope } : undefined,
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

  private async sendMessage(type: MessageType, payload?: unknown): Promise<SWResponse> {
    if (this.fallbackMode) {
      return this.fallbackMessage(type, payload);
    }

    const request = createSWRequest(type, payload);

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pending.delete(request.id);
        reject(new Error(`Message ${type} timed out`));
      }, this.config.timeout);

      const cleanup = () => clearTimeout(timeoutId);

      this.pending.set(request.id, {
        resolve: (response) => {
          cleanup();
          resolve(response);
        },
        reject: (error) => {
          cleanup();
          reject(error);
        },
      });

      if (this.controller) {
        this.controller.postMessage(request);
      } else {
        this.fallbackMessage(type, payload)
          .then((response) => {
            cleanup();
            resolve(response);
          })
          .catch((error) => {
            cleanup();
            reject(error);
          });
      }
    });
  }

  private async fallbackMessage(type: MessageType, payload?: unknown): Promise<SWResponse> {
    const id = generateMessageId();

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
          this.stats.misses++;
          this.stats.totalSize += arrayBuffer.byteLength;

          const blobUrl = URL.createObjectURL(blob);
          return {
            id,
            type: 'success',
            payload: {
              blobUrl,
              fromCache: false,
              size: arrayBuffer.byteLength,
              mimeType: blob.type,
            },
          };
        } catch (error) {
          this.stats.misses++;
          return {
            id,
            type: 'error',
            error: error instanceof Error ? error.message : 'Fetch failed',
          };
        }
      }
      case 'stats': {
        return { id, type: 'success', payload: this.stats };
      }
      case 'cache-clear': {
        this.memoryCache.clear();
        this.stats = { hits: 0, misses: 0, itemCount: 0, totalSize: 0, evictionCount: 0 };
        return { id, type: 'success', payload: { cleared: true } };
      }
      case 'ping': {
        return { id, type: 'success', payload: { alive: true } };
      }
      default:
        return { id, type: 'error', error: 'Operation not supported in fallback mode' };
    }
  }

  private log(...args: unknown[]): void {
    if (this.debug) {
      log.debug.apply(log, args as [string, ...unknown[]]);
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
      const response = await this.sendMessage('fetch', { url });
      if (response.type === 'success' && response.payload) {
        const payload = response.payload as {
          blobUrl: string;
          fromCache: boolean;
          size: number;
          mimeType: string;
        };
        return payload.blobUrl;
      }
      return null;
    }

    try {
      const response = await this.sendMessage('fetch', { url });

      if (response.type === 'success' && response.payload) {
        const payload = response.payload as {
          found: boolean;
          metadata?: Record<string, unknown>;
          data?: ArrayBuffer;
        };
        if (payload.found && payload.data) {
          const arrayBuffer = payload.data;
          const blob = new Blob([arrayBuffer], {
            type: (payload.metadata?.mimeType as string) || 'image/jpeg',
          });
          return URL.createObjectURL(blob);
        }
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

    const response = await this.sendMessage('cache-delete', { url });
    const payload = response.payload as { deleted?: boolean } | undefined;
    return response.type === 'success' && payload?.deleted === true;
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

    const response = await this.sendMessage('stats');
    return (response.payload as typeof this.stats) || this.stats;
  }

  async ping(): Promise<boolean> {
    try {
      const response = await this.sendMessage('ping');
      const payload = response.payload as { alive?: boolean } | undefined;
      return response.type === 'success' && payload?.alive === true;
    } catch {
      return this.fallbackMode;
    }
  }
}

let clientInstance: ServiceWorkerClient | null = null;

export function createCloudEngine(config?: ServiceWorkerConfig): ServiceWorkerClient {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  if (!clientInstance) {
    clientInstance = new ServiceWorkerClient(finalConfig.debug);
  }

  return clientInstance;
}

export { ServiceWorkerClient };
