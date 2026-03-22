# Contract: VynxImage Component

**Contract ID**: vynx-image-contract  
**Version**: 1.0.0  
**Feature**: 002-vynx-image-cache-engine

---

## Overview

`VynxImage` is a React component that replaces the standard `<img>` element with automatic caching, state management, and CLS prevention.

---

## Props API

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `src` | `string` | Image source URL (required) |

### Optional Props (Native img Attributes)

| Prop | Type | Description |
|------|------|-------------|
| `alt` | `string` | Alternative text for accessibility |
| `width` | `number \| string` | Image width |
| `height` | `number \| string` | Image height |
| `className` | `string` | CSS class name |
| `style` | `React.CSSProperties` | Inline styles |

### Extended Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `placeholder` | `string` | `undefined` | Low-res or blur placeholder URL |
| `showLoading` | `boolean` | `true` | Show loading indicator |
| `fallback` | `ReactNode` | `undefined` | Custom fallback on error |
| `noCache` | `boolean` | `false` | Bypass cache for this image |
| `preload` | `boolean` | `false` | Start loading on mount |
| `cacheKey` | `string` | `src` | Custom cache key |
| `onLoad` | `() => void` | `undefined` | Native img onLoad |
| `onError` | `(e: Error) => void` | `undefined` | Error handler |
| `onCacheHit` | `() => void` | `undefined` | Called when served from cache |
| `onCacheMiss` | `() => void` | `undefined` | Called when fetched from network |

---

## Component States

### State Diagram

```
pending → loading → loaded
              ↓
           error
```

### State Definitions

| State | Trigger | Visual |
|-------|---------|--------|
| `pending` | Initial, before mount | Hidden or placeholder |
| `loading` | src set, not in cache | Loading indicator (if showLoading) |
| `loaded` | Image displayed | Full image |
| `error` | Network/storage failure | Error component or native error |

---

## Behavior Contracts

### 1. Cache Retrieval (<50ms)

**Given**: Image URL is in cache with valid entry  
**When**: VynxImage renders with that src  
**Then**: Image displays within 50ms with no loading indicator

**Test**:
```typescript
// First load caches
render(<VynxImage src="https://example.com/img.jpg" />);
await waitForImageLoad();

// Second load from cache
const start = performance.now();
render(<VynxImage src="https://example.com/img.jpg" />);
const duration = performance.now() - start;

expect(duration).toBeLessThan(50);
expect(screen.queryByRole('progressbar')).toBeNull();
```

### 2. CLS Prevention

**Given**: VynxImage with width/height or aspect ratio  
**When**: Image loads  
**Then**: No layout shift occurs (Cumulative Layout Shift = 0)

**Test**:
```typescript
render(<VynxImage src="..." width={800} height={600} />);

const container = screen.getByTestId('vynx-container');
const initialHeight = container.offsetHeight;

// Wait for image load
await waitForImageLoad();

expect(container.offsetHeight).toBe(initialHeight);
```

### 3. Error Handling

**Given**: Network failure or invalid URL  
**When**: Image load fails  
**Then**: Error state displays, no crash, onError callback fires

**Test**:
```typescript
const onError = jest.fn();
render(<VynxImage src="invalid://url" onError={onError} />);

await waitForTimeout(5000);
expect(screen.getByText(/error/i)).toBeInTheDocument();
expect(onError).toHaveBeenCalledWith(expect.any(Error));
```

---

## Event Contract

### Event Order

1. `onCacheHit` or `onCacheMiss` fires once
2. If cache miss: Loading state shown
3. Image loads
4. Native `onLoad` fires
5. Loading state hidden

---

## Accessibility

1. `alt` prop maps to native img alt attribute
2. Without alt, component adds `role="img"` with aria-label
3. Loading state has `aria-busy="true"`
4. Error state has `aria-live="polite"`

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Same src renders twice | Shares cache entry, single fetch |
| src changes while loading | Cancels previous, starts new |
| No VynxProvider ancestor | Creates isolated cache context |
| Worker unavailable | Falls back to no-cache mode |
