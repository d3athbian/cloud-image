/**
 * useCrossfadeAnimation - Animation timing hook
 *
 * Manages crossfade opacity transitions for smooth image loading.
 * Handles animation timing and state management.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CrossfadeAnimationOptions, CrossfadeAnimationResult } from './useCrossfadeAnimation.type';

/**
 * Hook for managing crossfade animation timing
 *
 * @param options - Configuration with enabled flag and duration
 * @returns Opacity value, transition state, and callbacks
 */
export function useCrossfadeAnimation({
  enabled,
  duration,
}: CrossfadeAnimationOptions): CrossfadeAnimationResult {
  const [opacity, setOpacity] = useState(enabled ? 0 : 1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoadedRef = useRef(false);

  /**
   * Clear any pending transition timeout
   */
  const clearTransition = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsTransitioning(false);
  }, []);

  /**
   * Start the crossfade transition when image loads
   */
  const onImageLoaded = useCallback(() => {
    if (!enabled || hasLoadedRef.current) return;

    hasLoadedRef.current = true;
    setIsTransitioning(true);

    // Start opacity transition
    setOpacity(1);

    // Complete transition after duration
    timeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
      timeoutRef.current = null;
    }, duration);
  }, [enabled, duration]);

  /**
   * Reset animation state (for when src changes)
   */
  const reset = useCallback(() => {
    clearTransition();
    hasLoadedRef.current = false;
    setOpacity(enabled ? 0 : 1);
  }, [clearTransition, enabled]);

  // Reset when enabled changes
  useEffect(() => {
    if (!enabled) {
      clearTransition();
      setOpacity(1);
      hasLoadedRef.current = true;
    } else {
      hasLoadedRef.current = false;
      setOpacity(0);
    }
  }, [enabled, clearTransition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTransition();
    };
  }, [clearTransition]);

  return {
    opacity,
    isTransitioning,
    onImageLoaded,
    reset,
  };
}