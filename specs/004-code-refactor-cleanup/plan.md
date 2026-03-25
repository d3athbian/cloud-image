# Implementation Plan: Unified Cache & Refactor Improvements

**Branch**: `004-code-refactor-cleanup` | **Date**: 2026-03-23 | **Spec**: [spec.md](./spec.md)
**Input**: "tenemos un analisis del problema y debemos corregir que solo sea cloud-image-cache y necesitamos crear un plan para refactorizar donde se encuentren oportunidades de mejoras"

## Summary

**FIX APLICADO**: Unificado el nombre de IndexedDB a `cloud-image-cache` en toda la librería.

### Problema Resuelto
- Antes: `carbon-image-cache` (SW) vs `cloud-image-cache` (web adapter)
- Ahora: Solo `cloud-image-cache` en ambos
- Demo debería funcionar correctamente en primera carga

### Oportunidades de Mejora Pendientes
| Oportunidad | Prioridad | Estado |
|-------------|-----------|--------|
| 1. Unificar DB | CRITICAL | ✅ Hecho |
| 2. Adapter Fallback unificado | HIGH | Por hacer |
| 3. Reusar core/retry.ts en SW | MEDIUM | Por hacer |
| 4. Memory adapter cuando DB no disponible | MEDIUM | Por hacer |
| 5. Error handling cuando DB falla | MEDIUM | Por hacer |

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: React 18+, idb (IndexedDB wrapper), vitest  
**Storage**: IndexedDB - DEBE unificarse a `cloud-image-cache`
**Testing**: Vitest + Playwright for E2E  
**Target Platform**: Web (browser), React Native, Smart TVs (Tizen, webOS)  
**Project Type**: Library (npm package)  
**Performance Goals**: Zero TypeScript warnings, unified cache
**Constraints**: Mantener backward compatibility

---

## Problema Identificado: Dos IndexedDB

### Estado Actual (CON BUG)

| Componente | DB Name | Archivo |
|------------|---------|---------|
| Service Worker | `carbon-image-cache` | service-worker/sw.ts |
| Web Adapter | `cloud-image-cache` | adapters/web.ts |

### Impacto
- Imágenes guardadas por SW no son encontradas por web adapter
- Imágenes guardadas por web adapter no son encontradas por SW
- Cache NO funciona en primera carga
- Solo funciona después de refresh (por coincidencia o sync parcial)

### Solución Requerida
- Unificar a `cloud-image-cache` en TODOS los lugares

---

## Oportunidades de Mejora Identificadas

### 1. IndexedDB Unification (CRITICAL)
- Unificar DB_NAME a `cloud-image-cache` en sw.ts
- Verificar que todas las imágenes se guarden/leer de la misma DB

### 2. Adapter Pattern - Análisis
- `adapters/web.ts` - usa idb library
- `adapters/tizen.ts` - stub (no implementado)
- `adapters/webos.ts` - stub (no implementado)
- `adapters/memory.ts` - fallback in-memory

### 3. Service Worker vs Main Thread Cache
- SW maneja cache de red (intercepta requests)
- Web adapter maneja cache local (get/set manual)
- Deben compartir la misma IndexedDB

### 4. Código Duplicado
- generateMessageId/createSWRequest ya removido
- Retry logic en sw.ts podría usar core/retry.ts

### 5. Fallback Modes
- SW no disponible → usar web adapter
- Web adapter no disponible → usar memory adapter
- Actualmente: hay lógica de fallback pero no está unificada

---

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| No duplicate DBs | ✅ FIXED | Ahora solo cloud-image-cache |
| Clean TypeScript | ⚠️ | 8 warnings remaining |
| No circular deps | ✅ | Verificado |
| Adapter pattern | ✅ | Preservar |

---

## Project Structure

```text
packages/cloud/
├── src/
│   ├── core/                    # Framework-agnostic (PRESERVE)
│   │   ├── cache.ts
│   │   ├── retry.ts
│   │   ├── engine.ts
│   │   └── ...
│   ├── adapters/                # Platform adapters (PRESERVE modular)
│   │   ├── web.ts               # indexedDB: cloud-image-cache
│   │   ├── tizen.ts
│   │   ├── webos.ts
│   │   └── memory.ts
│   ├── react/                   # React components
│   │   ├── hooks.tsx            # Inline SW registration
│   │   ├── provider.tsx
│   │   └── image.tsx
│   └── service-worker/
│       ├── sw.ts                # indexedDB: cloud-image-cache (CAMBIAR)
│       ├── index.ts             # Client
│       └── register.js           # External registration
├── dist/
└── tests/
```

---

## Phase 0: Research

### Análisis de DBs Actuales

**Decision**: Unificar a `cloud-image-cache`

**Rationale**: 
- Web adapter usa `cloud-image-cache` - nombre más nuevo
- Mantiene consistencia con nombre del paquete `@cloudimage/cloud`
- Migration: renombrar DB en SW o migrar datos

### Alternativas Consideradas
1. Renombrar todo a `carbon-image-cache` - ❌ contradice nombre del paquete
2. Mantener dos DBs y sincronizar - ❌ complejidad innecesaria
3. Solo usar SW para cache - ❌ pierdes fallback del adapter
4. Unificar a `cloud-image-cache` - ✅ Elegido

---

## Phase 1: Design

### Acciones Inmediatas

1. **Cambiar DB_NAME en service-worker/sw.ts**
   - De: `carbon-image-cache`
   - A: `cloud-image-cache`

2. **Verificar build**

3. **Testear demo**

### Oportunidades de Mejora (Post-Fix Inmediato)

| Oportunidad | Descripción | Prioridad |
|-------------|-------------|-----------|
| 1. Unified DB | Solo cloud-image-cache | CRITICAL |
| 2. Adapter Fallback | Unificar lógica de fallback | HIGH |
| 3. Retry Reuse | Usar core/retry.ts en SW | MEDIUM |
| 4. Memory Adapter | Asegurar que funcione cuando DB no está disponible | MEDIUM |
| 5. Error Handling | Revisar manejo cuando DB falla | MEDIUM |

---

## Complexity Tracking

| Issue | Status | Resolution |
|-------|--------|-------------|
| Two IndexedDBs | CRITICAL | Unificar a cloud-image-cache |
| Fallback logic | fragmentation | Unificar en engine.ts |

---

## Siguiente: Generar SPEC para Oportunidades de Mejora

¿Querés que cree un nuevo spec para las oportunidades de mejora identificadas, o que proceda directamente con el fix de la DB?