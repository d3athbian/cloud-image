# Data Model: DebuggerTool

## Entities

### DebuggerState

```typescript
interface DebuggerState {
  isOpen: boolean;
  activeTab: 'cache' | 'network' | 'performance';
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  isExpanded: boolean;
}
```

**Defaults**:
```typescript
const DEFAULT_STATE: DebuggerState = {
  isOpen: false,
  activeTab: 'cache',
  position: 'bottom-left',
  isExpanded: true,
}
```

---

### CacheEntry (display data)

```typescript
interface CacheEntry {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  status: number;
  size: number;
  timestamp: number;
  ttl: number | null;
  cached: boolean;
}
```

---

### NetworkRequest (display data)

```typescript
interface NetworkRequest {
  id: string;
  url: string;
  method: string;
  status: number;
  duration: number;
  timestamp: number;
}
```

---

### PerformanceMetrics (display data)

```typescript
interface PerformanceMetrics {
  cacheHitRate: number;
  avgResponseTime: number;
  totalRequests: number;
  activeRequests: number;
}
```

---

## State Transitions

```
┌─────────┐    toggle    ┌──────────┐
│ Closed  │─────────────►│  Open    │
└─────────┘              └──────────┘
     ▲                        │
     │         toggle          │
     └────────────────────────┘
```

Tabs: cache ↔ network ↔ performance (no intermediate states)

---

## Validation Rules

- `position` must be one of 4 valid positions
- `activeTab` must be a valid tab name
- `initialIsOpen` defaults to false