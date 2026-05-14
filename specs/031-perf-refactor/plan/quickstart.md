# Quickstart: Performance Refactor

**Feature**: 031-perf-refactor
**Date**: 2026-05-13

---

## Overview

This refactor addresses four critical performance issues:

1. **Memory leaks** with ObjectURLs not being revoked
2. **Component bloat** from a 130+ line useEffect with 14 dependencies
3. **Scroll performance** from individual IntersectionObserver per image
4. **Silent errors** masked by empty catch blocks

---

## File Changes

### New Files

```
src/react/hooks/
├── useNetworkMonitor.ts      # Network state hook
├── useImageCacheLoader.ts    # Cache loading logic
├── useCrossfadeAnimation.ts   # Animation timing
└── useBlobUrl.ts            # ObjectURL lifecycle

src/utils/
├── GlobalIntersectionObserver.ts  # Singleton observer manager
├── blobUrlRegistry.ts              # ObjectURL tracking
└── logger.ts                      # Enhanced (existing, modified)
```

### Modified Files

```
src/react/image.tsx  # Refactor to use hooks (target: <30 lines in useEffect)
```

---

## Implementation Order

### Step 1: BlobUrlRegistry

```typescript
// src/utils/blobUrlRegistry.ts
class BlobUrlRegistry {
  private urls = new Map<string, string>();

  create(blob: Blob, componentId: string): string {
    const url = URL.createObjectURL(blob);
    const old = this.urls.get(componentId);
    if (old) this.revoke(old);
    this.urls.set(componentId, url);
    return url;
  }

  revoke(url: string): void {
    if (url?.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
    for (const [id, existing] of this.urls) {
      if (existing === url) {
        this.urls.delete(id);
        break;
      }
    }
  }
}

export const blobUrlRegistry = new BlobUrlRegistry();
```

### Step 2: useBlobUrl Hook

```typescript
// src/react/hooks/useBlobUrl.ts
export function useBlobUrl() {
  const objectUrlRef = useRef<string | null>(null);

  const createUrl = useCallback((blob: Blob, componentId: string) => {
    if (objectUrlRef.current) {
      blobUrlRegistry.revoke(objectUrlRef.current);
    }
    const url = blobUrlRegistry.create(blob, componentId);
    objectUrlRef.current = url;
    return url;
  }, []);

  const revokeUrl = useCallback(() => {
    if (objectUrlRef.current) {
      blobUrlRegistry.revoke(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => revokeUrl();
  }, [revokeUrl]);

  return { objectUrl: objectUrlRef.current, createUrl, revokeUrl };
}
```

### Step 3: GlobalIntersectionObserver

```typescript
// src/utils/GlobalIntersectionObserver.ts
class GlobalIntersectionObserverManager {
  private observer: IntersectionObserver | null = null;
  private callbacks = new WeakMap<Element, IntersectionObserverCallback>();
  private options = new WeakMap<Element, IntersectionObserverInit>();

  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    for (const entry of entries) {
      const callback = this.callbacks.get(entry.target);
      if (callback) {
        callback([entry], this.observer!);
      }
    }
  }

  observe(
    element: Element,
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ): void {
    if (!this.observer) {
      this.observer = new IntersectionObserver(this.handleIntersection.bind(this));
    }
    this.callbacks.set(element, callback);
    if (options) this.options.set(element, options);
    this.observer.observe(element);
  }

  unobserve(element: Element): void {
    this.callbacks.delete(element);
    this.options.delete(element);
    this.observer?.unobserve(element);
  }

  disconnect(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.callbacks = new WeakMap();
    this.options = new WeakMap();
  }
}

export const globalIntersectionObserver = new GlobalIntersectionObserverManager();
```

### Step 4: useNetworkMonitor

```typescript
// src/react/hooks/useNetworkMonitor.ts
export function useNetworkMonitor() {
  const [state, setState] = useState({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    effectiveType: null,
    rtt: null,
  });

  useEffect(() => {
    const handleOnline = () => setState(s => ({ ...s, isOnline: true }));
    const handleOffline = () => setState(s => ({ ...s, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const connection = navigator.connection;
    if (connection) {
      const updateConnection = () => {
        setState({
          isOnline: navigator.onLine,
          effectiveType: connection.effectiveType ?? null,
          rtt: connection.rtt ?? null,
        });
      };
      connection.addEventListener('change', updateConnection);
      updateConnection();

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', updateConnection);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return state;
}
```

### Step 5: useImageCacheLoader

```typescript
// src/react/hooks/useImageCacheLoader.ts
interface Props {
  src: string;
  engine: ImageCacheEngine | null;
  noCache: boolean;
  abortSignal: AbortSignal | null;
  onCacheError?: (error: Error, context: string) => void;
}

export function useImageCacheLoader({
  src,
  engine,
  noCache,
  abortSignal,
  onCacheError,
}: Props) {
  const [state, setState] = useState({
    status: 'idle' as const,
    url: null as string | null,
    error: null as Error | null,
    isFromCache: false,
  });

  // ... full implementation with cache lookup, blob fetch, error handling

  return state;
}
```

### Step 6: CloudImage Refactor

The refactored CloudImage becomes a simple presenter:

```typescript
// src/react/image.tsx (simplified)
export function CloudImage(props: CloudImageProps) {
  const networkState = useNetworkMonitor();
  const imageState = useImageCacheLoader({
    src: props.src,
    engine: props.engine,
    noCache: props.noCache,
    abortSignal: /* derived from useEffect */,
    onCacheError: props.onCacheError,
  });
  const crossfade = useCrossfadeAnimation({
    enabled: props.crossfade ?? false,
    duration: props.crossfadeDuration ?? 300,
  });

  // Pure rendering logic - no business logic
  if (imageState.status === 'error') {
    return props.fallback ?? <DefaultError />;
  }

  if (imageState.status === 'loading') {
    return props.loadingComponent ?? <DefaultSpinner />;
  }

  return (
    <img
      src={imageState.url}
      alt={props.alt}
      style={{ opacity: crossfade.opacity }}
      onLoad={props.onLoad}
      onError={props.onError}
    />
  );
}
```

---

## Testing Checklist

### Memory Leak Fix
- [ ] Heap snapshot shows zero blob: URLs after 100 navigations
- [ ] No URL.revokeObjectURL errors in console

### Hook Decomposition
- [ ] Each hook has unit tests
- [ ] CloudImage useEffect < 30 lines
- [ ] Rapid src changes don't cause race conditions

### Observer Singleton
- [ ] Only 1 IntersectionObserver in performance profile
- [ ] 60fps maintained with 50+ images in gallery

### Error Handling
- [ ] QuotaExceededError triggers onCacheError callback
- [ ] AbortError silently suppressed
- [ ] Full stack traces in dev mode console

---

## Build and Test

```bash
cd packages/cloud

# Build
npm run build

# Type check
npm run typecheck

# Run tests
npm run test

# Measure bundle size
ls -la dist/*.js | grep -E '\.(js|gz)$'
```