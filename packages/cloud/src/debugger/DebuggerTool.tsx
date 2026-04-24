import { memo, type CSSProperties, useEffect, useCallback } from "react";
import { DebuggerPanel } from "./DebuggerPanel";
import { useDebuggerState } from "./hooks/useDebuggerState";
import type { Position, Tab, DebuggerState } from "./types";
import "./DebuggerPanel.css";

const CSS_VARIABLES_STYLE = `
:root {
  --debugger-bg: #0f0f0f;
  --debugger-text: #ededed;
  --debugger-border: #333;
  --debugger-accent: #3b82f6;
}
`;

interface DebuggerToolProps {
  initialIsOpen?: boolean;
  position?: Position;
  panelMode?: "floating" | "fullwidth";
  className?: string;
  onToggle?: (isOpen: boolean) => void;
  cacheStats?: {
    itemCount: number;
    totalSize: number;
    hitRate: number;
    missRate: number;
    evictionCount: number;
  } | null;
  networkStatus?: "online" | "offline" | "slow";
  networkDetails?: {
    bandwidth: string;
    bandwidthTested: boolean;
    mbps?: number;
    online: boolean;
  };
  performanceMetrics?: {
    avgResponseTime: number;
    totalRequests: number;
  };
  jotaiState?: {
    cache: {
      totalItems: number;
      hitCount: number;
      missCount: number;
      lastAccessTime: number;
    };
    network: {
      status: string;
      rtt: number;
      lastChecked: number;
    };
    memory: {
      isUnderPressure: boolean;
      pressureLevel: string;
    };
  };
  onUpdateCache?: () => void;
  onUpdateNetwork?: () => void;
  onClearCache?: () => void;
}

const POSITION_STYLES: Record<Position, CSSProperties> = {
  "top-left": { top: 16, left: 16 },
  "top-right": { top: 16, right: 16 },
  "bottom-left": { bottom: 16, left: 16 },
  "bottom-right": { bottom: 16, right: 16 },
};

export const DebuggerTool = memo(function DebuggerTool({
  initialIsOpen = false,
  position = "bottom-left",
  panelMode = "fullwidth",
  className,
  onToggle,
  cacheStats = null,
  networkStatus = "online",
  networkDetails,
  performanceMetrics = { avgResponseTime: 0, totalRequests: 0 },
  jotaiState,
  onUpdateCache,
  onUpdateNetwork,
  onClearCache,
}: DebuggerToolProps) {
  const { state, toggle, setTab } = useDebuggerState({
    isOpen: initialIsOpen,
    position,
    panelMode,
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    const style = document.createElement("style");
    style.textContent = CSS_VARIABLES_STYLE;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleToggle = () => {
    toggle();
    onToggle?.(!state.isOpen);
  };

  const getTogglePosition = (): CSSProperties => {
    const pos = POSITION_STYLES[state.position];
    return { ...pos };
  };

  return (
    <>
      <button
        type="button"
        className={`debugger-toggle ${className ?? ""}`}
        style={getTogglePosition()}
        onClick={handleToggle}
        aria-label={state.isOpen ? "Close Debugger" : "Open Debugger"}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
          role="img"
          aria-hidden="true"
        >
          <title>Debugger</title>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      </button>
      {state.isOpen && (
        <DebuggerPanel
          state={state}
          onTabChange={setTab}
          onClose={toggle}
          onUpdateCache={onUpdateCache}
          onUpdateNetwork={onUpdateNetwork}
          onClearCache={onClearCache}
          cacheStats={cacheStats}
          networkStatus={networkStatus}
          networkDetails={networkDetails}
          performanceMetrics={performanceMetrics}
          jotaiState={jotaiState}
        />
      )}
    </>
  );
});

export const DebuggerToolPanel = memo(function DebuggerToolPanel({
  className,
}: {
  className?: string;
}) {
  return (
    <DebuggerTool
      initialIsOpen={true}
      position="top-left"
      panelMode="fullwidth"
      className={className}
    />
  );
});