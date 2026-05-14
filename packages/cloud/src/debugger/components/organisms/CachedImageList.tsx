import { memo } from 'react';
import type { CachedImageItem } from '../../types/devtools.types';
import { CachedImageRow } from '../molecules/CachedImageRow';
import { TAB_ICONS } from '../../utils/icons';

interface CachedImageListProps {
  items: CachedImageItem[];
}

export const CachedImageList = memo(function CachedImageList({ items }: CachedImageListProps) {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Section header */}
      <div className="h-9 flex-none flex items-center px-4 border-b border-dt-border bg-dt-bg-panel">
        <span className="text-[11px] font-semibold tracking-tight">Cached Images</span>
        <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded-full bg-dt-bg-card border border-dt-border text-dt-text-secondary tabular-nums">
          {items.length}
        </span>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-dt-text-secondary">
          <span className="opacity-30" dangerouslySetInnerHTML={{ __html: TAB_ICONS['image'] }} />
          <span className="text-[11px]">No cached images</span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto divide-y divide-dt-border/30">
          {items.map((item) => (
            <CachedImageRow key={item.url} item={item} />
          ))}
        </div>
      )}
    </div>
  );
});