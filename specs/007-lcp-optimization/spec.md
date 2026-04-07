# Feature Specification: LCP Performance Optimization

**Feature Branch**: `007-lcp-optimization`  
**Created**: 2026-04-07  
**Status**: Draft  
**Input**: "necesito crear una nueva tarea asociada a mejorar los rangos de lcp"

## Problem Statement

Current LCP performance is 882ms which passes Core Web Vitals threshold (<2.5s), but there's room for significant improvement.

### Current Metrics (Baseline)

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| LCP | 882 ms | < 400ms | ⚠️ CAN IMPROVE |
| TTFB | 6 ms | < 200ms | ✅ EXCELLENT |
| Load delay | 367 ms | < 200ms | ⚠️ CAN IMPROVE |
| Render delay | 509 ms | < 200ms | ⚠️ CAN IMPROVE |
| CLS | 0.000 | < 0.1 | ✅ PERFECT |

### LCP Breakdown Analysis

From Chrome DevTools Performance Trace:

```
TTFB:         6ms  ████ (6ms)
Load delay:   367ms ████████████████████████ (367ms) ← PHASE TO OPTIMIZE
Load duration: 0.2ms ▏ (0.2ms)
Render delay: 509ms ████████████████████████████████ (509ms) ← MAJOR ISSUE
```

## Root Cause Analysis

1. **Load delay (367ms)**: Images start loading after HTML parse - no preload
2. **Render delay (509ms)**: Large gap between image load and paint

## Solution Strategy

### Optimization 1: Image Preload

Add `<link rel="preload">` for the first image to eliminate load delay.

```html
<link rel="preload" as="image" href="https://picsum.photos/id/0/400/300">
```

### Optimization 2: Fetch Priority

Add `fetchpriority="high"` to the first image in the grid.

### Optimization 3: Remove Lazy Loading

Currently may have lazy loading enabled - disable for above-the-fold images.

### Optimization 4: Priority Hints in CloudImage

Update CloudImage component to accept and apply priority hints.

## User Stories

### US1 - Preload First Image (Priority: P1)

**Goal**: Reduce load delay by preloading the first image

**Acceptance Scenarios**:
1. **Given** demo loads, **When** HTML is parsed, **Then** first image is preloaded via link tag
2. **Given** preload is working, **When** measuring, **Then** load delay < 100ms

### US2 - Priority High for LCP Image (Priority: P1)

**Goal**: Give highest priority to LCP candidate image

**Acceptance Scenarios**:
1. **Given** first image is in viewport, **When** rendered, **Then** fetchpriority="high" is applied
2. **Given** priority is set, **When** measuring, **Then** render delay < 200ms

### US3 - Disable Lazy Load for Above-Fold Images (Priority: P2)

**Goal**: Ensure above-fold images load immediately

**Acceptance Scenarios**:
1. **Given** first 6 images are above fold, **When** page loads, **Then** loading="eager" for those images
2. **Given** lazy loading disabled, **When** measuring, **Then** all above-fold images load in first request batch

### US4 - Measure and Verify LCP Improvement (Priority: P1)

**Goal**: Verify LCP improves to < 400ms

**Acceptance Scenarios**:
1. **Given** all optimizations applied, **When** running Lighthouse, **Then** LCP < 400ms
2. **Given** LCP improved, **When** comparing with baseline, **Then** improvement > 50%

## Requirements

- **FR-001**: Demo MUST include preload link for first image in index.html
- **FR-002**: First image in grid MUST have fetchpriority="high"
- **FR-003**: CloudImage component MUST support priority prop
- **FR-004**: First 6 images (above fold) MUST use loading="eager"
- **FR-005**: Performance trace MUST show LCP < 400ms after optimization

## Implementation Notes

The CloudImage component needs to:
1. Accept `priority` prop (high, low, auto)
2. Apply `fetchpriority` attribute to img element
3. Handle `loading` prop correctly (eager for priority images)

## Success Criteria

- LCP: 882ms → < 400ms (> 50% improvement)
- Load delay: 367ms → < 100ms
- Render delay: 509ms → < 150ms
- All Core Web Vitals remain green