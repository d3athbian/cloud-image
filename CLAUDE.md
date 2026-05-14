# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`carbon-image` is a monorepo containing `@cloudimage/cloud` - a high-performance image caching library for React applications, optimized for Smart TVs and resource-constrained devices.

**Main package:** `packages/cloud/` - contains the library source

## Development Commands

```bash
cd packages/cloud

npm run build        # Build library + service worker
npm run dev          # Watch mode build
npm run typecheck    # TypeScript type checking
npm run test         # Run unit tests with Vitest
npm run test:coverage # With coverage report
npm run test:ui      # Open Vitest UI
npm run lint         # Biome check + fix
npm run lint:check   # Biome check only
npm run format       # Biome format
```

## Architecture

```
packages/cloud/src/
├── core/           # Framework-agnostic cache engine
│   ├── cache.ts    # LRU/TTL eviction (90% trigger, dual scoring)
│   ├── engine.ts   # Main orchestrator
│   ├── network.ts  # RTT measurement, bandwidth classification
│   ├── circuit-breaker.ts
│   └── memory.ts   # Memory pressure detection
├── adapters/       # Platform storage (tree-shakeable)
├── worker/         # Web Worker + ImageBitmap decoding
├── react/          # CloudImage, CloudProvider, useCloud hooks
├── debugger/       # DevTools Panel (Tailwind CSS v4, Jotai)
├── service-worker/ # SW registration and handler
├── types/          # Zod schemas for config validation
└── config/         # Settings management
```

## Key Technical Decisions

- **Cache Eviction:** LRU dual scoring (accessCount × 0.6 + recencyFactor × 0.4), triggered at 90% of maxSize
- **Network Resilience:** Exponential backoff retry, circuit breaker (3 failures → OPEN → 30s wait → HALF_OPEN)
- **Latency-Aware CDN:** RTT > 500ms → request small variant, background upgrade to full resolution
- **Decode Async:** ImageBitmap decoding in Worker with Transferable objects for zero-copy

## Build Output

Vite produces multiple entry points: `index.js`, `core.js`, `adapters.js`, `react.js`, `debugger.js`, `register.js`, and a standalone `sw.js` (IIFE service worker built with esbuild).

## Specs

Feature specs are in `specs/` directory (e.g., `027-panel-ui-improvements/`) - these contain detailed implementation requirements and design decisions.

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan at:
`specs/031-perf-refactor/plan/impl-plan.md`
<!-- SPECKIT END -->
