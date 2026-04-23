# Feature Specification: Bundle Size Optimización y Tree-Shaking

**Feature Branch**: `016-bundle-tree-shaking`  
**Created**: 2026-04-22  
**Status**: Draft  
**Input**: User description: "Optimización de tamaño de bundle y tree-shaking. La estructura es generalmente amigable para tree-shaking porque las importaciones parecen estar confinadas a módulos específicos. Sin embargo, existen áreas clave de preocupación: Importaciones por Defecto y Puntos de Entrada Globales, Inflación de Adaptadores, Utilidades Globales."

## User Scenarios & Testing *(mandatory)*

## Clarifications

### Session 2026-04-22

- Q: ¿Cuál es el objetivo de reducción de tamaño del bundle? → A: Máximo posible - tree-shaking al 100% y adaptadores cargados por plataforma.
- Q: ¿Cómo manejar retrocompatibilidad con consumidores existentes? → A: Breaking change - sin backward compatibility needed.

### User Story 1 - Optimización de Imports en Puntos de Entrada (Priority: P1)

Un consumidor de la librería que solo necesita funciones específicas (por ejemplo, solo la función `cache.get()`) debe poder importar únicamente esa función sin incluir código no utilizado en su bundle final.

**Why this priority**: Los desarrolladores que importan funciones específicas esperan que el bundler elimine código no utilizado. Si los puntos de entrada usan importaciones por defecto o namespace (import * as X), el tree-shaking no funciona correctamente, resultando en bundles más grandes.

**Independent Test**: Un consumidor puede importar una sola función nombrada y verificar que el bundle final no incluya código de otras funciones no utilizadas.

**Acceptance Scenarios**:

1. **Given** un consumidor importa `import { cache } from '@cloud...'`, **When** el bundler analiza el código, **Then** el bundle solo incluye el módulo de cache y sus dependencias directas.
2. **Given** un consumidor importa `import { retry } from '@cloud...'`, **When** el bundler analiza el código, **Then** el bundle no incluye código del módulo de cache.

---

### User Story 2 - Carga Condicional de Adaptadores de Plataforma (Priority: P2)

Un consumidor que solo necesita un adaptador de plataforma específico (por ejemplo, solo el adaptador para browser) no debe descargar código de otros adaptadores que no utiliza.

**Why this priority**: Los adaptadores (storage, cache backend) representan código significativo. Un usuario de React Native no debería descargar el código del adaptador IndexedDB para browser, y viceversa.

**Independent Test**: Un consumidor puede importar solo el adaptador que necesita y verificar que el bundle no contiene código de otros adaptadores.

**Acceptance Scenarios**:

1. **Given** un consumidor solo importa el adaptador `browserStorage`, **When** se construye el bundle, **Then** el código de `idbStorage` adapter no está incluido.
2. **Given** un consumidor usa `React.lazy()` para cargar un componente que requiere un adaptador, **When** se renderiza el componente, **Then** el adaptador se carga dinámicamente bajo demanda.

---

### User Story 3 - Utilidades Índice Limpias (Priority: P3)

Los archivos de índice (`src/utils/index.ts`, `src/core/index.ts`) deben exportar solo las funciones que los consumidores realmente necesitan, evitando lareexportación que incluya código no utilizado.

**Why this priority**: Los archivos índice que re-exportan todo el contenido de submódulos pueden incluir inadvertidamenteUtilidades que no son parte de la API pública, causando mayor tamaño de bundle.

**Independent Test**: Un consumidor puede verificar que las utilidades índice solo contienen re-exportes explícitos de funciones necesarias.

**Acceptance Scenarios**:

1. **Given** `src/core/index.ts` re-exporta funciones, **When** se análisis, **Then** cada re-export es explícito (`export { retry }`) no agregado (`export * from './retry'`).

---

### Edge Cases

- ¿Qué sucede cuando un consumidor usa barras de estrellas (namespace imports) por razones de compatibilidad? Se debe documentar que estas no permiten tree-shaking óptimo.
- ¿Cómo manejar funciones utilitarias internas que no deben ser parte de la API pública pero están en los mismos archivos?

## Limitaciones Técnicas Documentadas

### Lazy Loading de Adaptadores

**Por qué no se implementó lazy loading dinámico:**

El sistema de caché requiere que el adaptador esté disponible inmediatamente en el constructor de `ImageEngine`. TypeScript no permite constructores async, lo que genera un conflicto:

```ts
// Esto no funciona:
constructor(config) {
  this.adapter = await createAdapter(...) // ❌ No allowed en constructor
}

// Esto sí funciona:
constructor(config) {
  this.adapter = createAdapterSync(...) // ✅ Síncrono
}
```

**Alternativas evaluadas:**
1. `createAdapter()` async → Engine requiere sync
2. Constructor async → TypeScript no lo permite
3. Lazy init post-constructor → Complejo, menor benefício

**Solución implementada:**
- Static imports con named exports
- Vite ya genera chunks separados por plataforma
- Tree-shaking funciona a nivel de export (no de chunk)

**Resultado:** El objetivo de reducción de bundle se logra mediante named exports, aunque no mediante lazy loading dinámico.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Los puntos de entrada de la librería (`src/index.ts`, `src/core/index.ts`, `src/utils/index.ts`) deben usar solo importaciones nombradas (named exports/imports) para permitir tree-shaking óptimo.
- **FR-002**: Los adaptadores de plataforma en `src/adapters/*` deben cargarse dinámicamente bajo demanda usando `import()` dinámico o `React.lazy()`, no estáticamente al nivel superior.
- **FR-003**: Los archivos índice (`src/utils/index.ts`, `src/core/index.ts`) deben usar re-exportes explícitos (`export { foo }`) en lugar de agregación (`export * from './module'`).
- **FR-004**: Cualquier importación por defecto (default imports) o namespace (import * as X) debe ser auditada y convertida a importaciones nombradas donde sea posible.
- **FR-005**: La API pública debe estar claramente definida y todas las exportaciones no intentas deben ser marcadas como internas (prefijadas con `_` o uso de comentarios `@internal`).

### Key Entities *(include if feature involves data)*

- **Puntos de Entrada**: Archivos públicos que exportan la API de la librería (`src/index.ts`, submódulos públicos).
- **Adaptadores**: Implementaciones de almacenamiento para diferentes plataformas (browser idb, React Native fflate, etc.).
- **Índices de Módulos**: Archivos que re-exportan utilidades (`src/utils/index.ts`, `src/core/index.ts`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un consumidor que importa solo una función nombrada debe ver **reducción del 100%** en código no utilizado comparado con importaciones namespace.
- **SC-002**: El bundle de un consumidor que usa un solo adaptador de plataforma **no debe incluir código de ningún otro adaptador**.
- **SC-003**: Los archivos de índice no deben contener re-exportes agregados que incluyanUtilidades no intenciónales.
- **SC-004**: El 100% de las importaciones en puntos de entrada públicos deben ser importaciones nombradas para habilitar tree-shaking.
- **SC-005**: Cada adaptador de plataforma debe ser un chunk separado que se carga bajo demanda solo cuando se usa esa plataforma.