# Tasks: Demo UI Update & Library UI Tool

**Branch**: `024-demo-ui-tool` | **Feature**: Demo UI Update & Library UI Tool | **Date**: 2026-04-24

## Overview

| Metric | Value |
|--------|-------|
| Total Tasks | 12 |
| User Stories | 3 |
| Parallelizable | 6 |

---

## Phase 1: Setup

- [X] T001 Create debugger component directory structure in packages/cloud/src/debugger/
- [X] T002 Add debugger subpath export to package.json exports configuration

---

## Phase 2: Foundational

- [X] T003 Define DebuggerState interface types in packages/cloud/src/debugger/types.ts
- [X] T004 Define CacheEntry, NetworkRequest, PerformanceMetrics display types in packages/cloud/src/debugger/types.ts

---

## Phase 3: User Story 1 - Demo Interface Refresh (P1)

**Independent Test**: Open demo and verify DebuggerTool panel displays cache information correctly.

- [X] T005 [US1] Create useDebuggerState hook in packages/cloud/src/debugger/hooks/useDebuggerState.ts
- [X] T006 [US1] Create DebuggerPanel component in packages/cloud/src/debugger/DebuggerPanel.tsx
- [X] T007 [US1] Implement cache stats tab in DebuggerPanel.tsx
- [X] T008 [US1] Implement network tab in DebuggerPanel.tsx
- [X] T009 [US1] Implement performance tab in DebuggerPanel.tsx
- [X] T010 [US1] Create DebuggerTool floating toggle component in packages/cloud/src/debugger/DebuggerTool.tsx

---

## Phase 4: User Story 2 - Consuming Library UI Tool (P2)

**Independent Test**: Import DebuggerTool from library and render in minimal test app.

- [X] T011 [US2] Create index.ts barrel export in packages/cloud/src/debugger/index.ts
- [X] T012 [US2] Update main library index.ts to re-export debugger subpath

---

## Phase 5: User Story 3 - Demo-to-Library Consistency (P3)

**Independent Test**: Compare demo DebuggerTool behavior with library documentation.

- [X] T013 [P] [US3] Add CSS variables for dark mode theming in debugger styles
- [X] T014 [US3] Update demo to use DebuggerTool component from library

---

## Phase 6: Polish & Cross-Cutting

- [X] T015 Verify tree-shaking works when DebuggerTool is not imported
- [X] T016 Add SSR compatibility check for window/document existence

---

## Dependencies

```
Phase 1 (Setup)
    │
    ▼
Phase 2 (Foundational) ───────┐
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
    Phase 3 (US1)      Phase 4 (US2)     Phase 5 (US3)
          │                  │                  │
          ▼                  ▼                  ▼
    Complete US1         Complete US2      Complete US3
                             │
                             ▼
                      Phase 6 (Polish)
```

---

## Parallel Execution

| Parallel Group | Tasks | Reason |
|---------------|-------|--------|
| Group 1 | T003, T004 | Type definitions, no dependencies |
| Group 2 | T007, T008, T009 | Tab implementations, independent |

---

## MVP Scope

**Suggested MVP**: User Story 1 (T005-T010)
- Demo displays DebuggerTool with cache/network/performance tabs
- Floating toggle works

**Full Feature**: All user stories
- DebuggerTool exported from library
- Demo uses library component