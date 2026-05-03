# Tasks: Migrate Debugger Panel to Tailwind CSS v4

**Feature**: Migrate Debugger Panel to Tailwind CSS v4
**Generated**: 2026-05-03
**Plan**: [plan.md](./plan.md)
**Spec**: [spec.md](./spec.md)

## Overview

- **Total Tasks**: 11
- **User Stories**: 3
- **Parallel Opportunities**: 1 (components can be migrated independently)

---

## Phase 1: Setup

- [X] T001 Verify Tailwind v4 configuration
  - File: `packages/cloud/vite.config.ts`
  - Confirm `@tailwindcss/vite` plugin is present

- [X] T002 Verify devtools.css has @theme tokens
  - File: `packages/cloud/src/debugger/styles/devtools.css`
  - Confirm `--color-dt-*` tokens are defined

---

## Phase 2: User Story 1 - Debugger Panel Uses Tailwind CSS

**Story Goal**: Migrate debugger panel components to use Tailwind utility classes

**Independent Test**: Build library and verify no CSS errors; open debugger in demo and visually verify

- [X] T003 [US1] Remove DebuggerPanel.css import from DebuggerPanel.tsx
  - File: `packages/cloud/src/debugger/DebuggerPanel.tsx`
  - Remove `import './DebuggerPanel.css'`
  - Add Tailwind classes directly to JSX elements

- [X] T004 [US1] Migrate DebuggerPanel.tsx class names to Tailwind
  - File: `packages/cloud/src/debugger/DebuggerPanel.tsx`
  - Convert `.debugger-panel` → `fixed bg-dt-bg-panel border border-dt-border rounded-2xl w-80`
  - Convert `.debugger-tab` → `flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5`
  - Convert `.debugger-header` → `flex items-center justify-between px-3 pt-2`
  - Convert `.debugger-panel-content` → `p-4 max-h-[calc(45vh-60px)] overflow-y-auto`
  - See plan.md Section "CSS Class Mapping" for full reference

- [X] T005 [US1] Delete DebuggerPanel.css
  - File: `packages/cloud/src/debugger/DebuggerPanel.css`
  - Only delete after verifying all styles migrated

---

## Phase 3: User Story 2 - Design Tokens via Tailwind @theme

**Story Goal**: Ensure all colors use Tailwind @theme tokens instead of hardcoded values

**Independent Test**: Inspect debugger panel in browser DevTools - no hardcoded color values

- [X] T006 [US2] Update color classes to use dt-* theme tokens
  - Files: `DebuggerPanel.tsx`, `DebuggerTool.tsx`
  - Replace hardcoded colors with theme tokens:
    - `text-green-500` → `text-dt-success`
    - `text-red-500` → `text-dt-error`
    - `text-yellow-500` → `text-dt-warning`
    - Background colors → `bg-dt-bg-panel`, `bg-dt-bg-card`

---

## Phase 4: User Story 3 - No CSS File Dependencies

**Story Goal**: Remove all external CSS file dependencies from debugger components

**Independent Test**: Grep for `.css` imports in debugger directory - should return no results

- [X] T007 [P] [US2] Migrate DebuggerTool.tsx to Tailwind
  - File: `packages/cloud/src/debugger/DebuggerTool.tsx`
  - Remove inline `<style>` tag with CSS variables
  - Remove `import './DebuggerPanel.css'` if present
  - Apply Tailwind classes to toggle button:
    - `.debugger-toggle` → `fixed w-11 h-11 rounded-xl bg-dt-bg-panel border border-dt-border`

- [X] T008 [P] [US3] Review debugger/components/ for CSS dependencies
  - Files: `packages/cloud/src/debugger/components/**/*.tsx`
  - Check for any `.css` imports or `<style>` tags
  - Migrate any remaining CSS to Tailwind if needed

---

## Phase 5: Polish & Verification

- [X] T009 Verify build completes without Tailwind errors
  - Run `cd packages/cloud && npm run build`
  - Check for no warnings or errors

- [X] T010 Test debugger in demo application
  - Run `cd demos/cloud-demo && npm run dev`
  - Open browser DevTools, click debugger toggle
  - Verify panel renders correctly with Tailwind styles

- [X] T011 Final cleanup - delete DebuggerPanel.css
  - File: `packages/cloud/src/debugger/DebuggerPanel.css`
  - Only after T009 and T010 pass
  - Verify no remaining references to this file

---

## Dependency Graph

```
Phase 1 (Setup)
    │
    ├── T001
    └── T002
            │
            ▼
Phase 2 (US1) ────────────────────────────────────
    │                                                  │
    ├── T003 ─── T004                                │
    └── T005                                          │
                                                     ▼
Phase 3 (US2) ─────────────────────────────────── T006
    │                                                  │
    ▼                                                 ▼
Phase 4 (US3) ─────────────────────────────── T007 ─ T008
    │                                                  │
    ▼                                                 ▼
Phase 5 (Polish)
    │
    ├── T009
    ├── T010
    └── T011
```

## Parallel Execution Opportunities

| Parallel Set | Tasks | Reason |
|--------------|-------|--------|
| P1 | T007, T008 | Different component files, no dependencies |

## Suggested MVP Scope

For MVP (User Story 1 + critical migration), complete:
- Phase 1 (T001, T002)
- Phase 2 (T003, T004, T005)
- Phase 5 (T009, T010)

Skipping: T006, T007, T008, T011 (can be completed if issues found during verification)

---

## Implementation Strategy

1. **MVP First**: Verify setup, migrate DebuggerPanel.tsx fully, test
2. **Incremental Delivery**: Test after each phase
3. **Verify Before Delete**: Never delete old CSS file until new styles verified working
4. **Visual Check**: Always test in browser after migration