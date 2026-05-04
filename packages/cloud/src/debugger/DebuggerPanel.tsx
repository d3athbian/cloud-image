import { memo } from 'react';
import type { DebuggerState, Tab } from './types';
import './styles/devtools.css';

const TAB_LABELS: Record<Tab, string> = {
  cache: 'Cache',
  network: 'Network',
  performance: 'Perf',
  state: 'State',
};

const ICONS = {
  cache: `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/><path d="M7 12h2v5H7zm4-3h2v8h-2zm4-3h2v11h-2z"/></svg>`,
  network: `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C13.25 6.75 9.75 6.75 5 9z"/></svg>`,
  performance: `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>`,
  state: `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>`,
  refresh: `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>`,
  clear: `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H4v2h16V4z"/></svg>`,
  close: `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
  image: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>`,
};

export interface CachedImageItem {
  url: string;
  size: number;
  mimeType: string;
  cachedAt: number;
}

interface DebuggerPanelProps {
  state: DebuggerState;
  onTabChange: (tab: Tab) => void;
  onClose?: () => void;
  onUpdateCache?: () => void;
  onUpdateNetwork?: () => void;
  onClearCache?: () => void;
  cachedImages?: CachedImageItem[];
  cacheStats: {
    itemCount: number;
    totalSize: number;
    hitRate: number;
    missRate: number;
    evictionCount: number;
  };
  jotaiState?: {
    cache: { totalItems: number; hitCount: number; missCount: number; lastAccessTime: number };
    network: { status: string; rtt: number; lastChecked: number };
    memory: { isUnderPressure: boolean; pressureLevel: string };
  };
  performanceMetrics?: { avgResponse: number; totalRequests: number; successRate: number };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatSize = (bytes: number): string => {
  const mb = bytes / 1024 / 1024;
  return mb < 1 ? `${(mb * 1024).toFixed(0)} KB` : `${mb.toFixed(2)} MB`;
};

const formatTime = (ts: number): string => {
  if (!ts) return 'Never';
  return new Date(ts).toLocaleTimeString();
};

const getFilename = (url: string): string => {
  try {
    const parts = url.split('/');
    const name = parts[parts.length - 1]?.split('?')[0] ?? url;
    return name.length > 0 ? name : url;
  } catch {
    return url;
  }
};

// ─── Small primitives ─────────────────────────────────────────────────────────

const Stat = ({ label, value, color }: { label: string; value: string | number; color?: string }) => (
  <div className="flex flex-col p-2.5 bg-[#111111] rounded-lg border border-[#1f1f1f]">
    <span className="text-[10px] text-[#555] uppercase tracking-widest mb-0.5">{label}</span>
    <span className={`text-sm font-semibold tabular-nums ${color ?? 'text-[#fafafa]'}`}>{value}</span>
  </div>
);

const GhostBtn = ({
  onClick,
  icon,
  label,
  danger,
}: {
  onClick?: () => void;
  icon: string;
  label: string;
  danger?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-1.5 h-6 px-2.5 rounded-md text-[10px] font-medium border bg-transparent transition-colors cursor-pointer ${
      danger
        ? 'border-[#333] text-[#888] hover:border-red-800/60 hover:text-red-400'
        : 'border-[#333] text-[#888] hover:border-[#555] hover:text-[#fafafa]'
    }`}
  >
    <span dangerouslySetInnerHTML={{ __html: icon }} />
    {label}
  </button>
);

// ─── Tab panels ───────────────────────────────────────────────────────────────

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
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-1.5">
        <Stat label="Items Cached" value={stats.itemCount} />
        <Stat label="Total Size" value={formatSize(stats.totalSize)} />
        <Stat
          label="Hit Rate"
          value={`${hitRate}%`}
          color={hitRate >= 80 ? 'text-[#10b981]' : hitRate >= 50 ? 'text-[#f5a623]' : 'text-red-400'}
        />
        <Stat label="Miss Rate" value={`${missRate}%`} />
        <Stat label="Evictions" value={stats.evictionCount} />
      </div>
      <div className="flex gap-1.5 pt-1.5 border-t border-[#1f1f1f]">
        <GhostBtn onClick={onUpdateCache} icon={ICONS.refresh} label="Refresh" />
        <GhostBtn onClick={onClearCache} icon={ICONS.clear} label="Clear Cache" danger />
      </div>
    </div>
  );
});

const NetworkPanel = memo(function NetworkPanel({
  status,
  rtt,
  lastChecked,
  onUpdateNetwork,
}: {
  status: string;
  rtt: number;
  lastChecked: number;
  onUpdateNetwork?: () => void;
}) {
  const statusColor =
    status === 'ONLINE' ? 'text-[#10b981]' : status === 'LOW_BANDWIDTH' ? 'text-[#f5a623]' : 'text-red-400';
  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-1.5">
        <Stat label="Status" value={status} color={statusColor} />
        <Stat label="RTT" value={`${rtt}ms`} />
        <Stat label="Last Check" value={formatTime(lastChecked)} />
      </div>
      <div className="flex gap-1.5 pt-1.5 border-t border-[#1f1f1f]">
        <GhostBtn onClick={onUpdateNetwork} icon={ICONS.refresh} label="Test Speed" />
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
    <div className="grid grid-cols-2 gap-1.5">
      <Stat label="Avg Response" value={metrics ? `${Math.round(metrics.avgResponse)}ms` : 'N/A'} />
      <Stat label="Total Requests" value={metrics ? metrics.totalRequests : 'N/A'} />
      <Stat
        label="Success Rate"
        value={metrics ? `${Math.round(metrics.successRate * 100)}%` : 'N/A'}
        color={
          metrics && metrics.successRate >= 0.8
            ? 'text-[#10b981]'
            : metrics && metrics.successRate >= 0.5
              ? 'text-[#f5a623]'
              : 'text-red-400'
        }
      />
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
      <div className="flex items-center justify-center h-20 text-[11px] text-[#444]">No state available</div>
    );
  }

  const cardHeader = (label: string) => (
    <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#0070f3] bg-[#0070f3]/[0.06] border-b border-[#1f1f1f]">
      {label}
    </div>
  );
  const row = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between items-center px-2.5 py-1 text-[10px]">
      <span className="text-[#555]">{label}</span>
      <span className="font-medium tabular-nums text-[#fafafa]">{value}</span>
    </div>
  );

  return (
    <div className="grid grid-cols-3 gap-1.5">
      <div className="bg-[#111111] rounded-lg border border-[#1f1f1f] overflow-hidden">
        {cardHeader('Cache')}
        {row('Items', jotaiState.cache.totalItems)}
        {row('Hits', jotaiState.cache.hitCount)}
        {row('Misses', jotaiState.cache.missCount)}
        {row('Last Access', formatTime(jotaiState.cache.lastAccessTime))}
      </div>
      <div className="bg-[#111111] rounded-lg border border-[#1f1f1f] overflow-hidden">
        {cardHeader('Network')}
        {row(
          'Status',
          <span className={jotaiState.network.status === 'ONLINE' ? 'text-[#10b981]' : 'text-red-400'}>
            {jotaiState.network.status}
          </span>,
        )}
        {row('RTT', `${jotaiState.network.rtt}ms`)}
        {row('Last Check', formatTime(jotaiState.network.lastChecked))}
      </div>
      <div className="bg-[#111111] rounded-lg border border-[#1f1f1f] overflow-hidden">
        {cardHeader('Memory')}
        {row(
          'Pressure',
          <span className={jotaiState.memory.isUnderPressure ? 'text-red-400' : 'text-[#10b981]'}>
            {jotaiState.memory.isUnderPressure ? 'Yes' : 'No'}
          </span>,
        )}
        {row(
          'Level',
          <span
            className={
              jotaiState.memory.pressureLevel === 'high'
                ? 'text-red-400'
                : jotaiState.memory.pressureLevel === 'medium'
                  ? 'text-[#f5a623]'
                  : 'text-[#10b981]'
            }
          >
            {jotaiState.memory.pressureLevel}
          </span>,
        )}
      </div>
    </div>
  );
});

// ─── Cached Image Row ─────────────────────────────────────────────────────────

const CachedImageRow = memo(function CachedImageRow({ item }: { item: CachedImageItem }) {
  const filename = getFilename(item.url);
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors cursor-default">
      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-md bg-[#111111] border border-[#1f1f1f] flex-none overflow-hidden flex items-center justify-center">
        <img
          src={item.url}
          alt={filename}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-[#fafafa] truncate">{filename}</p>
        <p className="text-[10px] text-[#555] truncate mt-0.5">{item.url}</p>
      </div>
      {/* Meta */}
      <div className="flex items-center gap-2 flex-none">
        <span className="text-[10px] tabular-nums text-[#888] bg-[#111111] border border-[#1f1f1f] rounded px-1.5 py-0.5">
          {formatSize(item.size)}
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] flex-none" title="Cached" />
      </div>
    </div>
  );
});

// ─── Main Panel ───────────────────────────────────────────────────────────────

export const DebuggerPanel = memo(function DebuggerPanel({
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
  const tabs: Tab[] = ['cache', 'network', 'performance', 'state'];
  const networkStatus = jotaiState?.network.status ?? 'ONLINE';
  const statusDotColor =
    networkStatus === 'ONLINE'
      ? 'bg-[#10b981]'
      : networkStatus === 'LOW_BANDWIDTH'
        ? 'bg-[#f5a623]'
        : 'bg-red-500';

  // Floating mode keeps original compact style
  if (state.panelMode !== 'fullwidth') {
    return (
      <div
        className="fixed bg-[#0a0a0a] border border-[#1f1f1f] rounded-2xl w-80 max-h-[400px] overflow-hidden z-[9999] shadow-2xl font-sans text-sm text-[#fafafa]"
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
        {/* Compact header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#1f1f1f]">
          <div className="flex gap-0.5">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => onTabChange(tab)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium border-b-2 transition-colors cursor-pointer ${
                  state.activeTab === tab
                    ? 'text-[#fafafa] border-b-[#0070f3] bg-[#0070f3]/[0.06]'
                    : 'text-[#666] border-b-transparent hover:text-[#999] hover:bg-white/[0.02]'
                }`}
              >
                <span dangerouslySetInnerHTML={{ __html: ICONS[tab as keyof typeof ICONS] }} />
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-md text-[#666] hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer border-0 bg-transparent"
          >
            <span dangerouslySetInnerHTML={{ __html: ICONS.close }} />
          </button>
        </div>
        <div className="p-3 overflow-y-auto max-h-[340px]">
          {state.activeTab === 'cache' && (
            <CachePanel stats={cacheStats} onUpdateCache={onUpdateCache} onClearCache={onClearCache} />
          )}
          {state.activeTab === 'network' && (
            <NetworkPanel
              status={networkStatus}
              rtt={jotaiState?.network.rtt ?? 0}
              lastChecked={jotaiState?.network.lastChecked ?? 0}
              onUpdateNetwork={onUpdateNetwork}
            />
          )}
          {state.activeTab === 'performance' && <PerformancePanel metrics={performanceMetrics} />}
          {state.activeTab === 'state' && <StatePanel jotaiState={jotaiState} />}
        </div>
      </div>
    );
  }

