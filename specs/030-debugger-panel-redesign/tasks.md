# Tasks: Debugger Panel Redesign

**Feature**: Debugger Panel Redesign
**Plan**: `specs/030-debugger-panel-redesign/plan.md`
**Spec**: `specs/030-debugger-panel-redesign/spec.md`
**Branch**: `030-debugger-panel-redesign`
**Generated**: 2026-05-03

## Task Summary

- **Total Tasks**: 12
- **User Story Tasks**: 6 (US1, US2, US3, US4)
- **Setup/Foundation Tasks**: 2
- **Polish Tasks**: 2
- **Parallelizable Tasks**: 4 ([P] marked)

## MVP Scope

User Story 1 (Modern DevTools Aesthetic) + Phase 1 (SidePanel Enhancement) as the core deliverable.

## Phase 1: Setup

- [X] T001 Create `packages/cloud/src/debugger/components/cache/CacheList.tsx` with empty component structure extending SidePanel
- [X] T002 Create `packages/cloud/src/debugger/components/cache/CacheListItem.tsx` with empty component structure

## Phase 2: Foundational

- [X] T003 [P] Define `CacheListItem` and `CacheListState` interfaces in `packages/cloud/src/debugger/types/devtools.types.ts`
- [X] T004 [P] Create `useCacheList` hook in `packages/cloud/src/debugger/hooks/useCacheList.ts` connecting to existing cache atoms

## Phase 3: User Story 1 - Modern DevTools Aesthetic

### Story Goal
Panel displays dark, professional DevTools aesthetic with clear visual hierarchy and consistent color coding.

### Independent Test
Open panel and verify visual appearance matches modern DevTools aesthetics - dark theme, clean lines, proper typography.

- [X] T005 [US1] Update `packages/cloud/src/debugger/styles/devtools.css` to refine color palette and spacing tokens if needed
- [X] T006 [US1] Update `SidePanel.tsx` to render `CacheList` component with scroll container

## Phase 4: User Story 2 - Improved Tab Navigation

### Story Goal
Clear visual feedback on active tab, smooth transitions between Cache, Network, Performance, State views.

### Independent Test
Click through each tab and verify visual feedback and content switching.

- [X] T007 [US2] Update `CacheList.tsx` to implement scrollable list layout with vertical arrangement
- [X] T008 [US2] Connect `CacheList` to `cacheAtom` and `cacheStatsAtom` for real-time data

## Phase 5: User Story 3 - Cached Image List with Thumbnails

### Story Goal
SidePanel displays scrollable list of cached items with thumbnails and relevant cache data.

### Independent Test
Open Cache tab in main content, verify SidePanel shows scrollable list with thumbnails.

- [X] T009 [US3] [P] Implement `CacheListItem` component with thumbnail, URL, size, LRU score, hit count, TTL, status
- [X] T010 [US3] [P] Create `useCacheThumbnail` hook to load ImageBitmap from IndexedDB Blob
- [X] T011 [US3] Implement lazy loading for thumbnails using Intersection Observer

## Phase 6: User Story 4 - Responsive Panel Behavior

### Story Goal
Panel adapts gracefully to different positions and sizes.

### Independent Test
Toggle debugger in different positions, verify SidePanel list remains scrollable.

- [X] T012 [US4] Add empty state handling in `CacheList` when no cached items exist

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T013 Ensure `CacheList` and `CacheListItem` use React.memo for performance
- [X] T014 Verify scroll position preservation when switching tabs

## Dependencies

```
Phase 1 (Setup)
    └── Phase 2 (Foundational)
            └── Phase 3 (US1) ─┬─> Phase 4 (US2)
                               │
                               └─> Phase 5 (US3)
                                          │
                               Phase 6 (US4)◄─┘

Phase 7 (Polish) - runs after all stories complete
```

## Parallel Execution Examples

1. **T003 + T004** can run in parallel (types/hooks are independent)
2. **T009 + T010** can run in parallel (CacheListItem depends on hook, but implementation is independent during development)
3. **US2 phase tasks (T007, T008)** can start once T002 is complete
4. **US3 phase tasks (T009, T010, T011)** require T004 but T009 and T010 are independently implementable

## Implementation Strategy

1. **MVP**: T001-T008 - CacheList renders with data from atoms, empty state works
2. **Thumbnail Feature**: T009-T011 - Add thumbnails with lazy loading
3. **Polish**: T012-T014 - Empty state, memoization, scroll preservation

## Notes

- No tests generated per user request (tests: false in spec)
- Layout (DevToolsLayout grid) is already implemented and working
- Existing Jotai atoms (cacheAtom, cacheStatsAtom) are used as-is
- Tailwind CSS v4 already configured
- No changes to business logic (cache eviction, network resilience)