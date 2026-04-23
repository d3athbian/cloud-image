# Data Model: Bundle Tree-Shaking

## Entities

### Entry Points

| Entity | Purpose | Exports |
|--------|---------|--------|
| `src/index.ts` | Main entry | Named exports from submodules |
| `src/core/index.ts` | Core engine | Named exports from core modules |
| `src/utils/index.ts` | Utilities | Named exports (already clean) |
| `src/adapters/index.ts` | Adapters | Named exports + lazy loading |

### Adaptador de Plataforma

| Entity | Platform | Lazy Load |
|--------|----------|----------|
| `createMemoryAdapter` | In-memory | Required |
| `createWebAdapter` | Browser (IDB) | Required |
| `createTizenAdapter` | Tizen | Required |
| `createWebOSAdapter` | WebOS | Required |

## Validation Rules

1. Cada archivo de entrada DEBE usar solo importaciones nombradas
2. Los adaptadores DEBEN cargarse dinámicamente (no static import)
3. Los índices DEBEN usar `export { foo }` no `export * from`