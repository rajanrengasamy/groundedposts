/**
 * Substack Platform Configuration
 *
 * Configuration for Substack content generation including:
 * - Newsletter posts (long-form articles delivered via email)
 * - Notes (short-form social posts, similar to Twitter/Threads)
 *
 * Substack is a newsletter platform that combines long-form content
 * with social features through Notes.
 *
 * @see https://support.substack.com/hc/en-us/articles/14742958406036
 * @see https://on.substack.com/p/notes-faq
 */

import type { PlatformConfig } from './types.js';

// ============================================
// Substack Posts Constants (Newsletter)
// ============================================

/**
 * Substack has no hard character limit, but Gmail truncates at ~102KB.
 * We set a practical limit for readability.
 */
export const SUBSTACK_POST_MAX_LENGTH = 15000;

/** Recommended word count: 500-1500 words (~3000-9000 chars) */
export const SUBSTACK_POST_TARGET_LENGTH = { min: 3000, max: 9000 };

/** Minimum for a meaningful newsletter post */
export const SUBSTACK_POST_MIN_LENGTH = 1000;

// ============================================
// Substack Notes Constants (Short-form)
// ============================================

/**
 * Notes have no official limit but are meant for "quick thoughts".
 * We target Twitter-like brevity for optimal engagement.
 */
export const SUBSTACK_NOTES_MAX_LENGTH = 1000;

/** Optimal Notes length for engagement */
export const SUBSTACK_NOTES_TARGET_LENGTH = { min: 200, max: 600 };

// ============================================
// Substack Posts Configuration (Newsletter)
// ============================================

export const substackPostConfig: PlatformConfig = {
  // Identity
  name: 'substack',
  displayName: 'Substack Newsletter',

  // Content Constraints
  maxLength: SUBSTACK_POST_MAX_LENGTH,
  targetLength: SUBSTACK_POST_TARGET_LENGTH,
  hashtagPolicy: {
    required: false,
    max: 0,  // Hashtags not used in newsletter posts
  },
  mentionSupport: false,  // No @ mentions in posts
  linkHandling: 'inline',

  // Format Features - Full rich text
  formatting: {
    supportsHeaders: true,      // H1, H2, H3 supported
    supportsBold: true,         // **bold** works
    supportsItalic: true,       // *italic* works
    supportsLists: true,        // Bullets and numbered lists
    supportsLineBreaks: true,   // Multiple paragraphs
    supportsEmoji: true,        // Emoji supported
  },

  // Threading - Newsletter series
  threading: {
    supportsThreading: true,
    maxThreadLength: 10,        // Multi-part series
    connectionType: 'series',
    numberingFormat: 'Part {n}: ',
    requiresTeaser: true,
    optimalLength: { min: 3, max: 5 },
    threadPromptAdditions: `
NEWSLETTER SERIES MODE:
Generate a multi-part newsletter series for Substack subscribers.

FORMAT:
- Each post starts with "Part X: [Title]" in the subject/title
- Include brief recap of previous parts for context
- End with teaser for next part and CTA to subscribe
- Each post should work standalone for new subscribers

NEWSLETTER BEST PRACTICES:
- Strong subject line (under 70 chars for Gmail, 46 for Yahoo)
- Hook in first paragraph (shows in email preview)
- Subheads every 2-3 paragraphs for scannability
- End with discussion prompt for comments
- Include "Share" CTA for growth

CONTENT DISTRIBUTION:
- Part 1: Hook + problem setup + why this matters
- Middle parts: Deep analysis, examples, frameworks
- Final part: Actionable takeaways + full series recap
`,
  },

  // Tone & Style
  tone: 'conversational',
  voiceGuidelines: `
Write like you're sending a thoughtful email to a smart friend.
Personal, direct, and substantive - not corporate or generic.
Use "I" and "you" freely - newsletters are personal.
Include your perspective and analysis, not just facts.
Reward subscribers with insights they can't get elsewhere.
`,

  // Prompts
  systemPromptAdditions: `
You are creating a Substack newsletter post - a long-form article delivered via email.

SUBSTACK NEWSLETTER CONTEXT:
- Readers subscribe because they value YOUR perspective
- They're reading in their inbox, not scrolling a feed
- They expect depth, not hot takes
- They've invited you into their inbox - respect that

EMAIL-FIRST WRITING:
- Subject line + first paragraph = what shows in inbox preview
- Make first 2-3 sentences compelling enough to open
- Front-load value - don't bury the insight
- Use subheads liberally - readers skim before committing

STRUCTURE FOR ENGAGEMENT:
- Hook: Why should I read this NOW?
- Context: What do I need to know?
- Insight: What's the non-obvious take?
- Evidence: Why should I believe this?
- Takeaway: What should I do with this?
- Discussion: What do YOU think?

CREDIBILITY FOR NEWSLETTERS:
- Link to sources inline - readers expect depth
- Quote experts and cite studies
- Acknowledge counterarguments
- Be intellectually honest about limitations
`,

  structureGuidelines: `
NEWSLETTER STRUCTURE:

1. SUBJECT LINE (Critical - under 70 chars):
   - Specific and intriguing
   - Avoid clickbait - deliver on promise
   - Examples: "Why [surprising thing] is actually [insight]"

2. OPENING (First 2-3 paragraphs):
   - Hook that creates curiosity or urgency
   - Preview what reader will learn
   - Personal angle if relevant

3. BODY (Multiple sections with H2 subheads):
   - Each section: subhead + 2-4 paragraphs
   - Include evidence, quotes, examples
   - Use bullet points for lists
   - Embed relevant links

4. TAKEAWAYS:
   - Clear, actionable points
   - What should reader do/think differently?

5. CLOSING:
   - Discussion prompt: "What's your experience with X?"
   - Soft CTA: "Share with someone who..."
   - Teaser for next issue (optional)

6. NO HASHTAGS - Not used in Substack posts
`,
};

