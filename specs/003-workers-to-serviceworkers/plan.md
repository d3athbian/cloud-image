# Implementation Plan: Service Worker Image Cache

**Branch**: `003-workers-to-serviceworkers` | **Date**: 2026-03-22 | **Spec**: [spec.md](./spec.md)

## Summary

Refactor the image caching library to use Service Workers as the sole processing thread, replacing the current Web Worker implementation. All image operations (fetch, decode, verify, update, delete, connection checks) will run in the Service Worker to eliminate main thread blocking. Delete all Web Worker code and related tests.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)  
**Primary Dependencies**: Vitest (testing), Vite (build)  
**Storage**: IndexedDB (primary persistent storage via Service Worker)  
**Testing**: Vitest (unit), Playwright (integration)  
**Target Platform**: Web browsers with Service Worker support  
**Project Type**: JavaScript library  
**Performance Goals**: Main thread unblocked (<50ms tasks), 60fps during image load  
**Constraints**: Offline-capable, graceful degradation, <100MB memory usage  
**Scale/Scope**: Single-page applications, up to 1000 cached images  

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Library-First | PASS | Standalone library with clear API |
| II. Observability & DevTools | PASS | Structured logging, cache manipulation API |
| III. Test-First | PASS | Tests will be written before implementation |
| IV. Versioning | PASS | Semantic versioning applied |

## Project Structure

### Documentation (this feature)

```text
specs/003-workers-to-serviceworkers/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── sw-api.md        # Service Worker API contract
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code

```text
packages/cloud/src/
├── index.ts                    # Main export
├── core/
│   ├── engine.ts               # ImageEngine (refactored, no Web Workers)
│   ├── cache.ts                # ImageCache (unchanged)
│   ├── types.ts                # Types (WorkerMessage removed)
│   └── ... (other core files)
├── adapters/                   # Platform adapters (unchanged)
├── react/                      # React components (unchanged)
└── service-worker/              # NEW: Service Worker implementation
    ├── index.ts                # Registration, main thread API
    ├── sw.ts                   # Service Worker script (install, fetch, activate)
    ├── cache-manager.ts        # LRU cache with eviction
    ├── network.ts              # RTT measurement, bandwidth
    ├── decoder.ts              # Image decoding
    └── messages.ts             # Message protocol

packages/cloud/src/worker/       # DELETE ENTIRE DIRECTORY
```

### Tests

```text
packages/cloud/tests/
├── unit/
│   ├── worker-message.test.ts   # DELETE
│   ├── worker-throughput.test.ts # DELETE
│   └── ... (other tests)
└── ... (other test dirs)
```

## Files to Delete

| File | Reason |
|------|--------|
| `packages/cloud/src/worker/` | All Web Worker code |
| `packages/cloud/tests/unit/worker-message.test.ts` | Web Worker test |
| `packages/cloud/tests/unit/worker-throughput.test.ts` | Web Worker test |

## Implementation Phases

### Phase 1: Core Service Worker

1. Create `service-worker/` directory structure
2. Implement `sw.ts` - Service Worker lifecycle (install, activate, fetch)
3. Implement `messages.ts` - Message protocol types
4. Implement `cache-manager.ts` - LRU cache with eviction
5. Implement `network.ts` - RTT measurement
6. Implement `decoder.ts` - Image decoding utilities
7. Implement `index.ts` - Registration and main thread API

### Phase 2: Engine Refactor

1. Remove embedded Worker code from `engine.ts`
2. Update `engine.ts` to use Service Worker communication
3. Update `types.ts` - remove WorkerMessage/WorkerResponse
4. Add Service Worker fallback for unsupported browsers

### Phase 3: Testing

1. Write unit tests for new Service Worker components
2. Write integration tests for main thread ↔ SW communication
3. Delete old Web Worker tests
4. Update existing tests affected by type changes

### Phase 4: Integration

1. Update main library exports
2. Update React components if needed
3. Add Service Worker registration
4. Verify offline functionality

## Open Questions (Phase 0)

None - all clarifications resolved via user input.

## Complexity Tracking

> Not applicable - no constitution violations.
