/**
 * useNetworkMonitor - Network state hook
 *
 * Monitors online/offline status and network conditions (effectiveType, RTT)
 * for adaptive cache behavior based on network quality.
 */

import { useEffect, useState } from 'react';
import { getNetworkMonitor } from '../../../core/network';
import type { NetworkMonitorResult } from './useNetworkMonitor.type';

export type { NetworkMonitorResult } from './useNetworkMonitor.type';

// Type for Network Information API
interface NetworkInformation {
  effectiveType?: string;
  rtt?: number;
  downlink?: number;
  addEventListener: (event: string, listener: () => void) => void;
  removeEventListener: (event: string, listener: () => void) => void;
}

/**
 * Hook for monitoring network state and conditions
 *
 * @returns Network state including online status, effective type, and RTT
 */
export function useNetworkMonitor(): NetworkMonitorResult {
  const [state, setState] = useState<NetworkMonitorResult>(() => {
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    return {
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      effectiveType: connection?.effectiveType ?? null,
      rtt: connection?.rtt ?? null,
      downlink: connection?.downlink ?? null,
    };
  });

  useEffect(() => {
    const networkMonitor = getNetworkMonitor();

    const handleOnline = () => {
      setState((s: NetworkMonitorResult) => ({ ...s, isOnline: true }));
    };

    const handleOffline = () => {
      setState((s: NetworkMonitorResult) => ({ ...s, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Subscribe to network monitor changes
    const unsubscribe = networkMonitor.subscribe((newStatus) => {
      setState((prev: NetworkMonitorResult) => ({
        isOnline: newStatus.online,
        effectiveType: prev.effectiveType,
        rtt: newStatus.rtt ?? null,
        downlink: prev.downlink,
      }));
    });

    // Initial network info from Network Information API
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    if (connection) {
      const updateConnection = () => {
        setState((s: NetworkMonitorResult) => ({
          ...s,
          effectiveType: connection.effectiveType ?? null,
          rtt: connection.rtt ?? null,
          downlink: connection.downlink ?? null,
        }));
      };

      connection.addEventListener('change', updateConnection);
      updateConnection();

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', updateConnection);
        unsubscribe();
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  return state;
}