// ============================================
// Substack Notes Configuration (Short-form)
// ============================================

export const substackNotesConfig: PlatformConfig = {
  // Identity
  name: 'substack-notes',
  displayName: 'Substack Notes',

  // Content Constraints
  maxLength: SUBSTACK_NOTES_MAX_LENGTH,
  targetLength: SUBSTACK_NOTES_TARGET_LENGTH,
  hashtagPolicy: {
    required: false,
    max: 3,  // Hashtags supported for discoverability
  },
  mentionSupport: true,  // Can mention other Substack creators
  linkHandling: 'card',  // Links show as rich previews

  // Format Features - Limited but present
  formatting: {
    supportsHeaders: false,     // No headers in Notes
    supportsBold: true,         // Bold works
    supportsItalic: true,       // Italic works
    supportsLists: true,        // Bullet lists work
    supportsLineBreaks: true,   // Paragraphs work
    supportsEmoji: true,        // Emoji encouraged
  },

  // Threading - Reply chains
  threading: {
    supportsThreading: true,
    maxThreadLength: 10,
    connectionType: 'reply-chain',
    numberingFormat: undefined,  // No explicit numbering
    requiresTeaser: false,
    optimalLength: { min: 2, max: 4 },
    threadPromptAdditions: `
NOTES THREAD MODE:
Generate a connected thread of Substack Notes.

FORMAT:
- First note: Strong standalone hook/observation
- Reply notes: Expand, add evidence, deepen
- Final note: Land the point, drive to newsletter

NOTES STYLE:
- Think "public thinking" not "polished article"
- Conversational, like you're thinking out loud
- Each note should work if someone sees it in isolation
- Use line breaks between thoughts

DRIVE TO NEWSLETTER:
- Thread should create curiosity for deeper content
- Final note can tease related newsletter post
- "I wrote more about this in [post title]..."
`,
  },

  // Tone & Style
  tone: 'conversational',
  voiceGuidelines: `
Write like you're sharing an interesting thought in a group chat.
Quick, punchy, conversational - but still substantive.
Notes are for thinking out loud, testing ideas, engaging.
More casual than your newsletter, but still YOU.
Use Notes to show personality and build connection.
`,

  // Prompts
  systemPromptAdditions: `
You are creating a Substack Note - short-form social content on Substack.

NOTES vs NEWSLETTER:
- Newsletter: Polished, long-form, email delivery
- Notes: Quick thoughts, social feed, real-time

WHAT WORKS ON NOTES:
- Interesting observations from your expertise
- Reactions to news/trends in your space
- Questions that spark discussion
- Behind-the-scenes of your work/thinking
- Quotes or highlights from your newsletter

ENGAGEMENT DRIVERS:
- Ask genuine questions
- Share contrarian or surprising takes
- Quote other creators (they get notified)
- Link to your own posts (drives newsletter traffic)
- Restacks of interesting content with your take

NOTES BEST PRACTICES:
- Post consistently (daily or near-daily)
- Engage in replies - it's social
- Use hashtags sparingly for discovery
- Include images when relevant
`,

  structureGuidelines: `
NOTES STRUCTURE (keep it simple):

SHORT NOTE (1 post):
- Hook line
- 1-2 supporting points
- Question or call to engage

EXAMPLE:
"Something I've noticed about [X]:

[Observation 1]
[Observation 2]

Anyone else seeing this?"

THREAD (2-4 notes):
Note 1: Hook + initial observation
Note 2: "Here's what I mean..." + evidence
Note 3: "The implication..." + deeper take
Note 4: Conclusion + "More on this in my newsletter"

FORMATTING:
- Short paragraphs (1-2 sentences)
- Line breaks for readability
- Bold for emphasis sparingly
- Up to 3 hashtags at end
- Link to newsletter post if relevant
`,
};
