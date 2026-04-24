# Quickstart: DebuggerTool

## Installation

```bash
npm install @cloudimage/cloud
```

## Basic Usage

```tsx
import { DebuggerTool } from '@cloudimage/cloud/debugger';
import { CloudProvider } from '@cloudimage/cloud/react';

function App() {
  return (
    <CloudProvider>
      <YourApp />
      <DebuggerTool initialIsOpen={false} />
    </CloudProvider>
  );
}
```

## Floating Mode

```tsx
<DebuggerTool 
  initialIsOpen={false}
  position="bottom-left"
/>
```

- `initialIsOpen`: Show panel open on mount (default: false)
- `position`: Corner position (default: "bottom-left")

## Embedded Mode

```tsx
import { DebuggerToolPanel } from '@cloudimage/cloud/debugger';

function DebugPanel() {
  return <DebuggerToolPanel />;
}
```

Render the panel inline without the floating toggle.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| initialIsOpen | boolean | false | Start with panel open |
| position | 'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right' | 'bottom-left' | Corner position |
| className | string | - | Additional CSS class |

## Programmatic Control

Control visibility via state:

```tsx
const [debugOpen, setDebugOpen] = useState(false);

<DebuggerTool 
  initialIsOpen={debugOpen}
  onToggle={setDebugOpen}
/>
```

---

## CSS Variables (Customize Theme)

```css
:root {
  --debugger-bg: #0f0f0f;
  --debugger-text: #ededed;
  --debugger-border: #333;
  --debugger-accent: #3b82f6;
}
```

## Tree-Shaking

Import from subpath to avoid including DebuggerTool in bundle when unused:

```tsx
// ✅ Tree-shakeable
import { DebuggerTool } from '@cloudimage/cloud/debugger';

// ❌ Includes all exports
import { DebuggerTool } from '@cloudimage/cloud';
```

When imported from `./debugger`, only DebuggerTool code is bundled. Other exports are excluded.