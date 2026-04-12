# Tasks: Background Sync

## Phase 1: Setup

- [ ] T001 Create feature branch `015-background-sync`

## Phase 2: SyncQueue

- [ ] T002 [P] Create `packages/cloud/src/core/sync-queue.ts`
- [ ] T003 [P] Implement in-memory queue methods
- [ ] T004 [P] Implement IndexedDB persistence

## Phase 3: Integration

- [ ] T005 Modify engine.set() to use queue when offline
- [ ] T006 Modify engine.delete() to use queue when offline
- [ ] T007 Add online event listener for sync trigger

## Phase 4: Testing

- [ ] T008 Unit test: queue operations
- [ ] T009 Unit test: persistence
- [ ] T010 E2E test: offline queue

## Dependencies

- T003 depends on T002
- T007 depends on T005, T006

## Parallel Opportunities

- T002, T003 can run in parallel