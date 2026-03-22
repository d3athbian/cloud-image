# Research: CLOUD Engine - Technical Decisions

**Date**: 2026-03-19  
**Feature**: 002-cloud-image-cache-engine

---

## Decision 1: TypeScript as Primary Language

**Decision**: Use TypeScript 5.x with strict mode.

**Rationale**: 
- Type safety critical for library consumed by React developers
- Enables better IDE support and error detection
- Strict mode catches common bugs early

**Alternatives Considered**:
- JavaScript: Lower barrier but higher runtime error risk
- Flow: Less community support, slower evolution

---

## Decision 2: Web Worker Embedding via Blob URL

**Decision**: Compile Worker code and embed as base64 Blob URL in bundle.

**Rationale**:
- Eliminates need for static file hosting
- Works in all bundlers without special configuration
- Worker code is always available regardless of deployment context

**Alternatives Considered**:
- Static file with special bundler config: Adds complexity
- Inline Worker (with eval): Security concerns, not CSP-friendly
- Separate worker bundle: Requires hosting configuration

**Technical Notes**:
```typescript
// Worker creation pattern
const workerBlob = new Blob([WORKER_CODE], { type: 'application/javascript' });
const workerUrl = URL.createObjectURL(workerBlob);
const worker = new Worker(workerUrl);

// Cleanup on unmount
return () => URL.revokeObjectURL(workerUrl);
```

---

## Decision 3: Zero-Copy via Transferable ArrayBuffers

**Decision**: Use Transferable objects for Worker-to-Main-Thread communication.

**Rationale**:
- ArrayBuffers transfer ownership without copying
- Critical for large images (50MB+)
- No serialization overhead

**Alternatives Considered**:
- Blob URLs: Requires createObjectURL/revokeObjectURL lifecycle management
- Structured Clone: Slower for large data, keeps copy in memory

**Technical Notes**:
```typescript
// Worker sends image data
port.postMessage({ type: 'image', buffer: arrayBuffer }, [arrayBuffer]);

// Main thread receives
worker.onmessage = (e) => {
  if (e.data.type === 'image') {
    // arrayBuffer is transferred, not copied
    const blob = new Blob([e.data.buffer]);
    const url = URL.createObjectURL(blob);
  }
};
```

---

## Decision 4: Platform Adapter Auto-Detection

**Decision**: Runtime detection with explicit override capability.

**Detection Logic**:
```
1. Check navigator.userAgent for Tizen/WebOS patterns
2. Check for FileSystem API availability (window.requestFileSystem)
3. Check for IndexedDB availability
4. Fall back to MemoryAdapter
```

**Rationale**:
- Automatic detection provides best experience out-of-box
- Override capability needed for testing and hybrid environments

**Platform Detection Code**:
```typescript
export function detectPlatform(): PlatformType {
  const ua = navigator.userAgent;
  
  if (/Tizen/i.test(ua)) return 'tizen';
  if (/WebOS|LG Browser/i.test(ua)) return 'webos';
  if ('indexedDB' in window) return 'web';
  return 'memory';
}
```

---

## Decision 5: Tree-Shakeable Adapter Exports

**Decision**: Use individual export files with Barrel re-export.

**Implementation**:
```typescript
// src/adapters/index.ts
export { WebAdapter } from './web';
export { TizenAdapter } from './tizen';
export { WebOSAdapter } from './webos';
export { MemoryAdapter } from './memory';
export { detectPlatform, createAdapter } from './factory';
```

**Rationale**:
- Bundlers like Rollup/Vite can eliminate unused adapter code
- Each adapter is a separate module
- Factory function only imports used adapters

---

## Decision 6: LRU + TTL Eviction Policy

**Decision**: Dual eviction strategy combining Least Recently Used and Time To Live.

**Algorithm**:
1. On access: Update timestamp
2. On insert: Check if size > maxSize, evict LRU until within limit
3. On read: Check if expired (age > TTL), treat as cache miss

**Rationale**:
- LRU handles size constraints optimally
- TTL handles stale content (server-side updates)
- Combined approach covers both scenarios

---

## Decision 7: Request Deduplication via Pending Map

**Decision**: Track in-flight requests by URL to prevent duplicate fetches.

**Implementation**:
```typescript
// In Worker
const pendingRequests = new Map<string, Promise<Response>>();

function fetchWithDeduplication(url: string): Promise<ArrayBuffer> {
  if (pendingRequests.has(url)) {
    return pendingRequests.get(url);
  }
  
  const promise = doFetch(url).finally(() => {
    pendingRequests.delete(url);
  });
  
  pendingRequests.set(url, promise);
  return promise;
}
```

**Rationale**:
- Prevents thundering herd when 10 components request same image
- Single network request, multiple consumers
- Critical for gallery views with many images

---

## Decision 8: React Component State Strategy

**Decision**: Use `useSyncExternalStore` for cache state with subscription.

**Rationale**:
- Official React hook for external state
- Handles SSR correctly
- Prevents unnecessary re-renders with selective subscriptions

**Implementation Pattern**:
```typescript
// Expose cache state to React
const subscribe = (callback) => cache.subscribe(callback);
const getSnapshot = () => cache.getState();

function useCacheStatus(url: string) {
  return useSyncExternalStore(subscribe, getSnapshot);
}
```

---

## Decision 9: CLS Prevention via Aspect Ratio Box

**Decision**: Reserve space before image loads using aspect-ratio CSS.

**Implementation**:
```tsx
<div style={{ aspectRatio: width / height }} class="cloud-placeholder">
  <img loading="lazy" ... />
</div>
```

**Rationale**:
- Native aspect-ratio CSS prevents layout shift
- Fallback to padding-bottom technique for older browsers
- Dimensions from cache metadata or explicit props

---

## Decision 10: Progressive Rendering (Low-Res → HD)

**Decision**: Support blur-up or low-quality placeholder pattern.

**Implementation**:
1. Check cache for low-res variant (url + '?w=50')
2. Display blur placeholder immediately
3. Load HD variant in background
4. Crossfade on HD load complete

**Rationale**:
- Perceived performance improvement
- Standard pattern (Netflix, Medium use it)
- Optional feature, not required for MVP

---

## Open Technical Questions (Resolved via Research)

### Q1: Worker Crash Recovery
**Resolved**: Worker failures trigger automatic degradation to synchronous fallback mode with console warning.

### Q2: Large Image Handling (>50MB)
**Resolved**: Images over configurable threshold are streamed in chunks or rejected with clear error.

### Q3: Animated Images (GIF, WebP)
**Resolved**: Treated as regular images. Progressive loading applies if animated. No special animation handling.

---

## Bibliography

- [Web Worker Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)
- [IndexedDB Performance Tips](https://developers.google.com/web/fundamentals/instant-and-offline/web-storage/indexeddb-best-practices)
- [Transferable Objects](https://developer.mozilla.org/en-US/docs/Web/API/Transferable)
- [useSyncExternalStore API](https://react.dev/reference/react/useSyncExternalStore)
- [Tizen FileSystem API](https://developer.tizen.org/development/guides/web-application/filesystem-and-storage)
- [WebOS FileSystem](https://webostv.developer.lge.com/develop/guides/file-system)
