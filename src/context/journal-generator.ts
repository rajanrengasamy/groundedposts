/**
 * Journal Entry Generator
 *
 * Utilities for extracting structured information from session context
 * and generating journal entries/summaries.
 *
 * @module context/journal-generator
 */

import type { GeneratedJournalEntry } from './types.js';

/**
 * Common keywords to identify topics in content
 */
const TOPIC_KEYWORDS: Record<string, string[]> = {
  'vector-db': ['lancedb', 'vector', 'embedding', 'semantic search', 'rag'],
  'context': ['context', 'session', 'persistence', 'storage'],
  'indexing': ['index', 'parse', 'markdown', 'prd', 'todo'],
  'journal': ['journal', 'auto-journal', 'summary'],
  'testing': ['test', 'vitest', 'mock', 'spec'],
  'api': ['api', 'endpoint', 'rest', 'openai'],
  'platform': ['linkedin', 'threads', 'twitter', 'bluesky', 'substack'],
  'synthesis': ['synthesis', 'generate', 'llm', 'gpt', 'claude'],
  'claims': ['claim', 'source', 'grounded', 'verification'],
};

/**
 * Patterns for identifying work completed items
 */
const WORK_COMPLETED_PATTERNS = [
  /(?:implemented|created|added|built|wrote|fixed|updated|refactored)\s+(.+?)(?:\.|$)/gi,
  /(?:completed|finished|done with)\s+(.+?)(?:\.|$)/gi,
  /- \[x\]\s+(.+?)$/gm,
];

/**
 * Patterns for identifying open items
 */
const OPEN_ITEMS_PATTERNS = [
  /(?:todo|next|remaining|still need to|should|will)\s+(.+?)(?:\.|$)/gi,
  /(?:blocked by|waiting for|depends on)\s+(.+?)(?:\.|$)/gi,
  /- \[ \]\s+(.+?)$/gm,
];

/**
 * Patterns for identifying key decisions
 */
const DECISION_PATTERNS = [
  /(?:decided to|chose|went with|selected|opted for)\s+(.+?)(?:\.|$)/gi,
  /(?:instead of|rather than|over)\s+(.+?)(?:\.|$)/gi,
];

/**
 * Extract topics from content based on keyword matching
 *
 * @param content - Text content to analyze
 * @returns Array of identified topic strings
 */
export function extractTopics(content: string): string[] {
  const lowercaseContent = content.toLowerCase();
  const foundTopics: string[] = [];

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowercaseContent.includes(keyword.toLowerCase())) {
        if (!foundTopics.includes(topic)) {
          foundTopics.push(topic);
        }
        break;
      }
    }
  }

  return foundTopics;
}

/**
 * Extract work completed items from content
 *
 * @param content - Text content to analyze
 * @returns Array of work items completed
 */
export function extractWorkCompleted(content: string): string[] {
  const items: string[] = [];

  for (const pattern of WORK_COMPLETED_PATTERNS) {
    // Reset regex state
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const item = match[1].trim();
      if (item.length > 3 && item.length < 200 && !items.includes(item)) {
        items.push(item);
      }
    }
  }

  return items.slice(0, 10); // Limit to 10 items
}

/**
 * Extract open/remaining items from content
 *
 * @param content - Text content to analyze
 * @returns Array of open items
 */
export function extractOpenItems(content: string): string[] {
  const items: string[] = [];

  for (const pattern of OPEN_ITEMS_PATTERNS) {
    // Reset regex state
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const item = match[1].trim();
      if (item.length > 3 && item.length < 200 && !items.includes(item)) {
        items.push(item);
      }
    }
  }

  return items.slice(0, 10); // Limit to 10 items
}

/**
 * Extract key decisions from content
 *
 * @param content - Text content to analyze
 * @returns Array of decisions made
 */
export function extractKeyDecisions(content: string): string[] {
  const decisions: string[] = [];

  for (const pattern of DECISION_PATTERNS) {
    // Reset regex state
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const decision = match[1].trim();
      if (decision.length > 3 && decision.length < 200 && !decisions.includes(decision)) {
        decisions.push(decision);
      }
    }
  }

  return decisions.slice(0, 5); // Limit to 5 decisions
}

