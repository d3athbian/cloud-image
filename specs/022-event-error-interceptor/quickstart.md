# QuickStart: Event Bus Interceptor

## Installation

The EventInterceptor is included in `@cloudimage/cloud` package. No additional installation required.

```typescript
import { EventInterceptor } from "@cloudimage/cloud";
```

## Basic Usage

### Creating an Interceptor

```typescript
import { logger } from "@cloudimage/cloud";

const networkInterceptor = new EventInterceptor({
  moduleName: "NetworkMonitor",
  logger: logger.NetworkMonitor,
});
```

### Registering Event Listeners

```typescript
// Register with automatic error handling
networkInterceptor.on(window, "online", "handleOnline", () => {
  console.log("Network is online!");
  // No try/catch needed - errors caught automatically
});
```

### Removing Listeners

```typescript
function handleOffline() {
  console.log("Network is offline!");
}

networkInterceptor.on(window, "offline", "handleOffline", handleOffline);

// Later, remove it:
networkInterceptor.off(window, "offline", handleOffline);
```

### Cleanup

When done (e.g., component unmount), cleanup all listeners:

```typescript
networkInterceptor.destroy();
```

## Error Logging

When a listener throws an error, it is automatically logged with full context:

```typescript
networkInterceptor.on(window, "online", "handleOnline", () => {
  throw new Error("Connection failed!");
});

// Output in console:
// [NetworkMonitor] Error in listener "handleOnline" for event "online": Connection failed!
// Stack: Error: Connection failed!
//     at handleOnline (network.ts:123:45)
//     ...
```

## Best Practices

1. **Use descriptive listener IDs**: "handleOnline" instead of "cb1"
2. **One interceptor per module**: Create one interceptor per module for clear ownership
3. **Always call destroy()**: On cleanup to prevent memory leaks
4. **Keep handlers simple**: Move complex logic to separate functions

## Migration from Manual try/catch

Before (manual error handling):

```typescript
window.addEventListener("online", () => {
  try {
    doSomething();
  } catch (e) {
    logger.error("handleOnline failed", e);
  }
});
```

After (with interceptor):

```typescript
interceptor.on(window, "online", "handleOnline", () => {
  doSomething();
});
```

The error handling is now automatic and consistent across all listeners.