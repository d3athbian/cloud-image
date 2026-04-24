# TARKS.md - 023-global-state-sync

## Fases de Implementación

### Fase 1: Setup
- [X] T001 Create StateSync class skeleton in packages/cloud/src/core/state-sync.ts
- [X] T002 [P] Add IndexedDB schema for state store in packages/cloud/src/core/state-sync.ts

### Fase 2: Foundational
- [X] T003 Create unit tests for StateSync in tests/unit/state-sync.test.ts

### Fase 3: User Story 1 - Single Source of Truth (Priority: P1)
- [X] T004 [P] [US1] Implement syncState() method in packages/cloud/src/core/state-sync.ts
- [X] T005 [P] [US1] Implement readState() method in packages/cloud/src/core/state-sync.ts
- [X] T006 [US1] Integrate sync with setCacheAtom write callback in packages/cloud/src/core/system-atoms.ts
- [X] T007 [US1] Integrate sync with setNetworkAtom write callback in packages/cloud/src/core/system-atoms.ts
- [X] T008 [US1] Integrate sync with setMemoryAtom write callback in packages/cloud/src/core/system-atoms.ts

### Fase 4: User Story 2 - Automatic Sync (Priority: P2)
- [X] T009 [P] [US2] Implement offline queue in packages/cloud/src/core/state-sync.ts
- [X] T010 [P] [US2] Implement flush() method in packages/cloud/src/core/state-sync.ts
- [X] T011 [US2] Add network online/offline listener for flush in packages/cloud/src/core/state-sync.ts

### Fase 5: User Story 3 - Conflict Resolution (Priority: P3)
- [X] T012 [P] [US3] Implement hydrate() method in packages/cloud/src/core/state-sync.ts
- [X] T013 [US3] Add startup hydration call in CloudProvider in packages/cloud/src/react/provider.tsx

### Fase 6: Validación
- [X] T014 Run existing tests (TypeScript compiles)
- [X] T015 Run lint check (no warnings)

## Dependencias

- T002 → T001
- T003 → T001
- T004 → T001
- T005 → T001
- T006 → T004, T005
- T007 → T004, T005
- T008 → T004, T005
- T009 → T004
- T010 → T009
- T011 → T010
- T012 → T004, T005
- T013 → T012
- T014 → Todas las anteriores
- T015 → T014

## Resumen de Cambios

| Archivo | Cambio |
|---------|--------|
| `packages/cloud/src/core/state-sync.ts` | NUEVO - StateSync mechanism |
| `packages/cloud/src/core/system-atoms.ts` | MODIFICAR - Integrate sync with atoms |
| `packages/cloud/src/react/provider.tsx` | MODIFICAR - Add hydration |
| `tests/unit/state-sync.test.ts` | NUEVO - Unit tests |