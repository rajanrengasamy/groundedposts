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

| Platform | Max Length | Hashtags | Tone | Format | Multi-Post | Key Differentiator |
|----------|-----------|----------|------|--------|------------|-------------------|
| LinkedIn | 3000 | 3-5 required | Professional | Rich (headers, bold, lists) | Series (Part 1/3) | Long-form thought leadership |
| Threads | 500 | Optional | Casual | Plain text | Connected posts | Quick takes, reactions |
| Twitter/X | 280 | 1-2 optional | Punchy | Plain text | Tweet threads (1/n) | Hooks, viral threads |
| Bluesky | 300 | Optional | Conversational | Plain text | Quote threads | Community-focused |
| Substack | 15000 | None | Conversational | Rich (full markdown) | Newsletter series | Email-first long-form |
| Substack Notes | 1000 | 0-3 optional | Conversational | Limited formatting | Reply chains | Social layer for newsletters |

### Platform Categories

| Category | Platforms | Characteristics |
|----------|-----------|-----------------|
| **Social Short** | Threads, Twitter, Bluesky, Substack Notes | Quick takes, high frequency, feed-based |
| **Social Long** | LinkedIn | Thought leadership, lower frequency, professional |
| **Newsletter** | Substack | Email delivery, subscriber relationship, deepest content |

## Multi-Post / Threading Support

All platforms support connected multi-post content, but with different mechanics and optimal use cases.

### Threading Configuration

```typescript
interface ThreadingConfig {
  /** Whether platform supports connected posts */
  supportsThreading: boolean;
  /** Maximum posts in a thread */
  maxThreadLength: number;
  /** How posts are connected */
  connectionType: 'series' | 'reply-chain' | 'quote' | 'carousel';
  /** Numbering format: "1/3", "Part 1:", "[1]", none */
  numberingFormat?: string;
  /** Whether each post should tease the next */
  requiresTeaser: boolean;
  /** Optimal thread length for engagement */
  optimalLength: { min: number; max: number };
}
```

### Platform Threading Specs

#### LinkedIn Series
- **Type**: Numbered series with explicit "Part X/Y" titles
- **Max Length**: 10 posts per series
- **Optimal**: 3-5 posts
- **Format**: Each post starts with "Part X/Y: [Title]"
- **Connection**: Each post (except last) ends with teaser for next
- **Use Case**: Deep dives, frameworks, comprehensive guides

```
Part 1/3: The Hidden Cost of Technical Debt

[Content...]

Coming up in Part 2: How to quantify and prioritize...

#TechnicalDebt #Engineering
```

#### Threads Connected Posts
- **Type**: Reply-chain carousel
- **Max Length**: 10 connected posts
- **Optimal**: 2-4 posts
- **Format**: First post is standalone, replies add depth
- **Connection**: Natural conversation flow, no explicit numbering needed
- **Use Case**: Unfolding takes, story threads, reaction chains

```
Post 1: Hot take: The "10x engineer" myth is holding teams back.

Post 2: Here's what I mean → [continues the thought]

Post 3: The real 10x impact? [concludes]
```

#### Twitter/X Threads
- **Type**: Reply threads with numbering
- **Max Length**: 25 tweets (soft limit for engagement)
- **Optimal**: 5-10 tweets
- **Format**: "1/" or "🧵" in first tweet, numbers optional after
- **Connection**: Each tweet can stand somewhat alone
- **Use Case**: Viral breakdowns, explanations, story threads

```
1/ Just analyzed 1000 AI startups. Here's what separates the winners:

2/ Pattern #1: They all started with a specific use case, not "AI for everything"

...

10/ TL;DR: [summary]

If this was useful, RT the first tweet 👇
```

#### Bluesky Threads
- **Type**: Quote-post chains or reply threads
- **Max Length**: No hard limit
- **Optimal**: 3-5 posts
- **Format**: More conversational, less formulaic
- **Connection**: Quote-posting own content or reply chain
- **Use Case**: Building on ideas, community discussions

#### Substack Newsletter Series
- **Type**: Multi-part email series
- **Max Length**: 10 parts
- **Optimal**: 3-5 parts
- **Format**: Each part is a full newsletter article
- **Connection**: "Part X:" prefix, recap of previous parts, teaser for next
- **Use Case**: Deep dives, comprehensive guides, courses

