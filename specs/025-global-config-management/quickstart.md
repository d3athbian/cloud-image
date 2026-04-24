# Quickstart: Global Configuration Management

## Overview

This feature centralizes all system configuration into a single source of truth, making it easy to configure the library globally without spreading configuration across multiple files.

## Basic Usage

### Setting Global Configuration

```typescript
import { getSystemSettings, setSystemSettings } from '@cloudimage/cloud';

// Set global configuration once at app initialization
setSystemSettings({
  cacheMaxSize: 200 * 1024 * 1024,  // 200MB
  requestTimeout: 15000,             // 15 seconds
  maxRetries: 5,
  enableLogging: true,
});

// All components now use these settings
const settings = getSystemSettings();
console.log(settings.cacheMaxSize); // 209715200
```

### Using Environment Variables

```bash
# In your .env file
CLOUD_CACHE_SIZE=209715200
CLOUD_TIMEOUT_MS=15000
CLOUD_MAX_RETRIES=5
CLOUD_LOGGING=true
```

```typescript
// Automatically reads from process.env
const settings = getSystemSettings();
```

### Default Configuration

If no configuration is set, sensible defaults are used:

| Setting | Default |
|---------|---------|
| cacheMaxSize | 100 MB |
| cacheDefaultTTL | 7 days |
| cacheMemoryTierSize | 20 MB |
| requestTimeout | 10 seconds |
| maxRetries | 3 |
| enableLogging | true (dev) / false (prod) |
| enableDevtools | false |
| enablePrefetch | true |

## Migration from Old API

### Before (Scattered Configuration)

```typescript
// In provider.tsx
<CloudProvider
  cache={{
    maxSize: 100 * 1024 * 1024,
    defaultTTL: 7 * 24 * 60 * 60 * 1000,
    maxRetries: 3,
  }}
/>

// In constants.ts
export const Time = { REQUEST_TIMEOUT: 10 * 1000 };

// In network.ts
const config = { sampleInterval: 5000 };
```

### After (Centralized)

```typescript
// Single configuration at app startup
setSystemSettings({
  cacheMaxSize: 100 * 1024 * 1024,
  cacheDefaultTTL: 7 * 24 * 60 * 60 * 1000,
  maxRetries: 3,
  requestTimeout: 10000,
});

// Components automatically use these values
<CloudProvider />
```

## API Reference

### `getSystemSettings()`

Returns the current system configuration. Returns defaults if not set.

```typescript
function getSystemSettings(): Readonly<CoreServiceOptions>
```

### `setSystemSettings(options: Partial<CoreServiceOptions>)`

Updates configuration. Merges with existing values.

```typescript
function setSystemSettings(options: Partial<CoreServiceOptions>): void
```

### `resetSystemSettings()`

Resets all configuration to defaults.

```typescript
function resetSystemSettings(): void
```