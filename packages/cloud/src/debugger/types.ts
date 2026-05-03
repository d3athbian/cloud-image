export type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export type Tab = 'cache' | 'network' | 'performance' | 'state';

export type PanelMode = 'floating' | 'fullwidth';

export interface DebuggerState {
  isOpen: boolean;
  activeTab: Tab;
  position: Position;
  isExpanded: boolean;
  panelMode: PanelMode;
}

export const DEFAULT_DEBUGGER_STATE: DebuggerState = {
  isOpen: false,
  activeTab: 'cache',
  position: 'bottom-left',
  isExpanded: true,
  panelMode: 'fullwidth',
};

export interface CacheEntry {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  status: number;
  size: number;
  timestamp: number;
  ttl: number | null;
  cached: boolean;
}

export interface NetworkRequest {
  id: string;
  url: string;
  method: string;
  status: number;
  duration: number;
  timestamp: number;
}

export interface PerformanceMetrics {
  cacheHitRate: number;
  avgResponseTime: number;
  totalRequests: number;
  activeRequests: number;
}

export interface CacheStateData {
  totalItems: number;
  hitCount: number;
  missCount: number;
  lastAccessTime: number;
}

export interface NetworkStateData {
  status: 'ONLINE' | 'OFFLINE' | 'LOW_BANDWIDTH';
  rtt: number;
  lastChecked: number;
}

export interface MemoryStateData {
  isUnderPressure: boolean;
  pressureLevel: 'low' | 'medium' | 'high';
}

export interface TransferStats {
  totalBytesTransferred: number;
  totalMessages: number;
  avgTransferTime: number;
  compressionRatio: number;
}
