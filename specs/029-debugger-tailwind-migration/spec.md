# Feature Specification: Migrate Debugger Panel to Tailwind CSS v4

**Feature Branch**: `029-debugger-tailwind-migration`
**Created**: 2026-05-03
**Status**: Draft
**Input**: El panel debugger de la library (packages/cloud/src/debugger/DebuggerTool.tsx) debe usar Tailwind CSS v4 para estilos. La library ya tiene @tailwindcss/vite configurado en su vite.config.ts.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Debugger Panel Uses Tailwind CSS (Priority: P1)

As a developer using the carbon-image debugger panel, I want the panel to be styled with Tailwind CSS v4 utility classes, so that the debugger matches the design system and is consistent with other Tailwind-styled components in the library.

**Why this priority**: This is a refactoring task to use the already-configured Tailwind CSS v4 in the library's debugger panel.

**Independent Test**: Open the debugger panel and verify it renders correctly using Tailwind utility classes.

**Acceptance Scenarios**:

1. **Given** the library's vite.config.ts has `@tailwindcss/vite` configured, **When** the debugger panel renders, **Then** all styles use Tailwind utility classes
2. **Given** the debugger panel is styled with Tailwind, **When** the user views the tabs (Cache, Network, Performance, State), **Then** each tab displays correctly with proper spacing, colors, and transitions
3. **Given** the debugger panel is open, **When** the user clicks the close button, **Then** the panel closes smoothly with the Tailwind-styled button

---

### User Story 2 - Design Tokens via Tailwind @theme (Priority: P1)

As a developer, I want the debugger panel to use the same design tokens defined in Tailwind's `@theme` directive, so that the visual design is consistent across all components.

**Why this priority**: Ensures consistency with the library's design system.

**Independent Test**: Check the debugger panel CSS and verify it uses Tailwind theme variables instead of custom CSS variables.

**Acceptance Scenarios**:

1. **Given** the debugger panel uses Tailwind, **When** colors are defined, **Then** they use Tailwind's `@theme` directive with custom property values (--color-dt-bg, --color-dt-text, etc.)
2. **Given** the debugger panel displays status indicators, **When** showing online/offline states, **Then** the colors match the Tailwind theme (green for success, red for error, yellow for warning)
3. **Given** the debugger panel needs responsive behavior, **When** the screen size changes, **Then** the panel layout adapts using Tailwind responsive prefixes (sm:, md:, lg:)

---

### User Story 3 - No CSS File Dependencies (Priority: P2)

As a developer, I want the debugger panel to not depend on external CSS files like `DebuggerPanel.css`, so that styles are co-located with components and easier to maintain.

**Why this priority**: Improves maintainability by keeping styles close to the components that use them.

**Independent Test**: Check that the debugger components import only Tailwind CSS and no custom `.css` files.

**Acceptance Scenarios**:

1. **Given** the debugger components are styled with Tailwind, **When** reviewing the imports, **Then** there are no `import './DebuggerPanel.css'` statements
2. **Given** the debugger panel is rendered, **When** checking the CSS classes on elements, **Then** they follow the Tailwind naming convention (e.g., `bg-dt-bg`, `text-dt-text`, `rounded-lg`)

---

## Clarifications

### Session 2026-05-03

- Q: ¿Qué componentes del debugger necesitan ser migrados? → A: Todos los componentes en `packages/cloud/src/debugger/` que actualmente usan `DebuggerPanel.css` - principalmente `DebuggerPanel.tsx`, `DebuggerTool.tsx`
- Q: ¿Se deben mantener los tokens de diseño existentes? → A: Sí, los colores oscuros actuales (bg: #0f0f0f, text: #ededed, accent: #3b82f6) deben mapearse a Tailwind tokens equivalentes
- Q: ¿Qué pasa con las media queries? → A: Convertir a Tailwind responsive prefixes (sm:, md:, lg:)

### Edge Cases

- What happens with inline styles currently in the components? - Convert inline styles to Tailwind utility classes where possible, or keep as inline-style for dynamic values
- What happens with the CSS custom properties in the .css file? - Map to Tailwind @theme variables with the same values
- What happens with the embedded <style> tag in DebuggerTool.tsx? - Remove it and replace with Tailwind classes

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Library MUST have Tailwind CSS v4 properly configured in the build system
- **FR-002**: Debugger panel components MUST use Tailwind utility classes for all styles
- **FR-003**: Debugger panel MUST define custom design tokens using Tailwind's theming system
- **FR-004**: Debugger panel MUST NOT import any external stylesheet files
- **FR-005**: All components in the debugger module MUST be migrated to use Tailwind
- **FR-006**: Tailwind classes MUST follow the naming convention for design tokens (bg-*, text-*, border-*)
- **FR-007**: Responsive layouts MUST use Tailwind responsive prefixes
- **FR-008**: Inline styles with dynamic values MAY remain as inline-styles
- **FR-009**: Library MUST build successfully with no Tailwind errors

### Key Entities

- **DebuggerPanel**: Main panel component with tabs (Cache, Network, Performance, State)
- **DebuggerTool**: Toggle button to open/close the debugger
- **Components in debugger/components/**: Various UI components used by the debugger

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All debugger components build without Tailwind warnings or errors
- **SC-002**: Debugger panel renders identically to before migration (visual consistency)
- **SC-003**: No `.css` file imports remain in debugger components
- **SC-004**: Build output is equal to or smaller than before (no Tailwind overhead)
- **SC-005**: Debugger panel works correctly in the demo (CloudProvider with devtools=true)

## Implementation Phases

### Phase 1: Create Tailwind CSS File with @theme
- Create or update `packages/cloud/src/debugger/styles/debugtools.css`
- Add `@import "tailwindcss"` and `@theme` directive with design tokens
- Map existing CSS variables to Tailwind tokens

### Phase 2: Migrate DebuggerPanel.tsx
- Replace `.css` class references with Tailwind utility classes
- Update colors to use Tailwind theme tokens
- Update spacing, borders, rounded corners to Tailwind equivalents

### Phase 3: Migrate DebuggerTool.tsx
- Remove inline `<style>` tag with CSS variables
- Replace CSS class references with Tailwind utility classes
- Remove `import './DebuggerPanel.css'`

### Phase 4: Migrate Other Components
- Review all components in `debugger/components/`
- Migrate any remaining CSS dependencies to Tailwind
- Ensure consistent use of design tokens

### Phase 5: Verify and Test
- Run library build and verify no errors
- Test debugger in demo application
- Verify visual appearance matches original design

## Assumptions

- Tailwind CSS v4 is already properly configured in the library's vite.config.ts
- The library uses `@tailwindcss/vite` plugin
- Design tokens will map from current CSS variables to equivalent Tailwind @theme values
- Responsive design will use Tailwind's mobile-first approach with sm:, md:, lg: prefixes