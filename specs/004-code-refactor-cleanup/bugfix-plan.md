# Bug Fix Plan - Critical Errors Found

**Feature Branch**: `004-code-refactor-cleanup`
**Created**: 2026-04-05
**Status**: Draft
**Total Bugs**: 15 (5 CRITICAL, 10 HIGH/MEDIUM)

---

## Executive Summary

During code analysis of the `packages/cloud/src` directory, 15 bugs were identified. 5 are CRITICAL (cause data corruption or incorrect behavior), 10 are HIGH/MEDIUM (performance issues, potential future bugs).

**Recommendation**: Fix all CRITICAL bugs before any new feature work.

---

## Critical Bugs (Fix Immediately)

### Bug #1: Inverted hit/miss logic in cache.ts

**File**: `packages/cloud/src/core/cache.ts`
**Line**: 64-76
**Severity**: CRITICAL

**Problem**:
```typescript
if (adapterEntry && !this.isExpired(adapterEntry)) {
  this.misses++;  // ❌ Should be hits++
  this.updateRates();
  // ... cache hit behavior
}
```

When getting from adapter succeeds, it counts as miss instead of hit. This corrupts cache statistics.

**Fix**:
```typescript
if (adapterEntry && !this.isExpired(adapterEntry)) {
  this.hits++;  // ✅ Correct
  this.updateRates();
  // ... cache hit behavior
}
```

---

### Bug #2: Double-counting size in cache.ts

**File**: `packages/cloud/src/core/cache.ts`
**Line**: 121
**Severity**: CRITICAL

**Problem**:
```typescript
// In set() method
if (existingEntry) {
  this.stats.totalSize -= existingEntry.metadata.size;  // ✅ Subtraction here
}

this.stats.totalSize += entry.metadata.size;  // ❌ But adds full size, not delta
```

When updating an existing entry, should add the *difference* not the full size.

**Fix**:
```typescript
if (existingEntry) {
  this.stats.totalSize -= existingEntry.metadata.size;
  this.stats.totalSize += (entry.metadata.size - existingEntry.metadata.size);
} else {
  this.stats.totalSize += entry.metadata.size;
}
```

Or simpler: always subtract first, then add full (if new) or delta (if update).

---

### Bug #3: Inverted hit counter in fallback mode

**File**: `packages/cloud/src/service-worker/index.ts`
**Line**: 159
**Severity**: CRITICAL

**Problem**:
```typescript
// In fallbackMessage for 'fetch':
this.memoryCache.set(url, { data: arrayBuffer, metadata: {...} });
this.stats.itemCount = this.memoryCache.size;
this.stats.hits++;  // ❌ Getting from NETWORK, not cache - should be misses++
```

When getting from network in fallback mode, it incorrectly counts as hit.

**Fix**:
```typescript
this.stats.misses++;  // ✅ Correct
```

---

### Bug #4: Direct mutation in useMemo (hooks.tsx)

**File**: `packages/cloud/src/react/hooks.tsx`
**Line**: 131-144
**Severity**: CRITICAL

**Problem**:
```typescript
const network: NetworkStatus = useMemo(() => ({
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  bandwidth: 'unknown',
}), []);

// Later in useEffect:
network.online = true;  // ❌ Mutates memoized object directly
network.online = false; // ❌ No re-render triggered
```

This breaks React's immutability and won't trigger re-renders.

**Fix**:
```typescript
// Option 1: Use useState
const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
  online: true,
  bandwidth: 'unknown',
});

// Option 2: Use context properly with useEffect subscribing
useEffect(() => {
  const handleOnline = () => setNetworkStatus(prev => ({ ...prev, online: true }));
  const handleOffline = () => setNetworkStatus(prev => ({ ...prev, online: false }));
  // ...
}, []);
```

---

### Bug #5: Memory leak in timeout

**File**: `packages/cloud/src/service-worker/index.ts`
**Line**: 116-119
**Severity**: HIGH

**Problem**:
```typescript
setTimeout(() => {
  this.pending.delete(request.id);
  reject(new Error(`Message ${type} timed out`));
}, 30000);
// Timeout never cleared if request completes in time
```

If request completes before 30s, the timeout still fires and tries to delete from pending map.

**Fix**:
```typescript
const timeoutId = setTimeout(() => {
  this.pending.delete(request.id);
  reject(new Error(`Message ${type} timed out`));
}, 30000);

// Store timeoutId and clear in success handler
// Need to modify Promise executor to capture resolve/reject + timeoutId
```

---

## High Priority Bugs

### Bug #6: No re-verify after eviction

**File**: `packages/cloud/src/core/cache.ts`
**Line**: 105-107

**Problem**: After running eviction, doesn't re-check if still at 90% threshold.

**Fix**: Loop until under threshold or no more evictable entries.

---

### Bug #7: Race condition in dual scoring

**File**: `packages/cloud/src/core/cache.ts`
**Line**: 196-247

**Problem**: Multiple concurrent accesses to cache can corrupt scoring.

**Fix**: Add simple mutex/lock using Promise-based queue.

---

### Bug #8: Race condition in circuit breaker

**File**: `packages/cloud/src/core/circuit-breaker.ts`
**Line**: 40-47

**Problem**: Concurrent failures can cause multiple state transitions.

**Fix**: Add synchronization to state transitions.

---

### Bug #9: Non-atomic read-modify-write in adapter

**File**: `packages/cloud/src/adapters/web.ts`
**Line**: 51-54

**Problem**: 
```typescript
entry.metadata.accessedAt = Date.now();
entry.metadata.accessCount++;
await db.put(STORE_NAME, entry);
```

Not atomic - can lose updates in concurrent scenarios.

**Fix**: Use transaction with read-write, or use IDBRequest success callback.

---

### Bug #10: Unlimited retry queue

**File**: `packages/cloud/src/core/network.ts`
**Line**: 189-213

**Problem**: No maxRetries limit in retry queue.

**Fix**: Add maxQueueSize and maxRetriesPerItem.

---

### Bug #11: No size limit in fallback memory cache

**File**: `packages/cloud/src/service-worker/index.ts`
**Line**: 160

**Problem**: Memory cache in fallback mode can grow infinitely.

**Fix**: Add LRU eviction with max size.

---

## Medium Priority Bugs

### Bug #12: Deduplication only works for sequential calls

**File**: `packages/cloud/src/core/engine.ts`
**Line**: 53-55

**Fix**: Use a more robust deduplication with request coalescing.

---

### Bug #13: Too many dependencies in useEffect

**File**: `packages/cloud/src/react/image.tsx`
**Line**: 217

**Fix**: Use useCallback for stable references, remove resolvedSrc from dependencies.

---

### Bug #14: Expensive sync operations in memory check

**File**: `packages/cloud/src/core/memory.ts`
**Line**: 48

**Fix**: Make getMetrics() async or cache result with TTL.

---

### Bug #15: Adapter state collision

**File**: `packages/cloud/src/adapters/`

**Fix**: Ensure each adapter instance is independent.

---

## Fix Priority Order

1. **Phase 1**: Fix bugs #1-5 (CRITICAL) - Affect data integrity
2. **Phase 2**: Fix bugs #6-11 (HIGH) - Affect reliability
3. **Phase 3**: Fix bugs #12-15 (MEDIUM) - Optimization

---

## Testing Strategy

After each bug fix:
1. Run `npm test` to verify no regressions
2. Run `npm run build` to verify compilation
3. For critical bugs, add specific unit test if not exists

---

## Notes

- Bugs identified through code review + Gemma 4 AI analysis
- Some bugs may be theoretical (need load testing to confirm impact)
- Consider adding integration tests for race conditions