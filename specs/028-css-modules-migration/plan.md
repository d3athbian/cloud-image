# Implementation Plan: CSS Modules Migration for Demo

**Feature Branch**: `028-css-modules-migration`
**IMPL_PLAN**: `specs/028-css-modules-migration/plan.md`
**Created**: 2026-05-03
**Feature Spec**: [spec.md](./spec.md)

## Technical Context

### Current State Analysis

**Demo Project Structure:**
```
demos/cloud-demo/
├── src/
│   ├── App.tsx                    # Uses Tailwind classes
│   ├── main.tsx                   # Entry point
│   ├── styles/
│   │   └── app.css                # Tailwind + custom CSS (~300 lines)
│   ├── components/
│   │   ├── CacheStatsDisplay.tsx  # Uses Tailwind? needs review
│   │   ├── Controls.tsx           # Uses Tailwind? needs review
│   │   ├── ErrorBoundary.tsx      # Likely no styles
│   │   ├── ImageGrid.tsx          # Uses Tailwind classes
│   │   ├── NetworkStatusDisplay.tsx
│   │   └── StateSyncDemo.tsx
│   └── hooks/
├── package.json                   # Has tailwindcss + @tailwindcss/vite
├── vite.config.ts                 # Has tailwindcss() plugin
└── tsconfig.json
```

**Tailwind Usage in app.css:**
- Uses `@import "tailwindcss"` for Tailwind v4
- Uses `@theme` directive for custom design tokens
- Contains utility classes for: grid, container, buttons, badges, hover states

**Tailwind Usage in Components:**
- `App.tsx`: `demo-container`, `demo-header`, `demo-main`
- `ImageGrid.tsx`: `grid`, `imageWrapper`

### What Needs to Change

| File | Change Required |
|------|-----------------|
| `vite.config.ts` | Remove `tailwindcss` import and plugin |
| `package.json` | Remove `tailwindcss` and `@tailwindcss/vite` |
| `app.css` | Convert to `global.css` - keep CSS variables, remove Tailwind import |
| `App.tsx` | Import CSS Module instead of `app.css` |
| `ImageGrid.tsx` | Import CSS Module for `grid` and `imageWrapper` |
| New files | Create `App.module.css` and `ImageGrid.module.css` |

### Design Decisions

**Decision 1: Global CSS File Structure**
- Choice: Keep single global CSS file for CSS variables, reset, and base styles
- Rationale: Simple migration, matches existing structure
- Alternative considered: Multiple global files for different concerns (rejected for simplicity)

**Decision 2: CSS Module Naming Convention**
- Choice: `ComponentName.module.css` pattern
- Rationale: Standard Vite convention, matches spec requirement

**Decision 3: CSS Variable Preservation**
- Choice: Preserve all CSS variables from `@theme` block as CSS custom properties in global.css
- Rationale: Ensures visual consistency, allows components to reference same tokens

---

## Constitution Check

*No constitution file found - skipping*

---

## Phase 0: Research

### Research: CSS Modules with Vite + React

**Finding 1: Vite Native CSS Modules Support**
- Vite has built-in support for CSS Modules via `*.module.css` filename convention
- No additional plugins required
- Class names are scoped with hash suffix: `ComponentName_className__hash`

**Finding 2: CSS Modules Naming Pattern**
- Default pattern: `[filename]_[classname]__[hash]`
- Can be customized in `vite.config.ts` via `css.modules` option
- Default export is the mapping object, named exports possible with `composes`

**Finding 3: Global CSS Variables with CSS Modules**
- CSS custom properties (variables) can be defined in global CSS file
- Components can reference them via `var(--variable-name)`
- No special setup needed

### Research: Tailwind to CSS Module Conversion

**Tailwind equivalents:**
| Tailwind | CSS Module Equivalent |
|----------|---------------------|
| `className="grid"` | CSS: `.grid { display: grid; }` |
| `className="grid grid-cols-3"` | CSS: `.grid { display: grid; grid-template-columns: repeat(3, 1fr); }` |
| `className="p-4"` | CSS: `.container { padding: 1rem; }` |
| `className="hover:bg-blue-500"` | CSS: `.button:hover { background: blue; }` |

