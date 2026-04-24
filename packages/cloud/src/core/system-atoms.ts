import { atom } from "jotai";
import { StateSync } from "./state-sync";

export type NetworkStatus = "ONLINE" | "OFFLINE" | "LOW_BANDWIDTH";
export type PressureLevel = "low" | "medium" | "high";

let stateSyncInstance: StateSync | null = null;

export function getStateSync(): StateSync {
  if (!stateSyncInstance) {
    stateSyncInstance = new StateSync();
    stateSyncInstance.init().catch(() => {});
  }
  return stateSyncInstance;
}

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
    const newState = { ...current, ...update };
    set(cacheAtom, newState);
    getStateSync().syncState("cache", newState);
  },
);

export const setNetworkAtom = atom(
  (get) => get(networkAtom),
  (_get, set, update: Partial<NetworkState>) => {
    const current = _get(networkAtom);
    const newState = { ...current, ...update };
    set(networkAtom, newState);
    getStateSync().syncState("network", newState);
  },
);

export const setMemoryAtom = atom(
  (get) => get(memoryAtom),
  (_get, set, update: Partial<MemoryState>) => {
    const current = _get(memoryAtom);
    const newState = { ...current, ...update };
    set(memoryAtom, newState);
    getStateSync().syncState("memory", newState);
  },
);

export async function hydrateState(
  setCache: (value: CacheState) => void,
  setNetwork: (value: NetworkState) => void,
  setMemory: (value: MemoryState) => void,
): Promise<void> {
  const sync = getStateSync();
  await sync.init();

  const cache = await sync.readState<CacheState>("cache");
  if (cache) setCache(cache);

  const network = await sync.readState<NetworkState>("network");
  if (network) setNetwork(network);

  const memory = await sync.readState<MemoryState>("memory");
  if (memory) setMemory(memory);
}
