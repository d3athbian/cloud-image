import { CoreServiceOptionsSchema } from "../types/core-options.schema";
import { env } from "../utils/environment";
import { Size, Threshold, Time } from "./constants";

const isDev = env.isDevelopment();

/**
 * Default configuration values for CoreServiceOptions
 * These values are used when no configuration is explicitly set
 */
const defaultOptions = {
  cacheMaxSize: Size.DEFAULT_MAX_SIZE,
  cacheDefaultTTL: Time.DEFAULT_TTL,
  cacheMemoryTierSize: Size.DEFAULT_MEMORY_TIER,
  requestTimeout: Time.REQUEST_TIMEOUT,
  maxRetries: 3,
  enableLogging: isDev,
  enableDevtools: false,
  enablePrefetch: true,
  bandwidthTestUrl: "https://picsum.photos/100/100",
  offlineStrategy: "default" as const,
  circuitBreakerFailureThreshold: Threshold.CB_FAILURE_THRESHOLD,
  circuitBreakerResetTimeout: Time.CIRCUIT_BREAKER_RESET,
  bandwidthTestSize: 10000,
  bandwidthLowThreshold: Threshold.BANDWIDTH_LOW_THRESHOLD,
  bandwidthMediumThreshold: Threshold.BANDWIDTH_MEDIUM_THRESHOLD,
};

export const DEFAULT_SYSTEM_OPTIONS = defaultOptions;

/**
 * Validate configuration using Zod schema
 * @throws ZodError if validation fails
 */
function validateOptions(options: unknown): void {
  CoreServiceOptionsSchema.parse(options);
}

/**
 * Safe validate that returns boolean instead of throwing
 */
function isValidOptions(options: unknown): boolean {
  return CoreServiceOptionsSchema.safeParse(options).success;
}

export { isValidOptions, validateOptions };
