import type { BandwidthClassification } from "./types";

export interface BandwidthSample {
  timestamp: number;
  bytes: number;
  duration: number;
  mbps: number;
}

export interface BandwidthConfig {
  ringBufferSize?: number;
  lowThreshold?: number;
  mediumThreshold?: number;
  sampleWindow?: number;
}

export type BandwidthEventType =
  | "classificationChange"
  | "sampleAdded"
  | "upgradeTriggered"
  | "degradedTriggered";

export interface BandwidthEvent {
  type: BandwidthEventType;
  previous?: BandwidthClassification;
  current: BandwidthClassification;
  timestamp: number;
  sample?: BandwidthSample;
}

type BandwidthListener = (event: BandwidthEvent) => void;

export class BandwidthMonitor {
  private samples: BandwidthSample[] = [];
  private config: Required<BandwidthConfig>;
  private listeners: Set<BandwidthListener> = new Set();
  private classification: BandwidthClassification = "unknown";
  private previousClassification?: BandwidthClassification;

  constructor(config: BandwidthConfig = {}) {
    this.config = {
      ringBufferSize: config.ringBufferSize ?? 10,
      lowThreshold: config.lowThreshold ?? 0.5,
      mediumThreshold: config.mediumThreshold ?? 2,
      sampleWindow: config.sampleWindow ?? 60000,
    };
  }

  addSample(bytes: number, durationMs: number): void {
    const mbps = (bytes * 8) / (durationMs / 1000) / 1000000;

    const sample: BandwidthSample = {
      timestamp: Date.now(),
      bytes,
      duration: durationMs,
      mbps,
    };

    this.samples.push(sample);
    if (this.samples.length > this.config.ringBufferSize) {
      this.samples.shift();
    }

    const newClassification = this.classifySamples();
    const previous = this.classification;

    if (newClassification !== previous) {
      this.previousClassification = previous;
      this.classification = newClassification;
      this.notifyListeners({
        type: "classificationChange",
        previous,
        current: newClassification,
        timestamp: Date.now(),
        sample,
      });
    } else {
      this.notifyListeners({
        type: "sampleAdded",
        current: newClassification,
        timestamp: Date.now(),
        sample,
      });
    }
  }

  private classifySamples(): BandwidthClassification {
    const recentSamples = this.samples.filter(
      (s) => Date.now() - s.timestamp < this.config.sampleWindow,
    );

    if (recentSamples.length === 0) {
      return "unknown";
    }

    const medianMbps = this.calculateMedian(recentSamples.map((s) => s.mbps));

    if (medianMbps < this.config.lowThreshold) {
      return "low";
    } else if (medianMbps < this.config.mediumThreshold) {
      return "medium";
    } else {
      return "high";
    }
  }

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  getClassification(): BandwidthClassification {
    return this.classification;
  }

  getPreviousClassification(): BandwidthClassification | undefined {
    return this.previousClassification;
  }

  getSamples(): BandwidthSample[] {
    return [...this.samples];
  }

  getAverageMbps(): number {
    if (this.samples.length === 0) return 0;
    const total = this.samples.reduce((sum, s) => sum + s.mbps, 0);
    return total / this.samples.length;
  }

  getMedianMbps(): number {
    return this.calculateMedian(this.samples.map((s) => s.mbps));
  }

  shouldUpgrade(): boolean {
    return (
      this.classification === "high" &&
      this.previousClassification !== "high" &&
      this.previousClassification !== undefined
    );
  }

  shouldDegrade(): boolean {
    return (
      this.classification === "low" &&
      this.previousClassification !== "low" &&
      this.previousClassification !== undefined
    );
  }

  subscribe(listener: BandwidthListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(event: BandwidthEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // Ignore listener errors
      }
    }
  }

  reset(): void {
    this.samples = [];
    this.classification = "unknown";
    this.previousClassification = undefined;
  }

  destroy(): void {
    this.listeners.clear();
    this.samples = [];
  }
}

let globalMonitor: BandwidthMonitor | null = null;

export function getBandwidthMonitor(config?: BandwidthConfig): BandwidthMonitor {
  if (!globalMonitor) {
    globalMonitor = new BandwidthMonitor(config);
  }
  return globalMonitor;
}
