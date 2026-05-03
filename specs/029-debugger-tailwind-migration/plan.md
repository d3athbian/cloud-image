# Implementation Plan: Migrate Debugger Panel to Tailwind CSS v4

**Feature Branch**: `029-debugger-tailwind-migration`
**IMPL_PLAN**: `specs/029-debugger-tailwind-migration/plan.md`
**Created**: 2026-05-03
**Feature Spec**: [spec.md](./spec.md)

## Technical Context

### Current State Analysis

**Library Structure:**
```
packages/cloud/src/debugger/
├── DebuggerPanel.css        # Old CSS file with custom properties (to be removed)
├── DebuggerPanel.tsx        # Main panel component (uses DebuggerPanel.css)
├── DebuggerTool.tsx         # Toggle button (has inline <style> tag)
├── styles/
│   └── devtools.css         # Already has Tailwind @theme tokens!
├── components/
│   ├── cache/               # Cache-related components
│   ├── layout/              # Layout components (Topbar, SidePanel, etc.)
│   ├── logger/              # Logger panel components
│   ├── shared/              # Shared components (Badge, Button, etc.)
│   └── state/               # State viewer components
└── index.ts
```

**Existing Tailwind Setup:**
The library already has `devtools.css` with Tailwind v4 and `@theme` tokens:
- `--color-dt-bg-base: #000000`
- `--color-dt-bg-panel: #0a0a0a`
- `--color-dt-bg-card: #111111`
- `--color-dt-border: #333333`
- `--color-dt-text-primary: #fafafa`
- `--color-dt-success: #10b981`
- etc.

**What Needs to Change:**
| File | Change Required |
|------|-----------------|
| `DebuggerPanel.css` | Delete this file (migrated to Tailwind) |
| `DebuggerPanel.tsx` | Remove `import './DebuggerPanel.css'`, use Tailwind classes |
| `DebuggerTool.tsx` | Remove inline `<style>` tag, use Tailwind classes |
| Component files in `components/` | Review and migrate to Tailwind |

### Design Decisions

**Decision 1: Use Existing Tailwind Tokens**
- Choice: Use the already-defined `@theme` tokens from `devtools.css`
- Rationale: Consistency with existing design system
- Token names: `--color-dt-*` (dt = DevTools)

**Decision 2: Tailwind Class Naming Convention**
- Choice: Use Tailwind utility classes with custom theme values
- Pattern: `bg-dt-bg-panel`, `text-dt-text-primary`, `border-dt-border`
- Rationale: Matches existing token naming convention

**Decision 3: Keep Components as TypeScript/TSX**
- Choice: No structural changes, only styling changes
- Rationale: Minimize risk, focus on CSS migration only

---

## Constitution Check

*No constitution file found - skipping*

---

## Phase 0: Research

### Research: Tailwind v4 CSS Module Migration

**Finding 1: Vite + Tailwind v4 Integration**
- Tailwind v4 with `@tailwindcss/vite` processes all CSS files in the project
- No need to import Tailwind explicitly - plugin handles it
- Components import CSS files which get processed by Tailwind plugin

**Finding 2: CSS Custom Properties to Tailwind @theme Mapping**
Current CSS variables in `DebuggerPanel.css`:
```css
--debugger-bg: #0f0f0f         →  --color-dt-bg-panel: #0a0a0a
--debugger-text: #ededed        →  --color-dt-text-primary: #fafafa
--debugger-border: #333         →  --color-dt-border: #333333
--debugger-accent: #3b82f6      →  --color-dt-info: #0070f3
```

**Finding 3: Class Name Mapping Examples**
| Old Class | Tailwind Equivalent |
|-----------|---------------------|
| `.debugger-panel` | `fixed bg-dt-bg-panel border border-dt-border rounded-xl` |
| `.debugger-tab` | `flex-1 flex items-center justify-center gap-1.5 p-2.5` |
| `.debugger-header` | `flex items-center justify-between p-2 pt-0` |
| `.debugger-toggle` | `fixed w-11 h-11 rounded-xl bg-dt-bg-panel border border-dt-border` |
| `.text-green-500` | Use `--color-dt-success` with `text-dt-success` |

**Finding 4: DebuggerTool Inline Style**
```tsx
// Current DebuggerTool.tsx has:
const CSS_VARIABLES_STYLE = `
:root {
  --debugger-bg: #0f0f0f;
  --debugger-text: #ededed;
  ...
}
`;
// This is injected via useEffect - will be replaced with Tailwind classes
```

### Unknowns Resolved

All unknowns from the spec have been resolved:
- Tailwind v4 plugin already configured in vite.config.ts
- devtools.css already has @theme tokens defined
- Migration is straightforward find/replace of CSS classes to Tailwind utilities

---

## Phase 1: Design & Artifacts

### data-model.md

```markdown
# Data Model: Debugger Tailwind Migration

## File Structure Changes

### Before (with DebuggerPanel.css)
```
debugger/
├── DebuggerPanel.css         # 280 lines of custom CSS
├── DebuggerPanel.tsx        # imports './DebuggerPanel.css'
├── DebuggerTool.tsx         # has inline <style> tag via useEffect
└── styles/
    └── devtools.css         # Tailwind @theme tokens (already exists)
