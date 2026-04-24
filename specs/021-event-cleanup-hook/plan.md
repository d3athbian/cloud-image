# PLAN.md - 021-event-cleanup-hook

## Tech Stack
- TypeScript 5.x (strict mode)
- React 18+
- Vitest (testing)

## Estructura de Archivos

```
packages/cloud/src/
├── react/
│   └── hooks/
│       └── useCleanupEffect.ts    # NUEVO
├── core/
│   └── network.ts            # MODIFICAR
└── react/
    └── image.tsx             # MODIFICAR
```

## Implementación

### 1. useCleanupEffect Hook
Simple wrapper para useEffect que asegura cleanup:
```typescript
export function useCleanupEffect(
  effect: () => (() => void) | void,
  deps?: unknown[]
): void
```

### 2. NetworkMonitor Cleanup
El método `destroy()` ya existe pero es incompleto:
- Agregar removeEventListener para window online/offline
- Agregar removeEventListener para connection API change

### 3. CloudImage Cleanup
- Cancelar AbortController en cleanup del useEffect de carga