export type BandwidthClassification = 'low' | 'medium' | 'high' | 'unknown';

export interface NetworkMetrics {
  rtt: number;
  bandwidth: BandwidthClassification;
  mbps?: number;
  timestamp: number;
}

const RTT_THRESHOLD_LOW = 500;
const RTT_THRESHOLD_MEDIUM = 200;
const SAMPLE_SIZE = 5;

export class NetworkMonitor {
  private samples: number[] = [];
  private lastMetrics: NetworkMetrics = {
    rtt: 0,
    bandwidth: 'unknown',
    timestamp: 0,
  };

  async measureRTT(url: string): Promise<number> {
    const startTime = performance.now();
    
    try {
      await fetch(url, { method: 'HEAD', cache: 'no-store' });
      const rtt = performance.now() - startTime;
      this.addSample(rtt);
      return rtt;
    } catch {
      return Infinity;
    }
  }

  private addSample(rtt: number): void {
    this.samples.push(rtt);
    if (this.samples.length > SAMPLE_SIZE) {
      this.samples.shift();
    }
    this.updateMetrics();
  }

  private updateMetrics(): void {
    if (this.samples.length === 0) return;

    const avgRtt = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    
    let bandwidth: BandwidthClassification;
    if (avgRtt < RTT_THRESHOLD_MEDIUM) {
      bandwidth = 'high';
    } else if (avgRtt < RTT_THRESHOLD_LOW) {
      bandwidth = 'medium';
    } else {
      bandwidth = 'low';
    }

    this.lastMetrics = {
      rtt: avgRtt,
      bandwidth,
      timestamp: Date.now(),
    };
  }

  getMetrics(): NetworkMetrics {
    return { ...this.lastMetrics };
  }

  getBandwidth(): BandwidthClassification {
    return this.lastMetrics.bandwidth;
  }

  getRTT(): number {
    return this.lastMetrics.rtt;
  }

  shouldRequestSmallVariant(): boolean {
    return this.lastMetrics.bandwidth === 'low';
  }

  reset(): void {
    this.samples = [];
    this.lastMetrics = {
      rtt: 0,
      bandwidth: 'unknown',
      timestamp: 0,
    };
  }
}

let monitorInstance: NetworkMonitor | null = null;

export function getNetworkMonitor(): NetworkMonitor {
  if (!monitorInstance) {
    monitorInstance = new NetworkMonitor();
  }
  return monitorInstance;
}