```
Part 1: Why Technical Debt Is Costing You More Than You Think

[Full newsletter content...]

Coming up in Part 2: How to measure and prioritize your debt...

---
If you found this valuable, share it with your team.
```

#### Substack Notes Threads
- **Type**: Reply-chain social posts
- **Max Length**: 10 notes
- **Optimal**: 2-4 notes
- **Format**: Casual, thinking-out-loud style
- **Connection**: Natural conversation flow
- **Use Case**: Quick insights, driving to newsletter, engagement

```
Note 1: Something I've noticed about AI adoption in enterprises...

Note 2: Here's what's actually happening →
[Evidence/examples]

Note 3: The implication nobody's talking about:
[Insight]

I wrote more about this in my latest post: [link]
```

### CLI Threading Options

```bash
# Single post (default)
groundedposts "AI trends" --platform linkedin

# Generate as series/thread
groundedposts "AI trends" --platform linkedin --thread --thread-count 3

# Variations mode (multiple standalone posts for A/B testing)
groundedposts "AI trends" --platform linkedin --variations 3

# Multi-platform with threading
groundedposts "AI trends" --platform linkedin,threads --thread
```

### Thread Generation Schema

```typescript
interface ThreadedPost {
  platform: Platform;
  threadId: string;                    // Unique ID for the thread
  posts: ThreadPart[];                 // Ordered array of posts
  totalParts: number;
  style: 'series' | 'variations';      // Connected vs standalone
}

interface ThreadPart {
  partNumber: number;
  totalParts: number;
  content: string;
  teaser?: string;                     // Preview of next post
  isFirst: boolean;
  isLast: boolean;
  keyQuotes: KeyQuote[];               // Quotes used in this part
  platformMetadata: PlatformMetadata;
}
```

### Thread Content Distribution

When generating threads, claims should be distributed across posts:

1. **Hook Post**: Best attention-grabbing claim/stat
2. **Evidence Posts**: Supporting claims, quotes, data
3. **Conclusion Post**: Synthesis, key takeaway, CTA

Each post should be valuable standalone but more powerful together.

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

### Substack Newsletter
- **Tone**: Conversational, personal, substantive
- **Structure**: Hook → Context → Insights → Evidence → Takeaways → Discussion
- **Format**: Full markdown (headers, bold, italic, lists, links)
- **Length**: Target 500-1500 words (~3000-9000 chars), max ~15000 chars
- **Subject Line**: Under 70 chars (Gmail shows 70, Yahoo shows 46)
- **Citations**: Inline hyperlinks to sources
- **Hashtags**: Not used
- **Images**: 2-3 inline images to break up content (see Image Generation)

### Substack Notes
- **Tone**: Casual, thinking-out-loud
- **Structure**: Observation → Evidence → Insight → Engagement
- **Format**: Limited formatting (bold, italic, lists, links)
- **Length**: Target 200-600 chars, max 1000 chars
- **Citations**: Link at end or inline
- **Hashtags**: 0-3 optional for discoverability

## Newsletter Image Generation

For newsletter platforms (Substack), visual content is critical for engagement and readability.

### Image Requirements

| Platform | Min Images | Recommended | Purpose |
|----------|-----------|-------------|---------|
| Substack | 2 | 2-4 | Break up text, illustrate concepts |
| LinkedIn | 0 | 1 | Infographic brief |
| Threads/Twitter | 0 | 0-1 | Optional visual |

### NanoBanana Pro Integration

For newsletters, the synthesis stage should generate:

1. **Header Image**: Visual hook at top of newsletter
   - Style: Bold, attention-grabbing
   - Content: Key statistic or quote visualization
   - Size: 1200x630 (email-optimized)

2. **Section Break Images** (1-2):
   - Style: Minimal, informative
   - Content: Data visualization, concept diagram, or quote card
   - Placed after every 3-4 paragraphs

3. **Takeaway Image** (optional):
   - Style: Summary/checklist format
   - Content: Key points or action items
   - Placed near end of newsletter

### Image Brief Schema

```typescript
interface NewsletterImageBrief {
  images: {
    type: 'header' | 'section-break' | 'takeaway';
    title: string;                    // Max 8 words
    content: string;                  // What to visualize
    suggestedStyle: 'data-viz' | 'quote-card' | 'diagram' | 'minimal';
    accentColor: AccentColor;
    placementHint: string;            // "After paragraph about X"
  }[];
}
```

### Image Generation Prompt Additions

