# DebuggerTool Component Contracts

## Public API

### DebuggerTool

```typescript
import { DebuggerTool } from '@cloudimage/cloud/debugger';

<DebuggerTool 
  initialIsOpen?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
  onToggle?: (isOpen: boolean) => void;
}
```

### DebuggerToolPanel

```typescript
import { DebuggerToolPanel } from '@cloudimage/cloud/debugger';

<DebuggerToolPanel 
  className?: string;
  style?: React.CSSProperties;
}
```

---

## Subpath Exports

| Export Path | Contents |
|------------|----------|
| `@cloudimage/cloud/debugger` | DebuggerTool, DebuggerToolPanel |
| `@cloudimage/cloud` | All exports (includes debugger) |

---

## SSR Compatibility

All components must check for `typeof document !== 'undefined'` before rendering DOM-dependent code.

---

## Bundle Impact

When imported via `./debugger` subpath:
- Only DebuggerTool code included
- Main bundle unchanged

When imported via main export:
- All exports included