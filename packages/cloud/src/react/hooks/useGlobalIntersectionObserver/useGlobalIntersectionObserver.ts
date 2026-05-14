/**
 * useGlobalIntersectionObserver - React hook wrapper for global singleton observer
 *
 * Uses the global IntersectionObserver manager to avoid creating new observers
 * per DOM node (which destroys scroll performance on galleries).
 */

import { useCallback, useState } from 'react';
import { globalIntersectionObserver } from '../../../utils/globalIntersectionObserver';
import type { UseGlobalIntersectionObserverOptions, UseGlobalIntersectionObserverReturn } from './useGlobalIntersectionObserver.type';

/**
 * Hook for observing element visibility using global singleton observer
 *
 * @param options - Configuration with rootMargin and enabled flag
 * @returns Ref callback and viewport state
 */
export function useGlobalIntersectionObserver(
  options: UseGlobalIntersectionObserverOptions = {},
): UseGlobalIntersectionObserverReturn {
  const { rootMargin = '100px', enabled = true } = options;
  const [isInViewport, setIsInViewport] = useState(!enabled);

  const ref = useCallback(
    (node: Element | null) => {
      if (!node || !enabled) return;

      const handleIntersection: IntersectionObserverCallback = (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsInViewport(true);
          globalIntersectionObserver.unobserve(node);
        }
      };

      globalIntersectionObserver.observe(node, handleIntersection, { rootMargin });
    },
    [rootMargin, enabled],
  );

  return { ref, isInViewport };
}

// For internal use in CloudImage
export function observeElement(
  element: Element,
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit,
): void {
  globalIntersectionObserver.observe(element, callback, options);
}

export function unobserveElement(element: Element): void {
  globalIntersectionObserver.unobserve(element);
}

export function disconnectGlobalObserver(): void {
  globalIntersectionObserver.disconnect();
}