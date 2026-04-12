import { useCallback, useRef } from 'react';
import type { PicsumImage } from '../types/images';

export function useImagePrefetch(cache: ReturnType<typeof import('@cloudimage/cloud')['CloudProvider']>['cache']) {
  const cacheRef = useRef(cache);
  cacheRef.current = cache;

  const prefetch = useCallback(async (images: PicsumImage[], count = 10) => {
    const urls = images.slice(0, count).map(img => img.download_url);
    if (cacheRef.current) {
      await cacheRef.current.prefetch(urls);
    }
  }, []);

  const clear = useCallback(async () => {
    if (cacheRef.current) {
      await cacheRef.current.clear();
    }
  }, []);

  return { prefetch, clear };
}
