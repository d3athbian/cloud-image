# QuickStart: Optimized Bundle Import

## Import Only What You Need

```ts
// Import specific modules (tree-shaking enabled)
import { ImageCache } from '@cloud/core/cache';
import { createWebAdapter } from '@cloud/adapters/web';

// Dynamic adapter loading (lazy chunk)
const adapter = platform === 'browser' 
  ? await import('@cloud/adapters/web')
  : await import('@cloud/adapters/memory');
```

## Platform-Specific Imports

```ts
// Browser only - bundle excludes other adapters
import { createWebAdapter } from '@cloud/adapters';

// React Native - bundle excludes browser adapter
import { createMemoryAdapter } from '@cloud/adapters';
```

## Bundle Verification

Run build and verify with:
```bash
npm run build && npm run analyze
```

Check that unused modules are NOT in the output chunks.