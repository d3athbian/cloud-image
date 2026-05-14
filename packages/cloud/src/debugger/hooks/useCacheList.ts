import { useAtom, useAtomValue } from 'jotai';
import { useCallback, useMemo } from 'react';
import { cacheAtom, cacheStatsAtom } from '../../core/system-atoms';
import type { CacheItemMetadata } from '../types/devtools.types';

interface UseCacheListReturn {
  items: CacheItemMetadata[];
  selectedUrl: string | null;
  isLoading: boolean;
  error: string | null;
  selectItem: (url: string) => void;
  clearSelection: () => void;
  itemCount: number;
  totalSize: number;
}

export function useCacheList(selectedUrl?: string | null): UseCacheListReturn {
  const [cacheState] = useAtom(cacheAtom);
  const cacheStats = useAtomValue(cacheStatsAtom);

  // Build items list from cache state - in a real implementation,
  // this would come from IndexedDB via the engine
  const items = useMemo<CacheItemMetadata[]>(() => {
    // This is a placeholder - actual implementation would fetch from engine/IndexedDB
    // Returning empty array for now since we don't have real cache data
    return [];
  }, [cacheState]);

  const isLoading = false;
  const error = null;

  const selectItem = useCallback((url: string) => {
    // This would update a selectedUrlAtom in a full implementation
    console.log('[CacheList] Selected:', url);
  }, []);

  const clearSelection = useCallback(() => {
    // This would clear the selectedUrlAtom
  }, []);

  return {
    items,
    selectedUrl: selectedUrl ?? null,
    isLoading,
    error,
    selectItem,
    clearSelection,
    itemCount: cacheStats.itemCount,
    totalSize: cacheStats.totalSize,
  };
}
