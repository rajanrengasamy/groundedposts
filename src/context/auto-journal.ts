/**
 * Auto-Journal Triggering
 *
 * Detects when a journal entry should be automatically generated based on
 * session activity metrics (completed TODOs, significant actions, duration).
 *
 * @module context/auto-journal
 */

import {
  DEFAULT_AUTO_JOURNAL_CONFIG,
  type AutoJournalConfig,
  type SessionStats,
  type Action,
} from './types.js';

/**
 * Current configuration (can be customized)
 */
let currentConfig: AutoJournalConfig = { ...DEFAULT_AUTO_JOURNAL_CONFIG };

/**
 * Session tracking state
 */
interface SessionTracker {
  startTime: Date;
  todosCompleted: number;
  actions: Action[];
}

/**
 * Current session tracker
 */
let sessionTracker: SessionTracker | null = null;

/**
 * Get the current auto-journal configuration
 *
 * @returns Current configuration
 */
export function getAutoJournalConfig(): AutoJournalConfig {
  return { ...currentConfig };
}

/**
 * Set custom auto-journal configuration
 *
 * @param config - Partial configuration to merge
 */
export function setAutoJournalConfig(config: Partial<AutoJournalConfig>): void {
  currentConfig = { ...DEFAULT_AUTO_JOURNAL_CONFIG, ...config };
}

/**
 * Reset configuration to defaults
 */
export function resetAutoJournalConfig(): void {
  currentConfig = { ...DEFAULT_AUTO_JOURNAL_CONFIG };
}

/**
 * Start tracking a new session
 */
export function startSession(): void {
  sessionTracker = {
    startTime: new Date(),
    todosCompleted: 0,
    actions: [],
  };
}

/**
 * End the current session
 */
export function endSession(): void {
  sessionTracker = null;
}

/**
 * Check if a session is currently being tracked
 *
 * @returns True if session is active
 */
export function isSessionActive(): boolean {
  return sessionTracker !== null;
}

/**
 * Record a TODO completion
 */
export function recordTodoCompletion(): void {
  if (sessionTracker) {
    sessionTracker.todosCompleted++;
  }
}

/**
 * Record an action
 *
 * @param type - Action type (e.g., 'Edit', 'Write', 'Bash')
 * @param subtype - Optional subtype (e.g., 'git commit')
 */
export function recordAction(type: string, subtype?: string): void {
  if (sessionTracker) {
    sessionTracker.actions.push({
      type,
      subtype,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Get current session statistics
 *
 * @returns Session stats or null if no active session
 */
export function getSessionStats(): SessionStats | null {
  if (!sessionTracker) {
    return null;
  }

  const durationMinutes = Math.floor(
    (Date.now() - sessionTracker.startTime.getTime()) / 60000
  );

  const significantActionsCount = sessionTracker.actions.filter((action) => {
    const actionKey = action.subtype
      ? `${action.type}:${action.subtype}`
      : action.type;
    return currentConfig.significantActions.some(
      (sig) => actionKey.startsWith(sig) || action.type === sig
    );
  }).length;

  return {
    todosCompleted: sessionTracker.todosCompleted,
    significantActionsCount,
    durationMinutes,
    sessionStartTime: sessionTracker.startTime.toISOString(),
  };
}

/**
 * Check if journal should be triggered based on TODO completions
 *
 * @param stats - Session statistics
 * @returns True if TODO threshold is met
 */
export function shouldTriggerByTodos(stats: SessionStats): boolean {
  return stats.todosCompleted >= currentConfig.todoCompletionThreshold;
}

/**
 * Check if journal should be triggered based on significant actions
 *
 * @param stats - Session statistics
 * @returns True if action threshold is met
 */
export function shouldTriggerByActions(stats: SessionStats): boolean {
  return stats.significantActionsCount >= currentConfig.significantActionThreshold;
}

/**
 * Check if session has met minimum duration for journaling
 *
 * @param stats - Session statistics
 * @returns True if minimum duration is met
 */
export function hasMinimumDuration(stats: SessionStats): boolean {
  return stats.durationMinutes >= currentConfig.minSessionDuration;
}

/**
 * Determine if an auto-journal should be triggered
 *
 * Conditions (all must be true for trigger):
 * 1. Session has minimum duration
 * 2. Either TODO threshold OR action threshold is met
 *
 * @param stats - Session statistics (if null, gets current session stats)
 * @returns True if journal should be triggered
 */
export function shouldTriggerJournal(stats?: SessionStats | null): boolean {
  const sessionStats = stats ?? getSessionStats();

  if (!sessionStats) {
    return false;
  }

  // Must have minimum duration
  if (!hasMinimumDuration(sessionStats)) {
    return false;
  }

  // Must meet at least one threshold
  return shouldTriggerByTodos(sessionStats) || shouldTriggerByActions(sessionStats);
}

/**
 * Get a summary of why journal was/wasn't triggered
 *
 * Useful for debugging and transparency.
 *
 * @param stats - Session statistics
 * @returns Human-readable trigger status
 */
export function getTriggerSummary(stats: SessionStats): string {
  const lines: string[] = [];

  lines.push(`Session Duration: ${stats.durationMinutes} minutes (min: ${currentConfig.minSessionDuration})`);
  lines.push(`TODOs Completed: ${stats.todosCompleted} (threshold: ${currentConfig.todoCompletionThreshold})`);
  lines.push(`Significant Actions: ${stats.significantActionsCount} (threshold: ${currentConfig.significantActionThreshold})`);

  const should = shouldTriggerJournal(stats);
  lines.push(`\nAuto-Journal Trigger: ${should ? 'YES' : 'NO'}`);

  if (!hasMinimumDuration(stats)) {
    lines.push('  - Session too short');
  }

  if (!shouldTriggerByTodos(stats) && !shouldTriggerByActions(stats)) {
    lines.push('  - No threshold met');
  }

  return lines.join('\n');
}

/**
 * Reset session tracker state (for testing)
 */
export function resetSessionTracker(): void {
  sessionTracker = null;
}
