# Feature Specification: Fix Duplicate IndexedDB Databases

**Feature Branch**: `006-fix-duplicate-indexeddb`  
**Created**: 2026-04-06  
**Status**: Draft  
**Input**: "se estan generando 2 bases de datos en indexeddb carbon-image-cache y cloud-image-cache"

## Problem Statement

The application is creating two separate IndexedDB databases:
1. `carbon-image-cache` (used by Service Worker sw.ts)
2. `cloud-image-cache` (used by Service Worker sw.js and Web Adapter)

This causes:
- Duplicate cache entries
- Wasted storage space
- Inconsistent cache behavior
- Confusion for developers debugging in DevTools

## Root Cause Analysis

| File | DB_NAME | Notes |
|------|---------|-------|
| `packages/cloud/src/service-worker/sw.ts` | `carbon-image-cache` | Original TypeScript SW |
| `packages/cloud/src/service-worker/sw.js` | `cloud-image-cache` | Pre-built JS SW |
| `packages/cloud/src/adapters/web.ts` | `cloud-image-cache` | Web adapter |

The Service Worker is loading from `sw.js` (pre-built) but the Web Adapter uses a different database name.

## Solution

Unify all IndexedDB operations to use a single database name: `cloud-image-cache`.

### Files to Modify

1. `packages/cloud/src/service-worker/sw.ts` - Change `carbon-image-cache` → `cloud-image-cache`
2. Rebuild `sw.js` from source

## Acceptance Criteria

- [ ] Only one IndexedDB database exists: `cloud-image-cache`
- [ ] Service Worker and Web Adapter share the same cache
- [ ] Cache persists correctly across page refreshes
- [ ] No duplicate entries after fix

## User Scenarios & Testing

### Scenario 1: Verify Single Database

**Given** the application is running, **When** opening DevTools → Application → IndexedDB, **Then** only `cloud-image-cache` should exist.

### Scenario 2: Cache Sharing

**Given** an image is cached via Service Worker, **When** the SW is disabled and page refreshes, **Then** the image should still load from the Web Adapter (same database).

## Requirements

- **FR-001**: All cache operations MUST use `cloud-image-cache` database
- **FR-002**: Service Worker and Web Adapter MUST share the same cache
- **FR-003**: Existing cached data may need migration or clear
