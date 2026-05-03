import { memo, useMemo } from 'react';
import type { CacheItemMetadata } from '../../types/devtools.types';
import { CacheCard } from './CacheCard';

interface CacheGridProps {
  items: CacheItemMetadata[];
  selectedUrl?: string | null;
  onSelectItem?: (url: string) => void;
}

export const CacheGrid = memo(function CacheGrid({
  items,
  selectedUrl,
  onSelectItem,
}: CacheGridProps) {
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => b.lruScore - a.lruScore);
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <svg
            className="mx-auto mb-3 text-dt-text-secondary"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
          </svg>
          <p className="text-dt-text-secondary text-sm">No cached images</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 p-4 overflow-y-auto">
      {sortedItems.map((item) => (
        <CacheCard
          key={item.url}
          item={item}
          isSelected={selectedUrl === item.url}
          onClick={() => onSelectItem?.(item.url)}
        />
      ))}
    </div>
  );
});
