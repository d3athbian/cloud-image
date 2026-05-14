import { memo } from 'react';
import type { CacheItemMetadata } from '../../types/devtools.types';

interface CacheListItemProps {
  item: CacheItemMetadata;
  isSelected?: boolean;
  onClick?: () => void;
}

function formatSize(bytes: number): string {
  const mb = bytes / 1024 / 1024;
  return mb < 1 ? `${(mb * 1024).toFixed(0)} KB` : `${mb.toFixed(1)} MB`;
}

function truncateUrl(url: string, maxLength = 35): string {
  if (url.length <= maxLength) return url;
  const start = url.substring(0, maxLength);
  return `${start}...`;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'text-dt-success',
  expired: 'text-dt-warning',
  evicted: 'text-dt-error',
  pinned: 'text-purple-400',
};

export const CacheListItem = memo(function CacheListItem({
  item,
  isSelected,
  onClick,
}: CacheListItemProps) {
  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-3 px-3 py-2 cursor-pointer transition-all
        ${isSelected ? 'bg-dt-info/10 border-l-2 border-dt-info' : 'hover:bg-white/[0.03] border-l-2 border-transparent'}
      `}
    >
      <div className="w-12 h-12 bg-black/50 rounded flex items-center justify-center shrink-0 overflow-hidden">
        <span className="text-dt-text-secondary text-[10px]">IMG</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-dt-text-primary truncate" title={item.url}>
          {truncateUrl(item.url)}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-dt-text-secondary font-dt-mono mt-0.5">
          <span>{formatSize(item.size)}</span>
          <span>•</span>
          <span>LRU: {item.lruScore.toFixed(2)}</span>
        </div>
      </div>
      {item.status !== 'active' && (
        <div className={`text-[10px] font-bold ${STATUS_COLORS[item.status]}`}>
          {item.status.toUpperCase()}
        </div>
      )}
    </div>
  );
});