# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Bundle Size Optimization (016-bundle-tree-shaking)

- **Tree-shaking enabled**: All entry points now use named exports instead of `export *`
- **Lazy loading NOT implemented**: Due to TypeScript constructor limitation (see spec.md)
- **Result**: Named exports enable tree-shaking; Vite handles chunk splitting

**Breaking Changes**:
- Internal functions no longer exported (e.g., `createCache` → use `new ImageCache()`)
- Import paths unchanged, but consumers using default exports should migrate to named imports

**Technical Limitation**:
```
ImageEngine requires adapter immediately in constructor.
TypeScript constructors cannot be async.
Therefore, dynamic import() cannot be used.
```

#### BiomeJS Linting (017-add-biomejs)

- **Replaced ESLint + Prettier with BiomeJS**
- **New scripts**:
  - `npm run lint` → `biome check src --write`
  - `npm run format` → `biome format --write src`
- **Config**: biome.json with TypeScript 5.x strict settings
- **Zero lint errors**: All 47 files pass with 0 errors, 0 warnings

### Added

#### Phase 1-13: Initial Implementation

- **Core Types & Cache**
  - `CacheEntry`, `CacheConfig`, `CacheStats` types
  - LRU/TTL eviction with dual scoring (60% access count, 40% recency)
  - 90% trigger threshold, 20% batch eviction

- **CloudImage Component**
  - React component with blur-up placeholders
  - Crossfade transitions
  - Quality tier support (low, medium, high)
  - Priority loading

- **Platform Adapters**
  - Memory adapter for in-memory storage
  - Web adapter using IndexedDB
  - Tizen adapter for Samsung Smart TVs
  - webOS adapter for LG Smart TVs
  - Platform detection with override support

- **Worker Architecture**
  - Web Worker for image decoding
  - ImageBitmap async decoding
  - Message batching for throughput optimization
  - Transferable objects for zero-copy

- **Offline Support**
  - Service Worker integration
  - Cache-first with network fallback strategy
  - Stale-while-revalidate strategy
  - Background sync for prefetched images

- **Network Resilience**
  - Exponential backoff retry (100ms, 200ms, 400ms)
  - Circuit breaker pattern (3 failures → OPEN → 30s wait)
  - RTT measurement per request

- **Memory Pressure**
  - MemoryMonitor with heap snapshot sampling
  - Pressure levels: normal, warning, critical
  - Adaptive cache sizing based on available memory
  - Event subscription for pressure changes

- **Bandwidth Intelligence**
  - BandwidthMonitor with ring buffer sampling
  - Classification: low (<1 Mbps), medium, high (>5 Mbps)
  - Dynamic CDN variant selection
  - Silent upgrade to full resolution on fast connections

- **Image Validation**
  - JPEG, PNG, GIF, WebP, BMP header validation
  - Corrupted image detection
  - Large image rejection with configurable threshold
  - Animated image detection (GIF, WebP)

- **Content Detection**
  - ETag comparison for cache validation
  - Last-Modified header comparison
  - Content-Length change detection
  - Cache-Control directive parsing

### Performance

- **Bundle Size**: 69.81 KB (17.31 KB gzipped)
- **Test Coverage**: 80%+ on new code
- **Unit Tests**: 297 tests passing

### Documentation

- API documentation in README.md
- Contract specifications for CloudProvider, CloudImage, Worker
- Task tracking in tasks.md

### Testing

- Unit tests with Vitest
- E2E tests for cloud flows
- Platform tests for Smart TV scenarios
- Performance benchmarks
