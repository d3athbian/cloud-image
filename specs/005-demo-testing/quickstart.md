# Quickstart: Demo Testing Infrastructure

## Overview

This guide explains how to use the demo application to test the @cloudimage/cloud library functionality.

## Prerequisites

- Node.js 18+
- Chrome browser (for DevTools integration)
- Git

## Setup

1. **Clone and setup**:
   ```bash
   cd carbon-image
   npm install
   ```

2. **Build the library**:
   ```bash
   cd packages/cloud
   npm run build
   ```

3. **Start the demo**:
   ```bash
   cd demos/cloud-demo
   npm run dev
   ```

4. **Open in Chrome**: Navigate to http://localhost:5173

## Manual Testing Scenarios

### 1. Verify Cache Persistence

1. Load the demo - 10 images should appear
2. Open DevTools → Application → IndexedDB
3. Verify "cloud-image-cache" database exists with entries
4. **Refresh the page**
5. Images should load instantly (no network requests)
6. Verify in Network tab: Status 200 (from Service Worker) or (from memory cache)

### 2. Verify Cache Stats Update

1. Check the sidebar: "Items cached" should show 10
2. Click "Prefetch 10" button
3. Verify: "Items cached" increases
4. Note the "Total size" value

### 3. Verify Network Status Detection

1. Open DevTools → Network tab
2. Select "Fast 3G" in throttling dropdown
3. Refresh the page
4. Watch console for retry logs
5. Network status should show "low" bandwidth

### 4. Verify Offline Mode

1. Open DevTools → Network tab
2. Check "Offline" checkbox
3. Refresh the page
4. **Expected**: Cached images still display
5. **Expected**: Uncached images show placeholder or error

### 5. Verify Service Worker

1. Open DevTools → Application → Service Workers
2. Verify "cloud-image" SW is registered
3. Check "Update on reload" and test updates

### 6. Verify Fallback Chain

1. In DevTools → Application → Service Workers:
   - Unregister the SW
2. Refresh the page
3. Images should still load (via web adapter IndexedDB)
4. Clear IndexedDB in DevTools
5. Refresh - images load from network (direct fetch)

### 7. Verify Cache Eviction

1. Clear cache using button
2. Prefetch 50+ images (add more URLs to test)
3. Watch evictionCount increase in stats when limit reached

### 8. Verify DevTools Console Logs

1. Open DevTools → Console
2. Clear console
3. Interact with cache (prefetch, clear)
4. Verify structured logs with request IDs appear
5. Verify each log includes correlation ID for tracking

### 9. Verify CDN Variant Selection

1. Open DevTools → Network tab
2. Select "Slow 3G" throttling
3. Refresh page - observe requests use smaller variants
4. Change to "No throttling" - observe full resolution requests

### 10. Verify Image Loading States

1. Open demo with empty cache
2. Observe blur placeholder while loading
3. Observe crossfade when image loads
4. Simulate network failure to see error placeholder

## Running Automated Tests

```bash
# From packages/cloud
npm run test          # Unit tests
npm run test:e2e     # E2E tests
```

## Troubleshooting

- **Images not caching**: Check console for errors
- **SW not registering**: Check Application → Service Workers
- **IndexedDB empty**: Check console for IDB errors
- **Network requests on refresh**: SW may not be active

## Reference

- Library: `/packages/cloud`
- Demo source: `/demos/cloud-demo/src/App.tsx`
- SW: `/packages/cloud/src/service-worker/sw.ts`