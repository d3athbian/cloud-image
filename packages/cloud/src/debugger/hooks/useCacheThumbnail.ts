import { useState, useEffect, useCallback, useRef } from 'react';
import { openDB, type IDBPDatabase } from 'idb';

interface CacheDB {
  images: {
    key: string;
    value: {
      url: string;
      data: ArrayBuffer;
      metadata: {
        mimeType: string;
        size: number;
      };
    };
  };
}

interface UseCacheThumbnailResult {
  objectUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

const DB_NAME = 'cloud-image-cache';
const STORE_NAME = 'images';

async function getImageBlob(url: string): Promise<{ data: ArrayBuffer; mimeType: string } | null> {
  try {
    const db: IDBPDatabase<CacheDB> = await openDB<CacheDB>(DB_NAME, 2, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'url' });
        }
      },
    });

    const entry = await db.get(STORE_NAME, url);
    if (!entry) return null;

    return {
      data: entry.data,
      mimeType: entry.metadata?.mimeType || 'image/png',
    };
  } catch {
    return null;
  }
}

export function useCacheThumbnail(url: string | null): UseCacheThumbnailResult {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const loadThumbnail = useCallback(async (imageUrl: string) => {
    if (!imageUrl) {
      setObjectUrl(null);
      return;
    }

    // Clean up previous object URL
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const blobData = await getImageBlob(imageUrl);
      if (!blobData) {
        setObjectUrl(null);
        setIsLoading(false);
        return;
      }

      const blob = new Blob([blobData.data], { type: blobData.mimeType });
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;
      setObjectUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load thumbnail');
      setObjectUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (url) {
      loadThumbnail(url);
    } else {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      setObjectUrl(null);
    }

    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, loadThumbnail]);

  return { objectUrl, isLoading, error };
}