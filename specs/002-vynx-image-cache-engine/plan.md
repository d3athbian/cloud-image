# Implementation Plan: VYNX Engine - Visual Asset Orchestration System

**Branch**: `002-vynx-image-cache-engine` | **Date**: 2026-03-19 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/002-vynx-image-cache-engine/spec.md`

## Summary

VYNX is a Visual Asset Orchestration System designed to eliminate browser performance limitations, especially on resource-constrained Smart TVs. The system provides near-zero perceived latency for image loading through a layered architecture: Presentation (React components), Orchestration (priority/eviction engine), Transport (Web Worker), and Adaptation (platform-specific storage). Key differentiators include the 2ms blocking rule, automatic platform detection, predictive caching, and zero-setup DX.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)  
**Primary Dependencies**: React 18+, idb (IndexedDB wrapper), react-native-fflate (worker compression)  
**Storage**: Platform-adaptive (IndexedDB/Web, FileSystem API/Tizen-WebOS, In-Memory/Fallback)  
**Testing**: Vitest (unit), Playwright via `playwright-cli` skill (integration/e2e), custom performance benchmarks  
**Target Platform**: Web browsers, Smart TVs (Tizen 6+, WebOS 5+), WebViews (iOS/Android)  
**Project Type**: React library (framework-agnostic core with React bindings)  
**Performance Goals**: <2ms main thread blocking, <50ms cache retrieval, 55+ fps scrolling, zero CLS  
**Constraints**: <100KB initial bundle (tree-shakeable), Worker-based I/O isolation, <2ms main thread  
**Scale/Scope**: Single library targeting 4 platforms, zero external runtime dependencies

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|----------|--------|-------|
| I. Library-First | ✅ PASS | VYNX is a standalone library with clear API surface |
| II. Observability & DevTools | ✅ PASS | Chrome DevTools MCP + structured logging |
| III. Test-First | ✅ PASS | Unit + integration tests (Vitest + playwright-cli) |
| IV. Versioning | ✅ PASS | SemVer with changelog per release |

**Violations requiring justification**: None identified.

## Project Structure

### Documentation (this feature)

```text
specs/002-vynx-image-cache-engine/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── vynx-image-contract.md
│   ├── vynx-provider-contract.md
│   └── vynx-worker-protocol.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
packages/
├── vynx/                    # Main library package (published to npm)
│   ├── src/
│   │   ├── core/            # Framework-agnostic engine
│   │   │   ├── engine.ts    # ImageEngine - orchestration logic
│   │   │   ├── cache.ts     # LRU/TTL cache algorithms
│   │   │   ├── queue.ts     # Priority queue for requests
│   │   │   └── types.ts     # Core type definitions
│   │   ├── adapters/        # Platform storage adapters (tree-shakeable)
│   │   │   ├── index.ts     # Auto-detection + exports
│   │   │   ├── web.ts       # IndexedDB adapter
│   │   │   ├── tizen.ts     # Tizen FileSystem adapter
│   │   │   ├── webos.ts     # WebOS FileSystem adapter
│   │   │   └── memory.ts    # Fallback memory adapter
│   │   ├── worker/          # Transport layer (Web Worker)
│   │   │   ├── worker.ts    # Worker entry point
│   │   │   ├── fetch.ts     # Network operations
│   │   │   ├── storage.ts   # Adapter communication
│   │   │   └── compression.ts
│   │   ├── react/            # React bindings
│   │   │   ├── provider.tsx  # VynxProvider
│   │   │   ├── image.tsx     # VynxImage component
│   │   │   └── hooks.ts      # useVynx hook
│   │   └── index.ts         # Package exports
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── performance/
│   └── package.json
└── vynx-devtools/           # Developer debugging tools (optional)
    └── src/cli.ts

demos/                        # Demo app (EXCLUDED from npm bundle)
└── vynx-demo/               # Testing demo with 100+ images

docs/
└── DISTRIBUTION.md           # npm install instructions, usage examples

tests/
├── e2e/                     # End-to-end tests
└── platform/                # Platform-specific integration tests
```

**Structure Rationale**: 
- Monorepo with `packages/` structure enables tree-shaking
- `/demos/` is OUTSIDE packages/ to ensure clean npm bundle
- Vite config excludes `/demos/` from bundle
- Core/engine is framework-agnostic; React bindings are isolated

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations requiring complexity tracking at this stage.

---

## Phase 0: Research ✅ COMPLETE

### Research Outputs

- [x] Web Worker + React Integration patterns
- [x] IndexedDB/Platform Performance considerations
- [x] FileSystem API Compatibility (Tizen/WebOS)
- [x] Tree-Shaking strategy for adapters
- [x] Zero-Copy Transfer via Transferables

[See `research.md`](./research.md)

---

## Phase 1: Design & Contracts ✅ COMPLETE

### Data Model

[See `data-model.md`](./data-model.md)

### Contracts

| Contract | Purpose | Status |
|----------|---------|--------|
| `vynx-image-contract.md` | VynxImage props, states, events | ✅ |
| `vynx-provider-contract.md` | VynxProvider config, context shape | ✅ |
| `vynx-worker-protocol.md` | Worker message protocol (requests/responses) | ✅ |

### Quickstart

[See `quickstart.md`](./quickstart.md)

### Agent Context Update

✅ Complete - Updated `AGENTS.md` with TypeScript 5.x, React 18+, idb, react-native-fflate

---

## Constitution Check (Post-Design Review)

| Principle | Status | Notes |
|----------|--------|-------|
| I. Library-First | ✅ PASS | Monorepo with tree-shakeable adapters |
| II. Observability & DevTools | ✅ PASS | DevTools MCP + Worker structured logging |
| III. Test-First | ✅ PASS | 40+ test tasks (Vitest unit + playwright-cli integration/e2e + demo stress tests) |
| IV. Versioning | ✅ PASS | SemVer, CHANGELOG.md in tasks |

**No violations identified after design review.**

---

## Testing Tools

### Unit Testing: Vitest
- Fast unit tests (~50ms/test)
- TDD workflow for core logic
- All public APIs must have unit test coverage

### Integration/E2E Testing: Playwright via `playwright-cli` skill
- Browser automation for component testing
- Smart TV scenario simulation
- Uses the project's `playwright-cli` skill for efficient test execution
- Located in `tests/e2e/` and `tests/platform/`

### Demo App: /demos/vynx-demo
- Minimal React app for testing with 100+ images
- Stress test with configurable image count
- Offline testing capabilities
- **NOTE**: Located OUTSIDE packages/vynx to exclude from npm bundle

### Distribution Testing Scripts (via playwright-cli)
```bash
# Cache hit test
playwright-cli screenshot --url "http://localhost:3000" --count 100

# Stress test (100+ images)
playwright-cli screenshot --url "http://localhost:3000?count=100" --times 3

# Offline test
playwright-cli screenshot --offline --url "http://localhost:3000"

# Performance benchmark
playwright-cli screenshot --measure-load-time --url "http://localhost:3000"
```

### Test Execution
```bash
npm test                    # Vitest unit tests
npm run test:e2e           # Playwright e2e tests (via playwright-cli)
npm run test:performance    # Custom performance benchmarks
npm run demo               # Start demo app (demos/vynx-demo)
```

---

## Next Steps

1. Generate tasks via `/speckit.tasks`
2. Implement core modules (test-first)
3. Build platform adapters (tree-shakeable)
