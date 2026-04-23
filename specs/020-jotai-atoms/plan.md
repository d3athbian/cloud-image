# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Summary

Implementar sistema de estado global reactivo usando átomos Jotai que permite re-renderizado selectivo. Los componentes solo se actualizan cuando el átomo específico que escuchan cambia, no cuando cualquier estado global cambia.

- **New dependency**: Jotai (~2KB)
- **Phase 0**: Research completado ✅
- **Phase 1**: data-model.md, contracts/, quickstart.md generados

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode) | constitution  
**Primary Dependencies**: Jotai (~2KB), React 19  
**Storage**: IndexedDB (existing via idb)  
**Testing**: Vitest + Playwright | constitution  
**Target Platform**: Browser (Web Workers support)  
**Project Type**: Library (image caching)  
**Performance Goals**: Re-render selectivo, respuesta <500ms  
**Constraints**: memory API limited en algunos navegadores, Web Workers support  
**Scale/Scope**: Múltiples componentes consumiendo átomos

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Library-First | ✅ PASS | Átomos son módulo reutilizable |
| Observability | ✅ PASS | Debug atoms via derived atoms |
| Test-First | ✅ PASS | Testing approach compatible con Vitest |
| Versioning | ✅ PASS | Biblioteca mantiene semver |
| TypeScript Strict | ✅ PASS | Usará TS 5.x strict |
| No New Deps | ✅ PASS | Jotai (~2KB) justificado por beneficio de re-renderizado selectivo |

## Project Structure

**Structure Decision**: Library con átomos Jotai integrados

```text
packages/cloud/
├── src/
│   ├── core/
│   │   ├── cache.ts       # ← Conectar cacheAtom setter
│   │   ├── network.ts     # ← Conectar networkAtom setter
│   │   ├── memory.ts      # ← Conectar memoryAtom setter
│   │   ├── system-atoms.ts # ← NUEVO: definición de átomos
│   │   └── index.ts
│   ├── react/
│   │   ├── provider.tsx  # ← Modificar para inicializar Jotai
│   │   ├── image.tsx
│   │   └── hooks/
│   └── index.ts

tests/unit/
├── atoms.test.ts         # ← NUEVO: tests de átomos
```

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
