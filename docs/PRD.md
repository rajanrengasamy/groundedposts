# GroundedPosts - Product Requirements Document

## Overview

GroundedPosts is a multi-platform content generation CLI that transforms verified research into platform-optimized social media posts. Built on a foundation of source attribution and fact verification, it generates content for LinkedIn, Meta Threads, Twitter/X, Bluesky, and other platforms.

## Vision

**One pipeline, any platform.** Users provide a topic and target platform; the system:
1. Collects and verifies sources
2. Extracts grounded claims with provenance
3. Synthesizes platform-appropriate content
4. Maintains full attribution chain

## Core Architecture

### Platform Abstraction Layer

```
src/platforms/
├── types.ts          # Platform interface and shared types
├── index.ts          # Platform registry and selector
├── linkedin.ts       # LinkedIn-specific config
├── threads.ts        # Meta Threads config
├── twitter.ts        # Twitter/X config
└── bluesky.ts        # Bluesky config
```

### Platform Configuration Interface

```typescript
interface PlatformConfig {
  // Identity
  name: Platform;                    // 'linkedin' | 'threads' | 'twitter' | 'bluesky'
  displayName: string;               // 'LinkedIn' | 'Meta Threads' | etc.

  // Content Constraints
  maxLength: number;                 // Character limit (3000, 500, 280, 300)
  hashtagPolicy: HashtagPolicy;      // { required: boolean, min?: number, max?: number }
  mentionSupport: boolean;           // @ mentions supported
  linkHandling: 'inline' | 'card';   // How links are rendered

  // Format Features
  formatting: {
    supportsHeaders: boolean;        // ### markdown headers
    supportsBold: boolean;           // **bold** text
    supportsItalic: boolean;         // *italic* text
    supportsLists: boolean;          // Numbered/bulleted lists
    supportsLineBreaks: boolean;     // Multiple paragraphs
    supportsEmoji: boolean;          // Emoji usage
  };

  // Tone & Style
  tone: ToneProfile;                 // 'professional' | 'casual' | 'conversational'
  voiceGuidelines: string;           // Platform-specific writing guidance

  // Output Schema
  outputSchema: ZodSchema;           // Platform-specific output validation
}
```

### Platform Comparison Matrix

| Platform | Max Length | Hashtags | Tone | Format | Key Differentiator |
|----------|-----------|----------|------|--------|-------------------|
| LinkedIn | 3000 | 3-5 required | Professional | Rich (headers, bold, lists) | Long-form thought leadership |
| Threads | 500 | Optional | Casual | Plain text | Quick takes, reactions |
| Twitter/X | 280 | 1-2 optional | Punchy | Plain text | Hooks, threads |
| Bluesky | 300 | Optional | Conversational | Plain text | Community-focused |

## Pipeline Architecture

### Stage 1: Source Collection (Platform-Agnostic)
- Web search via Perplexity/Tavily
- Social media extraction (Twitter handles, LinkedIn topics)
- RSS/API feeds
- **Output**: Raw source items with URLs

### Stage 2: Claim Extraction (Platform-Agnostic)
- Extract quotes, statistics, insights
- Assign verification levels
- Create grounded claims with provenance
- **Output**: GroundedClaim[]

### Stage 3: Platform Synthesis (Platform-Specific)
- Load platform configuration
- Apply platform-specific system prompt
- Generate content within constraints
- Validate output against platform schema
- **Output**: PlatformPost

### Stage 4: Output Generation
- Write JSON with full provenance
- Generate infographic brief
- Track costs per platform
- **Output**: SynthesisResult with platform metadata

## Platform-Specific Requirements

### LinkedIn
- **Tone**: Professional thought leadership
- **Structure**: Hook → Insight → Evidence → Takeaway → CTA
- **Format**: Use ### headers, **bold**, numbered lists
- **Length**: Target 1500-2500 chars, max 3000
- **Citations**: Inline [1] references with Sources section
- **Hashtags**: 3-5 at end

### Meta Threads
- **Tone**: Casual, conversational, authentic
- **Structure**: Hot take → Context → Reaction
- **Format**: Plain text, short paragraphs
- **Length**: Target 300-400 chars, max 500
- **Citations**: Link at end or "via @handle"
- **Hashtags**: 0-2 optional

