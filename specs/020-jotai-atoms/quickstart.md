# Quickstart: Jotai Atoms

## Install
```bash
npm install jotai @cloudimage/cloud
```

## Basic Usage

### 1. Wrap your app with Provider
```tsx
import { CloudProvider } from '@cloudimage/cloud/react';

<CloudProvider>
  <YourApp />
</CloudProvider>
```

### 2. Read atoms in components
```tsx
import { useAtomValue } from 'jotai';
import { cacheAtom, networkAtom, memoryAtom } from '@cloudimage/cloud/core';

// Network status
const NetworkBadge = () => {
  const { status } = useAtomValue(networkAtom);
  return <span className={`badge-${status}`}>{status}</span>;
};

// Cache stats
const CacheCounter = () => {
  const { hitCount, missCount } = useAtomValue(cacheAtom);
  return (
    <div>
      Hits: {hitCount} | Misses: {missCount}
    </div>
  );
};

// Memory warning
const MemoryWarning = () => {
  const { isUnderPressure, pressureLevel } = useAtomValue(memoryAtom);
  if (!isUnderPressure) return null;
  return <div className="warning">Memory: {pressureLevel}</div>;
};
```

---

## API Reference

| Atom | Fields | Update Source |
|------|-------|---------------|
| `cacheAtom` | totalItems, hitCount, missCount, lastAccessTime | cache.ts |
| `networkAtom` | status, rtt, lastChecked | network.ts + window listeners |
| `memoryAtom` | isUnderPressure, pressureLevel | memory.ts + interval |