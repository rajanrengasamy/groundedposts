/**
 * Platform Abstraction Types
 *
 * Defines the interface for platform-specific configurations.
 * Each platform (LinkedIn, Threads, Twitter, etc.) implements this interface
 * to customize content generation for that platform's constraints and style.
 */

// ============================================
// Platform Identifiers
// ============================================

/**
 * Supported social media platforms.
 */
export type Platform = 'linkedin' | 'threads' | 'twitter' | 'bluesky';

/**
 * All supported platforms for iteration
 */
export const PLATFORMS: readonly Platform[] = [
  'linkedin',
  'threads',
  'twitter',
  'bluesky',
] as const;

// ============================================
// Tone & Style
// ============================================

/**
 * Tone profiles for different platforms
 */
export type ToneProfile = 'professional' | 'casual' | 'conversational' | 'punchy';

/**
 * Hashtag policy configuration
 */
export interface HashtagPolicy {
  /** Whether hashtags are required for this platform */
  required: boolean;
  /** Minimum hashtags (if required) */
  min?: number;
  /** Maximum hashtags */
  max?: number;
}

// ============================================
// Formatting Features
// ============================================

/**
 * Formatting capabilities supported by each platform
 */
export interface FormattingConfig {
  /** Supports ### markdown headers */
  supportsHeaders: boolean;
  /** Supports **bold** text */
  supportsBold: boolean;
  /** Supports *italic* text */
  supportsItalic: boolean;
  /** Supports numbered/bulleted lists */
  supportsLists: boolean;
  /** Supports multiple paragraphs with line breaks */
  supportsLineBreaks: boolean;
  /** Whether emoji usage is encouraged */
  supportsEmoji: boolean;
}

// ============================================
// Platform Configuration
// ============================================

/**
 * Complete platform configuration.
 *
 * Defines all platform-specific settings including constraints,
 * formatting rules, tone guidelines, and prompt templates.
 */
export interface PlatformConfig {
  // Identity
  /** Platform identifier */
  name: Platform;
  /** Human-readable platform name */
  displayName: string;

  // Content Constraints
  /** Maximum character count for posts */
  maxLength: number;
  /** Target length range for optimal engagement */
  targetLength: { min: number; max: number };
  /** Hashtag requirements */
  hashtagPolicy: HashtagPolicy;
  /** Whether @ mentions are supported */
  mentionSupport: boolean;
  /** How links are rendered: inline text or preview card */
  linkHandling: 'inline' | 'card';

  // Format Features
  /** Supported formatting options */
  formatting: FormattingConfig;

  // Tone & Style
  /** Primary tone for this platform */
  tone: ToneProfile;
  /** Platform-specific writing guidance (included in system prompt) */
  voiceGuidelines: string;

  // Prompts
  /** System prompt additions for this platform */
  systemPromptAdditions: string;
  /** Structure guidance for post organization */
  structureGuidelines: string;

  // Validation
  /** Platform-specific validation rules beyond schema */
  validate?: (post: string) => ValidationResult;
}

/**
 * Result of platform-specific validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================
// Output Types
// ============================================

/**
 * Metadata about the generated post specific to the platform
 */
export interface PlatformMetadata {
  /** Target platform */
  platform: Platform;
  /** Actual character count */
  characterCount: number;
  /** Number of hashtags used */
  hashtagCount: number;
  /** Number of @ mentions */
  mentionCount: number;
  /** Number of links included */
  linkCount: number;
  /** Estimated read time in seconds (for long-form) */
  estimatedReadTime?: number;
  /** Number of parts if this is a thread (Twitter) */
  threadParts?: number;
}

/**
 * Platform-optimized post content
 */
export interface PlatformPost {
  /** Generated post content */
  content: string;
  /** Platform this was generated for */
  platform: Platform;
  /** Platform-specific metadata */
  metadata: PlatformMetadata;
}

// ============================================
// Default Values
// ============================================

/**
 * Default formatting config (minimal - plain text only)
 */
export const DEFAULT_FORMATTING: FormattingConfig = {
  supportsHeaders: false,
  supportsBold: false,
  supportsItalic: false,
  supportsLists: false,
  supportsLineBreaks: true,
  supportsEmoji: true,
};

/**
 * Default hashtag policy (optional, max 5)
 */
export const DEFAULT_HASHTAG_POLICY: HashtagPolicy = {
  required: false,
  max: 5,
};
