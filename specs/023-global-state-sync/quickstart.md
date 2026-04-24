# QuickStart: State Sync

## Installation

StateSync comes with `@cloudimage/cloud` package. No additional installation needed.

```typescript
import { StateSync, syncState, readState } from "@cloudimage/cloud";
```

## Basic Usage

### Creating StateSync Instance

```typescript
const stateSync = new StateSync({
  dbName: "cloud-state",
  onSyncError: (error) => console.error("Sync failed:", error),
});
```

### Writing State (Automatic Sync)

```typescript
// Updates both Jotai atom AND IndexedDB automatically
await syncState("cache", {
  totalItems: 10,
  hitCount: 5,
  missCount: 5,
  lastAccessTime: Date.now(),
});
```

### Reading Persisted State

```typescript
// Load on app startup
async function initApp() {
  const savedCache = await readState("cache");
  if (savedCache) {
    setCacheAtom(savedCache);
  }

  const savedNetwork = await readState("network");
  if (savedNetwork) {
    setNetworkAtom(savedNetwork);
  }
}
```

### Forcing Sync

```typescript
// Manually flush pending writes
await stateSync.flush();
```

## Integration with System Atoms

The system atoms already include sync. Just use setXxxAtom as before:

```typescript
import { setCacheAtom, setNetworkAtom } from "@cloudimage/cloud";

// These now automatically sync to IndexedDB
setCacheAtom({ totalItems: 10, hitCount: 5, ... });
setNetworkAtom({ status: "ONLINE", rtt: 50, ... });
```

## Handling Offline

StateSync automatically queues writes when offline:

1. Write succeeds in memory (UI updates immediately)
2. IndexedDB write fails → queued for later
3. When online, automatic flush happens

```typescript
// Check if online
if (stateSync.isOnline()) {
  // Immediate sync
} else {
  // Will sync when back online
}
```

## Best Practices

1. **Initialize early**: Call `hydrate()` on app startup before rendering
2. **Use setXxxAtom**: Prefer atoms over direct stateSync for automatic sync
3. **Handle errors**: Provide `onSyncError` for logging
4. **Test offline**: Use Chrome DevTools → Network to test offline behavior