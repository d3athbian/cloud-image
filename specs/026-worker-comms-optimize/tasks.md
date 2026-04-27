# Tasks: Worker-Main Thread Communication Optimization

**Input**: Design documents from `specs/026-worker-comms-optimize/`

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Analyze existing code and prepare for user story implementation

- [X] T001 Analyze current WorkerMessage/WorkerResponse types in packages/cloud/src/core/types.ts
- [X] T002 Analyze existing Service Worker postMessage usage in packages/cloud/src/service-worker/sw.ts
- [X] T003 Document current transfer patterns and identify optimization opportunities

**Checkpoint**: Existing architecture analyzed - user story implementation can now begin

---

## Phase 3: User Story 1 - Optimize Image Data Transfer (Priority: P1)

**Goal**: Implement Transferable objects for zero-copy ImageBitmap transfers

**Independent Test**: Load 20 images, measure worker message to on-screen time (<100ms)

### Implementation for User Story 1

- [X] T004 [P] [US1] Add transfer field to WorkerResponse type in packages/cloud/src/core/types.ts
- [X] T005 [P] [US1] Add CompressionMetadata type in packages/cloud/src/core/types.ts
- [X] T006 [US1] Implement Transferable object support in postMessage (sw.ts)
- [X] T007 [US1] Verify zero-copy transfer works correctly
- [X] T008 [US1] Update DevTools to show transfer size metrics

**Checkpoint**: Transferable objects working - images transfer with zero-copy

---

## Phase 4: User Story 2 - Compress Worker-to-Main Thread Messages (Priority: P2)

**Goal**: Reduce data transfer by 60%+ through compression

**Independent Test**: Compare bytes transferred before/after compression via DevTools

### Implementation for User Story 2

- [X] T009 [P] [US2] Create compression module in packages/cloud/src/worker/compression.ts
- [X] T010 [US2] Add compression before postMessage in sw.ts
- [X] T011 [US2] Add decompression in main thread response handler
- [X] T012 [US2] Measure and log compression ratio

**Checkpoint**: Compression working - 60%+ transfer reduction achieved

---

## Phase 5: User Story 3 - Batch Image Processing Messages (Priority: P3)

**Goal**: Batch multiple images into single messages (max 2 messages for 10 images)

**Status**: DEFERRED - Batching requires architectural changes to message handling

- [X] T013 [P] [US3] Create TransferBatch type in packages/cloud/src/core/types.ts
- [ ] T014 [US3] Implement batch queue in sw.ts (DEFERRED)
- [ ] T015 [US3] Add flush logic (interval or size threshold) (DEFERRED)
- [ ] T016 [US3] Update response handler for batch payloads (DEFERRED)

**Note**: Batching infrastructure was removed due to complexity. Can be revisited in future.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T017 [P] Run lint and typecheck
- [X] T018 [P] Update quickstart.md with new monitoring info
- [ ] T019 Verify all success criteria met

---

## Dependencies & Execution Order

- **Foundational (Phase 2)**: Complete
- **User Stories (Phase 3-4)**: Complete
- **User Stories (Phase 5)**: DEFERRED
- **Polish (Phase 6)**: T019 pending

## Notes

- Tasks stay local until you indicate to push
- Each checkpoint is independently testable