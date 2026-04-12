import { memo } from 'react';
import type { CacheStats } from '@cloudimage/cloud';
import styles from '../styles/app.module.css';

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
    if (hitRate >= 80) return styles.success;
    if (hitRate >= 50) return styles.warning;
    return styles.error;
  };

  return (
    <div className={styles.stats} role="region" aria-label="Cache statistics">
      <h2>Cache Stats</h2>
      <p>Items cached <span className={styles.statsValue}>{stats?.itemCount ?? 0}</span></p>
      <p>Total size <span className={styles.statsValue}>{formatSize(stats?.totalSize ?? 0)}</span></p>
      <p>Hit rate <span className={`${styles.statsValue} ${getHitRateClass()}`}>{hitRate}%</span></p>
      <p>Miss rate <span className={styles.statsValue}>{missRate}%</span></p>
      <p>Evictions <span className={styles.statsValue}>{stats?.evictionCount ?? 0}</span></p>
    </div>
  );
});