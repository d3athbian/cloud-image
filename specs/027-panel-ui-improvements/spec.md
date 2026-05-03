# Feature Specification: Panel UI Improvements

**Feature Branch**: `027-panel-ui-improvements`
**Created**: 2026-04-27
**Status**: Draft
**Input**: User description: "vamos a crear mejoras en el panel ui. es importante que no toques reglas de negocio de lo que ya esta funcionando. necesitamos solo intervenir la lib la parte de panel"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Complete DevTools UI Redesign with Tailwind v4 (Priority: P1)

As a developer using carbon-image DevTools, I want a redesigned panel that matches the design specification in `docs/design.md`, using Tailwind CSS v4 for styling, so that the interface feels consistent with modern DevTools aesthetics.

**Why this priority**: This is a comprehensive redesign that establishes the foundation for all future UI improvements.

**Independent Test**: Open the DevTools panel and verify the layout, styling, and components match the design specification.

**Acceptance Scenarios**:

1. **Given** Tailwind CSS v4 is properly configured, **When** the DevTools panel loads, **Then** all styles use Tailwind utility classes with custom design tokens (`bg-dt-bg-base`, `text-dt-text-primary`, etc.)
2. **Given** the DevTools panel is open, **When** the user views the layout, **Then** it follows the strict grid structure: Topbar (full width), MainContent (left), SidePanel (right), BottomPanel (footer)
3. **Given** the user views the Topbar, **When** looking at the status indicators, **Then** they see Online status (green dot), Circuit state, SW status, and Worker status displayed correctly

---

### User Story 2 - Cache Grid with Virtualization and Selection (Priority: P1)

As a developer using the Cache tab, I want to see cached images in a virtualized grid with detailed metadata, so that I can efficiently browse and inspect cached items.

**Why this priority**: The cache grid is the primary interface for inspecting cached images and their metadata.

**Independent Test**: Open the Cache tab and verify images display in a grid, clicking a card selects it and shows details.

**Acceptance Scenarios**:

1. **Given** cached images exist, **When** the user opens the Cache tab, **Then** images display in a responsive grid using `grid-cols-[repeat(auto-fill,minmax(220px,1fr))]`
2. **Given** the user clicks on a CacheCard, **When** the item is selected, **Then** `ImageDetails` panel updates to show full item metadata without re-rendering the entire grid
3. **Given** the user views a CacheCard, **When** looking at the thumbnail, **Then** they see the image, LRU badge, and copy icon that appears on hover
4. **Given** the grid contains many items, **When** scrolling, **Then** React.memo on CacheCard maintains performance without jank
5. **Given** cache is empty, **When** user opens Cache tab, **Then** Empty state displays message "No cached images"
6. **Given** cache data is loading, **When** user opens Cache tab, **Then** Skeleton loading cards appear while data loads

---

### User Story 3 - Real-time Logger Panel (Priority: P2)

As a developer using the DevTools, I want a real-time logger panel that displays system events with filtering, so that I can monitor what's happening during image loading and caching.

**Why this priority**: The logger provides visibility into system behavior for debugging purposes.

**Independent Test**: Open the panel and trigger actions that generate logs, verify logs appear and filtering works.

**Acceptance Scenarios**:

1. **Given** system events are occurring, **When** the Logger panel is visible, **Then** new logs appear at the bottom and auto-scroll if user is at the bottom
2. **Given** the user clicks a log level filter (Info, Warn, Error), **When** filtering is active, **Then** only logs matching that level are displayed
3. **Given** the log limit of 500 entries is reached, **When** new logs arrive, **Then** oldest logs are silently removed (FIFO)
4. **Given** the user clicks "Clear", **When** button is pressed, **Then** all logs are removed from display

---

### User Story 4 - State Viewer and Quick Actions (Priority: P2)

As a developer, I want to view the current Jotai atom state and perform quick actions like clearing cache or simulating offline, so that I can test different scenarios during development.

**Why this priority**: Quick actions and state inspection are essential debugging tools.

**Independent Test**: Open the State tab and verify atoms display correctly; click Quick Action buttons and verify they trigger correct behavior.

**Acceptance Scenarios**:

