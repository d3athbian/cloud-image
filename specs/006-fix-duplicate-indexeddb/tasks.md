---

description: "Task list for fixing duplicate IndexedDB databases issue"
---

# Tasks: Fix Duplicate IndexedDB Databases

**Input**: spec.md, plan.md from `/specs/006-fix-duplicate-indexeddb/`
**Purpose**: Unify all cache operations to use single database name

## Format: `[ID] [P?] Description`

- [X] T001 Change DB_NAME in packages/cloud/src/service-worker/sw.ts from 'carbon-image-cache' to 'cloud-image-cache'
- [X] T002 Rebuild library to regenerate sw.js from updated sw.ts
- [X] T003 Copy updated SW files to demo (already done in implementation step)
- [ ] T004 [P] Clear old IndexedDB databases in Chrome DevTools
- [ ] T005 Verify only cloud-image-cache exists after fix
- [ ] T006 Test cache persistence and SW fallback

---

## Implementation

### T001: Change DB_NAME in sw.ts

File: `packages/cloud/src/service-worker/sw.ts`

```diff
- const DB_NAME = 'carbon-image-cache';
+ const DB_NAME = 'cloud-image-cache';
```

### T002: Rebuild Library

```bash
cd packages/cloud && npm run build
```

This regenerates `dist/sw.js` from the updated TypeScript source.

### T003: Clear Old Databases

1. Open Chrome DevTools → Application → IndexedDB
2. Right-click each database and delete:
   - `carbon-image-cache` (old)
   - `cloud-image-cache` (may have old data)
3. Refresh page to start fresh

### T004: Verify Fix

After clearing, only `cloud-image-cache` should be created.

### T005-T006: Functional Tests

Verify the cache still works correctly after the fix.

---

## Notes

- The Web Adapter (src/adapters/web.ts) already uses `cloud-image-cache` - no changes needed
- Only sw.ts needed the fix
- Rebuilding regenerates sw.js automatically via vite plugin
