/**
 * CacheEntry - Represents a cached image with metadata
 */
export interface CacheEntry {
  url: string;
  data: ArrayBuffer;
  metadata: CacheMetadata;
  qualityTier: "low" | "medium" | "high";
  upgradeable: boolean;
  cachedBandwidth?: number;
  expiresAt?: number;
  state: CacheEntryState;
  syncedAt?: number;
}

export type CacheEntryState = "pending" | "caching" | "cached" | "validated" | "failed";

export interface CacheMetadata {
  size: number;
  width?: number;
  height?: number;
  mimeType: string;
  cachedAt: number;
  accessedAt: number;
  accessCount: number;
  etag?: string;
  lastModified?: number;
  isInViewport?: boolean;
  lastViewportSeen?: number;
}

/**
 * CacheConfig - Configuration options for the cache system
 * @deprecated Use CacheConfig from ../types/cache-config.schema.ts
 */
export type CacheConfig = import("../types/cache-config.schema").CacheConfig;

import { DEFAULT_CACHE_CONFIG } from "../config/constants";

export { DEFAULT_CACHE_CONFIG };

export interface CacheStats {
  itemCount: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
}

/**
 * Platform types
 * @deprecated Use PlatformType from ../types/cache-config.schema.ts
 */
export type PlatformType = import("../types/cache-config.schema").PlatformType;

/**
 * Circuit breaker states
 * @deprecated Use CircuitBreakerState from ../types/circuit-breaker.schema.ts
 */
export type CircuitBreakerState = import("../types/circuit-breaker.schema").CircuitBreakerState;

/**
 * Circuit breaker configuration
 * @deprecated Use CircuitBreakerConfig from ../types/circuit-breaker.schema.ts
 */
export type CircuitBreakerConfig = import("../types/circuit-breaker.schema").CircuitBreakerConfig;

/**
 * Network status
 * @deprecated Use NetworkStatus from ../types/network-monitor.schema.ts
 */
export type NetworkStatus = import("../types/network-monitor.schema").NetworkStatus;

/**
 * Bandwidth classification
 * @deprecated Use BandwidthClassification from ../types/network-monitor.schema.ts
 */
export type BandwidthClassification =
  import("../types/network-monitor.schema").BandwidthClassification;

/**
 * Worker message types
 */
export type WorkerMessageType = "get" | "set" | "delete" | "clear" | "stats" | "init" | "destroy";

export interface WorkerMessage<T = unknown> {
  id: string;
  type: WorkerMessageType;
  payload?: T;
  timestamp: number;
}

export interface WorkerResponse<T = unknown> {
  id: string;
  type: "success" | "error";
  payload?: T;
  error?: string;
  timestamp: number;
}
