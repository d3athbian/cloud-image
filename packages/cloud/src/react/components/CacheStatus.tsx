import { useAtomValue } from "jotai";
import { cacheAtom } from "../../core/system-atoms";

export interface CacheStatusProps {
  className?: string;
}

export function CacheStatus({ className }: CacheStatusProps) {
  const cache = useAtomValue(cacheAtom);
  return (
    <div className={className}>
      <span>Hits: {cache.hitCount}</span>
      <span>Misses: {cache.missCount}</span>
      <span>Items: {cache.totalItems}</span>
    </div>
  );
}
