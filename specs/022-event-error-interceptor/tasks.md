# TARKS.md - 022-event-error-interceptor

## Fases de Implementación

### Fase 1: Setup
- [X] T001 Create EventInterceptor class skeleton in packages/cloud/src/core/event-interceptor.ts
- [X] T002 [P] Add EventInterceptor exports in packages/cloud/src/core/index.ts

### Fase 2: Foundational
- [X] T003 Create unit tests for EventInterceptor in tests/unit/event-interceptor.test.ts

### Fase 3: User Story 1 - Centralized Error Logging (Priority: P1)
- [X] T004 [P] [US1] Implement on() method with try/catch wrapper in packages/cloud/src/core/event-interceptor.ts
- [X] T005 [P] [US1] Implement off() method for listener removal in packages/cloud/src/core/event-interceptor.ts
- [X] T006 [P] [US1] Implement async error handling (Promise rejection) in packages/cloud/src/core/event-interceptor.ts
- [X] T007 [US1] Add logger fallback on error in packages/cloud/src/core/event-interceptor.ts

### Fase 4: User Story 2 - Remove Try/Catch Duplication (Priority: P2)
- [X] T008 [P] [US2] Implement destroy() method for cleanup in packages/cloud/src/core/event-interceptor.ts

### Fase 5: User Story 3 - Error Context Preservation (Priority: P3)
- [X] T009 [P] [US3] Add full error context (module, listenerId, eventType, timestamp, stack) to error logging in packages/cloud/src/core/event-interceptor.ts

### Fase 6: Integration
- [X] T010 [P] Refactor NetworkMonitor in packages/cloud/src/core/network.ts to use EventInterceptor
- [X] T011 Add EventInterceptor logger in packages/cloud/src/utils/logger.ts

### Fase 7: Validación
- [X] T012 Run existing tests (TypeScript compiles)
- [X] T013 Run lint check (no warnings)

## Dependencias

- T002 → T001
- T003 → T001
- T004 → T001
- T005 → T001
- T006 → T004
- T007 → T004
- T008 → T005
- T009 → T007
- T010 → T009 (requires full interceptor implementation)
- T011 → T001
- T012 → Todas las anteriores
- T013 → T012

## Resumen de Cambios

| Archivo | Cambio |
|---------|--------|
| `packages/cloud/src/core/event-interceptor.ts` | NUEVO - Event Bus Interceptor |
| `packages/cloud/src/core/index.ts` | MODIFICAR - Export EventInterceptor |
| `tests/unit/event-interceptor.test.ts` | NUEVO - Unit tests |
| `packages/cloud/src/core/network.ts` | MODIFICAR - Use EventInterceptor |
| `packages/cloud/src/utils/logger.ts` | MODIFICAR - Add EventInterceptor logger |