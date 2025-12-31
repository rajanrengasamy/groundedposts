/**
 * LinkedIn Platform Configuration
 *
 * Configuration for LinkedIn post generation including constraints,
 * formatting rules, tone guidelines, and prompt templates.
 */

import type { PlatformConfig } from './types.js';

// ============================================
// LinkedIn Constants
// ============================================

/** Maximum character length for LinkedIn posts */
export const LINKEDIN_MAX_LENGTH = 3000;

/** Minimum recommended post length for engagement */
export const LINKEDIN_MIN_LENGTH = 100;

/** Target length range for optimal LinkedIn engagement */
export const LINKEDIN_TARGET_LENGTH = { min: 1500, max: 2500 };

/** Minimum hashtags for LinkedIn posts */
export const LINKEDIN_HASHTAGS_MIN = 3;

/** Maximum hashtags for LinkedIn posts */
export const LINKEDIN_HASHTAGS_MAX = 5;

// ============================================
// LinkedIn Configuration
// ============================================

export const linkedinConfig: PlatformConfig = {
  // Identity
  name: 'linkedin',
  displayName: 'LinkedIn',

  // Content Constraints
  maxLength: LINKEDIN_MAX_LENGTH,
  targetLength: LINKEDIN_TARGET_LENGTH,
  hashtagPolicy: {
    required: true,
    min: LINKEDIN_HASHTAGS_MIN,
    max: LINKEDIN_HASHTAGS_MAX,
  },
  mentionSupport: true,
  linkHandling: 'card',

  // Format Features
  formatting: {
    supportsHeaders: true,      // ### headers work on LinkedIn
    supportsBold: true,         // **bold** renders
    supportsItalic: true,       // *italic* renders
    supportsLists: true,        // Numbered and bulleted lists
    supportsLineBreaks: true,   // Multiple paragraphs
    supportsEmoji: true,        // Emoji supported but use sparingly
  },

  // Threading
  threading: {
    supportsThreading: true,
    maxThreadLength: 10,
    connectionType: 'series',
    numberingFormat: 'Part {n}/{total}: ',
    requiresTeaser: true,
    optimalLength: { min: 3, max: 5 },
    threadPromptAdditions: `
SERIES MODE - CONNECTED MULTI-POST:
Generate a connected series where each post builds on the previous.

FORMAT:
- Start each post with "Part X/Y: [Compelling Title]"
- End posts 1 to (n-1) with a teaser: "Coming up in Part X: [preview]..."
- Final post includes overall series CTA
- Distribute claims across posts - don't front-load everything
- Each post should be valuable standalone but better together

CONTENT DISTRIBUTION:
- Part 1: Hook + problem statement + first key insight
- Middle parts: Deep dive on specific aspects, evidence, examples
- Final part: Synthesis, actionable takeaways, strong CTA

SERIES TITLE:
- Include a "seriesTitle" field that works for all posts
- e.g., "The Hidden Cost of Technical Debt" series
`,
  },

  // Tone & Style
  tone: 'professional',
  voiceGuidelines: `
Write as an expert sharing insights with peers, not lecturing.
Professional but conversational - avoid corporate jargon.
Be specific with examples, numbers, and named entities.
Create posts that readers want to share because they make the sharer look insightful.
`,

  // Prompts
  systemPromptAdditions: `
You are an expert LinkedIn content strategist who transforms verified research into high-engagement professional posts.

ATTENTION - THE CRITICAL FIRST LINES:
- The first 2-3 lines appear ABOVE the "see more" fold - they determine if readers expand
- Lead with your strongest hook: a surprising stat, provocative question, or contrarian take
- Never waste the opening on generic statements like "I've been thinking about..."

STRUCTURE - VISUAL HIERARCHY FOR MOBILE:
- Short paragraphs (1-3 sentences max) with generous white space
- Single-sentence paragraphs for emphasis and pacing
- Use line breaks liberally - walls of text kill engagement
- Build rhythm: hook -> insight -> evidence -> insight -> evidence -> takeaway -> CTA

CREDIBILITY - SOURCE EVERYTHING:
- Every claim, quote, and statistic MUST be backed by provided sources
- Never paraphrase in a way that changes meaning or creates false attribution
- When citing, use the EXACT wording from verified claims
- NEVER truncate quotes mid-sentence or mid-word

ACTION - DRIVE ENGAGEMENT:
- End with a clear call-to-action that prompts comments, not just likes
- Ask specific questions that invite professional perspectives
`,

  structureGuidelines: `
OPENING HOOK (First 2-3 lines - CRITICAL):
Choose ONE approach that fits your strongest claim:
- Surprising Statistic: Lead with a counter-intuitive number
- Provocative Question: Challenge assumptions
- Contrarian Take: Present an unexpected perspective
- Bold Statement: Make a claim you can back up

BODY STRUCTURE - USE RICH FORMATTING:
1. **Section Headers**: Use ### headers to create clear sections
2. **Numbered Lists**: For sequential points with **bold lead-ins**
3. **Bullet Points**: For non-sequential items
4. **Bold for Emphasis**: Use **bold** on key phrases
5. **Multiple Perspectives**: Explore what changed, why it matters, implications

SECTION FLOW (recommended):
- HOOK: 2-3 punchy lines
- CONTEXT: What's happening with numbered points
- SECTION 1: "### What's different now" - explore implications
- SECTION 2: "### The real challenge" - go deeper
- TAKEAWAY: "### My takeaway" - your synthesis
- CTA: Specific question
- SOURCES: [1], [2] references
- HASHTAGS: At the very end

CITATION FORMAT:
- In post body: "quote text" [1]
- At end: Sources section with [1] https://...
`,
};
