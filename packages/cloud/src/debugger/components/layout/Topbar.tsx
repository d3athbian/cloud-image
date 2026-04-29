import { memo } from "react";

interface TopbarProps {
  version?: string;
  onlineStatus?: boolean;
  circuitState?: "CLOSED" | "OPEN" | "HALF_OPEN";
  swStatus?: "Active" | "Installing" | "Error";
  workerStatus?: "Idle" | "Active" | "Terminated";
}

export const Topbar = memo(function Topbar({
  version = "0.3.1",
  onlineStatus = true,
  circuitState = "CLOSED",
  swStatus = "Active",
  workerStatus = "Idle",
}: TopbarProps) {
  return (
    <header className="col-span-2 row-start-1 bg-dt-bg-panel border-b border-dt-border flex items-center justify-between px-4 h-12">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#0070F3">
            <path d="M19 18H5c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2z" />
          </svg>
          <span className="text-dt-text-primary font-dt-sans font-medium">CloudImage DevTools</span>
        </div>
        <span className="text-dt-text-secondary text-xs px-2 py-0.5 border border-dt-border rounded-full">
          v{version}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${onlineStatus ? "bg-dt-success" : "bg-dt-error"}`}
          />
          <span className="text-dt-text-primary">Online</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={
              circuitState === "CLOSED"
                ? "text-dt-success"
                : circuitState === "OPEN"
                  ? "text-dt-error"
                  : "text-dt-warning"
            }
          >
            Circuit: {circuitState}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={
              swStatus === "Active"
                ? "text-dt-success"
                : swStatus === "Installing"
                  ? "text-dt-warning"
                  : "text-dt-error"
            }
          >
            SW: {swStatus}
          </span>
        </div>
        <div className="flex items-center gap-2 text-dt-text-secondary">
          <span>Worker: {workerStatus}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="p-2 text-dt-text-secondary hover:text-dt-text-primary transition-colors"
          title="Settings"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94 0 .31.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
          </svg>
        </button>
        <button
          type="button"
          className="p-2 text-dt-text-secondary hover:text-dt-text-primary transition-colors"
          title="Popout"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.59 9.59-2.59-2.59L14 3z" />
          </svg>
        </button>
      </div>
    </header>
  );
});
