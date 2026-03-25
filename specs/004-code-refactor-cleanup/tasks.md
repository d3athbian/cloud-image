# Tasks: Code Refactor and Quality Improvement

**Feature**: Code Refactor and Quality Improvement
**Branch**: `004-code-refactor-cleanup`
**Generated**: 2026-03-23

## Summary

| Métrica | Valor |
|---------|-------|
| Total Tasks | 19 |
| User Stories | 4 |
| Parallelizable | 10 |

## Task Count per User Story

| User Story | Tasks | Phase |
|------------|-------|-------|
| US1: Eliminate Code Duplication | 3 | Phase 3 |
| US2: Inline Script Works | 2 | Phase 4 |
| US3: Clean Up Unused Code | 6 | Phase 5 |
| US4: Reduce Module Coupling | 3 | Phase 6 |

## Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3-6 (User Stories, any order)
```

All user stories can be executed in parallel after foundational phase.

---

## Phase 1: Setup

- [X] T001 Verify TypeScript config has noUnusedLocals and noUnusedParameters enabled in packages/cloud/tsconfig.json

---

## Phase 2: Foundational

- [X] T002 Run initial `npx tsc --noEmit` to capture baseline of current warnings in packages/cloud

---

## Phase 3: User Story 1 - Eliminate Code Duplication (P1)

**Goal**: Remove duplicated logic between service-worker/ and core/

**Independent Test**: Run code analysis to verify no duplicate functions

### Tasks

- [X] T003 [P] [US1] Remove duplicate generateMessageId and createSWRequest from service-worker/sw.ts (keep in index.ts only)
- [X] T004 [P] [US1] Import and use RetryHandler from core/retry.ts in service-worker/sw.ts instead of local fetchWithRetry
- [X] T005 [US1] Verify no cache logic duplication between service-worker/sw.ts and core/cache.ts

---

## Phase 4: User Story 2 - Inline Script Registration (P1)

**Goal**: Ensure inline script WORKS (not removed - it's the default registration method)

**Independent Test**: Page loads, inline script executes, console shows "registered via inline"

### Tasks

- [X] T006 [P] [US2] Verify CloudProvider in packages/cloud/src/react/hooks.tsx STILL has inline script (PRESERVE, not remove)
- [X] T007 [US2] Verify register.js works as CSP fallback by loading demo and checking console

---

## Phase 5: User Story 3 - Clean Up Unused Code (P2)

**Goal**: Remove all unused imports and variables

**Independent Test**: `npx tsc --noEmit` shows zero unused variable warnings

### Tasks

- [X] T008 [P] [US3] Fix unused variables in adapters/ (memory.ts line 8, tizen.ts lines 79,83, webos.ts lines 58,60,64)
- [X] T009 [P] [US3] Fix unused variables in core/ (cache.ts lines 22,197, cdn-adapter.ts lines 92,135, circuit-breaker.ts line 116, logger.ts line 63, offline.ts line 1, silent-upgrade.ts lines 1,2,95)
- [X] T010 [P] [US3] Fix unused variables in react/ (hooks.tsx lines 6,7, image.tsx line 57, provider.tsx lines 1,3,4,5,53)
- [X] T011 [P] [US3] Fix unused variables in service-worker/sw.ts (lines 73,130)
- [X] T012 [US3] Run `npx tsc --noEmit` to verify all unused variable warnings are resolved
- [X] T013 [US3] Run build to verify no regressions: `cd packages/cloud && npm run build`

---

## Phase 6: User Story 4 - Reduce Module Coupling (P2)

**Goal**: Verify no circular dependencies

**Independent Test**: Analyze dependency graph shows reasonable module boundaries

### Tasks

- [X] T014 [P] [US4] Verify service-worker module does NOT depend on React-specific code
- [X] T015 [P] [US4] Verify adapter pattern is preserved - adapters/web.ts, adapters/tizen.ts, adapters/webos.ts, adapters/memory.ts remain unchanged
- [X] T016 [US4] Verify no circular imports between core/ modules

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T017 Run full test suite to verify refactor did not break functionality: `cd packages/cloud && npm test`
- [X] T018 Verify code coverage is above 80%: `cd packages/cloud && npm run test:coverage`
- [X] T019 Update CHANGELOG if any breaking changes (should be none)

---

## Parallel Execution Examples

### User Story 1 (T003-T005)
```bash
# These can run in parallel (different files):
T003: Remove duplicate from sw.ts
T004: Import RetryHandler from core
```

### User Story 3 (T008-T011)
```bash
# These can run in parallel (different files):
T008: Fix adapters/
T009: Fix core/
T010: Fix react/
T011: Fix service-worker/
```

---

## Implementation Strategy

**MVP Scope**: User Stories 1 + 2 (Phase 3 + 4)
- These are the highest priority (P1)
- After completing Phase 4, the inline script issue is resolved

**Incremental Delivery**:
1. Complete Phase 3 (code deduplication)
2. Complete Phase 4 (inline script removal)
3. Complete Phase 5 (cleanup unused code)
4. Complete Phase 6 (verify coupling)
5. Polish (Phase 7)
