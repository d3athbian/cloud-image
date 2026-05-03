export interface PerformanceMetrics {
  messageLatency: number;
  decodeTime: number;
  transferTime: number;
  totalBlockingTime: number;
  queueDepth: number;
  processedCount: number;
  errorCount: number;
}

export interface PerformanceSample {
  timestamp: number;
  type: 'message' | 'decode' | 'transfer';
  duration: number;
  correlationId: string;
}

export class PerformanceMonitor {
  private samples: PerformanceSample[] = [];
  private metrics: PerformanceMetrics = {
    messageLatency: 0,
    decodeTime: 0,
    transferTime: 0,
    totalBlockingTime: 0,
    queueDepth: 0,
    processedCount: 0,
    errorCount: 0,
  };
  private readonly maxSamples = 1000;
  private readonly blockingThreshold = 2; // 2ms target

  addSample(sample: PerformanceSample): void {
    this.samples.push(sample);
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
    this.updateMetrics();
  }

  private updateMetrics(): void {
    const now = Date.now();
    const recentSamples = this.samples.filter((s) => now - s.timestamp < 60000);

    const messageSamples = recentSamples.filter((s) => s.type === 'message');
    const decodeSamples = recentSamples.filter((s) => s.type === 'decode');
    const transferSamples = recentSamples.filter((s) => s.type === 'transfer');

    this.metrics.messageLatency = this.calculateAverage(messageSamples);
    this.metrics.decodeTime = this.calculateAverage(decodeSamples);
    this.metrics.transferTime = this.calculateAverage(transferSamples);
    this.metrics.totalBlockingTime = this.calculateAverage(recentSamples);
    this.metrics.processedCount = recentSamples.length;
    this.metrics.errorCount = this.samples.filter((s) => s.duration < 0).length;
  }

  private calculateAverage(samples: PerformanceSample[]): number {
    if (samples.length === 0) return 0;
    return samples.reduce((sum, s) => sum + Math.abs(s.duration), 0) / samples.length;
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  isBlockingThresholdMet(): boolean {
    return this.metrics.totalBlockingTime <= this.blockingThreshold;
  }

  getBlockingReport(): { meetsTarget: boolean; avgBlocking: number; threshold: number } {
    return {
      meetsTarget: this.isBlockingThresholdMet(),
      avgBlocking: this.metrics.totalBlockingTime,
      threshold: this.blockingThreshold,
    };
  }

  reset(): void {
    this.samples = [];
    this.metrics = {
      messageLatency: 0,
      decodeTime: 0,
      transferTime: 0,
      totalBlockingTime: 0,
      queueDepth: 0,
      processedCount: 0,
      errorCount: 0,
    };
  }

  getRecentSamples(count: number = 10): PerformanceSample[] {
    return this.samples.slice(-count);
  }
}

let globalMonitor: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!globalMonitor) {
    globalMonitor = new PerformanceMonitor();
  }
  return globalMonitor;
}
