import React, { useState, useEffect, useRef, useCallback } from 'react';

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
}

export type ImageStatus = 'pending' | 'loading' | 'loaded' | 'error' | 'offline';

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
  width,
  height,
  style,
  className,
  ...props
}) => {
  const [status, setStatus] = useState<ImageStatus>('pending');
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isInViewport, setIsInViewport] = useState(!preload);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const resolvedSrc = cacheKey || src;

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

  useEffect(() => {
    if (!isInViewport) return;

    const loadImage = async () => {
      setStatus('loading');

      try {
        const response = await fetch(src);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        setObjectUrl(url);
        setStatus('loaded');
        onCacheMiss?.();
        onLoad?.();
      } catch (error) {
        setStatus('error');
        onError?.(error as Error);
      }
    };

    loadImage();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src, isInViewport, resolvedSrc]);

  const loadingPriority = isInViewport ? 'high' : 'lazy';

  if (status === 'pending' && placeholder) {
    return (
      <div
        ref={imgRef}
        className={className}
        style={{
          ...style,
          backgroundImage: `url(${placeholder})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        role="img"
        aria-label={alt}
      />
    );
  }

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
      {showLoading && status === 'loading' && (
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
            animation: 'spin 1s linear infinite',
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
          fetchPriority={loadingPriority === 'high' ? 'high' : 'auto'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          {...props}
        />
      )}

      <style>{`
        @keyframes spin {
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
