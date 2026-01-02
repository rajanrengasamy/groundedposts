/**
 * Context Persistence Module
 *
 * RAG-based context persistence system for optimizing session context
 * through semantic search instead of loading full markdown files.
 *
 * @module context
 */

// Types
export * from './types.js';

// Core database operations
export {
  connectToDb,
  closeDb,
  getDbConnection,
  collectionExists,
  getCollection,
  initializeCollections,
  dropCollection,
  dropAllCollections,
  getDbStatus,
  setDbPath,
  getDbPath,
  resetDbPath,
  // Row converters
  journalEntryToRow,
  rowToJournalEntry,
  todoSnapshotToRow,
  rowToTodoSnapshot,
  prdSectionToRow,
  rowToPrdSection,
  sessionSummaryToRow,
  rowToSessionSummary,
} from './db.js';

// Embedding service
export {
  generateEmbedding,
  generateEmbeddings,
  getEmbeddingClient,
  resetEmbeddingClient,
  setEmbeddingConfig,
  getEmbeddingConfig,
  getCachedEmbedding,
  cacheEmbedding,
  clearEmbeddingCache,
  getEmbeddingCacheSize,
  getCacheStats,
  loadCacheFromDisk,
  saveCacheToDisk,
  generateCacheKey,
} from './embeddings.js';

// Storage operations
export {
  storeJournalEntry,
  storeTodoSnapshot,
  storePrdSection,
  storeSessionSummary,
  storeJournalEntries,
  storePrdSections,
  deleteEntry,
  updateEntry,
  clearCollection,
  getCollectionCount,
  type JournalEntryInput,
  type TodoSnapshotInput,
  type PrdSectionInput,
  type SessionSummaryInput,
} from './storage.js';

// Retrieval operations
export {
  queryJournalEntries,
  queryPrdSections,
  querySessionSummaries,
  queryJournalEntriesWithOptions,
  queryPrdSectionsWithOptions,
  getRecentSessions,
  getCurrentTodoState,
  getRelevantContext,
  getJournalEntryById,
  getPrdSectionById,
  getSessionSummaryById,
  getTodoSnapshots,
} from './retrieval.js';

// Auto-journal
export {
  getAutoJournalConfig,
  setAutoJournalConfig,
  resetAutoJournalConfig,
  startSession,
  endSession,
  isSessionActive,
  recordTodoCompletion,
  recordAction,
  getSessionStats,
  shouldTriggerJournal,
  shouldTriggerByTodos,
  shouldTriggerByActions,
  hasMinimumDuration,
  getTriggerSummary,
  resetSessionTracker,
} from './auto-journal.js';

// Journal generator
export {
  extractTopics,
  extractWorkCompleted,
  extractOpenItems,
  extractKeyDecisions,
  createCondensedSummary,
  generateJournalEntry,
  formatJournalAsMarkdown,
} from './journal-generator.js';

// Seeding
export {
  seedPrd,
  seedTodo,
  seedExistingJournal,
  seedAll,
  parseJournalEntries,
  ensureContextDirs,
  DEFAULT_SEED_PATHS,
  type SeedResult,
  type SeedAllResult,
} from './seed.js';

// Indexers
export {
  // PRD indexer
  parsePrdSections,
  indexPrd,
  reindexPrd,
  needsReindex,
  getFileHash,
  extractSectionNumber,
  extractTitle,
  generateSectionId,
  getCachedHashMetadata,
  clearCachedHashMetadata,
  setCachedHashMetadata,
  type ParsedPrdSection,
  type IndexResult,
  // TODO indexer
  parseTodoSections,
  parseTodoItems,
  snapshotTodo,
  diffTodoStates,
  getSnapshotSummary,
  calculateCompletionStats,
  calculateOverallCompletion,
  generateSnapshotId,
  extractTaskId,
  extractDescription,
  extractSectionId,
  extractSectionName,
  isTodoItem,
  isCompleted,
  getIndentLevel,
  isSectionHeader,
  type ParsedTodoItem,
  type TodoDiff,
} from './indexers/index.js';
