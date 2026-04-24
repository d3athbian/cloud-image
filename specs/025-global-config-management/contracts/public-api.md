# Contracts: Global Configuration Management

## Public API Contract

This document defines the public API surface for the global configuration feature.

### Exported Functions

| Export | Type | Description |
|--------|------|-------------|
| `getSystemSettings` | `function` | Returns current configuration (read-only) |
| `setSystemSettings` | `function` | Updates configuration (partial merge) |
| `resetSystemSettings` | `function` | Resets to default configuration |
| `CoreServiceOptions` | `interface` | TypeScript interface for configuration |

### CoreServiceOptions Interface

```typescript
interface CoreServiceOptions {
  // Cache configuration
  cacheMaxSize: number;
  cacheDefaultTTL: number;
  cacheMemoryTierSize: number;
  
  // Network configuration
  requestTimeout: number;
  maxRetries: number;
  
  // Feature flags
  enableLogging: boolean;
  enableDevtools: boolean;
  enablePrefetch: boolean;
  
  // Advanced
  bandwidthTestUrl: string;
  offlineStrategy: "default" | "aggressive";
}
```

### Behavior Contracts

#### getSystemSettings()

- **Precondition**: None (always works)
- **Postcondition**: Returns Readonly<CoreServiceOptions>
- **Side Effects**: None
- **Error Cases**: None (always returns valid config)

#### setSystemSettings(partial)

- **Precondition**: None
- **Postcondition**: Configuration merged, all components notified
- **Side Effects**: Updates global state, may trigger re-initialization
- **Error Cases**: Invalid values are rejected with error

#### resetSystemSettings()

- **Precondition**: None
- **Postcondition**: All values reset to defaults
- **Side Effects**: Clears any user-set configuration

### Backward Compatibility

- Existing `CloudProvider` props still work
- Constants in `config/constants.ts` remain exported
- `CacheConfig` interface still supported (derived from CoreServiceOptions)