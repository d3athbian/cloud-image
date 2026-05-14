import type React from 'react';

export type CloudImageProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  'onError' | 'onLoad'
> & {
  src: string;
  alt?: string;
  placeholder?: string;
  showLoading?: boolean;
  fallback?: React.ReactNode;
  noCache?: boolean;
  preload?: boolean;
  cacheKey?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onCacheHit?: () => void;
  onCacheMiss?: () => void;
  onCacheError?: (error: Error, context: 'blob' | 'indexeddb' | 'network') => void;
  offlineFallback?: React.ReactNode;
  blurPlaceholder?: string;
  transitionDuration?: number;
  enableCrossfade?: boolean;
  priority?: 'high' | 'low' | 'auto';
};

export type ImageStatus = 'pending' | 'loading' | 'loaded' | 'error' | 'offline' | 'cached';