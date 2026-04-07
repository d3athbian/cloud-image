# Feature Specification: Demo Testing Infrastructure

**Feature Branch**: `005-demo-testing`  
**Created**: 2026-04-06  
**Status**: Draft  
**Input**: "Necesitamos crear un plan para poder probar utilizando la aplicación creada en demos. La idea es que este demo pueda recrear las condiciones para poder probar todos los casos de usos que me permitan no romper la aplicación. Debería poder recuperarse mostrar y cachear correctamente la imagenes, si refresco la pantalla, etc estas pruebas por ahora solo seran orientadas a web con chrome"

## User Scenarios & Testing

### User Story 1 - Cache Persistence After Page Refresh (Priority: P1)

As a developer, I want to verify that cached images persist after page refresh, so I can confirm IndexedDB storage is working correctly.

**Why this priority**: Core functionality - if cache doesn't persist, the library provides no value.

**Independent Test**: Refresh page and verify images load from cache without network requests.

**Acceptance Scenarios**:

1. **Given** images have been loaded and cached, **When** page is refreshed, **Then** images load instantly from cache (visible in DevTools Network tab)
2. **Given** cache stats show 10 images cached, **When** page is refreshed, **Then** stats still show 10 images after render
3. **Given** DevTools Application > IndexedDB is open, **When** page refreshes, **Then** entries remain in cloud-image-cache database

---

### User Story 2 - Cache Recovery from Service Worker (Priority: P1)

As a developer, I want to verify the fallback chain works: Service Worker → Web Adapter → Direct Fetch, so I can confirm the system recovers from failures.

**Why this priority**: Network resilience is a core feature.

**Independent Test**: Disable SW and verify web adapter takes over.

**Acceptance Scenarios**:

1. **Given** Service Worker is registered, **When** SW is disabled in DevTools, **Then** images still load via web adapter IndexedDB
2. **Given** web adapter IndexedDB is corrupted, **When** image is requested, **Then** system falls back to direct network fetch
3. **Given** both SW and IndexedDB fail, **When** image is requested, **Then** error is logged but application doesn't crash

---

### User Story 3 - Network Resilience Testing (Priority: P1)

As a developer, I want to simulate offline and slow network conditions, so I can verify retry logic and circuit breaker work correctly.

**Why this priority**: Must handle real-world network conditions.

**Independent Test**: Use DevTools Network throttling to simulate conditions.

**Acceptance Scenarios**:

1. **Given** network is throttled to "Slow 3G", **When** images are loaded, **Then** retry logic activates after timeout
2. **Given** 3 consecutive fetch failures occur, **When** next image is requested, **Then** circuit breaker opens and fails fast
3. **Given** application goes offline, **When** images are requested, **Then** cached images are served, uncached show placeholder

---

### User Story 4 - Cache Eviction Verification (Priority: P2)

As a developer, I want to verify LRU eviction triggers at 90% capacity, so I can confirm memory management works.

**Why this priority**: Prevents unbounded memory growth.

**Independent Test**: Add many images and verify oldest are evicted.

**Acceptance Scenarios**:

1. **Given** cache is at 90% of maxSize, **When** new image is added, **Then** eviction removes oldest entries
2. **Given** eviction runs, **When** checking stats, **Then** evictionCount increases
3. **Given** cache has items with different access patterns, **When** eviction triggers, **Then** items with lowest score are evicted, calculated as: `(accessCount × 0.6) + (recencyFactor × 0.4)` where `recencyFactor = 1 / (currentTime - lastAccessedAt)`

---

### User Story 5 - CDN Variant Selection (Priority: P2)

As a developer, I want to verify bandwidth detection triggers appropriate CDN variants, so I can confirm adaptive quality works.

**Why this priority**: Optimizes bandwidth on slow connections.

**Independent Test**: Change network throttling and verify request URLs.

**Acceptance Scenarios**:

1. **Given** bandwidth is "low" (< 1 Mbps), **When** images load, **Then** requests go to small/thumbnail variants
2. **Given** bandwidth is "high" (> 5 Mbps), **When** images load, **Then** requests go to full resolution
3. **Given** bandwidth changes mid-session, **When** new images load, **Then** variant selection updates accordingly

