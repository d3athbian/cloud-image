import { memo } from 'react';
import styles from '../styles/app.module.css';

interface ControlsProps {
  onPrefetch: () => void;
  onClear: () => void;
  isLoading?: boolean;
}

export const Controls = memo(function Controls({ 
  onPrefetch, 
  onClear,
  isLoading 
}: ControlsProps) {
  return (
    <div className={styles.stats} role="region" aria-label="Cache controls">
      <h2>Controls</h2>
      <div className={styles.buttonGroup}>
        <button 
          onClick={onPrefetch} 
          className={`${styles.button} ${styles.primary}`}
          disabled={isLoading}
          aria-label="Prefetch 10 images"
        >
          {isLoading ? 'Loading...' : 'Prefetch 10'}
        </button>
        <button 
          onClick={onClear} 
          className={styles.button}
          disabled={isLoading}
          aria-label="Clear cache"
        >
          Clear
        </button>
      </div>
    </div>
  );
});