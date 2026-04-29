import { useSetAtom } from "jotai";
import { useCallback } from "react";
import { logsAtom } from "../store/logger-atoms";
import type { LogEntry, LogLevel } from "../types/devtools.types";

const MAX_LOGS = 500;

export function useLogger() {
  const setLogs = useSetAtom(logsAtom);

  const addLog = useCallback(
    (level: LogLevel, message: string, context?: string) => {
      const newLog: LogEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        level,
        message,
        context,
      };

      setLogs((prev) => {
        const updated = [...prev, newLog];
        if (updated.length > MAX_LOGS) {
          return updated.slice(-MAX_LOGS);
        }
        return updated;
      });
    },
    [setLogs],
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, [setLogs]);

  return { addLog, clearLogs };
}
