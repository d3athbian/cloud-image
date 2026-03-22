import { describe, it, expect, beforeEach } from 'vitest';
import { DefaultCDNAdapter, CloudinaryCDNAdapter, ImgixCDNAdapter, createCDNAdapter } from '../../src/core/cdn-adapter';

describe('T103: CDN Variant URL Generation', () => {
  describe('DefaultCDNAdapter', () => {
    let adapter: DefaultCDNAdapter;

    beforeEach(() => {
      adapter = new DefaultCDNAdapter({
        domain: 'cdn.example.com',
        variants: [
          { name: 'small', width: 320 },
          { name: 'medium', width: 640 },
          { name: 'large', width: 1280 },
        ],
      });
    });

    it('should generate URL with variant', () => {
      const url = adapter.generateUrl('https://example.com/image.jpg', { name: 'small', width: 320 });
      expect(url).toContain('small');
    });

    it('should generate URL with pattern', () => {
      adapter = new DefaultCDNAdapter({
        urlPattern: '{url}?v={variant}',
      });
      const url = adapter.generateUrl('https://example.com/image.jpg', { name: 'small' });
      expect(url).toContain('v=small');
    });

    it('should return original URL if bandwidthAware is false', () => {
      adapter = new DefaultCDNAdapter({ bandwidthAware: false });
      const url = adapter.generateUrl('https://example.com/image.jpg', { name: 'small' });
      expect(url).toBe('https://example.com/image.jpg');
    });

    it('should get variant for bandwidth', () => {
      const lowVariant = adapter.getVariantForBandwidth('low');
      expect(lowVariant.name).toBe('small');

      const highVariant = adapter.getVariantForBandwidth('high');
      expect(highVariant.name).toBe('large');
    });

    it('should check availability', () => {
      expect(adapter.isAvailable()).toBe(true);
    });
  });

  describe('CloudinaryCDNAdapter', () => {
    it('should generate Cloudinary URL', () => {
      const adapter = new CloudinaryCDNAdapter('mycloud');
      const url = adapter.generateUrl('https://example.com/image.jpg', { name: 'small', width: 320 });
      expect(url).toContain('cloudinary.com');
      expect(url).toContain('mycloud');
    });

    it('should check availability with cloud name', () => {
      const adapter = new CloudinaryCDNAdapter('mycloud');
      expect(adapter.isAvailable()).toBe(true);

      const emptyAdapter = new CloudinaryCDNAdapter('');
      expect(emptyAdapter.isAvailable()).toBe(false);
    });
  });

  describe('ImgixCDNAdapter', () => {
    it('should generate Imgix URL', () => {
      const adapter = new ImgixCDNAdapter('myimages');
      const url = adapter.generateUrl('https://example.com/image.jpg', { name: 'small', width: 320 });
      expect(url).toContain('imgix.net');
      expect(url).toContain('w=320');
    });

    it('should check availability with domain', () => {
      const adapter = new ImgixCDNAdapter('myimages');
      expect(adapter.isAvailable()).toBe(true);
    });
  });

  describe('Factory', () => {
    it('should create default adapter', () => {
      const adapter = createCDNAdapter('default');
      expect(adapter.name).toBe('default');
    });

    it('should create Cloudinary adapter', () => {
      const adapter = createCDNAdapter('cloudinary', { cloudName: 'mycloud' });
      expect(adapter.name).toBe('cloudinary');
    });

    it('should create Imgix adapter', () => {
      const adapter = createCDNAdapter('imgix', { domain: 'myimages' });
      expect(adapter.name).toBe('imgix');
    });
  });
});

describe('T111: URL Variant Generator', () => {
  it('should generate small variant for low bandwidth', () => {
    const adapter = new DefaultCDNAdapter({
      variants: [
        { name: 'small', width: 320 },
        { name: 'medium', width: 640 },
        { name: 'large', width: 1280 },
      ],
    });

    const variant = adapter.getVariantForBandwidth('low');
    expect(variant.name).toBe('small');
    expect(variant.width).toBe(320);
  });

  it('should generate medium variant for medium bandwidth', () => {
    const adapter = new DefaultCDNAdapter({
      variants: [
        { name: 'small', width: 320 },
        { name: 'medium', width: 640 },
        { name: 'large', width: 1280 },
      ],
    });

    const variant = adapter.getVariantForBandwidth('medium');
    expect(variant.name).toBe('medium');
  });

  it('should generate large variant for high bandwidth', () => {
    const adapter = new DefaultCDNAdapter({
      variants: [
        { name: 'small', width: 320 },
        { name: 'medium', width: 640 },
        { name: 'large', width: 1280 },
      ],
    });

    const variant = adapter.getVariantForBandwidth('high');
    expect(variant.name).toBe('large');
  });
});
