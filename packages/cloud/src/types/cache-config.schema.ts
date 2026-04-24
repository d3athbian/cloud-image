import { z } from "zod";

export const PlatformTypeSchema = z.enum(["web", "tizen", "webos", "memory"]);

export const CacheConfigSchema = z.object({
  maxSize: z.number().positive(),
  defaultTTL: z.number().positive(),
  memoryTierSize: z.number().positive(),
  platformOverride: PlatformTypeSchema.optional(),
  debug: z.boolean().optional(),
  maxRetries: z.number().int().min(0).max(10).optional(),
  requestTimeout: z.number().positive().optional(),
});

export type CacheConfig = z.infer<typeof CacheConfigSchema>;
export type PlatformType = z.infer<typeof PlatformTypeSchema>;
