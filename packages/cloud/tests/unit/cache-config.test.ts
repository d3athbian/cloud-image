import { describe, it, expect } from 'vitest';
import { CacheConfig, DEFAULT_CACHE_CONFIG, isValidCacheConfig } from '../../src/core/types';

describe('CacheConfig', () => {
  describe('DEFAULT_CACHE_CONFIG', () => {
    it('should have default maxSize of 100MB', () => {
      expect(DEFAULT_CACHE_CONFIG.maxSize).toBe(100 * 1024 * 1024);
    });

    it('should have default TTL of 7 days', () => {
      expect(DEFAULT_CACHE_CONFIG.defaultTTL).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it('should have memoryTierSize of 20MB', () => {
      expect(DEFAULT_CACHE_CONFIG.memoryTierSize).toBe(20 * 1024 * 1024);
    });

    it('should have debug disabled by default', () => {
      expect(DEFAULT_CACHE_CONFIG.debug).toBe(false);
    });

    it('should have maxRetries of 3', () => {
      expect(DEFAULT_CACHE_CONFIG.maxRetries).toBe(3);
    });

    it('should have requestTimeout of 10 seconds', () => {
      expect(DEFAULT_CACHE_CONFIG.requestTimeout).toBe(10000);
    });
  });

  describe('isValidCacheConfig', () => {
    it('should accept valid config with all defaults', () => {
      const config: CacheConfig = {
        ...DEFAULT_CACHE_CONFIG,
      };
      expect(isValidCacheConfig(config)).toBe(true);
    });

    it('should accept config with custom maxSize', () => {
      const config: CacheConfig = {
        ...DEFAULT_CACHE_CONFIG,
        maxSize: 200 * 1024 * 1024,
      };
      expect(isValidCacheConfig(config)).toBe(true);
    });

    it('should reject maxSize smaller than memoryTierSize', () => {
      const config: CacheConfig = {
        ...DEFAULT_CACHE_CONFIG,
        maxSize: 10 * 1024 * 1024,
        memoryTierSize: 20 * 1024 * 1024,
      };
      expect(isValidCacheConfig(config)).toBe(false);
    });

    it('should accept equal maxSize and memoryTierSize', () => {
      const config: CacheConfig = {
        ...DEFAULT_CACHE_CONFIG,
        maxSize: 20 * 1024 * 1024,
        memoryTierSize: 20 * 1024 * 1024,
      };
      expect(isValidCacheConfig(config)).toBe(true);
    });

    it('should reject negative values', () => {
      const config: CacheConfig = {
        ...DEFAULT_CACHE_CONFIG,
        maxSize: -1,
      };
      expect(isValidCacheConfig(config)).toBe(false);
    });

    it('should reject zero maxSize', () => {
      const config: CacheConfig = {
        ...DEFAULT_CACHE_CONFIG,
        maxSize: 0,
      };
      expect(isValidCacheConfig(config)).toBe(false);
    });

    it('should reject TTL of 0', () => {
      const config: CacheConfig = {
        ...DEFAULT_CACHE_CONFIG,
        defaultTTL: 0,
      };
      expect(isValidCacheConfig(config)).toBe(false);
    });

    it('should accept valid platformOverride', () => {
      const platforms: Array<CacheConfig['platformOverride']> = ['web', 'tizen', 'webos', 'memory'];
      platforms.forEach((platform) => {
        const config: CacheConfig = {
          ...DEFAULT_CACHE_CONFIG,
          platformOverride: platform,
        };
        expect(isValidCacheConfig(config)).toBe(true);
      });
    });

    it('should accept custom maxRetries', () => {
      const config: CacheConfig = {
        ...DEFAULT_CACHE_CONFIG,
        maxRetries: 5,
      };
      expect(isValidCacheConfig(config)).toBe(true);
    });

    it('should reject negative maxRetries', () => {
      const config: CacheConfig = {
        ...DEFAULT_CACHE_CONFIG,
        maxRetries: -1,
      };
      expect(isValidCacheConfig(config)).toBe(false);
    });

    it('should accept custom requestTimeout', () => {
      const config: CacheConfig = {
        ...DEFAULT_CACHE_CONFIG,
        requestTimeout: 30000,
      };
      expect(isValidCacheConfig(config)).toBe(true);
    });
  });

  describe('memory constraints', () => {
    it('should require memoryTierSize to be less than maxSize', () => {
      const config: CacheConfig = {
        ...DEFAULT_CACHE_CONFIG,
        maxSize: 100 * 1024 * 1024,
        memoryTierSize: 50 * 1024 * 1024,
      };
      expect(isValidCacheConfig(config)).toBe(true);
    });
  });
});

/**
 * Validate CacheConfig
 */
function isValidCacheConfig(config: CacheConfig): boolean {
  if (!config.maxSize || config.maxSize <= 0) return false;
  if (!config.defaultTTL || config.defaultTTL <= 0) return false;
  if (config.maxSize < config.memoryTierSize) return false;
  if (config.maxRetries !== undefined && config.maxRetries < 0) return false;
  if (config.requestTimeout !== undefined && config.requestTimeout <= 0) return false;
  return true;
}
