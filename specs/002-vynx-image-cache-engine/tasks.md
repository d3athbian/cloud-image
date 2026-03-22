---

description: "Task list for VYNX Engine - Visual Asset Orchestration System"

---

# Tasks: VYNX Engine - Visual Asset Orchestration System

**Input**: Design documents from `specs/002-vynx-image-cache-engine/`  
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, contracts/, research.md

**Note**: Tests are MANDATORY per Constitution (Test-First principle). All public APIs MUST have unit tests. Integration tests required for library contracts.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 0.5: Repository Setup & Testing MVP

**Purpose**: Configure git repo and create demo/testing infrastructure (runs BEFORE Phase 1)

### Repository Configuration (Interactive - User Input Required)

**⚠️ This phase requires USER INPUT before proceeding**

- [ ] T0.1 Create /scripts/setup-repository.sh - Interactive script that asks:
  - Repository name (e.g., `vynx` or custom)
  - npm scope (e.g., `@vynx/vynx` or custom)
  - Git remote URL
  - Initial commit message
  - Branch protection (main/dev)
  - CI/CD platform preference (GitHub Actions, GitLab CI, none)

**Script will prompt user with questions like:**
```bash
? Repository name: vynx
? npm scope (press enter for @vynx/vynx): 
? Git remote URL (press enter to skip): 
? Initial branch (main): 
? Create GitHub Actions workflow? (Y/n)
```

- [ ] T0.2 Initialize git repository with settings from T0.1
- [ ] T0.3 Create initial commit with all spec files

### Demo App & Testing

- [ ] T141 Create demo app in /demos/vynx-demo/ (outside packages/vynx to exclude from bundle)
- [ ] T142 Configure vite.config to explicitly exclude /demos from npm bundle
- [ ] T143 Generate playwright-cli scripts for:
  - Cache hit test (verify <50ms retrieval)
  - Stress test (100+ images, verify no CLS)
  - Offline test (disconnect, verify cached images visible)
- [ ] T144 Create stress test runner with configurable image count (N=10,50,100,500)
- [ ] T145 Create /docs/DISTRIBUTION.md with:
  - npm install instructions
  - Usage example
  - CDN alternative
  - playwright-cli usage for testing in other repos

**Checkpoint**: Repository configured, demo app ready, distribution docs complete

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Initialize monorepo structure and configure build tools

- [ ] T001 Initialize TypeScript 5.x project with strict mode in packages/vynx/
- [ ] T002 Configure Vite for library bundling with tree-shaking support
- [ ] T003 Configure Vitest for unit testing with coverage thresholds
- [ ] T004 Configure Playwright for integration/e2e testing (use `playwright-cli` skill)
- [ ] T005 [P] Create package.json with exports map for tree-shaking
- [ ] T006 [P] Setup ESLint + Prettier with checked-in config
- [ ] T007 [P] Create packages/vynx/src/ directory structure (core/, adapters/, worker/, react/)
- [ ] T008 Create initial tsconfig.json extending base strict config

---

## Phase 2: Foundational (Core Types & Worker Infrastructure)

**Purpose**: Core type definitions and Worker communication layer (BLOCKS all user stories)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests for Foundational Phase (MANDATORY - TDD)

- [ ] T009 Write unit tests for CacheEntry validation rules in packages/vynx/tests/unit/cache-entry.test.ts
- [ ] T010 Write unit tests for CacheConfig validation rules in packages/vynx/tests/unit/cache-config.test.ts
- [ ] T011 Write unit tests for WorkerMessage serialization in packages/vynx/tests/unit/worker-message.test.ts

### Implementation for Foundational Phase

- [ ] T012 Create packages/vynx/src/core/types.ts with CacheEntry, CacheConfig, CacheStats, PlatformType, CircuitBreakerState interfaces
- [ ] T013 Create packages/vynx/src/core/engine.ts with ImageEngine class skeleton
- [ ] T014 Create packages/vynx/src/core/cache.ts with LRU/TTL eviction logic:
  - 90% threshold trigger
  - LRU dual scoring (accessCount × 0.6 + recencyFactor × 0.4)
  - TTL expiration check (always evicts expired first)
  - 20% batch eviction on trigger
