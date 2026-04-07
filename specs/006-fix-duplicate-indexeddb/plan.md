# Implementation Plan: Fix Duplicate IndexedDB Databases

**Branch**: `006-fix-duplicate-indexeddb` | **Date**: 2026-04-06 | **Spec**: `/specs/006-fix-duplicate-indexeddb/spec.md`

## Summary

Fix the issue where two IndexedDB databases are created (`carbon-image-cache` and `cloud-image-cache`) by unifying all cache operations to use a single database name.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)  
**Primary Dependencies**: React 18+, @cloudimage/cloud, idb library  
**Storage**: IndexedDB  
**Testing**: Manual verification in Chrome DevTools  
**Target Platform**: Web

## Root Cause

| File | Current DB_NAME | Should Be |
|------|-----------------|-----------|
| `src/service-worker/sw.ts` | `carbon-image-cache` | `cloud-image-cache` |
| `src/service-worker/sw.js` | `cloud-image-cache` | (rebuild from ts) |
| `src/adapters/web.ts` | `cloud-image-cache` | (keep) |

## Project Structure

```text
packages/cloud/
├── src/
│   ├── service-worker/
│   │   ├── sw.ts          # NEEDS FIX: change DB_NAME
│   │   └── sw.js          # Auto-generated from ts
│   └── adapters/
│       └── web.ts         # OK: already uses cloud-image-cache
```

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| Library-First (I) | ✅ PASS | Fixing internal library consistency |
| Observability (II) | ✅ PASS | Cleaner DevTools for users |

## Tasks

See tasks.md for detailed implementation steps.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | Simple find/replace | N/A |
