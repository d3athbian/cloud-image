---

description: "Task list for Demo Testing Infrastructure feature"
---

# Tasks: Demo Testing Infrastructure

**Input**: Design documents from `/specs/005-demo-testing/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: This feature is about manual testing via demo. No TDD tests needed for demo UI itself.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Library Integration & Build (PRINCIPAL TASK)

**Purpose**: Build the library and integrate ALL features into the demo application

**⚠️ CRITICAL**: This is the principal task - the library MUST be built and fully integrated into the demo

- [X] T001 [P] Build the @cloudimage/cloud library: `cd packages/cloud && npm run build`
- [X] T002 [P] Verify library build output exists in packages/cloud/dist
- [X] T003 Update demos/cloud-demo/package.json to use built library version (file:../../packages/cloud)
- [X] T004 Configure demos/cloud-demo/vite.config.ts to copy library SW files to public
- [X] T005 [after: T004] Verify Service Worker files (sw.js, register.js) are generated and accessible in public/
- [X] T006 [P] Verify demo imports all library features correctly (CloudProvider, CloudImage, useCloud)
- [X] T007 Test demo loads without errors after library integration

---

## Phase 2: Foundational (Demo UI Controls)

**Purpose**: Core UI infrastructure for testing - display stats, network status, controls

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T008 Add cache stats display in demos/cloud-demo/src/App.tsx (including real-time hitRate/missRate updates)
- [X] T009 Add network status display in demos/cloud-demo/src/App.tsx
- [X] T010 Add prefetch button control in demos/cloud-demo/src/App.tsx
- [X] T011 Add clear cache button control in demos/cloud-demo/src/App.tsx
- [X] T012 Add Service Worker status indicator in demos/cloud-demo/src/App.tsx
- [X] T013 [P] Verify console logging includes correlation IDs for error tracking (Principle II)

---

## Phase 3: User Story 1 - Cache Persistence After Page Refresh (Priority: P1) 🎯 MVP

**Goal**: Verify cached images persist after page refresh via IndexedDB

**Independent Test**: Refresh page and verify images load from cache without network requests.

### Implementation for User Story 1

- [X] T014 [US1] Ensure CloudProvider is configured with devtools=true in demos/cloud-demo/src/App.tsx
- [X] T015 [US1] Add manual verification steps for IndexedDB persistence in quickstart.md
- [X] T016 [US1] Verify cache stats update correctly after page load in demos/cloud-demo/src/App.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Cache Recovery from Service Worker (Priority: P1)

**Goal**: Verify fallback chain: SW → Web Adapter → Direct Fetch

**Independent Test**: Disable SW and verify web adapter takes over.

### Implementation for User Story 2

- [X] T017 [US2] Document SW fallback verification steps in quickstart.md

**Checkpoint**: User Story 2 verified via manual testing

---

## Phase 5: User Story 3 - Network Resilience Testing (Priority: P1)

**Goal**: Verify retry logic and circuit breaker via network throttling

**Independent Test**: Use DevTools Network throttling to simulate conditions.

### Implementation for User Story 3

- [X] T018 [US3] Add retry/circuit breaker verification steps in quickstart.md
- [X] T019 [US3] Add console logging to verify retry attempts (if not already present)

**Checkpoint**: User Story 3 verified via manual testing

---

## Phase 6: User Story 4 - Cache Eviction Verification (Priority: P2)

**Goal**: Verify LRU eviction triggers at 90% capacity

**Independent Test**: Add many images and verify oldest are evicted.

### Implementation for User Story 4

- [X] T020 [US4] Add more test images (20+) to demos/cloud-demo/src/App.tsx
- [X] T021 [US4] Add eviction verification steps in quickstart.md
- [X] T022 [US4] Display evictionCount in stats panel in demos/cloud-demo/src/App.tsx

**Checkpoint**: User Story 4 verified via manual testing

---

## Phase 7: User Story 5 - CDN Variant Selection (Priority: P2)

**Goal**: Verify bandwidth detection triggers appropriate CDN variants

**Independent Test**: Change network throttling and verify request URLs.

### Implementation for User Story 5

- [X] T023 [US5] Add CDN variant verification steps in quickstart.md

**Checkpoint**: User Story 5 verified via manual testing

---

## Phase 8: User Story 6 - DevTools Integration Verification (Priority: P2)

**Goal**: Verify DevTools shows accurate cache state and metrics

**Independent Test**: Open DevTools and verify data matches UI.

### Implementation for User Story 6

- [X] T024 [US6] Add DevTools verification steps in quickstart.md

**Checkpoint**: User Story 6 verified via manual testing

---

## Phase 9: User Story 7 - Image Loading States (Priority: P3)

**Goal**: Verify loading states and placeholders display correctly

**Independent Test**: Observe UI during image load.

### Implementation for User Story 7

- [X] T026 [US7] Add placeholder and crossfade configuration to CloudImage in demos/cloud-demo/src/App.tsx
- [X] T027 [US7] Add loading states verification steps in quickstart.md

**Checkpoint**: User Story 7 verified via manual testing

---

## Phase 10: User Story 8 - Prefetch Functionality (Priority: P3)

**Goal**: Verify prefetch caches images in advance

**Independent Test**: Use prefetch button and verify cache.

### Implementation for User Story 8

- [X] T028 [US8] Verify prefetch functionality already works in current demo implementation

**Checkpoint**: User Story 8 verified via manual testing

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation

- [X] T029 [P] Update quickstart.md with complete testing scenarios
- [X] T030 [P] Create/update demos/cloud-demo/README.md with testing instructions for new features
- [X] T031 [P] Run full manual test pass through all user stories
- [X] T032 Verify no console errors during demo operation
- [X] T033 Verify demo works in Chrome with DevTools integration

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Must complete first - builds library for demo to use
- **Foundational (Phase 2)**: Depends on Setup - provides UI controls for all stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can proceed in parallel after Phase 2

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational - May integrate with US1
- **User Story 3 (P1)**: Can start after Foundational - May integrate with US1/US2
- **User Stories 4-8**: All can start after Foundational, tested independently

### Within Each User Story

- Implementation in demo app
- Documentation in quickstart.md
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel
- Multiple user stories can be verified in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (build library)
2. Complete Phase 2: Foundational (UI controls)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test cache persistence after refresh

### Incremental Delivery

1. Complete Setup + Foundational → Demo has basic UI
2. Add User Story 1 → Test independently → Cache persistence works
3. Add User Stories 2-8 → Test independently → All scenarios verified

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Demo app serves as manual testing tool per constitution requirements
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently