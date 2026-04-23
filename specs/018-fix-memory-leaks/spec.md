# Feature Specification: Deuda Técnica - Fugas de Memoria

**Feature Branch**: `018-fix-memory-leaks`  
**Created**: 2026-04-22  
**Status**: Draft  
**Input**: User description: "Limpieza en Manejadores de Eventos, Gestión de Señales/Suscripciones, Manejo de Recursos del Service Worker"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Limpieza de Manejadores de Eventos (Priority: P1)

Un desarrollador que usa IntersectionObserver o event listeners en componentes debe poder registrarlos sin worry de cleanup manual, ya que el hook se encarga automáticamente.

**Why this priority**: Los event listeners que no se limpian causan fugas de memoria que degradan performance progresivamente.

**Independent Test**: Componente con event listeners puede montarse/desmontarse múltiples veces sin crecimiento de memoria.

**Acceptance Scenarios**:

1. **Given** un componente registra un IntersectionObserver, **When** el componente se desmonta, **Then** el observer se disconnect automáticamente.
2. **Given** un componente registra window resize listener, **When** el componente se desmonta, **Then** el listener se remove automáticamente.

---

### User Story 2 - Gestión de Suscripciones (Priority: P1)

Un componente que se suscribe a observables globales (network status, cache events) debe desuscribirse automáticamente al desmontar.

**Why this priority**: Las suscripciones olvidadas mantienen referencias obsoletas causando memory leaks.

**Independent Test**: Componente con suscripciones puede montarse/desmontarse sin memory leaks.

**Acceptance Scenarios**:

1. **Given** un componente se suscribe a networkMonitor, **When** el componente se desmonta, **Then** la suscripción se cancela automáticamente.
2. **Given** múltiples componentes se suscriben al mismo observable, **When** cada uno se desmonta, **Then** solo su suscripción se cancela, las demás permanecen activas.

---

### User Story 3 - Recursos del Service Worker (Priority: P2)

El Service Worker debe manejar correctamente el cache con políticas de expiración apropiadas y cerrar conexiones.

**Why this priority**: Cache mal configurado puede crecer indefinidamente o guardar datos innecesarios.

**Independent Test**: Verificar que recursos se cachean con Cache-Control correcto.

**Acceptance Scenarios**:

1. **Given** el Service Worker recibe una request de imagen, **When** la respuesta se cachea, **Then** tiene headers Cache-Control con max-age.
2. **Given** el Service Worker recibe una request de API, **When** la respuesta se procesa, **Then** NO se cachea permanentemente.

---

### Edge Cases

- ¿Qué sucede si el componente se desmonta antes de que el observer init?
- ¿Qué sucede con suscripciones a observables que ya emitieron valores?
- ¿Cómo manejar eventos que vienen después del unmount?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Todos los event listeners registrados en useEffect deben limpiarse en el return del hook.
- **FR-002**: Los IntersectionObservers deben disconnect en cleanup.
- **FR-003**: Las suscripciones a observables deben cancelarse automáticamente al desmontar.
- **FR-004**: El Service Worker debe agregar Cache-Control a respuestas cacheadas.
- **FR-005**: El Service Worker NO debe cachear respuestas de API.

### Key Entities *(include if feature involves data)*

- **useCleanupEffect**: Hook personalizado para cleanup automático de eventos
- **SubscriptionManager**: Utilidad para manejar desuscripciones automáticas
- **Service Worker Cache**: Configuración de políticas de cache

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 0 memory leaks detectados en Chrome DevTools después de mount/unmount 10 veces.
- **SC-002**: 0 event listeners orphans después de unmount.
- **SC-003**: Imágenes tienen Cache-Control header; respuestas API no se cachean.