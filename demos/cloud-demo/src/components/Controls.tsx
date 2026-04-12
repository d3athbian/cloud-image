import { memo } from 'react';

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
    <div className="stats" role="region" aria-label="Cache controls">
      <h2>Controls</h2>
      <div className="buttonGroup">
        <button 
          onClick={onPrefetch} 
          className="button primary"
          disabled={isLoading}
          aria-label="Prefetch 10 images"
        >
          {isLoading ? 'Loading...' : 'Prefetch 10'}
        </button>
        <button 
          onClick={onClear} 
          className="button"
          disabled={isLoading}
          aria-label="Clear cache"
        >
          Clear
        </button>
      </div>
    </div>
  );
});