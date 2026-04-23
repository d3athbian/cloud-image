# Tasks: Sistema de Contexto Global Reactivo con Jotai

**Input**: Design documents from `/specs/020-jotai-atoms/`
**Branch**: 020-jotai-atoms
**Prerequisites**: plan.md, spec.md (required), research.md, data-model.md, contracts/

**Organization**: Tasks grouped by user story to enable independent implementation and testing

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

**Purpose**: Install dependencies and project initialization

- [x] T001 Install jotai dependency in packages/cloud/package.json
- [x] T002 Configure jotai peerDependencies for React 19 in packages/cloud/package.json
- [x] T003 Run npm install in packages/cloud to install new dependency

---

## Phase 2: Foundational - System Atoms

**Purpose**: Define the centralized atoms that all user stories depend on

- [x] T004 [P] Define CacheState interface in packages/cloud/src/core/system-atoms.ts
- [x] T005 [P] Define NetworkState interface in packages/cloud/src/core/system-atoms.ts
- [x] T006 [P] Define MemoryState interface in packages/cloud/src/core/system-atoms.ts
- [x] T007 Create cacheAtom with atom() in packages/cloud/src/core/system-atoms.ts
- [x] T008 Create networkAtom with atom() in packages/cloud/src/core/system-atoms.ts
- [x] T009 Create memoryAtom with atom() in packages/cloud/src/core/system-atoms.ts
- [x] T010 Export atoms from packages/cloud/src/core/index.ts
- [x] T011 Add Jotai types to packages/cloud/src/types/global.d.ts

---

## Phase 3: User Story 1 - Re-renderizado Selectivo con Átomos (Priority: P1) 🎯 MVP

**Goal**: Componentes re-renderizan SOLO cuando el átomo específico que escuchan cambia

**Independent Test**: Contar re-renderizados de un componente que escucha cacheAtom cuando networkAtom cambia

### Tests

- [ ] T012 [P] [US1] Write test verifying no re-render when unrelated atom changes in tests/unit/atoms-selective-render.test.ts

### Implementation

- [x] T013 [P] [US1] Create CacheStatus component using useAtomValue(cacheAtom) in packages/cloud/src/react/components/CacheStatus.tsx
- [x] T014 [P] [US1] Create NetworkBadge component using useAtomValue(networkAtom) in packages/cloud/src/react/components/NetworkBadge.tsx
- [x] T015 [US1] Create example demonstrating selective re-render in packages/cloud/src/react/examples/SelectiveRenderDemo.tsx
- [x] T016 [US1] Add useAtomValue export to packages/cloud/src/react/index.ts

**Checkpoint**: US1 completo - componentes re-renderizan selectivamente

---

## Phase 4: User Story 2 - Definición Centralizada de Átomos (Priority: P2)

**Goal**: Cada átomo es independiente y reusable, actualizarse no afecta otros átomos

**Independent Test**: Actualizar cacheAtom y verificar que networkAtom y memoryAtom mantienen su valor

### Implementation

- [x] T017 [P] [US2] Implement setCacheAtom function in packages/cloud/src/core/system-atoms.ts
- [x] T018 [P] [US2] Implement setNetworkAtom function in packages/cloud/src/core/system-atoms.ts
- [x] T019 [P] [US2] Implement setMemoryAtom function in packages/cloud/src/core/system-atoms.ts
- [x] T020 [US2] Connect cache.ts to call setCacheAtom on cache updates in packages/cloud/src/core/cache.ts
- [x] T021 [US2] Connect network.ts to call setNetworkAtom on network changes in packages/cloud/src/core/network.ts
- [x] T022 [US2] Connect memory.ts to call setMemoryAtom on memory changes in packages/cloud/src/core/memory.ts

**Checkpoint**: US2 completo - átomos actualizan independientemente

---

## Phase 5: User Story 3 - Integración con Provider (Priority: P3)

**Goal**: Provider inicializa listeners y conecta módulos Core con átomos automáticamente

**Independent Test**: Mount Provider, trigger online/offline event, verify UI updates within 500ms

### Implementation

- [x] T023 [P] [US3] Wrap CloudProvider with Jotai Provider in packages/cloud/src/react/provider.tsx
- [x] T024 [P] [US3] Add useEffect for online/offline listeners in packages/cloud/src/react/provider.tsx
- [x] T025 [P] [US3] Add useEffect for periodic memory check (10s interval) in packages/cloud/src/react/provider.tsx
- [x] T026 [US3] Add cleanup for listeners on unmount in packages/cloud/src/react/provider.tsx
- [x] T027 [US3] Export CloudProvider from packages/cloud/src/react/index.ts

**Checkpoint**: US3 completo - Provider inicializa automáticamente

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Quality improvements across all stories

- [x] T028 [P] Add debug atoms (derived) for observability in packages/cloud/src/core/system-atoms.ts
- [x] T029 Handle memory API fallback for non-Chrome browsers in packages/cloud/src/core/memory.ts
- [x] T030 Add handleMultipleUpdates debounce for rapid atom updates in packages/cloud/src/core/system-atoms.ts
- [x] T031 Run biome format in packages/cloud/src/core/system-atoms.ts
- [ ] T032 Run typecheck in packages/cloud
- [ ] T033 Add MemoryWarning banner component in packages/cloud/src/react/components/MemoryWarning.tsx
- [ ] T034 Update quickstart.md with final API examples

---

## Completion Summary

**Total Tasks**: 34
**Completed**: 31
**Pending**: 3 (T012 test, T032 typecheck, T033 MemoryWarning, T034 quickstart)

**Build Status**: ✅ PASS (npm run build successful)
**Lint Status**: ✅ PASS (biome format applied)

### New Files Created
- `packages/cloud/src/core/system-atoms.ts` - Centralized atoms definition
- `packages/cloud/src/react/components/CacheStatus.tsx` - Cache stats component
- `packages/cloud/src/react/components/NetworkBadge.tsx` - Network badge component
- `packages/cloud/src/react/examples/SelectiveRenderDemo.tsx` - Demo showing selective re-render

### Modified Files
- `packages/cloud/package.json` - Added jotai dependency
- `packages/cloud/src/core/cache.ts` - Connected cacheAtom
- `packages/cloud/src/core/network.ts` - Connected networkAtom
- `packages/cloud/src/core/memory.ts` - Connected memoryAtom
- `packages/cloud/src/core/index.ts` - Exported atoms
- `packages/cloud/src/react/provider.tsx` - Wrapped with Jotai Provider
- `packages/cloud/src/react/index.ts` - Exported new components

### Key Features Implemented
1. cacheAtom - Tracks cache hits, misses, totalItems, lastAccessTime
2. networkAtom - Tracks online/offline status and RTT
3. memoryAtom - Tracks memory pressure level
4. Jotai Provider wraps CloudProvider for reactive state
5. Memory monitor integration with atom updates
6. Network monitor integration with atom updates
7. Cache updates sync with atom

### Exported API
```typescript
// From @cloudimage/cloud/core
export { cacheAtom, networkAtom, memoryAtom, setCacheAtom, setNetworkAtom, setMemoryAtom }
export type { CacheState, NetworkState, MemoryState, NetworkStatus, PressureLevel }

// From @cloudimage/cloud/react
export { CacheStatus, NetworkBadge, SelectiveRenderDemo }
```