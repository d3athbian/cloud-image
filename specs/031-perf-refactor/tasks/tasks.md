# Tasks: Performance Improvements and General Refactor

**Feature**: 031-perf-refactor
**Created**: 2026-05-13
**Branch**: 031-perf-refactor

---

## Overview

This task list addresses four critical performance issues:
1. Memory leaks with ObjectURLs (BlobUrlRegistry)
2. SRP violation in CloudImage component (hook decomposition)
3. Individual IntersectionObserver creation (singleton observer)
4. Silent error swallowing (enhanced error handling)

**Critical Constraint**: No logic or functionality changes allowed - only structural refactoring to improve maintainability and performance.

---

## Phase 1: Setup

- [x] T001 Create directory structure for new hooks in src/react/hooks/
- [x] T002 Verify existing tests still pass before starting changes
- [x] T003 Review current CloudImage implementation to understand exact behavior to preserve

---

## Phase 2: Foundational (Blocking Prerequisite)

- [x] T004 Create src/utils/blobUrlRegistry.ts - BlobUrlRegistry class with Map-based tracking
- [x] T005 Create src/utils/globalIntersectionObserver.ts - Singleton observer manager with WeakMap
- [x] T006 Create src/utils/logger.ts - Environment-aware logger with error classification

---

## Phase 3: User Story 1 - Memory Leak Fix (Priority: P1)

**Goal**: Fix ObjectURL memory leaks without changing any existing logic

**Independent Test**: Load a page with 50+ images and verify no blob: URLs leak in heap snapshots

### Implementation Tasks

- [x] T010 [P] Create src/react/hooks/useBlobUrl.ts - ObjectURL lifecycle management hook
- [x] T011 [P] Create src/utils/blobUrlRegistry.ts tests to verify existing behavior
- [x] T012 Integrate useBlobUrl into CloudImage component - ensure identical timing/behavior
- [x] T013 Verify ObjectURLs are revoked on component unmount (existing test + new verification)
- [x] T014 Verify ObjectURLs are revoked when src changes (before creating new)

---

## Phase 4: User Story 2 - SRP Fix / Hook Decomposition (Priority: P1)

**Goal**: Decompose CloudImage useEffect into testable hooks without changing behavior

**Independent Test**: Each hook produces identical output to current implementation - run existing tests

### Implementation Tasks

- [x] T020 Create src/react/hooks/useNetworkMonitor.ts - Network state hook
- [x] T021 Create src/react/hooks/useImageCacheLoader.ts - Cache loading logic hook
- [x] T022 Create src/react/hooks/useCrossfadeAnimation.ts - Animation timing hook
- [x] T023 Refactor CloudImage to use hooks - component becomes pure presenter
- [x] T024 Ensure CloudImage useEffect reduced to < 30 lines
- [x] T025 Verify each hook is independently testable - existing tests pass unchanged
- [x] T026 Verify no race conditions when src changes rapidly (existing test + new verification)

---

## Phase 5: User Story 3 - Global IntersectionObserver (Priority: P2)

**Goal**: Replace per-node observers with singleton to improve scroll performance

**Independent Test**: Gallery with 50+ images maintains 60fps scroll

### Implementation Tasks

- [x] T030 [P] Create useIntersectionObserver React hook wrapper
- [x] T031 [P] Write tests for GlobalIntersectionObserver singleton behavior
- [x] T032 Migrate CloudImage to use globalObserver.observe()
- [x] T033 Verify only 1 IntersectionObserver instance exists (performance profiler)
- [x] T034 Verify cleanup works correctly when DOM nodes are removed

---

## Phase 6: User Story 4 - Error Handling Enhancement (Priority: P2)

**Goal**: Replace silent catch blocks with contextual logging and error propagation

**Independent Test**: Dev mode shows full stack traces; AbortError silently suppressed

### Implementation Tasks

