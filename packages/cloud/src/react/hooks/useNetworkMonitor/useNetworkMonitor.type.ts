export type NetworkMonitorResult = {
  isOnline: boolean;
  effectiveType: string | null;
  rtt: number | null;
  downlink: number | null;
};