- [ ] T015 Create packages/vynx/src/core/queue.ts with priority queue implementation
- [ ] T016 Create packages/vynx/src/worker/worker.ts with embedded Blob URL pattern
- [ ] T017 [P] Create packages/vynx/src/worker/fetch.ts with network operations, deduplication, and ImageBitmap decoding
- [ ] T018 [P] Create packages/vynx/src/worker/storage.ts with adapter communication
- [ ] T019 Create packages/vynx/src/worker/compression.ts with ArrayBuffer transfer handling
- [ ] T020 Create packages/vynx/src/contracts/worker-protocol.ts with message type definitions
- [ ] T021 Implement Worker message handler with request-response pattern

**Checkpoint**: Foundation ready - ImageEngine can coordinate cache + Worker operations

---

## Phase 3: User Story 1 - Instant Image Display via VynxImage Component (Priority: P1) 🎯 MVP

**Goal**: VynxImage component as drop-in img replacement with automatic caching

**Independent Test**: Render VynxImage with URL, verify display, cache retrieval (<50ms), CLS prevention

### Tests for User Story 1 (MANDATORY - TDD)

- [ ] T022 Write unit tests for VynxImage component states in packages/vynx/tests/unit/image-component.test.tsx
- [ ] T023 Write unit tests for VynxImage loading states in packages/vynx/tests/unit/image-states.test.tsx
- [ ] T024 Write integration tests for VynxImage cache hit scenario in packages/vynx/tests/integration/image-cache-hit.test.tsx
- [ ] T025 Write integration tests for VynxImage CLS prevention in packages/vynx/tests/integration/image-cls.test.tsx

### Implementation for User Story 1

- [ ] T026 [P] Create packages/vynx/src/react/image.tsx with VynxImage component
- [ ] T027 [P] Implement VynxImage state machine (pending, loading, loaded, error, offline)
- [ ] T026.5 [P] Implement priority hints: `fetchpriority="high"` for above-fold images, `loading="lazy"` for below-fold (viewport detection via IntersectionObserver)
- [ ] T028 [P] Implement aspect-ratio placeholder for CLS prevention in VynxImage
- [ ] T029 Implement useSyncExternalStore integration for cache state in packages/vynx/src/react/hooks.ts
- [ ] T030 Create packages/vynx/src/contracts/image-contract.ts with VynxImageProps interface
- [ ] T031 Integrate VynxImage with Worker communication via engine.get()
- [ ] T032 Add onCacheHit and onCacheMiss callbacks to VynxImage

**Checkpoint**: VynxImage works as img replacement with automatic caching and CLS prevention

---

## Phase 4: User Story 2 - Seamless Platform Adaptation (Priority: P1)

**Goal**: Automatic platform detection and optimal storage adapter selection

**Independent Test**: Run on Web/Tizen/WebOS, verify correct adapter used automatically

### Tests for User Story 2 (MANDATORY - TDD)

- [ ] T033 Write unit tests for platform detection in packages/vynx/tests/unit/platform-detection.test.ts
- [ ] T034 Write unit tests for WebAdapter (IndexedDB) in packages/vynx/tests/unit/adapters/web.test.ts
- [ ] T035 Write unit tests for MemoryAdapter in packages/vynx/tests/unit/adapters/memory.test.ts
- [ ] T036 Write integration tests for adapter fallback chain in packages/vynx/tests/integration/adapter-fallback.test.ts

### Implementation for User Story 2

- [ ] T037 [P] Create packages/vynx/src/adapters/web.ts with IndexedDB implementation using idb
- [ ] T038 [P] Create packages/vynx/src/adapters/memory.ts with in-memory LRU cache
- [ ] T039 [P] Create packages/vynx/src/adapters/tizen.ts with Tizen FileSystem API adapter
- [ ] T040 [P] Create packages/vynx/src/adapters/webos.ts with WebOS FileSystem API adapter
- [ ] T041 Create packages/vynx/src/adapters/index.ts with detectPlatform() and createAdapter() factory
- [ ] T042 Create packages/vynx/src/adapters/factory.ts implementing auto-detection logic
- [ ] T043 Integrate platform adapter into ImageEngine initialization
- [ ] T044 Add platform override config option for testing

**Checkpoint**: Platform detected automatically, correct adapter selected at runtime

---

## Phase 5: User Story 3 - Zero Main Thread Blocking (Priority: P1)

**Goal**: All I/O operations in Worker, 2ms blocking rule enforced, Decode Async via ImageBitmap

**Independent Test**: Measure main thread execution during image operations, verify <2ms blocking

### Tests for User Story 3 (MANDATORY - TDD)

