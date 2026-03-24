# Quickstart: Service Worker Image Cache

**Feature**: 003-workers-to-serviceworkers

## Overview

This library provides a persistent image caching solution using Service Workers with IndexedDB storage. All image operations run off the main thread for optimal performance.

## Storage Architecture

- **IndexedDB Database**: `carbon-image-cache`
- **Object Store**: `images` with URL as key
- **Persistence**: Images survive browser restarts
- **Service Worker**: Intercepts fetch requests, manages cache

## Setup

```typescript
import { createCloudEngine } from '@carbon-image/cloud';

// Create engine with default config
const engine = await createCloudEngine();

// Or with custom config
const customEngine = await createCloudEngine({
  maxSize: 200 * 1024 * 1024, // 200MB
  defaultTTL: 14 * 24 * 60 * 60 * 1000, // 14 days
});
```

## Basic Usage

```typescript
// Load an image (automatically cached)
const imageUrl = await engine.get('https://example.com/image.jpg');
if (imageUrl) {
  document.querySelector('img').src = imageUrl;
}

// Get cache statistics
const stats = await engine.getStats();
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);

// Clear cache
await engine.clear();
```

## Service Worker Registration

The Service Worker is registered automatically on first call to `createCloudEngine()`.

```typescript
// Check if Service Worker is active
const isSWActive = await engine.isServiceWorkerActive();

// Force Service Worker update
await engine.updateServiceWorker();
```

## Network-Aware Loading

Images automatically adapt to network conditions:

```typescript
// Get current network status
const status = engine.getNetworkStatus();
console.log(`Online: ${status.online}, Bandwidth: ${status.bandwidth}`);
```

## Cache Management

```typescript
// Delete specific image from cache
await engine.delete('https://example.com/image.jpg');

// Check circuit breaker state
const circuitState = engine.getCircuitBreakerState();
```

## Offline Support

Once images are cached, they work offline:

```typescript
// Works offline after initial load
const cachedUrl = await engine.get('https://example.com/image.jpg');
// Returns blob URL even when offline
```

## Cleanup

```typescript
// Destroy engine and terminate Service Worker
engine.destroy();
```
