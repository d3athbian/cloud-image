# Contracts: State Sync

## Internal Interface

### StateSync API

```typescript
interface StateSyncConfig {
  dbName?: string;
  onSyncError?: (error: Error) => void;
}

class StateSync {
  constructor(config?: StateSyncConfig);

  // Write state to both memory and IndexedDB
  async syncState(key: string, value: object): Promise<void>;

  // Read from IndexedDB
  async readState<T>(key: string): Promise<T | null>;

  // Force sync all pending writes
  async flush(): Promise<void>;

  // Load persisted state to atoms
  async hydrate(): Promise<void>;

  // Check if online
  isOnline(): boolean;
}
```

### Usage in Providers

```typescript
import { syncState } from "@cloudimage/cloud/state-sync";

// Write with automatic sync
await syncState("cache", {
  totalItems: cache.totalItems,
  hitCount: cache.hitCount,
  missCount: cache.missCount,
  lastAccessTime: Date.now(),
});

// Read persisted state on init
const savedCache = await readState("cache");
if (savedCache) {
  setCacheAtom(savedCache);
}
```

### IndexedDB Schema

**Database:** `cloud-state`

**Object Store:** `state`

| Index | Type | Unique |
|-------|------|-------|
| key | string | Yes |

**Value Structure:**

```typescript
{
  data: object;
  timestamp: number;
}
```

## Events

| Event | When | Payload |
|-------|------|---------|
| sync:complete | After successful sync | { key, timestamp } |
| sync:error | After failed sync | { key, error } |
| hydrate:complete | After hydration | { keys: string[] } |