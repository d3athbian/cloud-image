# Tasks: Panel UI Improvements

**Input**: Design documents from `specs/027-panel-ui-improvements/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md
**Testing Approach**: After each phase, run rebuild-demo skill and verify via browser DevTools (NO Playwright)

---

## Phase 0: Tailwind v4 Setup

**Purpose**: Install and configure Tailwind CSS v4 for DevTools styling

### Implementation

- [X] T001 Install `@tailwindcss/vite` and `tailwindcss@4` as dev dependencies in `packages/cloud`
- [X] T002 Create `packages/cloud/src/debugger/styles/devtools.css` with `@import "tailwindcss"` directive
- [X] T003 Add `@theme` block with design tokens from `docs/design.md` (colors, fonts)
- [X] T004 Integrate `@tailwindcss/vite` plugin in `packages/cloud/vite.config.ts`
- [X] T005 Create `packages/cloud/src/debugger/types/devtools.types.ts` with all type definitions from data-model.md

### Build & Test

```bash
cd packages/cloud && npm run build
```

> **Rebuild-Demo**: Run skill to verify Tailwind classes apply correctly
> **DevTools Verification**: Open panel, inspect elements to verify Tailwind is working (no inline styles)

---

## Phase 1: Layout Base

**Purpose**: Implement DevToolsLayout component with CSS Grid structure per design spec

### Implementation

- [X] T006 [P] Create `packages/cloud/src/debugger/components/layout/DevToolsLayout.tsx` with CSS Grid: `grid-cols-[1fr_350px] grid-rows-[48px_1fr_250px]`
- [X] T007 [P] Create `packages/cloud/src/debugger/components/layout/Topbar.tsx` with brand, version pill, status indicators
- [X] T008 [P] Create `packages/cloud/src/debugger/components/layout/SidePanel.tsx` (empty container, 350px right column)
- [X] T009 [P] Create `packages/cloud/src/debugger/components/layout/BottomPanel.tsx` (empty container, 250px footer)

### Build & Test

```bash
cd packages/cloud && npm run build
```

> **Rebuild-Demo**: Run skill after layout changes
> **DevTools Verification**: Verify layout structure matches design spec zones

---

## Phase 2: Tab Navigation

**Purpose**: Implement tab bar with Cache, Network, Performance, State tabs using Jotai atoms

### Implementation

- [X] T010 Create `packages/cloud/src/debugger/store/devtools-atoms.ts` with `activeTabAtom`, `selectedItemUrlAtom`, `devToolsOpenAtom`
- [X] T011 Create `packages/cloud/src/debugger/hooks/useDevToolsLayout.ts` for layout state management
- [X] T012 [P] Create tab bar component with 4 tabs: Cache, Network, Performance, State
- [X] T013 [P] Connect tab switching to `activeTabAtom` with conditional rendering of tab content

### Build & Test

```bash
cd packages/cloud && npm run build
```

> **Rebuild-Demo**: Run skill after tab changes
> **DevTools Verification**: Tab switching works, active tab has blue underline indicator

---

## Phase 3: Logger Panel

**Purpose**: Implement real-time logger with filtering and 500-entry FIFO limit

### Implementation

- [X] T014 Create `packages/cloud/src/debugger/store/logger-atoms.ts` with `logsAtom`, `logsFilterAtom`, `filteredLogsAtom`
- [X] T015 Create `packages/cloud/src/debugger/hooks/useLogger.ts` with FIFO limit (500 entries), `addLog`, `clearLogs`
- [X] T016 [P] Create `packages/cloud/src/debugger/components/logger/LogEntry.tsx` for single log row
- [X] T017 [P] Create `packages/cloud/src/debugger/components/logger/LoggerPanel.tsx` with filter buttons (All, Info, Warn, Error) and auto-scroll
- [X] T018 Create empty StateViewer placeholder in BottomPanel

### Build & Test

```bash
cd packages/cloud && npm run build
```

> **Rebuild-Demo**: Run skill after logger changes
> **DevTools Verification**: Logs display, filtering works, FIFO truncation at 500 entries

---

## Phase 4: Cache UI

**Purpose**: Implement CacheGrid with CacheCard, StatsOverview, and CacheToolbar

### Implementation

- [X] T019 [P] Create `packages/cloud/src/debugger/components/cache/CacheCard.tsx` with thumbnail, LRU badge, copy icon, metadata
- [X] T020 [P] Create `packages/cloud/src/debugger/components/cache/CacheGrid.tsx` with CSS Grid (`auto-fill, minmax(220px, 1fr)`) and React.memo
- [X] T021 [P] Create `packages/cloud/src/debugger/components/cache/StatsOverview.tsx` with widgets: Items, Size, Hit Rate, Evictions, TTL Expired, Pinned
- [X] T022 Create `packages/cloud/src/debugger/components/cache/CacheToolbar.tsx` with search input (in-memory filter) and Status/Sort dropdowns
- [X] T023 Create empty/skeleton loading state when cache is loading
- [X] T024 Create "No cached images" empty state when cache is empty

### Build & Test

```bash
cd packages/cloud && npm run build
```

> **Rebuild-Demo**: Run skill after cache UI changes
> **DevTools Verification**: Grid renders, search filters items, empty/skeleton states work

---

## Phase 5: State Viewer + Quick Actions

**Purpose**: Implement StateViewer with JSON syntax highlighting and QuickActions buttons

### Implementation

- [X] T025 [P] Create `packages/cloud/src/debugger/components/shared/JsonView.tsx` with syntax highlighting (keys, strings, numbers)
- [X] T026 [P] Create `packages/cloud/src/debugger/components/state/StateViewer.tsx` showing cacheAtom, networkAtom, memoryAtom, cacheStatsAtom as formatted JSON
- [X] T027 [P] Create `packages/cloud/src/debugger/components/shared/Button.tsx` and `Badge.tsx` for consistent styling
- [X] T028 Create `packages/cloud/src/debugger/components/state/QuickActions.tsx` with buttons: Disable Cache, Simulate Offline, Clear All, Export Snapshot
- [X] T029 Wire QuickActions to `window.__CLOUD_ENGINE__` methods

### Build & Test

```bash
cd packages/cloud && npm run build
```

> **Rebuild-Demo**: Run skill after state viewer changes
> **DevTools Verification**: State displays formatted JSON, QuickAction buttons trigger correct behavior

---

## Phase 6: Integration & Polish

**Purpose**: Connect ImageDetails sidebar, handle IndexedDB failures gracefully, final polish

### Implementation

- [X] T030 [P] Create `packages/cloud/src/debugger/components/layout/ImageDetails.tsx` with full metadata display and action buttons (Preview, Refetch, Delete, Pin)
- [X] T031 [P] Create `packages/cloud/src/debugger/hooks/useCacheExplorer.ts` for IDB interaction
- [X] T032 Wire ImageDetails to `selectedItemUrlAtom` observation
- [X] T033 Add IndexedDB failure handling: try/catch, warning in grid UI, disabled sections for IDB-dependent features
- [X] T034 Add skeleton loading cards animation with CSS @keyframes

### Build & Test

```bash
cd packages/cloud && npm run build
```

> **Rebuild-Demo**: Run skill after integration
> **DevTools Verification**: All user stories pass, no console errors, UI matches design spec

---

## Final Validation

### Implementation

- [X] T035 Run `npm run typecheck` in `packages/cloud`
- [X] T036 Run `npm run lint` in `packages/cloud`
- [X] T037 Verify build passes with `npm run build`

### Final Test

```bash
cd packages/cloud && npm run build && npm run typecheck && npm run lint
```

> **Rebuild-Demo**: Final rebuild
> **DevTools Verification**: Full browser test - all tabs accessible, dark theme consistent, no console errors

---

## Checkpoint Summary

| Phase | Description | Key Verification |
|-------|-------------|------------------|
| 0 | Tailwind v4 Setup | Tailwind classes apply, no inline styles |
| 1 | Layout Base | Grid structure matches design spec |
| 2 | Tab Navigation | Tab switching works, active state visible |
| 3 | Logger Panel | Logs display, filtering works, FIFO limit |
| 4 | Cache UI | Grid renders, search works, empty/skeleton states |
| 5 | State Viewer + Quick Actions | JSON displays, buttons trigger actions |
| 6 | Integration & Polish | All features work, no errors |

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 0**: No dependencies
- **Phase 1**: Depends on Phase 0 completion
- **Phase 2**: Depends on Phase 1 completion
- **Phase 3**: Depends on Phase 2 completion
- **Phase 4**: Depends on Phase 3 completion
- **Phase 5**: Depends on Phase 4 completion
- **Phase 6**: Depends on Phase 5 completion

### Parallel Opportunities

- T002, T003, T004 (Phase 0) can run in parallel
- T006, T007, T008, T009 (Phase 1) can run in parallel
- T010, T011 (Phase 2) can run in parallel
- T012, T013 (Phase 2) can run in parallel
- T014, T015 (Phase 3) can run in parallel
- T016, T017 (Phase 3) can run in parallel
- T019, T020, T021 (Phase 4) can run in parallel
- T025, T026, T027, T028 (Phase 5) can run in parallel
- T030, T031 (Phase 6) can run in parallel

---

## Implementation Strategy

### Phase-by-Phase Validation

1. Complete Phase → Rebuild-demo skill → Verify in DevTools → Fix issues before next phase
2. Do not proceed to next phase until current phase passes all verifications
3. Use browser DevTools console to check for errors

### Why This Approach

- Tailwind v4 first ensures styling foundation is solid
- Each phase adds visible value incrementally
- Frequent validation with rebuild-demo prevents integration issues
- Manual DevTools testing catches real-world UI problems

---

## Notes

- **NO business logic changes** - only UI layer
- **NO changes to core/** directory
- **NO Playwright** - validation is manual via DevTools per rebuild-demo skill
- All data comes from existing Jotai atoms (read-only)
- New components are purely presentational
- Tailwind config is isolated to `devtools.css` only