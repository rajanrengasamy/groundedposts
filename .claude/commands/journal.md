Reflect on the current session and create a journal entry. This serves as a retrospective capturing what was accomplished, issues encountered, and context needed for future sessions.

## Instructions

1. **Review the session** - Analyze what was discussed and accomplished in this conversation
2. **Read existing context** - Check journal.md (if exists), docs/TODO.md, and docs/PRD.md for continuity
3. **Generate entry** - Create a journal entry following the structure below
4. **Store in VectorDB** - If context persistence is available, store the entry for RAG retrieval
5. **Append to journal.md** - Also append to the markdown file as backup

## Journal Entry Structure

Use this format for the new entry:
```
---

## Session: [DATE] [TIME AEST]

### Summary
[2-3 sentence overview of what was accomplished]

### Work Completed
- [Specific task/change completed]
- [Files modified/created]

### Issues & Resolutions
| Issue | Resolution | Status |
|:------|:-----------|:-------|
| [Problem encountered] | [How it was solved] | Resolved / Open |

### Key Decisions
- [Decision made and rationale]

### Learnings
- [Technical insight or pattern discovered]

### Open Items / Blockers
- [ ] [Item needing attention next session]

### Context for Next Session
[Brief narrative of where things stand and recommended next steps]

---
```

## Vector Storage (Phase 0.0)

After generating the journal entry, perform these additional steps if `src/context/` infrastructure exists:

### 1. Generate Embeddings
```typescript
// Use OpenAI text-embedding-3-small
const embedding = await generateEmbedding(journalEntry.content);
```

### 2. Store in LanceDB Collections

**journal_entries collection:**
```typescript
await storeJournalEntry({
  id: `journal-${Date.now()}`,
  timestamp: new Date().toISOString(),
  content: fullJournalEntry,
  summary: summarySection,
  topics: extractTopics(journalEntry), // e.g., ["synthesis", "platform-adapters", "threading"]
  embedding: embedding
});
```

**session_summaries collection:**
```typescript
await storeSessionSummary({
  id: `session-${Date.now()}`,
  timestamp: new Date().toISOString(),
  summary: summarySection,
  work_completed: workCompletedItems,
  open_items: openItems,
  embedding: summaryEmbedding
});
```

### 3. Snapshot TODO State
```typescript
await snapshotTodo('docs/TODO.md');
```

## Auto-Journal Trigger Detection

This command may be auto-triggered when:
- 3+ TODO items have been marked complete in this session
- 10+ significant file modifications have occurred
- Session duration exceeds 15 minutes with meaningful work

When auto-triggered, generate a more concise entry focused on:
- What changed (files, tasks)
- Key decisions made
- Blockers encountered

## Fallback Behavior

If VectorDB is unavailable (LanceDB not installed, API key missing, or errors):
1. Log a warning: "VectorDB unavailable, falling back to file-based storage"
2. Proceed with markdown-only storage to `journal.md`
3. The entry will be indexed when VectorDB becomes available via `npm run seed-context`

## File Locations

- **journal.md**: Project root (human-readable backup)
- **LanceDB**: `~/.groundedposts/context/lancedb/journal_entries.lance`
- **TODO snapshot**: `~/.groundedposts/context/lancedb/todo_snapshots.lance`

## Behavior

- **If journal.md exists**: Append new entry at the end
- **If journal.md doesn't exist**: Create it with a header and first entry
- **Tone**: Concise, factual, future-oriented
- **Focus**: Capture enough context that a fresh session can resume seamlessly

## File Header (for new journal.md)
```
# Project Journal

This file maintains session history for continuity across Claude Code sessions.
Use alongside `docs/TODO.md` (task list) and `docs/PRD.md` (PRD) when starting new sessions.

> Note: Entries are also stored in VectorDB for semantic retrieval via `/startagain`.
```
