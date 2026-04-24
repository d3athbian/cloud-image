# Data Model: Global Configuration Management

## Core Entity: CoreServiceOptions

The centralized configuration interface that serves as the single source of truth for all system settings.

### Interface Definition

```typescript
interface CoreServiceOptions {
  // Cache settings
  cacheMaxSize: number;           // Max cache size in bytes (default: 100MB)
  cacheDefaultTTL: number;        // Default TTL in ms (default: 7 days)
  cacheMemoryTierSize: number;    // Memory tier size in bytes (default: 20MB)
  
  // Network settings
  requestTimeout: number;         // Request timeout in ms (default: 10s)
  maxRetries: number;             // Max retry attempts (default: 3)
  
  // Feature flags
  enableLogging: boolean;         // Enable/disable logging (default: dev=true, prod=false)
  enableDevtools: boolean;        // Enable DevTools integration (default: false)
  enablePrefetch: boolean;        // Enable prefetching (default: true)
  
  // Advanced settings
  bandwidthTestUrl: string;       // URL for bandwidth testing
  offlineStrategy: "default" | "aggressive";
}
```

### Relationships

| Entity | Relationship |
|--------|--------------|
| CoreServiceOptions | Used by ImageEngine for initialization |
| CoreServiceOptions | Used by NetworkMonitor for config |
| CoreServiceOptions | Used by CloudProvider for defaults |
| CacheConfig | Extends/derives from CoreServiceOptions |
| NetworkMonitorConfig | Extends/derives from CoreServiceOptions |

### Default Values

All defaults are defined in constants and must match between:
- `src/config/constants.ts`
- `src/types/core-options.ts`

## Validation Rules

| Property | Rule |
|----------|------|
| cacheMaxSize | Must be positive number, min 1MB |
| cacheDefaultTTL | Must be positive number, min 1 minute |
| requestTimeout | Must be positive, max 60 seconds |
| maxRetries | Must be 0-10 inclusive |
| enableLogging | Boolean |

## State Transitions

Configuration is immutable after initialization. To update:
1. Call `setSystemSettings(partialOptions)` - merges with existing
2. All components receive update notification
3. Components re-initialize with new values

## Extensibility

New configuration options should be added to:
1. `CoreServiceOptions` interface
2. Default values in constants
3. Environment variable mapping in getter function