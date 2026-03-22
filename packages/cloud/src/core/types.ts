/**
 * CacheEntry - Represents a cached image with metadata
 */
export interface CacheEntry {
  url: string;
  data: ArrayBuffer;
  metadata: CacheMetadata;
  qualityTier: 'low' | 'medium' | 'high';
  upgradeable: boolean;
  cachedBandwidth?: number;
  expiresAt?: number;
}

export interface CacheMetadata {
  size: number;
  width?: number;
  height?: number;
  mimeType: string;
  cachedAt: number;
  accessedAt: number;
  accessCount: number;
  etag?: string;
  lastModified?: string;
}

/**
 * CacheConfig - Configuration options for the cache system
 */
export interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  memoryTierSize: number;
  platformOverride?: PlatformType;
  debug?: boolean;
  maxRetries?: number;
  requestTimeout?: number;
}

export const DEFAULT_CACHE_CONFIG: Required<Omit<CacheConfig, 'platformOverride'>> = {
  maxSize: 100 * 1024 * 1024, // 100MB
  defaultTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
  memoryTierSize: 20 * 1024 * 1024, // 20MB
  debug: false,
  maxRetries: 3,
  requestTimeout: 10000,
};

/**
 * CacheStats - Current cache state
 */
export interface CacheStats {
  itemCount: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
}

/**
 * Platform types
 */
export type PlatformType = 'web' | 'tizen' | 'webos' | 'memory';

/**
 * Circuit breaker states
 */
export type CircuitBreakerState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
}

/**
 * Network status
 */
export interface NetworkStatus {
  online: boolean;
  bandwidth: BandwidthClassification;
  mbps?: number;
  rtt?: number;
}

export type BandwidthClassification = 'low' | 'medium' | 'high' | 'unknown';

/**
 * Worker message types
 */
export type WorkerMessageType =
  | 'get'
  | 'set'
  | 'delete'
  | 'clear'
  | 'stats'
  | 'init'
  | 'destroy';

export interface WorkerMessage<T = unknown> {
  id: string;
  type: WorkerMessageType;
  payload?: T;
  timestamp: number;
}

export interface WorkerResponse<T = unknown> {
  id: string;
  type: 'success' | 'error';
  payload?: T;
  error?: string;
  timestamp: number;
}
