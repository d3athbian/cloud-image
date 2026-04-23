# Research: Jotai Atoms for Reactive Global State

## Decisions

### Decision 1: Usar Jotai para estado global reactivo

**Rationale**: Jotai proporciona re-renderizado selectivo automático - cada átomo es independientes y solo el componente que escucha un átomo específico se re-renderiza cuando ese átomo cambia. Esto es la ventaja principal sobre React Context.

**Alternatives considered**:
- Zustand: Más para stores, no tan granular como átomos
- Recoil: Descontinuado, no mantener
- React Context: Re-renderiza todos los consumidores cuando cualquier valor cambia (el problema que solves)

---

### Decision 2: API de debugging vía extensión de átomos

**Rationale**: Jotai permite crear átomos derivados (derived atoms) que pueden exponer el estado para debugging sin mutar el estado real.

**Implementation**: Crear debugAtoms que lee snapshot del store principal.

---

### Decision 3: Memory API - fallback graceful

**Rationale**: `performance.memory` solo está disponible en Chrome/Chromium. Otros navegadores no lo soportan.

**Implementation**: verificar `performance.memory` existe antes de usar. En Safari/Firefox, usar heuristics alternativos (viewport size, device memory API).

---

## Best Practices

### Jotai Integration

1. **Definir átomos en módulo centralizado**: `src/core/system-atoms.ts`
2. **Usar Jotai Provider wrap React Provider**: Provider existente de lalibrae envuelve el Jotai Store
3. **Mantener setters privados**: Solo funciones específicas pueden actualizar átomos
4. **Tests de re-renderizado**: Verificar que componente no re-renderiza cuando átomo no relacionado cambia

### Browser Compatibility

- `navigator.onLine`: Bien soportado en todos los navegadores modernos
- `performance.memory`: Solo Chrome
- `navigator.deviceMemory`: Solo Chrome/Edge

---

## Phase 0 Complete

All NEEDS CLARIFICATION resolved:
- ✅ Observability: debugAtoms via派生Atoms
- ✅ No new deps: Jotai (~2KB) justificado por benefit de re-renderizado selectivo