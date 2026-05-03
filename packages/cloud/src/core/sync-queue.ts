import { logger } from '../utils/logger';

const log = logger.ImageCache;

export interface PendingOperation {
  id: string;
  type: 'set' | 'delete' | 'prefetch';
  url: string;
  data?: ArrayBuffer;
  metadata?: Record<string, unknown>;
  timestamp: number;
  retries: number;
}

export interface SyncQueue {
  enqueue(op: Omit<PendingOperation, 'id' | 'timestamp' | 'retries'>): string;
  dequeue(): PendingOperation | null;
  getAll(): PendingOperation[];
  remove(id: string): boolean;
  getLength(): number;
  clear(): void;
}

class MemorySyncQueue implements SyncQueue {
  private queue: PendingOperation[] = [];

  enqueue(op: Omit<PendingOperation, 'id' | 'timestamp' | 'retries'>): string {
    const operation: PendingOperation = {
      ...op,
      id: this.generateId(),
      timestamp: Date.now(),
      retries: 0,
    };
    this.queue.push(operation);
    log.info('[SyncQueue] Enqueued:', operation.type, operation.url);
    return operation.id;
  }

  dequeue(): PendingOperation | null {
    const item = this.queue.shift();
    return item ?? null;
  }

  getAll(): PendingOperation[] {
    return [...this.queue];
  }

  remove(id: string): boolean {
    const index = this.queue.findIndex((op) => op.id === id);
    if (index === -1) return false;
    this.queue.splice(index, 1);
    return true;
  }

  getLength(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

class PersistedSyncQueue implements SyncQueue {
  private queue: PendingOperation[] = [];
  private dbName = '__CLOUD_SYNC_QUEUE__';
  private storeName = 'pending';
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      const request = indexedDB.open(this.dbName, 1);

      return new Promise((resolve, reject) => {
        request.onerror = () => reject(request.error);
        request.onsuccess = async () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName, { keyPath: 'id' });
          }
          this.initialized = true;
          await this.loadFromDB();
          resolve();
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName, { keyPath: 'id' });
          }
        };
      });
    } catch (e) {
      log.warn('[SyncQueue] IndexedDB init failed:', e);
    }
  }

  private async loadFromDB(): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.getAll();

      return new Promise((resolve) => {
        request.onsuccess = () => {
          this.queue = request.result || [];
          this.initialized = true;
          resolve();
        };
        request.onerror = () => resolve();
      });
    } catch (e) {
      log.warn('[SyncQueue] Load from DB failed:', e);
    }
  }

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  enqueue(op: Omit<PendingOperation, 'id' | 'timestamp' | 'retries'>): string {
    const operation: PendingOperation = {
      ...op,
      id: this.generateId(),
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(operation);
    this.saveToDB(operation).catch(() => {});

    log.info('[SyncQueue] Enqueued:', operation.type, operation.url);
    return operation.id;
  }

  private async saveToDB(op: PendingOperation): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      store.put(op);
    } catch (e) {
      log.warn('[SyncQueue] Save to DB failed:', e);
    }
  }

  dequeue(): PendingOperation | null {
    if (this.queue.length === 0) return null;
    const op = this.queue.shift();
    if (op) {
      this.removeFromDB(op.id).catch(() => {});
    }
    return op ?? null;
  }

  getAll(): PendingOperation[] {
    return [...this.queue];
  }

  remove(id: string): boolean {
    const index = this.queue.findIndex((op) => op.id === id);
    if (index === -1) return false;
    this.queue.splice(index, 1);
    this.removeFromDB(id).catch(() => {});
    return true;
  }

  private async removeFromDB(id: string): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      store.delete(id);
    } catch (e) {
      log.warn('[SyncQueue] Remove from DB failed:', e);
    }
  }

  getLength(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
    this.openDB()
      .then((db) => {
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        store.clear();
      })
      .catch((e) => {
        log.warn('[SyncQueue] Clear DB failed:', e);
      });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class SyncQueueManager {
  private memoryQueue: MemorySyncQueue;
  private persistedQueue: PersistedSyncQueue | null = null;
  private usePersistence: boolean;

  constructor(options: { usePersistence?: boolean } = {}) {
    this.memoryQueue = new MemorySyncQueue();
    this.usePersistence = options.usePersistence ?? true;
  }

  async init(): Promise<void> {
    if (this.usePersistence) {
      this.persistedQueue = new PersistedSyncQueue();
      await this.persistedQueue.init();
    }
  }

  enqueue(op: Omit<PendingOperation, 'id' | 'timestamp' | 'retries'>): string {
    if (this.persistedQueue) {
      return this.persistedQueue.enqueue(op);
    }
    return this.memoryQueue.enqueue(op);
  }

  dequeue(): PendingOperation | null {
    if (this.persistedQueue) {
      return this.persistedQueue.dequeue();
    }
    return this.memoryQueue.dequeue();
  }

  getAll(): PendingOperation[] {
    if (this.persistedQueue) {
      return this.persistedQueue.getAll();
    }
    return this.memoryQueue.getAll();
  }

  remove(id: string): boolean {
    if (this.persistedQueue) {
      return this.persistedQueue.remove(id);
    }
    return this.memoryQueue.remove(id);
  }

  getLength(): number {
    if (this.persistedQueue) {
      return this.persistedQueue.getLength();
    }
    return this.memoryQueue.getLength();
  }

  clear(): void {
    if (this.persistedQueue) {
      this.persistedQueue.clear();
    }
    this.memoryQueue.clear();
  }

  hasPending(): boolean {
    return this.getLength() > 0;
  }
}

let globalQueue: SyncQueueManager | null = null;

export function getSyncQueue(): SyncQueueManager {
  if (!globalQueue) {
    globalQueue = new SyncQueueManager();
    globalQueue.init();
  }
  return globalQueue;
}
