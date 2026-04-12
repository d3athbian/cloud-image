# Implementation Plan: WebP/AVIF Auto-Selection

## Feature Context
- **Feature**: WebP/AVIF Auto-Selection
- **Spec**: `specs/012-webp-avif-selection/spec.md`
- **Branch**: `012-webp-avif-selection`

## Technical Context

### What's Already Implemented
- CDN Adapter (`packages/cloud/src/core/cdn-adapter.ts`) with bandwidth-aware variants
- Network/Bandwidth monitoring (`packages/cloud/src/core/network.ts`, `bandwidth.ts`)
- Format variants in CDN config

### What's Needed
- Format detector (check browser support)
- Accept header in requests
- Fallback chain in fetch logic

### Dependencies
- Browser `HTMLImageElement` support detection
- Service Worker interception for Accept header

## Research Tasks

- [ ] Research: How to detect WebP support (fastest method)
- [ ] Research: How to detect AVIF support
- [ ] Research: Service Worker Accept header interception

## Implementation Tasks

### Phase 1: Format Detector
- [x] T001 Create `packages/cloud/src/core/format-detector.ts`
- [x] T002 Implement WebP detection via `Image()` constructor
- [x] T003 Implement AVIF detection via `HTMLImageElement.decode()`

### Phase 2: Integration
- [x] T004 Add Accept header to network fetch
- [x] T005 Implement fallback chain: AVIF → WebP → original

### Phase 3: Testing
- [x] T006 Unit tests for format detector
- [x] T007 E2E test for format negotiation

## Files to Modify

| File | Change |
|------|-------|
| `packages/cloud/src/core/format-detector.ts` | NEW |
| `packages/cloud/src/core/engine.ts` | Add format detection |
| `packages/cloud/src/core/network.ts` | Add Accept header |

## Architecture

```
┌─────────────────────────────────────────────┐
│  FormatDetector                          │
│  ├─ detectSupportedFormats()          │
│  ├─ getPreferredFormat()            │
│  └─ cachedFormats: ImageFormat[]   │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Network.fetch()                         │
│  ├─ Accept: image/avif,image/webp,*/*  │
│  └─ Fallback: AVIF→WebP→original     │
└─────────────────────────────────────────────┘
```

## Gates

- [ ] Format detection < 100ms
- [ ] No extra requests on unsupported browsers
- [ ] Works offline (cached formats)