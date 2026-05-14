/**
 * useImageCacheLoader - Cache loading logic hook
 *
 * Handles image loading from cache or network with proper cleanup.
 * Manages abort signals for race condition prevention.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { blobUrlRegistry } from '../../../utils/blobUrlRegistry';
import { classifyError, ErrorType } from '../../../utils/logger';
import type { ImageCacheLoaderProps, ImageCacheLoaderResult } from './useImageCacheLoader.type';

/**
 * Hook for loading images from cache with fallback to network
 *
 * @param props - Configuration including src, engine, noCache flag, and abort signal
 * @returns Image loading state and URL
 */
export function useImageCacheLoader({
  src,
  engine,
  noCache,
  abortSignal,
  onCacheError,
}: ImageCacheLoaderProps): ImageCacheLoaderResult {
  const [state, setState] = useState<ImageCacheLoaderResult>({
    status: 'idle',
    url: null,
    error: null,
    isFromCache: false,
  });

  const objectUrlRef = useRef<string | null>(null);
  const componentIdRef = useRef(`img-${src}-${Date.now()}`);

  /**
   * Cleanup blob URL
   */
  const cleanupUrl = useCallback(() => {
    if (objectUrlRef.current) {
      blobUrlRegistry.revoke(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

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
        console.error(`[useImageCacheLoader] Cache error (${context}):`, error);
      }

      // Notify via callback if provided
      if (onCacheError && classified.original instanceof Error) {
        onCacheError(classified.original, context);
      }
    },
    [onCacheError],
  );

  useEffect(() => {
    // Update component ID when src changes
    componentIdRef.current = `img-${src}-${Date.now()}`;

    if (!src) {
      setState({ status: 'idle', url: null, error: null, isFromCache: false });
      return;
    }

    let cancelled = false;

    const loadImage = async () => {
      setState({ status: 'loading', url: null, error: null, isFromCache: false });

      try {
        // Try cache first
        let url: string | null = null;
        let fromCache = false;

        if (engine && !noCache) {
          try {
            url = await engine.get(src);
            fromCache = !!url;
          } catch (err) {
            handleCacheError(err, 'indexeddb');
            // Continue to network fallback
          }
        }

        // Cache miss or noCache - fetch from network
        if (!url) {
          try {
            const response = await fetch(src, {
              signal: abortSignal,
            });

            if (response.ok) {
              const blob = await response.blob();
              const createdUrl = blobUrlRegistry.create(blob, componentIdRef.current);
              objectUrlRef.current = createdUrl;

              // Store in cache if enabled
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
                      .catch((err: unknown) => {
                        handleCacheError(err, 'indexeddb');
                      });
                  })
                  .catch((err: unknown) => {
                    handleCacheError(err, 'blob');
                  });
              }

              url = createdUrl;
            } else {
              url = src; // Fallback to original URL
            }
          } catch (err) {
            if (cancelled) return;

            // Classify error and handle appropriately
            const classified = classifyError(err, 'network');

            if (classified.type === ErrorType.ABORT) {
              // Expected - user navigated away
              return;
            }

            handleCacheError(err, 'network');
            url = src; // Fallback to original URL
          }
        }

        if (!cancelled) {
          setState({
            status: 'loaded',
            url,
            error: null,
            isFromCache: fromCache,
          });
        }
      } catch (err) {
        if (!cancelled) {
          const classified = classifyError(err, 'network');

          // AbortError is expected behavior
          if (classified.type === ErrorType.ABORT) {
            return;
          }

          handleCacheError(err, 'network');
          setState({
            status: 'error',
            url: src, // Fallback to original URL
            error:
              classified.original instanceof Error ? classified.original : new Error(String(err)),
            isFromCache: false,
          });
        }
      }
    };

    loadImage();

    // Cleanup on abort or unmount
    return () => {
      cancelled = true;
      abortSignal?.addEventListener('abort', cleanupUrl);
    };
  }, [src, engine, noCache, abortSignal, handleCacheError, cleanupUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupUrl();
      blobUrlRegistry.revokeComponent(componentIdRef.current);
    };
  }, [cleanupUrl]);

  return state;
}
