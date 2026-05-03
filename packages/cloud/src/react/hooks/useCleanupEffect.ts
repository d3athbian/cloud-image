import { useEffect } from 'react';

export function useCleanupEffect(effect: () => (() => void) | undefined, deps: unknown[]): void {
  useEffect(() => {
    const cleanup = effect();
    return () => {
      cleanup?.();
    };
  }, deps);
}
