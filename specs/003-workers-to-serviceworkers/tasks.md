# ⚠️ DEPRECATED STATUS

**Esta spec fue reemplazada por la implementación real del Service Worker en:**

- `packages/cloud/src/service-worker/sw.ts`
- **Spec 010**: Network-Aware Caching (cubre RTT measurement)
- **Spec 011**: Silent Upgrade

**Razón**: La implementación ya está completa en el SW actual. Estas tareas son往事 (del pasado) y ya no aplican.

---

# Tasks: Refactor Web Workers to Service Workers

**Input**: Design documents from `/specs/003-workers-to-serviceworkers/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/

**Tests**: Not requested in spec - will rely on existing test infrastructure

**Organization**: Tasks grouped by user story for independent implementation

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup & Cleanup (Shared Infrastructure)

**Purpose**: Project initialization and removing old Web Worker code

- [X] T001 Delete packages/cloud/src/worker/ directory entirely
- [X] T002 Delete packages/cloud/tests/unit/worker-message.test.ts
- [X] T003 Delete packages/cloud/tests/unit/worker-throughput.test.ts
- [X] T004 Create packages/cloud/src/service-worker/ directory structure

**Checkpoint**: Old Web Worker code removed, new directory ready

---

## Phase 2: Foundational (Core Service Worker Components)

**Purpose**: Build core Service Worker infrastructure - BLOCKS all user stories

### Service Worker Core

- [X] T005 [P] Create service-worker/messages.ts with MessageType enum and SWRequest/SWResponse interfaces in packages/cloud/src/service-worker/messages.ts
- [X] T006 [P] Create service-worker/network.ts with RTT measurement and bandwidth classification in packages/cloud/src/service-worker/network.ts
- [X] T007 [P] Create service-worker/decoder.ts with image decoding utilities (createImageBitmap) in packages/cloud/src/service-worker/decoder.ts

### Cache Manager

- [X] T008 Create service-worker/cache-manager.ts with LRU cache, 90% trigger eviction, TTL expiry in packages/cloud/src/service-worker/cache-manager.ts
- [X] T009 Implement validate-before-save (try decode) in cache-manager.ts
- [X] T010 Implement aggressive eviction (50%) when storage >90% in cache-manager.ts
- [X] T011 Implement deduplication Map for concurrent request handling in cache-manager.ts

### Service Worker Script

- [X] T012 Create service-worker/sw.ts with install, activate, fetch event handlers in packages/cloud/src/service-worker/sw.ts
- [X] T013 Implement stale-while-revalidate pattern in sw.ts
- [X] T014 Implement retry with exponential backoff (3 attempts) in sw.ts
- [X] T015 Implement circuit breaker logic in sw.ts

**Checkpoint**: SW core ready - user story implementation can begin

---

## Phase 3: User Story 1 - Universal Image Processing via Service Worker (P1) 🎯 MVP

**Goal**: All image operations run in Service Worker without blocking main thread

**Independent Test**: Monitor main thread during heavy image operations - no dropped frames

### Implementation

- [X] T016 [P] [US1] Create service-worker/index.ts with Service Worker registration in packages/cloud/src/service-worker/index.ts
- [X] T017 [P] [US1] Create main thread API client in service-worker/index.ts
- [X] T018 [US1] Implement postMessage communication between main thread and SW in service-worker/index.ts
- [X] T019 [US1] Add fallback to direct fetch + memory cache when SW unsupported in service-worker/index.ts
- [X] T020 [US1] Add debug mode logging (only when enabled) in service-worker/index.ts

**Checkpoint**: User Story 1 functional - images process in SW without blocking main thread

---

## Phase 4: User Story 2 - Centralized Image Cache Management (P1)

**Goal**: Persistent cache across page reloads, offline support, LRU eviction

**Independent Test**: Load images, close browser, reopen - images load from persistent cache

### Implementation

- [ ] T021 [P] [US2] Integrate cache-manager.ts with Cache API (IndexedDB-backed) in packages/cloud/src/service-worker/cache-manager.ts
- [ ] T022 [P] [US2] Verify offline support - serve from cache when offline in packages/cloud/src/service-worker/sw.ts
- [ ] T023 [US2] Test cache persists across browser restart
- [ ] T024 [US2] Verify LRU eviction works at 90% capacity

**Checkpoint**: User Story 2 functional - persistent cache across sessions

---

## Phase 5: User Story 3 - Network-Aware Adaptive Delivery (P2)

**Goal**: Adapt image quality based on network conditions (RTT measurement)

**Independent Test**: Throttle network - smaller images delivered on slow connection

### Implementation

- [ ] T025 [P] [US3] Integrate network.ts with RTT measurement in packages/cloud/src/service-worker/network.ts
- [ ] T026 [US3] Implement variant selection based on RTT thresholds in packages/cloud/src/service-worker/sw.ts
- [ ] T027 [US3] Implement fallback to original URL if variant fails in packages/cloud/src/service-worker/sw.ts
- [ ] T028 [US3] Add background upgrade to full resolution when conditions improve

**Checkpoint**: User Story 3 functional - network-adaptive image delivery

---

## Phase 6: Engine Refactor

**Purpose**: Update ImageEngine to use Service Worker communication

- [X] T029 Remove embedded Worker code from packages/cloud/src/core/engine.ts
- [X] T030 Update packages/cloud/src/core/engine.ts to use Service Worker communication
- [ ] T031 Update packages/cloud/src/core/types.ts - remove WorkerMessage/WorkerResponse (already deleted in T001)
- [X] T032 Add graceful fallback in engine.ts for unsupported browsers

**Checkpoint**: Engine refactored - uses Service Worker

---

## Phase 7: Integration & Polish

- [X] T033 Update packages/cloud/src/index.ts exports to include new service-worker module
- [X] T034 Verify offline functionality end-to-end
- [ ] T035 Run performance validation - main thread < 50ms tasks
- [X] T036 Update quickstart.md with new Service Worker API

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational
- **Engine Refactor (Phase 6)**: Depends on User Stories
- **Polish (Phase 7)**: Depends on Engine Refactor

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational - No dependencies on other stories
- **US2 (P1)**: Can start after Foundational - Uses US1 infrastructure but independently testable
- **US3 (P2)**: Can start after Foundational - Uses US1/US2 infrastructure but independently testable

### Within Each User Story

- Core types before implementation
- Implementation before integration
- Story complete before moving to next

### Parallel Opportunities

- Phase 1: T001-T003 can run in parallel (delete operations)
- Phase 2: T005-T007 (T008-T015 sequential within cache/worker)
- Phase 3: T016-T020 services can run partially parallel
- User Stories can be worked on in parallel by different developers once Foundational is complete

---

## Parallel Example: User Story 1

```bash
# These can run in parallel:
Task: "Create service-worker/messages.ts with MessageType enum"
Task: "Create service-worker/network.ts with RTT measurement"
Task: "Create service-worker/decoder.ts with image decoding"

# Then sequential:
Task: "Create service-worker/index.ts"
Task: "Implement postMessage communication"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup & Cleanup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: No main thread blocking
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Test independently → Deploy (MVP!)
3. Add US2 → Test independently → Deploy
4. Add US3 → Test independently → Deploy
5. Engine Refactor → Polish

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Each user story independently completable
- Verify tests if any fail before implementing
- Commit after each task or logical group
- Avoid: vague tasks, same file conflicts, cross-story dependencies