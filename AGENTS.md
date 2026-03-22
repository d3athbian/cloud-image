# carbon-image Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-19

## Active Technologies

- TypeScript 5.x (strict mode) + React 18+, idb (IndexedDB wrapper), react-native-fflate (worker compression) (002-vynx-image-cache-engine)

## Project Structure

```text
packages/
├── vynx/                    # Main library
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
│   │   ├── react/          # VynxImage, VynxProvider, useVynx
│   │   └── index.ts
│   └── tests/
└── vynx-devtools/         # Developer tools

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

- 002-vynx-image-cache-engine: Added TypeScript 5.x (strict mode) + React 18+, idb (IndexedDB wrapper), react-native-fflate (worker compression)
- 002-vynx-image-cache-engine: Added Network Resilience (Retry + Circuit Breaker)
- 002-vynx-image-cache-engine: Added Memory Pressure Awareness
- 002-vynx-image-cache-engine: Added Latency-Aware CDN delivery
- 002-vynx-image-cache-engine: Added ImageBitmap Decode Async

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
