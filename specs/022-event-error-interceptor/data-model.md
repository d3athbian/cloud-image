# Data Model: Event Bus Interceptor

## Entities

### EventInterceptor

Main class that wraps event listener registration with universal error handling.

**Properties:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| moduleName | string | Yes | Module registering the listener (e.g., "NetworkMonitor") |
| logger | LoggerInterface | Yes | Logger instance for error logging |

**Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| on | target: EventTarget, eventType: string, listenerId: string, handler: Function, options?: AddEventListenerOptions | void | Register listener with error interception |
| off | target: EventTarget, eventType: string, handler: Function | void | Remove listener |
| destroy | - | void | Cleanup all listeners for this interceptor |

---

### ErrorContext

Structured error data captured when a listener throws.

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| module | string | Module name where listener is registered |
| listenerId | string | Identifier provided at registration |
| eventType | string | Native event type (e.g., "online", "resize") |
| timestamp | number | Unix timestamp when error occurred |
| stack | string | Full stack trace from error |
| error | Error | The original Error object |

---

### ListenerRegistration

Internal record tracking registered listeners.

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| target | EventTarget | DOM EventTarget |
| eventType | string | Event type string |
| listenerId | string | User-provided identifier |
| handler | Function | Wrapped handler with try/catch |
| originalHandler | Function | Original handler function |
| options | boolean \| AddEventListenerOptions | Original options |

---

## State Transitions

### Registration Flow

```
ListenerRegistration: {
  target: EventTarget,
  eventType: string,
  handler: Function,
  wrapped: boolean
}

States:
- idle → registering → registered → listening → cleanup
```

---

## Validation Rules

1. **moduleName**: Required, non-empty string
2. **listenerId**: Required, non-empty string (must be unique per module)
3. **handler**: Must be a function
4. **Error context**: Always includes stack trace (even in production if available)