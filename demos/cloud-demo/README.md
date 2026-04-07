# CLOUD Image Cache Demo

Demo application for testing @cloudimage/cloud library functionality.

## Features

- **Cache Persistence**: Images persist in IndexedDB across page refreshes (single DB: cloud-image-cache)
- **Service Worker**: SW-based caching with fallback to web adapter
- **Network Resilience**: Retry logic and circuit breaker for failed requests
- **LRU Eviction**: Automatic cache eviction at 90% capacity
- **DevTools Integration**: Cache inspection via Chrome DevTools
- **Real-time Stats**: Live cache hit/miss rate, eviction count

## Quick Start

```bash
# Build the library
cd packages/cloud && npm run build

# Start demo
cd demos/cloud-demo && npm run dev

# Open http://localhost:5173
```

## Testing Scenarios

### US1: Cache Persistence
1. Load demo - 20 images appear
2. Open DevTools → Application → IndexedDB → cloud-image-cache
3. Refresh page - images load instantly (from cache)

### US2: Service Worker Fallback
1. DevTools → Application → Service Workers
2. Unregister "cloud-image" SW
3. Refresh - images still load (via web adapter)

### US3: Network Resilience
1. DevTools → Network → Select "Slow 3G"
2. Refresh - retry logic activates (check console)
3. Check "Offline" - cached images still display

### US4: Cache Eviction
1. Click "Clear Cache"
2. Click "Prefetch 10" repeatedly
3. Watch evictionCount increase in stats

### US6: DevTools Integration
1. Open DevTools Console
2. Interact with cache (prefetch/clear)
3. Verify structured logs with request IDs

## Tech Stack

- React 18+
- TypeScript 5.x (strict mode)
- Vite
- @cloudimage/cloud library

## Issues Fixed

- Fixed duplicate IndexedDB databases (was using carbon-image-cache and cloud-image-cache)
- Fixed React warning: fetchPriority prop on DOM element
- Fixed inline SW registration using console instead of undefined log