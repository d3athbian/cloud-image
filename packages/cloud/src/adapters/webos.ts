import type { CacheEntry } from '../core/types';
import type { PlatformAdapter } from './types';

declare const webOS: {
  service: {
    request: (uri: string, params: { method: string; parameters?: Record<string, unknown>; onSuccess?: (r: { payload?: unknown }) => void; onFailure?: (r: { errorText: string }) => void }) => void;
  };
};

const CACHE_DIR = 'cloud_image_cache';

export class WebOSAdapter implements PlatformAdapter {
  readonly platform = 'webos' as const;
  private initialized = false;

  async init(): Promise<void> {
    if (typeof webOS === 'undefined') {
      throw new Error('webOS API not available');
    }
    this.initialized = true;
  }

  private getPath(url: string): string {
    const hash = btoa(url).replace(/[/+=]/g, '_').substring(0, 64);
    return `${CACHE_DIR}/${hash}`;
  }

  private async readFile(path: string): Promise<ArrayBuffer | null> {
    return new Promise((resolve) => {
      webOS.service.request(`luna://com.webos.service.db/${path}`, {
        method: 'get',
        onSuccess: (r) => {
          if (r.payload && typeof r.payload === 'object' && 'data' in r.payload) {
            const base64 = (r.payload as { data: string }).data;
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            resolve(bytes.buffer);
          } else {
            resolve(null);
          }
        },
        onFailure: () => resolve(null),
      });
      setTimeout(() => resolve(null), 500);
    });
  }

  async get(_url: string): Promise<CacheEntry | null> {
    if (!this.initialized) return null;
    const data = await this.readFile(this.getPath(_url));
    if (!data) return null;
    return null;
  }

  async set(_entry: CacheEntry): Promise<void> {}

  async delete(_url: string): Promise<boolean> {
    return true;
  }

  async has(_url: string): Promise<boolean> {
    return false;
  }

  async keys(): Promise<string[]> {
    return [];
  }

  async clear(): Promise<void> {}

  async getSize(): Promise<number> {
    return 0;
  }

  destroy(): void {
    this.initialized = false;
  }
}

export function createWebOSAdapter(): PlatformAdapter {
  return new WebOSAdapter();
}
