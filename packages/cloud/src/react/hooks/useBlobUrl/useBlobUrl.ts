/**
 * useBlobUrl - ObjectURL lifecycle management hook
 *
 * Manages blob: URL creation and cleanup to prevent memory leaks.
 * Automatically revokes URLs when src changes or component unmounts.
 */

import { useCallback, useEffect, useRef } from 'react';
import { blobUrlRegistry } from '../../../utils/blobUrlRegistry';
import type { UseBlobUrlOptions, BlobUrlResult } from './useBlobUrl.type';

/**
 * Hook for managing blob URL lifecycle with automatic cleanup
 *
 * @param options - Configuration options
 * @param options.componentId - Unique identifier for tracking this component's URLs
 * @returns Object with createUrl, revokeUrl, and current objectUrl
 */
export function useBlobUrl({ componentId }: UseBlobUrlOptions): BlobUrlResult {
  const objectUrlRef = useRef<string | null>(null);

  /**
   * Create a new blob URL, revoking any existing one first
   */
  const createUrl = useCallback(
    (blob: Blob): string => {
      // Revoke existing URL before creating new one
      if (objectUrlRef.current) {
        blobUrlRegistry.revoke(objectUrlRef.current);
      }

      const url = blobUrlRegistry.create(blob, componentId);
      objectUrlRef.current = url;
      return url;
    },
    [componentId],
  );

  /**
   * Manually revoke the current URL
   */
  const revokeUrl = useCallback(() => {
    if (objectUrlRef.current) {
      blobUrlRegistry.revoke(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        blobUrlRegistry.revoke(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      // Also cleanup via registry for this component
      blobUrlRegistry.revokeComponent(componentId);
    };
  }, [componentId]);

  return {
    objectUrl: objectUrlRef.current,
    createUrl,
    revokeUrl,
  };
}