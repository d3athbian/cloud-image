# Data Model: Performance Improvements

**Feature**: 031-perf-refactor
**Date**: 2026-05-13

---

## Core Entities

### 1. BlobUrlRegistry

**Purpose**: Track ObjectURLs for automatic cleanup

```typescript
interface BlobUrlRegistry {
  // Internal storage
  urls: Map<string, string>; // componentId -> ObjectURL

  // Methods
  create(object: Blob, componentId: string): string;
  revoke(url: string): void;
  revokeAll(): void;
  getUrl(componentId: string): string | undefined;
}
```

**Validation Rules**:
- Only create URLs for Blob objects
- Only revoke URLs starting with `blob:`
- Component IDs must be non-empty strings

**State Transitions**:
- Created: URL generated and registered
- Revoked: URL released, entry removed from Map
- Bulk revoke: All URLs released on page unload

---

### 2. ImageState

**Purpose**: Represent current state of image loading

```typescript
interface ImageState {
  status: 'idle' | 'loading' | 'loaded' | 'error';
  url: string | null;
  error: Error | null;
  objectUrl: string | null;
  isFromCache: boolean;
}
```

**State Transitions**:

```
idle -> loading: src prop changes, fetch initiated
loading -> loaded: blob received, ObjectURL created
loading -> error: fetch failed or cache operation failed
loaded -> loading: src prop changes, cleanup previous
error -> loading: retry triggered
any -> idle: reset requested
```

---

### 3. NetworkState

**Purpose**: Track network conditions for adaptive behavior

```typescript
interface NetworkState {
  isOnline: boolean;
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | null;
  rtt: number | null;
  downlink: number | null;
}
```

**Validation Rules**:
- isOnline: derived from navigator.onLine + actual fetch success
- effectiveType: from Network Information API (when available)
- rtt: milliseconds, null if unknown

**State Transitions**:
- Online change triggers cache priority adjustments
- Slow connection (2g/slow-2g) enables aggressive prefetch

---

### 4. ObserverEntry (WeakMap Value)

**Purpose**: Store callback and options for global observer

```typescript
interface ObserverEntry {
  callback: IntersectionObserverCallback;
  options: IntersectionObserverInit;
}
```

**Relationships**:
- Stored in WeakMap<Element, ObserverEntry>
- Element is the DOM node being observed
- When Element is garbage collected, entry is automatically removed

---

### 5. CrossfadeState

**Purpose**: Manage crossfade animation timing

```typescript
interface CrossfadeState {
  isTransitioning: boolean;
  opacity: number;
  timeoutId: number | null;
}
```

**State Transitions**:

```
idle -> transitioning: image loaded, fade-in started
transitioning -> idle: animation complete, timeout cleared
any -> idle: cleanup on unmount
```

---

## Entity Relationships

```
CloudImage Component
    ├── useNetworkMonitor() → NetworkState
    ├── useImageCacheLoader() → ImageState (contains BlobUrlRegistry reference)
    ├── useCrossfadeAnimation() → CrossfadeState
    └── useBlobUrl() → BlobUrlRegistry singleton (shared across instances)

GlobalIntersectionObserver
    └── WeakMap<Element, ObserverEntry>
```

---

## Validation Rules

| Entity | Field | Rule |
|--------|-------|------|
| BlobUrlRegistry | componentId | Non-empty string, max 256 chars |
| BlobUrlRegistry | url | Must start with `blob:` before revoke |
| ImageState | status | One of: idle, loading, loaded, error |
| NetworkState | effectiveType | One of: 4g, 3g, 2g, slow-2g, or null |
| CrossfadeState | opacity | Range: 0.0 to 1.0 |

---

## Key Metrics (from Success Criteria)

| Metric | Target | Entity |
|--------|--------|--------|
| Memory usage (100+ images) | < 150MB | Global |
| Cache operation latency | < 100ms avg | ImageCache |
| Eviction time | < 50ms | EvictionManager |
| Bundle size (core) | < 50KB gzipped | Build output |
| Time to first cached image | < 10ms | ImageCache.get() |
| Memory pressure trigger | < 80% device memory | MemoryMonitor |