```

### After (with Tailwind)
```
debugger/
├── DebuggerPanel.tsx        # no CSS import, uses Tailwind classes
├── DebuggerTool.tsx         # no <style> tag, uses Tailwind classes
├── styles/
│   └── devtools.css         # Tailwind @theme tokens (unchanged)
└── components/
    └── ...                   # components migrated to Tailwind
```

## CSS Class Mapping

### DebuggerPanel Classes
| Original Class | Tailwind Classes |
|---------------|------------------|
| `debugger-panel` | `fixed bg-dt-bg-panel border border-dt-border rounded-2xl w-80 max-h-[400px] overflow-hidden z-[9999] shadow-2xl font-sans text-sm text-dt-text-primary` |
| `debugger-panel-fullwidth` | `w-auto max-w-none left-4 right-4 max-h-[45vh]` |
| `debugger-tab` | `flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-transparent border-none border-b-2 border-transparent text-dt-text-secondary text-xs font-medium cursor-pointer transition-all rounded-t-lg` |
| `debugger-tab:hover` | `text-dt-text-primary bg-white/5` |
| `debugger-tab.active` | `text-dt-info border-b-dt-info bg-dt-info/10` |
| `debugger-header` | `flex items-center justify-between px-3 pt-2 bg-white/[0.02] border-b border-dt-border` |
| `debugger-close-btn` | `flex items-center justify-center w-8 h-8 bg-transparent border-none rounded-lg text-[#666] cursor-pointer transition-all` |
| `debugger-close-btn:hover` | `bg-red-500/10 text-red-500` |
| `debugger-panel-content` | `p-4 max-h-[calc(45vh-60px)] overflow-y-auto` |
| `debugger-panel-section` | `flex flex-col gap-4` |
| `debugger-metrics` | `grid grid-cols-2 gap-2` |
| `debugger-stat` | `flex flex-col p-3 bg-white/[0.04] rounded-lg border border-white/[0.05]` |
| `debugger-label` | `text-[10px] text-[#666] uppercase tracking-wide mb-1` |
| `debugger-value` | `text-base font-semibold tabular-nums` |
| `debugger-actions` | `flex gap-2 pt-2 border-t border-white/[0.05]` |
| `debugger-action-btn` | `flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-dt-info/10 border border-dt-info/30 rounded-lg text-dt-info text-xs font-medium cursor-pointer transition-all` |
| `debugger-toggle` | `fixed w-11 h-11 rounded-xl bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-dt-border text-dt-text-primary cursor-pointer flex items-center justify-center transition-all z-[9998] shadow-lg hover:border-dt-info hover:scale-105` |
| `debugger-state-content` | `grid grid-cols-3 gap-3` |
| `debugger-state-card` | `bg-white/[0.03] rounded-lg border border-white/[0.05] overflow-hidden` |
| `debugger-state-header` | `flex items-center gap-2 px-3 py-2.5 bg-dt-info/10 border-b border-white/[0.05] text-xs font-semibold text-dt-info uppercase tracking-wide` |
| `debugger-state-body` | `p-0` |
| `debugger-state-row` | `flex justify-between px-3 py-1.5 text-xs` |
| `text-green-500` | `text-dt-success` |
| `text-red-500` | `text-dt-error` |
| `text-yellow-500` | `text-dt-warning` |

### Responsive Breakpoints
| Original | Tailwind |
|----------|----------|
| `@media (max-width: 768px)` | `md:` prefix |

## Color Tokens (from @theme)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-dt-bg-base` | #000000 | Page background |
| `--color-dt-bg-panel` | #0a0a0a | Panel background |
| `--color-dt-bg-card` | #111111 | Card background |
| `--color-dt-border` | #333333 | Borders |
| `--color-dt-border-hover` | #444444 | Hover borders |
| `--color-dt-text-primary` | #fafafa | Primary text |
| `--color-dt-text-secondary` | #888888 | Secondary text |
| `--color-dt-success` | #10b981 | Success/online |
| `--color-dt-warning` | #f5a623 | Warning |
| `--color-dt-error` | #ff0000 | Error/offline |
| `--color-dt-info` | #0070f3 | Info/accent |
```

### contracts/

*Not applicable - this is a styling migration with no external API contracts*

### quickstart.md

```markdown
# Quickstart: Debugger Tailwind Migration

## Prerequisites
- Node.js 18+
- npm or pnpm
- Library build tools (`cd packages/cloud && npm install`)

## Steps

### 1. Verify Tailwind Configuration
```bash
cat packages/cloud/vite.config.ts | grep tailwindcss
```
Should show: `import tailwindcss from '@tailwindcss/vite'`

### 2. Build Library
```bash
cd packages/cloud
npm run build
```

### 3. Test Debugger in Demo
```bash
cd demos/cloud-demo
npm run dev
```
Open browser DevTools, click "Open Debugger" button, verify panel works.

### 4. Verify Tailwind Classes
Open browser DevTools, inspect debugger panel elements.
Should see classes like `bg-dt-bg-panel`, `text-dt-text-primary`, etc.
Should NOT see old classes like `debugger-panel`, `debugger-tab`, etc.
```

---

## Agent Context Update

The CLAUDE.md already has:
```
├── debugger/       # DevTools Panel (Tailwind CSS v4, Jotai)
```

No update needed - this confirms debugger is expected to use Tailwind.
```

---

## Next Steps

Proceed to `/speckit-tasks` to generate actionable tasks from this plan.