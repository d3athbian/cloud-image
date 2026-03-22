# Data Model: VYNX Engine

**Date**: 2026-03-19  
**Feature**: 002-vynx-image-cache-engine

---

## Core Types

### CacheEntry

Represents a cached image with all metadata.

```typescript
interface CacheEntry {
  /** Unique identifier (URL) */
  url: string;
  
  /** Raw image data */
  data: ArrayBuffer;
  
  /** Metadata */
  metadata: {
    /** File size in bytes */
    size: number;
    
    /** Width in pixels (if known) */
    width?: number;
    
    /** Height in pixels (if known) */
    height?: number;
    
    /** MIME type (image/jpeg, image/png, etc.) */
    mimeType: string;
    
    /** Original fetch timestamp */
    cachedAt: number;
    
    /** Last access timestamp */
    accessedAt: number;
    
    /** Access count */
    accessCount: number;
    
    /** ETag for cache validation */
    etag?: string;
    
    /** Last-Modified header */
    lastModified?: string;
  };
  
  /** Quality tier for bandwidth intelligence */
  qualityTier: 'low' | 'medium' | 'high';
  
  /** Whether this entry can be upgraded to higher quality */
  upgradeable: boolean;
  
  /** Bandwidth (Mbps) when this image was cached */
  cachedBandwidth?: number;
  
  /** Expiration settings */
  expiresAt?: number; // Unix timestamp
}
```

### CacheConfig

Configuration options for the cache system.

```typescript
interface CacheConfig {
  /** Maximum cache size in bytes (default: 100MB) */
  maxSize?: number;
  
  /** Default TTL in milliseconds (default: 7 days) */
  defaultTTL?: number;
  
  /** Memory tier size in bytes (default: 20MB) */
  memoryTierSize?: number;
  
  /** Override platform detection */
  platformOverride?: PlatformType;
  
  /** Enable debug logging */
  debug?: boolean;
  
  /** Network retry count */
  maxRetries?: number;
  
  /** Request timeout in ms */
  requestTimeout?: number;
  
  /** Enable progressive loading */
  progressiveLoading?: boolean;
  
  /** Quality threshold for low-res placeholder */
  lowResQuality?: number;
  
  /** CDN configuration for bandwidth-aware variants */
  cdn?: CDNConfig;
}

interface CDNConfig {
  /** CDN base domain */
  domain?: string;
  
  /** Available size variants */
  variants?: string[];
  
  /** Variant URL pattern (default: "{url}?size={variant}") */
  urlPattern?: string;
  
  /** Enable bandwidth intelligence (default: true) */
  bandwidthAware?: boolean;
}
```

### CacheStats

Current cache state for monitoring.

```typescript
interface CacheStats {
  /** Total items in cache */
  itemCount: number;
  
  /** Total size in bytes */
  totalSize: number;
  
  /** Memory tier size in bytes */
  memorySize: number;
  
  /** Cache hits since init */
  hits: number;
  
  /** Cache misses since init */
  misses: number;
  
  /** Total evictions */
  evictions: number;
  
  /** Hit rate percentage */
  hitRate: number;
  
  /** Timestamp of stats reset */
  resetAt: number;
}
```

### PlatformType

Supported platform adapters.

```typescript
type PlatformType = 'web' | 'tizen' | 'webos' | 'memory';

interface PlatformAdapter {
  readonly platform: PlatformType;
  
  /** Initialize adapter */
  init(): Promise<void>;
  
  /** Read entry from storage */
  get(url: string): Promise<CacheEntry | null>;
  
  /** Write entry to storage */
  set(entry: CacheEntry): Promise<void>;
  
  /** Delete entry from storage */
  delete(url: string): Promise<boolean>;
  
  /** Check if entry exists */
  has(url: string): Promise<boolean>;
  
  /** Get all cached URLs */
  keys(): Promise<string[]>;
  
  /** Clear all entries */
  clear(): Promise<void>;
  
  /** Get total storage used */
  getSize(): Promise<number>;
  
  /** Cleanup resources */
  destroy(): void;
}
```

---

## Bandwidth Intelligence Types

### BandwidthClassification

Connection speed classification.

```typescript
type BandwidthClassification = 'low' | 'medium' | 'high';

interface BandwidthSample {
  /** Bytes per second */
  bytesPerSecond: number;
  
  /** Calculated Mbps */
  mbps: number;
  
  /** Timestamp of sample */
  timestamp: number;
  
  /** Whether this sample is from navigator.connection API */
  isConnectionApi: boolean;
}

interface BandwidthMonitorState {
  /** Current classification */
  classification: BandwidthClassification;
  
  /** Current estimated bandwidth (Mbps) */
  estimatedMbps: number;
  
  /** Median of last 10 samples */
  samples: BandwidthSample[];
  
  /** Timestamp of last classification change */
  lastClassificationChange: number;
  
  /** Previous classification (for detecting improvements) */
  previousClassification?: BandwidthClassification;
}
```

### BandwidthMonitor Events

```typescript
type BandwidthEventType = 
  | 'bandwidthChange'  // Classification changed
  | 'sampleUpdate'      // New sample added
  | 'classificationStable'; // Classification stable for N samples

interface BandwidthEvent {
  type: BandwidthEventType;
  state: BandwidthMonitorState;
  timestamp: number;
}
```

---

## React Component Types

### VynxImageProps

Props for the VynxImage component (extends native img).

