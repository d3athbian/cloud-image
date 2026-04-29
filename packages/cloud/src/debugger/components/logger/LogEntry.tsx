import { memo } from "react";
import type { LogEntry as LogEntryType } from "../../types/devtools.types";

interface LogEntryProps {
  entry: LogEntryType;
}

const LEVEL_STYLES: Record<string, string> = {
  INFO: "text-dt-info bg-dt-info/10",
  WARN: "text-dt-warning bg-dt-warning/10",
  ERROR: "text-dt-error bg-dt-error/10",
};

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return (
    date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }) +
    "." +
    String(date.getMilliseconds()).padStart(3, "0")
  );
}

export const LogEntry = memo(function LogEntry({ entry }: LogEntryProps) {
  return (
    <div className="flex items-start gap-3 px-3 py-1.5 hover:bg-dt-bg-card/50 text-xs font-dt-mono">
      <span className="text-dt-text-secondary shrink-0">{formatTime(entry.timestamp)}</span>
      <span
        className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${LEVEL_STYLES[entry.level]}`}
      >
        {entry.level}
      </span>
      <span className="text-dt-text-primary flex-1 truncate">{entry.message}</span>
      {entry.context && (
        <span className="text-dt-text-secondary shrink-0 truncate">{entry.context}</span>
      )}
    </div>
  );
});