  // ── Full-width mode ─────────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-0 left-0 right-0 h-[420px] bg-[#0a0a0a] border-t border-[#1f1f1f] z-[9999] font-sans text-[#fafafa] flex flex-col shadow-[0_-8px_32px_rgba(0,0,0,0.6)]">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="h-10 flex-none flex items-center justify-between px-4 border-b border-[#1f1f1f] bg-[#0a0a0a]">
        {/* Left: branding + status */}
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#0070f3] flex-none" />
          <span className="text-xs font-semibold tracking-tight">CloudImage DevTools</span>
          <span className="px-1.5 py-0.5 text-[10px] rounded bg-[#1f1f1f] text-[#888] border border-[#333]">
            v0.1
          </span>
          <span className="w-1 h-1 rounded-full bg-[#333] flex-none" />
          <div className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full flex-none ${statusDotColor}`} />
            <span className="text-[10px] text-[#888]">{networkStatus}</span>
          </div>
        </div>
        {/* Right: actions */}
        <div className="flex items-center gap-1.5">
          <GhostBtn onClick={onUpdateCache} icon={ICONS.refresh} label="Refresh" />
          <GhostBtn onClick={onClearCache} icon={ICONS.clear} label="Clear Cache" danger />
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-md text-[#666] hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer border-0 bg-transparent ml-1"
            title="Close"
          >
            <span dangerouslySetInnerHTML={{ __html: ICONS.close }} />
          </button>
        </div>
      </div>

      {/* ── Body: two columns ──────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* ── LEFT: Tabs + content ──────────────────────────────────────────── */}
        <div className="w-[420px] flex-none flex flex-col border-r border-[#1f1f1f]">
          {/* Tab row */}
          <div className="h-9 flex-none flex border-b border-[#1f1f1f] bg-[#0a0a0a]">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => onTabChange(tab)}
                className={`flex-1 flex items-center justify-center gap-1.5 h-full text-[11px] font-medium border-b-2 transition-colors cursor-pointer bg-transparent border-l-0 border-r-0 border-t-0 ${
                  state.activeTab === tab
                    ? 'text-[#fafafa] border-b-[#0070f3] bg-[#0070f3]/[0.06]'
                    : 'text-[#666] border-b-transparent hover:text-[#999] hover:bg-white/[0.02]'
                }`}
              >
                <span dangerouslySetInnerHTML={{ __html: ICONS[tab as keyof typeof ICONS] }} />
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-3">
            {state.activeTab === 'cache' && (
              <CachePanel stats={cacheStats} onUpdateCache={onUpdateCache} onClearCache={onClearCache} />
            )}
            {state.activeTab === 'network' && (
              <NetworkPanel
                status={networkStatus}
                rtt={jotaiState?.network.rtt ?? 0}
                lastChecked={jotaiState?.network.lastChecked ?? 0}
                onUpdateNetwork={onUpdateNetwork}
              />
            )}
            {state.activeTab === 'performance' && <PerformancePanel metrics={performanceMetrics} />}
            {state.activeTab === 'state' && <StatePanel jotaiState={jotaiState} />}
          </div>
        </div>

        {/* ── RIGHT: Cached images list ─────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Section header */}
          <div className="h-9 flex-none flex items-center px-4 border-b border-[#1f1f1f] bg-[#0a0a0a]">
            <span className="text-[11px] font-semibold tracking-tight">Cached Images</span>
            <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded-full bg-[#1f1f1f] border border-[#333] text-[#888] tabular-nums">
              {cachedImages.length}
            </span>
          </div>

          {/* List */}
          {cachedImages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-[#333]">
              <span className="opacity-30" dangerouslySetInnerHTML={{ __html: ICONS.image }} />
              <span className="text-[11px]">No cached images</span>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-[#1f1f1f]">
              {cachedImages.map((item) => (
                <CachedImageRow key={item.url} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});