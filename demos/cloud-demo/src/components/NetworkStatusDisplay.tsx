import { memo } from 'react';
import type { NetworkStatus } from '@cloudimage/cloud';
import styles from '../styles/app.module.css';

interface NetworkStatusDisplayProps {
  network: NetworkStatus;
}

const BANDWIDTH_CONFIG: Record<string, { label: string; className: string }> = {
  low: { label: 'Low', className: styles.error },
  medium: { label: 'Medium', className: styles.warning },
  high: { label: 'High', className: styles.success },
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
    <div className={styles.stats} role="region" aria-label="Network status">
      <h2>Network</h2>
      <p>
        Status 
        <span className={`${styles.statsValue} ${network.online ? styles.success : styles.error}`}>
          {network.online ? 'Online' : 'Offline'}
        </span>
      </p>
      <p>
        Bandwidth 
        <span className={`${styles.statsValue} ${bandwidth.className}`}>
          {bandwidth.label} · {getBandwidthDisplay()}
        </span>
      </p>
    </div>
  );
});