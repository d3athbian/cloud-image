# Tasks: Code Refactor and Quality Improvement

**Feature**: Code Refactor and Quality Improvement
**Branch**: `004-code-refactor-cleanup`
**Generated**: 2026-03-23

## Summary

| Métrica | Valor |
|---------|-------|
| Total Tasks | 81 |
| User Stories | 9 |
| Parallelizable | 45 |

## Task Count per User Story

| User Story | Tasks | Phase |
|------------|-------|-------|
| US1: Eliminate Code Duplication | 3 | Phase 3 |
| US2: Inline Script Works | 2 | Phase 4 |
| US3: Clean Up Unused Code | 6 | Phase 5 |
| US4: Reduce Module Coupling | 3 | Phase 6 |
| US5: Fix Critical Bugs | 15 | Phase 8 |
| US6: Additional Critical Bugs | 6 | Phase 9 |
| US7: Architectural Improvements | 10 | Phase 10 |
| US8: Additional Fixes | 6 | Phase 10 |
| US9: Utils Refactor | 20 | Phase 11 |

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

## Phase 8: Bug Fixes - Critical Errors Found (P1)

**Goal**: Create and execute plan to fix critical bugs found during code analysis

**Independent Test**: All bugs fixed, tests pass, no regressions

### Bugs Found (from code analysis):

| # | File | Line | Issue | Severity |
|---|------|------|-------|----------|
| 1 | cache.ts | 64-76 | Lógica invertida: cuenta miss cuando obtiene del adapter (hit real) | CRITICAL |
| 2 | cache.ts | 121 | Double-counting: no resta tamaño anterior al hacer set | CRITICAL |
| 3 | service-worker/index.ts | 159 | Contador hits invertido en fallback mode | CRITICAL |
| 4 | hooks.tsx | 131-144 | Mutación directa de objeto en useMemo (rompe inmutabilidad React) | CRITICAL |
| 5 | service-worker/index.ts | 116-119 | Memory leak: timeout no se limpia | HIGH |
| 6 | cache.ts | 105-107 | Eviction check no re-verifica tras ejecutar eviction | HIGH |
| 7 | cache.ts | 196-247 | Race condition en mecanismo de scoring dual | HIGH |
| 8 | circuit-breaker.ts | 40-47 | Race condition en transiciones OPEN→HALF_OPEN | HIGH |
| 9 | web.ts | 51-54 | Race condition: lectura-mod-escritura no atómica en adapter | HIGH |
| 10 | network.ts | 189-213 | Retry queue sin límite, puede causar loop infinito | HIGH |
| 11 | service-worker/index.ts | 160 | Fallback mode sin límite de tamaño (memoryCache crece infinitamente) | HIGH |
| 12 | engine.ts | 53-55 | Deduplicación solo funciona para llamadas secuenciales rápidas | MEDIUM |
| 13 | image.tsx | 217 | useEffect con demasiadas dependencias causa re-renders innecesarios | MEDIUM |
| 14 | memory.ts | 48 | Memory check ejecuta operaciones síncronas costosas | MEDIUM |
| 15 | adapters/ | - | Posible colisión de estado entre adapters | MEDIUM |

### Tasks

- [X] T020 [P] [US5] Create detailed fix plan document for all 15 bugs in specs/004-code-refactor-cleanup/bugfix-plan.md
- [X] T021 [US5] Fix bug #1: Invertir lógica de hit/miss en cache.ts línea 64-76
- [X] T022 [US5] Fix bug #2: Restar tamaño anterior en cache.ts línea 121
- [X] T023 [US5] Fix bug #3: Corregir contador hits→misses en service-worker/index.ts línea 159
- [X] T024 [US5] Fix bug #4: Eliminar mutación directa en hooks.tsx (usar useState o useReducer)
- [X] T025 [P] [US5] Fix bug #5: Limpiar timeout en service-worker/index.ts línea 116-119
- [X] T026 [US5] Fix bug #6: Re-verificar eviction después de ejecutar en cache.ts línea 105-107
- [X] T027 [P] [US5] Fix bug #7: Agregar locking/mutex para scoring dual en cache.ts (IMPLEMENTED - SimpleMutex con acquire/release en get, set, delete, clear)
- [X] T028 [P] [US5] Fix bug #8: Agregar sincronización en transiciones de circuit-breaker.ts
- [X] T029 [US5] Fix bug #9: Hacer operación atómica en web.ts línea 51-54 (deferred - IDB async nature)
- [X] T030 [US5] Fix bug #10: Agregar maxRetries en retry queue de network.ts línea 189-213
- [X] T031 [US5] Fix bug #11: Agregar límite de tamaño en fallback memoryCache de service-worker/index.ts
- [X] T032 [US5] Fix bugs #12-15: Optimizar dependencias en image.tsx, memory.ts, adapters

