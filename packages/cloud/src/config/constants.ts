// ============================================
// TIME CONSTANTS (in milliseconds)
// ============================================

export const Time = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  
  REQUEST_TIMEOUT: 10 * 1000,           // 10 seconds
  CIRCUIT_BREAKER_RESET: 30 * 1000,     // 30 seconds
  CHECK_INTERVAL: 5 * 1000,             // 5 seconds
  SAMPLE_WINDOW: 60 * 1000,              // 60 seconds
  MEMORY_CHECK_INTERVAL: 5 * 1000,        // 5 seconds
  SILENT_UPGRADE_INTERVAL: 30 * 1000,     // 30 seconds
  PREFETCH_COMPLETED_THRESHOLD: 60 * 1000, // 60 seconds

  // TTL defaults
  DEFAULT_TTL: 7 * 24 * 60 * 60 * 1000,  // 7 days
} as const;

// ============================================
// SIZE CONSTANTS (in bytes)
// ============================================

export const Size = {
  KB: 1024,
  MB: 1024 * 1024,
  GB: 1024 * 1024 * 1024,

  // Cache defaults
  DEFAULT_MAX_SIZE: 100 * 1024 * 1024,   // 100MB
  DEFAULT_MEMORY_TIER: 20 * 1024 * 1024, // 20MB
  
  // Image validation
  MAX_IMAGE_SIZE_DESKTOP: 50 * 1024 * 1024,   // 50MB
  MAX_IMAGE_SIZE_MOBILE: 40 * 1024 * 1024,     // 40MB
  MAX_IMAGE_SIZE_TV: 30 * 1024 * 1024,         // 30MB
  
  // Memory adapter default
  MEMORY_ADAPTER_DEFAULT: 20 * 1024 * 1024,   // 20MB
} as const;

// ============================================
// THRESHOLD CONSTANTS
// ============================================

export const Threshold = {
  // Cache eviction
  CACHE_EVICTION_TRIGGER: 0.9,      // 90%
  CACHE_EVICTION_TARGET: 0.8,       // 80%
  CACHE_EVICTION_BATCH: 0.2,         // 20%
  
  // Memory monitor
  MEMORY_HIGH: 0.75,                // 75%
  MEMORY_CRITICAL: 0.90,            // 90%
  
  // Circuit breaker
  CB_FAILURE_THRESHOLD: 3,
  CB_SUCCESS_THRESHOLD: 2,
  CB_HALF_OPEN_MAX_CALLS: 3,
  
  // Bandwidth classification
  BANDWIDTH_LOW_THRESHOLD: 1,       // Mbps
  BANDWIDTH_MEDIUM_THRESHOLD: 5,    // Mbps
  
  // Performance
  MAX_PERFORMANCE_SAMPLES: 1000,
} as const;

// ============================================
// IMAGE SIZE CONSTANTS
// ============================================

export const ImageSize = {
  // CDN variants
  CDN_SMALL: { name: 'small', width: 320, quality: 70 },
  CDN_MEDIUM: { name: 'medium', width: 640, quality: 75 },
  CDN_LARGE: { name: 'large', width: 1280, quality: 85 },
  CDN_HIGH: { name: 'high', width: 1280, quality: 80 },
} as const;

// ============================================
// CACHE CONFIGURATION
// ============================================

export const DEFAULT_CACHE_CONFIG = {
  maxSize: Size.DEFAULT_MAX_SIZE,
  defaultTTL: Time.DEFAULT_TTL,
  memoryTierSize: Size.DEFAULT_MEMORY_TIER,
  debug: false,
  maxRetries: 3,
  requestTimeout: Time.REQUEST_TIMEOUT,
} as const;