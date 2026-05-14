import type React from 'react';
import { memo, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getNetworkMonitor } from '../core/network';
import { blobUrlRegistry } from '../utils/blobUrlRegistry';
import { classifyError, ErrorType } from '../utils/logger';
import { CloudContext } from './context';
import { observeElement, unobserveElement } from './hooks/useGlobalIntersectionObserver';
import type { CloudImageProps, ImageStatus } from './image.type';

const getPlaceholderStyle = (
  blurPlaceholder?: string,
  placeholder?: string,
): React.CSSProperties => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundImage: blurPlaceholder
    ? `url(${blurPlaceholder})`
    : placeholder
      ? `url(${placeholder})`
      : undefined,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  filter: blurPlaceholder ? 'blur(20px)' : undefined,
  transform: blurPlaceholder ? 'scale(1.1)' : undefined,
});

const CloudImageComponent: React.FC<CloudImageProps> = ({
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
  onCacheError,
  offlineFallback,
  blurPlaceholder,
  transitionDuration = 300,
  enableCrossfade = true,
  width,
  height,
  style,
  className,
  priority = 'auto',
  ...props
}) => {
  const context = useContext(CloudContext);
  const engine = context?.engine;
  const isReady = context?.isReady ?? false;

  const [status, setStatus] = useState<ImageStatus>('pending');
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isInViewport, setIsInViewport] = useState(!preload);
  const [isOnline, setIsOnline] = useState(true);
  const [, setIsTransitioning] = useState(false);
  const [mainImageLoaded, setMainImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const networkMonitorRef = useRef<ReturnType<typeof getNetworkMonitor> | null>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const componentIdRef = useRef(`cloud-image-${src}-${Date.now()}`);

  const hasBlurPlaceholder = blurPlaceholder || placeholder;

  // Network monitor subscription
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

  // Intersection observer for viewport detection
  useEffect(() => {
    if (preload) {
      setIsInViewport(false);
      return;
    }

    const element = imgRef.current;
    if (!element) return;

    const handleIntersection: IntersectionObserverCallback = (entries) => {
      if (entries[0]?.isIntersecting) {
        setIsInViewport(true);
        unobserveElement(element);
      }
    };

    observeElement(element, handleIntersection, { rootMargin: '100px' });

    return () => {
      unobserveElement(element);
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
    if (engine && src && isInViewport) {
      engine.updateViewportStatus(src, true).catch(() => {});
    }
  }, [isInViewport, engine, src]);

  /**
   * Handle cache errors with proper classification
   */
  const handleCacheError = useCallback(
    (error: unknown, context: 'blob' | 'indexeddb' | 'network') => {
      const classified = classifyError(error, context);

      // AbortError is silently suppressed (expected behavior)
      if (classified.type === ErrorType.ABORT) {
        return;
      }

      // Log in dev mode
      if (process.env.NODE_ENV !== 'production') {
        console.error(`[CloudImage] Cache error (${context}):`, error);
      }

      // Notify via callback if provided
      if (onCacheError && classified.original instanceof Error) {
        onCacheError(classified.original, context);
      }
    },
    [onCacheError],
  );

  // Main image loading effect
  useEffect(() => {
    if (!isInViewport || !isReady) return;

    abortControllerRef.current = new AbortController();

    const loadImage = async () => {
      if (!isOnline) {
        setStatus('offline');
        return;
      }

      const cacheHasUrl = engine?.has(src);

      if (!cacheHasUrl) {
        setStatus('loading');
      }
      setMainImageLoaded(false);

      try {
        let url: string | null = null;
        let fromCache = false;

        if (engine && !noCache) {
          try {
            url = await engine.get(src);
            fromCache = !!url;
          } catch (err) {
            handleCacheError(err, 'indexeddb');
          }
        }

        if (!url) {
          try {
            const response = await fetch(src, {
              signal: abortControllerRef.current?.signal,
            });

            if (response.ok) {
              const blob = await response.blob();
              const createdUrl = blobUrlRegistry.create(blob, componentIdRef.current);
              url = createdUrl;

              if (engine && !noCache) {
                blob
                  .arrayBuffer()
                  .then((arrayBuffer) => {
                    engine
                      .set(src, arrayBuffer, {
                        size: arrayBuffer.byteLength,
                        mimeType: blob.type,
                        cachedAt: Date.now(),
                        accessedAt: Date.now(),
                        accessCount: 0,
                      })
                      .catch((err) => {
                        handleCacheError(err, 'indexeddb');
                      });
                  })
                  .catch((err) => {
                    handleCacheError(err, 'blob');
                  });
              }
            } else {
              url = src;
            }
          } catch (err) {
            const classified = classifyError(err, 'network');
            if (classified.type === ErrorType.ABORT) {
              return;
            }
            handleCacheError(err, 'network');
            url = src;
          }
        }

        if (!isInViewport) {
          if (url && url !== src) {
            blobUrlRegistry.revoke(url);
          }
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
      abortControllerRef.current?.abort();
      cancelTransition();
    };
  }, [
    src,
    isInViewport,
    isOnline,
    enableCrossfade,
    hasBlurPlaceholder,
    transitionDuration,
    cancelTransition,
    engine,
    noCache,
    onCacheHit,
    onCacheMiss,
    onLoad,
    onError,
    isReady,
    handleCacheError,
  ]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      blobUrlRegistry.revokeComponent(componentIdRef.current);
    };
  }, []);

  const loadingPriority: 'eager' | 'lazy' = priority === 'high' || isInViewport ? 'eager' : 'lazy';

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
        <div style={getPlaceholderStyle(blurPlaceholder, placeholder)} />
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
        <div style={getPlaceholderStyle(blurPlaceholder, placeholder)} />
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
      ) : (
        <img
          ref={imgRef}
          src={objectUrl || src}
          alt={alt}
          width={width}
          height={height}
          loading={loadingPriority}
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

export const CloudImage = memo(CloudImageComponent);
