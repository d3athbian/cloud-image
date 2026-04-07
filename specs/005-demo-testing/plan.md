# Implementation Plan: Demo Testing Infrastructure

**Branch**: `005-demo-testing` | **Date**: 2026-04-06 | **Spec**: `/specs/005-demo-testing/spec.md`
**Input**: "Necesitamos crear un plan para poder probar utilizando la aplicación creada en demos. La idea es que este demo pueda recrear las condiciones para poder probar todos los casos de usos que me permitan no romper la aplicación. Debería poder recuperarse, mostrar y cachear correctamente las imágenes, si refresco la pantalla, etc. Estas pruebas por ahora solo serán orientadas a web con Chrome."

## Summary

Create a comprehensive demo application in `demos/cloud-demo/` that serves as a testing platform to verify all @cloudimage/cloud library functionality. The demo must exercise cache recovery, persistence across page refreshes, offline behavior, network resilience, and DevTools integration in Chrome.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)  
**Primary Dependencies**: React 18+, @cloudimage/cloud, Vite, Vitest, Playwright  
**Storage**: IndexedDB (via idb library), Service Worker cache  
**Testing**: Vitest (unit), Playwright (e2e), Chrome DevTools  
**Target Platform**: Web (Chrome browser only for this phase)  
**Project Type**: React application (demo) + TypeScript library  
**Performance Goals**: Cache hit rate visible in UI, images load progressively, DevTools show metrics  
**Constraints**: Chrome-only testing, DevTools integration required, must work offline  
**Scale/Scope**: Demo with 10-20 test images, multiple cache scenarios

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Based on `.specify/memory/constitution.md`:

| Gate | Status | Notes |
|------|--------|-------|
| Test-First (III) | ⚠️ PARTIAL | Demo tests are manual validation, not TDD |
| Demo & Testing | ✅ PASS | Feature specifically addresses demo testing |
| Technology Standards | ✅ PASS | TypeScript 5.x, Vitest, Playwright, Vite - all aligned |

**Justification for Test-First partial**: This feature is about creating manual testing infrastructure via a demo app. TDD applies to the library itself, not the demo validation UI.

## Project Structure

### Documentation (this feature)

```text
specs/005-demo-testing/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── spec.md              # Feature specification
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
demos/cloud-demo/           # Demo React application
├── src/
│   ├── App.tsx            # Main demo component
│   ├── main.tsx          # Entry point
│   └── components/        # Demo UI components
├── public/
│   ├── sw.js             # Service Worker
│   └── register.js       # SW registration fallback
├── index.html
├── vite.config.ts
└── package.json

packages/cloud/             # Library under test
├── src/
│   ├── core/             # Cache, retry, circuit-breaker
│   ├── adapters/         # Web, memory, tizen, webos
│   ├── react/            # CloudProvider, CloudImage
│   └── service-worker/   # SW implementation
└── tests/
    ├── unit/             # Unit tests (existing)
    └── e2e/              # E2E tests (existing)
```

**Structure Decision**: Demo app already exists at `demos/cloud-demo/`. Feature adds testing controls and scenarios to verify library behavior without breaking existing functionality.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Manual demo testing vs automated | Manual testing via demo is constitution requirement for verifying library behavior | Automated tests exist in packages/cloud/tests but don't cover user-facing scenarios |