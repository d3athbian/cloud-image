# Quickstart: VYNX Engine

**Time to complete**: ~5 minutes  
**Prerequisites**: React 18+ project with npm/pnpm/yarn

---

## Installation

```bash
npm install vynx
# or
pnpm add vynx
# or
yarn add vynx
```

---

## Step 1: Wrap Your App (30 seconds)

```tsx
// src/App.tsx
import { VynxProvider } from 'vynx';

function App() {
  return (
    <VynxProvider>
      {/* Your app content */}
    </VynxProvider>
  );
}
```

**What this does**:
- Initializes the Web Worker
- Detects your platform (Web, Tizen, WebOS)
- Sets up the cache with smart defaults

---

## Step 2: Replace `<img>` with `<VynxImage>` (1 minute)

```tsx
// Before (vanilla img)
<img 
  src="https://example.com/hero.jpg" 
  alt="Hero image" 
  width={800} 
  height={600}
/>

// After (VYNX)
import { VynxImage } from 'vynx';

<VynxImage 
  src="https://example.com/hero.jpg" 
  alt="Hero image" 
  width={800} 
  height={600}
/>
```

**Benefits**:
- Images auto-cache on first view
- Zero layout shifts (CLS = 0)
- Instant display on repeat views

---

## Step 3: Add Width/Height for Best Results

```tsx
// Always specify dimensions for CLS prevention
<VynxImage 
  src="https://example.com/gallery/photo.jpg"
  width={1920}
  height={1080}
  alt="Gallery photo"
/>
```

---

## Advanced: Custom Configuration

```tsx
<VynxProvider
  config={{
    maxSize: 200 * 1024 * 1024, // 200MB cache
    defaultTTL: 14 * 24 * 60 * 60 * 1000, // 14 days
    memoryTierSize: 50 * 1024 * 1024, // 50MB memory
    debug: true, // Enable logging
  }}
>
  <App />
</VynxProvider>
```

---

## Advanced: Programmatic Cache Control

```tsx
import { useVynx } from 'vynx';

function GalleryControls() {
  const { cache, network } = useVynx();
  
  const handlePrefetch = async () => {
    await cache.prefetch([
      '/gallery/photo-1.jpg',
      '/gallery/photo-2.jpg',
      '/gallery/photo-3.jpg',
    ]);
  };
  
  const handleClear = async () => {
    await cache.clear();
  };
  
  return (
    <div>
      <p>Network: {network.online ? 'Online' : 'Offline'}</p>
      <button onClick={handlePrefetch}>Prefetch Gallery</button>
      <button onClick={handleClear}>Clear Cache</button>
    </div>
  );
}
```

---

## Platform-Specific Notes

### Web (Chrome, Firefox, Safari)

Works out of the box using IndexedDB. No additional setup.

### Tizen Smart TVs

Works out of the box using FileSystem API. 
- Ensure your TV runs Tizen 6.0+
- Check Settings > Network > TV Connection

### WebOS (LG Smart TVs)

Works out of the box using FileSystem API.
- Ensure your TV runs WebOS 5.0+
- Check Settings > Network > TV Connection

### WebViews (React Native, Capacitor)

Falls back to memory caching by default.
- For persistent caching, implement custom adapter

---

## Troubleshooting

### Images not caching

1. Check console for errors
2. Verify network is accessible
3. Try with debug mode enabled:
   ```tsx
   <VynxProvider config={{ debug: true }}>
   ```

### Layout shifts occurring

1. Always provide width/height props
2. Use aspect ratio for responsive images:
   ```tsx
   <VynxImage 
     src="..." 
     style={{ aspectRatio: '16/9' }}
   />
   ```

### Slow on Smart TV

1. Reduce memory tier size (TVs have limited RAM)
2. Clear cache and rebuild:
   ```tsx
   const { cache } = useVynx();
   await cache.clear();
   ```

---

## What's Next?

- [API Reference](./api.md)
- [Architecture Deep Dive](./architecture.md)
- [Platform Adapter Guide](./adapters.md)
- [Performance Tuning](./performance.md)
