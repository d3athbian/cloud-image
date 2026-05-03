# Data Model: Panel UI Improvements

## Overview

This document captures the UI layer data structures for the DevTools panel. Core business logic entities remain unchanged in `packages/cloud/src/core/`.

## New UI Entities

### DevToolsUIState

```typescript
interface DevToolsUIState {
  isOpen: boolean;
  activeTab: 'cache' | 'network' | 'performance' | 'state';
  selectedItemUrl: string | null;
  logsFilter: LogLevel | 'ALL';
}
```

### CacheItemMetadata (from design spec)

```typescript
interface CacheItemMetadata {
  url: string;
  key: string;
  size: number;          // Bytes
  mimeType: string;
  cachedAt: number;      // Epoch ms
  accessedAt: number;     // Epoch ms
  accessCount: number;
  ttl: number;           // Ms (total TTL configured)
  expiresIn: number;     // Ms remaining
  lruScore: number;      // Float 0.0 - 1.0
  status: 'active' | 'expired' | 'evicted' | 'pinned';
  source: 'sw' | 'idb' | 'memory';
}
```

### NetworkState (from design spec)

```typescript
interface NetworkState {
  online: boolean;
  rtt: number | null;    // Ms
  downlink: number | null; // Mbps
  effectiveType: string | null;
  circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}
```

### PerformanceMetrics (from design spec)

```typescript
interface PerformanceMetrics {
  workerStatus: 'Idle' | 'Active' | 'Terminated';
  decodeTimeMs: number;
  swStatus: 'Active' | 'Installing' | 'Error';
}
```

### LogEntry (from design spec)

```typescript
type LogLevel = 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  id: string;
  timestamp: number;     // Epoch ms
  level: LogLevel;
  message: string;
  context?: string;      // URL or ID truncated
}
```

## Jotai Atoms (UI State)

### New Atoms (debugger/store/)

```typescript
// UI State
export const devToolsOpenAtom = atom<boolean>(false);
export const activeTabAtom = atom<'cache' | 'network' | 'performance' | 'state'>('cache');
export const selectedItemUrlAtom = atom<string | null>(null);

// Logs
export const logsAtom = atom<LogEntry[]>([]);
export const logsFilterAtom = atom<LogLevel | 'ALL'>('ALL');
export const filteredLogsAtom = atom((get) => {
  const filter = get(logsFilterAtom);
  const logs = get(logsAtom);
  if (filter === 'ALL') return logs;
  return logs.filter(l => l.level === filter);
});
```

### Existing Atoms (consumed, not modified)

```typescript
// From existing debugger/hooks/useDebuggerState.ts
// cacheAtom, cacheStatsAtom, networkAtom, memoryAtom - READ ONLY
```

## Key Relationships

```
DevToolsLayout
├── Topbar (status indicators from existing atoms)
├── MainContent
│   └── CacheGrid
│       └── CacheCard[] (memoized, each shows CacheItemMetadata)
├── SidePanel
│   ├── ImageDetails (observes selectedItemUrlAtom)
│   └── LoggerPanel (uses logsAtom)
└── BottomPanel
    ├── StateViewer (reads existing atoms)
    └── QuickActions (dispatches to engine via window.__CLOUD_ENGINE__)
```

## Validation Rules

| Entity | Field | Rule |
|--------|-------|------|
| CacheItemMetadata | lruScore | 0.0 ≤ value ≤ 1.0 |
| CacheItemMetadata | status | One of: 'active', 'expired', 'evicted', 'pinned' |
| LogEntry | level | One of: 'INFO', 'WARN', 'ERROR' |
| logsAtom | length | Auto-truncate at 500 entries (FIFO) |

## State Transitions

### Tab States
- User clicks tab → `activeTabAtom` updates → component conditionally renders

### CacheCard Selection
- Click CacheCard → `selectedItemUrlAtom` set to item.url → ImageDetails observes and displays

### Logger Filter
- Click filter button → `logsFilterAtom` updates → `filteredLogsAtom` derives filtered list

## Data Flow

```
IndexedDB (existing)
    ↓ reads
useCacheExplorer hook
    ↓ returns CacheItemMetadata[]
CacheGrid component
    ↓ renders (memoized)
CacheCard components
    ↓ click selects
selectedItemUrlAtom (Jotai)
    ↓ observes
ImageDetails panel
```

---

*No changes to core entities - only UI layer data structures added*