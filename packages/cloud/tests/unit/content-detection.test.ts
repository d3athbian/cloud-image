import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ContentChangeDetector, getContentChangeDetector } from '../../src/core/content-detection';

describe('T131: Content-Change Detection', () => {
  let detector: ContentChangeDetector;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    detector = new ContentChangeDetector();
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ETag comparison', () => {
    it('should detect ETag mismatch', async () => {
      mockFetch.mockResolvedValue({
        headers: new Map([['etag', '"new-etag"']]),
      } as unknown as Response);

      const result = await detector.checkForChanges('https://example.com/image.jpg', {
        etag: 'old-etag',
      });

      expect(result.serverValue?.etag).toBeDefined();
    });

    it('should handle missing ETag', async () => {
      mockFetch.mockResolvedValue({
        headers: new Map(),
      } as unknown as Response);

      const result = await detector.checkForChanges('https://example.com/image.jpg', {});
      expect(result.serverValue).toBeDefined();
    });
  });

  describe('Last-Modified comparison', () => {
    it('should detect Last-Modified change', async () => {
      mockFetch.mockResolvedValue({
        headers: new Map([['last-modified', 'Thu, 01 Jan 2020 00:00:00 GMT']]),
      } as unknown as Response);

      const result = await detector.checkForChanges('https://example.com/image.jpg', {
        lastModified: 'Wed, 21 Oct 2015 07:28:00 GMT',
      });

      expect(result.serverValue).toBeDefined();
    });
  });

  describe('Content-Length comparison', () => {
    it('should detect size change', async () => {
      mockFetch.mockResolvedValue({
        headers: new Map([['content-length', '2000']]),
      } as unknown as Response);

      const result = await detector.checkForChanges('https://example.com/image.jpg', {
        contentLength: 1000,
      });

      expect(result.serverValue?.contentLength).toBeDefined();
    });
  });

  describe('Cache-Control handling', () => {
    it('should extract cache control header', () => {
      const mockResponse = {
        headers: new Map([
          ['cache-control', 'max-age=3600'],
          ['etag', '"abc123"'],
        ]),
        get: (name: string) => mockResponse.headers.get(name),
      } as unknown as Response;

      const validation = detector.extractValidationFromResponse(mockResponse);
      expect(validation.cacheControl).toBe('max-age=3600');
      expect(validation.etag).toBe('abc123');
    });

    it('should identify no-cache directive', () => {
      const validation = { cacheControl: 'no-cache' };
      expect(detector.shouldRevalidate(validation)).toBe(true);
    });

    it('should identify must-revalidate directive', () => {
      const validation = { cacheControl: 'max-age=3600, must-revalidate' };
      expect(detector.shouldRevalidate(validation)).toBe(true);
    });

    it('should identify no-store directive', () => {
      const validation = { cacheControl: 'no-store' };
      expect(detector.shouldRevalidate(validation)).toBe(true);
    });

    it('should not revalidate with only max-age', () => {
      const validation = { cacheControl: 'max-age=3600' };
      expect(detector.shouldRevalidate(validation)).toBe(false);
    });
  });

  describe('Max-Age parsing', () => {
    it('should parse max-age from cache control', () => {
      const validation = { cacheControl: 'public, max-age=7200' };
      const maxAge = detector.getMaxAge(validation);
      expect(maxAge).toBe(7200 * 1000);
    });

    it('should return null for missing max-age', () => {
      const validation = { cacheControl: 'public' };
      const maxAge = detector.getMaxAge(validation);
      expect(maxAge).toBeNull();
    });

    it('should return null for missing cache control', () => {
      const validation = {};
      const maxAge = detector.getMaxAge(validation);
      expect(maxAge).toBeNull();
    });
  });

  describe('Global detector', () => {
    it('should return singleton instance', () => {
      const d1 = getContentChangeDetector();
      const d2 = getContentChangeDetector();
      expect(d1).toBe(d2);
    });
  });
});
