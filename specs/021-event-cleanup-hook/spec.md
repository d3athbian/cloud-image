# SPEC.md - Hook de Limpieza de Eventos (useCleanupEffect)

## 1. Resumen del Problema

El componente `<CloudImage />` y el hook `useIntersectionObserver` tienen memory leaks porque los event listeners (network, resize, intersection observer) no se limpian correctamente cuando el componente se desmonta.

## 2. Problema Detallado

### 2.1 Memory Leks Identificados

| Archivo | Tipo de Listener | Problema |
|---------|----------------|---------|
| `src/react/image.tsx` | AbortController (fetch) | No se cancela en cleanup |
| `src/react/image.tsx` | IntersectionObserver | Limpia OK ✓ |
| `src/react/image.tsx` | NetworkMonitor subscribe | Limpia OK ✓ |
| `src/core/network.ts` | window.addEventListener("online") | Nunca se remueve |
| `src/core/network.ts` | window.addEventListener("offline") | Nunca se remueve |
| `src/core/network.ts` | connection.addEventListener("change") | Nunca se remueve |

## 3. Solución Propuesta

### 3.1 Crear useCleanupEffect Hook

```typescript
// src/react/hooks/useCleanupEffect.ts
export function useCleanupEffect(
  cleanupFn: () => void,
  deps?: unknown[]
): void
```

### 3.2 Modificar NetworkMonitor

- Agregar método `destroy()` existente pero incomplet
- Llamar `destroy()` cuando el provider se desmonte
- Remover listeners de window en destroy

## 4. Criterios de Éxito

- [ ] Memory leaks eliminados en CloudImage
- [ ] NetworkMonitor limpia todos sus listeners
- [ ] useIntersectionObserver mantiene su correcto cleanup
- [ ] Tests pasan sin memory leaks detectados

## 5. Módulos Táctiles

- `src/react/image.tsx`
- `src/react/hooks/useIntersectionObserver.ts`
- `src/core/network.ts`