# Contract: CloudProvider Component

**Contract ID**: cloud-provider-contract  
**Version**: 1.0.0  
**Feature**: 002-cloud-image-cache-engine

---

## Overview

`CloudProvider` initializes the CLOUD engine, creates the Web Worker, and provides configuration via React Context.

---

## Props API

```typescript
interface CloudProviderProps {
  /** Cache configuration */
  config?: Partial<CacheConfig>;
  
  /** Child components */
  children: React.ReactNode;
  
  /** Custom loading component */
  loadingComponent?: React.ComponentType;
  
  /** Custom error component */
  errorComponent?: React.ComponentType<{ error: Error }>;
  
  /** Enable development tools */
  devtools?: boolean;
}
```

### Config Defaults

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxSize` | `number` | `100 * 1024 * 1024` | 100MB cache limit |
| `defaultTTL` | `number` | `7 * 24 * 60 * 60 * 1000` | 7 days |
| `memoryTierSize` | `number` | `20 * 1024 * 1024` | 20MB memory cache |
| `platformOverride` | `PlatformType` | `auto` | Platform detection |
| `debug` | `boolean` | `false` | Debug logging |
| `maxRetries` | `number` | `3` | Network retry count |

---

## Context API

### useCloudContext

```typescript
interface CloudContextValue {
  /** Engine instance */
  engine: ImageEngine;
  
  /** Cache API */
  cache: CacheAPI;
  
  /** Network status */
  network: NetworkStatus;
  
  /** Provider ready state */
  isReady: boolean;
  
  /** Error state */
  error: Error | null;
}
```

### Context Provider Structure

```typescript
// Internal context (not exported)
const CloudContext = React.createContext<CloudContextValue | null>(null);

// Public hook
function useCloud(): CloudContextValue {
  const context = useContext(CloudContext);
  if (!context) {
    throw new Error('useCloud must be used within CloudProvider');
  }
  return context;
}
```

---

## Initialization Contract

### Startup Sequence

1. **Detect Platform**: Run platform detection
2. **Create Adapter**: Instantiate appropriate storage adapter
3. **Initialize Worker**: Create Worker via Blob URL
4. **Establish Channel**: Setup MessageChannel for communication
5. **Load Index**: Scan existing cache entries
6. **Ready**: Set `isReady = true`

### Error Handling

| Phase | Failure | Behavior |
|-------|---------|----------|
| Platform detection | N/A | Default to memory |
| Adapter init | Platform unsupported | Fall back to memory, log warning |
| Worker create | Security/CSP | Continue without worker, degrade gracefully |
| Index load | Storage error | Start with empty cache, log error |

---

## Behavior Contracts

### 1. Single Provider Required

**Given**: Multiple CloudProviders nested  
**When**: Inner provider mounts  
**Then**: Inner provider takes precedence, outer is ignored

**Rationale**: Nested providers create confusion. Only closest provider matters.

### 2. Context Propagation

**Given**: CloudProvider with config  
**When**: CloudImage renders  
**Then**: CloudImage receives same config from context

**Test**:
```typescript
render(
  <CloudProvider config={{ maxSize: 50 * 1024 * 1024 }}>
    <CloudImage src="..." />
  </CloudProvider>
);

// CloudImage should use 50MB limit
```

### 3. Provider Unmount Cleanup

**Given**: CloudProvider with active cache  
**When**: Provider unmounts  
**Then**: Worker terminated, Blob URLs revoked, resources freed

**Test**:
```typescript
const workerPostMessage = jest.spyOn(worker, 'postMessage');

render(
  <CloudProvider>
    <CloudImage src="..." />
  </CloudProvider>
);

unmount();

expect(workerPostMessage).toHaveBeenCalledWith(
  expect.objectContaining({ type: 'destroy' })
);
```

---

## DevTools Integration

When `devtools: true`:

1. **Overlay**: Visual indicator showing cache stats
2. **Global**: Expose `window.__CLOUD__` for console access
3. **Events**: Log all cache operations to console

### DevTools API

```typescript
interface CloudDevTools {
  /** Get cache statistics */
  getStats(): CacheStats;
  
  /** Clear all cache */
  clear(): Promise<void>;
  
  /** Invalidate specific URL */
  invalidate(url: string): Promise<void>;
  
  /** Get all cached URLs */
  getKeys(): Promise<string[]>;
  
  /** Enable network throttling */
  throttleNetwork(speed: 'slow' | 'fast' | 'offline'): void;
}
```

---

## Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| Provider mount time | <100ms | Time to isReady=true |
| Memory overhead | <1MB | Without cached images |
| Worker startup | <50ms | Worker ready after mount |

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| No config provided | Uses all defaults |
| Invalid config values | Log warning, use default |
| Worker crash | Detect, recreate, resume |
| Storage full | Automatic eviction before error |
| Provider re-mount | Reuse existing engine |
