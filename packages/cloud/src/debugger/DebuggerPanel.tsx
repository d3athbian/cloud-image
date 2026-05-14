import { memo } from 'react';
import type { DebuggerState, CachedImageItem, CacheStats, JotaiDebuggerState, PerformanceData } from './types/devtools.types';
import { TabBar } from './components/shared/TabBar';
import { DebuggerHeader } from './components/organisms/DebuggerHeader';
import { CachedImageList } from './components/organisms/CachedImageList';
import { CacheTabPanel } from './components/organisms/CacheTabPanel';
import { NetworkTabPanel } from './components/organisms/NetworkTabPanel';
import { PerformanceTabPanel } from './components/organisms/PerformanceTabPanel';
import { StateTabPanel } from './components/organisms/StateTabPanel';

export interface DebuggerPanelProps {
  state: DebuggerState;
  onTabChange: (tab: DebuggerState['activeTab']) => void;
  onClose?: () => void;
  onUpdateCache?: () => void;
  onUpdateNetwork?: () => void;
  onClearCache?: () => void;
  cachedImages?: CachedImageItem[];
  cacheStats: CacheStats;
  jotaiState?: JotaiDebuggerState;
  performanceMetrics?: PerformanceData;
}

// ─── Floating Panel ───────────────────────────────────────────────────────────

const FloatingPanel = memo(function FloatingPanel({
  state,
  onTabChange,
  onClose,
  onUpdateCache,
  onUpdateNetwork,
  onClearCache,
  cacheStats,
  jotaiState,
  performanceMetrics,
}: DebuggerPanelProps) {
  const tabs: DebuggerState['activeTab'][] = ['cache', 'network', 'performance', 'state'];

  return (
    <div
      className="fixed bg-dt-bg-base border border-dt-border rounded-2xl w-80 max-h-[400px] overflow-hidden z-[9999] shadow-2xl font-dt-sans text-sm text-dt-text-primary"
      style={
        state.position.includes('bottom')
          ? state.position.includes('left')
            ? { bottom: 72, left: 16 }
            : { bottom: 72, right: 16 }
          : state.position.includes('left')
            ? { top: 16, left: 72 }
            : { top: 16, right: 72 }
      }
    >
      {/* Tab row */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-dt-border">
        <div className="flex gap-0.5">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`
                flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium border-b-2 transition-colors cursor-pointer
                ${state.activeTab === tab
                  ? 'text-dt-text-primary border-b-dt-info bg-dt-info/6'
                  : 'text-dt-text-tertiary border-b-transparent hover:text-dt-text-secondary hover:bg-white/2'
                }
              `}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-md text-dt-text-tertiary hover:bg-red-500/10 hover:text-dt-error transition-colors cursor-pointer border-0 bg-transparent"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="p-3 overflow-y-auto max-h-[340px]">
        {state.activeTab === 'cache' && (
          <CacheTabPanel stats={cacheStats} onUpdateCache={onUpdateCache} onClearCache={onClearCache} />
        )}
        {state.activeTab === 'network' && (
          <NetworkTabPanel
            status={jotaiState?.network.status ?? 'ONLINE'}
            rtt={jotaiState?.network.rtt ?? 0}
            lastChecked={jotaiState?.network.lastChecked ?? 0}
            onUpdateNetwork={onUpdateNetwork}
          />
        )}
        {state.activeTab === 'performance' && <PerformanceTabPanel metrics={performanceMetrics} />}
        {state.activeTab === 'state' && <StateTabPanel jotaiState={jotaiState} />}
      </div>
    </div>
  );
});

// ─── Full-Width Panel ─────────────────────────────────────────────────────────

const FullWidthPanel = memo(function FullWidthPanel({
  state,
  onTabChange,
  onClose,
  onUpdateCache,
  onUpdateNetwork,
  onClearCache,
  cachedImages = [],
  cacheStats,
  jotaiState,
  performanceMetrics,
}: DebuggerPanelProps) {
  const networkStatus = jotaiState?.network.status ?? 'ONLINE';

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[420px] bg-dt-bg-base border-t border-dt-border z-[9999] font-dt-sans text-dt-text-primary flex flex-col shadow-[-8px_0_32px_rgba(0,0,0,0.6)]">

      {/* Header */}
      <DebuggerHeader
        networkStatus={networkStatus}
        onRefresh={onUpdateCache}
        onClearCache={onClearCache}
        onClose={onClose}
      />

      {/* Body: two columns */}
      <div className="flex flex-1 min-h-0">

        {/* LEFT: Tabs + content */}
        <div className="w-[420px] flex-none flex flex-col border-r border-dt-border">
          {/* Tab row */}
          <TabBar activeTab={state.activeTab} onTabChange={onTabChange} />

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-3">
            {state.activeTab === 'cache' && (
              <CacheTabPanel stats={cacheStats} onUpdateCache={onUpdateCache} onClearCache={onClearCache} />
            )}
            {state.activeTab === 'network' && (
              <NetworkTabPanel
                status={networkStatus}
                rtt={jotaiState?.network.rtt ?? 0}
                lastChecked={jotaiState?.network.lastChecked ?? 0}
                onUpdateNetwork={onUpdateNetwork}
              />
            )}
            {state.activeTab === 'performance' && <PerformanceTabPanel metrics={performanceMetrics} />}
            {state.activeTab === 'state' && <StateTabPanel jotaiState={jotaiState} />}
          </div>
        </div>

        {/* RIGHT: Cached images list */}
        <CachedImageList items={cachedImages} />
      </div>
    </div>
  );
});

// ─── Main Export ──────────────────────────────────────────────────────────────

export const DebuggerPanel = memo(function DebuggerPanel(props: DebuggerPanelProps) {
  if (props.state.panelMode !== 'fullwidth') {
    return <FloatingPanel {...props} />;
  }
  return <FullWidthPanel {...props} />;
});