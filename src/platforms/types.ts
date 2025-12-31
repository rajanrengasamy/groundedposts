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
 *
 * - linkedin: Professional long-form posts
 * - threads: Casual short-form (Meta)
 * - twitter: Punchy tweets/threads
 * - bluesky: Conversational short-form
 * - substack: Newsletter articles (long-form)
 * - substack-notes: Short-form social posts on Substack
 */
export type Platform = 'linkedin' | 'threads' | 'twitter' | 'bluesky' | 'substack' | 'substack-notes';

/**
 * All supported platforms for iteration
 */
export const PLATFORMS: readonly Platform[] = [
  'linkedin',
  'threads',
  'twitter',
  'bluesky',
  'substack',
  'substack-notes',
] as const;

/**
 * Platform categories for grouping
 */
export type PlatformCategory = 'social-short' | 'social-long' | 'newsletter';

/**
 * Map platforms to their categories
 */
export const PLATFORM_CATEGORIES: Record<Platform, PlatformCategory> = {
  linkedin: 'social-long',
  threads: 'social-short',
  twitter: 'social-short',
  bluesky: 'social-short',
  substack: 'newsletter',
  'substack-notes': 'social-short',
};

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
// Threading Configuration
// ============================================

/**
 * How posts in a thread are connected on the platform
 */
export type ThreadConnectionType = 'series' | 'reply-chain' | 'quote' | 'carousel';

/**
 * Threading/multi-post configuration for each platform
 */
export interface ThreadingConfig {
  /** Whether platform supports connected posts */
  supportsThreading: boolean;
  /** Maximum posts in a thread */
  maxThreadLength: number;
  /** How posts are connected */
  connectionType: ThreadConnectionType;
  /** Numbering format: "1/3", "Part 1:", "[1]", none */
  numberingFormat?: string;
  /** Whether each post should tease the next */
  requiresTeaser: boolean;
  /** Optimal thread length for engagement */
  optimalLength: { min: number; max: number };
  /** System prompt additions for thread generation */
  threadPromptAdditions: string;
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

  // Threading
  /** Multi-post/thread configuration */
  threading: ThreadingConfig;

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
