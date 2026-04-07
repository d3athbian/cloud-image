# CLOUD Image Cache Demo

Demo application for testing @cloudimage/cloud library functionality.

## Features

- **Cache Persistence**: Images persist in IndexedDB across page refreshes
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

### Cache Persistence (US1)
1. Load demo - 20 images appear
2. Open DevTools → Application → IndexedDB
3. Refresh page - images load from cache instantly

### Service Worker Fallback (US2)
1. DevTools → Application → Service Workers
2. Unregister "cloud-image" SW
3. Refresh - images still load (via web adapter)
4. Clear IndexedDB - images load from network

### Network Resilience (US3)
1. DevTools → Network → Select "Slow 3G"
2. Refresh - retry logic activates (check console)
3. Check "Offline" - cached images still display

### Cache Eviction (US4)
1. Clear cache using button
2. Prefetch all 20 images
3. Note evictionCount in stats panel

### CDN Variant Selection (US5)
1. Throttle to "Slow 3G" - requests use smaller variants
2. Remove throttling - full resolution requests

### DevTools Integration (US6)
1. Open DevTools Console
2. Interact with cache (prefetch/clear)
3. Verify structured logs with request IDs

## Tech Stack

- React 18+
- TypeScript 5.x (strict mode)
- Vite
- @cloudimage/cloud library
