# Research: Performance Improvements

**Feature**: 031-perf-refactor
**Date**: 2026-05-13

---

## Research 1: React Hooks Decomposition Pattern

### Decision
Split the mega-useEffect in CloudImage into three specialized hooks: useNetworkMonitor, useImageCacheLoader, and useCrossfadeAnimation.

### Rationale
The current 130+ line useEffect with 14 dependencies creates:
- Race conditions when src changes rapidly
- Hard-to-test monolithic logic
- Difficult-to-maintain state coupling

### Alternatives Considered

**Option A: Render Props** - Rejected because it creates wrapper hell
**Option B: Container/Presenter with Context** - Over-engineered for this use case
**Option C: Multiple hooks (chosen)** - Follows React best practices, each hook is testable

### Hook API Design

```typescript
// useNetworkMonitor - returns network state
function useNetworkMonitor(): {
  isOnline: boolean;
  effectiveType: string | null;
  rtt: number | null;
}

// useImageCacheLoader - handles cache business logic
function useImageCacheLoader({
  src,
  engine,
  noCache,
  abortSignal
}: ImageCacheLoaderProps): {
  status: 'idle' | 'loading' | 'loaded' | 'error';
  url: string | null;
  error: Error | null;
}

// useCrossfadeAnimation - handles opacity transitions
function useCrossfadeAnimation({
  enabled,
  duration
}: CrossfadeProps): {
  isVisible: boolean;
  opacity: number;
  onLoaded: () => void;
}
```

---

## Research 2: Global IntersectionObserver Implementation

### Decision
Create a singleton GlobalIntersectionObserver manager with WeakMap-based callback storage.

### Rationale
Creating a new IntersectionObserver per DOM node causes:
- Main thread thrashing on gallery scroll
- Memory overhead per observer instance
- Browser work multiplier for each intersection check

### Implementation Pattern

```typescript
class GlobalIntersectionObserver {
  private observer: IntersectionObserver | null = null;
  private callbacks = new WeakMap<Element, IntersectionObserverCallback>();
  private options = new WeakMap<Element, IntersectionObserverInit>();

  observe(
    element: Element,
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ): void {
    if (!this.observer) {
      this.observer = new IntersectionObserver(this.handleIntersection.bind(this));
    }
    this.callbacks.set(element, callback);
    if (options) this.options.set(element, options);
    this.observer.observe(element);
  }

  unobserve(element: Element): void {
    this.callbacks.delete(element);
    this.options.delete(element);
    this.observer?.unobserve(element);
  }

  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    for (const entry of entries) {
      const callback = this.callbacks.get(entry.target);
      if (callback) callback([entry], this.observer!);
    }
  }
}
```

### Cleanup via WeakMap
When DOM node is garbage collected, WeakMap entry is automatically removed. No manual cleanup needed for abandoned nodes.

---

## Research 3: ObjectURL Memory Leak Prevention

### Decision
Implement BlobUrlRegistry that tracks all created ObjectURLs and provides safe revocation with blob: prefix check.

### Rationale
URL.createObjectURL() creates references that:
- Prevent GC of blob data until explicitly revoked
- Accumulate in memory if component unmounts or src changes without cleanup
- Cause RAM exhaustion in SPAs during navigation

### Safety Pattern

```typescript
class BlobUrlRegistry {
  private urls = new Map<string, string>(); // componentId -> ObjectURL

  create(object: Blob, componentId: string): string {
    const url = URL.createObjectURL(object);
    // Revoke old URL if exists for this component
    const old = this.urls.get(componentId);
    if (old) this.revoke(old);
    this.urls.set(componentId, url);
    return url;
  }

  revoke(url: string): void {
    // Safety check - only revoke blob: URLs
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
    // Find and remove from registry
    for (const [id, existing] of this.urls) {
      if (existing === url) {
        this.urls.delete(id);
        break;
      }
    }
  }
}
```

### Key Insight
Before revoking, check `url.startsWith('blob:')` to avoid errors if URL was already revoked or is a different type.

---

## Research 4: Error Handling and Logging

### Decision
Implement environment-aware logger with error classification and contextual output.

### Rationale
Empty catch blocks like `catch { /* non-fatal */ }` hide:
- IndexedDB corruption errors
- Network failures that should trigger fallback
- QuotaExceededError that needs user notification

### Error Classification

```typescript
enum ErrorType {
  ABORT = 'AbortError',        // User navigated away - silent
  QUOTA = 'QuotaExceededError', // Cache full - notify UI
  NETWORK = 'NetworkError',    // Fetch failed - fallback to src
  UNKNOWN = 'Unknown'           // Log in dev, maybe report in prod
}

function classifyError(error: unknown): ErrorType {
  if (error instanceof DOMException) {
    switch (error.name) {
      case 'AbortError': return ErrorType.ABORT;
      case 'QuotaExceededError': return ErrorType.QUOTA;
    }
  }
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return ErrorType.NETWORK;
  }
  return ErrorType.UNKNOWN;
}
```

### Logger Implementation

```typescript
const logger = {
  error(context: string, message: string, ...args: unknown[]): void {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[${context}] ${message}`, ...args);
    }
    // In production: send to telemetry service
  },
  warn(context: string, message: string, ...args: unknown[]): void {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[${context}] ${message}`, ...args);
    }
  }
};
```

### UI Error Propagation
CloudImage receives optional `onCacheError` prop to notify consumers of non-fatal cache failures:

```typescript
interface CloudImageProps {
  // ... existing props
  onCacheError?: (error: Error, context: 'blob' | 'indexeddb' | 'network') => void;
}
```

---

## Summary of Decisions

| Area | Decision | Key Pattern |
|------|----------|-------------|
| Hook Decomposition | 3 specialized hooks | useNetworkMonitor, useImageCacheLoader, useCrossfadeAnimation |
| IntersectionObserver | Singleton with WeakMap | GlobalIntersectionObserver manager |
| ObjectURL Cleanup | Registry with safety check | blob: prefix verification before revoke |
| Error Handling | Classified logging | AbortError silent, QuotaExceededError propagated |