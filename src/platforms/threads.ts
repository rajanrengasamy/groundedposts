/**
 * Meta Threads Platform Configuration
 *
 * Configuration for Threads post generation including constraints,
 * formatting rules, tone guidelines, and prompt templates.
 *
 * Threads is a text-based social platform by Meta, emphasizing
 * casual, conversational content with shorter posts than LinkedIn.
 */

import type { PlatformConfig } from './types.js';

// ============================================
// Threads Constants
// ============================================

/** Maximum character length for Threads posts */
export const THREADS_MAX_LENGTH = 500;

/** Minimum recommended post length */
export const THREADS_MIN_LENGTH = 50;

/** Target length range for optimal Threads engagement */
export const THREADS_TARGET_LENGTH = { min: 200, max: 400 };

// ============================================
// Threads Configuration
// ============================================

export const threadsConfig: PlatformConfig = {
  // Identity
  name: 'threads',
  displayName: 'Meta Threads',

  // Content Constraints
  maxLength: THREADS_MAX_LENGTH,
  targetLength: THREADS_TARGET_LENGTH,
  hashtagPolicy: {
    required: false,
    max: 2,
  },
  mentionSupport: true,
  linkHandling: 'inline',

  // Format Features - Plain text focused
  formatting: {
    supportsHeaders: false,     // No markdown headers
    supportsBold: false,        // No bold/italic
    supportsItalic: false,
    supportsLists: false,       // No formatted lists
    supportsLineBreaks: true,   // Paragraphs work
    supportsEmoji: true,        // Emoji encouraged
  },

  // Threading
  threading: {
    supportsThreading: true,
    maxThreadLength: 10,
    connectionType: 'reply-chain',
    numberingFormat: undefined,  // No explicit numbering on Threads
    requiresTeaser: false,
    optimalLength: { min: 2, max: 4 },
    threadPromptAdditions: `
CONNECTED POSTS MODE - THREADS CAROUSEL:
Generate a connected thread where each post naturally continues the conversation.

FORMAT:
- First post: Strong standalone hook/take
- Reply posts: Build on the thought, add evidence, expand
- No explicit numbering needed - natural conversation flow
- Use "→" or "Here's the thing:" type transitions
- Final post: Land the point with engagement question

THREADS STYLE:
- Each post should feel like a natural reply to yourself
- Think "unrolling a thought" not "delivering a presentation"
- Casual connector phrases: "And here's the thing...", "But wait...", "The kicker?"

EXAMPLE FLOW:
Post 1: [Hot take or surprising observation]
Post 2: "Here's why this matters →" [context/evidence]
Post 3: "The part nobody talks about:" [deeper insight]
Post 4: [Conclusion + question]
`,
  },

  // Tone & Style
  tone: 'casual',
  voiceGuidelines: `
Write like you're texting a smart friend about something interesting.
Be authentic and conversational - corporate speak kills engagement.
Hot takes and reactions perform well - have an opinion.
Keep it punchy - every word should earn its place.
Emoji can add personality but don't overdo it.
`,

  // Prompts
  systemPromptAdditions: `
You are creating content for Meta Threads - a casual, text-based social platform.

THREADS VIBE:
- Conversational, not corporate
- Reactions and hot takes over formal analysis
- Authentic voice > polished prose
- Think "interesting thought I had" not "professional insight"

WHAT WORKS ON THREADS:
- Quick reactions to news/trends
- Contrarian takes with a point
- Personal observations backed by data
- "Here's what people are missing about X"
- Genuine questions that spark discussion

WHAT DOESN'T WORK:
- Long-form essays (save for LinkedIn)
- Overly formal language
- Excessive hashtags
- Self-promotional content
- Corporate announcements

CREDIBILITY:
- Still cite your sources, but more casually
- "According to [source]..." or "New research shows..."
- Link at end if needed, not inline citations
`,

  structureGuidelines: `
STRUCTURE (keep it simple):
1. HOOK: One punchy line that grabs attention
2. TAKE: Your reaction or insight (1-2 sentences)
3. CONTEXT: Quick supporting evidence
4. CLOSER: Question or call to engage

EXAMPLE STRUCTURES:
- "Hot take: [opinion]. Here's why: [reason]. [source] found [evidence]. Thoughts?"
- "[Surprising fact]. Most people think [common belief]. But [reality]. What's your experience?"
- "Just read that [finding]. This changes [implication]. Anyone else seeing this?"

FORMATTING:
- Short paragraphs (1-2 sentences)
- No headers or bullet points
- Emoji for personality (optional)
- Link at end if citing source
- 0-2 hashtags max, at end
`,
};
