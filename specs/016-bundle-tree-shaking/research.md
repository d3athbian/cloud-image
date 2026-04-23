# Phase 0 Research: Bundle Tree-Shaking

## Auditory Findings

### 1. Puntos de Entrada Actuales

| Archivo | Problema | Impacto |
|---------|---------|---------|
| `src/index.ts` | `export * from './core'` | Agregación - incluye todo core |
| `src/core/index.ts` | 16x `export * from './module'` | Bloquea tree-shaking completamente |
| `src/adapters/index.ts` | `export * from './types'` | Incluye types no utilizados |
| `src/utils/index.ts` |named exports OK | tree-shaking funciona |

### 2. Adaptadores Existentes

- `memory.ts` - in-memory adapter
- `web.ts` - IndexedDB adapter (idb library)
- `tizen.ts` - Tizen platform
- `webos.ts` - WebOS platform

### 3. Verificación de Tree-Shaking

**Recomendación**: Usar `rollup-plugin-analyzer` o verificar con `vite build --debug` para analizar chunks generados.

### 4. Carga Dinámica de Adaptadores

Vite soporta imports dinám着呢 para tree-shaking:
```ts
const adapter = await import(`./adapters/${platform}`);
```

## Decisions

| Decisión | Rationale |
|----------|----------|
| Convertir todos `export *` a exports nombradas | Enable 100% tree-shaking |
| Cargar adaptadores dinámicamente | Cada plataforma = chunk separado |
| Audit web.ts (idb dep) | Dependencia externa debe justificar uso |