import type { CacheEntry } from '../core/types';
import type { PlatformAdapter } from './types';

declare const tizen: {
  filesystem: {
    resolve: (
      path: string,
      successCallback: (dir: { readFile: (path: string, callback: (data: ArrayBuffer) => void) => void; writeFile: (path: string, data: ArrayBuffer, callback: () => void) => void; createFile: (path: string) => { write: (data: ArrayBuffer, callback: () => void) => void } }) => void,
      errorCallback?: (e: Error) => void,
      type?: string
    ) => void;
  };
};

const BASE_PATH = 'images';

export class TizenAdapter implements PlatformAdapter {
  readonly platform = 'tizen' as const;
  private baseDir: { readFile: (path: string, cb: (d: ArrayBuffer) => void) => void; writeFile: (path: string, data: ArrayBuffer, cb: () => void) => void } | null = null;

  async init(): Promise<void> {
    if (typeof tizen === 'undefined') {
      throw new Error('Tizen API not available');
    }

    return new Promise((resolve, reject) => {
      tizen.filesystem.resolve(
        BASE_PATH,
        (dir) => {
          this.baseDir = dir as { readFile: (path: string, cb: (d: ArrayBuffer) => void) => void; writeFile: (path: string, data: ArrayBuffer, cb: () => void) => void };
          resolve();
        },
        (e) => reject(new Error(`Tizen filesystem init failed: ${e}`)),
        'rw'
      );
    });
  }

  private getPath(url: string): string {
    const hash = btoa(url).replace(/[/+=]/g, '_').substring(0, 64);
    return `${hash}.bin`;
  }

  async get(url: string): Promise<CacheEntry | null> {
    if (!this.baseDir) return null;
    const path = this.getPath(url);
    
    return new Promise((resolve) => {
      this.baseDir!.readFile(path, (data) => {
        try {
          const entry = JSON.parse(new TextDecoder().decode(data.slice(0, 4096))) as CacheEntry;
          const actualData = data.slice(4096);
          entry.data = actualData;
          entry.metadata.accessedAt = Date.now();
          entry.metadata.accessCount++;
          resolve(entry);
        } catch {
          resolve(null);
        }
      });
      setTimeout(() => resolve(null), 100);
    });
  }

  async set(entry: CacheEntry): Promise<void> {
    if (!this.baseDir) return;
    const path = this.getPath(entry.url);
    const meta = JSON.stringify({ ...entry, data: undefined });
    const metaBytes = new TextEncoder().encode(meta);
    const combined = new Uint8Array(metaBytes.length + entry.data.byteLength);
    combined.set(metaBytes);
    combined.set(new Uint8Array(entry.data), metaBytes.length);

    return new Promise((resolve) => {
      this.baseDir!.writeFile(path, combined.buffer, () => resolve());
    });
  }

  async delete(url: string): Promise<boolean> {
    return true;
  }

  async has(url: string): Promise<boolean> {
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
    this.baseDir = null;
  }
}

export function createTizenAdapter(): PlatformAdapter {
  return new TizenAdapter();
}
