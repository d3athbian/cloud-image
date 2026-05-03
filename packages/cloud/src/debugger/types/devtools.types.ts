export interface CacheItemMetadata {
  url: string;
  key: string;
  size: number;
  mimeType: string;
  cachedAt: number;
  accessedAt: number;
  accessCount: number;
  ttl: number;
  expiresIn: number;
  lruScore: number;
  status: 'active' | 'expired' | 'evicted' | 'pinned';
  source: 'sw' | 'idb' | 'memory';
}

export interface NetworkState {
  online: boolean;
  rtt: number | null;
  downlink: number | null;
  effectiveType: string | null;
  circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

export interface PerformanceMetrics {
  workerStatus: 'Idle' | 'Active' | 'Terminated';
  decodeTimeMs: number;
  swStatus: 'Active' | 'Installing' | 'Error';
}

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  context?: string;
}

export interface DevToolsUIState {
  isOpen: boolean;
  activeTab: 'cache' | 'network' | 'performance' | 'state';
  selectedItemUrl: string | null;
  logsFilter: LogLevel | 'ALL';
}

export type Tab = 'cache' | 'network' | 'performance' | 'state';
