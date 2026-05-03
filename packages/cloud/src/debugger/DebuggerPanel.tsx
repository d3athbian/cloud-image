import { memo } from 'react';
import type { DebuggerState, Tab } from './types';
import './styles/devtools.css';

const TAB_LABELS: Record<Tab, string> = {
  cache: 'Cache',
  network: 'Network',
  performance: 'Performance',
  state: 'State',
};

const ICONS = {
  cache: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/><path d="M7 12h2v5H7zm4-3h2v8h-2zm4-3h2v11h-2z"/></svg>`,
  network: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C13.25 6.75 9.75 6.75 5 9z"/></svg>`,
  performance: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>`,
  state: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>`,
  refresh: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>`,
  clear: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H4v2h16V4z"/></svg>`,
  sync: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8l-1.46-1.46C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>`,
  close: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
};

interface DebuggerPanelProps {
  state: DebuggerState;
  onTabChange: (tab: Tab) => void;
  onClose?: () => void;
  onUpdateCache?: () => void;
  onUpdateNetwork?: () => void;
  onClearCache?: () => void;
  cacheStats: {
    itemCount: number;
    totalSize: number;
    hitRate: number;
    missRate: number;
    evictionCount: number;
  };
  jotaiState?: {
    cache: {
      totalItems: number;
      hitCount: number;
      missCount: number;
      lastAccessTime: number;
    };
    network: {
      status: string;
      rtt: number;
      lastChecked: number;
    };
    memory: {
      isUnderPressure: boolean;
      pressureLevel: string;
    };
  };
  performanceMetrics?: {
    avgResponse: number;
    totalRequests: number;
    successRate: number;
  };
}

const formatSize = (bytes: number): string => {
  const mb = bytes / 1024 / 1024;
  return mb < 1 ? `${(mb * 1024).toFixed(0)} KB` : `${mb.toFixed(2)} MB`;
};

const formatTime = (timestamp: number): string => {
  if (!timestamp) return 'Never';
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
};

const StatItem = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) => (
  <div className="flex flex-col p-3 bg-white/[0.04] rounded-lg border border-white/[0.05]">
    <span className="text-[10px] text-[#666] uppercase tracking-wide mb-1">{label}</span>
    <span className={`text-base font-semibold tabular-nums ${color ?? ''}`}>{value}</span>
  </div>
);

const ActionButton = ({
  onClick,
  icon,
  label,
}: {
  onClick?: () => void;
  icon: string;
  label: string;
}) => (
  <button
    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-dt-info/10 border border-dt-info/30 rounded-lg text-dt-info text-xs font-medium cursor-pointer transition-all hover:bg-dt-info/20 hover:border-dt-info/50"
    onClick={onClick}
    title={label}
  >
    <span dangerouslySetInnerHTML={{ __html: icon }} />
    <span>{label}</span>
  </button>
);

const CachePanel = memo(function CachePanel({
  stats,
  onUpdateCache,
  onClearCache,
}: {
  stats: DebuggerPanelProps['cacheStats'];
  onUpdateCache?: () => void;
  onClearCache?: () => void;
}) {
  const hitRate = Math.round(stats.hitRate * 100);
  const missRate = Math.round(stats.missRate * 100);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        <StatItem label="Items Cached" value={stats.itemCount} />
        <StatItem label="Total Size" value={formatSize(stats.totalSize)} />
        <StatItem
          label="Hit Rate"
          value={`${hitRate}%`}
          color={
            hitRate >= 80 ? 'text-dt-success' : hitRate >= 50 ? 'text-dt-warning' : 'text-dt-error'
          }
        />
        <StatItem label="Miss Rate" value={`${missRate}%`} />
        <StatItem label="Evictions" value={stats.evictionCount} />
      </div>

      <div className="flex gap-2 pt-2 border-t border-white/[0.05]">
        <ActionButton onClick={onUpdateCache} icon={ICONS.refresh} label="Refresh Stats" />
        <ActionButton onClick={onClearCache} icon={ICONS.clear} label="Clear Cache" />
      </div>
    </div>
  );
});

const NetworkPanel = memo(function NetworkPanel({
  status,
  onUpdateNetwork,
}: {
  status: string;
  onUpdateNetwork?: () => void;
}) {
  const statusColors: Record<string, string> = {
    ONLINE: 'text-dt-success',
    OFFLINE: 'text-dt-error',
    LOW_BANDWIDTH: 'text-dt-warning',
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        <StatItem
          label="Status"
          value={status.charAt(0).toUpperCase() + status.slice(1)}
          color={statusColors[status]}
        />
      </div>

      <div className="flex gap-2 pt-2 border-t border-white/[0.05]">
        <ActionButton onClick={onUpdateNetwork} icon={ICONS.sync} label="Test Speed" />
      </div>
    </div>
  );
});

const PerformancePanel = memo(function PerformancePanel({
  metrics,
}: {
  metrics?: DebuggerPanelProps['performanceMetrics'];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        <StatItem
          label="Avg Response"
          value={metrics ? `${Math.round(metrics.avgResponse)}ms` : 'N/A'}
        />
        <StatItem label="Total Requests" value={metrics ? metrics.totalRequests : 'N/A'} />
        <StatItem
          label="Success Rate"
          value={metrics ? `${Math.round(metrics.successRate * 100)}%` : 'N/A'}
        />
      </div>
    </div>
  );
});

const StatePanel = memo(function StatePanel({
  jotaiState,
}: {
  jotaiState?: DebuggerPanelProps['jotaiState'];
}) {
  if (!jotaiState) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-center p-10 text-[#666] text-sm">
          No state available
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-white/[0.03] rounded-lg border border-white/[0.05] overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 bg-dt-info/10 border-b border-white/[0.05] text-xs font-semibold text-dt-info uppercase tracking-wide">
          <span dangerouslySetInnerHTML={{ __html: ICONS.cache }} />
          Cache State
        </div>
        <div className="p-0">
          <div className="flex justify-between px-3 py-1.5 text-xs">
            <span>Total Items</span>
            <span className="font-medium tabular-nums">{jotaiState.cache.totalItems}</span>
          </div>
          <div className="flex justify-between px-3 py-1.5 text-xs">
            <span>Hit Count</span>
            <span className="font-medium tabular-nums">{jotaiState.cache.hitCount}</span>
          </div>
          <div className="flex justify-between px-3 py-1.5 text-xs">
            <span>Miss Count</span>
            <span className="font-medium tabular-nums">{jotaiState.cache.missCount}</span>
          </div>
          <div className="flex justify-between px-3 py-1.5 text-xs">
            <span>Last Access</span>
            <span className="font-medium tabular-nums">{formatTime(jotaiState.cache.lastAccessTime)}</span>
          </div>
        </div>
      </div>

      <div className="bg-white/[0.03] rounded-lg border border-white/[0.05] overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 bg-dt-info/10 border-b border-white/[0.05] text-xs font-semibold text-dt-info uppercase tracking-wide">
          <span dangerouslySetInnerHTML={{ __html: ICONS.network }} />
          Network State
        </div>
        <div className="p-0">
          <div className="flex justify-between px-3 py-1.5 text-xs">
            <span>Status</span>
            <span
              className={
                jotaiState.network.status === 'ONLINE' ? 'text-dt-success' : 'text-dt-error'
              }
            >
              {jotaiState.network.status}
            </span>
          </div>
          <div className="flex justify-between px-3 py-1.5 text-xs">
            <span>RTT</span>
            <span className="font-medium tabular-nums">{jotaiState.network.rtt}ms</span>
          </div>
          <div className="flex justify-between px-3 py-1.5 text-xs">
            <span>Last Check</span>
            <span className="font-medium tabular-nums">{formatTime(jotaiState.network.lastChecked)}</span>
          </div>
        </div>
      </div>

      <div className="bg-white/[0.03] rounded-lg border border-white/[0.05] overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 bg-dt-info/10 border-b border-white/[0.05] text-xs font-semibold text-dt-info uppercase tracking-wide">
          <span dangerouslySetInnerHTML={{ __html: ICONS.performance }} />
          Memory State
        </div>
        <div className="p-0">
          <div className="flex justify-between px-3 py-1.5 text-xs">
            <span>Under Pressure</span>
            <span className={jotaiState.memory.isUnderPressure ? 'text-dt-error' : 'text-dt-success'}>
              {jotaiState.memory.isUnderPressure ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex justify-between px-3 py-1.5 text-xs">
            <span>Pressure Level</span>
            <span
              className={
                jotaiState.memory.pressureLevel === 'high'
                  ? 'text-dt-error'
                  : jotaiState.memory.pressureLevel === 'medium'
                    ? 'text-dt-warning'
                    : 'text-dt-success'
              }
            >
              {jotaiState.memory.pressureLevel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

export const DebuggerPanel = memo(function DebuggerPanel({
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
  const tabs: Tab[] = ['cache', 'network', 'performance', 'state'];

  const getPositionStyles = (): React.CSSProperties => {
    const styles: React.CSSProperties = {};
    if (state.position.includes('top')) {
      styles.top = 0;
    } else {
      styles.bottom = 0;
    }
    if (state.position.includes('left')) {
      styles.left = 0;
    } else {
      styles.right = 0;
    }
    return styles;
  };

  return (
    <div
      className={`fixed bg-dt-bg-panel border border-dt-border rounded-2xl w-80 max-h-[400px] overflow-hidden z-[9999] shadow-2xl font-sans text-sm text-dt-text-primary ${
        state.panelMode === 'fullwidth' ? 'w-auto max-w-none left-4 right-4 max-h-[45vh]' : ''
      }`}
      style={getPositionStyles()}
    >
      <div className="flex items-center justify-between px-3 pt-2 bg-white/[0.02] border-b border-dt-border">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-transparent border-none border-b-2 border-transparent text-dt-text-secondary text-xs font-medium cursor-pointer transition-all rounded-t-lg hover:text-dt-text-primary hover:bg-white/5 ${
                state.activeTab === tab
                  ? 'text-dt-info border-b-dt-info bg-dt-info/10'
                  : ''
              }`}
              onClick={() => onTabChange(tab)}
            >
              <span dangerouslySetInnerHTML={{ __html: ICONS[tab as keyof typeof ICONS] }} />
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="flex items-center justify-center w-8 h-8 bg-transparent border-none rounded-lg text-[#666] cursor-pointer transition-all hover:bg-red-500/10 hover:text-red-500"
          onClick={onClose}
          title="Close"
        >
          <span dangerouslySetInnerHTML={{ __html: ICONS.close }} />
        </button>
      </div>

      <div className="p-4 max-h-[calc(45vh-60px)] overflow-y-auto">
        {state.activeTab === 'cache' && (
          <CachePanel
            stats={cacheStats}
            onUpdateCache={onUpdateCache}
            onClearCache={onClearCache}
          />
        )}
        {state.activeTab === 'network' && (
          <NetworkPanel
            status={jotaiState?.network.status ?? 'ONLINE'}
            onUpdateNetwork={onUpdateNetwork}
          />
        )}
        {state.activeTab === 'performance' && <PerformancePanel metrics={performanceMetrics} />}
        {state.activeTab === 'state' && <StatePanel jotaiState={jotaiState} />}
      </div>
    </div>
  );
});