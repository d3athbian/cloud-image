import { z } from "zod";

export const CircuitBreakerStateSchema = z.enum(["closed", "open", "half-open"]);

export type CircuitBreakerState = z.infer<typeof CircuitBreakerStateSchema>;

export const CircuitBreakerConfigSchema = z.object({
  failureThreshold: z.number().positive().int().optional(),
  successThreshold: z.number().positive().int().optional(),
  resetTimeout: z.number().positive().optional(),
  halfOpenMaxCalls: z.number().positive().int().optional(),
});

export type CircuitBreakerConfig = z.infer<typeof CircuitBreakerConfigSchema>;