1. **Given** the State viewer is displayed, **When** viewing the atoms, **Then** cacheAtom, networkAtom, memoryAtom, and cacheStatsAtom show formatted JSON
2. **Given** the user clicks "Disable Cache", **When** button is pressed, **Then** the cache is disabled and button state reflects the change
3. **Given** the user clicks "Simulate Offline", **When** button is pressed, **Then** network is simulating offline mode
4. **Given** the user clicks "Clear All", **When** button is pressed, **Then** all cached data is cleared and UI updates

---

### User Story 5 - Image Details Sidebar (Priority: P2)

As a developer, I want to see detailed metadata for the selected cache item, including URL, size, TTL status, LRU score, and action buttons, so that I can inspect and manage individual cached items.

**Why this priority**: Detailed item inspection is fundamental to debugging cache behavior.

**Independent Test**: Select an item in CacheGrid and verify ImageDetails panel shows correct information.

**Acceptance Scenarios**:

1. **Given** a cache item is selected, **When** viewing ImageDetails, **Then** it shows: URL, Key, Size, Type, TTL with expiration countdown, LRU Score, Access Count, Created At, Last Accessed
2. **Given** the user is viewing ImageDetails, **When** clicking "Delete", **Then** the item is removed from IndexedDB and grid updates
3. **Given** the user is viewing ImageDetails, **When** clicking "Pin", **Then** the item is marked as pinned and cannot be evicted
4. **Given** the user is viewing ImageDetails, **When** clicking "Refetch", **Then** the system re-fetches the image and updates the cache entry

---

## Clarifications

### Session 2026-04-28

- Q: ¿Qué librería de virtualización prefieres para el CacheGrid? → A: No se necesita librería de virtualización. Grid con ≤100 items con memoización React suficiente, CSS content-visibility como fallback nativo si es necesario.
- Q: ¿Qué comportamiento debe tener el campo de búsqueda en el toolbar del Cache tab? → A: Filter en memoria, búsqueda por URL y key (instantáneo)
- Q: ¿Qué debe pasar si IndexedDB falla o no está disponible? → A: UI nunca crashea. IndexedDB failures shown as warning in grid UI. Sections dependent on IndexedDB values display as disabled. UI remains fully functional otherwise.
- Q: ¿Qué debe mostrar la UI cuando el cache está vacío o cargando? → A: Empty state con mensaje + skeleton loading cards cuando carga

### Edge Cases

- What happens when the panel is resized to very small widths? - Layout adapts with responsive grid columns
- How does the system handle very long URLs in cache items? - URLs are truncated with ellipsis, full URL shown in ImageDetails
- How does the system handle items with expired TTL? - Status badge shows "Expired" in orange, items still visible but marked
- What happens when selecting an item that gets evicted mid-view? - ImageDetails clears or shows "Item no longer available"
- How does the logger handle rapid log generation (1000 events)? - FIFO truncation at 500 entries prevents memory bloat

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST integrate Tailwind CSS v4 via `@tailwindcss/vite` plugin and use `@import "tailwindcss"` directive
- **FR-002**: System MUST define design tokens using Tailwind v4 `@theme` directive: `bg-dt-bg-base`, `bg-dt-bg-panel`, `bg-dt-bg-card`, `border-dt-border`, `border-dt-border-hover`, `text-dt-text-primary`, `text-dt-text-secondary`, `text-dt-success`, `text-dt-warning`, `text-dt-error`, `text-dt-info`, `font-dt-sans`, `font-dt-mono`
- **FR-003**: DevTools layout MUST use CSS Grid via Tailwind: `grid-cols-[1fr_350px] grid-rows-[48px_1fr_250px]`
- **FR-004**: System MUST implement `DevToolsLayout` component with zones: Topbar (48px), MainContent (middle), SidePanel (right 350px), BottomPanel (250px footer)
- **FR-005**: CacheGrid MUST display items using CSS Grid (`grid-cols-[repeat(auto-fill,minmax(220px,1fr))]`) with React.memo on CacheCard for performance. No external virtualization library needed (≤100 items expected).
- **FR-006**: CacheCard MUST display: thumbnail, LRU badge (top-left), copy icon (top-right, visible on hover), metadata (url, size, hit count, TTL)
- **FR-007**: ImageDetails panel MUST show when a CacheCard is selected with all metadata fields and action buttons (Preview, Refetch, Delete, Pin)
- **FR-008**: Logger panel MUST support log levels (INFO, WARN, ERROR), filtering, auto-scroll, and 500-entry FIFO limit
- **FR-009**: State Viewer MUST display formatted JSON of cacheAtom, networkAtom, memoryAtom, cacheStatsAtom with syntax highlighting
- **FR-010**: Quick Actions MUST include: Disable Cache, Simulate Offline, Clear All, Export Snapshot
- **FR-011**: System MUST NOT modify any existing business logic (cache eviction, network resilience, circuit breaker)
- **FR-012**: Tab switching MUST preserve scroll position and state in Jotai atoms
- **FR-013**: System MUST display empty state with "No cached images" message when cache has no items
- **FR-014**: System MUST display skeleton loading cards while cache data is loading
- **FR-015**: System MUST never crash the UI due to IndexedDB failures. Grid shows warning when IndexedDB unavailable. Sections dependent on IndexedDB display as disabled. UI remains fully functional.
- **FR-016**: Cache toolbar search MUST filter items in-memory by URL and key with instant results (no API calls)

