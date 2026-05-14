# Refactorización DebuggerPanel.tsx - Atomic Design

## Contexto

El archivo `DebuggerPanel.tsx` (~485 líneas) es monolítico. Mezcla:
- Constantes (ICONS)
- Interfaces (CachedImageItem)
- Helpers (formatSize, formatTime, getFilename)
- Primitives (Stat, GhostBtn)
- Organisms (CachePanel, NetworkPanel, etc.)
- Templates (floating vs fullwidth layout)

## Estructura Atomic Design Propuesta

```
debugger/components/
├── atoms/
│   ├── Stat.tsx           # Label + value display
│   ├── GhostButton.tsx    # Ghost button primitive
│   ├── Icon.tsx           # SVG icon wrapper
│   ├── Badge.tsx          # Already exists - status badge
│   └── StatusDot.tsx      # Online/offline status indicator
│
├── molecules/
│   ├── StatCard.tsx       # Stat wrapped in card styling
│   ├── ActionButtonGroup.tsx # Group of action buttons
│   ├── CachedImageRow.tsx # Thumbnail + info + meta
│   └── StateCard.tsx      # Card for state panel
│
├── organisms/
│   ├── DebuggerHeader.tsx     # Top bar with branding, status, actions
│   ├── TabNavigation.tsx      # Tab row
│   ├── TabContent.tsx         # Tab content wrapper
│   ├── CacheTab.tsx           # Cache tab panel
│   ├── NetworkTab.tsx         # Network tab panel
│   ├── PerformanceTab.tsx      # Performance tab panel
│   ├── StateTab.tsx           # State tab panel
│   ├── CachedImageList.tsx     # Scrollable list of cached images
│   ├── PanelBody.tsx          # Two-column body (tabs + list)
│   └── DebuggerPanel.tsx       # Main orchestrator
│
└── templates/
    ├── FloatingPanel.tsx      # Compact floating mode layout
    └── FullWidthPanel.tsx     # Full-width mode layout
```

## Componentes Existentes a Reutilizar

- `shared/Badge.tsx` - para badges
- `shared/Button.tsx` - para botones
- `shared/TabBar.tsx` - para navegación de tabs
- `shared/TabContent.tsx` - para contenido de tabs

## Beneficios

1. **Single Responsibility** - cada componente hace una cosa
2. **Testabilidad** - componentes pequeños son más fácil de testear
3. **Reusabilidad** - atoms y molecules pueden reutilizarse en otros lugares
4. **Maintainability** - cambios localizada
5. **Legibilidad** - estructura clara del código

## Orden de Implementación

1. Crear directorio `atoms/` y mover primitivas
2. Crear directorio `molecules/` y construir combinaciones simples
3. Crear `DebuggerHeader` organism
4. Extraer cada Tab a su propio organism
5. Crear `CachedImageList` organism
6. Crear `PanelBody` organism
7. Crear templates (FloatingPanel, FullWidthPanel)
8. Refactorizar DebuggerPanel para usar los nuevos componentes

## Interfaces Compartidas

```typescript
// debugger/types/debugger.types.ts
export interface CachedImageItem {
  url: string;
  size: number;
  mimeType: string;
  cachedAt: number;
}

export interface CacheStats {
  itemCount: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
}

export interface JotaiDebuggerState {
  cache: { totalItems: number; hitCount: number; missCount: number; lastAccessTime: number };
  network: { status: string; rtt: number; lastChecked: number };
  memory: { isUnderPressure: boolean; pressureLevel: string };
}

export interface PerformanceData {
  avgResponse: number;
  totalRequests: number;
  successRate: number;
}
```

## Helpers a Extraer

```typescript
// debugger/utils/formatters.ts
export function formatSize(bytes: number): string { ... }
export function formatTime(timestamp: number): string { ... }
export function getFilename(url: string): string { ... }
```

## Timeline Sugerido

- Phase 1: Atoms + molecules (estadísticas, botones)
- Phase 2: Tab panels organisms
- Phase 3: CachedImageList organism
- Phase 4: Header + PanelBody organisms
- Phase 5: Templates + DebuggerPanel refactor