- [ ] T045 Write unit tests for Worker message throughput in packages/vynx/tests/unit/worker-throughput.test.ts
- [ ] T046 Write integration tests for main thread isolation in packages/vynx/tests/integration/main-thread-isolation.test.ts
- [ ] T047 Write performance tests for 2ms rule compliance in packages/vynx/tests/performance/thread-blocking.test.ts
- [ ] T048 Write unit tests for ImageBitmap decoding in Worker in packages/vynx/tests/unit/imagebitmap-decoding.test.ts

### Implementation for User Story 3

- [ ] T049 [P] Implement ImageBitmap decoding in Worker using createImageBitmap() API
- [ ] T050 [P] Implement Worker message batching for high-frequency operations
- [ ] T051 Create performance monitor in packages/vynx/src/core/performance.ts
- [ ] T052 Add main thread blocking detection and reporting
- [ ] T053 Implement Worker crash detection and graceful degradation
- [ ] T054 Add structured logging with correlation IDs to all Worker operations
- [ ] T055 Transfer ImageBitmap to main thread using transferable objects

**Checkpoint**: All cache operations complete in <2ms on main thread, decode offloaded to Worker

---

## Phase 6: User Story 4 - Offline Content Availability (Priority: P2)

**Goal**: Display cached images when network is unavailable

**Independent Test**: Load images, disconnect network, verify cached images display

### Tests for User Story 4 (MANDATORY - TDD)

- [ ] T056 Write unit tests for NetworkStatus detection in packages/vynx/tests/unit/network-status.test.ts
- [ ] T057 Write integration tests for offline cache retrieval in packages/vynx/tests/integration/offline-retrieval.test.ts
- [ ] T058 Write integration tests for network reconnection in packages/vynx/tests/integration/network-reconnect.test.ts

### Implementation for User Story 4

- [ ] T059 [P] Implement network status monitoring using Navigator.onLine
- [ ] T060 [P] Create offline detection and caching strategy in packages/vynx/src/core/offline.ts
- [ ] T061 Update VynxImage to show offline state when network unavailable
- [ ] T062 Add network.online, network.bandwidth (BandwidthClassification), network.mbps to useVynx() return type
- [ ] T063 Implement automatic retry when network reconnects

**Checkpoint**: Cached images display offline, uncached show appropriate offline state

---

## Phase 7: User Story 5 - Developer Plug-and-Play Integration (Priority: P2)

**Goal**: Zero-config Provider setup, 5-minute integration time

**Independent Test**: New React app + npm install + Provider + VynxImage = working

### Tests for User Story 5 (MANDATORY - TDD)

- [ ] T064 Write unit tests for VynxProvider initialization in packages/vynx/tests/unit/provider.test.tsx
- [ ] T065 Write integration tests for Provider context propagation in packages/vynx/tests/integration/provider-context.test.tsx
- [ ] T066 Write integration tests for zero-config defaults in packages/vynx/tests/integration/zero-config.test.tsx

### Implementation for User Story 5

- [ ] T067 [P] Create packages/vynx/src/react/provider.tsx with VynxProvider component
- [ ] T068 [P] Implement Worker creation via Blob URL in Provider
- [ ] T069 [P] Create React Context and distribution via useVynx() hook
- [ ] T070 Create packages/vynx/src/contracts/provider-contract.ts with VynxProviderConfig interface
- [ ] T071 Implement default configuration with sensible values (100MB, 7 days, 20MB memory)
- [ ] T072 Create packages/vynx/src/index.ts with public API exports
- [ ] T073 Generate package.json exports map for tree-shaking (core, react, adapters individually importable)

**Checkpoint**: Developer installs package, wraps app in Provider, uses VynxImage - works out of box

---

## Phase 8: User Story 6 - Cache Management and Control (Priority: P2)

**Goal**: Programmatic cache control (clear, invalidate, prefetch, stats)

**Independent Test**: Configure limits, fill cache, verify eviction; call clear, verify empty

### Tests for User Story 6 (MANDATORY - TDD)

- [ ] T074 Write unit tests for LRU eviction algorithm with dual scoring in packages/vynx/tests/unit/lru-eviction.test.ts
- [ ] T075 Write unit tests for TTL expiration and TTL override of LRU in packages/vynx/tests/unit/ttl-expiration.test.ts
- [ ] T076 Write integration tests for 90% threshold trigger and 20% batch eviction in packages/vynx/tests/integration/auto-eviction.test.ts
- [ ] T077 Write integration tests for prefetch queue in packages/vynx/tests/integration/prefetch-queue.test.ts

