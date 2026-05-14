# Contracts: CloudImage Component API

**Feature**: 031-perf-refactor
**Date**: 2026-05-13

---

## Contract: CloudImage Props

```typescript
interface CloudImageProps {
  // Core
  src: string;                    // Image URL
  alt: string;                    // Alt text for accessibility

  // Cache control
  engine?: ImageCacheEngine;      // Custom cache engine instance
  noCache?: boolean;              // Bypass cache, use network directly
  priority?: 'high' | 'low';      // Loading priority

  // Fallback UI
  fallback?: React.ReactNode;     // Custom fallback component
  loadingComponent?: React.ReactNode; // Custom loading spinner

  // Callbacks
  onLoad?: () => void;            // Called when image loads successfully
  onError?: (error: Error) => void; // Called on any error
  onCacheError?: (error: Error, context: CacheErrorContext) => void;
  // NEW: Called when cache/blob operations fail (non-blocking)

  // Animation
  crossfade?: boolean;           // Enable crossfade transition
  crossfadeDuration?: number;     // Crossfade duration in ms (default: 300)
}
```

### CacheErrorContext

```typescript
type CacheErrorContext = 'blob' | 'indexeddb' | 'network' | 'memory';

interface CacheErrorDetails {
  context: CacheErrorContext;
  message: string;
  retryable: boolean;
}
```

---

## Contract: Hook Return Types

### useNetworkMonitor()

```typescript
interface NetworkMonitorResult {
  isOnline: boolean;
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | null;
  rtt: number | null;
}
```

### useImageCacheLoader()

```typescript
interface ImageCacheLoaderProps {
  src: string;
  engine: ImageCacheEngine | null;
  noCache: boolean;
  abortSignal: AbortSignal | null;
}

interface ImageCacheLoaderResult {
  status: 'idle' | 'loading' | 'loaded' | 'error';
  url: string | null;
  error: Error | null;
  isFromCache: boolean;
}
```

### useCrossfadeAnimation()

```typescript
interface CrossfadeAnimationResult {
  opacity: number;
  isTransitioning: boolean;
  onImageLoaded: () => void;
}
```

### useBlobUrl()

```typescript
interface BlobUrlResult {
  objectUrl: string | null;
  createUrl: (blob: Blob) => string;
  revokeUrl: () => void;
}
```

---

## Contract: Global IntersectionObserver

```typescript
interface GlobalObserverManager {
  observe(
    element: Element,
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ): void;

  unobserve(element: Element): void;

  disconnect(): void; // Cleanup all observations

  // Hook-compatible version
  observeRef(
    ref: React.RefObject<Element>,
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ): void;
}
```

### Usage Example

```typescript
// In component
const ref = useCallback((node) => {
  if (node) {
    globalObserver.observe(node, handleIntersection);
  }
}, []);

return <img ref={ref} src={src} />;

// On unmount, element is automatically unobserve due to WeakMap cleanup
```

---

## Contract: Logger

```typescript
interface Logger {
  error(context: string, message: string, ...args: unknown[]): void;
  warn(context: string, message: string, ...args: unknown[]): void;
  info(context: string, message: string, ...args: unknown[]): void;
  debug(context: string, message: string, ...args: unknown[]): void;
}

// Error Classification
type ErrorType = 'AbortError' | 'QuotaExceededError' | 'NetworkError' | 'Unknown';

interface ClassifiedError {
  type: ErrorType;
  original: unknown;
  context: string;
  timestamp: number;
}
```

---

## Contract: BlobUrlRegistry

```typescript
interface BlobUrlManager {
  // Create and track a new ObjectURL
  create(blob: Blob, componentId: string): string;

  // Safely revoke a specific URL
  revoke(url: string): boolean;

  // Revoke all URLs for a component
  revokeComponent(componentId: string): void;

  // Revoke all tracked URLs
  revokeAll(): void;

  // Check if URL is tracked
  has(url: string): boolean;
}
```

---

## Backward Compatibility Notes

All existing props继续保持不变：
- `src`, `alt` - required
- `engine`, `noCache`, `priority` - existing cache options
- `onLoad`, `onError` - existing callbacks
- `crossfade`, `crossfadeDuration` - existing animation options

新增选项均有默认值，existing code不会中断：
- `onCacheError` - optional, 无默认值时不执行任何操作
- `fallback`, `loadingComponent` - optional, 使用内部默认

---

## Error Scenarios and Handling

| Error Type | Silent? | Fallback | Callback |
|------------|---------|----------|----------|
| AbortError | Yes | Continue with src | No |
| QuotaExceededError | No | Use network URL | onCacheError |
| NetworkError | No | Use network URL | onCacheError |
| BlobCreationError | No | Use network URL | onCacheError |
| Unknown | Dev only | Use network URL | onCacheError |