// Global type declarations for platform-specific globals
// These declarations apply globally via 'declare global'

interface TizenGlobal {
  systeminfo: {
    getCapability(key: string): string;
  };
  filesystem: {
    resolve(
      path: string,
      successCallback: (dir: unknown) => void,
      errorCallback?: (e: Error) => void,
      type?: string,
    ): void;
  };
}

interface WebOSGlobal {
  webos: {
    system: {
      getSystemProperty(key: string, callback: (value: string) => void): void;
    };
  };
  service: {
    request(
      uri: string,
      params: {
        method: string;
        parameters?: Record<string, unknown>;
        onSuccess?: (r: { payload?: unknown }) => void;
        onFailure?: (r: { errorText: string }) => void;
      },
    ): void;
  };
}

interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemory;
}

// Extend global scope
declare global {
  // Service Worker global scope
  const self: ServiceWorkerGlobalScope;

  // Samsung Tizen
  const tizen: TizenGlobal;

  // LG webOS
  const webOS: WebOSGlobal;

  // Window extensions
  interface Window {
    __CLOUD__?: unknown;
    __CLOUD_SW_STATE__?: string;
    serviceWorker?: ServiceWorkerContainer;
  }

  // Navigator extensions
  interface Navigator {
    serviceWorker?: ServiceWorkerContainer;
    storage?: Storage;
  }

  // Performance with memory (Chrome only)
  const performance: PerformanceWithMemory;
}

// CSS Module declarations
declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module "*.css" {
  const content: string;
  export default content;
}

export {};
