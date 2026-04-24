# Research: DebuggerTool Component

## Decision: Floating Panel Pattern

**Chosen approach**: React Query DevTools pattern with two modes:
- Floating mode: Fixed position toggle button + collapsible panel (bottom-left default)
- Embedded mode: Direct render via `DebuggerToolPanel`

**Rationale**: Industry-proven UX pattern. Users expect this behavior from dev tools. Mirrors TanStack Query, Redux DevTools patterns.

**Alternatives considered**:
- Fixed bottom drawer (less flexible on positioning)
- Modal overlay (blocks app interaction)

---

## Decision: Tree-Shaking Support

**Chosen approach**: Subpath export `./debugger` separate from main export

**Rationale**: Vite/Rollup can tree-shake based on actual imports. Component code only included if explicitly imported from `./debugger`.

**Key practices**:
- No side effects in module initialization
- Each subpath export is independent entry point
- CSS via CSS-in-JS or inline styles (no CSS imports)

---

## Decision: Dark Mode Implementation

**Chosen approach**: CSS variables in `:root` for theming

**Rationale**: Matches Next.js app directory convention. Easy to override. No runtime dependency.

```css
:root {
  --debugger-bg: #0f0f0f;
  --debugger-text: #ededed;
  --debugger-border: #333;
  --debugger-accent: #3b82f6;
}
```

When rendering, check for `document` existence for SSR compatibility:
```tsx
useEffect(() => {
  if (typeof document === 'undefined') return;
  // apply theme
}, [])
```

---

## Decision: Component API

**Chosen approach**:
```tsx
// Floating mode (default)
<DebuggerTool 
  initialIsOpen={false}
  position="bottom-left"
/>

// Embedded mode
<DebuggerToolPanel />
```

**Rationale**: Same as React Query DevTools. Familiar API. Clear distinction between modes.

---

## Research Complete

All NEEDS CLARIFICATION resolved:
- Floating panel: React Query DevTools pattern
- Tree-shaking: Subpath export strategy
- Dark mode: CSS variables