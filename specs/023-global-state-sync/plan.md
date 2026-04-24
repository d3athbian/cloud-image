# Implementation Plan: Global State Synchronization

**Branch**: `023-global-state-sync` | **Date**: 2026-04-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/023-global-state-sync/spec.md`

## Summary

Create a StateSync mechanism that provides single-source-of-truth for global state. Intercepts all writes to Jotai atoms and synchronizes immediately to IndexedDB (via idb). Uses derived atoms with write callbacks that trigger persistence. Implements offline queue for failed writes.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)  
**Primary Dependencies**: jotai (existing), idb (existing) - no new deps  
**Storage**: IndexedDB (existing via idb)  
**Testing**: Vitest  
**Target Platform**: Browser  
**Project Type**: Library  
**Performance Goals**: < 100ms sync latency  
**Constraints**: Must handle offline mode, must not block UI  
**Scale/Scope**: 3 atoms (cache, network, memory)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Library-first (no unnecessary deps) | ✅ PASS | Uses existing deps only |
| TypeScript 5.x strict | ✅ PASS | Uses existing config |
| Test-first | ⚠️ TO VERIFY | Tests must precede implementation |
| Observability | ✅ PASS | Centralized sync logging |
| Code quality gates | ⚠️ TO_VERIFY | After implementation |

## Project Structure

### Documentation (this feature)

```
specs/023-global-state-sync/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md            # Phase 2 output
```

### Source Code (repository root)

```
packages/cloud/src/
├── core/
│   └── state-sync.ts    # NEW - StateSync mechanism
├── adapters/
│   └── web.ts          # MODIFY - Add state persistence

# Existing to integrate:
packages/cloud/src/core/system-atoms.ts   # Jotai atoms
packages/cloud/src/adapters/web.ts         # IndexedDB via idb
```

**Structure Decision**: StateSync wraps existing atoms, maintains current adapter pattern

## Phase 0: Research

### Technical Context

Existing codebase has:
- Jotai atoms in `system-atoms.ts`: cacheAtom, networkAtom, memoryAtom
- setXxxAtom write atoms with read-write pattern
- idb (IndexedDB wrapper) used in web adapter
- IndexedDB operations in service-worker/sw.ts

### Decisions

1. **Derived Atom Pattern**: Extend setXxxAtom to also write to IndexedDB in the set callback
2. **State Storage**: Use separate IndexedDB object store for "state" (not cache images)
3. **Startup Load**: On init, load persisted state and hydrate atoms
4. **Offline Queue**: Queue failed writes in memory, retry on reconnect

### Research Complete

No NEEDS CLARIFICATION markers - all requirements clear with existing technology.

## Phase 1: Design

### Entities

1. **StateSync**: Wrapper that provides syncState(key, value) function
   - write(key, value) - updates atom + persists
   - read(key) - reads current value
   - flush() - force sync all pending

2. **StateStore**: IndexedDB store for state
   - key: string (cache, network, memory)
   - value: object with timestamp

3. **OfflineQueue**: Memory queue for pending syncs
   - entries: Array<{key, value, timestamp}>
   - retry() - flush queue when online

### Interface Contracts

Internal API for modules:

```typescript
// Provider uses this to write state
syncState('cache', { totalItems: 10, hitCount: 5, ... });
syncState('network', { status: 'ONLINE', rtt: 50, ... });
```

No external API changes - modules use setXxxAtom as before.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | - | - |

## Next Steps

- Phase 2: Write `tasks.md` with task breakdown
- Implement `state-sync.ts` with test-first approach
- Refactor `system-atoms.ts` to use sync