---

### User Story 6 - DevTools Integration Verification (Priority: P2)

As a developer, I want to verify DevTools shows accurate cache state and metrics, so I can debug issues visually.

**Why this priority**: Observability is a core principle.

**Independent Test**: Open DevTools and verify data matches UI.

**Acceptance Scenarios**:

1. **Given** DevTools Application tab is open, **When** cache has data, **Then** cloud-image-cache database shows correct entry count
2. **Given** DevTools Performance tab is recording, **When** images load, **Then** timeline shows decode time in worker
3. **Given** console is open, **When** cache operations occur, **Then** structured logs appear with request IDs

---

### User Story 7 - Image Loading States (Priority: P3)

As a developer, I want to verify loading states and placeholders display correctly, so I can confirm progressive rendering works.

**Why this priority**: User experience requirement.

**Independent Test**: Observe UI during image load.

**Acceptance Scenarios**:

1. **Given** image is loading, **When** fetch starts, **Then** blur placeholder appears immediately
2. **Given** placeholder is "blur", **When** image loads, **Then** crossfade transition completes smoothly
3. **Given** image load fails, **When** retry exhausts, **Then** error placeholder or fallback displays

---

### User Story 8 - Prefetch Functionality (Priority: P3)

As a developer, I want to verify prefetch caches images in advance, so I can confirm predictive loading works.

**Why this priority**: Performance optimization.

**Independent Test**: Use prefetch button and verify cache.

**Acceptance Scenarios**:

1. **Given** prefetch button is clicked, **When** 10 URLs are specified, **Then** all 10 images are cached
2. **Given** prefetch runs, **When** checking stats, **Then** itemCount increases by 10
3. **Given** prefetched images are later viewed, **When** checking network, **Then** no additional requests made

---

### Edge Cases

- What happens when IndexedDB storage is full? → Eviction triggers, oldest items removed
- How does system handle corrupted cache entries? → Validation removes invalid entries, logs warning
- What if Service Worker fails to install? → Fallback to web adapter works transparently
- How to test without network? → Use DevTools "Offline" mode in Network tab
- What if browser doesn't support Service Worker? → Web adapter works without SW

## Requirements

### Functional Requirements

- **FR-001**: Demo MUST load images from picsum.photos (10-20 test images)
- **FR-002**: Demo MUST display cache stats (itemCount, totalSize, hitRate, missRate)
- **FR-002a**: Demo MUST update stats in real-time (every 2 seconds or on each cache operation)
- **FR-003**: Demo MUST display network status (online/offline, bandwidth classification)
- **FR-004**: Demo MUST provide controls to prefetch and clear cache
- **FR-005**: Demo MUST show cache hits/misses in real-time
- **FR-006**: Demo MUST work after page refresh (IndexedDB persistence)
- **FR-007**: Demo MUST work offline with cached images
- **FR-008**: Demo MUST integrate with Chrome DevTools (Application, Performance, Console)
- **FR-009**: Demo MUST show Service Worker registration status
- **FR-010**: Demo MUST handle and display errors gracefully
- **FR-010a**: On fetch failure, display inline error placeholder with retry option
- **FR-010b**: On cache error, log structured error with correlation ID and fallback to next tier

### Key Entities

- **TestImage**: URL, width, height, author from picsum.photos
- **CacheScenario**: Type of test (initial load, refresh, offline, throttled)
- **DevToolsVerification**: Checkpoint for manual verification steps

## Success Criteria

### Measurable Outcomes

- **SC-001**: After initial load, all 10 images cached (verified in DevTools)
- **SC-002**: After page refresh, 0 network requests for cached images
- **SC-003**: In offline mode, cached images still display
- **SC-004**: With "Slow 3G" throttling, retry logic activates (visible in console)
- **SC-005**: Eviction count > 0 when cache exceeds 90% capacity
- **SC-006**: DevTools shows same cache state as UI
- **SC-007**: No console errors during normal operation

## Assumptions

- Demo runs in Chrome browser (DevTools required)
- Network access to picsum.photos for test images
- IndexedDB available in browser (not in private mode)
- Service Worker supported (modern browsers)