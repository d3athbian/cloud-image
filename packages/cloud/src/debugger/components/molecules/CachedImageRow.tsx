import { memo } from 'react';
import type { CachedImageItem } from '../../types/devtools.types';
import { formatSize, getFilename } from '../../utils/formatters';

interface CachedImageRowProps {
  item: CachedImageItem;
}

export const CachedImageRow = memo(function CachedImageRow({ item }: CachedImageRowProps) {
  const filename = getFilename(item.url);
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/2 transition-colors cursor-default">
      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-md bg-dt-bg-card border border-dt-border flex-none overflow-hidden flex items-center justify-center">
        <img
          src={item.url}
          alt={filename}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-dt-text-primary truncate">{filename}</p>
        <p className="text-[10px] text-dt-text-secondary truncate mt-0.5">{item.url}</p>
      </div>
      {/* Meta */}
      <div className="flex items-center gap-2 flex-none">
        <span className="text-[10px] tabular-nums text-dt-text-secondary bg-dt-bg-card border border-dt-border rounded px-1.5 py-0.5">
          {formatSize(item.size)}
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-dt-success flex-none" title="Cached" />
      </div>
    </div>
  );
});