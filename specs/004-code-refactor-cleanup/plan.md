# Implementation Plan: Code Refactor and Quality Improvement

**Branch**: `004-code-refactor-cleanup` | **Date**: 2026-03-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-code-refactor-cleanup/spec.md`

## Summary

Refactorizar código para eliminar variables sin usar, código duplicado entre service-worker/ y core/, y remover inline script injection del CloudProvider. Preservar el patrón adapter y mantener compatibilidad hacia atrás.

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: React 18+, idb (IndexedDB wrapper), vitest  
**Storage**: IndexedDB (via idb library in web adapter), in-memory for other platforms  
**Testing**: Vitest + Playwright for E2E  
**Target Platform**: Web (browser), React Native, Smart TVs (Tizen, webOS)  
**Project Type**: Library (npm package)  
**Performance Goals**: Zero TypeScript warnings, no code duplication  
**Constraints**: Mantener backward compatibility, preservar adapter pattern  
**Scale/Scope**: ~30 archivos en packages/cloud/src

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| No circular dependencies | ⚠️ Check needed | Verify después de refactor |
| Clean TypeScript | ❌ 27 unused variables | Remediar en Phase 3 |
| No duplicated code | ❌ Duplicación identificada | Unificar en Phase 3 |
| CSP-compatible | ✅ register.js ready | External script approach |

## Project Structure

### Documentation (this feature)

```text
specs/004-code-refactor-cleanup/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── checklists/          # Validation checklists
│   └── requirements.md
└── tasks.md             # Phase 2 output
```

### Source Code

```text
packages/cloud/
├── src/
│   ├── core/                    # Framework-agnostic (PRESERVE)
│   │   ├── cache.ts
│   │   ├── retry.ts             # Unused in SW - REUSE
│   │   ├── circuit-breaker.ts
│   │   ├── network.ts
│   │   └── ...
│   ├── adapters/                # Platform adapters (PRESERVE - modular)
│   │   ├── web.ts               # Uses idb library
│   │   ├── tizen.ts
│   │   ├── webos.ts
│   │   └── memory.ts
│   ├── react/                   # React components
│   │   ├── hooks.tsx            # Remove inline script
│   │   ├── provider.tsx
│   │   └── image.tsx
│   └── service-worker/
│       ├── sw.ts                # Has duplicated logic
│       ├── index.ts             # Has duplicated logic
│       ├── register.ts/js       # External registration (GOOD)
│       └── (keep modular)
├── dist/                       # Build output
└── tests/                      # Unit tests
```

**Structure Decision**: Single library package with modular adapters - no changes needed to structure

## Pre-Refactor Analysis

### Unused Variables (27 issues) - Phase 3

| File | Line | Variable |
|------|------|----------|
| adapters/memory.ts | 8 | maxSize |
| adapters/tizen.ts | 79, 83 | url |
| adapters/webos.ts | 58, 60, 64 | url, entry |
| core/cache.ts | 22, 197 | adapterInitPromise, incomingSize |
| core/cdn-adapter.ts | 92, 135 | publicId, apiKey |
| core/circuit-breaker.ts | 116 | previousState |
| core/logger.ts | 63 | correlationId |
| core/offline.ts | 1 | NetworkMonitor |
| core/silent-upgrade.ts | 1, 2, 95 | BandwidthSample, CDNConfig, CDNVariant, entry |
| react/hooks.tsx | 6, 7 | SW_REGISTRY_KEY, SW_PATH |
| react/image.tsx | 57 | isTransitioning |
| react/provider.tsx | 1, 3, 4, 5, 53 | useCallback, NetworkMonitor, OfflineStrategy, createAdapter, offlineStrategy |
| service-worker/sw.ts | 73, 130 | reject, event |

### Code Duplication - Phase 3

| Location | Duplicate Of | Solution |
|----------|--------------|----------|
| service-worker/index.ts | core/retry.ts | Remove duplicate generateMessageId/createSWRequest |
| service-worker/sw.ts | core/cache.ts | Keep SW's raw IDB (different use case) or use web adapter |
| service-worker/sw.ts | core/retry.ts | Import and use RetryHandler |

## Complexity Tracking

No se anticipan violaciones a la Constitución. El refactor es limpieza, no nuevas features.

## Phase 0: Research

El análisis ya está completo. No se requiere Phase 0 adicional.

## Phase 1: Design

### Entities (from spec)

1. **ServiceWorkerModule**: SW registration - NO changes needed (register.js already external)
2. **CacheModule**: Single implementation in core/ - reuse in SW
3. **RegisterScript**: Already external - keep as-is
4. **CloudProvider**: React component - remove inline script

### Contracts

- Library exports: `.`, `./react`, `./register` - NO changes
- Adapter interface: `PlatformAdapter` - PRESERVE unchanged

### Quickstart

El quickstart de la librería existente no necesita cambios.