For Substack synthesis, add to system prompt:
```
NEWSLETTER IMAGES:
Generate 2-3 image briefs to break up the newsletter content:

1. HEADER IMAGE: Visual hook summarizing the key insight
2. SECTION BREAK: Data visualization or quote card after major section
3. TAKEAWAY (optional): Summary of key points

Each image brief should include:
- type: header/section-break/takeaway
- title: Punchy title (max 8 words)
- content: What to visualize
- suggestedStyle: data-viz, quote-card, diagram, or minimal
- accentColor: Match newsletter mood
- placementHint: Where in the newsletter this should appear
```

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

## Vector Database & RAG Architecture

### Overview

To optimize context management and enable intelligent content inspiration, GroundedPosts implements dual vector database systems for:

1. **Session Context Management**: RAG-based retrieval of project knowledge (PRD, journals, todos)
2. **Output Repository**: Storage and retrieval of user-approved content for inspiration

### Vector DB #1: Context Management (RAG)

#### Problem Statement

Large projects with extensive documentation (PRD, journals, todo lists) consume significant context window capacity when starting new sessions. Loading full markdown files is inefficient and limits the working context available for actual task execution.

#### Solution

Implement a vector database to store and retrieve project documentation chunks using RAG (Retrieval Augmented Generation):

```
src/rag/
├── context-db/
│   ├── embeddings.ts       # Embedding generation
│   ├── store.ts            # Vector storage (Pinecone/Chroma/Qdrant)
│   ├── retrieval.ts        # Semantic search & retrieval
│   └── indexing.ts         # Document chunking & indexing
├── sources/
│   ├── prd-indexer.ts      # Index PRD.md
│   ├── journal-indexer.ts  # Index journal entries
│   └── todo-indexer.ts     # Index TODO.md
└── session-loader.ts       # Session initialization with RAG
```

#### Document Indexing Strategy

