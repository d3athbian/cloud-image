---

description: "Task list for LCP Performance Optimization"
---

# Tasks: LCP Performance Optimization

**Input**: spec.md, plan.md from `/specs/007-lcp-optimization/`
**Goal**: Reduce LCP from 882ms to <400ms

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Library Updates (CloudImage Component)

**Purpose**: Add priority support to CloudImage component

- [X] T001 [P] Add `priority` prop to CloudImageProps in packages/cloud/src/react/image.tsx
- [X] T002 Apply `fetchpriority` attribute when priority="high" in packages/cloud/src/react/image.tsx
- [X] T003 Handle `loading` prop to be "eager" when priority="high" in packages/cloud/src/react/image.tsx

---

## Phase 2: Demo Updates

**Purpose**: Update demo to use priority features

- [X] T004 Add preload link for first image in demos/cloud-demo/index.html
- [X] T005 Add priority="high" to first CloudImage in demos/cloud-demo/src/App.tsx
- [X] T006 Add loading="eager" to first 6 images (above fold) in demos/cloud-demo/src/App.tsx

---

## Phase 3: Build and Test

**Purpose**: Rebuild and verify improvements

- [X] T007 Rebuild library: `cd packages/cloud && npm run build`
- [X] T008 Copy updated files to demo: `cp packages/cloud/dist/* demos/cloud-demo/public/`
- [X] T009 Rebuild demo: `cd demos/cloud-demo && npm run build`
- [ ] T010 Run Chrome DevTools Performance Trace to measure LCP
- [ ] T011 Run Lighthouse audit to verify LCP < 400ms

---

## Phase 4: Verification (USER ACTION REQUIRED)

**Purpose**: Manual verification of improvements

- [ ] T012 Verify LCP improved: < 400ms (USER TEST)
- [ ] T013 Verify load delay: < 100ms (USER TEST)
- [ ] T014 Verify render delay: < 150ms (USER TEST)
- [ ] T015 Verify no console errors (USER TEST)

---

## Implementation Details

### T001-T003: CloudImage Priority Support

File: `packages/cloud/src/react/image.tsx`

Changes needed:
```typescript
// Add to CloudImageProps
priority?: 'high' | 'low' | 'auto';

// In component destructuring
priority,

// In img element, conditionally add:
fetchPriority={priority === 'high' ? 'high' : 'auto'}
loading={priority === 'high' ? 'eager' : loading || 'lazy'}
```

### T004: Preload First Image

File: `demos/cloud-demo/index.html`

Add in `<head>`:
```html
<link rel="preload" as="image" href="https://picsum.photos/id/0/400/300">
```

### T005-T006: Priority in App.tsx

File: `demos/cloud-demo/src/App.tsx`

First image:
```tsx
<CloudImage
  src={images[0].download_url}
  width={400}
  height={300}
  priority="high"  // NEW PROP
  alt={...}
/>
```

First 6 images: `loading="eager"` (since they're above fold)

---

## Performance Targets

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| LCP | 882ms | <400ms | >50% |
| Load delay | 367ms | <100ms | >70% |
| Render delay | 509ms | <150ms | >70% |
| CLS | 0.000 | 0.000 | - |

---

## Notes

- T001-T003 are library changes that benefit all users of @cloudimage/cloud
- T004-T006 are demo-specific optimizations
- Performance will be measured using Chrome DevTools Performance Trace and Lighthouse