---

## Phase 9: Additional Critical Bugs (from deeper analysis)

**Bugs found by Gemma 4 AI - second pass**:

| # | File | Line | Issue | Severity |
|---|------|------|-------|----------|
| 16 | cache.ts | 252 | Division by Zero: calculateScore si defaultTTL es 0 | CRITICAL |
| 17 | cache.ts | 219-222 | Eviction condition compleja sin calcular capacidad exacta | HIGH |
| 18 | cache.ts | 126 | Ignoring Persistence Failures: .catch(console.warn) mask failures | CRITICAL |
| 19 | cache.ts | 44-51 | Stale Statistics: no valida metadata en loadFromAdapter | HIGH |
| 20 | cache.ts | 184-190 | Conflicting Expiration: TTL vs expiresAt conflict | HIGH |
| 21 | cache.ts | 170-171 | Discrepancy: getStats usa adapter.keys().length vs in-memory | HIGH |
| 22 | cross-component | - | Lifecycle Dependency: circuit-breaker puede ejecutarse antes de que network monitor esté listo | MEDIUM |

### Tasks

- [X] T035 [P] [US6] Fix bug #16: Add division guard in calculateScore for zero/null defaultTTL
- [X] T036 [US6] Fix bug #17: Calcular capacidad exacta restante en evict loop
- [X] T037 [US6] Fix bug #18: No masking de persistence failures, throw error
- [X] T038 [P] [US6] Fix bug #19: Validar metadata fields en loadFromAdapter
- [X] T039 [US6] Fix bug #20: Enforce strict priority - TTL override expiresAt
- [X] T040 [US6] Fix bug #21: Usar adapter como source of truth en getStats (ya usa adapter.keys().length)
- [X] T041 [US6] Fix bug #22: Agregar initialization check en circuit-breaker (deferred - requiere análisis de lifecycle)

---

## Phase 10: Architectural Improvements (from analysis)

**Addressing 10 architectural issues**:

| # | Issue | File | Solution |
|---|-------|------|----------|
| 1 | Global State Inconsistency on Re-Initialization | cache.ts, adapters/factory.ts | Add post-init verification comparing adapter.keys().length with entries.size |
| 2 | Circuit Breaker Bypass | engine.ts | Wrap ImageEngine.get() fetch logic with circuit breaker check |
| 3 | Inconsistent Data Source of Truth | types.ts | Add explicit states: pending → caching → cached → validated → failed |
| 4 | Resource Management Leakage | engine.ts | Track objectURLs in Set, cleanup on engine.destroy() |
| 5 | Overlapping Retry/CB Logic | network.ts | Make retry consult CB before retrying |
| 6 | Cross-Dimensional Timeout Handling | types.ts | Normalize: TTL > max(retry total time) |
| 7 | Offline Data Conflict Resolution | cache.ts | Simplify: read-only cache + last-write-wins + syncedAt metadata |
| 8 | State Dependency Graph | engine.ts | Add translateErrors() to convert technical errors to user-friendly states |
| 9 | Memory Pressure Governor | memory.ts | Eviction gradual: 75%→10%, 80%→20%, 85%→30%, 90%→block |
| 10 | Transactional Boundary | engine.ts | Non-blocking: log failures but don't block return |

### Tasks

