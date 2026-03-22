# Distribution Guide - CLOUD Image Cache

## Installation

### npm

```bash
npm install @cloudimage/cloud
```

### pnpm

```bash
pnpm add @cloudimage/cloud
```

### yarn

```bash
yarn add @cloudimage/cloud
```

### CDN (UMD)

```html
<script src="https://unpkg.com/@cloudimage/cloud/dist/index.umd.js"></script>
```

## Quick Start

### 1. Wrap your app with CloudProvider

```tsx
import { CloudProvider } from '@cloudimage/cloud';

function App() {
  return (
    <CloudProvider>
      <YourApp />
    </CloudProvider>
  );
}
```

### 2. Replace `<img>` with `<CloudImage>`

```tsx
import { CloudImage } from '@cloudimage/cloud';

// Before
<img src="image.jpg" alt="Description" />

// After
<CloudImage src="image.jpg" alt="Description" />
```

## Configuration

```tsx
<CloudProvider
  config={{
    maxSize: 200 * 1024 * 1024, // 200MB cache
    defaultTTL: 14 * 24 * 60 * 60 * 1000, // 14 days
    debug: true,
  }}
>
```

## API Reference

### CloudProvider

```tsx
interface CloudProviderProps {
  config?: {
    maxSize?: number;
    defaultTTL?: number;
    memoryTierSize?: number;
    debug?: boolean;
  };
  children: React.ReactNode;
}
```

### CloudImage

```tsx
interface CloudImageProps {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}
```

### useCloud Hook

```tsx
import { useCloud } from '@cloudimage/cloud';

function Component() {
  const { cache, network } = useCloud();
  
  // cache.getStats()
  // cache.prefetch(urls)
  // cache.clear()
  // cache.invalidate(url)
  
  // network.online
  // network.bandwidth
}
```

## Testing with playwright-cli

### Cache Hit Test

```bash
./scripts/cache-hit-test.sh http://localhost:3000 50
```

### Stress Test

```bash
# Test with 100 images
./scripts/run-stress-test.sh 100

# Test with 500 images
./scripts/run-stress-test.sh 500
```

### Offline Test

```bash
./scripts/offline-test.sh http://localhost:3000
```

## Using in Another Repository

1. Install the package:
```bash
npm install @cloudimage/cloud
```

2. Add to your app:
```tsx
import { CloudProvider, CloudImage } from '@cloudimage/cloud';

function App() {
  return (
    <CloudProvider>
      <img-component />
    </CloudProvider>
  );
}
```

3. Run playwright tests:
```bash
# From your repo
npx playwright install
./path/to/cloud-image/scripts/cache-hit-test.sh http://localhost:3000
```

## Bundle Size

The library is tree-shakeable. Import only what you use:

```tsx
// Full import (~15KB gzipped)
import { CloudProvider, CloudImage, useCloud } from '@cloudimage/cloud';

// Tree-shakeable imports
import { CloudProvider } from '@cloudimage/cloud';
import { CloudImage } from '@cloudimage/cloud/react';
```

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 14+
- Edge 80+

## Platform Support

- **Web**: IndexedDB storage
- **Smart TVs**: Tizen 6+, WebOS 5+ (FileSystem API)
- **WebView**: Memory fallback
