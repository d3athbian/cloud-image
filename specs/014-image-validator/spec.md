# Feature Specification: Image Validation

**Feature Branch**: `008-lib-perf-optimization`  
**Created**: 2026-04-11  
**Status**: Draft  
**Input**: "Create spec for image validation"

## Problem Statement

Reject corrupt images and very large files before caching to prevent issues.

## Implemented Behavior

### ImageValidator (packages/cloud/src/core/image-validator.ts)

**What it does:**
- Validates response headers (Content-Type)
- Rejects files over maxSize
- Checks image dimensions

**Example usage:**
```typescript
const validator = new ImageValidator({
  maxSize: 50 * 1024 * 1024, // 50MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
});

const result = await validator.validate('https://picsum.photos/id/1/5000/3333', {
  contentType: 'image/jpeg',
  contentLength: 5000000,
  width: 5000,
  height: 3333,
});
// { valid: true } or { valid: false, reason: 'too_large' }
```

## User Stories

### US1 - Type Validation (Priority: P1)

**Goal**: Accept only valid image types

**Acceptance Scenarios**:
1. **Given** Content-Type is image/jpeg, **When** validating, **Then** valid
2. **Given** Content-Type is text/html, **When** validating, **Then** invalid (not image)

### US2 - Size Validation (Priority: P1)

**Goal**: Reject files too large

**Acceptance Scenarios**:
1. **Given** file is 100MB and maxSize is 50MB, **When** validating, **Then** invalid (too_large)
2. **Given** file is 5MB and maxSize is 50MB, **When** validating, **Then** valid

### US3 - Dimension Validation (Priority: P2)

**Goal**: Reject unreasonably large dimensions

**Acceptance Scenarios**:
1. **Given** dimension > 20000px, **When** validating, **Then** optional warning
2. **Given** dimension 5000px, **When** validating, **Then** valid

## Requirements

- **FR-001**: MUST validate Content-Type is image/*
- **FR-002**: MUST reject size > maxSize (default: 50MB)
- **FR-003**: Default allowed types: jpeg, png, webp
- **FR-004**: Validation is non-blocking (async)

## Success Criteria

- Valid images always cached
- Invalid types rejected before cache
- Size limit enforced accurately