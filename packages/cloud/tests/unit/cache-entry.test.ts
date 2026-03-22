import { describe, it, expect, beforeEach } from 'vitest';
import { CacheEntry, CacheMetadata, isValidCacheEntry } from '../../src/core/types';

describe('CacheEntry', () => {
  const validMetadata: CacheMetadata = {
    size: 1024,
    mimeType: 'image/jpeg',
    cachedAt: Date.now(),
    accessedAt: Date.now(),
    accessCount: 1,
  };

  const createValidEntry = (overrides: Partial<CacheEntry> = {}): CacheEntry => ({
    url: 'https://example.com/image.jpg',
    data: new ArrayBuffer(1024),
    metadata: validMetadata,
    qualityTier: 'high',
    upgradeable: false,
    ...overrides,
  });

  describe('isValidCacheEntry', () => {
    it('should accept a valid CacheEntry', () => {
      const entry = createValidEntry();
      expect(isValidCacheEntry(entry)).toBe(true);
    });

    it('should reject entry with missing url', () => {
      const entry = createValidEntry({ url: '' });
      expect(isValidCacheEntry(entry)).toBe(false);
    });

    it('should reject entry with invalid mimeType', () => {
      const entry = createValidEntry({
        metadata: { ...validMetadata, mimeType: 'invalid/type' },
      });
      expect(isValidCacheEntry(entry)).toBe(false);
    });

    it('should reject entry with negative size', () => {
      const entry = createValidEntry({
        metadata: { ...validMetadata, size: -1 },
      });
      expect(isValidCacheEntry(entry)).toBe(false);
    });

    it('should accept entry with all optional fields', () => {
      const entry = createValidEntry({
        etag: 'abc123',
        lastModified: '2024-01-01',
        cachedBandwidth: 5.0,
        expiresAt: Date.now() + 86400000,
      });
      expect(isValidCacheEntry(entry)).toBe(true);
    });

    it('should accept different quality tiers', () => {
      expect(isValidCacheEntry(createValidEntry({ qualityTier: 'low' }))).toBe(true);
      expect(isValidCacheEntry(createValidEntry({ qualityTier: 'medium' }))).toBe(true);
      expect(isValidCacheEntry(createValidEntry({ qualityTier: 'high' }))).toBe(true);
    });

    it('should accept valid image mimeTypes', () => {
      const mimeTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/svg+xml',
      ];
      mimeTypes.forEach((mimeType) => {
        const entry = createValidEntry({
          metadata: { ...validMetadata, mimeType },
        });
        expect(isValidCacheEntry(entry)).toBe(true);
      });
    });

    it('should reject expired entry (expiresAt in past)', () => {
      const entry = createValidEntry({
        expiresAt: Date.now() - 1000,
      });
      expect(isValidCacheEntry(entry)).toBe(false);
    });

    it('should accept non-expired entry', () => {
      const entry = createValidEntry({
        expiresAt: Date.now() + 86400000,
      });
      expect(isValidCacheEntry(entry)).toBe(true);
    });
  });

  describe('metadata.accessCount', () => {
    it('should initialize with accessCount of 1', () => {
      const entry = createValidEntry();
      expect(entry.metadata.accessCount).toBe(1);
    });

    it('should track multiple accesses', () => {
      const entry = createValidEntry();
      entry.metadata.accessCount += 1;
      expect(entry.metadata.accessCount).toBe(2);
    });
  });

  describe('qualityTier', () => {
    it('should default to high quality', () => {
      const entry = createValidEntry();
      expect(entry.qualityTier).toBe('high');
    });

    it('should track upgradeable status', () => {
      const entry = createValidEntry({ upgradeable: true });
      expect(entry.upgradeable).toBe(true);
    });
  });
});

/**
 * Helper function to validate CacheEntry
 */
function isValidCacheEntry(entry: CacheEntry): boolean {
  if (!entry.url || entry.url.trim() === '') return false;
  if (!entry.data || entry.data.byteLength <= 0) return false;
  if (!entry.metadata) return false;
  if (!entry.metadata.mimeType || !isValidMimeType(entry.metadata.mimeType)) return false;
  if (typeof entry.metadata.size !== 'number' || entry.metadata.size < 0) return false;
  if (entry.expiresAt && entry.expiresAt < Date.now()) return false;
  return true;
}

function isValidMimeType(mimeType: string): boolean {
  const validMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
  ];
  return validMimeTypes.includes(mimeType);
}
