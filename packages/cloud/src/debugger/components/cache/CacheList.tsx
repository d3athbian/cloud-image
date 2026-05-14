import { memo } from 'react';
import type { CacheItemMetadata } from '../../types/devtools.types';
import { CacheListItem } from './CacheListItem';

interface CacheListProps {
  items: CacheItemMetadata[];
  selectedUrl?: string | null;
  onSelectItem?: (url: string) => void;
}

export const CacheList = memo(function CacheList({
  items,
  selectedUrl,
  onSelectItem,
}: CacheListProps) {
  return (
    <div className="flex flex-col h-full">
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-dt-text-secondary text-sm">
          <svg className="mb-2" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
          </svg>
          <span>No cached images</span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto divide-y divide-dt-border/30">
          {items.map((item) => (
            <CacheListItem
              key={item.url}
              item={item}
              isSelected={selectedUrl === item.url}
              onClick={() => onSelectItem?.(item.url)}
            />
          ))}
        </div>
      )}
    </div>
  );
});
