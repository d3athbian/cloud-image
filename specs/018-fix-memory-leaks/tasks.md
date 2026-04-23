# Tasks: 018-fix-memory-leaks

**Created**: 2026-04-22
**Feature**: [spec.md](./spec.md)

## Task Breakdown (Granular)

### FR-004: Cache-Control Header en Respuestas Cacheadas

- [x] **T-001** (P1): Agregar header `Cache-Control: public, max-age=31536000, immutable` a `createCachedResponse()` en `sw.ts:560-565`
- [x] **T-002** (P2): Agregar mismo header al Response del circuit breaker fallback en `sw.ts:490`

### FR-001: Cleanup de Event Listeners y Async Operations

- [ ] **T-003** (P2): Agregar `AbortController` al useEffect de carga de imagen en `image.tsx:150-270` para cancelar fetch in-flight al unmount
- [ ] **T-004** (P3): Null `networkMonitorRef.current` y `observerRef.current` después del cleanup en `image.tsx`

### FR-001: Service Worker Resource Management

- [ ] **T-005** (P2): Agregar `AbortController` al fallback `fetch(url)` en circuit breaker en `sw.ts:540`

### Testing

- [ ] **T-006** (P2): Tests: ciclo mount/unmount 10x debe producir 0 orphan listeners (SC-001, SC-002)
- [ ] **T-007** (P2): Test integración: respuesta cacheada debe incluir header Cache-Control (SC-003)

## Implementation Notes

| Task | File | Status |
|------|------|--------|
| T-001 | sw.ts:560-565 | **MISSING** - Cache-Control no agregado |
| T-002 | sw.ts:490 | **MISSING** - Fallback sin Cache-Control |
| T-003 | image.tsx:150-270 | **GAP** - No hay AbortController para async |
| T-004 | image.tsx:91-127 | **MINOR** - Refs no nulledos post-cleanup |
| T-005 | sw.ts:540 | **MINOR** - Fallback fetch sin AbortController |
| T-006 | tests/ | **TODO** |
| T-007 | tests/ | **TODO** |

## Notes

- useIntersectionObserver.ts: cleanup correcto ✅
- image.tsx subscriptions: cleanup correcto ✅  
- Service Worker isImageURL: excluye API por diseño ✅
- Gap principal: Cache-Control header missing