### Implementation for User Story 6

- [ ] T078 [P] Complete LRU eviction with dual scoring: Score = (accessCount × 0.6) + (recencyFactor × 0.4) in packages/vynx/src/core/cache.ts
- [ ] T079 [P] Implement TTL override: expired entries ALWAYS evicted before LRU calculation
- [ ] T080 [P] Create prefetch queue with priority support in packages/vynx/src/core/prefetch.ts
- [ ] T081 Expose cache.clear(), cache.invalidate(url), cache.prefetch(urls[]) via useVynx() hook
- [ ] T082 Expose cache.getStats() returning CacheStats (itemCount, totalSize, hitRate, etc.)
- [ ] T083 Add manual invalidation endpoint to Worker protocol
- [ ] Note: Request deduplication is part of T017 (Worker fetch.ts)

**Checkpoint**: Developers can control cache programmatically, eviction works correctly

---

## Phase 9: User Story 7 - Network Resilience (Priority: P2)

**Goal**: Handle network failures gracefully with Retry + Backoff and Circuit Breaker

**Note**: Critical for user experience on unstable connections common in Smart TVs

### Tests for User Story 7 (MANDATORY - TDD)

- [ ] T084 Write unit tests for exponential backoff in packages/vynx/tests/unit/exponential-backoff.test.ts
- [ ] T085 Write unit tests for circuit breaker state machine in packages/vynx/tests/unit/circuit-breaker.test.ts
- [ ] T086 Write integration tests for retry behavior in packages/vynx/tests/integration/retry-behavior.test.ts
- [ ] T087 Write integration tests for circuit breaker activation/deactivation in packages/vynx/tests/integration/circuit-breaker.test.ts

### Implementation for User Story 7

- [ ] T088 [P] Implement exponential backoff in packages/vynx/src/core/retry.ts (100ms, 200ms, 400ms)
- [ ] T089 [P] Implement CircuitBreaker class with states: CLOSED → OPEN → HALF_OPEN → CLOSED
- [ ] T090 Create CircuitBreaker configuration (3 failures = OPEN, 30s wait)
- [ ] T091 Integrate CircuitBreaker into Worker fetch logic
- [ ] T092 Expose circuit breaker status via useVynx() hook (circuitBreaker.state, circuitBreaker.failures)
- [ ] T093 Add circuit breaker events for observability (open, close, halfOpen)

**Checkpoint**: Network failures handled gracefully, circuit breaker prevents request spam

---

## Phase 10: User Story 8 - Memory Pressure Awareness (Priority: P2)

**Goal**: Detect memory pressure and aggressively evict cache to prevent crashes on Smart TVs

### Tests for User Story 8 (MANDATORY - TDD)

- [ ] T094 Write unit tests for memory pressure detection in packages/vynx/tests/unit/memory-pressure.test.ts
- [ ] T095 Write integration tests for aggressive eviction when memory > 90% in packages/vynx/tests/integration/memory-pressure-eviction.test.ts

### Implementation for User Story 8

- [ ] T096 [P] Create memory monitor in packages/vynx/src/core/memory.ts using performance.memory API
- [ ] T097 [P] Implement aggressive eviction: when memory > 90%, evict 50% of cache
- [ ] T098 Create memory pressure events for observability
- [ ] T099 Integrate memory monitoring into cache eviction logic
- [ ] T100 Add fallback for browsers without performance.memory API

**Checkpoint**: Smart TV memory managed proactively, preventing crashes

---

## Phase 11: User Story 9 - Bandwidth Intelligence (Priority: P2)

**Goal**: Event-driven bandwidth classification and silent cache upgrades when connection improves

**Architecture**:
- BandwidthMonitor (Worker): Ring buffer sampling, connection classification
- Event-based triggers: online/offline, visibilitychange, connectionchange
- Silent cache upgrade: fetch high quality, overwrite blob, no DOM manipulation

### Tests for Bandwidth Intelligence (MANDATORY - TDD)

