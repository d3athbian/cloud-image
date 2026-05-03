# Research: Panel UI Improvements

## Decision 1: Tailwind CSS v4 Integration

**Decision**: Install `@tailwindcss/vite` plugin and create isolated `devtools.css` with `@import "tailwindcss"` and `@theme` tokens.

**Rationale**: Design spec `docs/design.md` explicitly requires Tailwind v4 with `@theme` directive for design tokens. Isolated CSS file ensures no conflicts with existing project configuration.

**Alternatives considered**:
- CSS Modules: More custom work for design tokens, doesn't scale as well
- Plain CSS with custom properties: Doesn't integrate with Tailwind utilities
- Tailwind v3: Design spec specifically calls for v4 features

**Implementation notes**:
```bash
npm install @tailwindcss/vite tailwindcss@4
```
Create `packages/cloud/src/debugger/styles/devtools.css`:
```css
@import "tailwindcss";

@theme {
  --color-dt-bg-base: #000000;
  --color-dt-bg-panel: #0A0A0A;
  --color-dt-bg-card: #111111;
  --color-dt-border: #333333;
  --color-dt-border-hover: #444444;
  --color-dt-text-primary: #FAFAFA;
  --color-dt-text-secondary: #888888;
  --color-dt-success: #10B981;
  --color-dt-warning: #F5A623;
  --color-dt-error: #FF0000;
  --color-dt-info: #0070F3;
  --font-dt-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-dt-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

## Decision 2: No Virtualization Library

**Decision**: Use CSS Grid with React.memo for performance (≤100 items expected).

**Rationale**: Clarification from user - grid won't exceed 100 items. React.memo on CacheCard provides sufficient performance without external dependency.

**Alternatives considered**:
- @tanstack/react-virtual: Adds bundle size, overkill for ≤100 items
- react-window: Fixed-size only, less flexible
- CSS content-visibility: Browser-native, used as fallback if needed

**Implementation notes**:
- Each CacheCard wrapped in `memo()`
- Grid uses `grid-cols-[repeat(auto-fill,minmax(220px,1fr))]`
- CSS `content-visibility: auto` as progressive enhancement

## Decision 3: In-Memory Search Filter

**Decision**: Toolbar search filters by URL and key client-side, instant results.

**Rationale**: Simple use case, no API needed, fast UX.

**Implementation notes**:
```typescript
const filteredItems = useMemo(() => {
  if (!searchQuery) return items;
  const query = searchQuery.toLowerCase();
  return items.filter(item =>
    item.url.toLowerCase().includes(query) ||
    item.key.toLowerCase().includes(query)
  );
}, [items, searchQuery]);
```

## Decision 4: Graceful IndexedDB Failure Handling

**Decision**: UI never crashes. IndexedDB failures show warning in grid, dependent sections disabled.

**Rationale**: User requirement - DevTools should remain functional even when storage fails.

**Implementation notes**:
- All IDB operations wrapped in try/catch
- Error state stored in Jotai atom
- Grid shows "Storage unavailable" message
- Action buttons that require IDB show disabled state

## Decision 5: Logger FIFO Limit (500 entries)

**Decision**: Log array truncates oldest entries when limit reached.

**Rationale**: Memory protection per spec. 500 is reasonable for debugging session.

**Implementation notes**:
```typescript
const addLog = useCallback((entry: LogEntry) => {
  setLogs(prev => {
    const updated = [...prev, entry];
    return updated.length > 500 ? updated.slice(-500) : updated;
  });
}, []);
```

## Decision 6: Empty State + Skeleton Loading

**Decision**: Empty cache shows message "No cached images". Loading shows skeleton cards.

**Rationale**: Standard UX pattern, clear differentiation between empty and loading states.

**Implementation notes**:
- Empty: Centered message with icon
- Loading: 6 placeholder cards with animated skeleton effect
- Use CSS `@keyframes` for skeleton animation

## Research Summary

All technical decisions align with:
- User clarifications (no virtualization lib, in-memory search, graceful IDB failure)
- Design spec `docs/design.md` (Tailwind v4, @theme tokens, grid layout)
- Constitution constraints (no business logic changes, TypeScript strict mode)

**No further research needed** - all unknowns resolved through clarifications and design spec.