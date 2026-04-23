# Data Model: Jotai Atoms

## Entities

### cacheAtom
```typescript
interface CacheState {
  totalItems: number;      // Total de items en cache
  hitCount: number;      // Veces que se usó item caching
  missCount: number;     // Veces que se buscó y no estaba
  lastAccessTime: number; // timestamp del último acceso
}
```

**Validation**: 
- totalItems >= 0
- hitCount >= 0, missCount >= 0
- lastAccessTime: timestamp UNIX válido

---

### networkAtom
```typescript
type NetworkStatus = 'ONLINE' | 'OFFLINE' | 'LOW_BANDWIDTH';

interface NetworkState {
  status: NetworkStatus;
  rtt: number;           // Round-trip time en ms
  lastChecked: number; // timestamp
}
```

**Validation**:
- status: uno de los valores válidos
- rtt >= 0 (0 = no medido)

---

### memoryAtom
```typescript
type PressureLevel = 'low' | 'medium' | 'high';

interface MemoryState {
  isUnderPressure: boolean;
  pressureLevel: PressureLevel;
  usedJSHeapSize?: number;   // bytes (Chrome only)
  jsHeapSizeLimit?: number; // bytes (Chrome only)
}
```

**Validation**:
- isUnderPressure: boolean
- pressureLevel: uno de 'low' | 'medium' | 'high'

---

## State Transitions

### networkAtom
```
ONLINE <-> OFFLINE <-> LOW_BANDWIDTH
         (basado en navigator.onLine + RTT)
```

### memoryAtom
```
low <-> medium <-> high
      ^              |
      |______________|
   (basado en % de memory usado)
```

---

## Key Relationships

| From | To | Relationship |
|------|-----|--------------|
| Provider | cacheAtom | Inicializa, conecta cache.ts setter |
| Provider | networkAtom | Listener online/offline |
| Provider | memoryAtom | Interval memory check |
| Components | Atoms | useAtomValue(atom) |