- [ ] T101 Write unit tests for bandwidth ring buffer sampling in packages/vynx/tests/unit/bandwidth-sampling.test.ts
- [ ] T102 Write unit tests for bandwidth classification (LOW/MEDIUM/HIGH thresholds) in packages/vynx/tests/unit/bandwidth-classification.test.ts
- [ ] T103 Write unit tests for CDN variant URL generation in packages/vynx/tests/unit/cdn-variants.test.ts
- [ ] T104 Write integration tests for event-based triggers (online/offline/visibilitychange) in packages/vynx/tests/integration/bandwidth-triggers.test.ts
- [ ] T105 Write integration tests for silent cache upgrade in packages/vynx/tests/integration/silent-upgrade.test.ts

### Implementation for Bandwidth Intelligence

- [ ] T106 [P] Create BandwidthMonitor class in packages/vynx/src/core/bandwidth.ts with ring buffer (10 samples)
- [ ] T107 [P] Implement bandwidth sampling: bytes / download_time per request
- [ ] T108 [P] Implement connection classification: LOW (<0.5Mbps), MEDIUM (0.5-2Mbps), HIGH (>2Mbps)
- [ ] T109 Implement fallback to RTT when navigator.connection unavailable
- [ ] T110 Create CDN adapter interface in packages/vynx/src/core/cdn-adapter.ts
- [ ] T111 Implement URL variant generator based on bandwidth (e.g., img.jpg?size=small for LOW)
- [ ] T112 Create config for CDN variants: { domain: 'cdn.com', variants: ['small', 'medium', 'large'] }
- [ ] T113 Update CacheEntry to include qualityTier ('low'/'medium'/'high') and upgradeable flag
- [ ] T114 Implement event listeners: online, offline, visibilitychange, connectionchange
- [ ] T115 Implement silent upgrade: fetch high quality, overwrite cache blob (NOT DOM)
- [ ] T116 Add graceful degradation: if CDN adapter not configured, proceed with normal fetch

**Checkpoint**: Images adapt to bandwidth automatically; cache silently upgrades when connection improves

---

## Phase 12: Progressive Rendering (Priority: P3)

**Goal**: Blur-up placeholder pattern with crossfade transition

### Tests for Progressive Rendering (MANDATORY - TDD)

- [ ] T117 Write unit tests for blur placeholder rendering in packages/vynx/tests/unit/blur-placeholder.test.ts
- [ ] T118 Write unit tests for crossfade transition timing in packages/vynx/tests/unit/crossfade-transition.test.ts
- [ ] T119 Write integration tests for progressive image loading in packages/vynx/tests/integration/progressive-loading.test.ts

### Implementation for Progressive Rendering

- [ ] T120 [P] Implement blur placeholder in packages/vynx/src/react/image.tsx
- [ ] T121 [P] Implement crossfade transition (opacity animation, 300ms ease-out)
- [ ] T122 Add placeholder prop support: VynxImage placeholder="blur-data-url" or placeholder="low-res-url"
- [ ] T123 Handle animation cancellation if user scrolls away before transition completes

**Checkpoint**: Images load smoothly with blur-up effect, no jarring transitions

---

## Phase 13: Edge Cases & Robustness

**Goal**: Handle all edge cases identified in spec

### Tests for Edge Cases (MANDATORY - TDD)

- [ ] T124 Write unit tests for corrupted cache entry detection in packages/vynx/tests/unit/corrupted-cache.test.ts
- [ ] T125 Write unit tests for large image rejection (>50MB) in packages/vynx/tests/unit/large-image.test.ts
- [ ] T126 Write integration tests for animated image handling in packages/vynx/tests/integration/animated-images.test.ts
- [ ] T127 Write integration tests for content-change detection in packages/vynx/tests/integration/content-change.test.ts

### Implementation for Edge Cases

- [ ] T128 [P] Implement corrupted image detection (validate image headers)
- [ ] T129 [P] Implement large image rejection with configurable threshold
- [ ] T130 Handle animated images (GIF, WebP) as regular images with animation preservation
- [ ] T131 Implement content-change detection using ETag/Last-Modified headers

**Checkpoint**: All edge cases handled gracefully

---

## Phase 14: Polish & Cross-Cutting Concerns

**Purpose**: Integration testing, performance validation, documentation

