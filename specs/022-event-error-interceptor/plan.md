# Implementation Plan: Generic Error Handling in Event Buses

**Branch**: `022-event-error-interceptor` | **Date**: 2026-04-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/022-event-error-interceptor/spec.md`

## Summary

Create an Event Bus Interceptor that wraps event listener callback execution in universal try/catch, logging errors with full context (module name, listener identifier, event type, timestamp, stack trace) to the centralized logger. Eliminates scattered try/catch blocks across NetworkMonitor, ResizeObserver, and other modules. Uses TypeScript 5.x strict mode, Vitest for testing.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)  
**Primary Dependencies**: None (wrapper pattern, no new deps)  
**Storage**: N/A  
**Testing**: Vitest  
**Target Platform**: Browser (window.addEventListener, Connection API)  
**Project Type**: Library  
**Performance Goals**: Minimal overhead per listener call (< 1ms)  
**Constraints**: Must handle sync and async errors, proper cleanup  
**Scale/Scope**: 5-10 existing listeners to refactor

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Library-first (no unnecessary deps) | ✅ PASS | No new dependencies added |
| TypeScript 5.x strict | ✅ PASS | Uses existing TypeScript config |
| Test-first | ⚠️ TO VERIFY | Tests must precede implementation |
| Observability | ✅ PASS | Core feature enhances logging |
| Code quality gates | ⚠️ TO VERIFY | After implementation |

## Project Structure

### Documentation (this feature)

```
specs/022-event-error-interceptor/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md            # Phase 2 output
```

### Source Code (repository root)

```
packages/cloud/src/
├── core/
│   └── event-interceptor.ts    # NEW - Event Bus Interceptor
├── utils/
│   └── logger.ts             # MODIFY - Add EventInterceptor logger

tests/unit/
├── event-interceptor.test.ts # NEW

# Existing listeners to refactor:
packages/cloud/src/core/network.ts          # Uses bound handlers
packages/cloud/src/service-worker/sw.ts    # Service Worker events
packages/cloud/src/service-worker/index.ts     # Service Worker registration
packages/cloud/src/core/prefetch.ts        # AbortController listener
```

**Structure Decision**: Single interceptor module in `core/event-interceptor.ts` wrapping existing addEventListener patterns

## Phase 0: Research

### Technical Context

The existing codebase already has:
- `NetworkMonitor` in `core/network.ts` with bound handlers and cleanup
- `logger` utility in `utils/logger.ts` with structured logging
- Manual try/catch in some places, inconsistent error handling

### Decisions

1. **Event Bus Interceptor Pattern**: Wrap native `addEventListener` with interceptor that catches both sync and async errors
2. **Context Capture**: Module name passed at registration, listener ID passed at registration, event type from native event
3. **Fallback Grace**: If logger fails, fall back to console.error
4. **Cleanup**: Store listener references for proper removeEventListener

### Research Complete

No NEEDS CLARIFICATION markers in spec - all requirements are clear and implementable with existing technology.

## Phase 1: Design

### Entities

1. **EventInterceptor**: Main class wrapping addEventListener
   - `on(eventType, handler, options?)` - registers with error capture
   - `off(eventType, handler)` - removes listener
   - `destroy()` - cleanup all listeners

2. **ErrorContext**: Structured error data
   - module: string
   - listenerId: string  
   - eventType: string
   - timestamp: number
   - stack: string
   - error: Error

### Interface Contracts

The interceptor exposes:
- `on(target, eventType, listenerId, callback)` - register with error handling
- `off(target, eventType, callback)` - unregister
- Wrapped events: window online/offline, connection change, resize, service worker messages

No external API changes - internal wrapper for existing event patterns.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | - | - |

## Next Steps

- Phase 2: Write `tasks.md` with task breakdown
- Implement `event-interceptor.ts` with test-first approach
- Refactor `network.ts` to use interceptor
