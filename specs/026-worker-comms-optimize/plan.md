# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Optimize communication between Web Worker and main thread by:
1. Using Transferable objects for zero-copy ImageBitmap transfers
2. Compressing image metadata before transfer
3. Batching multiple image responses into single messages

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)  
**Primary Dependencies**: Existing - Worker, ImageBitmap API, IndexedDB (idb), Jotai  
**Storage**: IndexedDB (idb) for image cache  
**Testing**: Vitest (unit), Playwright (integration)  
**Target Platform**: Browser (Web Worker + Main Thread)  
**Project Type**: Library  
**Performance Goals**: <100ms latency, 60fps, 60% transfer reduction  
**Constraints**: Must maintain image quality  
**Scale/Scope**: 50+ cached images

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| Library-First | PASS | Existing library optimization, no new library needed |
| Observability | PASS | DevTools already exists, will add transfer size metrics |
| Test-First | PASS | Tests must precede implementation |
| Versioning | PASS | Internal optimization, no breaking changes |

### Code Quality Gates

- [ ] Lint passes
- [ ] All unit tests pass (100%)
- [ ] Integration tests pass
- [ ] No new dependencies

## Project Structure

### Documentation (this feature)

```text
specs/026-worker-comms-optimize/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
packages/cloud/src/
├── core/types.ts         # Modify: WorkerMessage, WorkerResponse (add compression)
├── service-worker/
│   └── sw.ts         # Modify: Add compression, batching logic
└── worker/           # New: Optional dedicated worker module

tests/unit/
└── worker-comms.test.ts  # New: Transfer optimization tests
```

## Complexity Tracking

> Not needed - internal optimization within existing library