- [ ] T132 [P] Write e2e tests for complete user flows in tests/e2e/vynx-flows.test.ts (use `playwright-cli` skill)
- [ ] T133 [P] Write platform-specific tests for Smart TV scenarios in tests/platform/smart-tv.test.ts (use `playwright-cli` skill)
- [ ] T134 Create performance benchmark suite in packages/vynx/tests/performance/benchmarks.ts
- [ ] T135 Validate <100KB initial bundle size (tree-shaking working)
- [ ] T136 [P] Update README.md with installation and quickstart
- [ ] T137 [P] Create packages/vynx/README.md with API documentation
- [ ] T138 Generate CHANGELOG.md with version tracking
- [ ] T139 Run full test suite and verify 100% pass rate
- [ ] T140 Verify coverage above 80% for new code

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 0.5 (Repo Setup)
       │
       ▼
Phase 1 (Setup)
       │
       ▼
Phase 2 (Foundation) ← BLOCKS ALL
       │
       ▼
┌──────┴──────┬───────────┬────────┐
│             │           │        │
▼             ▼           ▼        ▼
US1          US2         US3      US5
│             │           │     (Provider)
│             │           │        │
│             └─────┬─────┘        │
│                   │              │
▼                   ▼              │
US4              US6             │
│                   │              │
└─────┬────────────┴──────────────┘
      │
      ▼
┌─────┴─────┬────────┬────────┐
│           │        │        │
▼           ▼        ▼        ▼
US7        US8      US9     (Blur)
(Retry)  (Memory) (Bandwidth)
│           │        │        │
└───────────┴────────┴────────┘
              │
              ▼
         Phase 14 (Polish)
```

### Within Each User Story

- Tests (MANDATORY) written and FAIL before implementation
- Types/interfaces before implementations
- Core logic before integrations
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- US1, US2, US3, US5 can proceed in parallel after Phase 2
- Tests within a story marked [P] can run in parallel

---

## Implementation Strategy

### MVP First (Phases 1-3)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (BLOCKS ALL)
3. Complete Phase 3: User Story 1 (VynxImage)
4. **STOP and VALIDATE**: VynxImage caches images, displays <50ms, no CLS
5. Demo to validate core value proposition

### MVP+ (Phases 4-8)

6. Add Platform adapters (US2)
7. Add Worker optimization + Decode Async (US3)
8. Add Provider (US5)
9. Add Offline support (US4)
10. Add Cache management (US6)
11. Add Network Resilience (US7)
12. **VALIDATE**: All core features working

### Production Ready (Phases 9-14)

13. Add Memory Pressure (US8)
14. Add Bandwidth Intelligence (US9)
15. Add Progressive Rendering (Phase 12)
16. Add Edge Cases (Phase 13)
17. Polish & Documentation (Phase 14)

---

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 148 |
| Repository Setup (Phase 0.5) | 8 tasks (3 repo + 5 demo/dist) |
| Setup (Phase 1) | 8 tasks |
| Foundational (Phase 2) | 13 tasks |
| User Story 1 (P1 - MVP) | 12 tasks |
| User Story 2 (P1) | 11 tasks |
| User Story 3 (P1) | 10 tasks |
| User Story 4 (P2) | 8 tasks |
| User Story 5 (P2) | 10 tasks |
| User Story 6 (P2) | 9 tasks |
| User Story 7 - Retry + Circuit Breaker (P2) | 10 tasks |
| User Story 8 - Memory Pressure (P2) | 6 tasks |
| User Story 9 - Bandwidth Intelligence (P2) | 16 tasks |
| Progressive Rendering (P3) | 7 tasks |
| Edge Cases (P3) | 8 tasks |
| Polish (Phase 14) | 9 tasks |

**Suggested MVP Scope**: Phases 0.5-3 (Repo Setup + Testing + Setup + Foundational + US1) = 41 tasks

**Tests**: 40+ test tasks (27% of total) - MANDATORY per Constitution

---

## Features by Phase

### Repository & Demo (Phase 0.5): 8 tasks
- Interactive repo setup script (user input)
- Git initialization with preferences
- Demo app in /demos/
- playwright-cli stress tests
- Distribution documentation

### MVP (Phases 1-3): 33 tasks
- TypeScript setup, Vite, Vitest
- Core cache with LRU/TTL
- Web Worker infrastructure
- VynxImage component

### MVP+ (Phases 4-8): 48 tasks
- Platform adapters (Web/Tizen/WebOS)
- Provider + Context
- Offline support
- Retry + Backoff
- Cache management

### Production Ready (Phases 9-14): 55 tasks
- Memory Pressure detection
- Bandwidth Intelligence (event-driven, silent upgrades)
- Progressive blur-up
- Edge case handling
- Polish & docs
