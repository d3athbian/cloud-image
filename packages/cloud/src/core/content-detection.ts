export interface ContentValidation {
  etag?: string;
  lastModified?: string;
  contentLength?: number;
  cacheControl?: string;
}

export interface ContentChangeResult {
  hasChanged: boolean;
  reason: 'etag_mismatch' | 'last_modified_changed' | 'size_changed' | 'network_error';
  serverValue?: ContentValidation;
}

export class ContentChangeDetector {
  async checkForChanges(
    url: string,
    cachedValidation: ContentValidation
  ): Promise<ContentChangeResult> {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        cache: 'no-store',
      });

      const serverEtag = response.headers.get('etag')?.replace(/"/g, '') || undefined;
      const serverLastModified = response.headers.get('last-modified') || undefined;
      const serverContentLength = parseInt(response.headers.get('content-length') || '0', 10) || undefined;

      if (serverEtag && cachedValidation.etag && serverEtag !== cachedValidation.etag) {
        return {
          hasChanged: true,
          reason: 'etag_mismatch',
          serverValue: {
            etag: serverEtag,
            lastModified: serverLastModified,
            contentLength: serverContentLength,
          },
        };
      }

      if (serverLastModified && cachedValidation.lastModified && serverLastModified !== cachedValidation.lastModified) {
        return {
          hasChanged: true,
          reason: 'last_modified_changed',
          serverValue: {
            etag: serverEtag,
            lastModified: serverLastModified,
            contentLength: serverContentLength,
          },
        };
      }

      if (serverContentLength && cachedValidation.contentLength && serverContentLength !== cachedValidation.contentLength) {
        return {
          hasChanged: true,
          reason: 'size_changed',
          serverValue: {
            etag: serverEtag,
            lastModified: serverLastModified,
            contentLength: serverContentLength,
          },
        };
      }

      return {
        hasChanged: false,
        reason: 'etag_mismatch',
        serverValue: {
          etag: serverEtag,
          lastModified: serverLastModified,
          contentLength: serverContentLength,
        },
      };
    } catch {
      return {
        hasChanged: false,
        reason: 'network_error',
      };
    }
  }

  extractValidationFromResponse(response: Response): ContentValidation {
    return {
      etag: response.headers.get('etag')?.replace(/"/g, ''),
      lastModified: response.headers.get('last-modified') || undefined,
      contentLength: parseInt(response.headers.get('content-length') || '0', 10) || undefined,
      cacheControl: response.headers.get('cache-control') || undefined,
    };
  }

  shouldRevalidate(validation: ContentValidation): boolean {
    if (!validation.cacheControl) {
      return true;
    }

    const noCache = validation.cacheControl.includes('no-cache');
    const mustRevalidate = validation.cacheControl.includes('must-revalidate');
    const noStore = validation.cacheControl.includes('no-store');

    return noCache || mustRevalidate || noStore;
  }

  getMaxAge(validation: ContentValidation): number | null {
    if (!validation.cacheControl) {
      return null;
    }

    const match = validation.cacheControl.match(/max-age=(\d+)/);
    if (match) {
      return parseInt(match[1], 10) * 1000; // Convert to milliseconds
    }

    return null;
  }
}

let globalDetector: ContentChangeDetector | null = null;

export function getContentChangeDetector(): ContentChangeDetector {
  if (!globalDetector) {
    globalDetector = new ContentChangeDetector();
  }
  return globalDetector;
}
