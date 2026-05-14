import { useAtom } from 'jotai';
import { type CSSProperties, memo, useCallback } from 'react';
import {
  cacheAtom,
  cacheStatsAtom,
  engineAtom,
  memoryAtom,
  networkAtom,
  updateCache,
} from '../core/system-atoms';
import { DebuggerPanel } from './DebuggerPanel';
import { useCachedImages } from './hooks/useCachedImages';
import { useDebuggerState } from './hooks/useDebuggerState';

type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

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

  const cachedImagesList = useCachedImages().items.map((item) => ({
    url: item.url,
    size: item.size,
    mimeType: item.mimeType,
    cachedAt: item.cachedAt,
  }));

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
        className={`fixed w-11 h-11 rounded-xl bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-dt-border text-dt-text-primary cursor-pointer flex items-center justify-center transition-all z-[9998] shadow-lg hover:border-dt-info hover:scale-105 ${className ?? ''}`}
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
          cachedImages={cachedImagesList}
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
