# Implementation Plan: Panel UI Improvements

**Branch**: `027-panel-ui-improvements` | **Date**: 2026-04-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/027-panel-ui-improvements/spec.md`

## Summary

Redesign DevTools panel UI using Tailwind CSS v4 while preserving all existing business logic. Goal is a modern, Vercel/Next.js dark-style aesthetic per `docs/design.md`. Phase 0 starts with Tailwind v4 integration, then progressively builds layout, tabs, logger, cache grid, and engine integration.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Tailwind CSS v4, React 19, Jotai (existing), idb (existing)
**Storage**: IndexedDB (via idb - existing, no changes)
**Testing**: Vitest (unit), Playwright (integration/e2e) - **NO Playwright for this feature**
**Target Platform**: Browser (DevTools panel overlay)
**Project Type**: Library DevTools UI component
**Performance Goals**: 60fps scroll with ≤100 items, ≤200ms tab switching
**Constraints**: NO changes to core business logic (cache eviction, network resilience, circuit breaker). Only UI layer modified.
**Scale/Scope**: ≤100 items in cache grid, 4 tabs, real-time logger with ≤500 entries

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| Library-First | ✅ PASS | DevTools is observability component within library |
| Test-First | ⚠️ NOTE | UI components need visual/behavioral tests via rebuild-demo skill |
| TypeScript Strict | ✅ PASS | No TS changes, existing strict mode |
| No New Deps Justified | ✅ PASS | Tailwind v4 is new dependency (required per spec) |
| Observability | ✅ PASS | DevTools panel IS the observability layer |
| No Business Logic Changes | ✅ PASS | Constraint: only UI touches |

## Project Structure

### Documentation (this feature)

```text
specs/027-panel-ui-improvements/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (if needed)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
packages/cloud/src/debugger/
├── index.ts               # Exports (existing)
├── components/
│   ├── layout/
│   │   ├── DevToolsLayout.tsx    # NEW: Main grid container
│   │   ├── Topbar.tsx           # NEW: Header with status indicators
│   │   ├── SidePanel.tsx        # NEW: ImageDetails + Logger
│   │   └── BottomPanel.tsx      # NEW: StateViewer + QuickActions
│   ├── cache/
│   │   ├── CacheGrid.tsx        # NEW: CSS Grid container
│   │   ├── CacheCard.tsx        # NEW: Memoized card component
│   │   ├── StatsOverview.tsx    # NEW: Stats widgets
│   │   └── CacheToolbar.tsx     # NEW: Search + filters
│   ├── logger/
│   │   ├── LoggerPanel.tsx      # NEW: Real-time log display
│   │   └── LogEntry.tsx         # NEW: Single log row
│   ├── state/
│   │   └── StateViewer.tsx      # NEW: Jotai JSON view
│   └── shared/
│       ├── Button.tsx           # NEW: Shared button component
│       ├── Badge.tsx            # NEW: Status badge
│       └── JsonView.tsx         # NEW: JSON syntax highlighting
├── hooks/
│   ├── useLogger.ts            # NEW: Log management hook
│   ├── useCacheExplorer.ts      # NEW: IDB interaction
│   └── useDevToolsLayout.ts     # NEW: Layout state
├── store/
│   ├── devtools-atoms.ts        # NEW: UI state atoms
│   └── logger-atoms.ts          # NEW: Log atoms
├── types/
│   └── devtools.types.ts        # NEW: Type definitions
└── styles/
    └── devtools.css             # NEW: Tailwind v4 + @theme tokens
