import { atom } from "jotai";
import type { LogLevel, Tab } from "../types/devtools.types";

export const devToolsOpenAtom = atom<boolean>(false);

export const activeTabAtom = atom<Tab>("cache");

export const selectedItemUrlAtom = atom<string | null>(null);

export const logsFilterAtom = atom<LogLevel | "ALL">("ALL");
