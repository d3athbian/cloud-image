import type { DecodedImage } from './decoder';

export interface CacheEntry {
  url: string;
  data: ArrayBuffer;
  metadata: CacheMetadata;
  qualityTier: 'low' | 'medium' | 'high';
  upgradeable: boolean;
  cachedBandwidth?: number;
  expiresAt?: number;
}

export interface CacheMetadata {
  size: number;
  width?: number;
  height?: number;
  mimeType: string;
  cachedAt: number;
  accessedAt: number;
  accessCount: number;
  etag?: string;
  lastModified?: string;
}

export interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  evictionBatchSize: number;
}

const DEFAULT_CONFIG: Required<CacheConfig> = {
  maxSize: 100 * 1024 * 1024,
  defaultTTL: 7 * 24 * 60 * 60 * 1000,
  evictionBatchSize: 0.2,
};

const DB_NAME = 'carbon-image-cache';
const STORE_NAME = 'images';
const DB_VERSION = 1;

let db: IDBDatabase | null = null;

async function openDB(): Promise<IDBDatabase> {
  if (db) return db;
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'url' });
      }
    };
  });
}

async function getFromIDB(url: string): Promise<CacheEntry | null> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(url);
    
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function saveToIDB(entry: CacheEntry): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(entry);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function deleteFromIDB(url: string): Promise<boolean> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(url);
    request.onsuccess = () => resolve(true);
    request.onerror = () => resolve(false);
  });
}

async function clearIDB(): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getAllFromIDB(): Promise<CacheEntry[]> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export class CacheManager {
  private config: Required<CacheConfig>;
  private hits = 0;
  private misses = 0;
  private evictionCount = 0;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config } as Required<CacheConfig>;
  }

  async get(url: string): Promise<CacheEntry | null> {
    const entry = await getFromIDB(url);
    
    if (!entry) {
      this.misses++;
      return null;
    }

    if (this.isExpired(entry)) {
      await this.delete(url);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry;
  }

  async set(entry: CacheEntry): Promise<{ stored: boolean; evictedCount: number }> {
    const newEntry: CacheEntry = {
      ...entry,
      metadata: {
        ...entry.metadata,
        cachedAt: Date.now(),
        accessedAt: Date.now(),
        accessCount: entry.metadata.accessCount || 1,
      },
    };

    await saveToIDB(newEntry);

    return {
      stored: true,
      evictedCount: 0,
    };
  }

  async delete(url: string): Promise<boolean> {
    return deleteFromIDB(url);
  }

  async clear(): Promise<void> {
    await clearIDB();
  }

  getStats() {
    return {
      itemCount: 0,
      totalSize: 0,
      hitRate: this.hits / (this.hits + this.misses) || 0,
      missRate: this.misses / (this.hits + this.misses) || 0,
      evictionCount: this.evictionCount,
    };
  }

  private isExpired(entry: CacheEntry): boolean {
    if (entry.expiresAt) {
      return entry.expiresAt < Date.now();
    }
    return Date.now() - entry.metadata.cachedAt > this.config.defaultTTL;
  }
}

let cacheManagerInstance: CacheManager | null = null;

export function getCacheManager(config?: Partial<CacheConfig>): CacheManager {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager(config);
  }
  return cacheManagerInstance;
}