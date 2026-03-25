# Feature Specification: Code Refactor and Quality Improvement

**Feature Branch**: `004-code-refactor-cleanup`  
**Created**: 2026-03-23  
**Status**: Draft  
**Input**: "tenemos que implementar un refactor para mejorar lo que llevamos avanzado. Me preocupa que estemos ensuciando mucho el código y que estemos.acoplando malas prácticas"

## User Scenarios & Testing

### User Story 1 - Eliminate Code Duplication (Priority: P1)

As a developer, I want the codebase to have no duplicated logic between service-worker/ and core/ modules, so that maintenance is simpler and bugs don't exist in multiple places.

**Why this priority**: Duplicated code is a major source of bugs and makes refactoring risky.

**Independent Test**: Run code analysis tool to verify no duplicate functions exist between modules.

**Acceptance Scenarios**:

1. **Given** service-worker/index.ts contains cache logic, **When** analyzing core/cache.ts, **Then** duplicate logic should be refactored to single source
2. **Given** network retry logic exists in both modules, **When** comparing implementations, **Then** use unified implementation from core/

---

### User Story 2 - Inline Script Registration (Priority: P1)

As a developer, I want the Service Worker registration to work out-of-the-box via inline script, while providing a CSP-compatible fallback via external register.js script.

**Why this priority**: Default should work easily for most users, fallback for strict CSP.

**Independent Test**: Verify inline script executes on page load.

**Acceptance Scenarios**:

1. **Given** CloudProvider is imported, **When** application loads, **Then** inline script executes and registers SW
2. **Given** register.js is included as script tag, **When** CSP blocks inline, **Then** SW registers via fallback

---

### User Story 3 - Clean Up Unused Code (Priority: P2)

As a developer, I want unused imports and variables removed from the codebase, so that the code is easier to read and TypeScript compiler shows no warnings.

**Why this priority**: Unused code increases bundle size and creates confusion.

**Independent Test**: Run TypeScript compiler and verify no unused variable warnings.

**Acceptance Scenarios**:

1. **Given** TypeScript is configured with noUnusedLocals, **When** running tsc --noEmit, **Then** no warnings for unused variables
2. **Given** imports are analyzed, **When** checking for side effects, **Then** unused imports should be removed

---

### User Story 4 - Reduce Module Coupling (Priority: P2)

As a developer, I want modules to have clear interfaces and minimal dependencies, so that the codebase is maintainable and components can be replaced.

**Why this priority**: Tight coupling makes testing difficult and prevents reuse.

**Independent Test**: Analyze dependency graph to verify reasonable module boundaries.

**Acceptance Scenarios**:

1. **Given** service-worker module is imported, **When** checking dependencies, **Then** it should not depend on React-specific code
2. **Given** core modules are analyzed, **When** checking circular dependencies, **Then** no circular imports should exist

---

### Edge Cases

- What happens when refactoring breaks existing functionality? → All tests must pass after refactor
- How do we handle breaking changes? → Document any API changes in CHANGELOG
- What if the inline script removal breaks CSP-compatible fallback? → Ensure register.js handles both scenarios

## Requirements

### Functional Requirements

- **FR-001**: System MUST have no duplicated cache logic between service-worker/ and core/
- **FR-002**: System MUST use inline script for default SW registration (out-of-box experience)
- **FR-003**: System MUST provide external register.js for CSP-compatible fallback
- **FR-004**: System MUST have zero TypeScript unused variable warnings
- **FR-005**: System MUST have zero circular dependencies between modules
- **FR-006**: System MUST maintain backward compatibility for existing users
- **FR-007**: System MUST preserve CSP fallback mechanism (register.js manual inclusion)
- **FR-008**: System MUST keep adapter pattern modular (web, tizen, webos, memory)
- **FR-009**: System MUST reuse core/ retry logic in service-worker/ (currently duplicated)
- **FR-010**: System MUST use single IndexedDB name `cloud-image-cache` everywhere
- **FR-011**: System MUST implement unified fallback chain (SW → web adapter → memory)
- **FR-012**: System MUST handle IndexedDB errors gracefully with fallback to memory

### Identified Issues (Pre-Refactor Analysis)

#### Unused Variables (TS6133)
| File | Variable | Status |
|------|----------|--------|
| adapters/memory.ts | maxSize | To remove |
| adapters/tizen.ts | url (lines 79, 83) | To fix |
| adapters/webos.ts | url, entry | To fix |
| core/cache.ts | adapterInitPromise, incomingSize | To remove |
| core/cdn-adapter.ts | publicId, apiKey | To remove |
| core/circuit-breaker.ts | previousState | To remove |
| core/logger.ts | correlationId | To remove |
| core/offline.ts | NetworkMonitor | To remove |
| core/silent-upgrade.ts | BandwidthSample, CDNConfig, CDNVariant, entry | To remove |
| react/hooks.tsx | SW_REGISTRY_KEY, SW_PATH | PRESERVE - used by inline script |
| react/image.tsx | isTransitioning | To remove |
| react/provider.tsx | useCallback, NetworkMonitor, OfflineStrategy, createAdapter, offlineStrategy | To remove |
| service-worker/sw.ts | reject, event | To fix |

