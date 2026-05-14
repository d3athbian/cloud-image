import { memo } from 'react';
import type { CacheStats } from '../../types/devtools.types';
import { Stat } from '../atoms/Stat';
import { GhostButton } from '../atoms/GhostButton';
import { TAB_ICONS } from '../../utils/icons';
import { formatSize } from '../../utils/formatters';

interface CacheTabPanelProps {
  stats: CacheStats;
  onUpdateCache?: () => void;
  onClearCache?: () => void;
}

export const CacheTabPanel = memo(function CacheTabPanel({
  stats,
  onUpdateCache,
  onClearCache,
}: CacheTabPanelProps) {
  const hitRate = Math.round(stats.hitRate * 100);
  const missRate = Math.round(stats.missRate * 100);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-1.5">
        <Stat label="Items Cached" value={stats.itemCount} />
        <Stat label="Total Size" value={formatSize(stats.totalSize)} />
        <Stat
          label="Hit Rate"
          value={`${hitRate}%`}
          color={hitRate >= 80 ? 'text-dt-success' : hitRate >= 50 ? 'text-dt-warning' : 'text-dt-error'}
        />
        <Stat label="Miss Rate" value={`${missRate}%`} />
        <Stat label="Evictions" value={stats.evictionCount} />
      </div>
      <div className="flex gap-1.5 pt-1.5 border-t border-dt-border">
        <GhostButton onClick={onUpdateCache} icon={TAB_ICONS.refresh} label="Refresh" />
        <GhostButton onClick={onClearCache} icon={TAB_ICONS.clear} label="Clear Cache" danger />
      </div>
    </div>
  );
});