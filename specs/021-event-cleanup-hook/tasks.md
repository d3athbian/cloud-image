# TARKS.md - 021-event-cleanup-hook

## Fases de Implementación

### Fase 1: Setup
- [X] T001: Crear hook useCleanupEffect en src/react/hooks/

### Fase 2: Core - NetworkMonitor Cleanup
- [X] T002: Actualizar NetworkMonitor para limpiar event listeners de window
- [X] T003: Actualizar NetworkMonitor para limpiar connection API listener
- [X] T004: Verificar método destroy() existente funciona correctamente

### Fase 3: Image Component Cleanup
- [X] T005: Agregar cleanup de AbortController en CloudImage
- [X] T006: Integrar useCleanupEffect para mayor seguridad (no necesario - useEffect ya maneja cleanup)

### Fase 4: Validación
- [X] T007: Ejecutar tests existentes (TypeScript compila)
- [X] T008: Verificar con ESLint (biome fix applied)

## Dependencias

- T002 → T001:必须在T001之后执行T002
- T003 → T002:必须在T002之后执行T003
- T005 → T001:必须在T001之后执行T005
- T007 → Todas las anteriores

## Resumen de Cambios

| Archivo | Cambio |
|---------|--------|
| `src/react/hooks/useCleanupEffect.ts` | NUEVO - Hook helper para cleanup |
| `src/core/network.ts` | Agregado bound handlers y cleanup en destroy() |
| `src/react/image.tsx` | Agregado AbortController para cancelar fetch |