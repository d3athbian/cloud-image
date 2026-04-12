# Implementation Plan: Background Sync

## Feature Context
- **Feature**: Background Sync for Offline Operations
- **Spec**: `specs/015-background-sync/spec.md`
- **Branch**: `015-background-sync`

## Technical Context

### What's Already Implemented
- Offline detection (`packages/cloud/src/core/offline.ts`)
- Queue system in network monitor (`network.ts` retry)
- IndexedDB adapter for persistence

### What's Needed
- Separate SyncQueue class
- Persist queue to IndexedDB
- Integrate with CloudProvider

## Research Tasks

- [ ] Research: `navigator.onLine` events
- [ ] Research: Background Sync API vs manual queue

## Implementation Tasks

### Phase 1: SyncQueue Class
- [x] T001 Create `packages/cloud/src/core/sync-queue.ts`
- [x] T002 Implement in-memory queue
- [x] T003 Implement IndexedDB persistence

### Phase 2: Integration
- [x] T004 Add queue detection in engine operations
- [x] T005 Add sync trigger on `navigator.onLine`

### Phase 3: Testing
- [x] T006 Unit tests for queue
- [x] T007 E2E test for offline queue

## Files to Modify/Create

| File | Change |
|------|-------|
| `packages/cloud/src/core/sync-queue.ts` | NEW |
| `packages/cloud/src/core/engine.ts` | Integrate queue |

## Architecture

```
┌─────────────────────────────────────────────┐
│  SyncQueue                             │
│  ├─ queue: PendingOperation[]          │
│  ├─ enqueue(op)                      │
│  ├─ dequeue()                        │
│  ├─ sync()                         │
│  └─ persist() → IndexedDB            │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  NetworkMonitor                     │
│  ├─ on 'online' event → trigger sync│
│  └─ on 'offline' event → pause  │
└─────────────────────────────────────────────┘
```

## Gates

- [ ] Queue survives page refresh
- [ ] Sync within 5s of online
- [ ] Deduplication works