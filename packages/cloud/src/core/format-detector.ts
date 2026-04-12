import { logger } from '../utils/logger';

const log = logger.ImageCache;

export type ImageFormat = 'avif' | 'webp' | 'jpeg' | 'png';

interface FormatSupport {
  webp: boolean;
  avif: boolean;
}

export class FormatDetector {
  private static cachedSupport: FormatSupport | null = null;
  private static checkPromise: Promise<FormatSupport> | null = null;

  static async detectSupportedFormats(): Promise<ImageFormat[]> {
    if (this.cachedSupport) {
      return this.getFormatsFromSupport(this.cachedSupport);
    }

    if (this.checkPromise) {
      await this.checkPromise;
      return this.getFormatsFromSupport(this.cachedSupport!);
    }

    this.checkPromise = this.runDetection();
    this.cachedSupport = await this.checkPromise;
    this.checkPromise = null;

    return this.getFormatsFromSupport(this.cachedSupport);
  }

  static getPreferredFormat(): ImageFormat {
    if (!this.cachedSupport) {
      return 'jpeg';
    }

    if (this.cachedSupport.avif) return 'avif';
    if (this.cachedSupport.webp) return 'webp';
    return 'jpeg';
  }

  static getAcceptHeader(): string {
    return 'image/avif,image/webp,image/jpeg,*/*';
  }

  private static getFormatsFromSupport(support: FormatSupport): ImageFormat[] {
    const formats: ImageFormat[] = ['jpeg', 'png'];
    if (support.webp) formats.unshift('webp');
    if (support.avif) formats.unshift('avif');
    return formats;
  }

  private static async runDetection(): Promise<FormatSupport> {
    if (typeof window === 'undefined') {
      return { webp: false, avif: false };
    }

    const support: FormatSupport = { webp: false, avif: false };

    try {
      support.webp = await this.checkWebP();
    } catch (e) {
      log.warn('[FormatDetector] WebP check failed:', e);
    }

    try {
      support.avif = await this.checkAVIF();
    } catch (e) {
      log.warn('[FormatDetector] AVIF check failed:', e);
    }

    log.info('[FormatDetector] Supported formats:', support);
    return support;
  }

  private static checkWebP(): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new window.Image();
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;

      img.onload = () => {
        canvas.getContext('2d')?.drawImage(img, 0, 0);
        const data = canvas.toDataURL('image/webp');
        resolve(data.startsWith('data:image/webp'));
        img.onload = null;
        img.onerror = null;
      };

      img.onerror = () => resolve(false);

      img.src = 'data:image/webp;base64,UklGRiQAAABXAPJQAAAFAQB8AAEAfgAAABAA8ABwAAAAEABAAAgAARYwAAAgBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
        + 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
        + 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
    });
  }

  private static checkAVIF(): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new window.Image();

      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);

      img.src = 'data:image/avif;base64,AAAAIGZ0eXBpc20tAAAAABsAAAOptZzhfZzMuY21tcDoAAAAAAAAAAAAAAAABdwAAAbYrdmlwby1xAAAAGmabwoPjxj+t8AAAI4bj1cQB8uA4AAADSAAAAY3BydHQAAAA4AAAAbXdnZQBAAAAmAAAAIWN0ZW0BAAAAsgAAADgBAAAwAAAAFgByZXh0cmFzZS1lbmelAAAAkAAAAJsAAAAMdHJhawAAAFx0RW5kAAAAAAAAAAABCAABRgSAAAAwAAAAMgAAAAQAAAAEAABTSwAAAAQAAAAAE'
        + 'gAAAAAAAIABAAAAsAAAAABGi1AAAAABAgABBwAAAAECAwQFCCgAAAkHBgcICQoLDA0ODxAREhMUFRYXGBkaGywdIh8gISIjJCUmKConKS4uLS4vMDIzNDU2Nzg5Oj0+P0BBQkNERUZHSElKS0xN'
        + 'Tk9QUVJTVFVYWVpbXF1eX2BhYmdhYWxtY2RvY29vcXl5e3t9fX9/gIGCg4SFhoeIiYqLjI2Oj5CRkpOUlZaXmJmam5ydnp+goaKjpKWmp6ipqqusra6vsLGys7S1tre4ubq7vL2+v8DBwsPExcbHyMnKy8zNzs/Q0dLT1NXW19jZ2tvc3d7f4OHi4+Tl5ufo6err7O3u7/Dx8vP09fb3+Pn6+/z9/v/gAcKLCgQADs=';
    });
  }
}

export function getFormatDetector(): FormatDetector {
  return FormatDetector as any;
}