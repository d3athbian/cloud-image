# Implementation Plan: Debugger Panel Redesign

**Feature**: Debugger Panel Redesign
**Spec**: `specs/030-debugger-panel-redesign/spec.md`
**Branch**: `030-debugger-panel-redesign`
**Created**: 2026-05-03

## Context

The user wants to redesign the debugger panel in the `@cloudimage/cloud` library. The layout already exists and works correctly. The goal is to enhance it with a cached image list in the right column.

## Technical Context

### Current State (from spec.md)
- Layout: CSS Grid with DevToolsLayout (`grid-cols-[1fr_350px] grid-rows-[48px_1fr_250px]`)
  - Topbar (48px)
  - MainContent (left column)
  - SidePanel (right 350px column) - **ENHANCEMENT TARGET**
  - BottomPanel (250px footer)
- SidePanel currently shows "Select an item" placeholder
- MainContent contains CacheGrid with cached items

### User Request (from /speckit-plan input)
"el layout ya se encuentra ok, pero necesitamos planificar para poder crear una lista de las imagenes cacheadas en la columna derecha del panel. deben tener una miniatura y datos relevantes del cache y que tenga scroll esa seccion derecha"

### Key Components
- `DevToolsLayout.tsx`: Root layout component with CSS Grid
- `SidePanel.tsx`: Right column container (currently placeholder)
- `CacheCard.tsx`: Card component with thumbnail preview slot
- `CacheGrid.tsx`: Grid display for cached items

## Clarifications

### Session 2026-05-03

- Q: ¿Qué datos relevantes del cache debe mostrar cada item en la lista? → A: URL (truncada), tamaño, LRU score, hit count, TTL restante, estado (active/expired/pinned)
- Q: ¿Cómo se muestra la miniatura? → A: Usar ImageBitmap/Blob de IndexedDB para mostrar preview real de la imagen cacheada
- Q: ¿El SidePanel debe mostrar todos los items o solo los del cache activo? → A: Mostrar todos los items del cache con scroll
- Q: ¿Qué pasa cuando no hay items cacheados? → A: Mostrar mensaje "No cached images" con icono

## Research

### Cached Image List Implementation

**Decision**: Create a scrollable list in SidePanel showing cached items with thumbnails

**Rationale**:
- SidePanel (350px) provides adequate space for a detailed list view
- Users need to see all cached items at a glance while browsing main content
- Thumbnail + metadata pattern is standard in DevTools (Chrome DevTools Application tab)

**Alternatives Considered**:
1. Show only selected item details in SidePanel → Rejected: User wants full list
2. Use a modal instead of SidePanel → Rejected: Loses context of seeing all items

### Thumbnail Loading Strategy

**Decision**: Load ImageBitmap from IndexedDB on-demand for visible items

**Rationale**:
- Pre-loading all thumbnails could be expensive for large caches
- Using `createImageBitmap()` on Blob from IndexedDB is efficient
- React.memo + visible viewport rendering will prevent unnecessary decodes

**Alternatives Considered**:
1. Pre-decode all thumbnails on mount → Rejected: Memory overhead for large caches
2. Use URL.createObjectURL → Rejected: Memory leak risk if not revoked

## Data Model

### Entities

#### CacheListItem
```typescript
interface CacheListItem {
  url: string;           // Unique cache key/URL
  size: number;         // Size in bytes
  lruScore: number;     // LRU scoring (0-1 range)
  accessCount: number;  // Number of times accessed
  ttl: number;          // Time to live in ms
  status: 'active' | 'expired' | 'pinned';
  thumbnailUrl?: string; // Object URL for thumbnail (lazy loaded)
  createdAt: number;    // Timestamp when cached
  lastAccessed: number; // Timestamp of last access
}
```

#### CacheListState
```typescript
interface CacheListState {
  items: CacheListItem[];
  selectedUrl: string | null;
  isLoading: boolean;
  error: string | null;
}
```

## Implementation Phases

### Phase 1: SidePanel Enhancement
- Update `SidePanel.tsx` to render `CacheList` component
- Ensure scrollable container with proper overflow styling
- Handle empty state display

### Phase 2: CacheList Component
- Create `CacheList.tsx` in `debugger/components/cache/`
- Implement scrollable list layout with vertical arrangement
- Connect to cache data via Jotai atoms
- Add empty state handling

### Phase 3: CacheListItem Component
- Create `CacheListItem.tsx` component
- Display thumbnail (from IndexedDB Blob)
- Show metadata: URL, size, LRU, hit count, TTL
- Add status indicator (active/expired/pinned badge)
- Implement thumbnail lazy loading with intersection observer

### Phase 4: Thumbnail Loading Integration
- Create hook `useCacheThumbnail.ts` to load ImageBitmap from IndexedDB
- Handle loading states and errors
- Clean up Object URLs on unmount

### Phase 5: Integration and Testing
- Connect CacheList to existing cache atoms
- Ensure scroll position preservation
- Test with various cache sizes

## Success Criteria

- [ ] SidePanel displays scrollable list of cached items
- [ ] Each item shows: thumbnail, URL (truncated), size, LRU score, hit count, TTL, status
- [ ] Thumbnail loads from IndexedDB Blob when available
- [ ] List scrolls smoothly with many items
- [ ] Empty state displays when no cached items
- [ ] Panel layout unchanged (DevToolsLayout grid structure preserved)
- [ ] No performance degradation during scroll (memoization working)

## Out of Scope

- Changes to cache eviction algorithm
- Modifications to network resilience logic
- Changes to circuit breaker behavior
- Layout structure modifications (grid, position, sizing)
- Adding/removing tabs
- Changing panel mode behavior (floating/fullwidth)

## Dependencies

- Tailwind CSS v4 (already configured)
- Jotai atoms (existing: cacheAtom, cacheStatsAtom)
- IndexedDB via idb library (existing)
- ImageBitmap API (browser native)

## Next Steps

Run `/speckit-tasks` to generate actionable tasks.md based on this plan.