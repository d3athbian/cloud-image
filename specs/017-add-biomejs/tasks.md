# Tasks: Agregar BiomeJS

**Feature**: BiomeJS para linting y formatting  
**Branch**: 017-add-biomejs  
**Generated**: 2026-04-22

## Phase 1: Setup

- [x] T001 Instalar @biomejs/biome como devDependency
- [x] T002 Configurar biome.json con reglas correctas
- [x] T003 Actualizar package.json scripts para usar biome

## Phase 2: Fix Errors

- [x] T004 Corregir errores de noNonNullAssertion en cdn-adapter.ts
- [x] T005 Corregir errores de useButtonType en ErrorBoundary.tsx
- [x] T006 Corregir errores de useIterableCallbackReturn en sw.ts
- [x] T010 Corregir noNonNullAssertion en web.ts, engine.ts, network.ts, silent-upgrade.ts, sync-queue.ts
- [x] T011 Corregir useIterableCallbackReturn en service-worker/sw.ts

## Phase 3: Verify

- [x] T007 Verificar lint pasa sin errores
- [x] T008 Verificar build funciona
- [x] T009 Verificar demo build
- [x] T010 Update changelog con BiomeJS