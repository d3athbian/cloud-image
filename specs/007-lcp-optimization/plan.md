# Implementation Plan: LCP Performance Optimization

**Branch**: `007-lcp-optimization` | **Date**: 2026-04-07 | **Spec**: `/specs/007-lcp-optimization/spec.md`

## Summary

Optimize LCP from 882ms to <400ms by implementing image preloading, fetch priority hints, and removing lazy loading for above-fold images. This will improve Core Web Vitals and user experience.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)  
**Primary Dependencies**: React 18+, @cloudimage/cloud, Vite  
**Storage**: IndexedDB (existing)  
**Testing**: Chrome DevTools Performance Trace, Lighthouse  
**Target Platform**: Web (Chrome)  
**Project Type**: React Demo App + TypeScript Library  
**Performance Goals**: LCP < 400ms (from 882ms baseline)  
**Constraints**: Must maintain CLS at 0, keep TTFB under 200ms  
**Scale/Scope**: Single page demo with 20 images

## Baseline Metrics (Current)

| Metric | Current | Target |
|--------|---------|--------|
| LCP | 882 ms | < 400 ms |
| TTFB | 6 ms | < 200 ms |
| Load delay | 367 ms | < 100 ms |
| Render delay | 509 ms | < 150 ms |
| CLS | 0.000 | < 0.1 |

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| Library-First (I) | ✅ PASS | CloudImage component updates |
| Observability (II) | ✅ PASS | Performance metrics measurable |
| Demo & Testing | ✅ PASS | Uses demo app for verification |

## Project Structure

```text
packages/cloud/src/react/
├── image.tsx           # Add priority prop support
└── hooks.tsx           # (no changes needed)

demos/cloud-demo/
├── index.html          # Add preload link for first image
└── src/App.tsx        # Apply priority to first image
```

## Implementation Tasks

See `/specs/007-lcp-optimization/tasks.md` for detailed task list.

## Complexity Tracking

| Optimization | Effort | Impact |
|--------------|--------|--------|
| Preload first image | Low | High |
| fetchpriority=high | Low | High |
| Remove lazy load | Low | Medium |
| CloudImage priority prop | Medium | High |

## Performance Targets

- **LCP**: 882ms → < 400ms (> 50% improvement)
- **Load delay**: 367ms → < 100ms
- **Render delay**: 509ms → < 150ms
- **CLS**: Maintain at 0.000