**PRD Indexing:**
- Chunk by major sections (## headers)
- Sub-chunk by subsections (### headers)
- Metadata: `{ type: 'prd', section: string, last_updated: Date }`
- Re-index on PRD updates

**Journal Indexing:**
- Chunk by journal entry (typically by date)
- Metadata: `{ type: 'journal', date: Date, topics: string[] }`
- Incremental indexing for new entries

**TODO Indexing:**
- Chunk by phase/section
- Metadata: `{ type: 'todo', phase: string, status: 'pending'|'in-progress'|'completed' }`
- Re-index on TODO updates

#### Retrieval Strategy

**Session Initialization:**
```typescript
interface SessionContext {
  query: string;                    // User's initial prompt
  retrievedDocs: RetrievedDoc[];    // Top-k relevant chunks
  contextWindow: number;            // Available context budget
}

interface RetrievedDoc {
  content: string;
  source: 'prd' | 'journal' | 'todo';
  section: string;
  relevanceScore: number;
  metadata: Record<string, any>;
}
```

**Retrieval Process:**
1. User provides initial prompt/task
2. Generate embedding for user query
3. Retrieve top-k most relevant chunks (k=5-10)
4. Rank by relevance score
5. Inject into session context instead of full markdown files
6. Reserve context window for task execution

#### CLI Integration

```bash
# Start session with RAG context
groundedposts "AI trends" --with-context

# Start session without RAG (load full files)
groundedposts "AI trends" --no-rag

# Re-index project knowledge
groundedposts --reindex-context
```

#### Vector DB Options

| Database | Pros | Cons | Use Case |
|----------|------|------|----------|
| **Pinecone** | Managed, fast, scalable | Paid service | Production |
| **Chroma** | Open source, local-first | Self-hosted | Development |
| **Qdrant** | Fast, rich filtering | Setup complexity | Advanced use |
| **Simple JSON** | Zero dependencies | No semantic search | Fallback |

**Recommended**: Start with **Chroma** for local development, migrate to **Pinecone** for production.

#### Schema

```typescript
interface ContextChunk {
  id: string;                       // Unique chunk ID
  content: string;                  // Chunk text
  embedding: number[];              // Vector embedding
  source: 'prd' | 'journal' | 'todo';
  metadata: {
    section?: string;               // Section/header name
    date?: Date;                    // For journals
    phase?: string;                 // For TODOs
    tags?: string[];                // Optional tags
    lastUpdated: Date;
  };
}
```

---

### Vector DB #2: Output Storage & Inspiration

#### Problem Statement

Users generate multiple content variations across sessions, but have no way to:
- Store outputs they like for future reference
- Retrieve past successful posts for inspiration
- Learn from previous high-quality generations

#### Solution

Implement a vector database to store user-approved outputs with feedback loop:

```
src/rag/
├── output-db/
│   ├── store.ts              # Vector storage for outputs
│   ├── feedback.ts           # Feedback collection system
│   ├── retrieval.ts          # Inspiration retrieval
│   └── schema.ts             # Output metadata schema
├── feedback-ui/
│   ├── review-prompt.ts      # Post-generation review
│   └── rating-capture.ts     # Capture user feedback
└── inspiration.ts            # Inspiration mode handler
```

#### Post-Generation Workflow

**After content generation:**

```
┌─────────────────────────────────────────────┐
│  Content Generated                          │
│  - LinkedIn post (3 variations)             │
│  - Threads post (2 variations)              │
│  - Twitter thread (5 tweets)                │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  Review Prompt                              │
│                                             │
│  "Review your generated content:"           │
│  1. LinkedIn - Variation 1                  │
│  2. LinkedIn - Variation 2                  │
│  ...                                        │
│                                             │
│  Mark favorites to save for inspiration:    │
│  > Select: 1, 3, 5                          │
│  > Rate (1-5): 5, 4, 5                      │
│  > Tags: AI, trends, analysis               │
│  > Save? (y/n): y                           │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  Vector DB Storage                          │
│  - Store approved outputs with embeddings   │
│  - Store metadata (platform, rating, tags)  │
│  - Store grounded claims used               │
└─────────────────────────────────────────────┘
```

#### Output Storage Schema

```typescript
interface StoredOutput {
  id: string;
  content: string;                  // The actual post content
  embedding: number[];              // Vector embedding

  // Generation context
  platform: Platform;
  prompt: string;                   // Original user prompt
  groundedClaims: GroundedClaim[];  // Claims used
  generatedAt: Date;

  // User feedback
  rating: 1 | 2 | 3 | 4 | 5;        // User rating
  tags: string[];                   // User-provided tags
  notes?: string;                   // Optional user notes

  // Performance metadata
  engagement?: {                    // Optional: if user tracks results
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
  };

  // Synthesis metadata
  synthesisModel: 'gpt' | 'claude' | 'gemini' | 'kimi';
  costUSD: number;
  keyQuotes: KeyQuote[];
}
```

#### Inspiration Mode

**CLI Usage:**
```bash
# Start inspiration mode
groundedposts --inspiration

# Inspiration with filters
groundedposts --inspiration --platform linkedin --tags "AI,trends"

# Show top-rated posts
groundedposts --inspiration --min-rating 4

# Inspire from specific time range
groundedposts --inspiration --since "2024-01-01"
```

**Inspiration Workflow:**

```typescript
interface InspirationRequest {
  platform?: Platform;              // Filter by platform
  tags?: string[];                  // Filter by tags
  minRating?: number;               // Minimum rating
  since?: Date;                     // Date range
  limit?: number;                   // Number of results (default: 10)
}

interface InspirationResult {
  posts: StoredOutput[];            // Retrieved posts
  commonThemes: string[];           // Extracted themes
  topPerformers: StoredOutput[];    // Highest rated
  suggestions: string[];            // Content suggestions based on history
}
```

**Retrieval Process:**
1. User runs `groundedposts --inspiration [filters]`
2. System retrieves top-k liked posts (by rating + recency)
3. Optionally: User provides a theme/topic for semantic search
4. Display posts with metadata
5. Extract common patterns:
   - Frequent tags
   - Common themes
   - Successful structures
6. Offer to generate new content inspired by past successes

#### Interactive Review UI

**Terminal UI for feedback collection:**

```
╔══════════════════════════════════════════════════════════╗
║  Generation Complete: 5 posts created                    ║
╚══════════════════════════════════════════════════════════╝

┌─ Post 1: LinkedIn ────────────────────────────────────┐
│ AI trends are reshaping how we work...                │
│ [Content preview - 500 chars]                          │
│                                                        │
│ ⭐ Rate (1-5): ___                                     │
│ 🏷️  Tags: _________                                    │
│ 💾 Save? (y/n): ___                                    │
└────────────────────────────────────────────────────────┘

[Arrow keys to navigate, Enter to review full post, S to skip all]
```

#### CLI Flags

```bash
# Auto-save all outputs (skip review)
groundedposts "AI trends" --auto-save

# Skip save prompt (don't store any outputs)
groundedposts "AI trends" --no-save

# Save with pre-filled rating/tags
groundedposts "AI trends" --save --rating 5 --tags "AI,trends"
```

#### Analytics & Learning

**Future enhancement**: Use stored outputs to improve generation:

```typescript
interface ContentPatternAnalysis {
  platform: Platform;
  topPatterns: {
    openingHooks: string[];         // Most successful opening lines
    structures: string[];           // Common structural patterns
    ctaFormats: string[];           // Effective CTAs
  };
  avgRatingByLength: Map<number, number>;
  topKeywords: string[];
}
```

**Learning feedback loop:**
- Analyze high-rated posts for patterns
- Adjust synthesis prompts based on successful structures
- Suggest tags based on topic similarity
- Recommend platforms based on past engagement

---

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

### Phase 6: Vector Database & RAG

#### 6.1 Context Management DB (RAG)
- [ ] Set up vector database infrastructure (Chroma for local dev)
- [ ] Create `src/rag/context-db/` directory structure
- [ ] Implement document chunking for PRD, journals, TODOs
- [ ] Build embedding generation service
- [ ] Create indexing pipeline for project documentation
- [ ] Implement semantic search retrieval
- [ ] Add `--with-context` CLI flag for RAG-enabled sessions
- [ ] Add `--reindex-context` CLI command
- [ ] Test context retrieval accuracy and relevance
- [ ] Optimize chunk size and overlap for best results

#### 6.2 Output Storage DB
- [ ] Create `src/rag/output-db/` directory structure
- [ ] Define `StoredOutput` schema with full metadata
- [ ] Implement vector storage for generated outputs
- [ ] Build feedback collection system (post-generation review)
- [ ] Create interactive terminal UI for rating/tagging outputs
- [ ] Implement `--auto-save`, `--no-save`, `--save --rating X` flags
- [ ] Test output storage and retrieval workflows

#### 6.3 Inspiration Mode
- [ ] Implement `--inspiration` CLI mode
- [ ] Build semantic search over stored outputs
- [ ] Add filtering by platform, tags, rating, date range
- [ ] Create inspiration display UI (show past posts)
- [ ] Implement pattern analysis (common themes, top hooks)
- [ ] Add content suggestions based on historical data
- [ ] Test inspiration retrieval and usefulness

#### 6.4 RAG Integration & Optimization
- [ ] Integrate RAG context into synthesis prompts
- [ ] Measure context window savings from RAG vs full files
- [ ] Add analytics for stored outputs (most common tags, avg ratings)
- [ ] Implement learning feedback loop (adjust prompts based on ratings)
- [ ] Document RAG setup and usage in README
- [ ] Add migration path from Chroma to Pinecone for production

## Success Metrics

### Platform Generation
- [ ] Same prompt generates appropriate content for each platform
- [ ] All platform constraints validated (length, hashtags, format)
- [ ] Source attribution maintained across all platforms
- [ ] Type safety with platform-specific schemas
- [ ] <10% code duplication between platforms

### Vector DB & RAG
- [ ] Context retrieval reduces session context usage by >60%
- [ ] RAG retrieval accuracy >80% (relevant chunks for query)
- [ ] Session initialization with RAG completes in <2 seconds
- [ ] User feedback collection rate >70% (users review/save outputs)
- [ ] Inspiration mode retrieves 10+ relevant past posts in <1 second
- [ ] Pattern analysis identifies actionable content insights
- [ ] Vector DB scales to 1000+ stored outputs without degradation

## Non-Goals (v1)

### Core Platform
- API posting (just generate content)
- Scheduling/queue management
- Analytics integration
- Image/media generation per platform
- Platform API authentication

### Vector DB & RAG
- Real-time collaboration on stored outputs
- Multi-user vector database sharing
- Automatic engagement tracking from social platforms
- AI-powered auto-rating of generated content
- Cloud-synced vector database (local-first only in v1)
- Natural language querying of inspiration database ("show me posts about AI")

## Technical Debt to Address

From linkedinquotes migration:
- [ ] Remove LinkedIn-specific naming throughout codebase
- [ ] Generalize `LINKEDIN_POST_MAX_LENGTH` → platform config
- [ ] Refactor prompts.ts to be platform-agnostic
- [ ] Update tests for multi-platform
