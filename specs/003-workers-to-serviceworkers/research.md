# Research: Web Workers to Service Workers Migration

**Feature**: 003-workers-to-serviceworkers  
**Date**: 2026-03-22

## Decision 1: Remove All Web Worker Code

**Decision**: Remove all Web Worker infrastructure including:
- `packages/cloud/src/worker/` directory (worker.ts, index.ts)
- Embedded Worker creation in `engine.ts`
- WorkerMessage/WorkerResponse types that are Web Worker-specific

**Rationale**: Service Workers provide all required functionality with persistence benefits.

**Alternatives considered**:
- Keep both Web Workers and Service Workers for different use cases → Rejected: increases complexity without benefit

## Decision 2: Service Worker as Single Processing Thread

**Decision**: Service Worker will handle ALL image operations:
- Image fetching from network
- Image decoding (using createImageBitmap)
- Cache management (get, set, delete, clear)
- Network status monitoring
- Bandwidth/RTT measurement
- LRU eviction logic
- Connection verification

**Rationale**: Centralizing all processing in Service Worker ensures:
1. No main thread blocking
2. Persistent state across page loads
3. Network interception for caching
4. True offline capability

**Alternatives considered**:
- Hybrid: Service Worker for caching, Web Workers for processing → Rejected: unnecessary complexity
- Main thread for simple operations → Rejected: defeats the purpose of offloading

## Decision 3: Message Protocol Design

**Decision**: Use structured message passing between main thread and Service Worker

**Message types**:
- `fetch`: Request image (returns blob URL)
- `cache-get`: Get cached entry
- `cache-set`: Store image in cache
- `cache-delete`: Remove from cache
- `cache-clear`: Clear entire cache
- `stats`: Get cache statistics
- `ping`: Health check

**Rationale**: Simple request/response pattern matches existing code structure.

## Decision 4: File Structure

**Decision**: Create `packages/cloud/src/service-worker/` directory

**Structure**:
```
src/service-worker/
├── index.ts          # Entry point, registration
├── sw.ts             # Service Worker script (install, fetch, activate)
├── cache-manager.ts  # LRU cache with eviction
├── network.ts        # RTT measurement, bandwidth classification
├── decoder.ts        # Image decoding utilities
└── messages.ts       # Message protocol types
```

**Rationale**: Separates Service Worker concerns from main library code.

## Decision 5: Files to Delete

**Delete**:
- `packages/cloud/src/worker/` (entire directory)
- `packages/cloud/src/core/types.ts` (WorkerMessage, WorkerResponse types)
- `packages/cloud/tests/unit/worker-message.test.ts`
- `packages/cloud/tests/unit/worker-throughput.test.ts`
- Embedded Worker code in `engine.ts`

## Decision 6: Browser Compatibility

**Decision**: Graceful degradation when Service Workers unavailable

**Strategy**:
1. Check `'serviceWorker' in navigator`
2. If supported: use Service Worker
3. If not supported: fallback to direct fetch with memory cache only

**Rationale**: Maintains functionality on older browsers while delivering enhanced experience on modern browsers.