- [x] T040 Enhance src/utils/logger.ts with error classification (AbortError, QuotaExceededError, NetworkError)
- [x] T041 Add onCacheError prop to CloudImageProps interface
- [x] T042 Update CloudImage catch blocks to use classified error handling
- [x] T043 Verify QuotaExceededError triggers onCacheError callback
- [x] T044 Verify AbortError silently suppressed (existing behavior preserved)
- [x] T045 Verify full stack traces appear in dev mode console

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T050 Run full test suite to verify all existing tests still pass
- [x] T051 Run typecheck to verify no type errors introduced
- [x] T052 Run lint check to verify code style compliance
- [x] T053 Measure bundle size - verify core module remains under 50KB gzipped
- [x] T054 Memory profiling - verify no blob: URL leaks after 100 navigations
- [x] T055 Performance profiling - verify 60fps maintained with 50+ images

---

## Dependencies

```
Phase 1 (Setup)
    │
    ▼
Phase 2 (Foundational) ──────────────────┐
    │                                     │
    ├── T004 (BlobUrlRegistry)            │
    ├── T005 (GlobalObserver)             │
    └── T006 (Logger)                     │
    │                                     │
    ▼                                     │
Phase 3 (US1 - Memory Leak)               │
    │                                     │
    └── T010 (useBlobUrl hook)            │
    │                                     │
    ▼                                     │
Phase 4 (US2 - Hook Decomp)               │
    │                                     │
    ├── T020 (useNetworkMonitor)          │
    ├── T021 (useImageCacheLoader)        │
    └── T022 (useCrossfadeAnimation)      │
    │                                     │
    ▼                                     │
Phase 5 (US3 - Observer) ◄────────────────┘
    │                                     │
    └── T031 (Observer tests)             │
    │                                     │
    ▼                                     │
Phase 6 (US4 - Error Handling)            │
    │                                     │
    └── T040-T045                         │
    │                                     │
    ▼                                     │
Phase 7 (Polish)
```

---

## Parallel Execution Opportunities

**Parallel Set 1** (Phase 2 - Foundational):
- T004 (BlobUrlRegistry) can run in parallel with T005 (GlobalObserver) and T006 (Logger)

**Parallel Set 2** (Phase 3 - US1):
- T010 (useBlobUrl hook creation) is parallelizable with verification (T013, T014)

**Parallel Set 3** (Phase 4 - US2):
- T020, T021, T022 (three hooks) can be created in parallel since they don't depend on each other

**Parallel Set 4** (Phase 5 - US3):
- T031 (observer tests) can be written in parallel with T032 (migration)

---

## Implementation Strategy

### MVP Scope (Phase 1-2 only)
Complete Phase 1 (Setup) and Phase 2 (Foundational) to establish the infrastructure before touching any user-facing code.

### Incremental Delivery
1. **First Increment**: Phase 2 (T004, T005, T006) - Foundation utilities
2. **Second Increment**: Phase 3 (US1 - Memory Leak) - BlobURL fix
3. **Third Increment**: Phase 4 (US2 - Hook Decomp) - SRP fix
4. **Fourth Increment**: Phase 5 (US3 - Observer) - Scroll performance
5. **Fifth Increment**: Phase 6 (US4 - Error Handling) - Error logging
6. **Final Increment**: Phase 7 (Polish) - Verification

### Test Strategy
- Existing tests: MUST pass unchanged (no modifications to existing test files)
- New tests: Only for new utilities (BlobUrlRegistry, GlobalObserver)
- Verification: Manual testing with heap snapshots and performance profiler

---

## File Paths

### New Files Created

```
src/react/hooks/useBlobUrl.ts
src/react/hooks/useNetworkMonitor.ts
src/react/hooks/useImageCacheLoader.ts
src/react/hooks/useCrossfadeAnimation.ts
src/react/hooks/useGlobalIntersectionObserver.ts
src/utils/globalIntersectionObserver.ts
src/utils/blobUrlRegistry.ts
```

### Files Modified

```
src/utils/logger.ts
src/react/image.tsx
```

---

## Verification Matrix

| Task | Verification Method | Success Criteria |
|------|---------------------|------------------|
| T004-T006 | Unit tests | Tests pass, no regressions |
| T010-T014 | Heap snapshot | Zero blob: URLs after 100 navigations |
| T020-T026 | Existing tests + code review | All tests pass, useEffect < 30 lines |
| T030-T034 | Performance profiler | 1 observer instance, 60fps maintained |
| T040-T045 | Console inspection | Full traces in dev, AbortError silent |
| T050-T055 | Full test suite | All tests pass, bundle < 50KB |