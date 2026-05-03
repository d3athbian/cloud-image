import {
  type CoreServiceOptions,
  CoreServiceOptionsSchema,
  type PartialCoreServiceOptions,
} from '../types/core-options.schema';
import { DEFAULT_SYSTEM_OPTIONS } from './defaults';

let currentOptions: CoreServiceOptions = { ...DEFAULT_SYSTEM_OPTIONS };

/**
 * getSystemSettings - Single Source of Truth for system configuration
 *
 * Returns the current system configuration, including any user-defined overrides
 * and environment variable values. This function is the only entry point for
 * reading configuration throughout the library.
 *
 * @returns Readonly<CoreServiceOptions> - Current configuration (frozen copy)
 *
 * @example
 * ```typescript
 * import { getSystemSettings } from '@cloudimage/cloud';
 *
 * const settings = getSystemSettings();
 * console.log(settings.cacheMaxSize); // 104857600 (100MB default)
 * ```
 */
export function getSystemSettings(): Readonly<CoreServiceOptions> {
  return Object.freeze({ ...currentOptions });
}

/**
 * setSystemSettings - Update system configuration
 *
 * Merges the provided partial options with the current configuration.
 * Validates all values before applying changes.
 *
 * @param options - Partial configuration options to merge
 * @throws Error if validation fails
 *
 * @example
 * ```typescript
 * import { setSystemSettings } from '@cloudimage/cloud';
 *
 * setSystemSettings({
 *   cacheMaxSize: 200 * 1024 * 1024,
 *   maxRetries: 5,
 * });
 * ```
 */
export function setSystemSettings(options: PartialCoreServiceOptions): void {
  const merged = Object.assign({}, currentOptions, options) as CoreServiceOptions;
  CoreServiceOptionsSchema.parse(merged);
  currentOptions = merged;
}

/**
 * resetSystemSettings - Reset configuration to defaults
 *
 * Resets all configuration values to their defaults as defined in DEFAULT_SYSTEM_OPTIONS.
 */
export function resetSystemSettings(): void {
  currentOptions = { ...DEFAULT_SYSTEM_OPTIONS };
}

/**
 * Read environment variable and return as appropriate type
 * Supports: string, number, boolean
 */
function getEnvVar(name: string, defaultValue: string): string {
  if (
    typeof globalThis !== 'undefined' &&
    (globalThis as { process?: { env?: Record<string, string> } }).process?.env
  ) {
    return (
      (globalThis as { process: { env: Record<string, string> } }).process.env[name] ?? defaultValue
    );
  }
  return defaultValue;
}

/**
 * Initialize settings from environment variables
 * Should be called at module load time
 */
export function initFromEnvironment(): void {
  const envOptions: Record<string, unknown> = {};

  const cacheMaxSize = getEnvVar('CLOUD_CACHE_SIZE', '');
  if (cacheMaxSize) {
    const parsed = parseInt(cacheMaxSize, 10);
    if (!Number.isNaN(parsed)) envOptions.cacheMaxSize = parsed;
  }

  const requestTimeout = getEnvVar('CLOUD_TIMEOUT_MS', '');
  if (requestTimeout) {
    const parsed = parseInt(requestTimeout, 10);
    if (!Number.isNaN(parsed)) envOptions.requestTimeout = parsed;
  }

  const maxRetries = getEnvVar('CLOUD_MAX_RETRIES', '');
  if (maxRetries) {
    const parsed = parseInt(maxRetries, 10);
    if (!Number.isNaN(parsed)) envOptions.maxRetries = parsed;
  }

  const enableLogging = getEnvVar('CLOUD_LOGGING', '');
  if (enableLogging) {
    envOptions.enableLogging = enableLogging.toLowerCase() === 'true';
  }

  const enableDevtools = getEnvVar('CLOUD_DEVTOOLS', '');
  if (enableDevtools) {
    envOptions.enableDevtools = enableDevtools.toLowerCase() === 'true';
  }

  if (Object.keys(envOptions).length > 0) {
    try {
      const merged = { ...currentOptions, ...envOptions };
      CoreServiceOptionsSchema.parse(merged);
      currentOptions = merged;
    } catch {
      // Silently ignore invalid env vars - use defaults
    }
  }
}

// Auto-initialize from environment on module load
initFromEnvironment();
