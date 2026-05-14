export type ImageCacheLoaderStatus = 'idle' | 'loading' | 'loaded' | 'error';

export type ImageCacheLoaderResult = {
  status: ImageCacheLoaderStatus;
  url: string | null;
  error: Error | null;
  isFromCache: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ImageCacheEngine = {
  get(src: string): Promise<string | null>;
  set(
    src: string,
    data: ArrayBuffer,
    metadata: {
      size: number;
      mimeType: string;
      cachedAt: number;
      accessedAt: number;
      accessCount: number;
    },
  ): Promise<void>;
} | null;

export type ImageCacheLoaderProps = {
  src: string;
  engine: ImageCacheEngine;
  noCache: boolean;
  abortSignal: AbortSignal | null;
  onCacheError?: (error: Error, context: 'blob' | 'indexeddb' | 'network') => void;
};