import { useState, useEffect, useRef } from 'react';
import type { CacheStats } from '@cloudimage/cloud';

export function useCacheStats(cache: ReturnType<typeof import('@cloudimage/cloud')['CloudProvider']>['cache'], refreshInterval = 2000) {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const cacheRef = useRef(cache);

  cacheRef.current = cache;

  useEffect(() => {
    const updateStats = async () => {
      if (cacheRef.current) {
        const s = await cacheRef.current.getStats();
        setStats(s);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const clearStats = () => {
    setStats({ itemCount: 0, totalSize: 0, hitRate: 0, missRate: 0, evictionCount: 0 });
  };

  return { stats, clearStats };
}
