# Guía de Gestión de Estado con Jotai en Carbon Image (Cloud)

Este documento es un manifiesto técnico diseñado para agentes y desarrolladores que necesitan modificar o extender la estructura del estado global manejado por **Jotai** en este proyecto.

## Arquitectura del Estado

En la librería `@cloudimage/cloud`, el estado se maneja utilizando Jotai para mantener un rendimiento alto (libre de re-renders innecesarios) y se persistirá localmente mediante IndexedDB (`StateSync`).

El archivo principal donde se definen los átomos es: `src/core/system-atoms.ts`.

### Flujo de Actualización

Cuando se requiere agregar una nueva métrica (ej. `totalSize`), el flujo debe contemplar las siguientes capas:

1. **La Interfaz de Estado (`CacheState`, `NetworkState`, etc.)**
   Se debe extender la interfaz en `system-atoms.ts` y proveer un valor por defecto en `initialCacheState`.
   
2. **El Átomo Derivado (Opcional pero Común)**
   Si la UI consume un átomo derivado (como `cacheStatsAtom`), se debe asegurar que este átomo extraiga la nueva propiedad del átomo base:
   ```typescript
   export const cacheStatsAtom = atom<CacheStatsDerived>((get) => {
     const cache = get(cacheAtom);
     return {
       // ...
       totalSize: cache.totalSize, // <- ¡No olvidar mapear el nuevo valor!
     };
   });
   ```

3. **El Origen de los Datos (El Engine / Service Worker)**
   Asegurarse de que `getStats()` en `ImageEngine` y las respuestas del Service Worker contengan y devuelvan la nueva propiedad.

### ⚠️ EL ERROR MÁS COMÚN: `Partial<State>` y las Múltiples Fuentes de Actualización

Este es el punto crítico que ocasionó bugs anteriores. Las funciones exportadas para actualizar el estado, como `updateCache()`, están diseñadas para aceptar objetos parciales (`Partial<CacheState>`):

```typescript
export function updateCache(data: Partial<CacheState>) { ... }
```

Esto significa que **si omites un valor en el payload de `updateCache`, Jotai mantendrá el valor anterior (o el default)**. 

Si agregas una propiedad como `totalSize` al sistema, **debes buscar en TODA la base de código (grep/search) las invocaciones a `updateCache` (y similares) y asegurarte de que estén enviando la nueva métrica.**

**Lugares frecuentes a revisar cuando se agrega una métrica al caché:**
1. `src/react/hooks/useEngineSync.ts`: Este hook sincroniza los eventos que emite el `ImageEngine`.
2. `src/react/hooks/useCacheStats.ts`: Este hook tiene un intervalo de refresco e invoca `updateCache` internamente.
3. `src/debugger/DebuggerTool.tsx`: Cuando el usuario hace un prefetch o limpia el caché, se llama a `updateCache` manualmente.

#### Ejemplo de un Fix Real:
Cuando se agregó `totalSize`, se actualizó `useEngineSync` pero se olvidó actualizar `useCacheStats`. El código quedó así:

**Incorrecto (Omitiendo totalSize):**
```typescript
updateCache({
  totalItems: s.itemCount,
  hitCount: s.hitCount,
  missCount: s.missCount,
  lastAccessTime: Date.now(),
});
```

**Correcto:**
```typescript
updateCache({
  totalItems: s.itemCount,
  totalSize: s.totalSize ?? 0, // <- Agregado requerido
  hitCount: s.hitCount,
  missCount: s.missCount,
  lastAccessTime: Date.now(),
});
```

## Checklist para Nuevos Campos en Jotai

Antes de dar por completado un cambio estructural en el estado:

- [ ] Modifiqué la interfaz principal en `system-atoms.ts`.
- [ ] Modifiqué el estado inicial en `system-atoms.ts`.
- [ ] Mapeé la nueva propiedad si existe un átomo derivado (ej. `cacheStatsAtom`).
- [ ] Agregué la propiedad al objeto retornado por `getStats()` del Engine / Service Worker.
- [ ] **Crucial:** Hice un `grep` de `updateCache` (o la función update correspondiente) y añadí la propiedad al payload en **todas** las llamadas.
- [ ] Compilé el proyecto usando `npm run build` en `packages/cloud`.
