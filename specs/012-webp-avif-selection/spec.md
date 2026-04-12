# Feature Specification: WebP/AVIF Auto-Selection

**Feature Branch**: `012-webp-avif-selection`
**Created**: 2026-04-12
**Status**: Draft
**Input**: "Auto-select WebP/AVIF based on browser support"

## Problem Statement

The library downloads JPEG/PNG images but modern browsers support WebP (30% smaller) and AVIF (50% smaller). We should detect support and request the optimal format.

## User Stories

### US1 - Detect Browser Format Support (Priority: P1)

**Goal**: Detect if browser supports WebP/AVIF

**Acceptance Scenarios**:
1. **Given** browser supports AVIF, **When** requesting image, **Then** request AVIF format
2. **Given** browser supports only WebP, **When** requesting image, **Then** request WebP format
3. **Given** browser supports neither, **When** requesting image, **Then** request original format

### US2 - Format Negotiation (Priority: P1)

**Goal**: Use Accept header for format negotiation

**Acceptance Scenarios**:
1. **Given** image URL, **When** fetching, **Then** include `Accept: image/avif,image/webp,*/*`

### US3 - Fallback Chain (Priority: P2)

**Goal**: Fallback gracefully if format not available

**Acceptance Scenarios**:
1. **Given** AVIF fails, **When** request, **Then** retry with WebP
2. **Given** WebP fails, **When** request, **Then** retry with original

## Requirements

- **FR-001**: MUST detect WebP support via `<img>` or `Image()` constructor
- **FR-002**: MUST detect AVIF support via `HTMLImageElement.decode()`
- **FR-003**: MUST set appropriate Accept header
- **FR-004**: MUST implement fallback chain AVIF → WebP → original

## Technical Implementation

```typescript
type ImageFormat = 'avif' | 'webp' | 'jpeg' | 'png';

interface FormatDetector {
  detectSupportedFormats(): Promise<ImageFormat[]>;
  getPreferredFormat(): ImageFormat;
}

// Usage
const detector = new FormatDetector();
const formats = await detector.detectSupportedFormats();
// ['avif', 'webp', 'jpeg']
```

## Success Criteria

- Format detection completes in <100ms
- Bandwidth savings: AVIF ~50%, WebP ~30%
- No extra requests on unsupported browsers