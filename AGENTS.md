# carbon-image Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-24

## Active Technologies
- TypeScript 5.x (strict mode) + Vitest (testing), Vite (build) (003-workers-to-serviceworkers)
- Browser Cache API (IndexedDB-backed) (003-workers-to-serviceworkers)
- TypeScript 5.x (strict mode) | constitution + Jotai (~2KB), React 19 (020-jotai-atoms)
- IndexedDB (existing via idb) (020-jotai-atoms)
- TypeScript 5.x (strict mode) + None (wrapper pattern, no new deps) (022-event-error-interceptor)
- TypeScript 5.x (strict mode) + jotai (existing), idb (existing) - no new deps (023-global-state-sync)
- TypeScript 5.x (strict mode) + React 19, Jotai (existing) + Zod (validation) (024-demo-ui-tool, 025-global-config-management)
- IndexedDB (via idb - existing) (024-demo-ui-tool)
- TypeScript 5.x (strict mode) + jotai (state), idb (IndexedDB), React 19 (025-global-config-management)

- TypeScript 5.x (strict mode) + React 18+, idb (IndexedDB wrapper), react-native-fflate (worker compression) (002-cloud-image-cache-engine)

## Project Structure

```text
packages/
├── cloud/                    # Main library
│   ├── src/
│   │   ├── core/           # Framework-agnostic engine
│   │   │   ├── cache.ts    # LRU/TTL eviction (90% trigger, dual scoring)
│   │   │   ├── retry.ts    # Exponential backoff
│   │   │   ├── circuit-breaker.ts
│   │   │   ├── memory.ts   # Memory pressure detection
│   │   │   ├── network.ts  # RTT measurement
│   │   │   └── cdn-adapter.ts
│   │   ├── adapters/       # Platform storage (tree-shakeable)
│   │   ├── worker/         # Web Worker + ImageBitmap decoding
│   │   ├── react/          # CloudImage, CloudProvider, useCloud
│   │   ├── debugger/       # DevTools Panel
│   │   └── index.ts
│   └── tests/
└── cloud-devtools/         # Developer tools

tests/
├── e2e/                    # End-to-end tests
└── platform/               # Platform-specific tests
```

## Commands

npm test && npm run lint && npm run test:performance

## Code Style

TypeScript 5.x (strict mode): Follow standard conventions

## Key Architecture Decisions

### Cache Eviction
- Trigger: 90% of maxSize
- Strategy: LRU dual (accessCount × 0.6 + recencyFactor × 0.4)
- Batch: 20% of maxSize
- TTL Override: expired always evicted first

### Network Resilience
- Retry: Exponential backoff (100ms, 200ms, 400ms)
- Circuit Breaker: 3 failures → OPEN → 30s wait → HALF_OPEN → test

### Latency-Aware CDN
- RTT measurement per request
- If RTT > 500ms: request small variant
- Background upgrade to full resolution

### Decode Async
- ImageBitmap decoding in Worker
- Transferable objects for zero-copy

## Recent Changes
- 025-global-config-management: Added Zod schemas for configuration validation, global config management
- 024-demo-ui-tool: Added DevTools Panel (debugger) with Cache/Network/Performance/State tabs
- 023-global-state-sync: Added TypeScript 5.x (strict mode) + jotai (existing), idb (existing) - no new deps
- 022-event-error-interceptor: Added TypeScript 5.x (strict mode) + None (wrapper pattern, no new deps)


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
