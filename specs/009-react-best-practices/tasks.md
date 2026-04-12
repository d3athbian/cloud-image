# Tasks: React Best Practices Implementation

**Branch**: `008-lib-perf-optimization` | **Generated**: 2026-04-07

## Phase 1: Setup

- [X] T001 Install React DevTools and performance profiling tools

## Phase 2: Component Optimization

### US1 - Memoization Implementation

- [X] T002 [P] [US1] Wrap CacheStatsDisplay with React.memo in demos/cloud-demo/src/App.tsx
- [X] T003 [P] [US1] Wrap NetworkStatusDisplay with React.memo in demos/cloud-demo/src/App.tsx
- [X] T004 [P] [US1] Wrap Controls with React.memo in demos/cloud-demo/src/App.tsx
- [X] T005 [P] [US1] Wrap ImageGrid with React.memo in demos/cloud-demo/src/App.tsx

### US2 - Custom Hooks Extraction

- [X] T006 [P] [US2] Extract useCacheStats hook in demos/cloud-demo/src/hooks/useCacheStats.ts
- [X] T007 [P] [US2] Extract useImagePrefetch hook in demos/cloud-demo/src/hooks/useImagePrefetch.ts

### US3 - Component Separation

- [X] T008 [US3] Create ImageCard component in demos/cloud-demo/src/components/ImageCard.tsx (inline in ImageGrid)
- [X] T009 [US3] Create StatsPanel component in demos/cloud-demo/src/components/StatsPanel.tsx (inline in App)
- [X] T010 [US3] Create Header component in demos/cloud-demo/src/components/Header.tsx (inline in App)
- [X] T011 [US3] Move styles to separate CSS module in demos/cloud-demo/src/styles/app.module.css

### US4 - Performance Optimization

- [X] T012 [P] [US4] Add useCallback to handlePrefetch in demos/cloud-demo/src/App.tsx
- [X] T013 [P] [US4] Add useCallback to handleClear in demos/cloud-demo/src/App.tsx
- [X] T014 [US4] Implement useMemo for bandwidthColors in demos/cloud-demo/src/App.tsx

### US5 - Error Boundaries

- [X] T015 [US5] Create ErrorBoundary component in demos/cloud-demo/src/components/ErrorBoundary.tsx
- [X] T016 [US5] Wrap CloudProvider with ErrorBoundary in demos/cloud-demo/src/App.tsx

### US6 - Accessibility

- [X] T017 [P] [US6] Add ARIA labels to buttons in demos/cloud-demo/src/App.tsx
- [X] T018 [P] [US6] Add ARIA live region for stats updates in demos/cloud-demo/src/App.tsx

### US7 - Fix useImagePrefetch Bug

- [X] T021 [US7] Fix useImagePrefetch cacheRef to use useRef in demos/cloud-demo/src/hooks/useImagePrefetch.ts

### US8 - CloudImage Memoization

- [X] T022 [US8] Wrap CloudImage with React.memo in packages/cloud/src/react/image.tsx
- [X] T023 [P] [US8] Move BANDWIDTH_CONFIG outside CloudImage in packages/cloud/src/react/image.tsx

### US9 - Extract useIntersectionObserver Hook

- [X] T024 [P] [US9] Create useIntersectionObserver hook in packages/cloud/src/react/hooks/useIntersectionObserver.ts
- [ ] T025 [P] [US9] Update CloudImage to use new hook in packages/cloud/src/react/image.tsx

## Phase 3: Polish & Verification

- [X] T019 Run Lighthouse audit to verify improvements
- [X] T020 Run performance trace to verify re-render improvements

## Implementation Strategy

### MVP Scope (US1 + US2 + US7)
- Memoization (T002-T005)
- Custom hooks (T006-T007)
- Bug fix (T021)

### Incremental Delivery
- US1 → US2 → US3 → US4 → US5 → US6 → US7 → US8 → US9

## Dependencies

- T006 depends on T002-T005
- T008-T011 depend on T006-T007
- T012-T014 depend on T002-T011
- T022-T023 depend on US8 (CloudImage)
- T024-T025 depend on T022

## Parallel Opportunities

- T002-T005: Can run in parallel (different components)
- T006-T007: Can run in parallel (different hooks)
- T017-T018: Can run in parallel (accessibility changes)
- T022-T023: Can run in parallel (CloudImage optimization)
- T024-T025: Can run in parallel (intersection observer)
