# Feature Specification: Global State Synchronization

**Feature Branch**: `023-global-state-sync`  
**Created**: 2026-04-23  
**Status**: Draft  
**Input**: User description: "Sincronización de Estado Global. Objetivo: Resolver la inconsistencia de datos entre el estado en memoria (Jotai) y el estado persistido (IndexedDB). Acción: Implementar un mecanismo que sirva como 'Fuente Única de Verdad'. Este sistema debe interceptar cualquier escritura de datos (por API o user input) y asegurar que, además de actualizar el atom de Jotai, también envíe una señal de sincronización inmediata al IndexedDB para forzar su actualización. Por qué ahora: Abordar la sincronización de datos resuelve el riesgo más alto de fallo de usuario (ver datos vieja en la UI) y es un requisito transversal que beneficia todos los módulos (Network, Provider, etc.)."

## User Scenarios & Testing

### User Story 1 - Single Source of Truth for State (Priority: P1)

When any component writes data through the API or user input, the system immediately synchronizes both the in-memory state (Jotai) and persisted state (IndexedDB) so users always see the most recent data in the UI without refreshing.

**Why this priority**: This is the core value - eliminating stale data visibility which is the highest risk user failure. Without this, users may see outdated information in the UI after making changes.

**Independent Test**: Can be tested by updating data via API and immediately checking both memory and persisted storage contain the same values.

**Acceptance Scenarios**:

1. **Given** user updates cache configuration via CloudProvider, **When** the write completes, **Then** both Jotai atom and IndexedDB contain the identical updated values
2. **Given** a network status change triggers a state update, **When** the update completes, **Then** memory and persistence are synchronized within 100ms

---

### User Story 2 - Automatic Sync on All State Changes (Priority: P2)

Every module (Network, Provider, Cache, etc.) that writes to state automatically triggers synchronization without requiring individual implementation in each module.

**Why this priority**: Reduces code duplication and ensures consistency is applied uniformly across all modules. Developers don't need to remember to sync manually.

**Independent Test**: Can be verified by examining that no module implements its own sync logic - all use the centralized mechanism.

**Acceptance Scenarios**:

1. **Given** NetworkMonitor updates network status, **When** the update occurs, **Then** synchronization is triggered automatically without explicit calls
2. **Given** CacheManager evicts entries, **When** eviction occurs, **Then** memory and IndexedDB are updated together

---

### User Story 3 - Conflict Resolution on App Restart (Priority: P3)

When the app restarts, the system detects any mismatch between persisted state and in-memory defaults, preferring the persisted state as the source of truth for user data.

**Why this priority**: Ensures continuity after app restart - users don't lose their settings or cached data.

**Independent Test**: Can be tested by modifying state, closing the app, reopening it, and verifying persisted data is restored correctly.

**Acceptance Scenarios**:

1. **Given** user has customized cache settings, **When** app restarts, **Then** the customized settings are loaded from IndexedDB
2. **Given** IndexedDB contains different data than default, **When** app starts, **Then** persisted data takes precedence

---

### Edge Cases

- What happens when IndexedDB write fails? (memory update should still succeed, retry persistence)
- What happens during offline mode? (queue sync for when connection returns)
- What happens with concurrent writes? (last-write-wins with timestamp)

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide a single state write function that atomically updates both memory and persisted storage
- **FR-002**: All state writes MUST go through the centralized sync mechanism
- **FR-003**: Memory and persistence MUST be synchronized within 100ms of any write
- **FR-004**: System MUST detect and resolve state conflicts on app startup, preferring persisted data
- **FR-005**: System MUST queue synchronization attempts during offline mode for later retry

### Key Entities

- **StateSync**: Centralized mechanism that intercepts writes and coordinates memory + persistence sync
- **WriteQueue**: Queue for offline sync operations
- **ConflictResolver**: Logic that determines which state to use on startup

## Success Criteria

### Measurable Outcomes

- **SC-001**: 0% of user actions result in stale data visible in UI after write completes
- **SC-002**: 100ms maximum sync latency between memory write and persistence update
- **SC-003**: All modules use centralized sync mechanism (verified by code review)
- **SC-004**: App restart restores 100% of persisted user data correctly