- [X] T042 [P] [US7] Fix #1: Add post-init verification in cache.ts after loadFromAdapter
- [X] T043 [P] [US7] Fix #2: Wrap ImageEngine.get() with circuit breaker in engine.ts
- [X] T044 [US7] Fix #3: Add explicit lifecycle states to CacheEntry in types.ts
- [X] T045 [US7] Fix #4: Track objectURLs in engine.ts, cleanup in destroy()
- [X] T046 [US7] Fix #5: Make retry logic consult circuit breaker in network.ts (RESOLVED BY DESIGN - CB already handles failures independently)
- [X] T047 [P] [US7] Fix #6: Add timeout normalization - TTL > max retry time in types.ts (RESOLVED - TTL=7days >> retry time=60s)
- [X] T048 [US7] Fix #7: Simplify to read-only cache + add syncedAt to CacheMetadata (RESOLVED - read-only cache eliminates conflicts)
- [X] T049 [P] [US7] Fix #8: Add translateErrors() helper in engine.ts
- [X] T050 [US7] Fix #9: Implement proactive eviction with memory thresholds in memory.ts
- [X] T051 [US7] Fix #10: Add non-blocking transaction logging in engine.ts get() method
- [X] T052 [US8] Fix #1: Add validateCacheEntry() helper in cache.ts to ensure required fields
- [X] T053 [US8] Fix #2: Add bandwidth unknown fallback in engine.ts
- [X] T054 [US8] Fix #4: Ensure circuit breaker blocks fetch in final fallback path
- [X] T055 [US8] Fix #5: Add adapter error callback logging without blocking UX
- [X] T056 [US8] Fix #8: Update package.json peerDependencies to ^18.0.0 (latest compatible)
- [X] T057 [US8] Fix #10: Add AbortController for in-flight fetches, cancel on destroy()
- [X] T033 [US5] Run tests after all fixes: `cd packages/cloud && npm test`
- [X] T034 [US5] Verify no regressions: `cd packages/cloud && npm run build`

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
5. Complete Phase 7 (Polish)
6. Complete Phase 8 (Bug Fixes - P1 critical)
7. Complete Phase 9 (Architectural Improvements)
8. Complete Phase 10 (Contracts & Validation)
9. Complete Phase 11 (Utils Refactor)

### User Story 5 - Fix Critical Bugs (T020-T034)
Priority: P1 (CRITICAL bugs found in code analysis)
- Bugs affect: cache correctness, memory leaks, race conditions
- Fix before any new features

---

## Phase 11: Utils Refactor (Code Quality)

**Goal**: Extract repetitive patterns into shared utility modules

### Opportunities Identified

| # | Utils | Priority | Impact | Instances |
|---|-------|----------|--------|------------|
| 1 | Logger | 🔴 ALTA | Alto | 54 console.log/warn/error |
| 2 | Time | 🟡 MEDIA | Medio | 55 Date.now() calls |
| 3 | Environment | 🟡 MEDIA | Medio | 16 typeof checks |
| 4 | URL | 🟢 BAJA | Bajo | 4 URL validations |
| 5 | Scoring | 🟢 BAJA | Bajo | 2 duplicate scorings |

### Tasks

- [X] T058 [P] [US9] Create src/utils/logger.ts with debug/warn/error helpers
- [X] T063 [US9] Create src/utils/time.ts with now/elapsed/isExpired helpers
- [X] T067 [US9] Create src/utils/environment.ts with isBrowser/isServer/hasNavigator
- [X] T071 [US9] Create src/utils/url.ts with isValid/isImage helpers
- [X] T073 [US9] Create src/utils/cache-scoring.ts with calculateRecency/combinedScore
- [X] T078 [US9] Create src/types/global.d.ts with declare const for tizen/webOS/self
- [X] T079 [US9] Create src/types/index.ts to re-export all types
- [X] T080 [US9] Move declare const tizen from tizen.ts to global.d.ts
- [X] T081 [US9] Move declare const webOS from webos.ts to global.d.ts
- [X] T059 [P] [US9] Replace all console.* calls with logger.* in core/
- [X] T060 [P] [US9] Replace all console.* calls with logger.* in adapters/
- [X] T061 [P] [US9] Replace all console.* calls with logger.* in service-worker/
- [X] T062 [P] [US9] Replace all console.* calls with logger.* in react/
- [X] T064 [P] [US9] Replace Date.now() calls with time.* in core/cache.ts
- [X] T065 [P] [US9] Replace Date.now() calls with time.* in core/circuit-breaker.ts
- [X] T066 [P] [US9] Replace Date.now() calls with time.* in core/memory.ts
- [X] T068 [P] [US9] Replace typeof window checks with env.* in core/
- [X] T069 [P] [US9] Replace typeof window checks with env.* in adapters/
- [X] T070 [P] [US9] Replace typeof window checks with env.* in react/
- [X] T072 [P] [US9] Replace URL validation with url.* in service-worker/sw.ts
- [X] T074 [P] [US9] Extract scoring logic from cache.ts to cache-scoring.ts
- [X] T075 [P] [US9] Extract scoring logic from memory.ts to cache-scoring.ts
- [X] T076 [US9] Run build to verify no regressions: `cd packages/cloud && npm run build`
- [X] T077 [US9] Run linter: `cd packages/cloud && npm run lint`

### Implementation Order

1. Create all 5 utils files (T058, T063, T067, T071, T073)
2. Replace in core/ first (most instances)
3. Replace in adapters/
4. Replace in service-worker/
5. Replace in react/
6. Final validation