```

### Source Code (unchanged - no modifications)

```text
packages/cloud/src/
├── core/                    # UNCHANGED - business logic intact
├── adapters/               # UNCHANGED
├── worker/                 # UNCHANGED
├── react/                  # UNCHANGED
└── debugger/hooks/         # PARTIALLY: existing hooks remain, new ones added
```

**Structure Decision**: Adding new UI components under `debugger/components/` while preserving existing `DebuggerTool.tsx`, `DebuggerPanel.tsx`, and hooks. Tailwind config via `devtools.css` only - no changes to project root config files.

## Complexity Tracking

| Decision | Justification | Rejected Alternative |
|----------|---------------|---------------------|
| Tailwind v4 as new dependency | Required by design spec `docs/design.md`; v4 @theme is cleanest approach for design tokens | CSS Modules would require more custom work |
| CSS Grid + React.memo (no virtualization lib) | ≤100 items expectation; memoization sufficient per clarifications | tanstack-virtual, react-window add unnecessary bundle |

## Implementation Phases

### Phase 0: Tailwind v4 Setup

1. Install `@tailwindcss/vite` and `tailwindcss` v4.x
2. Create `styles/devtools.css` with `@import "tailwindcss"` and `@theme` tokens from design spec
3. Integrate plugin in `vite.config.ts`
4. **Rebuild-demo verification**: Run skill to verify Tailwind classes apply correctly
5. **DevTools verification**: Open DevTools panel and verify styled components load

### Phase 1: Layout Base

1. Implement `DevToolsLayout` with CSS Grid: `grid-cols-[1fr_350px] grid-rows-[48px_1fr_250px]`
2. Build `Topbar` with brand, status indicators (Online, Circuit, SW, Worker)
3. Build empty containers for SidePanel and BottomPanel
4. **Rebuild-demo verification**: Run skill after layout changes
5. **DevTools verification**: Verify layout matches design spec structure

### Phase 2: Tab Navigation

1. Implement `activeTabAtom` for tab state
2. Build tab bar with Cache, Network, Performance, State tabs
3. Connect tab switching to atom state
4. **Rebuild-demo verification**: Run skill after tab changes
5. **DevTools verification**: Tab switching works, active state visible

### Phase 3: Logger Panel

1. Implement `useLogger` hook with FIFO (500 limit)
2. Build `LoggerPanel` with filter buttons and auto-scroll
3. Add log entry formatting
4. **Rebuild-demo verification**: Run skill after logger changes
5. **DevTools verification**: Logs display, filtering works, FIFO truncation

### Phase 4: Cache UI

1. Implement `CacheGrid` with CSS Grid (`auto-fill, minmax(220px, 1fr)`)
2. Build `CacheCard` with thumbnail, LRU badge, hover states
3. Implement `StatsOverview` widgets
4. Build `CacheToolbar` with search (in-memory filter) and filters
5. **Rebuild-demo verification**: Run skill after cache UI changes
6. **DevTools verification**: Grid renders, search filters, empty/skeleton states

### Phase 5: State Viewer + Quick Actions

1. Implement `StateViewer` with JSON syntax highlighting
2. Implement `QuickActions` buttons (Disable Cache, Simulate Offline, Clear All, Export)
3. Connect to existing engine via `window.__CLOUD_ENGINE__`
4. **Rebuild-demo verification**: Run skill after state viewer changes
5. **DevTools verification**: State displays, actions trigger correctly

### Phase 6: Integration & Polish

1. Connect `ImageDetails` sidebar with selected item display
2. Implement Delete, Pin, Refetch actions
3. Handle IndexedDB failures gracefully (warning UI, disabled sections)
4. Final visual polish per design spec
5. **Rebuild-demo verification**: Run skill after integration
6. **DevTools verification**: All user stories pass, no regressions

## Rebuild-Demo Skill Usage

**Critical**: After each phase, run rebuild-demo skill to validate changes:

```bash
# Delete outdated files
rm -f demos/cloud-demo/public/sw.js demos/cloud-demo/public/register.js

# Build library
cd packages/cloud && npm run build

# Build demo
cd ../../demos/cloud-demo && npm run build
```

**Validation**: Use DevTools browser panel to verify:
- Cache data displays correctly
- Network metrics visible
- No console errors
- UI matches design spec

**NO PLAYWRIGHT**: Validation is manual via DevTools browser panel per rebuild-demo skill rules.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Tailwind v4 @theme conflicts with existing styles | Isolated CSS file only, no root config changes |
| Performance issues without virtualization | React.memo + CSS content-visibility fallback |
| IndexedDB failure crashes UI | Try/catch with graceful degradation |
| Business logic accidentally modified | Code review gate, no changes to `core/` directory |

## Demo & Testing

Per rebuild-demo skill, demo app MUST exercise all features manually via DevTools:
- Cache loading, selection, deletion, pinning
- Logger real-time display
- Network state changes
- Offline simulation
- State viewer JSON display

**Validation Method**: Browser DevTools panel inspection after each rebuild-demo run.

---

*Plan created: 2026-04-28*
*Branch*: `027-panel-ui-improvements`