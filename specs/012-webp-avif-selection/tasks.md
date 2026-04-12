# Tasks: WebP/AVIF Auto-Selection

## Phase 1: Setup

- [ ] T001 Create feature branch `012-webp-avif-selection`

## Phase 2: Format Detector

- [ ] T002 [P] Create `packages/cloud/src/core/format-detector.ts`
- [ ] T003 [P] Implement WebP detection (Image() constructor test)
- [ ] T004 [P] Implement AVIF detection (HTMLImageElement.decode test)

## Phase 3: Integration

- [ ] T005 Add Accept header in network.ts
- [ ] T006 Implement fallback chain: AVIF → WebP → original in engine.ts

## Phase 4: Testing

- [ ] T007 Unit test: format detector
- [ ] T008 Unit test: fallback chain
- [ ] T009 E2E test: format negotiation

## Dependencies

- T003 depends on T002
- T006 depends on T005

## Parallel Opportunities

- T002, T003 can run in parallel (different detection methods)