/**
 * Create a condensed summary from a generated journal entry
 *
 * @param entry - Generated journal entry
 * @returns Condensed summary (200-300 tokens target)
 */
export function createCondensedSummary(entry: GeneratedJournalEntry): string {
  const lines: string[] = [];

  // Start with the main summary
  lines.push(entry.summary);

  // Add key work items
  if (entry.workCompleted.length > 0) {
    lines.push('');
    lines.push('Key work:');
    entry.workCompleted.slice(0, 3).forEach((item) => {
      lines.push(`- ${item}`);
    });
  }

  // Add key decisions if any
  if (entry.keyDecisions.length > 0) {
    lines.push('');
    lines.push('Decisions:');
    entry.keyDecisions.slice(0, 2).forEach((decision) => {
      lines.push(`- ${decision}`);
    });
  }

  // Add open items if any
  if (entry.openItems.length > 0) {
    lines.push('');
    lines.push('Open items:');
    entry.openItems.slice(0, 3).forEach((item) => {
      lines.push(`- ${item}`);
    });
  }

  return lines.join('\n');
}

/**
 * Generate a journal entry from session content
 *
 * Note: This is a simplified extraction. In production, you might
 * want to use an LLM to generate more coherent summaries.
 *
 * @param sessionContent - Full session content/transcript
 * @param summary - Optional pre-generated summary
 * @returns Generated journal entry structure
 */
export function generateJournalEntry(
  sessionContent: string,
  summary?: string
): GeneratedJournalEntry {
  const workCompleted = extractWorkCompleted(sessionContent);
  const openItems = extractOpenItems(sessionContent);
  const keyDecisions = extractKeyDecisions(sessionContent);
  const topics = extractTopics(sessionContent);

  // Generate summary if not provided
  const generatedSummary =
    summary ||
    generateSummaryFromContent(sessionContent, workCompleted, openItems);

  return {
    content: sessionContent,
    summary: generatedSummary,
    workCompleted,
    openItems,
    keyDecisions,
    topics,
  };
}

/**
 * Generate a basic summary from content and extracted items
 *
 * @param content - Session content
 * @param workCompleted - Extracted work items
 * @param openItems - Extracted open items
 * @returns Generated summary
 */
function generateSummaryFromContent(
  content: string,
  workCompleted: string[],
  openItems: string[]
): string {
  const lines: string[] = [];

  // Create a simple summary
  if (workCompleted.length > 0) {
    lines.push(`Session focused on ${workCompleted.slice(0, 2).join(' and ')}.`);
  }

  if (openItems.length > 0) {
    lines.push(`Remaining work includes ${openItems.slice(0, 2).join(' and ')}.`);
  }

  if (lines.length === 0) {
    // Fallback: use first 200 chars of content
    lines.push(content.slice(0, 200).trim() + '...');
  }

  return lines.join(' ');
}

/**
 * Format a journal entry as markdown
 *
 * @param entry - Generated journal entry
 * @param timestamp - Entry timestamp
 * @returns Formatted markdown string
 */
export function formatJournalAsMarkdown(
  entry: GeneratedJournalEntry,
  timestamp: string = new Date().toISOString()
): string {
  const lines: string[] = [];
  const date = new Date(timestamp).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  lines.push(`## Session: ${date}`);
  lines.push('');
  lines.push('### Summary');
  lines.push(entry.summary);
  lines.push('');

  if (entry.workCompleted.length > 0) {
    lines.push('### Work Completed');
    entry.workCompleted.forEach((item) => {
      lines.push(`- ${item}`);
    });
    lines.push('');
  }

  if (entry.keyDecisions.length > 0) {
    lines.push('### Key Decisions');
    entry.keyDecisions.forEach((decision) => {
      lines.push(`- ${decision}`);
    });
    lines.push('');
  }

  if (entry.openItems.length > 0) {
    lines.push('### Open Items');
    entry.openItems.forEach((item) => {
      lines.push(`- ${item}`);
    });
    lines.push('');
  }

  if (entry.topics.length > 0) {
    lines.push('### Topics');
    lines.push(entry.topics.map((t) => `\`${t}\``).join(', '));
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  return lines.join('\n');
}
