# Feature Specification: Worker-Main Thread Communication Optimization

**Feature Branch**: `026-worker-comms-optimize`  
**Created**: 2026-04-24  
**Status**: Draft  
**Input**: User description: "optimizar la comunicacion entre el worker y el main thread en base a los bytes enviados por las imagenes"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Optimize Image Data Transfer (Priority: P1)

Application loads 20+ images from network. The system should minimize the amount of data transferred between the Web Worker and the main thread to reduce overhead and improve rendering performance.

**Why this priority**: Images are the primary data type handled by the worker. Optimizing their transfer directly impacts UI responsiveness and memory usage.

**Independent Test**: Can be tested by loading 20 images and measuring the time from worker message to image display, and observing memory usage in Chrome DevTools.

**Acceptance Scenarios**:

1. **Given** 20 images cached locally, **When** user scrolls to trigger image loading, **Then** images display within 100ms without visible lag
2. **Given** Large images (2MB+), **When** worker processes them for display, **Then** the main thread receives only essential display data (not full resolution)

---

### User Story 2 - Compress Worker-to-Main Thread Messages (Priority: P2)

The worker should compress image data before sending to main thread to minimize serialization overhead.

**Why this priority**: Transferable objects and compression reduce the serialization cost of passing ImageBitmaps between contexts.

**Independent Test**: Can be tested by comparing message sizes before and after compression using browser DevTools.

**Acceptance Scenarios**:

1. **Given** 50 images cached, **When** worker sends data to main thread, **Then** total bytes transferred is reduced by at least 60%
2. **Given** Network is slow (throttled), **When** images are prefetched, **Then** UI remains responsive with no frame drops

---

### User Story 3 - Batch Image Processing Messages (Priority: P3)

Multiple image requests should be batched to reduce message overhead between worker and main thread.

**Why this priority**: Sending individual messages for each image creates overhead. Batching reduces this.

**Independent Test**: Can be tested by measuring total message count vs image count during prefetch.

**Acceptance Scenarios**:

1. **Given** 10 images need processing, **When** worker handles them, **Then** worker sends at most 2 messages (not 10 individual messages)

---

### Edge Cases

- What happens when worker crashes or becomes unresponsive?
- How does system handle images that fail to decode in worker?
- What happens when main thread is busy (background tab)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST transfer only display-ready image data from worker to main thread (not raw buffers)
- **FR-002**: System MUST use Transferable objects for zero-copy transfers when supported
- **FR-003**: System MUST compress image metadata before worker-to-main thread transfer
- **FR-004**: System MUST batch multiple image responses into single messages when possible
- **FR-005**: System MUST maintain image quality while reducing transfer size

### Key Entities *(include if feature involves data)*

- **ImageData**: Cached image with metadata (dimensions, format, source URL)
- **WorkerMessage**: Compressed payload sent from worker to main thread
- **TransferBatch**: Group of images processed together

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Image display latency is under 100ms for cached images (measured from worker message to on-screen)
- **SC-002**: Worker-to-main thread data transfer reduced by at least 60% compared to uncompressed baseline
- **SC-003**: Memory usage stays below 200MB when displaying 50 cached images
- **SC-004**: No frame drops during image loading (60fps maintained)

---

### Assumptions

- Browser supports Transferable objects (all modern browsers)
- Worker runs in separate thread with access to ImageBitmap API
- Images are already cached in IndexedDB before worker processing