import { memo } from 'react';
import type { NetworkStatus } from '@cloudimage/cloud';

interface NetworkStatusDisplayProps {
  network: NetworkStatus;
}

const BANDWIDTH_CONFIG: Record<string, { label: string; className: string }> = {
  low: { label: 'Low', className: 'text-red-500' },
  medium: { label: 'Medium', className: 'text-yellow-500' },
  high: { label: 'High', className: 'text-green-500' },
  unknown: { label: 'Unknown', className: '' },
};

export const NetworkStatusDisplay = memo(function NetworkStatusDisplay({ network }: NetworkStatusDisplayProps) {
  const bandwidth = BANDWIDTH_CONFIG[network.bandwidth] ?? BANDWIDTH_CONFIG.unknown;
  
  const getBandwidthDisplay = () => {
    if (network.bandwidthTested && network.mbps !== undefined) {
      return `${network.mbps} Mbps`;
    }
    if (network.bandwidthTested) {
      return 'Testing...';
    }
    return 'Not tested';
  };

  return (
    <div className="stats" role="region" aria-label="Network status">
      <h2>Network</h2>
      <p>
        Status 
        <span className={`statsValue ${network.online ? 'text-green-500' : 'text-red-500'}`}>
          {network.online ? 'Online' : 'Offline'}
        </span>
      </p>
      <p>
        Bandwidth 
        <span className={`statsValue ${bandwidth.className}`}>
          {bandwidth.label} · {getBandwidthDisplay()}
        </span>
      </p>
    </div>
  );
});