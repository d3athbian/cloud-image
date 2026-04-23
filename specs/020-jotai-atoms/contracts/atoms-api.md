# Contracts: Jotai Atoms API

## Public API (exports from library)

### Atoms (readable via useAtomValue)
```typescript
// package exports
export { cacheAtom } from './core/system-atoms';
export { networkAtom } from './core/system-atoms';
export { memoryAtom } from './core/system-atoms';
```

### Usage Contract
```typescript
// Componente consume átomo
import { useAtomValue } from 'jotai';
import { cacheAtom, networkAtom, memoryAtom } from '@cloudimage/cloud/core';

// Solo re-renderiza cuando cacheAtom cambia
const CacheStats = () => {
  const cache = useAtomValue(cacheAtom);
  return <div>{cache.hitCount} hits</div>;
};
```

### Provider Contract
```typescript
// Provider debe envolver app con Jotai Provider
import { CloudProvider } from '@cloudimage/cloud/react';

<CloudProvider>
  <App />
</CloudProvider>
```

---

## Behavior Contracts

| Scenario | Expected Behavior |
|----------|-------------------|
| component reads cacheAtom | Re-renderiza solo cuando cacheAtom.hitCount cambia |
| network goes offline | UI refleja mudança dentro de 500ms |
| memory pressure detected | Banner muestra cuando pressureLevel != 'low' |
| app unmounts | Todos los listeners limpiados |
| component unmounts while atom updating | No memory leak |