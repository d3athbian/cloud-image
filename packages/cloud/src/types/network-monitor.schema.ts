import { z } from "zod";

const BandwidthThresholdSchema = z.object({
  low: z.number().positive(),
  medium: z.number().positive(),
});

export const NetworkMonitorConfigSchema = z.object({
  sampleInterval: z.number().positive().optional(),
  bandwidthThreshold: BandwidthThresholdSchema.optional(),
  onStatusChange: z.function().optional(),
  onBandwidthChange: z.function().optional(),
  bandwidthTestUrl: z.string().url().optional(),
  bandwidthTestSize: z.number().positive().optional(),
});

export type NetworkMonitorConfig = z.infer<typeof NetworkMonitorConfigSchema>;

export const BandwidthClassificationSchema = z.enum(["low", "medium", "high", "unknown"]);

export type BandwidthClassification = z.infer<typeof BandwidthClassificationSchema>;

export const NetworkStatusSchema = z.object({
  online: z.boolean(),
  bandwidth: BandwidthClassificationSchema,
  mbps: z.number().optional(),
  rtt: z.number().optional(),
  bandwidthTested: z.boolean().optional(),
});

export type NetworkStatus = z.infer<typeof NetworkStatusSchema>;
