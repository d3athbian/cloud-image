import { memo } from 'react';
import type { CacheStats } from '@cloudimage/cloud';

interface CacheStatsDisplayProps {
  stats: CacheStats | null;
}

const formatSize = (bytes: number) => {
  const mb = bytes / 1024 / 1024;
  return mb < 1 ? `${(mb * 1024).toFixed(0)} KB` : `${mb.toFixed(2)} MB`;
};

export const CacheStatsDisplay = memo(function CacheStatsDisplay({ stats }: CacheStatsDisplayProps) {
  const hitRate = stats ? Math.round(stats.hitRate * 100) : 0;
  const missRate = stats ? Math.round(stats.missRate * 100) : 0;
  
  const getHitRateClass = () => {
    if (hitRate >= 80) return 'text-green-500';
    if (hitRate >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="stats" role="region" aria-label="Cache statistics">
      <h2>Cache Stats</h2>
      <p>Items cached <span className="statsValue">{stats?.itemCount ?? 0}</span></p>
      <p>Total size <span className="statsValue">{formatSize(stats?.totalSize ?? 0)}</span></p>
      <p>Hit rate <span className={`statsValue ${getHitRateClass()}`}>{hitRate}%</span></p>
      <p>Miss rate <span className="statsValue">{missRate}%</span></p>
      <p>Evictions <span className="statsValue">{stats?.evictionCount ?? 0}</span></p>
    </div>
  );
});