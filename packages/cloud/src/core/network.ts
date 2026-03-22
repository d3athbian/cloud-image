import type { BandwidthClassification, NetworkStatus } from './types';

export interface NetworkMonitorConfig {
  sampleInterval?: number;
  bandwidthThreshold?: {
    low: number;
    medium: number;
  };
  onStatusChange?: (status: NetworkStatus) => void;
  onBandwidthChange?: (classification: BandwidthClassification) => void;
}

interface BandwidthSample {
  timestamp: number;
  mbps: number;
  bytesPerSecond: number;
  isConnectionApi: boolean;
}

export class NetworkMonitor {
  private status: NetworkStatus = {
    online: true,
    bandwidth: 'unknown',
  };
  private samples: BandwidthSample[] = [];
  private config: Required<NetworkMonitorConfig>;
  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private retryQueue: Array<() => Promise<void>> = [];
  private isRetrying = false;

  constructor(config: NetworkMonitorConfig = {}) {
    this.config = {
      sampleInterval: config.sampleInterval ?? 5000,
      bandwidthThreshold: config.bandwidthThreshold ?? { low: 1.5, medium: 6 },
      onStatusChange: config.onStatusChange ?? (() => {}),
      onBandwidthChange: config.onBandwidthChange ?? (() => {}),
    };
    this.status.online = this.checkOnlineStatus();
    this.setupListeners();
  }

  private checkOnlineStatus(): boolean {
    if (typeof navigator === 'undefined') {
      return true;
    }
    return navigator.onLine;
  }

  private setupListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.handleOnline();
    });

    window.addEventListener('offline', () => {
      this.handleOffline();
    });

    this.monitorConnectionAPI();
  }

  private monitorConnectionAPI(): void {
    const connection = (navigator as Navigator & { connection?: { effectiveType?: string; downlink?: number; rtt?: number; addEventListener?: (type: string, listener: () => void) => void } }).connection;
    
    if (connection) {
      this.updateFromConnectionAPI(connection);
      
      if (connection.addEventListener) {
        connection.addEventListener('change', () => {
          this.updateFromConnectionAPI(connection);
        });
      }
    }
  }

  private updateFromConnectionAPI(connection: { effectiveType?: string; downlink?: number; rtt?: number }): void {
    const previousBandwidth = this.status.bandwidth;

    if (connection.effectiveType) {
      this.status.bandwidth = this.classifyFromEffectiveType(connection.effectiveType);
    }

    if (connection.downlink) {
      this.status.mbps = connection.downlink;
    }

    if (connection.rtt) {
      this.status.rtt = connection.rtt;
    }

    this.addSample({
      timestamp: Date.now(),
      mbps: connection.downlink ?? 0,
      bytesPerSecond: (connection.downlink ?? 0) * 125000,
      isConnectionApi: true,
    });

    if (previousBandwidth !== this.status.bandwidth) {
      this.config.onBandwidthChange(this.status.bandwidth);
    }
  }

  private classifyFromEffectiveType(type: string): BandwidthClassification {
    switch (type) {
      case 'slow-2g':
      case '2g':
        return 'low';
      case '3g':
        return 'medium';
      case '4g':
        return 'high';
      default:
        return 'unknown';
    }
  }

  private handleOnline(): void {
    this.status.online = true;
    this.notifyListeners();
    this.config.onStatusChange(this.status);
    this.processRetryQueue();
  }

  private handleOffline(): void {
    this.status.online = false;
    this.status.bandwidth = 'unknown';
    this.notifyListeners();
    this.config.onStatusChange(this.status);
  }

  private addSample(sample: BandwidthSample): void {
    this.samples.push(sample);
    if (this.samples.length > 20) {
      this.samples.shift();
    }
    this.updateClassification();
  }

  private updateClassification(): void {
    if (this.samples.length < 3) return;

    const recentSamples = this.samples.slice(-10);
    const medianMbps = this.calculateMedian(recentSamples.map(s => s.mbps));

    if (medianMbps === 0) {
      this.status.bandwidth = 'unknown';
    } else if (medianMbps < this.config.bandwidthThreshold.low) {
      this.status.bandwidth = 'low';
    } else if (medianMbps < this.config.bandwidthThreshold.medium) {
      this.status.bandwidth = 'medium';
    } else {
      this.status.bandwidth = 'high';
    }
  }

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  getStatus(): NetworkStatus {
    return { ...this.status };
  }

  isOnline(): boolean {
    return this.status.online;
  }

  getBandwidth(): BandwidthClassification {
    return this.status.bandwidth;
  }

  subscribe(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.getStatus());
    }
  }

  queueForRetry(operation: () => Promise<void>): void {
    this.retryQueue.push(operation);
    if (this.status.online && !this.isRetrying) {
      this.processRetryQueue();
    }
  }

  private async processRetryQueue(): Promise<void> {
    if (this.isRetrying || !this.status.online) return;

    this.isRetrying = true;

    while (this.retryQueue.length > 0 && this.status.online) {
      const operation = this.retryQueue.shift();
      if (operation) {
        try {
          await operation();
        } catch {
          this.retryQueue.unshift(operation);
          break;
        }
      }
    }

    this.isRetrying = false;
  }

  measureRTT(url: string): Promise<number> {
    return new Promise((resolve) => {
      if (!this.status.online) {
        resolve(-1);
        return;
      }

      const start = performance.now();
      fetch(url, { method: 'HEAD', cache: 'no-store' })
        .then(() => {
          const rtt = performance.now() - start;
          this.status.rtt = rtt;
          resolve(rtt);
        })
        .catch(() => resolve(-1));
    });
  }

  destroy(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.listeners.clear();
    this.retryQueue = [];
  }
}

let globalMonitor: NetworkMonitor | null = null;

export function getNetworkMonitor(config?: NetworkMonitorConfig): NetworkMonitor {
  if (!globalMonitor) {
    globalMonitor = new NetworkMonitor(config);
  }
  return globalMonitor;
}
