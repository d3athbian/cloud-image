# @cloudimage/cloud

High-performance image caching library for React applications, optimized for Smart TVs and resource-constrained devices.

## Features

- **LRU Cache with TTL**: Intelligent eviction with dual scoring (access count + recency)
- **Offline Support**: Service worker integration with IndexedDB storage
- **Network Resilience**: Exponential backoff retry and circuit breaker patterns
- **Memory Pressure Awareness**: Adaptive cache limits based on device memory
- **Bandwidth Intelligence**: Dynamic CDN variant selection based on connection speed
- **Zero Main Thread Blocking**: Web Worker for image decoding
- **Progressive Rendering**: Blur-up placeholders and smooth crossfade transitions

## Installation

```bash
npm install @cloudimage/cloud
```

## Quick Start

### 1. Wrap your app with CloudProvider

```tsx
import { CloudProvider } from '@cloudimage/cloud/react';

function App() {
  return (
    <CloudProvider config={{ maxSize: 50 * 1024 * 1024 }}>
      <MyImageGallery />
    </CloudProvider>
  );
}
```

### 2. Use CloudImage component

```tsx
import { CloudImage } from '@cloudimage/cloud/react';

function MyImageGallery() {
  return (
    <div>
      <CloudImage
        src="https://example.com/image.jpg"
        alt="Example image"
        width={800}
        height={600}
        placeholder="blur"
        crossfade
      />
    </div>
  );
}
```

### 3. Access cache and network status

```tsx
import { useCloud } from '@cloudimage/cloud/react';

function CacheStats() {
  const { cache, network } = useCloud();
  
  useEffect(() => {
    const stats = await cache.getStats();
    console.log('Cached items:', stats.itemCount);
  }, []);
  
  return (
    <div>
      <span>Network: {network.bandwidth}</span>
      <button onClick={() => cache.clear()}>Clear</button>
    </div>
  );
}
```

## API Reference

### CloudProvider

```tsx
<CloudProvider
  config={{
    maxSize: 50 * 1024 * 1024,     // Max cache size in bytes
    defaultTTL: 24 * 60 * 60 * 1000, // Default TTL in ms
    evictionBatchSize: 0.2,         // 20% of maxSize per eviction
    enablePrefetch: true,           // Enable prefetching
    enableOffline: true,            // Enable offline support
  }}
>
  {children}
</CloudProvider>
```

### CloudImage

```tsx
<CloudImage
  src="https://example.com/image.jpg"  // Image URL
  alt="Description"                     // Alt text
  width={800}                          // Display width
  height={600}                         // Display height
  placeholder="blur"                   // "blur" | "none"
  crossfade={true}                     // Enable crossfade transition
  quality="auto"                       // "auto" | "low" | "medium" | "high"
  priority={false}                     // Load with priority
/>
```

### useCloud Hook

```tsx
const { cache, network } = useCloud();

// cache methods
cache.getStats()           // Get cache statistics
cache.prefetch(urls)       // Prefetch multiple images
cache.clear()              // Clear entire cache
cache.invalidate(url)      // Invalidate specific URL

// network state
network.online             // boolean
network.bandwidth          // "low" | "medium" | "high" | "unknown"
network.mbps               // Mbps speed (if available)
```

## Configuration Options

### CacheConfig

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxSize` | number | 50MB | Maximum cache size |
| `defaultTTL` | number | 24h | Default time-to-live |
| `evictionBatchSize` | number | 0.2 | % of maxSize per eviction |
| `platformOverride` | string | auto | Force specific platform |

### CDN Variants

The library automatically selects CDN variants based on bandwidth:

- **Low (< 1 Mbps)**: Request thumbnail/small variants
- **Medium (1-5 Mbps)**: Request medium variants
- **High (> 5 Mbps)**: Request full resolution

## Platform Support

- **Web**: IndexedDB storage with Service Worker
- **Tizen**: Optimized for Samsung Smart TVs
- **webOS**: Optimized for LG Smart TVs
- **React Native**: Memory-mapped file storage (planned)

## Bundle Size

- **Minified**: 69.81 KB
- **Gzipped**: 17.31 KB

## Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run e2e tests
npm run test:e2e

# Run platform tests
npm run test:platform
```

## License

MIT
