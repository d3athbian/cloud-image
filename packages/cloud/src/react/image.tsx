import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { getNetworkMonitor } from '../core/network';
import { CloudContext } from './hooks';

export interface CloudImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
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
  offlineFallback?: React.ReactNode;
  blurPlaceholder?: string;
  transitionDuration?: number;
  enableCrossfade?: boolean;
}

export type ImageStatus = 'pending' | 'loading' | 'loaded' | 'error' | 'offline' | 'cached';

export const CloudImage: React.FC<CloudImageProps> = ({
  src,
  alt = '',
  placeholder,
  showLoading = true,
  fallback,
  noCache = false,
  preload = false,
  cacheKey,
  onLoad,
  onError,
  onCacheHit,
  onCacheMiss,
  offlineFallback,
  blurPlaceholder,
  transitionDuration = 300,
  enableCrossfade = true,
  width,
  height,
  style,
  className,
  ...props
}) => {
  const context = useContext(CloudContext);
  const engine = context?.engine;
  const isReady = context?.isReady ?? false;
  
  const [status, setStatus] = useState<ImageStatus>('pending');
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isInViewport, setIsInViewport] = useState(!preload);
  const [isOnline, setIsOnline] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mainImageLoaded, setMainImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const networkMonitorRef = useRef<ReturnType<typeof getNetworkMonitor> | null>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resolvedSrc = cacheKey || src;
  const hasBlurPlaceholder = blurPlaceholder || placeholder;

  useEffect(() => {
    networkMonitorRef.current = getNetworkMonitor();
    setIsOnline(networkMonitorRef.current.isOnline());

    const unsubscribe = networkMonitorRef.current.subscribe((newStatus) => {
      setIsOnline(newStatus.online);
      if (newStatus.online && status === 'offline') {
        setStatus('pending');
      }
    });

    return unsubscribe;
  }, [status]);

  useEffect(() => {
    if (preload) {
      setIsInViewport(false);
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInViewport(true);
          observerRef.current?.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [preload]);

  const cancelTransition = useCallback(() => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
    setIsTransitioning(false);
  }, []);

  useEffect(() => {
    if (!isInViewport) {
      cancelTransition();
    }
  }, [isInViewport, cancelTransition]);

  useEffect(() => {
    if (!isInViewport || !isReady) return;

    const loadImage = async () => {
      if (!isOnline) {
        setStatus('offline');
        return;
      }

      setStatus('loading');
      setMainImageLoaded(false);

      try {
        let url: string | null = null;
        let fromCache = false;

        if (engine && !noCache) {
          url = await engine.get(src);
          fromCache = !!url;
        }

        if (!url) {
          url = src;
          
          if (engine && !noCache) {
            try {
              const response = await fetch(src);
              if (response.ok) {
                const blob = await response.blob();
                const arrayBuffer = await blob.arrayBuffer();
                await engine.set(src, arrayBuffer, {
                  size: arrayBuffer.byteLength,
                  mimeType: blob.type || 'image/jpeg',
                  cachedAt: Date.now(),
                  accessedAt: Date.now(),
                  accessCount: 0,
                });
              }
            } catch {
              // Network error - just use original URL, will show broken image
            }
          }
        }
        
        if (!isInViewport) {
          URL.revokeObjectURL(url);
          return;
        }

        setObjectUrl(url);
        
        if (enableCrossfade && hasBlurPlaceholder) {
          setIsTransitioning(true);
          transitionTimeoutRef.current = setTimeout(() => {
            setMainImageLoaded(true);
            setIsTransitioning(false);
          }, transitionDuration);
        } else {
          setMainImageLoaded(true);
        }
        
        setStatus(fromCache ? 'cached' : 'loaded');
        if (fromCache) {
          onCacheHit?.();
        } else {
          onCacheMiss?.();
        }
        onLoad?.();
      } catch (error) {
        if (!isOnline) {
          setStatus('offline');
        } else {
          setStatus('error');
          onError?.(error as Error);
        }
      }
    };

    loadImage();

    return () => {
      cancelTransition();
    };
  }, [src, isInViewport, resolvedSrc, isOnline, enableCrossfade, hasBlurPlaceholder, transitionDuration, cancelTransition, engine, noCache, onCacheHit, onCacheMiss, onLoad, onError, isReady]);

  const loadingPriority = isInViewport ? 'high' : 'lazy';

  const getPlaceholderStyle = (): React.CSSProperties => ({
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: blurPlaceholder ? `url(${blurPlaceholder})` : placeholder ? `url(${placeholder})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: blurPlaceholder ? 'blur(20px)' : undefined,
    transform: blurPlaceholder ? 'scale(1.1)' : undefined,
  });

  if (status === 'pending' && hasBlurPlaceholder) {
    return (
      <div
        ref={imgRef}
        className={className}
        style={{
          position: 'relative',
          width: width || '100%',
          aspectRatio: width && height ? `${width}/${height}` : undefined,
          overflow: 'hidden',
          ...style,
        }}
        role="img"
        aria-label={alt}
      >
        <div style={getPlaceholderStyle()} />
      </div>
    );
  }

  if (status === 'offline') {
    return (
      <div
        className={className}
        style={{
          position: 'relative',
          width: width || '100%',
          aspectRatio: width && height ? `${width}/${height}` : undefined,
          ...style,
        }}
      >
        {offlineFallback || fallback || (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              backgroundColor: '#f0f0f0',
              color: '#666',
              fontSize: '14px',
            }}
          >
            Offline
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: width || '100%',
        aspectRatio: width && height ? `${width}/${height}` : undefined,
        overflow: 'hidden',
        ...style,
      }}
    >
      {hasBlurPlaceholder && !mainImageLoaded && (
        <div style={getPlaceholderStyle()} />
      )}

      {showLoading && status === 'loading' && !mainImageLoaded && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 24,
            height: 24,
            border: '2px solid #ccc',
            borderTopColor: '#333',
            borderRadius: '50%',
            animation: 'cloudImageSpin 1s linear infinite',
            zIndex: 2,
          }}
        />
      )}

      {status === 'error' && fallback ? (
        fallback
      ) : status === 'error' ? (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={loadingPriority}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          {...props}
        />
      ) : (
        <img
          ref={imgRef}
          src={objectUrl || src}
          alt={alt}
          width={width}
          height={height}
          loading={loadingPriority}
          fetchpriority={loadingPriority === 'high' ? 'high' : 'auto'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: mainImageLoaded ? 1 : 0,
            transition: enableCrossfade ? `opacity ${transitionDuration}ms ease-out` : 'none',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
          onLoad={() => {
            if (enableCrossfade && hasBlurPlaceholder) {
              setMainImageLoaded(true);
            }
          }}
          onError={() => {
            setStatus('error');
          }}
          {...props}
        />
      )}

      <style>{`
        @keyframes cloudImageSpin {
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
