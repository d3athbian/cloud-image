import { type IDBPDatabase, openDB } from 'idb';
import { logger } from '../utils/logger';

const DB_NAME = 'cloud-state';
const STORE_NAME = 'state';
const DB_VERSION = 1;

interface StateDB {
  state: {
    key: string;
    data: unknown;
    timestamp: number;
  };
}

interface PendingWrite {
  key: string;
  data: unknown;
  timestamp: number;
  retries: number;
}

export interface StateSyncConfig {
  onSyncError?: (error: Error) => void;
  maxRetries?: number;
  dbName?: string;
}

export class StateSync {
  private db: IDBPDatabase<StateDB> | null = null;
  private queue: PendingWrite[] = [];
  private online = true;
  private initPromise: Promise<void> | null = null;
  private config: Required<StateSyncConfig>;
  private log = logger.StateSync;

  private boundHandleOnline = () => this.handleOnline();
  private boundHandleOffline = () => this.handleOffline();

  constructor(config: StateSyncConfig = {}) {
    this.config = {
      dbName: config.dbName ?? DB_NAME,
      onSyncError: config.onSyncError ?? (() => {}),
      maxRetries: config.maxRetries ?? 3,
    };

    if (typeof window !== 'undefined') {
      this.online = navigator.onLine;
      window.addEventListener('online', this.boundHandleOnline);
      window.addEventListener('offline', this.boundHandleOffline);
    }
  }

  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._init();
    return this.initPromise;
  }

  private async _init(): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      return;
    }

    this.db = await openDB<StateDB>(this.config.dbName, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      },
    });
  }

  async syncState<T>(key: string, data: T): Promise<void> {
    const timestamp = Date.now();

    try {
      await this.init();
      if (this.db) {
        await this.db.put(STORE_NAME, { key, data, timestamp });
      }
    } catch (error) {
      const err = error as Error;
      this.log.error(`[StateSync] Failed to sync ${key}:`, err?.message ?? error);
      this.queueWrite({ key, data, timestamp, retries: 0 });
      this.config.onSyncError(err ?? new Error(String(error)));
    }
  }

  async readState<T>(key: string): Promise<T | null> {
    try {
      await this.init();
      if (this.db) {
        const record = await this.db.get(STORE_NAME, key);
        if (record) {
          return record.data as T;
        }
      }
    } catch (error) {
      const err = error as Error;
      this.log.error(`[StateSync] Failed to read ${key}:`, err?.message ?? error);
    }
    return null;
  }

  async hydrate<T>(keys: string[], setter: (key: string, data: T) => void): Promise<void> {
    for (const key of keys) {
      const data = await this.readState<T>(key);
      if (data) {
        setter(key, data);
      }
    }
  }

  async flush(): Promise<void> {
    if (!this.online || this.queue.length === 0) {
      return;
    }

    const queue = [...this.queue];
    this.queue = [];

    for (const write of queue) {
      if (write.retries >= this.config.maxRetries) {
        this.log.warn(`[StateSync] Max retries reached for ${write.key}`);
        continue;
      }

      try {
        await this.init();
        if (this.db) {
          await this.db.put(STORE_NAME, {
            key: write.key,
            data: write.data,
            timestamp: write.timestamp,
          });
        }
      } catch {
        write.retries++;
        this.queue.push(write);
      }
    }
  }

  isOnline(): boolean {
    return this.online;
  }

  private queueWrite(write: PendingWrite): void {
    if (this.queue.length >= 10) {
      this.queue.shift();
    }
    this.queue.push(write);
  }

  private handleOnline(): void {
    this.online = true;
    this.log.info('[StateSync] Online - flushing queue');
    this.flush().catch(() => {});
  }

  private handleOffline(): void {
    this.online = false;
    this.log.info('[StateSync] Offline - queuing writes');
  }

  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.boundHandleOnline);
      window.removeEventListener('offline', this.boundHandleOffline);
    }
    this.queue = [];
  }
}
