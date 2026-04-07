# Research: Demo Testing Infrastructure

## Overview

This document contains research findings for implementing the demo testing infrastructure feature.

## Key Decisions

### Decision 1: Demo Testing Approach

**Chosen**: Manual testing via enhanced demo UI + automated Playwright e2e tests
**Rationale**: Constitution requires demo apps to verify library functionality. Manual testing allows developers to interactively verify user scenarios. Playwright e2e provides automated regression testing.
**Alternatives considered**:
- Only manual testing: No automated regression coverage
- Only automated testing: Doesn't satisfy "demo application" requirement in constitution

---

### Decision 2: Test Image Source

**Chosen**: picsum.photos
**Rationale**: Free, reliable, provides varied image sizes, supports CDN simulation via URL parameters
**Alternatives considered**:
- Placeholder images: Don't test real network behavior
- Self-hosted: Requires more setup, less realistic

---

### Decision 3: Service Worker Testing Strategy

**Chosen**: Enable/disable via DevTools + console fallback verification
**Rationale**: Chrome DevTools allows easy SW toggle. The fallback chain (SW → adapter → fetch) is tested by disabling each layer.
**Alternatives considered**:
- Programmatic SW unregister: More complex, less realistic user scenario
- Separate test pages: Adds complexity without benefit

---

### Decision 4: Network Throttling Approach

**Chosen**: Chrome DevTools Network throttling presets
**Rationale**: Realistic simulation of actual user conditions, built into browser, no additional code needed
**Alternatives considered**:
- Network link condition API: Requires additional polyfill, less reliable
- Custom throttling in demo: Doesn't match real network behavior

---

## Implementation Notes

### DevTools Integration

The library already includes `devtools={true}` prop in CloudProvider. Verified in current demo:
- Cache stats visible via useCloud() hook
- Network status visible via useCloud() hook
- Service Worker registers automatically via inline script

### Cache Persistence Verification

To verify IndexedDB persistence:
1. Open DevTools → Application → IndexedDB
2. Verify "cloud-image-cache" database exists
3. Refresh page - entries should persist

### Fallback Chain Testing

To test fallback chain:
1. SW primary: Normal operation with SW active
2. SW disabled: DevTools → Application → Service Workers → unregister "cloud-image"
3. SW disabled + IDB cleared: Should fallback to direct fetch
4. Network offline: Should serve from cache or show error gracefully

---

## Verified Dependencies

- React 18+ (from demo package.json)
- @cloudimage/cloud library (local file:../../packages/cloud)
- Vite for dev server
- Chrome DevTools for verification

---

## Unresolved Items

None - all technical context is clear from existing codebase and demo.