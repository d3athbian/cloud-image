# Feature Specification: Performance Improvements and General Refactor

**Feature Branch**: `031-perf-refactor`
**Created**: 2026-05-13
**Status**: Draft
**Input**: mejoras y refactor perfomance en general

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Faster Image Loading (Priority: P1)

As a developer using the carbon-image library, I want images to load faster with less memory consumption, so that my application remains responsive even when handling many images.

**Why this priority**: Performance is critical for the library's value proposition, especially on resource-constrained devices like Smart TVs.

**Independent Test**: Load a page with 50+ images and verify the application stays responsive and memory usage remains stable.

**Acceptance Scenarios**:
1. **Given** the application displays multiple images, **When** loading new images, **Then** existing cached images remain instantly accessible without blocking
2. **Given** the device has limited memory, **When** the cache reaches capacity, **Then** eviction happens without causing visible stutter or freeze
3. **Given** images are loading concurrently, **When** network conditions vary, **Then** the system prioritizes visible images and degrades gracefully for off-screen images

---

### User Story 2 - Reduced Memory Footprint (Priority: P1)

As a developer deploying carbon-image on Smart TVs, I want the library to consume minimal memory so that the TV operating system remains stable and other apps don't get killed.

**Why this priority**: Memory pressure on Smart TVs is the primary cause of crashes andforced app termination.

**Independent Test**: Monitor memory usage over 30 minutes with continuous image loading and verify it stays below 150MB for a typical application.

**Acceptance Scenarios**:
1. **Given** the cache has 100+ items, **When** viewing memory usage, **Then** the in-memory footprint stays minimal through efficient data structures
2. **Given** a large image is requested, **When** memory is limited, **Then** the system downgrades to a smaller variant instead of crashing
3. **Given** images are no longer needed, **When** they leave the viewport, **Then** their memory is released promptly

---

### User Story 3 - Smoother Runtime Performance (Priority: P2)

As a developer using carbon-image in a React application, I want UI interactions to remain smooth even when the cache is actively managing images.

**Why this priority**: Janky UI directly impacts user experience and app store ratings.

**Independent Test**: Use Chrome DevTools Performance tab to record scrolling through a page with 20+ images and verify no dropped frames beyond 16ms.

**Acceptance Scenarios**:
1. **Given** the user scrolls through a gallery, **When** images load in the background, **Then** scrolling maintains 60fps without interruption
2. **Given** the cache performs eviction, **When** it runs, **Then** it does not block the main thread for more than 50ms
3. **Given** multiple images become visible simultaneously, **When** they are decoded, **Then** decoding happens off the main thread without UI freeze

---

### User Story 4 - Faster Initial Load (Priority: P2)

As a developer integrating carbon-image, I want the initial bundle to be as small as possible so that users on slow connections see content quickly.

**Why this priority**: First impression matters - slow loading causes abandonment.

**Independent Test**: Measure the JavaScript bundle size and verify initial render completes within 2 seconds on a 4G connection.

**Acceptance Scenarios**:
1. **Given** the application is loading for the first time, **When** images are requested, **Then** the core cache module loads in under 50KB gzipped
2. **Given** the user has cached content previously, **When** returning to the app, **Then** images load from cache instantly with no network request
3. **Given** tree-shaking is working correctly, **When** only the cache is needed, **Then** React components are not included in the bundle

---

## Clarifications

### Session 2026-05-13

- Q: ¿Qué aspectos de performance específicamente se quiere mejorar? → A: Memory footprint, async operations efficiency, bundle size, and cache eviction speed.
- Q: ¿Hay alguna área específica que ya se ha identificado como bottleneck? → A: Se asume que las áreas principales son: (1) Memory management en ImageCache, (2) Lock contention en operaciones async, (3) Bundle size por dependencias no tree-shakeables.
- Q: ¿Se deben mantener todas las APIs públicas existentes? → A: Sí, refactor debe ser backward-compatible. Solo mejoras internas de performance.
- Q: Hook decomposition approach? → A: Option A - Extract hooks with identical behavior (same data, timing, edge cases as current useEffect). Structural benefit without changing logic.

### Edge Cases

- What happens when memory pressure is extreme? - Graceful degradation with smallest possible image variant
- What happens when the mutex queue grows large? - Old pending operations are skipped to prevent starvation
- What happens with concurrent cache access from multiple tabs? - Each tab maintains its own cache instance via SW

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: ImageCache operations MUST use non-blocking async patterns where possible
- **FR-002**: Memory footprint for 100 cached items MUST stay under 50MB
- **FR-003**: Cache eviction MUST complete within 50ms on the main thread
- **FR-004**: Bundle size for core module MUST remain under 50KB gzipped
- **FR-005**: Image decoding MUST happen off the main thread using Web Workers
- **FR-006**: All public APIs MUST maintain backward compatibility
- **FR-007**: The library MUST detect memory pressure and trigger aggressive eviction before OOM
- **FR-008**: Concurrent cache operations MUST not cause lock contention that blocks for >100ms
- **FR-009**: Hook decomposition (useNetworkMonitor, useImageCacheLoader, useCrossfadeAnimation) MUST produce identical behavior, timing, and edge cases as the current implementation - no logic changes allowed

### Key Entities

- **ImageCache**: Core caching engine with async operations
- **SimpleMutex**: Queue-based mutex for thread-safe operations
- **MemoryMonitor**: Memory pressure detection and response
- **WorkerPool**: Manages image decoding workers
- **EvictionManager**: Handles cache eviction with timing guarantees

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Memory usage stays below 150MB when handling 100+ images
- **SC-002**: Cache operations (get/set/delete) complete in under 100ms average
- **SC-003**: Eviction cycle completes within 50ms main thread time
- **SC-004**: Bundle size for core module is under 50KB gzipped
- **SC-005**: 60fps maintained during continuous image loading
- **SC-006**: No dropped frames during cache eviction
- **SC-007**: Time to first image from cache is under 10ms
- **SC-008**: Memory pressure detection triggers before 80% device memory usage

## Implementation Phases

### Phase 1: Analysis and Profiling
- Profile current memory usage patterns
- Identify lock contention points in async operations
- Measure bundle size breakdown by module
- Benchmark current eviction performance

### Phase 2: Memory Optimization
- Implement efficient data structures for cache entries
- Add memory pressure monitoring with early warning
- Optimize entry metadata storage
- Implement weak references for decoded ImageBitmaps

### Phase 3: Async Operations Refactor
- Review mutex usage and reduce contention
- Implement lock-free paths where possible
- Add operation timeouts to prevent queue buildup
- Improve batch operations for adapter sync

### Phase 4: Bundle Optimization
- Audit dependencies for tree-shaking
- Move optional features to separate entry points
- Remove duplicate dependencies
- Enable advanced minification

### Phase 5: Worker Optimization
- Improve Worker pool management
- Optimize ImageBitmap transfer with Transferable objects
- Add priority queue for visible vs off-screen images
- Implement worker-side caching of decoded bitmaps

### Phase 6: Testing and Validation
- Performance profiling on target devices (Smart TV)
- Memory stress testing
- Concurrent access testing
- Bundle size validation

## Assumptions

- The library is already using Web Workers for image decoding
- Smart TV devices typically have 512MB-1GB RAM available for apps
- Performance targets are achievable without changing the overall architecture
- All existing public APIs must remain backward compatible
- Bundle size is measured with production build (minified + gzipped)