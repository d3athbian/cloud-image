# Implementation Plan: Performance Improvements and General Refactor

**Feature Branch**: `031-perf-refactor`
**Created**: 2026-05-13
**Status**: Planning
**Spec**: [../spec.md](../spec.md)

---

## Technical Context

### Overview

This plan addresses critical performance issues in the carbon-image library, specifically targeting memory leaks, component architecture problems, observer efficiency, and error handling patterns. The user provided detailed technical context identifying four major problem areas.

### Problem Areas (User-Provided)

1. **Memory Leaks with ObjectURLs**
   - Blob URLs not being revoked when images change or component unmounts
   - Memory grows unbounded in SPAs during navigation
   - Solution: Track ObjectURLs and revoke them in useEffect cleanup

2. **SRP Violation in CloudImage Component**
   - Mega useEffect with 130+ lines and 14 dependencies causes race conditions
   - Need to split into specialized hooks: useNetworkMonitor, useImageCacheLoader, useCrossfadeAnimation
   - Component becomes a simple Presenter

3. **Individual IntersectionObserver Creation**
   - Creating new observer per DOM node destroys scroll performance on galleries
   - Solution: Global singleton observer with WeakMap-based registry

4. **Swallowing Errors Silently**
   - Empty catch blocks mask critical errors (network, IndexedDB corruption)
   - Solution: Contextual logging in dev mode, error classification, propagation to UI

### Architecture Impact

- **React Components**: Refactor CloudImage into hooks-based architecture
- **Core Engine**: Enhance memory management and error handling
- **Utils**: Add global IntersectionObserver manager
- **Logging**: Implement environment-aware logging system

---

## Constitution Check

*Source: Constitution not available at `.specify/memory/constitution.md`. Skipping.*

### Design Principles

| Principle | Status | Notes |
|-----------|--------|-------|
| Single Responsibility | VIOLATION | CloudImage has single useEffect with 14 dependencies |
| Fail Fast | VIOLATION | Empty catch blocks suppress errors |
| Memory Safety | VIOLATION | ObjectURLs not properly cleaned up |
| Performance | VIOLATION | Individual IntersectionObservers per node |

---

## Phase 0: Research

### Research Tasks

**Task 1: React Hooks Pattern for Component Decomposition**
- Research best practices for splitting large useEffect into multiple hooks
- Identify patterns for useNetworkMonitor, useImageCacheLoader, useCrossfadeAnimation
- Explore React 19 Concurrent features if applicable

**Task 2: IntersectionObserver Singleton Pattern**
- Research global IntersectionObserver implementation
- Find WeakMap-based callback storage patterns
- Evaluate cleanup strategies for DOM nodes

**Task 3: Memory Leak Prevention with Blob URLs**
- Research URL.revokeObjectURL best practices
- Find patterns for tracking multiple blob URLs across component lifecycle
- Identify safety checks before revocation

**Task 4: Error Handling and Logging Patterns**
- Research environment-aware logging (dev vs prod)
- Find error classification patterns (AbortError vs QuotaExceededError)
- Explore non-blocking error propagation to UI components

### Unknowns (NEEDS CLARIFICATION)

| Item | Question | Status |
|------|----------|--------|
| UI Error API | Should onCacheError be a callback prop or use React Context? | RESOLVED - Use callback prop for simplicity |
| Hook API Shape | Should hooks follow render prop pattern or return tuples? | RESOLVED - Return tuples with [state, helpers] |

---

## Phase 1: Design & Contracts

### Data Model

```typescript
// Blob URL Registry - tracks ObjectURLs for cleanup
interface BlobUrlRegistry {
  urls: Map<string, string>; // componentRef -> ObjectURL
  add(componentId: string, url: string): void;
  revoke(componentId: string): void;
  revokeAll(): void;
}

// Image State - returned by useImageCacheLoader
interface ImageState {
  status: 'idle' | 'loading' | 'loaded' | 'error';
  url: string | null;
  error: Error | null;
  objectUrl: string | null; // for cleanup tracking
}

// Network State - returned by useNetworkMonitor
interface NetworkState {
  isOnline: boolean;
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | null;
  rtt: number | null;
}

// Observer Callback - stored in WeakMap
interface ObserverEntry {
  callback: IntersectionObserverCallback;
  options: IntersectionObserverInit;
}
```

### Interface Contracts

**1. CloudImage Component Contract**
```typescript
interface CloudImageProps {
  src: string;
  alt: string;
  engine?: ImageCacheEngine;
  noCache?: boolean;
  priority?: 'high' | 'low';
  fallback?: ReactNode;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onCacheError?: (error: Error) => void; // NEW: propagate cache errors
  crossfade?: boolean;
  crossfadeDuration?: number;
}
```

**2. Global IntersectionObserver Contract**
```typescript
interface GlobalObserverManager {
  observe(
    element: Element,
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ): void;
  unobserve(element: Element): void;
  disconnect(): void;
}
```

