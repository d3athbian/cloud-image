import type { BandwidthClassification } from "./types";

export interface CDNVariant {
  name: string;
  width?: number;
  quality?: number;
}

export interface CDNConfig {
  domain?: string;
  variants?: CDNVariant[];
  urlPattern?: string;
  bandwidthAware?: boolean;
}

export interface CDNAdapter {
  readonly name: string;

  generateUrl(url: string, variant: CDNVariant): string;

  getVariantForBandwidth(bandwidth: BandwidthClassification): CDNVariant;

  isAvailable(): boolean;
}

export class DefaultCDNAdapter implements CDNAdapter {
  readonly name = "default";
  private config: CDNConfig;

  constructor(config: CDNConfig = {}) {
    this.config = {
      domain: config.domain,
      variants: config.variants ?? [
        { name: "small", width: 320, quality: 60 },
        { name: "medium", width: 640, quality: 75 },
        { name: "large", width: 1280, quality: 85 },
        { name: "original", quality: 100 },
      ],
      urlPattern: config.urlPattern ?? "{url}?size={variant}",
      bandwidthAware: config.bandwidthAware ?? true,
    };
  }

  generateUrl(url: string, variant: CDNVariant): string {
    if (!this.config.bandwidthAware) {
      return url;
    }

    const pattern = this.config.urlPattern?.replace("{url}", url);
    return pattern.replace("{variant}", variant.name);
  }

  getVariantForBandwidth(bandwidth: BandwidthClassification): CDNVariant | undefined {
    switch (bandwidth) {
      case "low":
        return this.config.variants?.find((v) => v.name === "small");
      case "medium":
        return this.config.variants?.find((v) => v.name === "medium");
      case "high":
        return this.config.variants?.find((v) => v.name === "large");
      default:
        return this.config.variants?.find((v) => v.name === "medium");
    }
  }

  isAvailable(): boolean {
    return !!this.config.domain;
  }

  getVariants(): CDNVariant[] {
    return this.config.variants ?? [];
  }

  setDomain(domain: string): void {
    this.config.domain = domain;
  }

  setBandwidthAware(enabled: boolean): void {
    this.config.bandwidthAware = enabled;
  }
}

export class CloudinaryCDNAdapter implements CDNAdapter {
  readonly name = "cloudinary";
  private cloudName: string;

  constructor(cloudName: string) {
    this.cloudName = cloudName;
  }

  generateUrl(url: string, variant: CDNVariant): string {
    const _extractedId = this.extractPublicId(url);
    const transformations = this.buildTransformations(variant);
    return `https://res.cloudinary.com/${this.cloudName}/image/fetch/${transformations}/${encodeURIComponent(url)}`;
  }

  getVariantForBandwidth(bandwidth: BandwidthClassification): CDNVariant {
    switch (bandwidth) {
      case "low":
        return { name: "low", width: 320, quality: 60 };
      case "medium":
        return { name: "medium", width: 640, quality: 75 };
      case "high":
        return { name: "high", width: 1280, quality: 85 };
      default:
        return { name: "medium", width: 640, quality: 75 };
    }
  }

  isAvailable(): boolean {
    return !!this.cloudName;
  }

  private extractPublicId(url: string): string {
    try {
      const pathname = new URL(url).pathname;
      return pathname.replace(/^\/+/, "").replace(/\.[^.]+$/, "");
    } catch {
      return url;
    }
  }

  private buildTransformations(variant: CDNVariant): string {
    const parts: string[] = [];
    if (variant.width) parts.push(`w_${variant.width}`);
    if (variant.quality) parts.push(`q_${variant.quality}`);
    parts.push("f_auto");
    return parts.join(",");
  }
}

export class ImgixCDNAdapter implements CDNAdapter {
  readonly name = "imgix";
  private domain: string;

  constructor(domain: string, apiKey?: string) {
    this.domain = domain;
    this._apiKey = apiKey;
  }

  generateUrl(url: string, variant: CDNVariant): string {
    const params = new URLSearchParams();
    if (variant.width) params.set("w", variant.width.toString());
    if (variant.quality) params.set("q", variant.quality.toString());
    params.set("auto", "format,compress");
    params.set("fit", "crop");

    const baseUrl = `https://${this.domain}.imgix.net`;
    const path = this.extractPath(url);
    return `${baseUrl}${path}?${params.toString()}`;
  }

  getVariantForBandwidth(bandwidth: BandwidthClassification): CDNVariant {
    switch (bandwidth) {
      case "low":
        return { name: "low", width: 320, quality: 50 };
      case "medium":
        return { name: "medium", width: 640, quality: 65 };
      case "high":
        return { name: "high", width: 1280, quality: 80 };
      default:
        return { name: "medium", width: 640, quality: 65 };
    }
  }

  isAvailable(): boolean {
    return !!this.domain;
  }

  private extractPath(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.pathname;
    } catch {
      return url;
    }
  }
}

export function createCDNAdapter(
  type: "default" | "cloudinary" | "imgix",
  config?: { domain?: string; cloudName?: string; apiKey?: string },
): CDNAdapter {
  switch (type) {
    case "cloudinary":
      return new CloudinaryCDNAdapter(config?.cloudName ?? "");
    case "imgix":
      return new ImgixCDNAdapter(config?.domain ?? "", config?.apiKey);
    default:
      return new DefaultCDNAdapter({ domain: config?.domain });
  }
}
