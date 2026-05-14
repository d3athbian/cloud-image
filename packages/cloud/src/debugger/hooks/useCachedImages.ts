import { type IDBPDatabase, openDB } from 'idb';
import { useCallback, useEffect, useState } from 'react';
import type { CacheItemMetadata } from '../types/devtools.types';

interface CacheDB {
  images: {
    key: string;
    value: {
      url: string;
      data: ArrayBuffer;
      metadata: {
        size: number;
        mimeType: string;
        accessedAt: number;
        accessCount: number;
      };
      cachedAt: number;
      qualityTier: 'low' | 'medium' | 'high';
      upgradeable: boolean;
      state: string;
    };
  };
}

interface UseCachedImagesResult {
  items: CacheItemMetadata[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

const DB_NAME = 'cloud-image-cache';
const STORE_NAME = 'images';

export function useCachedImages(): UseCachedImagesResult {
  const [items, setItems] = useState<CacheItemMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refresh = useCallback(() => {
    setRefreshTrigger((n) => n + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadFromIndexedDB() {
      setIsLoading(true);
      setError(null);

      try {
        const db: IDBPDatabase<CacheDB> = await openDB<CacheDB>(DB_NAME, 2, {
          upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
              db.createObjectStore(STORE_NAME, { keyPath: 'url' });
            }
          },
        });

        const entries = await db.getAll(STORE_NAME);

        if (!isMounted) return;

        const cacheItems: CacheItemMetadata[] = entries.map((entry) => {
          const now = Date.now();
          const cachedAt = entry.cachedAt || Date.now();
          const ttl = entry.metadata?.accessCount > 0 ? 86400000 : 0; // Default 24h if accessed
          const expiresIn = ttl > 0 ? ttl - (now - cachedAt) : Infinity;

          // Calculate LRU score based on accessCount and recency
          const recencyFactor = Math.max(0, 1 - (now - cachedAt) / (7 * 24 * 60 * 60 * 1000)); // 7 days max
          const accessFactor = Math.min(1, (entry.metadata?.accessCount || 0) / 100);
          const lruScore = accessFactor * 0.6 + recencyFactor * 0.4;

          return {
            url: entry.url,
            key: entry.url,
            size: entry.metadata?.size || 0,
            mimeType: entry.metadata?.mimeType || 'image/jpeg',
            cachedAt: cachedAt,
            accessedAt: entry.metadata?.accessedAt || cachedAt,
            accessCount: entry.metadata?.accessCount || 0,
            ttl: ttl,
            expiresIn: Math.max(0, expiresIn),
            lruScore: lruScore,
            status: (entry.state === 'cached'
              ? 'active'
              : entry.state === 'expired'
                ? 'expired'
                : entry.state === 'evicted'
                  ? 'evicted'
                  : 'pinned') as 'active' | 'expired' | 'evicted' | 'pinned',
            source: 'idb' as const,
          };
        });

        setItems(cacheItems);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load cached images');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadFromIndexedDB();

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  return { items, isLoading, error, refresh };
}
