import { z } from 'zod';

const baseSchema = z.object({
  cacheMaxSize: z.number().positive(),
  cacheDefaultTTL: z.number().positive(),
  cacheMemoryTierSize: z.number().positive(),
  requestTimeout: z.number().positive(),
  maxRetries: z.number().int().min(0).max(10),
  enableLogging: z.boolean(),
  enableDevtools: z.boolean(),
  enablePrefetch: z.boolean(),
  bandwidthTestUrl: z.string().url().default('https://picsum.photos/100/100'),
  offlineStrategy: z.enum(['default', 'aggressive']),
  circuitBreakerFailureThreshold: z.number().positive().int(),
  circuitBreakerResetTimeout: z.number().positive(),
  bandwidthTestSize: z.number().positive(),
  bandwidthLowThreshold: z.number().positive(),
  bandwidthMediumThreshold: z.number().positive(),
});

export const CoreServiceOptionsSchema = baseSchema;

export type CoreServiceOptions = z.infer<typeof baseSchema>;

export type PartialCoreServiceOptions = z.input<typeof baseSchema.partial>;
