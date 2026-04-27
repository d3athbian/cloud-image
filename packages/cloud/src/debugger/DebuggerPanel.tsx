import { memo } from "react";
import type { DebuggerState, Tab } from "./types";

const TAB_LABELS: Record<Tab, string> = {
  cache: "Cache",
  network: "Network",
  performance: "Performance",
  state: "State",
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
  if (!timestamp) return "Never";
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
  <div className="debugger-stat">
    <span className="debugger-label">{label}</span>
    <span className={`debugger-value ${color ?? ""}`}>{value}</span>
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
  <button className="debugger-action-btn" onClick={onClick} title={label}>
    <span dangerouslySetInnerHTML={{ __html: icon }} />
    <span>{label}</span>
  </button>
);

const CachePanel = memo(function CachePanel({
  stats,
  onUpdateCache,
  onClearCache,
}: {
  stats: DebuggerPanelProps["cacheStats"];
  onUpdateCache?: () => void;
  onClearCache?: () => void;
}) {
  const hitRate = Math.round(stats.hitRate * 100);
  const missRate = Math.round(stats.missRate * 100);

  return (
    <div className="debugger-panel-section">
      <div className="debugger-metrics">
        <StatItem label="Items Cached" value={stats.itemCount} />
        <StatItem label="Total Size" value={formatSize(stats.totalSize)} />
        <StatItem
          label="Hit Rate"
          value={`${hitRate}%`}
          color={
            hitRate >= 80 ? "text-green-500" : hitRate >= 50 ? "text-yellow-500" : "text-red-500"
          }
        />
        <StatItem label="Miss Rate" value={`${missRate}%`} />
        <StatItem label="Evictions" value={stats.evictionCount} />
      </div>

      <div className="debugger-actions">
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
    ONLINE: "text-green-500",
    OFFLINE: "text-red-500",
    LOW_BANDWIDTH: "text-yellow-500",
  };

  return (
    <div className="debugger-panel-section">
      <div className="debugger-metrics">
        <StatItem
          label="Status"
          value={status.charAt(0).toUpperCase() + status.slice(1)}
          color={statusColors[status]}
        />
      </div>

      <div className="debugger-actions">
        <ActionButton onClick={onUpdateNetwork} icon={ICONS.sync} label="Test Speed" />
      </div>
    </div>
  );
});

const PerformancePanel = memo(function PerformancePanel({
  metrics,
}: {
  metrics?: DebuggerPanelProps["performanceMetrics"];
}) {
  return (
    <div className="debugger-panel-section">
      <div className="debugger-metrics">
        <StatItem label="Avg Response" value={metrics ? `${Math.round(metrics.avgResponse)}ms` : "N/A"} />
        <StatItem label="Total Requests" value={metrics ? metrics.totalRequests : "N/A"} />
        <StatItem label="Success Rate" value={metrics ? `${Math.round(metrics.successRate * 100)}%` : "N/A"} />
      </div>
    </div>
  );
});

const StatePanel = memo(function StatePanel({
  jotaiState,
}: {
  jotaiState?: DebuggerPanelProps["jotaiState"];
}) {
  if (!jotaiState) {
    return (
      <div className="debugger-panel-section">
        <div className="debugger-empty">No state available</div>
      </div>
    );
  }

  return (
    <div className="debugger-state-content">
      <div className="debugger-state-card">
        <div className="debugger-state-header">
          <span dangerouslySetInnerHTML={{ __html: ICONS.cache }} />
          Cache State
        </div>
        <div className="debugger-state-body">
          <div className="debugger-state-row">
            <span>Total Items</span>
            <span>{jotaiState.cache.totalItems}</span>
          </div>
          <div className="debugger-state-row">
            <span>Hit Count</span>
            <span>{jotaiState.cache.hitCount}</span>
          </div>
          <div className="debugger-state-row">
            <span>Miss Count</span>
            <span>{jotaiState.cache.missCount}</span>
          </div>
          <div className="debugger-state-row">
            <span>Last Access</span>
            <span>{formatTime(jotaiState.cache.lastAccessTime)}</span>
          </div>
        </div>
      </div>

      <div className="debugger-state-card">
        <div className="debugger-state-header">
          <span dangerouslySetInnerHTML={{ __html: ICONS.network }} />
          Network State
        </div>
        <div className="debugger-state-body">
          <div className="debugger-state-row">
            <span>Status</span>
            <span
              className={jotaiState.network.status === "ONLINE" ? "text-green-500" : "text-red-500"}
            >
              {jotaiState.network.status}
            </span>
          </div>
          <div className="debugger-state-row">
            <span>RTT</span>
            <span>{jotaiState.network.rtt}ms</span>
          </div>
          <div className="debugger-state-row">
            <span>Last Check</span>
            <span>{formatTime(jotaiState.network.lastChecked)}</span>
          </div>
        </div>
      </div>

      <div className="debugger-state-card">
        <div className="debugger-state-header">
          <span dangerouslySetInnerHTML={{ __html: ICONS.performance }} />
          Memory State
        </div>
        <div className="debugger-state-body">
          <div className="debugger-state-row">
            <span>Under Pressure</span>
            <span className={jotaiState.memory.isUnderPressure ? "text-red-500" : "text-green-500"}>
              {jotaiState.memory.isUnderPressure ? "Yes" : "No"}
            </span>
          </div>
          <div className="debugger-state-row">
            <span>Pressure Level</span>
            <span
              className={
                jotaiState.memory.pressureLevel === "high"
                  ? "text-red-500"
                  : jotaiState.memory.pressureLevel === "medium"
                    ? "text-yellow-500"
                    : "text-green-500"
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
  onClearCache,
  cacheStats,
  jotaiState,
  performanceMetrics,
}: DebuggerPanelProps) {
  const tabs: Tab[] = ["cache", "network", "performance", "state"];

  const getPositionStyles = (): React.CSSProperties => {
    const styles: React.CSSProperties = {};
    if (state.position.includes("top")) {
      styles.top = 0;
    } else {
      styles.bottom = 0;
    }
    if (state.position.includes("left")) {
      styles.left = 0;
    } else {
      styles.right = 0;
    }
    return styles;
  };

  return (
    <div
      className={`debugger-panel ${state.panelMode === "fullwidth" ? "debugger-panel-fullwidth" : ""}`}
      style={getPositionStyles()}
    >
      <div className="debugger-header">
        <div className="debugger-tabs">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab}
              className={`debugger-tab ${state.activeTab === tab ? "active" : ""}`}
              onClick={() => onTabChange(tab)}
            >
              <span dangerouslySetInnerHTML={{ __html: ICONS[tab as keyof typeof ICONS] }} />
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
        <button type="button" className="debugger-close-btn" onClick={onClose} title="Close">
          <span dangerouslySetInnerHTML={{ __html: ICONS.close }} />
        </button>
      </div>

      <div className="debugger-panel-content">
        {state.activeTab === "cache" && (
          <CachePanel
            stats={cacheStats}
            onUpdateCache={onUpdateCache}
            onClearCache={onClearCache}
          />
        )}
        {state.activeTab === "network" && (
          <NetworkPanel
            status={jotaiState?.network.status ?? "ONLINE"}
            onUpdateNetwork={onUpdateNetwork}
          />
        )}
        {state.activeTab === "performance" && <PerformancePanel metrics={performanceMetrics} />}
        {state.activeTab === "state" && <StatePanel jotaiState={jotaiState} />}
      </div>
    </div>
  );
});