**3. Blob URL Registry Contract**
```typescript
interface BlobUrlManager {
  create(object: Blob): string; // returns ObjectURL, registers for cleanup
  revoke(url: string): void;
  revokeAll(): void;
}
```

**4. Logger Contract**
```typescript
interface Logger {
  error(context: string, message: string, ...args: unknown[]): void;
  warn(context: string, message: string, ...args: unknown[]): void;
  debug(context: string, message: string, ...args: unknown[]): void;
  // Only outputs in development mode; production suppresses or sends to telemetry
}
```

### Key Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/react/hooks/useNetworkMonitor.ts` | CREATE | Network state hook |
| `src/react/hooks/useImageCacheLoader.ts` | CREATE | Cache loading logic hook |
| `src/react/hooks/useCrossfadeAnimation.ts` | CREATE | Animation timing hook |
| `src/react/hooks/useBlobUrl.ts` | CREATE | ObjectURL lifecycle management |
| `src/utils/GlobalIntersectionObserver.ts` | CREATE | Singleton observer manager |
| `src/utils/blobUrlRegistry.ts` | CREATE | ObjectURL tracking |
| `src/utils/logger.ts` | MODIFY | Enhance with error classification |
| `src/react/image.tsx` | MODIFY | Refactor to use hooks |

---

## Implementation Phases

### Phase 1: Blob URL Registry (Memory Leak Fix)

**Files**: `src/utils/blobUrlRegistry.ts`, `src/react/hooks/useBlobUrl.ts`

**Tasks**:
1. Create BlobUrlRegistry class with Map-based tracking
2. Add safety check for blob: URLs before revoke
3. Create useBlobUrl hook for automatic cleanup on src change
4. Integrate into CloudImage component

**Acceptance Criteria**:
- ObjectURLs revoked on component unmount
- ObjectURLs revoked when src changes (before creating new)
- No blob: URL leaks after 100 image navigations

---

### Phase 2: Hook Decomposition (SRP Fix)

**Files**: `src/react/hooks/*.ts`, `src/react/image.tsx`

**Tasks**:
1. Create useNetworkMonitor hook
2. Create useImageCacheLoader hook with abort signal support
3. Create useCrossfadeAnimation hook
4. Refactor CloudImage to be pure presenter
5. Ensure 14 dependencies reduce to hook-managed state

**Acceptance Criteria**:
- CloudImage useEffect reduced to < 30 lines
- Each hook is independently testable
- No race conditions when src changes rapidly

---

### Phase 3: Global IntersectionObserver

**Files**: `src/utils/GlobalIntersectionObserver.ts`

**Tasks**:
1. Create singleton manager class
2. Implement WeakMap<Element, ObserverEntry> storage
3. Add observe/unobserve/disconnect methods
4. Create React hook wrapper (useIntersectionObserver)
5. Migrate CloudImage to use global observer

**Acceptance Criteria**:
- Only 1 IntersectionObserver instance regardless of image count
- Gallery with 50+ images maintains 60fps scroll
- Cleanup works correctly when DOM nodes are removed

---

### Phase 4: Error Handling Enhancement

**Files**: `src/utils/logger.ts`, `src/react/image.tsx`

**Tasks**:
1. Enhance logger with environment-aware output
2. Add error classification (AbortError, QuotaExceededError, NetworkError)
3. Create non-fatal error filtering in catch blocks
4. Add onCacheError prop to CloudImage
5. Propagate cache errors to UI without blocking

**Acceptance Criteria**:
- Dev mode shows full stack traces for cache IndexedDB errors
- AbortError silently suppressed (expected behavior)
- QuotaExceededError triggers fallback to network URL
- onCacheError callback receives detailed error info

---

### Phase 5: Performance Validation

**Tasks**:
1. Memory profiling with 100+ image navigations
2. Scroll performance profiling on gallery
3. Bundle size measurement
4. Cache operation latency benchmarks

---

## Quickstart

```bash
# Phase 1: Blob URL fix
cd packages/cloud
npm run build

# Run memory profiling
# Open Chrome DevTools > Memory > Take heap snapshot
# Navigate through 50 images
# Compare heap snapshots for blob: URL leaks

# Phase 2: Hook refactor
# Each hook can be unit tested independently
npm run test -- --grep "useBlobUrl"
npm run test -- --grep "useNetworkMonitor"
```

---

## Verification

| Criterion | Test Method | Target |
|-----------|-------------|--------|
| Memory leaks fixed | Heap snapshots after 100 navigations | Zero blob: URLs in heap |
| Hook decomposition | Code review, unit tests | useEffect < 30 lines |
| Observer singleton | Performance profiler | 1 observer instance |
| Error handling | Console log inspection | Full traces in dev mode |
| Bundle size | Build output analysis | < 50KB core module |
| Cache operations | Performance benchmarks | < 100ms average |