import { getBandwidthMonitor, type BandwidthMonitor } from './bandwidth';
import { createCDNAdapter, type CDNAdapter, type CDNVariant } from './cdn-adapter';
import type { CacheEntry, BandwidthClassification } from './types';

import { Time } from '../config/constants';

export interface SilentUpgradeConfig {
  enabled?: boolean;
  minBandwidth?: BandwidthClassification;
  checkInterval?: number;
}

export class SilentUpgradeManager {
  private bandwidthMonitor: BandwidthMonitor;
  private cdnAdapter: CDNAdapter;
  private config: Required<SilentUpgradeConfig>;
  private upgradeCallback?: (url: string, data: ArrayBuffer) => Promise<void>;
  private isProcessing = false;
  private upgradeQueue: Array<{ url: string; entry: CacheEntry }> = [];
  private listeners: Set<() => void> = new Set();

  constructor(
    bandwidthMonitor: BandwidthMonitor,
    cdnAdapter: CDNAdapter,
    config: SilentUpgradeConfig = {}
  ) {
    this.bandwidthMonitor = bandwidthMonitor;
    this.cdnAdapter = cdnAdapter;
    this.config = {
      enabled: config.enabled ?? true,
      minBandwidth: config.minBandwidth ?? 'medium',
      checkInterval: config.checkInterval ?? Time.SILENT_UPGRADE_INTERVAL,
    };

    this.setupBandwidthListener();
  }

  private setupBandwidthListener(): void {
    this.bandwidthMonitor.subscribe((event) => {
      if (event.type === 'classificationChange' && event.current === 'high') {
        if (this.shouldTriggerUpgrade()) {
          this.processUpgradeQueue();
        }
      }
    });
  }

  setUpgradeCallback(callback: (url: string, data: ArrayBuffer) => Promise<void>): void {
    this.upgradeCallback = callback;
  }

  queueForUpgrade(url: string, entry: CacheEntry): void {
    if (!entry.upgradeable || !this.shouldUpgrade(entry)) {
      return;
    }

    this.upgradeQueue.push({ url, entry });
    this.notifyListeners();
  }

  private shouldUpgrade(entry: CacheEntry): boolean {
    if (!this.config.enabled) return false;
    if (!entry.upgradeable) return false;
    if (entry.qualityTier === 'high') return false;
    
    return true;
  }

  private shouldTriggerUpgrade(): boolean {
    const current = this.bandwidthMonitor.getClassification();
    const minLevel = this.config.minBandwidth;
    
    const levelOrder: BandwidthClassification[] = ['low', 'medium', 'high'];
    return levelOrder.indexOf(current) >= levelOrder.indexOf(minLevel);
  }

  private async processUpgradeQueue(): Promise<void> {
    if (this.isProcessing || this.upgradeQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.upgradeQueue.length > 0) {
      const { url, entry } = this.upgradeQueue.shift()!;
      
      try {
        await this.performUpgrade(url, entry);
      } catch {
        // Silently fail and continue with next
      }
    }

    this.isProcessing = false;
  }

  private async performUpgrade(url: string, _entry: CacheEntry): Promise<void> {
    if (!this.upgradeCallback) return;

    const variant = this.cdnAdapter.getVariantForBandwidth('high');
    const upgradeUrl = this.cdnAdapter.generateUrl(url, variant);

    try {
      const response = await fetch(upgradeUrl);
      const data = await response.arrayBuffer();

      await this.upgradeCallback(url, data);
    } catch {
      // Upgrade failed - continue silently
    }
  }

  getQueueSize(): number {
    return this.upgradeQueue.length;
  }

  getQueuedUrls(): string[] {
    return this.upgradeQueue.map(q => q.url);
  }

  clearQueue(): void {
    this.upgradeQueue = [];
    this.notifyListeners();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // Ignore listener errors
      }
    }
  }

  destroy(): void {
    this.upgradeQueue = [];
    this.listeners.clear();
  }
}

export function createSilentUpgradeManager(config?: SilentUpgradeConfig): SilentUpgradeManager {
  const bandwidthMonitor = getBandwidthMonitor();
  const cdnAdapter = createCDNAdapter('default');
  
  return new SilentUpgradeManager(bandwidthMonitor, cdnAdapter, config);
}
