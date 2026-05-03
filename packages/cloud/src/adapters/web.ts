import { type IDBPDatabase, openDB } from 'idb';
import type { CacheEntry } from '../core/types';
import type { PlatformAdapter } from './types';

const DB_NAME = 'cloud-image-cache';
const STORE_NAME = 'images';
const DB_VERSION = 2;

interface CacheDB {
  images: {
    key: string;
    value: CacheEntry & { _id?: string };
  };
}

export class WebAdapter implements PlatformAdapter {
  readonly platform = 'web' as const;
  private db: IDBPDatabase<CacheDB> | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._init();
    return this.initPromise;
  }

  private async _init(): Promise<void> {
    this.db = await openDB<CacheDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'url' });
            store.createIndex('cachedAt', 'cachedAt', { unique: false });
          }
        } else if (oldVersion < 2) {
          if (db.objectStoreNames.contains(STORE_NAME)) {
            const tx = db.transaction(STORE_NAME, 'versionchange');
            const store = tx.objectStore(STORE_NAME);
            if (!store.indexNames.contains('cachedAt')) {
              store.createIndex('cachedAt', 'cachedAt', { unique: false });
            }
          }
        }
      },
    });
  }

  private async ensureDB(): Promise<IDBPDatabase<CacheDB>> {
    if (!this.db) {
      await this.init();
    }
    return this.db as IDBPDatabase<CacheDB>;
  }

  async get(url: string): Promise<CacheEntry | null> {
    const db = await this.ensureDB();
    const entry = await db.get(STORE_NAME, url);
    if (entry) {
      entry.metadata.accessedAt = Date.now();
      entry.metadata.accessCount++;
      await db.put(STORE_NAME, entry);
      return entry;
    }
    return null;
  }

  async set(entry: CacheEntry): Promise<void> {
    const db = await this.ensureDB();
    await db.put(STORE_NAME, { ...entry });
  }

  async delete(url: string): Promise<boolean> {
    const db = await this.ensureDB();
    const exists = await db.count(STORE_NAME, url);
    if (exists > 0) {
      await db.delete(STORE_NAME, url);
      return true;
    }
    return false;
  }

  async has(url: string): Promise<boolean> {
    const db = await this.ensureDB();
    const count = await db.count(STORE_NAME, url);
    return count > 0;
  }

  async keys(): Promise<string[]> {
    const db = await this.ensureDB();
    return db.getAllKeys(STORE_NAME) as Promise<string[]>;
  }

  async clear(): Promise<void> {
    const db = await this.ensureDB();
    await db.clear(STORE_NAME);
  }

  async getSize(): Promise<number> {
    const db = await this.ensureDB();
    const entries = await db.getAll(STORE_NAME);
    return entries.reduce((sum, e) => sum + e.metadata.size, 0);
  }

  destroy(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.initPromise = null;
  }
}

export function createWebAdapter(): PlatformAdapter {
  return new WebAdapter();
}

export default createWebAdapter;