```typescript
interface VynxImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Image source URL */
  src: string;
  
  /** Placeholder image (low-res or blur) */
  placeholder?: string;
  
  /** Show loading state */
  showLoading?: boolean;
  
  /** Fallback on error */
  fallback?: React.ReactNode;
  
  /** Disable caching for this image */
  noCache?: boolean;
  
  /** Preload image on mount */
  preload?: boolean;
  
  /** Custom cache key (defaults to src) */
  cacheKey?: string;
  
  /** Callback when image loads from cache */
  onCacheHit?: () => void;
  
  /** Callback when image loads from network */
  onCacheMiss?: () => void;
}

type VynxImageStatus = 'pending' | 'loading' | 'loaded' | 'error' | 'offline';
```

### VynxProviderConfig

Configuration passed to VynxProvider.

```typescript
interface VynxProviderConfig {
  /** Cache configuration */
  cache?: Partial<CacheConfig>;
  
  /** Children to render */
  children: React.ReactNode;
  
  /** Component to show while image loads */
  LoadingComponent?: React.ComponentType;
  
  /** Component to show on error */
  ErrorComponent?: React.ComponentType<{ error: Error }>;
  
  /** Enable devtools */
  devtools?: boolean;
}
```

### useVynxReturn

Return type for useVynx hook.

```typescript
interface useVynxReturn {
  /** Cache API */
  cache: {
    /** Get cached image */
    get(url: string): Promise<string | null>; // objectURL
    
    /** Prefetch images */
    prefetch(urls: string[]): Promise<void>;
    
    /** Invalidate specific image */
    invalidate(url: string): Promise<void>;
    
    /** Clear entire cache */
    clear(): Promise<void>;
    
    /** Get current stats */
    getStats(): CacheStats;
  };
  
  /** Network status */
  network: {
    /** Is online */
    online: boolean;
    
    /** Bandwidth classification */
    bandwidth: BandwidthClassification;
    
    /** Estimated bandwidth (Mbps) */
    mbps: number;
    
    /** Round-trip time (ms) */
    rtt: number;
  };
  
  /** Direct engine access (advanced) */
  engine: ImageEngine;
}
```

---

## Worker Protocol Types

### WorkerMessage

Base message structure for Worker communication.

```typescript
type WorkerMessageType = 
  | 'get'
  | 'set'
  | 'delete'
  | 'clear'
  | 'prefetch'
  | 'stats'
  | 'config'
  | 'ping';

interface WorkerMessage {
  /** Unique message ID */
  id: string;
  
  /** Message type */
  type: WorkerMessageType;
  
  /** Message payload */
  payload: unknown;
  
  /** Timestamp */
  timestamp: number;
}

interface WorkerResponse {
  /** Matching message ID */
  id: string;
  
  /** Success status */
  success: boolean;
  
  /** Response data */
  data?: unknown;
  
  /** Error if failed */
  error?: string;
  
  /** Processing duration in ms */
  duration: number;
}
```

### Worker Messages

```typescript
// Get image from cache
interface GetMessage extends WorkerMessage {
  type: 'get';
  payload: {
    url: string;
    options?: {
      transfer?: boolean; // Return transferable ArrayBuffer
    };
  };
}

// Set image in cache
interface SetMessage extends WorkerMessage {
  type: 'set';
  payload: {
    url: string;
    data: ArrayBuffer;
    metadata: CacheEntry['metadata'];
  };
}

// Prefetch multiple images
interface PrefetchMessage extends WorkerMessage {
  type: 'prefetch';
  payload: {
    urls: string[];
    priority?: number; // 1-10, higher = more urgent
  };
}

// Get cache statistics
interface StatsMessage extends WorkerMessage {
  type: 'stats';
  payload: null;
}
```

---

## State Machines

### VynxImage Component State

```
                    ┌─────────────┐
                    │   pending   │ (initial, waiting for mount)
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ loading  │  │ offline  │  │   error  │
        │ (fetch) │  │ (cached)  │  │ (failed) │
        └────┬─────┘  └────┬─────┘  └──────────┘
             │             │
             │    ┌────────┴────────┐
             │    │                 │
             ▼    ▼                 │
       ┌──────────┐               │
       │  loaded  │───────────────┘
       │ (cached) │
       └──────────┘
```

### Cache State Transitions

```
    ┌─────────────────────────────────────────────────────┐
    │                                                     │
    ▼                                                     │
 ┌──────┐    get()     ┌────────┐    miss      ┌────────┐ │
 │ empty│ ──────────▶ │ exists │ ──────────▶  │fetching│ │
 └──────┘              └────────┘              └────┬───┘ │
                                                   │     │
                        ┌──────────────────────────┼─────┘
                        │                          │
                        ▼                          ▼
                   ┌────────┐              ┌───────────┐
                   │stored  │              │  error    │
                   └────────┘              └───────────┘
```

---

## Validation Rules

### CacheEntry Validation

1. `url` MUST be a valid absolute URL
2. `data` MUST be non-empty ArrayBuffer
3. `metadata.size` MUST match `data.byteLength`
4. `metadata.mimeType` MUST be valid image MIME type
5. `metadata.cachedAt` MUST be a valid timestamp
6. If `expiresAt` is set, it MUST be in the future

### CacheConfig Validation

1. `maxSize` MUST be positive (min: 1MB)
2. `defaultTTL` MUST be positive (min: 0 = no expiration)
3. `memoryTierSize` MUST be less than `maxSize`
4. `platformOverride` MUST be valid `PlatformType`

### VynxImageProps Validation

1. `src` MUST be provided
2. `alt` SHOULD be provided for accessibility
3. `width`/`height` or `aspectRatio` SHOULD be provided for CLS prevention
