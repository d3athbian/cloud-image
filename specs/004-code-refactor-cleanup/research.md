# Research: Code Refactor Decisions

**Date**: 2026-03-23

## Decision 1: Unused Variables Approach

**Issue**: 27 TypeScript unused variable warnings

**Decision**: Remove all unused variables directly
- No need for research - straightforward cleanup
- Will use `npx tsc --noEmit` to verify

**Rationale**: TypeScript's noUnusedLocals/noUnusedParameters are enabled. Clean code = maintainable.

---

## Decision 2: Code Duplication - generateMessageId/createSWRequest

**Issue**: service-worker/index.ts and service-worker/sw.ts both define these

**Decision**: Keep in service-worker/index.ts (client side), remove from sw.ts (server side)

**Rationale**: 
- sw.ts runs in Service Worker context - different needs
- index.ts is the client library that communicates with SW
- No need to share these functions

---

## Decision 3: Retry Logic Duplication

**Issue**: service-worker/sw.ts has fetchWithRetry vs core/retry.ts RetryHandler

**Decision**: Import core/retry.ts RetryHandler in service-worker/sw.ts

**Rationale**:
- core/retry.ts is well-tested and modular
- Avoid duplicating retry logic
- Reuse existing code

---

## Decision 4: IndexedDB Implementation

**Issue**: sw.ts uses raw IndexedDB API, web.ts uses idb library

**Decision**: Keep separate - different contexts

**Rationale**:
- Service Worker runs in isolated context, may not have idb library
- Web adapter runs in main thread, can use idb
- Both achieve same goal, no need to unify

---

## Decision 5: Inline Script Removal

**Issue**: CloudProvider injects script inline for SW registration

**Decision**: Already resolved - use external register.js

**Rationale**:
- Inline script already moved to register.js
- CloudProvider can continue to work (fallback mode)
- Users with CSP can use external script

---

## Alternatives Considered

1. **Keep inline script**: Rejected - violates CSP
2. **Remove SW entirely**: Rejected - core feature
3. **Unify IndexedDB**: Rejected - different contexts
