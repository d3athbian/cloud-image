import { useCallback, useEffect, useRef, useState } from "react";
import { updateCache } from "../../core/system-atoms";
import type { CacheStats } from "../../core/types";

export interface CacheLike {
  getStats(): Promise<CacheStats>;
  prefetch(urls: string[]): Promise<CacheStats>;
  clear(): Promise<void>;
}

export function useCacheStats(cache: CacheLike | undefined, refreshInterval = 2000) {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const cacheRef = useRef(cache);

  cacheRef.current = cache;

  useEffect(() => {
    if (!cacheRef.current) return;

    const updateStats = async () => {
      if (cacheRef.current) {
        const s = await cacheRef.current.getStats();
        setStats(s);
        if ((s.hitCount ?? 0) > 0 || (s.missCount ?? 0) > 0) {
          updateCache({
            hitCount: s.hitCount ?? 0,
            missCount: s.missCount ?? 0,
            totalItems: s.itemCount ?? 0,
            lastAccessTime: Date.now(),
          });
        }
      }
    };

    updateStats();
    const interval = setInterval(updateStats, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const prefetch = useCallback(async (urls: string[]) => {
    if (!cacheRef.current) return null;
    setIsLoading(true);
    try {
      const result = await cacheRef.current.prefetch(urls);
      setStats(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback(async () => {
    if (!cacheRef.current) return null;
    setIsLoading(true);
    try {
      await cacheRef.current.clear();
      const result = await cacheRef.current.getStats();
      setStats(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { stats, isLoading, prefetch, clear };
}
