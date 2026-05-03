import { useAtomValue, useSetAtom } from 'jotai';
import { cacheAtom, networkAtom, setCacheAtom, setNetworkAtom } from '../../core/system-atoms';

export function SelectiveRenderDemo() {
  const cache = useAtomValue(cacheAtom);
  const network = useAtomValue(networkAtom);
  const updateCache = useSetAtom(setCacheAtom);
  const updateNetwork = useSetAtom(setNetworkAtom);

  return (
    <div>
      <h3>Selective Re-render Demo</h3>
      <div>
        <p>Cache State:</p>
        <p>
          Hits: {cache.hitCount}, Misses: {cache.missCount}
        </p>
      </div>
      <div>
        <p>Network State:</p>
        <p>
          Status: {network.status}, RTT: {network.rtt}ms
        </p>
      </div>
      <div>
        <button type="button" onClick={() => updateCache({ hitCount: cache.hitCount + 1 })}>
          Update Cache
        </button>
        <button
          type="button"
          onClick={() =>
            updateNetwork({ status: network.status === 'ONLINE' ? 'OFFLINE' : 'ONLINE' })
          }
        >
          Toggle Network
        </button>
      </div>
      <p>Note: Clicking "Update Cache" will NOT re-render the Network State section.</p>
      <p>Note: Clicking "Toggle Network" will NOT re-render the Cache State section.</p>
    </div>
  );
}
