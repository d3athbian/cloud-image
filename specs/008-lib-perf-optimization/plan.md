# Implementation Plan: Library Performance Optimization

**Branch**: `008-lib-perf-optimization` | **Date**: 2026-04-07 | **Spec**: `/specs/008-lib-perf-optimization/spec.md`

## Summary

Optimize @cloudimage/cloud library for better tree-shaking, smaller bundle size, and improved runtime performance. The goal is to achieve Lighthouse score ≥90, bundle size <100KB gzipped, and cache operations <5ms.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)  
**Primary Dependencies**: React 18+, Vite, idb, Vitest  
**Storage**: IndexedDB via idb library  
**Testing**: Vitest (unit), Chrome DevTools (performance), Lighthouse  
**Target Platform**: Web (modern browsers: Chrome 90+, Firefox 90+, Safari 15+, Edge 90+)  
**Project Type**: TypeScript library (npm package)  
**Performance Goals**: 
- Bundle < 100KB gzipped (full), < 10KB (minimal)
- LCP < 2.5s, INP < 200ms
- Cache operations < 5ms
- Memory < 50MB  
**Constraints**: Must maintain backward compatibility, must work in SSR environments  
**Scale/Scope**: Library used by web applications, no user limit

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| Library-First (I) | ✅ PASS | This IS the library being optimized |
| Observability (II) | ✅ PASS | Performance metrics via Lighthouse |
| Test-First (III) | ⚠️ PARTIAL | Performance tests via Lighthouse, not TDD |
| Versioning (IV) | ✅ PASS | Semantic versioning maintained |

**Justification for Test-First partial**: Performance optimization uses Lighthouse for measurement rather than unit tests - this is industry standard for bundle size and runtime performance validation.

## Project Structure

### Documentation (this feature)

```text
specs/008-lib-perf-optimization/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Research findings
├── data-model.md        # Library module structure
├── quickstart.md        # Performance testing guide
└── tasks.md            # Implementation tasks
```

### Source Code (repository root)

```text
packages/cloud/             # Library being optimized
├── src/
│   ├── core/              # Cache, engine, performance modules
│   ├── adapters/          # Web, memory adapters
│   ├── react/             # CloudProvider, CloudImage, hooks
│   ├── service-worker/    # SW implementation
│   └── utils/             # Logger, helpers
├── dist/                   # Build output
└── package.json           # Package configuration

demos/cloud-demo/           # Demo for testing
└── src/
    └── App.tsx            # Test app for Lighthouse
```

**Structure Decision**: Library is already structured in packages/cloud. Optimization focuses on:
1. Vite build configuration for better tree-shaking
2. Code splitting into smaller modules
3. Removing dead code
4. Web Worker for image decoding

## Implementation Phases

### Phase 1: Bundle Analysis & Tree-shaking

- Analyze current bundle size and structure
- Configure Vite for optimal tree-shaking
- Split exports by module (core, react, adapters)
- Verify tree-shaking with different import patterns

### Phase 2: Runtime Performance

- Optimize cache operations
- Ensure Web Worker decoding
- Reduce main thread blocking

### Phase 3: Lighthouse Integration

- Set up Lighthouse testing
- Run baseline performance audit
- Optimize based on results
- Verify ≥90 score

## Complexity Tracking

| Area | Current State | Target | Why Needed |
|------|---------------|--------|------------|
| Bundle size (full) | ~80KB gzipped | < 100KB | Users demand smaller bundles |
| Bundle size (minimal) | N/A | < 10KB | Enable selective imports |
| Tree-shaking | Partial | Full | Remove unused code |
| Lighthouse score | 83 | ≥90 | SEO and UX |

**No complexity violations** - this is a library optimization task.