# Data Model: State Sync

## Entities

### StateSync

Centralized mechanism that intercepts writes and coordinates memory + persistence sync.

**Properties:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| db | IDBPDatabase | Yes | IndexedDB instance |
| queue | PendingWrite[] | Yes | Offline write queue |
| online | boolean | Yes | Network online status |

**Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| syncState | key: string, value: object | Promise<void> | Write to atom + IndexedDB |
| readState | key: string | Promise<object> | Read from IndexedDB |
| flush | - | Promise<void> | Force sync pending writes |
| hydrate | - | Promise<void> | Load persisted state to atoms |

---

### PendingWrite

Queued write for offline retry.

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| key | string | State key (cache, network, memory) |
| value | object | State value to persist |
| timestamp | number | When write occurred |
| retries | number | Attempt count |

---

### StateStore

IndexedDB store schema.

**Object Store:** `state`

| Field | Type | Key Path | Description |
|-------|------|---------|-------------|
| key | string | Yes | State key (cache, network, memory) |
| value | object | No | State value |
| timestamp | number | No | Last update time |

---

## State Transitions

### Write Flow

```
App Write → StateSync.syncState() 
  → Update Jotai Atom 
  → Write to IndexedDB 
  → Success? Done
  → Failure? Add to queue
  
Offline Detected → Queue writes
  → When online → flush() → retry
```

### Startup Flow

```
App Start → StateSync.hydrate()
  → Load state from IndexedDB
  → For each key present:
    → Set atom value
  → For keys not in DB:
    → Keep default values
```

---

## Validation Rules

1. **syncState**: Both memory and IndexedDB must update, or queue for retry
2. **hydrate**: Persisted values take precedence over defaults
3. **queue**: Max 10 entries, oldest dropped if exceeded
4. **timestamp**: Always included for conflict resolution