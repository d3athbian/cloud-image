import { networkAtom } from "./system-atoms";
import type { BandwidthClassification, NetworkStatus } from "./types";

export interface NetworkMonitorConfig {
  sampleInterval?: number;
  bandwidthThreshold?: {
    low: number;
    medium: number;
  };
  onStatusChange?: (status: NetworkStatus) => void;
  onBandwidthChange?: (classification: BandwidthClassification) => void;
  bandwidthTestUrl?: string;
  bandwidthTestSize?: number;
}

interface BandwidthSample {
  timestamp: number;
  mbps: number;
  bytesPerSecond: number;
  isConnectionApi: boolean;
  isProactiveTest?: boolean;
}

export class NetworkMonitor {
  private status: NetworkStatus = {
    online: true,
    bandwidth: "unknown",
    bandwidthTested: false,
  };
  private samples: BandwidthSample[] = [];
  private config: Required<NetworkMonitorConfig>;
  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private retryQueue: Array<() => Promise<void>> = [];
  private isRetrying = false;
  private isMeasuring = false;
  private measurementInterval: ReturnType<typeof setInterval> | null = null;
  private readonly DEFAULT_TEST_URL = "https://picsum.photos/100/100";
  private boundHandleOnline: () => void = () => this.handleOnline();
  private boundHandleOffline: () => void = () => this.handleOffline();
  private boundConnectionChange: (() => void) | null = null;
  private connectionRef: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    addEventListener?: (type: string, listener: () => void) => void;
    removeEventListener?: (type: string, listener: () => void) => void;
  } | null = null;

  constructor(config: NetworkMonitorConfig = {}) {
    this.config = {
      sampleInterval: config.sampleInterval ?? 5000,
      bandwidthThreshold: config.bandwidthThreshold ?? { low: 1.5, medium: 6 },
      onStatusChange: config.onStatusChange ?? (() => {}),
      onBandwidthChange: config.onBandwidthChange ?? (() => {}),
      bandwidthTestUrl: config.bandwidthTestUrl ?? this.DEFAULT_TEST_URL,
      bandwidthTestSize: config.bandwidthTestSize ?? 10000,
    };
    this.status.online = this.checkOnlineStatus();
    this.setupListeners();

    setTimeout(() => {
      this.measureBandwidthProactive().catch(() => {});
    }, 2000);
  }

  private checkOnlineStatus(): boolean {
    if (typeof navigator === "undefined") {
      return true;
    }
    return navigator.onLine;
  }

  private setupListeners(): void {
    if (typeof window === "undefined") return;

    window.addEventListener("online", this.boundHandleOnline);
    window.addEventListener("offline", this.boundHandleOffline);

    this.monitorConnectionAPI();
  }

  private monitorConnectionAPI(): void {
    const connection = (
      navigator as Navigator & {
        connection?: {
          effectiveType?: string;
          downlink?: number;
          rtt?: number;
          addEventListener?: (type: string, listener: () => void) => void;
          removeEventListener?: (type: string, listener: () => void) => void;
        };
      }
    ).connection;

    if (connection) {
      this.connectionRef = connection;
      this.updateFromConnectionAPI(connection);

      if (connection.addEventListener) {
        this.boundConnectionChange = () => {
          this.updateFromConnectionAPI(connection);
        };
        connection.addEventListener("change", this.boundConnectionChange);
      }
    }
  }

  private updateFromConnectionAPI(connection: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  }): void {
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
      case "slow-2g":
      case "2g":
        return "low";
      case "3g":
        return "medium";
      case "4g":
        return "high";
      default:
        return "unknown";
    }
  }

  private handleOnline(): void {
    this.status.online = true;
    this.notifyListeners();
    this.config.onStatusChange(this.status);
    this.processRetryQueue();
    networkAtom.set({
      status: "ONLINE",
      rtt: 0,
      lastChecked: Date.now(),
    });
  }

  private handleOffline(): void {
    this.status.online = false;
    this.status.bandwidth = "unknown";
    this.notifyListeners();
    this.config.onStatusChange(this.status);
    networkAtom.set({
      status: "OFFLINE",
      rtt: 0,
      lastChecked: Date.now(),
    });
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
    const medianMbps = this.calculateMedian(recentSamples.map((s) => s.mbps));

    if (medianMbps === 0) {
      this.status.bandwidth = "unknown";
    } else if (medianMbps < this.config.bandwidthThreshold.low) {
      this.status.bandwidth = "low";
    } else if (medianMbps < this.config.bandwidthThreshold.medium) {
      this.status.bandwidth = "medium";
    } else {
      this.status.bandwidth = "high";
    }
  }

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
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
      fetch(url, { method: "HEAD", cache: "no-store" })
        .then(() => {
          const rtt = performance.now() - start;
          this.status.rtt = rtt;
          resolve(rtt);
        })
        .catch(() => resolve(-1));
    });
  }

  async measureBandwidthProactive(): Promise<BandwidthClassification | null> {
    if (this.isMeasuring || !this.status.online) {
      return null;
    }

    this.isMeasuring = true;
    this.lastProactiveMeasure = Date.now();

    try {
      const testUrl = this.config.bandwidthTestUrl;
      const startTime = performance.now();
      const response = await fetch(testUrl, {
        method: "GET",
        cache: "no-store",
      });

      const endTime = performance.now();
      const durationMs = endTime - startTime;
      const contentLength = response.headers.get("content-length");
      const bytes = contentLength ? parseInt(contentLength, 10) : this.config.bandwidthTestSize;

      const bytesPerSecond = (bytes / durationMs) * 1000;
      const mbps = (bytesPerSecond * 8) / 1000000;

      const sample: BandwidthSample = {
        timestamp: Date.now(),
        mbps,
        bytesPerSecond,
        isConnectionApi: false,
        isProactiveTest: true,
      };

      this.addSample(sample);

      const _previous = this.status.bandwidth;
      this.status.bandwidthTested = true;
      this.status.mbps = Math.round(mbps * 100) / 100;
      this.updateClassification();

      this.config.onBandwidthChange(this.status.bandwidth);
      this.notifyListeners();

      return this.status.bandwidth;
    } catch {
      return null;
    } finally {
      this.isMeasuring = false;
    }
  }

  async measureBandwidth(url?: string): Promise<number> {
    if (!this.status.online) {
      return -1;
    }

    const testUrl = url || this.config.bandwidthTestUrl;

    try {
      const startTime = performance.now();
      const response = await fetch(testUrl, {
        method: "GET",
        cache: "no-store",
      });

      const endTime = performance.now();
      const durationMs = endTime - startTime;
      const contentLength = response.headers.get("content-length");
      const bytes = contentLength ? parseInt(contentLength, 10) : this.config.bandwidthTestSize;

      const bytesPerSecond = (bytes / durationMs) * 1000;
      const mbps = (bytesPerSecond * 8) / 1000000;

      return Math.round(mbps * 100) / 100;
    } catch {
      return -1;
    }
  }

  destroy(): void {
    if (typeof window === "undefined") return;

    window.removeEventListener("online", this.boundHandleOnline);
    window.removeEventListener("offline", this.boundHandleOffline);

    if (this.connectionRef && this.boundConnectionChange) {
      this.connectionRef.removeEventListener?.("change", this.boundConnectionChange);
      this.connectionRef = null;
      this.boundConnectionChange = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.measurementInterval) {
      clearInterval(this.measurementInterval);
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
