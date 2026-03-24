# Feature Specification: Service Worker with IndexedDB Cache

**Feature Branch**: `003-workers-to-serviceworkers`  
**Created**: 2026-03-22  
**Updated**: 2026-03-24  
**Status**: Draft  
**Input**: "necesitamos refactorizar el código ya que se implemento con web workers y necesitamos usar service workers"

## Clarifications

- Q: How should service worker updates be handled when images are loading? → A: Stale-while-revalidate - serve stale cache, update in background
- Q: Scope of migration - should all processing move to Service Worker? → A: Yes - ALL image operations (fetch, verify, update, delete, connection checks) must run in Service Worker thread

## User Scenarios & Testing

### User Story 1 - Universal Image Processing via Service Worker (Priority: P1)

As a user, I want ALL image operations to happen without blocking the main thread, so that the application remains responsive during network requests, image processing, and cache management.

**Why this priority**: Core performance requirement - eliminates UI jank and ensures smooth user experience.

**Independent Test**: Can be tested by monitoring main thread during heavy image operations and verifying no dropped frames.

**Acceptance Scenarios**:

1. **Given** user loads a page with multiple images, **When** images are fetched and decoded, **Then** main thread remains free for UI interactions
2. **Given** cache operations (eviction, cleanup) are running, **When** user interacts with page, **Then** interactions are not delayed
3. **Given** network requests are in flight, **When** user navigates, **Then** navigation is not blocked

---

### User Story 2 - Centralized Image Cache Management (Priority: P1)

As a user, I want a single persistent cache layer managed entirely by the Service Worker, so that images are cached across page reloads and available offline.

**Why this priority**: Enables offline access and fast repeat views.

**Independent Test**: Can be tested by loading images, closing browser, reopening, and verifying images load from persistent cache.

**Acceptance Scenarios**:

1. **Given** user has previously loaded an image, **When** user reopens the browser, **Then** image loads from persistent cache
2. **Given** user is offline, **When** previously cached images are requested, **Then** images are served from cache
3. **Given** cache reaches capacity, **When** new images are loaded, **Then** LRU eviction removes least-used entries

---

### User Story 3 - Network-Aware Adaptive Delivery (Priority: P2)

As a user, I want the system to adapt image delivery based on network conditions, so that I receive appropriate quality on slow connections.

**Why this priority**: Improves experience on variable network conditions.

**Independent Test**: Can be tested by throttling network and observing smaller image variants delivered.

**Acceptance Scenarios**:

1. **Given** user is on fast network (RTT < 500ms), **When** image is requested, **Then** full-resolution variant is delivered
2. **Given** user is on slow network (RTT > 500ms), **When** image is requested, **Then** smaller variant is delivered first

---

### Edge Cases - Resolved

#### Edge Case 1: Navegador no soporta Service Workers
- Always attempt Service Worker registration
- If fails → fallback to direct fetch + memory cache (no persistence)
- Only log to console when `debug: true`
- Never block main thread

#### Edge Case 2: Cache corrupto o entradas inválidas
- Validate data before saving (try decode)
- If decode fails → delete corrupted entry automatically
- Auto re-fetch from network transparently
- User never notices the problem

#### Edge Case 3: Almacenamiento del dispositivo lleno
- Validate data BEFORE saving (never store corrupted data)
- If storage >90% → aggressive eviction (50% immediately)
- Retry with backoff after eviction
- If still fails → transparent fallback to network-only
- Only log to console when `debug: true`
- User never notified - all automatic

#### Edge Case 4: Service Worker se actualiza mientras cargan imágenes
- Use stale-while-revalidate pattern
- Serve stale cache while updating in background
- Current operations not interrupted
- New requests handled by new SW

#### Edge Case 5: URLs del CDN cambian o no están disponibles
- First: try requested variant
- Retry with exponential backoff (3 attempts)
- Fallback to original URL if variant fails
- Circuit breaker after 3 failures (30s cooldown)
- While CDN unavailable: serve from cache if exists

#### Edge Case 6: Múltiples pestañas piden la misma imagen sin cache
- Deduplication in Service Worker
- First tab makes fetch
- Other tabs receive same promise
- Prevents duplicate requests
- Simple and effective

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST use Service Worker as the sole processing thread for all image operations (fetch, decode, verify, update, delete)
- **FR-002**: System MUST remove all Web Worker code and related infrastructure
- **FR-003**: System MUST delete all Web Worker-related test files
- **FR-004**: System MUST register a Service Worker that persists across page reloads and browser restarts
- **FR-005**: System MUST intercept ALL image fetch requests and route through Service Worker (including CDN redirects like picsum.photos)
- **FR-006**: System MUST store cached images in IndexedDB for persistent storage across sessions
- **FR-007**: System MUST fetch images from network when not in IndexedDB cache and store for future use
- **FR-008**: System MUST implement LRU cache eviction when storage reaches 90% capacity
- **FR-009**: System MUST evict expired entries (based on TTL) before applying LRU scoring
- **FR-010**: System MUST measure network RTT and select appropriate image variants
- **FR-011**: System MUST handle Service Worker updates with stale-while-revalidate pattern
- **FR-012**: System MUST provide cache manipulation API (get, set, clear, stats)
- **FR-013**: System MUST maintain cache statistics (hit rate, miss rate, eviction count)
- **FR-014**: System MUST deduplicate concurrent requests for the same resource
- **FR-015**: System MUST use IndexedDB as primary persistent storage (NOT Cache API)
- **FR-016**: System MUST detect browser support and fail gracefully when Service Workers or IndexedDB are unsupported

### Key Entities

- **Image Cache Entry**: Cached image with URL, blob data, metadata (size, timestamps, access count, TTL), dimensions
- **Cache Configuration**: Settings for max size, default TTL, eviction batch size, network thresholds
- **Network Quality Metrics**: RTT measurements and bandwidth indicators for variant selection
- **Cache Statistics**: Metrics including item count, total size, hit/miss rate, eviction count
- **Service Worker Message**: Request/response format for main thread ↔ Service Worker communication

## Success Criteria

### Measurable Outcomes

- **SC-001**: Main thread remains unblocked (< 50ms task duration) during image operations
- **SC-002**: Repeat image loads complete within 100ms from persistent cache
- **SC-003**: Cache hit rate reaches 80% after typical usage (100+ image loads)
- **SC-004**: System serves cached content when offline after initial load
- **SC-005**: UI maintains 60fps during concurrent image loading
- **SC-006**: Cache eviction completes within 500ms regardless of cache size

---

## Assumptions

- Browser supports Service Worker API (Chrome 40+, Firefox 33+, Safari 11.1+)
- Browser supports IndexedDB for persistent storage
- Service Worker scope limited to same origin or configured path
- IndexedDB database name: `carbon-image-cache`
- IndexedDB object store: `images` with `url` as keyPath
- Image variants available at CDN with predictable URL patterns
- Default cache max size: 100MB
- Default TTL: 7 days
