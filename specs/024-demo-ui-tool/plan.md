# Implementation Plan: Demo UI Update & Library UI Tool

**Branch**: `024-demo-ui-tool` | **Date**: 2026-04-24 | **Spec**: specs/024-demo-ui-tool/spec.md
**Input**: Feature specification from `/speckit.specify`

## Summary

Create a floating DebuggerTool component (similar to React Query DevTools) that displays cache information, network metrics, and performance data. The component will be exported from the library with tree-shaking support, a visibility toggle prop, and dark mode styling.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)  
**Primary Dependencies**: React 19, Jotai (existing)  
**Storage**: IndexedDB (via idb - existing)  
**Testing**: Vitest, Playwright  
**Target Platform**: Web/Browser  
**Project Type**: library (React component library)  
**Performance Goals**: <50ms render time, <1KB bundle overhead when tree-shaken  
**Constraints**: Must be tree-shakeable, SSR-compatible (check for window/document)  
**Scale/Scope**: Single component, ~3 states (visible/hidden, expanded/collapsed, tabs)

## Constitution Check

| Gate | Requirement | Status |
|------|-------------|--------|
| Library-First | Feature as standalone library component | PASS |
| Tree-shakeable | Component must not increase bundle if unused | PASS |
| Observability | Exposes programmatic API | PASS |
| Test-First | Tests before implementation | GATE |
| Versioning | Semantic Versioning | PASS |

## Project Structure

### Documentation (this feature)

```text
specs/024-demo-ui-tool/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md         # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code

```text
packages/cloud/
├── src/
│   ├── debugger/           # New: DebuggerTool component
│   │   ├── DebuggerTool.tsx
│   │   ├── DebuggerPanel.tsx
│   │   ├── hooks/
│   │   │   └── useDebuggerState.ts
│   │   └── index.ts
│   └── index.ts           # Update: export DebuggerTool
```

**Structure Decision**: Add `DebuggerTool` under `packages/cloud/src/debugger/` to mirror existing React patterns (`react/`). Export via subpath `./debugger` for tree-shaking.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|---------------------------------------|
| Debugger state in Jotai | Requires state synchronization between demo and library | Would couple component to specific app |

---

# Phase 0: Research

## Research Questions

1. **Floating Panel Pattern**: How do React Query DevTools, Redux DevTools achieve their floating/dockable behavior?
2. **Tree-shaking best practices**: Ensure DebuggerTool exports don't increase bundle when unused
3. **Dark mode implementation**: CSS variables approach for theming (matching Next.js style)

## Findings

- Floating panel: React Query DevTools pattern - toggle button + collapsible panel (bottom-left default)
- Tree-shaking: Subpath export `./debugger` - Vite/Rollup tree-shaking when importing from subpath
- Dark mode: CSS variables in `:root` for theming, with SSR check for document existence

---

# Phase 1: Design & Contracts

## Findings

- Floating panel: React Query DevTools pattern (research.md)
- Tree-shaking: Subpath export `./debugger` (research.md)
- Dark mode: CSS variables in :root (research.md)

## Data Model

See `data-model.md` for entity definitions:
- DebuggerState: isOpen, activeTab, position, isExpanded
- CacheEntry, NetworkRequest, PerformanceMetrics display entities

## Demo Integration

The demo currently displays:
- CacheStatsDisplay: itemCount, totalSize, hitRate, missRate, evictionCount
- NetworkStatusDisplay: connection status
- Current images and controls

DebuggerTool should display this same information.

## Quickstart

See `quickstart.md` for usage documentation.

---

## Constitution Check (Post-Design)

| Gate | Requirement | Status |
|------|-------------|--------|
| Library-First | Feature as standalone library component | PASS |
| Tree-shakeable | Component must not increase bundle if unused | PASS |
| Observability | Exposes programmatic API | PASS |
| Test-First | Tests before implementation | GATE |
| Versioning | Semantic Versioning | PASS |