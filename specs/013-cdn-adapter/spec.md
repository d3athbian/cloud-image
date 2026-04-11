# Feature Specification: CDN Variant Adapter

**Feature Branch**: `008-lib-perf-optimization`  
**Created**: 2026-04-11  
**Status**: Draft  
**Input**: "Create spec for CDN variant generation"

## Problem Statement

Generate optimized URLs for different bandwidths without needing your own CDN. Works with any image host (picsum, unsplash, imgix).

## Implemented Behavior

### CDNAdapter (packages/cloud/src/core/cdn-adapter.ts)

**What it does:**
- Generates variant URLs by appending query params
- Maps bandwidth to appropriate variant
- Supports any image host

**Example usage:**
```typescript
const adapter = new DefaultCDNAdapter({
  domain: 'picsum.photos',
  variants: [
    { name: 'small', width: 320, quality: 60 },
    { name: 'medium', width: 640, quality: 75 },
    { name: 'large', width: 1280, quality: 85 },
    { name: 'original', quality: 100 },
  ],
  urlPattern: '{url}?w={width}&q={quality}',
});

// Generate URL for user's bandwidth
const url = adapter.generateUrl('picsum.photos/id/1/5000/3333', { name: 'medium' });
// → picsum.photos/id/1/5000/3333?w=640&q=75
```

## User Stories

### US1 - Variant Generation (Priority: P1)

**Goal**: Generate URL with size/quality params

**Acceptance Scenarios**:
1. **Given** original URL and variant 'medium', **When** generating, **Then** URL has w=640 parameter

### US2 - Bandwidth Adaptation (Priority: P1)

**Goal**: Auto-select variant based on bandwidth

**Acceptance Scenarios**:
1. **Given** bandwidth 'low', **When** getVariantForBandwidth, **Then** returns 'small'
2. **Given** bandwidth 'high', **When** getVariantForBandwidth, **Then** returns 'large' or 'original'

### US3 - Custom CDN (Priority: P2)

**Goal**: Support custom image hosts

**Acceptance Scenarios**:
1. **Given** your own CDN with /images/ prefix, **When** configured, **Then** generateUrl uses that pattern

## Requirements

- **FR-001**: MUST generate URLs with query parameters
- **FR-002**: MUST map bandwidth to appropriate variants
- **FR-003**: Default variants: small(320), medium(640), large(1280), original
- **FR-004**: Works with any host (picsum, unsplash, custom)

## Success Criteria

- URLs load successfully for all variants
- Bandwidth correctly maps to variant
- No hardcoded dependencies on any CDN