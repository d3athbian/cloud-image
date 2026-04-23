import type { CacheEntry } from "../core/types";

export interface ScoringConfig {
  defaultTTL: number;
  accessWeight?: number;
  recencyWeight?: number;
}

import { Time } from "../config/constants";

const DEFAULT_CONFIG: Required<ScoringConfig> = {
  defaultTTL: Time.DEFAULT_TTL,
  accessWeight: 0.6,
  recencyWeight: 0.4,
};

export const scoring = {
  calculateRecency: (accessedAt: number, ttl: number): number => {
    const ttlVal = ttl || 1;
    const recency = 1 - (Date.now() - accessedAt) / ttlVal;
    return Math.max(0, recency);
  },

  calculateAccessWeight: (accessCount: number): number => {
    return Math.min(accessCount / 100, 1);
  },

  combinedScore: (accessedAt: number, accessCount: number, ttl: number): number => {
    const accessWeight = DEFAULT_CONFIG.accessWeight;
    const recencyWeight = DEFAULT_CONFIG.recencyWeight;

    const accessScore = scoring.calculateAccessWeight(accessCount);
    const recencyScore = scoring.calculateRecency(accessedAt, ttl);

    return accessScore * accessWeight + recencyScore * recencyWeight;
  },

  calculateScore: (entry: CacheEntry): number => {
    return scoring.combinedScore(
      entry.metadata.accessedAt,
      entry.metadata.accessCount,
      DEFAULT_CONFIG.defaultTTL,
    );
  },

  rankEntries: (entries: CacheEntry[]): CacheEntry[] => {
    return [...entries].sort((a, b) => {
      const scoreA = scoring.calculateScore(a);
      const scoreB = scoring.calculateScore(b);
      return scoreA - scoreB;
    });
  },

  isHighPriority: (entry: CacheEntry, threshold = 0.5): boolean => {
    return scoring.calculateScore(entry) >= threshold;
  },
};
