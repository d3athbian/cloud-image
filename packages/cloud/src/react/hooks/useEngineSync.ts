import { useCallback, useEffect, useRef } from 'react';
import type { EngineEventType } from '../../core/engine';
import { updateCache } from '../../core/system-atoms';

interface UseEngineSyncOptions {
  refreshInterval?: number;
}

export function useEngineSync(
  engine: {
    on: (event: EngineEventType, listener: (data: unknown) => void) => () => void;
    getStats: () => Promise<unknown>;
  } | null,
  options: UseEngineSyncOptions = {},
): void {
  const { refreshInterval = 2000 } = options;
  const engineRef = useRef(engine);
  engineRef.current = engine;

  const syncStats = useCallback(async () => {
    if (!engineRef.current) return;
    try {
      const stats = (await engineRef.current.getStats()) as {
        hitCount?: number;
        missCount?: number;
        itemCount?: number;
        totalSize?: number;
      };
      console.log('[useEngineSync] getStats result:', stats);
      if (stats && (stats.hitCount !== undefined || stats.missCount !== undefined)) {
        updateCache({
          hitCount: stats.hitCount ?? 0,
          missCount: stats.missCount ?? 0,
          totalItems: stats.itemCount ?? 0,
          totalSize: stats.totalSize ?? 0,
          lastAccessTime: Date.now(),
        });
        console.log('[useEngineSync] Updated cacheAtom with:', stats);
      }
    } catch (err) {
      console.error('[useEngineSync] Error in syncStats:', err);
    }
  }, []);

  useEffect(() => {
    if (!engine) {
      console.log('[useEngineSync] No engine yet, skipping setup');
      return;
    }

    console.log('[useEngineSync] Setting up sync with engine:', !!engine);

    const handleEvent = (data: unknown) => {
      console.log('[useEngineSync] Event received:', data);
      syncStats();
    };

    const unsubscribers = [
      engine.on('cache-hit', handleEvent),
      engine.on('cache-miss', handleEvent),
      engine.on('cache-set', handleEvent),
      engine.on('cache-delete', handleEvent),
      engine.on('cache-clear', handleEvent),
    ];

    console.log('[useEngineSync] Subscribed to engine events');

    const intervalId = setInterval(syncStats, refreshInterval);
    console.log('[useEngineSync] Started interval:', refreshInterval);

    syncStats();

    return () => {
      console.log('[useEngineSync] Cleaning up');
      unsubscribers.forEach((unsub) => unsub());
      clearInterval(intervalId);
    };
  }, [engine, syncStats, refreshInterval]);
}
