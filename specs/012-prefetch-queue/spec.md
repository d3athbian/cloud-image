# Feature Specification: Prefetch Queue

**Feature Branch**: `008-lib-perf-optimization`  
**Created**: 2026-04-11  
**Status**: Draft  
**Input**: "Create spec for prefetch queue"

## Problem Statement

Preload upcoming images in advance to improve UX. User should be able to prefetch N images before viewing.

## Implemented Behavior

### PrefetchQueue (packages/cloud/src/core/prefetch.ts)

**What it does:**
- Manages queue of URLs to prefetch
- Supports priority (higher = sooner)
- Max 3 concurrent by default
- Emits events: 'start', 'complete', 'error', 'queueChange'

**Example usage:**
```typescript
const queue = new PrefetchQueue(fetchImage, 3);
queue.enqueue('https://picsum.photos/id/1/400/300', { priority: 10 });
queue.subscribe((event) => {
  if (event.type === 'complete') console.log('Prefetched:', event.task.url);
});
```

## User Stories

### US1 - Enqueue Images (Priority: P1)

**Goal**: Queue images for download

**Acceptance Scenarios**:
1. **Given** valid URL, **When** enqueue called, **Then** added to queue
2. **Given** queue full (100), **When** enqueue called, **Then** oldest pending evicted

### US2 - Priority Processing (Priority: P1)

**Goal**: Process higher priority first

**Acceptance Scenarios**:
1. **Given** priority 10 and priority 5, **When** processing, **Then** priority 10 first
2. **Given** maxConcurrent is 3, **When** 5 enqueued, **Then** 3 process concurrently

### US3 - Abort Control (Priority: P2)

**Goal**: Cancel prefetch if needed

**Acceptance Scenarios**:
1. **Given** AbortSignal passed, **When** cancelled, **Then** fetch aborted
2. **Given** user navigates away, **When** signal aborted, **Then** no pending fetches remain

## Requirements

- **FR-001**: Queue MUST support priority (higher = sooner)
- **FR-002**: Default maxConcurrent: 3
- **FR-003**: Default maxQueueSize: 100
- **FR-004**: MUST emit queueChange events

## Success Criteria

- All queued images eventually fetched
- No memory leaks after navigation
- Works concurrently with main image loading