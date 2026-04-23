import { atom } from "jotai";

export type NetworkStatus = "ONLINE" | "OFFLINE" | "LOW_BANDWIDTH";
export type PressureLevel = "low" | "medium" | "high";

export interface CacheState {
  totalItems: number;
  hitCount: number;
  missCount: number;
  lastAccessTime: number;
}

export interface NetworkState {
  status: NetworkStatus;
  rtt: number;
  lastChecked: number;
}

export interface MemoryState {
  isUnderPressure: boolean;
  pressureLevel: PressureLevel;
  usedJSHeapSize?: number;
  jsHeapSizeLimit?: number;
}

const initialCacheState: CacheState = {
  totalItems: 0,
  hitCount: 0,
  missCount: 0,
  lastAccessTime: 0,
};

const initialNetworkState: NetworkState = {
  status: "ONLINE",
  rtt: 0,
  lastChecked: 0,
};

const initialMemoryState: MemoryState = {
  isUnderPressure: false,
  pressureLevel: "low",
};

export const cacheAtom = atom<CacheState>(initialCacheState);
export const networkAtom = atom<NetworkState>(initialNetworkState);
export const memoryAtom = atom<MemoryState>(initialMemoryState);

export const setCacheAtom = atom(
  (get) => get(cacheAtom),
  (_get, set, update: Partial<CacheState>) => {
    const current = _get(cacheAtom);
    set(cacheAtom, { ...current, ...update });
  },
);

export const setNetworkAtom = atom(
  (get) => get(networkAtom),
  (_get, set, update: Partial<NetworkState>) => {
    const current = _get(networkAtom);
    set(networkAtom, { ...current, ...update });
  },
);

export const setMemoryAtom = atom(
  (get) => get(memoryAtom),
  (_get, set, update: Partial<MemoryState>) => {
    const current = _get(memoryAtom);
    set(memoryAtom, { ...current, ...update });
  },
);
