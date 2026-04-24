# Research: Global Configuration Management

## Decision: Configuration Architecture

**Chosen Approach**: Centralized configuration with singleton getter pattern

### Rationale

1. **Single Source of Truth**: Configuration should be defined in one place (`core-options.ts`) and accessed via `getSystemSettings()`
2. **Environment Variable Support**: Use `process.env` pattern for runtime configuration
3. **Type Safety**: Full TypeScript strict mode compliance with validated types
4. **Backward Compatibility**: Maintain existing API surface while consolidating internally

### Implementation Pattern

```typescript
// src/types/core-options.ts
export interface CoreServiceOptions {
  baseUrl?: string;
  timeoutMs: number;
  maxRetries: number;
  isLoggingEnabled: boolean;
  // ... other options
}

// src/index.ts
export function getSystemSettings(): CoreServiceOptions {
  // Read from env vars, apply defaults, validate
}
```

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| Context-based config | Adds React dependency, not suitable for non-React consumers |
| Class singleton with setters | More verbose, harder to tree-shake |
| Config file (JSON/YAML) | Requires build step, not runtime dynamic |
| Environment variables only | No defaults, hard to know what's available |

## Implementation Details

### File Changes Required

1. **NEW**: `src/types/core-options.ts` - CoreServiceOptions interface
2. **MODIFY**: `src/index.ts` - Add getSystemSettings() export
3. **MODIFY**: `src/react/provider.tsx` - Use getSystemSettings()
4. **MODIFY**: `src/core/network.ts` - Check for direct config access

### Key Implementation Notes

- Use `Object.freeze()` for default config to prevent mutation
- Validate all numeric values (no negative timeouts, etc.)
- Support runtime updates via setter function
- Include JSDoc documentation marking as "Single Source of Truth"

### Environment Variable Mapping

| Env Variable | Config Property | Default |
|--------------|-----------------|---------|
| `CLOUD_TIMEOUT_MS` | timeoutMs | 10000 |
| `CLOUD_MAX_RETRIES` | maxRetries | 3 |
| `CLOUD_LOGGING` | isLoggingEnabled | true (dev) / false (prod) |

## Validation Complete

All [NEEDS CLARIFICATION] items resolved:
- TypeScript strict mode: Required (per constitution)
- No additional dependencies needed
- Implementation is straightforward refactoring