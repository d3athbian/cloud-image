# Tasks: CSS Modules Migration for Demo

**Feature**: CSS Modules Migration for Demo
**Generated**: 2026-05-03
**Plan**: [plan.md](./plan.md)
**Spec**: [spec.md](./spec.md)

## Overview

- **Total Tasks**: 15
- **User Stories**: 3
- **Parallel Opportunities**: 2 (components can be migrated independently)

---

## Phase 1: Setup

- [X] T001 Remove Tailwind dependencies from package.json
  - File: `demos/cloud-demo/package.json`
  - Remove `tailwindcss` from devDependencies
  - Remove `@tailwindcss/vite` from devDependencies

- [X] T002 Remove Tailwind plugin from Vite config
  - File: `demos/cloud-demo/vite.config.ts`
  - Remove `import tailwindcss from '@tailwindcss/vite'`
  - Remove `tailwindcss()` from plugins array

---

## Phase 2: Foundational (Global Styles)

- [X] T003 Create global CSS file with design tokens
  - File: `demos/cloud-demo/src/styles/global.css`
  - Convert CSS variables from `app.css` @theme block
  - Include: body reset, focus styles, animated gradient background
  - Preserve all `--color-*` custom properties
  - Remove `@import "tailwindcss"` and `@theme` directives

- [X] T004 Update App.tsx to import global.css
  - File: `demos/cloud-demo/src/App.tsx`
  - Change `import './styles/app.css'` to `import './styles/global.css'`
  - No other changes needed - global.css provides same CSS variables

---

## Phase 3: User Story 1 - Tailwind Removal

**Story Goal**: Complete removal of Tailwind CSS from the demo project

**Independent Test**: Build demo and verify no Tailwind-related files or classes in output

- [ ] T005 [US1] Review all components for Tailwind class usage
  - Files: `demos/cloud-demo/src/components/*.tsx`
  - Check CacheStatsDisplay.tsx, Controls.tsx, ImageGrid.tsx, NetworkStatusDisplay.tsx, StateSyncDemo.tsx
  - Document any Tailwind classes found

- [ ] T006 [US1] Remove Tailwind import from app.css and convert to global styles
  - File: `demos/cloud-demo/src/styles/app.css`
  - Extract remaining utility classes used by components
  - Move to global.css if shared, or to component CSS Modules
  - Remove file after migration complete

---

## Phase 4: User Story 2 - CSS Modules Integration

**Story Goal**: Integrate CSS Modules for component-scoped styles

**Independent Test**: Inspect DOM - class names should show CSS Module hashes (e.g., `App_header__abc123`)

- [X] T007 [P] [US2] Create App.module.css
  - File: `demos/cloud-demo/src/App.module.css`
  - Create scoped styles for demo-container, demo-header, demo-main
  - Convert Tailwind utilities to CSS rules:
    - `demo-container` → `.container` { min-height: 100vh; display: flex; flex-direction: column; background: var(--color-bg); }
    - `demo-header` → `.header` { padding: 2rem 2rem 1.5rem; text-align: center; background: linear-gradient(...); }
    - `demo-main` → `.main` { flex: 1; padding: 2rem; }

- [X] T008 [P] [US2] Create ImageGrid.module.css
  - File: `demos/cloud-demo/src/components/ImageGrid.module.css`
  - Create scoped styles for grid and imageWrapper classes
  - Convert Tailwind utilities:
    - `grid` → `.grid` { display: grid; grid-template-columns: repeat(1, 1fr); gap: 1rem; }
    - Media queries for responsive columns (640px, 1024px, 1280px breakpoints)
    - `imageWrapper` → `.imageWrapper` { background: var(--color-bg-tertiary); border: 1px solid var(--color-border); border-radius: 0.75rem; }

- [X] T009 [US2] Update App.tsx to use App.module.css
  - File: `demos/cloud-demo/src/App.tsx`
  - Import: `import styles from './App.module.css'`
  - Change className props: `demo-container` → `{styles.container}`, `demo-header` → `{styles.header}`, `demo-main` → `{styles.main}`

- [X] T010 [US2] Update ImageGrid.tsx to use ImageGrid.module.css
  - File: `demos/cloud-demo/src/components/ImageGrid.tsx`
  - Import: `import styles from './ImageGrid.module.css'`
  - Change className props: `grid` → `{styles.grid}`, `imageWrapper` → `{styles.imageWrapper}`

---

## Phase 5: User Story 3 - Visual Consistency

**Story Goal**: Ensure visual appearance remains consistent after migration

**Independent Test**: Compare demo before/after - all UI elements visible and properly styled

- [ ] T011 [US3] Verify all CSS variables work in CSS Modules
  - Files: `global.css`, `App.module.css`, `ImageGrid.module.css`
  - Ensure all `var(--color-*)` references are valid
  - Test: `--color-bg`, `--color-bg-secondary`, `--color-bg-tertiary`, `--color-border`, `--color-text`

- [ ] T012 [US3] Verify responsive layout functions
  - Files: `ImageGrid.module.css`
  - Test grid breakpoints at 640px, 1024px, 1280px
  - Verify aspect-ratio and hover effects on imageWrapper

- [ ] T013 [US3] Verify hover states and transitions
  - Files: `App.module.css`, `ImageGrid.module.css`
  - Check `.imageWrapper:hover` transform and border-color transition
  - Check `.header` gradient background

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T014 Verify build completes without Tailwind warnings
  - Run `npm run build` in demos/cloud-demo
  - Verify output has no Tailwind utility classes
  - Verify no `tailwindcss` or `@tailwindcss` in bundle

- [X] T015 Delete old app.css file (after verification)
  - File: `demos/cloud-demo/src/styles/app.css`
  - Only delete after confirming all styles migrated
  - Run final visual check in browser

---

## Dependency Graph

```
Phase 1 (Setup)
    │
    ├── T001 ──────────────────────────┐
    └── T002 ──────────────────────────┤
                                      ▼
Phase 2 (Foundational)         Phase 3 (US1)
    │                               │
    ├── T003 ───────────────────────┴── T005 ── T006
    └── T004
            │
            ▼
Phase 4 (US2) ──────────────────────────────────────
    │                                                     │
    ├── T007 ───┐                                        │
    └── T008 ───┴── T009                                  │
                                                         ▼
Phase 5 (US3) ─────────────────────────────────── T011 ─ T012 ─ T013
    │
    ▼
Phase 6 (Polish)
    │
    ├── T014
    └── T015
```

## Parallel Execution Opportunities

| Parallel Set | Tasks | Reason |
|--------------|-------|--------|
| P1 | T007, T008 | Different component CSS Modules, no dependencies |
| P2 | T011, T012, T013 | Verification tasks, run after CSS Modules complete |

## Suggested MVP Scope

For MVP (User Story 1 + critical migration), complete:
- Phase 1 (T001, T002)
- Phase 2 (T003, T004)
- Phase 4 tasks: T007, T008, T009, T010
- Final polish: T014

Skipping: T005, T006 (unless Tailwind usage found in other components), T011-T013 (can be verified in final check)

---

## Implementation Strategy

1. **MVP First**: Complete basic Tailwind removal and CSS Modules setup
2. **Incremental Delivery**: Test after each phase
3. **Verify Before Delete**: Never delete old files until new ones verified working