#### Code Duplication Identified
| Location | Duplicate Of | Issue |
|----------|--------------|-------|
| service-worker/index.ts | core/retry.ts | generateMessageId, createSWRequest duplicated |
| service-worker/sw.ts | core/cache.ts | IndexedDB logic duplicated (use web adapter instead) |
| service-worker/sw.ts | core/retry.ts | fetchWithRetry duplicated (use core/retry.ts) |

#### Pattern Analysis
| Pattern | Status | Notes |
|---------|--------|-------|
| Adapter Pattern | ✅ Good | web.ts, tizen.ts, webos.ts, memory.ts - keep modular |
| Service Worker | Needs refactor | sw.ts has duplicated logic from core/ |
| IndexedDB | Inconsistent | sw.ts uses raw IDB, web.ts uses idb library - unify |

### Key Entities

- **ServiceWorkerModule**: Handles SW registration and message passing
- **CacheModule**: Provides caching abstraction (single implementation)
- **RegisterScript**: External script for manual SW registration
- **CloudProvider**: React component for image rendering

## Success Criteria

### Measurable Outcomes

- **SC-001**: Zero code duplication between service-worker/ and core/ (verified via analysis)
- **SC-002**: Inline script executes correctly (verified via console)
- **SC-003**: TypeScript compilation shows zero unused variable warnings
- **SC-004**: All existing tests pass after refactoring
- **SC-005**: CSP fallback works via external register.js script
- **SC-006**: No circular dependencies detected in module graph

## Assumptions

- Service Worker functionality will continue to work after refactoring
- The library API remains backward compatible
- Users can continue using CloudProvider without changes
- CSP fallback mechanism is acceptable to users who need it

---

## UPDATE 2026-03-25: IndexedDB Fix Applied

### Problema Encontrado
- Service Worker usaba `carbon-image-cache`
- Web adapter usaba `cloud-image-cache`
- Imágenes no se encontrában entre sí

### Fix Aplicado
- Unificado a `cloud-image-cache` en service-worker/sw.ts y sw.js

---

## Oportunidades de Mejora Identificadas

### 1. Unified IndexedDB ✅ COMPLETADO
- DB_NAME ahora es `cloud-image-cache` en todos los lugares

### 2. Adapter Fallback Logic ✅ IMPLEMENTADO
- engine.ts ahora tiene fallback chain: SW → adapter → direct fetch
- El método get() ahora prueba SW primero, luego adapter, luego fetch directo
- Esto asegura que siempre haya una forma de obtener la imagen

### 3. Retry Logic Reuse (Priority: MEDIUM)
- service-worker/sw.ts tiene su propia función `fetchWithRetry`
- Podría reusar `core/retry.ts` RetryHandler
- Estado: Por hacer (no crítico, funciona bien)

### 4. Memory Adapter como Fallback Final ✅ FUNCIONANDO
- Cuando IndexedDB no está disponible, el factory usa memory adapter
- Ya integrado en el adapter factory

### 5. Error Handling para IndexedDB Failures ✅ MEJORADO
- El nuevo fallback chain maneja errores en cada nivel
- Si IndexedDB falla, usa memoria
- Si todo falla, hace fetch directo

---

## User Stories for Improvements

### User Story 5 - Unified Fallback Logic (Priority: P2)

As a developer, I want the caching system to automatically fall back to the next available storage method when the primary one fails, so that the application remains functional regardless of browser capabilities.

**Why this priority**: Improves resilience

**Acceptance Scenarios**:

1. **Given** Service Worker is not available, **When** image is requested, **Then** use web adapter IndexedDB
2. **Given** IndexedDB is not available, **When** image is requested, **Then** use memory adapter
3. **Given** All storage fails, **When** image is requested, **Then** fetch from network directly

---

### User Story 6 - Centralized Error Handling (Priority: P2)

As a developer, I want clear error handling when storage operations fail, so that I can debug issues and provide fallback behavior.

**Why this priority**: Better debuggability

**Acceptance Scenarios**:

1. **Given** IndexedDB is full, **When** saving image, **Then** evict old entries automatically
2. **Given** IndexedDB throws error, **When** operation fails, **Then** log error and use fallback
