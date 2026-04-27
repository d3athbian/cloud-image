export interface MemoryMetrics {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  percentage: number;
  timestamp: number;
}

export interface MemoryConfig {
  highThreshold?: number;
  criticalThreshold?: number;
  checkInterval?: number;
  aggressiveEvictionRatio?: number;
}

import { Threshold, Time } from "../config/constants";
import { logger } from "../utils/logger";
import { updateMemory } from "./system-atoms";

const log = logger.MemoryMonitor;

export type MemoryEventType = "normal" | "high" | "critical" | "eviction";

export interface MemoryEvent {
  type: MemoryEventType;
  metrics: MemoryMetrics;
  timestamp: number;
  evictedEntries?: number;
}

type MemoryListener = (event: MemoryEvent) => void;

export class MemoryMonitor {
  private metrics: MemoryMetrics[] = [];
  private config: Required<MemoryConfig>;
  private listeners: Set<MemoryListener> = new Set();
  private lastStatus: MemoryEventType = "normal";
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private evictionCallback: ((ratio: number) => Promise<void>) | null = null;

  constructor(config: MemoryConfig = {}) {
    this.config = {
      highThreshold: config.highThreshold ?? Threshold.MEMORY_HIGH,
      criticalThreshold: config.criticalThreshold ?? Threshold.MEMORY_CRITICAL,
      checkInterval: config.checkInterval ?? Time.MEMORY_CHECK_INTERVAL,
      aggressiveEvictionRatio: config.aggressiveEvictionRatio ?? 0.3,
    };
  }

  setEvictionCallback(callback: (ratio: number) => Promise<void>): void {
    this.evictionCallback = callback;
  }

  getMetrics(): MemoryMetrics | null {
    if (typeof performance === "undefined") {
      return null;
    }

    const memory = (
      performance as Performance & {
        memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };
      }
    ).memory;

    if (!memory) {
      return null;
    }

    const percentage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      percentage,
      timestamp: Date.now(),
    };
  }

  getStatus(): MemoryEventType {
    const metrics = this.getMetrics();

    if (!metrics) {
      return "normal";
    }

    if (metrics.percentage >= this.config.criticalThreshold) {
      return "critical";
    }

    if (metrics.percentage >= this.config.highThreshold) {
      return "high";
    }

    return "normal";
  }

  shouldEvict(): { shouldEvict: boolean; ratio: number } {
    const status = this.getStatus();

    if (status === "critical") {
      return { shouldEvict: true, ratio: this.config.aggressiveEvictionRatio };
    }

    if (status === "high") {
      return { shouldEvict: true, ratio: this.config.aggressiveEvictionRatio / 2 };
    }

    return { shouldEvict: false, ratio: 0 };
  }

  startMonitoring(onUpdate?: (metrics: MemoryMetrics) => void): void {
    if (this.checkInterval) {
      return;
    }

    this.checkInterval = setInterval(() => {
      const metrics = this.getMetrics();
      if (!metrics) return;

      this.metrics.push(metrics);
      if (this.metrics.length > 100) {
        this.metrics.shift();
      }

      const newStatus = this.getStatus();
      if (newStatus !== this.lastStatus) {
        this.lastStatus = newStatus;
        this.notifyListeners({
          type: newStatus,
          metrics,
          timestamp: Date.now(),
        });
      }

      // Proactive eviction - coordinate with cache before reaching critical
      const eviction = this.shouldEvict();
      if (eviction.shouldEvict && this.evictionCallback) {
        this.evictionCallback(eviction.ratio).catch((err) => {
          log.warn("[MemoryMonitor] Proactive eviction failed:", err);
        });
      }

      onUpdate?.(metrics);
    }, this.config.checkInterval);
  }

  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  getHistory(): MemoryMetrics[] {
    return [...this.metrics];
  }

  getAveragePercentage(): number {
    if (this.metrics.length === 0) return 0;
    const sum = this.metrics.reduce((acc, m) => acc + m.percentage, 0);
    return sum / this.metrics.length;
  }

  subscribe(listener: MemoryListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(event: MemoryEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // Ignore listener errors
      }
    }
    const pressureLevel =
      event.type === "critical" ? "high" : event.type === "high" ? "medium" : "low";
    updateMemory({
      isUnderPressure: event.type !== "normal",
      pressureLevel,
      usedJSHeapSize: event.metrics.usedJSHeapSize,
      jsHeapSizeLimit: event.metrics.jsHeapSizeLimit,
    });
  }

  isSupported(): boolean {
    if (typeof performance === "undefined") {
      return false;
    }
    const memory = (performance as Performance & { memory?: unknown }).memory;
    return memory !== undefined;
  }

  getConfig(): MemoryConfig {
    return { ...this.config };
  }

  destroy(): void {
    this.stopMonitoring();
    this.listeners.clear();
    this.metrics = [];
  }
}

let globalMonitor: MemoryMonitor | null = null;

export function getMemoryMonitor(config?: MemoryConfig): MemoryMonitor {
  if (!globalMonitor) {
    globalMonitor = new MemoryMonitor(config);
  }
  return globalMonitor;
}
