/**
 * Platform Registry
 *
 * Central registry for all platform configurations.
 * Use getPlatformConfig() to retrieve platform-specific settings.
 */

export * from './types.js';

import type { Platform, PlatformConfig } from './types.js';
import { linkedinConfig } from './linkedin.js';
import { threadsConfig } from './threads.js';
import { substackPostConfig, substackNotesConfig } from './substack.js';
// import { twitterConfig } from './twitter.js';
// import { blueskyConfig } from './bluesky.js';

// ============================================
// Platform Registry
// ============================================

/**
 * Registry of all platform configurations
 */
const platformRegistry: Map<Platform, PlatformConfig> = new Map([
  ['linkedin', linkedinConfig],
  ['threads', threadsConfig],
  ['substack', substackPostConfig],
  ['substack-notes', substackNotesConfig],
  // ['twitter', twitterConfig],    // TODO: Phase 3
  // ['bluesky', blueskyConfig],    // TODO: Phase 5
]);

// ============================================
// Registry Functions
// ============================================

/**
 * Get configuration for a specific platform.
 *
 * @param platform - Platform identifier
 * @returns Platform configuration
 * @throws Error if platform is not supported
 *
 * @example
 * ```typescript
 * const config = getPlatformConfig('linkedin');
 * console.log(config.maxLength); // 3000
 * ```
 */
export function getPlatformConfig(platform: Platform): PlatformConfig {
  const config = platformRegistry.get(platform);
  if (!config) {
    const supported = Array.from(platformRegistry.keys()).join(', ');
    throw new Error(
      `FATAL: Unsupported platform "${platform}". Supported: ${supported}`
    );
  }
  return config;
}

/**
 * Check if a platform is currently supported.
 *
 * @param platform - Platform identifier to check
 * @returns True if platform is supported
 */
export function isPlatformSupported(platform: string): platform is Platform {
  return platformRegistry.has(platform as Platform);
}

/**
 * Get list of all supported platforms.
 *
 * @returns Array of supported platform identifiers
 */
export function getSupportedPlatforms(): Platform[] {
  return Array.from(platformRegistry.keys());
}

/**
 * Validate post content against platform constraints.
 *
 * @param post - Post content to validate
 * @param platform - Target platform
 * @returns Validation result with errors and warnings
 *
 * @example
 * ```typescript
 * const result = validateForPlatform(myPost, 'linkedin');
 * if (!result.valid) {
 *   console.error('Validation failed:', result.errors);
 * }
 * ```
 */
export function validateForPlatform(
  post: string,
  platform: Platform
): { valid: boolean; errors: string[]; warnings: string[] } {
  const config = getPlatformConfig(platform);
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check length
  if (post.length > config.maxLength) {
    errors.push(
      `Post exceeds ${config.displayName} limit: ${post.length}/${config.maxLength} chars`
    );
  } else if (post.length < config.targetLength.min) {
    warnings.push(
      `Post is shorter than recommended for ${config.displayName}: ${post.length} chars (target: ${config.targetLength.min}-${config.targetLength.max})`
    );
  }

  // Check hashtags
  const hashtags = post.match(/#\w+/g) ?? [];
  if (config.hashtagPolicy.required && hashtags.length === 0) {
    errors.push(`${config.displayName} requires hashtags`);
  }
  if (config.hashtagPolicy.min && hashtags.length < config.hashtagPolicy.min) {
    warnings.push(
      `${config.displayName} recommends at least ${config.hashtagPolicy.min} hashtags (found: ${hashtags.length})`
    );
  }
  if (config.hashtagPolicy.max && hashtags.length > config.hashtagPolicy.max) {
    warnings.push(
      `${config.displayName} recommends max ${config.hashtagPolicy.max} hashtags (found: ${hashtags.length})`
    );
  }

  // Run platform-specific validation if defined
  if (config.validate) {
    const platformResult = config.validate(post);
    errors.push(...platformResult.errors);
    warnings.push(...platformResult.warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
