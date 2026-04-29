import { atom } from "jotai";
import type { LogEntry } from "../types/devtools.types";
import { logsFilterAtom } from "./devtools-atoms";

export const logsAtom = atom<LogEntry[]>([]);

export const filteredLogsAtom = atom((get) => {
  const filter = get(logsFilterAtom);
  const logs = get(logsAtom);
  if (filter === "ALL") return logs;
  return logs.filter((l) => l.level === filter);
});
