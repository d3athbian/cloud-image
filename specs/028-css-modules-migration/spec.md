# Feature Specification: CSS Modules Migration for Demo

**Feature Branch**: `028-css-modules-migration`
**Created**: 2026-05-03
**Status**: Draft
**Input**: Eliminar Tailwind CSS del demo y usar CSS Modules en su lugar. El demo actualmente usa Tailwind para estilos pero se quiere migrar a CSS Modules nativos de Vite para tener estilos scoped y no depender de Tailwind.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Complete Tailwind Removal from Demo (Priority: P1)

As a developer working on the carbon-image demo, I want to remove the Tailwind CSS dependency from the demo project, so that the demo has no external CSS framework dependency and builds are faster.

**Why this priority**: This is a refactoring task to simplify the demo's styling approach.

**Independent Test**: Run the demo build and verify no Tailwind classes are in the output CSS.

**Acceptance Scenarios**:

1. **Given** the demo project, **When** building the demo, **Then** no Tailwind CSS output is present in the built files
2. **Given** the demo project, **When** checking package.json, **Then** `tailwindcss` and `@tailwindcss/vite` are not listed in dependencies
3. **Given** the demo project, **When** checking vite.config.ts, **Then** the Tailwind plugin is not configured

---

### User Story 2 - CSS Modules Integration (Priority: P1)

As a developer using the demo, I want styles to be implemented using CSS Modules (`.module.css` files), so that styles are scoped to their components and do not leak globally.

**Why this priority**: CSS Modules is the native Vite approach for component-scoped styles.

**Independent Test**: Inspect DOM elements and verify class names are scoped (typically include hash suffixes).

**Acceptance Scenarios**:

1. **Given** a component with styles, **When** the component renders, **Then** class names follow the CSS Modules pattern (e.g., `App_header__abc123`)
2. **Given** two different components, **When** they define the same class name, **Then** their applied styles do not conflict
3. **Given** a styled component is rendered, **When** checking the browser DevTools, **Then** the scoped class names are visible on elements

---

### User Story 3 - Visual Consistency After Migration (Priority: P1)

As a developer viewing the demo, I want the visual appearance to remain consistent after migrating from Tailwind to CSS Modules, so that the user experience is not affected by the styling technology change.

**Why this priority**: The demo must continue to look and function the same way.

**Independent Test**: Compare screenshots or visually inspect the demo before and after the migration.

**Acceptance Scenarios**:

1. **Given** the demo is running, **When** viewing the main interface, **Then** all UI elements are visible and properly styled
2. **Given** the demo is running, **When** interacting with UI elements, **Then** hover states and interactive behaviors work correctly
3. **Given** the demo is running, **When** resizing the browser window, **Then** the responsive layout functions correctly

---

## Clarifications

### Session 2026-05-03

- Q: ¿Qué componentes del demo necesitan ser migrados? → A: Solo los componentes en `demos/cloud-demo/src/` que usan Tailwind classes directamente.
- Q: ¿Se debe mantener la misma estructura de CSS (colores, spacing, etc.)? → A: Sí, los estilos visuales deben ser idénticos - solo cambia la tecnología de Tailwind utilities a CSS Modules con las mismas reglas CSS.
- Q: ¿Qué pasa con los estilos globales (reset, variables CSS)? → A: Se migrarán a un archivo CSS global normal (no module) para reset y variables CSS compartidas.

### Edge Cases

- What happens if there are inline styles on components? - Inline styles should be reviewed and moved to CSS Modules where appropriate
- What happens with third-party components that use Tailwind? - Third-party components with Tailwind dependencies may need alternative versions or removal
- What happens with dynamic Tailwind classes (e.g., `bg-${color}`)? - These patterns need to be replaced with static CSS class definitions

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Demo MUST NOT import Tailwind CSS in any file
- **FR-002**: Demo MUST use CSS Modules (`.module.css` files) for component-scoped styles
- **FR-003**: Demo MUST have a global CSS file for shared styles, CSS variables, and resets
- **FR-004**: All existing Tailwind utility classes MUST be converted to equivalent CSS rules in CSS Modules
- **FR-005**: Vite config MUST NOT contain `@tailwindcss/vite` plugin
- **FR-006**: package.json MUST NOT contain `tailwindcss` or `@tailwindcss/vite` dependencies
- **FR-007**: Component className props MUST reference CSS Module class names
- **FR-008**: CSS Modules class names MUST follow the pattern: `ComponentName_className__hash`
- **FR-009**: Shared CSS variables (colors, spacing tokens) MUST be defined in the global CSS file
- **FR-010**: Demo MUST build successfully without Tailwind dependencies

### Key Entities

- **Global CSS File**: Single `.css` file with CSS custom properties (variables) for design tokens, resets, and base styles
- **Component CSS Modules**: One `.module.css` file per component containing component-specific styles
- **Component Files**: React components in `src/` that import their respective CSS Module files

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Demo builds successfully with zero Tailwind-related warnings or errors
- **SC-002**: CSS bundle size is equal to or smaller than before the migration (no CSS Module overhead)
- **SC-003**: All interactive elements maintain their visual appearance (hover, focus, active states)
- **SC-004**: Scoped styles prevent any style leakage between components
- **SC-005**: Demo runs in development mode without console errors
- **SC-006**: Production build completes successfully and serves correct styles

## Implementation Phases

### Phase 1: Remove Tailwind Dependencies
- Remove `tailwindcss` from package.json
- Remove `@tailwindcss/vite` from package.json
- Remove Tailwind plugin from vite.config.ts
- Remove or rename `tailwind.config.js` if exists
- Remove CSS files using `@import "tailwindcss"`

### Phase 2: Create Global Styles
- Create `src/styles/global.css` with:
  - CSS custom properties (variables) for colors, spacing, fonts
  - CSS reset (box-sizing, margin/padding resets)
  - Base element styles (body, html, a, buttons)

### Phase 3: Create CSS Modules for Components
- Identify all components using Tailwind classes
- Create `.module.css` files for each component
- Convert Tailwind utilities to CSS rules
- Import CSS Module in component and use module.className

### Phase 4: Verify and Clean
- Run development server and verify appearance
- Run production build and verify output
- Remove any remaining Tailwind references

## Assumptions

- The demo's visual design will be preserved - only the styling technology changes
- CSS Modules' scoped class names are acceptable (they include hash suffixes)
- No dynamic Tailwind class generation (e.g., `bg-${variable}`) is used in the demo
- Third-party components (if any) with Tailwind dependencies will be replaced or removed