### Unknowns Resolved

All unknowns from the spec have been resolved through research:
- Vite supports CSS Modules natively (no plugin needed)
- CSS variables in global.css work with CSS Modules
- Conversion is straightforward find/replace of Tailwind utilities to CSS rules

---

## Phase 1: Design & Artifacts

### data-model.md

```markdown
# Data Model: CSS Modules Migration

## File Structure

### Before (with Tailwind)
```
src/
├── App.tsx                 (imports ./styles/app.css)
├── styles/
│   └── app.css             (Tailwind + custom CSS)
└── components/
    └── ImageGrid.tsx       (uses Tailwind classes inline)
```

### After (with CSS Modules)
```
src/
├── App.tsx                 (imports App.module.css)
├── App.module.css         (App-specific styles)
├── styles/
│   └── global.css          (CSS variables, reset, base)
└── components/
    └── ImageGrid.tsx       (imports ImageGrid.module.css)
    └── ImageGrid.module.css
```

## CSS Variables (Design Tokens)

Preserved from `app.css` @theme block:

| Variable | Value | Usage |
|----------|-------|-------|
| `--color-bg` | #000000 | Page background |
| `--color-bg-secondary` | #0a0a0a | Header background |
| `--color-bg-tertiary` | #111111 | Card background |
| `--color-border` | #262626 | Borders |
| `--color-border-light` | #333333 | Hover borders |
| `--color-text` | #ededed | Primary text |
| `--color-text-secondary` | #a1a1a1 | Secondary text |
| `--color-text-muted` | #737373 | Muted text |
| `--color-accent` | #3b82f6 | Primary accent |
| `--color-accent-hover` | #2563eb | Accent hover |
| `--color-success` | #22c55e | Success states |
| `--color-warning` | #f59e0b | Warning states |
| `--color-error` | #ef4444 | Error states |

## Component Style Mappings

### App.tsx
| Original Tailwind | CSS Module Class | CSS Rule |
|-------------------|-------------------|----------|
| `demo-container` | `container` | min-height: 100vh; display: flex; flex-direction: column; |
| `demo-header` | `header` | padding: 2rem 2rem 1.5rem; text-align: center; |
| `demo-main` | `main` | flex: 1; padding: 2rem; |

### ImageGrid.tsx
| Original Tailwind | CSS Module Class | CSS Rule |
|-------------------|-------------------|----------|
| `grid` | `grid` | display: grid; grid-template-columns: repeat(1, 1fr); gap: 1rem; |
| `imageWrapper` | `imageWrapper` | background: var(--color-bg-tertiary); border: 1px solid var(--color-border); |

---

## Implementation Checklist

- [ ] Remove tailwindcss from package.json devDependencies
- [ ] Remove @tailwindcss/vite from package.json devDependencies
- [ ] Remove tailwindcss plugin from vite.config.ts
- [ ] Create src/styles/global.css with CSS variables
- [ ] Create src/App.module.css with component styles
- [ ] Create src/components/ImageGrid.module.css with grid styles
- [ ] Update App.tsx to import CSS Module
- [ ] Update ImageGrid.tsx to import CSS Module
- [ ] Review other components for Tailwind usage
- [ ] Run dev server and verify appearance
- [ ] Run production build and verify output
```

### contracts/

*Not applicable - this is a styling migration with no external API contracts*

### quickstart.md

```markdown
# Quickstart: CSS Modules Migration for Demo

## Prerequisites
- Node.js 18+
- npm or pnpm

## Steps

### 1. Install Dependencies
```bash
cd demos/cloud-demo
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
npm run preview
```

## Verify Migration Success

1. Open browser DevTools
2. Inspect element class names - should see CSS Module hashes like `App_header__abc123`
3. No Tailwind utility classes should appear (e.g., no classes like `p-4`, `flex`, `grid-cols-3`)
4. All CSS custom properties should work (colors, spacing)
```

---

## Agent Context Update

*No agent context update needed - this is a straightforward styling migration*

---

## Next Steps

Proceed to `/speckit-tasks` to generate actionable tasks from this plan.