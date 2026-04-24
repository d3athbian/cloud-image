# Implementation Plan: Global Configuration Management

**Branch**: `025-global-config-management` | **Date**: 2026-04-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/025-global-config-management/spec.md`

## Summary

Centralize all system configuration options into a single source of truth (`CoreServiceOptions`), with a unified getter function (`getSystemSettings()`) that reads from environment variables and provides validated default values. Refactor all consumers (Provider, Network, etc.) to use this centralized configuration.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)  
**Primary Dependencies**: jotai (state), idb (IndexedDB), React 19, **zod (validation)**
**Storage**: IndexedDB via idb wrapper  
**Testing**: Vitest (unit), Playwright (integration/e2e)  
**Target Platform**: Web browsers, Service Workers  
**Project Type**: Library (npm package)  
**Performance Goals**: Minimal overhead for configuration reads  
**Constraints**: Must maintain backward compatibility with existing API  

## Current Configuration Sources (to consolidate)

| Source File | Configuration Values |
|-------------|---------------------|
| `src/config/constants.ts` | Time, Size, Threshold, DEFAULT_CACHE_CONFIG |
| `src/core/types.ts` | CacheConfig interface |
| `src/react/provider.tsx` | Imports Size, Time constants directly |
| `src/core/network.ts` | NetworkMonitorConfig (local to module) |

## Constitution Check

**GATE**: Must pass before Phase 0 research. Re-check after Phase 1 design.

| Gate | Status | Notes |
|------|--------|-------|
| Library-First | ✅ PASS | This IS a library feature |
| Observability | ✅ PASS | Configuration is observable via getSystemSettings() |
| Test-First | ✅ PASS | Implementation will follow TDD |
| Versioning | ✅ PASS | Will follow semver |

### Post-Design Verification

All constitution principles verified:
- ✅ No new external dependencies introduced (zod is lightweight validation ~2KB)
- ✅ TypeScript strict mode maintained
- ✅ Test-first approach will be followed
- ✅ Library remains self-contained

## Project Structure

### Documentation (this feature)

```text
specs/025-global-config-management/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (packages/cloud)

```text
packages/cloud/
├── src/
│   ├── index.ts                    # Add getSystemSettings() export
│   ├── types/
│   │   └── core-options.ts         # NEW: CoreServiceOptions interface
│   ├── config/
│   │   └── constants.ts            # Existing constants
│   ├── core/
│   │   ├── types.ts                # Existing types
│   │   ├── network.ts              # Consumer to refactor
│   │   └── engine.ts               # Consumer to check
│   ├── react/
│   │   └── provider.tsx            # Consumer to refactor
│   └── utils/
│       └── logger.ts               # Check for config access
```

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No complexity violations identified - this is a refactoring task with no new external dependencies.
