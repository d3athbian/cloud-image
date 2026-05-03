import { useAtom } from 'jotai';
import { type CSSProperties, memo, useCallback, useEffect } from 'react';
import {
  cacheAtom,
  cacheStatsAtom,
  engineAtom,
  memoryAtom,
  networkAtom,
  updateCache,
} from '../core/system-atoms';
import { DebuggerPanel } from './DebuggerPanel';
import { useDebuggerState } from './hooks/useDebuggerState';
import './DebuggerPanel.css';

type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

const CSS_VARIABLES_STYLE = `
:root {
  --debugger-bg: #0f0f0f;
  --debugger-text: #ededed;
  --debugger-border: #333;
  --debugger-accent: #3b82f6;
}
`;

interface DebuggerToolProps {
  initialIsOpen?: boolean;
  position?: Position;
  panelMode?: 'floating' | 'fullwidth';
  className?: string;
  onToggle?: (isOpen: boolean) => void;
}

const POSITION_STYLES: Record<Position, CSSProperties> = {
  'top-left': { top: 16, left: 16 },
  'top-right': { top: 16, right: 16 },
  'bottom-left': { bottom: 16, left: 16 },
  'bottom-right': { bottom: 16, right: 16 },
};

export const DebuggerTool = memo(function DebuggerTool({
  initialIsOpen = false,
  position = 'bottom-left',
  panelMode = 'fullwidth',
  className,
  onToggle,
}: DebuggerToolProps) {
  const { state, toggle, setTab } = useDebuggerState({
    isOpen: initialIsOpen,
    position,
    panelMode,
  });

  const [jotaiCache] = useAtom(cacheAtom);
  const [jotaiNetwork] = useAtom(networkAtom);
  const [jotaiMemory] = useAtom(memoryAtom);
  const [cacheStats] = useAtom(cacheStatsAtom);
  const [engine] = useAtom(engineAtom);

  const jotaiState = {
    cache: { ...jotaiCache },
    network: {
      status: jotaiNetwork.status,
      rtt: jotaiNetwork.rtt,
      lastChecked: jotaiNetwork.lastChecked,
    },
    memory: {
      isUnderPressure: jotaiMemory.isUnderPressure,
      pressureLevel: jotaiMemory.pressureLevel,
    },
  };

  const performanceMetrics = {
    avgResponse: jotaiNetwork.rtt || 0,
    totalRequests: (jotaiCache.hitCount || 0) + (jotaiCache.missCount || 0),
    successRate:
      (jotaiCache.hitCount || 0) /
      Math.max(1, (jotaiCache.hitCount || 0) + (jotaiCache.missCount || 0)),
  };

  const handleClearCache = useCallback(async () => {
    if (!engine) return;
    await engine.clear();
    await engine.getStats();
  }, [engine]);

  const handlePrefetch = useCallback(async () => {
    if (!engine) return;
    const stats = await engine.getStats();
    updateCache({
      totalItems: stats.itemCount,
      totalSize: stats.totalSize ?? 0,
      hitCount: stats.hitCount ?? 0,
      missCount: stats.missCount ?? 0,
      lastAccessTime: Date.now(),
    });
  }, [engine]);

  const handleTestNetwork = useCallback(async () => {
    console.log('[Debugger] Network test triggered via atom');
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.createElement('style');
    style.textContent = CSS_VARIABLES_STYLE;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleToggle = () => {
    toggle();
    onToggle?.(!state.isOpen);
  };

  const getTogglePosition = (): CSSProperties => {
    const pos = POSITION_STYLES[state.position];
    return { ...pos };
  };

  return (
    <>
      <button
        type="button"
        className={`debugger-toggle ${className ?? ''}`}
        style={getTogglePosition()}
        onClick={handleToggle}
        aria-label={state.isOpen ? 'Close Debugger' : 'Open Debugger'}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
          role="img"
          aria-hidden="true"
        >
          <title>Debugger</title>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      </button>
      {state.isOpen && (
        <DebuggerPanel
          state={state}
          onTabChange={setTab}
          onClose={toggle}
          onUpdateCache={handlePrefetch}
          onUpdateNetwork={handleTestNetwork}
          onClearCache={handleClearCache}
          jotaiState={jotaiState}
          cacheStats={cacheStats}
          performanceMetrics={performanceMetrics}
        />
      )}
    </>
  );
});

export const DebuggerToolPanel = memo(function DebuggerToolPanel({
  className,
}: {
  className?: string;
}) {
  return (
    <DebuggerTool
      initialIsOpen={true}
      position="top-left"
      panelMode="fullwidth"
      className={className}
    />
  );
});