### Twitter/X
- **Tone**: Punchy, hook-focused
- **Structure**: Hook → Key insight (single tweet or thread)
- **Format**: Plain text, emoji optional
- **Length**: 280 chars per tweet
- **Citations**: Link or "h/t @handle"
- **Hashtags**: 1-2 max

### Bluesky
- **Tone**: Conversational, community-focused
- **Structure**: Thought → Context → Engagement question
- **Format**: Plain text
- **Length**: 300 chars
- **Citations**: Link at end
- **Hashtags**: Optional

## CLI Interface

```bash
# Basic usage
groundedposts "AI trends in 2025" --platform linkedin

# Multiple platforms
groundedposts "AI trends in 2025" --platform linkedin,threads

# Platform-specific options
groundedposts "AI trends" --platform threads --tone casual --no-hashtags

# All platforms
groundedposts "AI trends" --platform all
```

### CLI Options

| Flag | Description | Default |
|------|-------------|---------|
| `--platform, -p` | Target platform(s) | linkedin |
| `--model, -m` | Synthesis model | gpt |
| `--tone` | Override platform tone | (platform default) |
| `--post-count` | Number of variations | 1 |
| `--verbose, -v` | Verbose logging | false |

## Schema Evolution

### Current: LinkedInPost
```typescript
interface SynthesisResult {
  linkedinPost: string;
  keyQuotes: KeyQuote[];
  infographicBrief: InfographicBrief;
  // ...
}
```

### New: PlatformPost
```typescript
interface SynthesisResult {
  platform: Platform;
  post: string;                      // Platform-optimized content
  keyQuotes: KeyQuote[];
  infographicBrief?: InfographicBrief;  // Optional per platform
  platformMetadata: PlatformMetadata;    // Platform-specific extras
  // ...
}

interface PlatformMetadata {
  characterCount: number;
  hashtagCount: number;
  mentionCount: number;
  linkCount: number;
  estimatedReadTime?: number;        // For long-form
  threadParts?: number;              // For Twitter threads
}
```

## Implementation Phases

### Phase 1: Platform Abstraction (Foundation)
- [ ] Create `src/platforms/` directory structure
- [ ] Define `PlatformConfig` interface
- [ ] Implement LinkedIn platform config (extract from current code)
- [ ] Create platform registry and selector
- [ ] Update synthesis to accept platform parameter
- [ ] Rename `linkedinPost` → `post` in schemas

### Phase 2: Threads Support
- [ ] Create Threads platform config
- [ ] Write Threads-specific system prompt
- [ ] Implement Threads output schema
- [ ] Add Threads tone guidelines
- [ ] Test with sample prompts

### Phase 3: Twitter/X Support
- [ ] Create Twitter platform config
- [ ] Implement thread generation (multi-tweet)
- [ ] Add character counting with t.co link handling
- [ ] Test single tweet and thread modes

### Phase 4: CLI Updates
- [ ] Add `--platform` flag
- [ ] Support comma-separated platforms
- [ ] Add platform-specific output files
- [ ] Update help text and examples

### Phase 5: Polish
- [ ] Add Bluesky support
- [ ] Implement `--platform all` mode
- [ ] Add platform comparison in output
- [ ] Performance optimization for multi-platform

## Success Metrics

- [ ] Same prompt generates appropriate content for each platform
- [ ] All platform constraints validated (length, hashtags, format)
- [ ] Source attribution maintained across all platforms
- [ ] Type safety with platform-specific schemas
- [ ] <10% code duplication between platforms

## Non-Goals (v1)

- API posting (just generate content)
- Scheduling/queue management
- Analytics integration
- Image/media generation per platform
- Platform API authentication

## Technical Debt to Address

From linkedinquotes migration:
- [ ] Remove LinkedIn-specific naming throughout codebase
- [ ] Generalize `LINKEDIN_POST_MAX_LENGTH` → platform config
- [ ] Refactor prompts.ts to be platform-agnostic
- [ ] Update tests for multi-platform
