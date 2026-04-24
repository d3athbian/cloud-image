import { memo, useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import { cacheAtom, networkAtom, memoryAtom, setCacheAtom, setNetworkAtom, setMemoryAtom } from "@cloudimage/cloud";

export const StateSyncDemo = memo(function StateSyncDemo() {
  const [cache] = useAtom(cacheAtom);
  const [network] = useAtom(networkAtom);
  const [memory] = useAtom(memoryAtom);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const setCache = useSetAtom(setCacheAtom);
  const setNetwork = useSetAtom(setNetworkAtom);
  const setMemory = useSetAtom(setMemoryAtom);

  const handleUpdateCache = () => {
    const newCache = {
      totalItems: cache.totalItems + 1,
      hitCount: cache.hitCount + Math.floor(Math.random() * 5),
      missCount: cache.missCount + Math.floor(Math.random() * 3),
      lastAccessTime: Date.now(),
    };
    setCache(newCache);
    setLastSync(new Date().toISOString());
    console.log("[StateSyncDemo] Cache updated:", newCache);
  };

  const handleUpdateNetwork = () => {
    const statuses = ["ONLINE", "OFFLINE", "LOW_BANDWIDTH"] as const;
    const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
    setNetwork({ status: newStatus, rtt: Math.floor(Math.random() * 200), lastChecked: Date.now() });
    setLastSync(new Date().toISOString());
    console.log("[StateSyncDemo] Network updated:", newStatus);
  };

  const handleClearCache = () => {
    setCache({ totalItems: 0, hitCount: 0, missCount: 0, lastAccessTime: Date.now() });
    setLastSync(new Date().toISOString());
    console.log("[StateSyncDemo] Cache cleared");
  };

  return (
    <div className="state-sync-demo p-4 border-2 border-blue-500 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Global State Sync Demo</h2>

      <div className="mb-4 p-2 bg-gray-100 rounded">
        <p className="text-sm">
          <strong>Last Sync:</strong> {lastSync ?? "Not synced yet"}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Check DevTools Console for [StateSync] logs
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="p-2 border rounded">
          <h3 className="font-bold text-sm">Cache State</h3>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(cache, null, 2)}
          </pre>
        </div>

        <div className="p-2 border rounded">
          <h3 className="font-bold text-sm">Network State</h3>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(network, null, 2)}
          </pre>
        </div>

        <div className="p-2 border rounded">
          <h3 className="font-bold text-sm">Memory State</h3>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(memory, null, 2)}
          </pre>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleUpdateCache}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Update Cache
        </button>
        <button
          onClick={handleUpdateNetwork}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Update Network
        </button>
        <button
          onClick={handleClearCache}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear Cache
        </button>
      </div>

      <div className="mt-4 p-2 bg-yellow-100 rounded text-xs">
        <p><strong>Instructions:</strong></p>
        <ol className="list-decimal list-inside">
          <li>Click buttons to update state</li>
          <li>Open DevTools → Application → IndexedDB → cloud-state</li>
          <li>Refresh page - state should restore</li>
          <li>Check Console for [StateSync] logs</li>
        </ol>
      </div>
    </div>
  );
});