### Key Entities

- **DevToolsLayout**: Root component managing CSS Grid layout, no business logic
- **CacheGrid**: Virtualized container receiving array of cache item IDs
- **CacheCard**: Presentational component for individual cache items, memoized
- **ImageDetails**: Panel showing full metadata of selected item, observes selectedItemUrlAtom
- **LoggerPanel**: Real-time log display with filtering capabilities
- **StateViewer**: JSON tree view of Jotai atoms with syntax highlighting
- **QuickActions**: Grid of action buttons for common operations
- **Topbar**: Header with brand, version pill, status indicators, window actions

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: DevTools panel never exceeds 100vh and does not cause body scroll in host application
- **SC-002**: Selecting a CacheCard does NOT cause re-render of entire CacheGrid - only selected CacheCard visual state and ImageDetails update
- **SC-003**: Emitting 1000 log events does not cause memory above expected threshold - FIFO truncation at 500 entries
- **SC-004**: Tab switching completes within 200ms with smooth transition
- **SC-005**: Grid displays ≤100 items with React.memo without FPS degradation during scroll
- **SC-006**: All design tokens render correctly with Vercel/Next.js dark style aesthetic
- **SC-007**: Panel adapts gracefully to widths between 800px and full width

## Implementation Phases

### Phase 0: Tailwind v4 Integration
- Verify `@tailwindcss/vite` and `tailwindcss` v4.x installed
- Integrate plugin in `vite.config.ts`
- Create `styles/devtools.css` with `@import "tailwindcss"` and `@theme` tokens
- Verify Tailwind classes impact DOM correctly

### Phase 1: Layout Base and Theming
- Implement `DevToolsLayout` with CSS Grid structure
- Build Topbar, SidePanel, BottomPanel containers
- Apply design tokens via Tailwind utilities
- Verify layout occupies 100% available space (`h-screen w-full`)

### Phase 2: Jotai State Connection and Tabs
- Implement tab navigation with `activeTabAtom`
- Connect BottomPanel StateViewer to Jotai atoms
- Verify JSON displays real data
- Tab switching renders correct views

### Phase 3: Logger Panel
- Implement `useLogger` hook with log management
- Build LoggerPanel UI with filtering
- Implement auto-scroll and 500-entry limit
- Test with interval-based log emission

### Phase 4: Cache UI
- Implement `CacheGrid` with CSS Grid and React.memo optimization
- Build `CacheCard` components with all visual elements
- Implement StatsOverview widgets (Items, Size, Hit Rate, Evictions, TTL Expired, Pinned)
- Build Toolbar with search, filters, action buttons
- Verify items render with React.memo without FPS issues

### Phase 5: Engine/IndexedDB Integration
- Implement `useCacheExplorer` hook
- Read blobs from IndexedDB for thumbnails
- Connect "Clear Cache", "Delete", "Pin" actions
- Verify item deletion updates grid and stats

## Assumptions

- Existing Jotai atoms (`cacheAtom`, `networkAtom`, `memoryAtom`) already contain correct data
- Business logic remains unchanged - only UI layer is being redesigned
- `window.__CLOUD_ENGINE__` exposes the engine for Quick Actions
- Design follows Vercel/Next.js dark style aesthetic per `docs/design.md`
- No changes to core cache eviction, network resilience, or circuit breaker behavior