import { memo } from 'react';
import type { CacheItemMetadata } from '../../types/devtools.types';

interface CacheCardProps {
  item: CacheItemMetadata;
  isSelected?: boolean;
  onClick?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'text-dt-success',
  expired: 'text-dt-warning',
  evicted: 'text-dt-error',
  pinned: 'text-purple-400',
};

function formatSize(bytes: number): string {
  const mb = bytes / 1024 / 1024;
  return mb < 1 ? `${(mb * 1024).toFixed(0)} KB` : `${mb.toFixed(1)} MB`;
}

function truncateUrl(url: string, maxLength = 30): string {
  if (url.length <= maxLength) return url;
  const start = url.substring(0, maxLength);
  return `${start}...`;
}

export const CacheCard = memo(function CacheCard({ item, isSelected, onClick }: CacheCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-md border overflow-hidden flex flex-col cursor-pointer transition-all duration-200
        ${
          isSelected
            ? 'border-dt-info bg-dt-bg-card'
            : 'border-dt-border bg-dt-bg-card hover:border-dt-border-hover'
        }
      `}
    >
      <div className="relative h-32 bg-black/50 group">
        <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/80 border border-dt-border rounded text-[10px] text-dt-success font-dt-mono">
          LRU: {item.lruScore.toFixed(2)}
        </div>
        <div className="absolute top-2 right-2 text-white/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
          </svg>
        </div>
        <div className="absolute inset-0 flex items-center justify-center text-dt-text-secondary text-xs">
          Preview
        </div>
      </div>

      <div className="p-3 flex flex-col gap-1">
        <div className="text-xs text-dt-text-primary truncate" title={item.url}>
          {truncateUrl(item.url)}
        </div>
        <div className="text-[10px] text-dt-text-secondary font-dt-mono flex items-center gap-2">
          <span>{formatSize(item.size)}</span>
          <span>•</span>
          <span>hit: {item.accessCount}</span>
          <span>•</span>
          <span>ttl: {Math.round(item.ttl / 1000)}s</span>
        </div>
        {item.status !== 'active' && (
          <div className={`text-[10px] font-bold text-right ${STATUS_COLORS[item.status]}`}>
            {item.status.toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
});
