# Feature Specification: Sistema de Contexto Global Reactivo con Jotai

**Feature Branch**: `020-jotai-atoms`  
**Created**: 2026-04-22  
**Status**: Draft  
**Input**: User description: "crea una nueva rama para esta spec y sacala desde main

Sistema de Contexto Global Reactivo

Implementar un sistema de estado global que desacople la información sobre qué cambió (el Evento) de quién lo debe escuchar (el Componente)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Re-renderizado Selectivo con Átomos (Priority: P1)

Como desarrollador, quiero que los componentes de UI solo se re-rendericen cuando el estado específico que escuchan cambia, no cuando cualquier parte del estado global cambia. Esto mantiene la aplicación rápida incluso con много estado global.

**Why this priority**: Este es el benefit principal de Jotai sobre React Context - evitar re-renderizados innecesarios. Sin esto, la aplicación se degrade con el crecimiento del estado.

**Independent Test**: Se puede probar midiendo re-renderizados de un componente que escucha solo un átomo cuando otro átomo diferente cambia. El componente no debe re-renderizarse.

**Acceptance Scenarios**:

1. **Given** Un componente que escucha cacheAtom, **When** networkAtom cambia, **Then** el componente NO se re-renderiza
2. **Given** Un componente que escucha networkAtom, **When** cacheAtom cambia, **Then** el componente NO se re-renderiza

---

### User Story 2 - Definición Centralizada de Átomos (Priority: P2)

Como desarrollador, quiero tener átomos de estado centralizados que representen piezas autónomas de información del sistema (cache, network, memory), para poder suscribirme fácilmente a solo lo que necesito.

**Why this priority**: LaSeparación de intereses permite que cada átomo sea independiente y reutilizable.

**Independent Test**: Se puede verificar que cada átomo puede actualizarse independientemente sin afectar otros átomos.

**Acceptance Scenarios**:

1. **Given** El sistema tiene cacheAtom, networkAtom, y memoryAtom definidos, **When** Se actualiza solo cacheAtom, **Then** Los otros dos átomos mantienen su valor

---

### User Story 3 - Integración con Provider (Priority: P3)

Como desarrollador, quiero que el Provider principal inicialice los listeners y enlace los módulos Core con los átomos, para que el sistema reaccione automáticamente a eventos del navegador.

**Why this priority**: La automatización reduce código repetitivo y asegura que los listeners se configuren correctamente.

**Acceptance Scenarios**:

1. **Given** El Provider envolventa la aplicación, **When** Se monta, **Then** Se inicializan los listeners de online/offline y el checker de memoria

---

### Edge Cases

- ¿Qué pasa cuando el navegador no soporta el API de memoria?
- ¿Cómo maneja el sistema múltiples actualizaciones rápidas del mismo átomo?
- ¿Qué pasa cuando el componente se desmonta mientras el átomo está siendo actualizado?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE proporcionar cacheAtom que almacene { totalItems, hitCount, missCount, lastAccessTime }
- **FR-002**: El sistema DEBE proporcionar networkAtom que almacene el estado de conexión (ONLINE/OFFLINE/LOW_BANDWIDTH) y métricas de RTT
- **FR-003**: El sistema DEBE proporcionar memoryAtom que almacene isUnderPressure y pressureLevel
- **FR-004**: Los componentes DEBEN poder suscribirse a cualquier átomo individualmente usando useAtomValue
- **FR-005**: Solo el componente que escucha un átomo específico DEBE re-renderizarse cuando ese átomo cambia
- **FR-006**: El Provider DEBE inicializar el listener de online/offline al montarse
- **FR-007**: El Provider DEBE programar el chequeo de memoria periódicamente
- **FR-008**: La función que actualiza cacheAtom DEBE ser llamada solo desde src/core/cache.ts

### Key Entities *(include if feature involves data)*

- **cacheAtom**: Estado del cache - items totales, hits, misses, último acceso
- **networkAtom**: Estado de red - estado de conexión, métricas RTT
- **memoryAtom**: Estado de memoria - presión y nivel de presión
- **Provider**: Componente envoltor que inicializa listeners y conecta módulos Core con átomos

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un componente que escucha un átomo específico NO se re-renderiza cuando otro átomo diferente cambia
- **SC-002**: El sistema responde a eventos online/offline del navegador dentro de 1 segundo
- **SC-003**: El chequeo de memoria se ejecuta al menos cada 10 segundos cuando la aplicación está activa
- **SC-004**: La transición de estado de red (ej. ONLINE a OFFLINE) refleja cambios visibles en UI en menos de 500ms

---

## Assumptions

- Jotai ya está disponible como dependencia o será añadida
- Los módulos Core existentes (cache.ts, network.ts, memory.ts) ya tienen la lógica de negocio
- El Provider existente se puede modificar o extender

## Notes

- Esta especificación se enfoca en el patrón de estado reactivo átomo, no en implementación específica de Jotai
- La ventaja principal es el re-renderizado selectivo comparado con React Context