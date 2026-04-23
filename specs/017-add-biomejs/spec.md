# Feature Specification: Agregar BiomeJS para Linting y Formatting

**Feature Branch**: `017-add-biomejs`  
**Created**: 2026-04-22  
**Status**: Draft  
**Input**: Reemplazar ESLint por BiomeJS para linting y formatting

## User Scenarios & Testing

### User Story 1 - BiomeJS como Linter (Priority: P1)

Un desarrollador que ejecuta `npm run lint` debe obtener errores de linting sin configuración compleja de ESLint.

**Why this priority**: BiomeJS es más rápido y tiene mejor integración que ESLint+Prettier.

**Acceptance Scenarios**:

1. **Given** `npm run lint` se ejecuta, **Then** errores de lint aparecen correctamente.
2. **Given** `npm run format` se ejecuta, **Then** código se formatea automáticamente.

---

### Edge Cases

- N/A - BiomeJS cubre todos los casos de ESLint+Prettier

## Requirements

### Functional Requirements

- **FR-001**: BiomeJS debe estar instalado como devDependency
- **FR-002**: `npm run lint` debe usar `biome check src --write`
- **FR-003**: `npm run format` debe usar `biome format --write src`
- **FR-004**: biome.json debe configurarse para el proyecto
- **FR-005**: Se mantienen static imports para adaptadores (lazy loading no viable por limitación de TypeScript)

## Success Criteria

### Measurable Outcomes

- **SC-001**: `npm run lint` pasa sin errores
- **SC-002**: Build funciona correctamente después de cambios
- **SC-003**: 0 errores de BiomeJS