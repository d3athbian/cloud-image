# Tasks: Bundle Tree-Shaking Implementation

**Feature**: Bundle Size Optimización y Tree-Shaking  
**Branch**: 016-bundle-tree-shaking  
**Generated**: 2026-04-22

## Phase 1: Setup

- [x] T001 Configurar script de verificación de bundle en package.json para analizar output

## Phase 2: Foundational

- [x] T002 Audit current entry points and identify all `export *` patterns in packages/cloud/src/index.ts
- [x] T003 Audit current entry points and identify all `export *` patterns in packages/cloud/src/core/index.ts
- [x] T004 Audit current entry points and identify all `export *` patterns in packages/cloud/src/adapters/index.ts

## Phase 3: User Story 1 - Puntos de Entrada (P1)

**Goal**: Habilitar tree-shaking en puntos de entrada mediante exportaciones nombradas

**Independent Test**: Consumidor puede importar función única sin código no utilizado

- [x] T005 Convertir `packages/cloud/src/core/index.ts` de `export *` a exportaciones nombradas explícitas
- [x] T006 Convertir `packages/cloud/src/index.ts` de `export *` a exportaciones nombradas explícitas
- [x] T007 Convertir `packages/cloud/src/react/index.ts` de `export *` a exportaciones nombradas (si aplica)
- [x] T008 Verificar tree-shaking con build de prueba

## Phase 4: User Story 2 - Carga Condicional de Adaptadores (P2)

**Goal**: Cada adaptador en chunk separado, cargado bajo demanda

**Independent Test**: Bundle solo incluye adaptador usado

- [x] T009 Modificar `packages/cloud/src/adapters/factory.ts` para usar imports dinámicos
- [x] T010 Convertir `packages/cloud/src/adapters/index.ts` a exports nombradas + factory pattern
- [x] T011 Agregar lazy loading en CloudProvider para adaptadores

## Phase 5: User Story 3 - Utilidades Índice Limpias (P3)

**Goal**: Índices con re-exportes explícitos, sin agregación

**Independent Test**: Verificar que índices no tienen `export *`

- [x] T012 Verificar `packages/cloud/src/utils/index.ts` (ya tiene named exports)
- [x] T013 Marcar funciones internas con `@internal` o prefijo `_` en paquetes internos

## Phase 6: Polish

- [x] T014 Run build y verificar tamaño de bundle
- [x] T015 Verificar que adaptadores no usados no están en bundle output
- [x] T016 Update changelog con breaking changes

## Dependencies

- User Story 1 debe completarse ANTES de User Story 2 (adaptadores necesitan exports limpiar)
- User Story 3 puede hacerse en paralelo después de foundational

## Parallel Opportunities

- T005, T006 pueden ejecutarse en paralelo (diferentes archivos)
- T009, T010 pueden ejecutarse en paralelo

## Implementation Strategy

**MVP (User Story 1)**:
1. Convert `src/core/index.ts` a named exports
2. Convert `src/index.ts` a named exports
3. Verificar tree-shaking funciona

**Entrega incremental**:
- Fase 3: Puntos de entrada optimizados
- Fase 4: Adaptadores lazy-loaded
- Fase 5: Limpieza final