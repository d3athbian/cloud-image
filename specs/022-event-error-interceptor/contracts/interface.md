# Contracts: Event Bus Interceptor

## External Interfaces

This feature provides an internal wrapper around existing event registration patterns. No public API changes.

### Internal Interface: EventInterceptor

```typescript
interface EventInterceptorConfig {
  moduleName: string;
  logger: LoggerInterface;
}

class EventInterceptor {
  constructor(config: EventInterceptorConfig);

  on(
    target: EventTarget,
    eventType: string,
    listenerId: string,
    handler: () => void,
    options?: AddEventListenerOptions
  ): void;

  off(
    target: EventTarget,
    eventType: string,
    handler: () => void
  ): void;

  destroy(): void;
}
```

### Usage Contracts

**Register listener with error interception:**

```typescript
const interceptor = new EventInterceptor({
  moduleName: "NetworkMonitor",
  logger: logger.NetworkMonitor
});

interceptor.on(window, "online", "handleOnline", () => {
  // No try/catch needed - errors caught automatically
  console.log("Online!");
});
```

**Remove listener:**

```typescript
function handleOffline() {
  console.log("Offline!");
}

interceptor.on(window, "offline", "handleOffline", handleOffline);
// Later:
interceptor.off(window, "offline", handleOffline);
```

### Error Logging Contract

When error occurs, logged data structure:

```typescript
{
  level: "error",
  module: string,        // e.g., "NetworkMonitor"
  listenerId: string,    // e.g., "handleOnline"
  eventType: string,    // e.g., "online"
  timestamp: number,    // Unix timestamp
  stack: string,        // Error stack trace
  message: string       // Error message
}
```

## Wrapped Targets

| Target | Events | Usage |
|--------|--------|-------|
| window | online, offline | Network state |
| navigator.connection | change | Connection API |
| ResizeObserver | resize | Resize handling |
| ServiceWorker | message, fetch | SW events |