Begin a new session by loading project context using RAG-based retrieval from the vector database.

## Overview

This command uses semantic search to retrieve only the most relevant context for the current session, dramatically reducing context window usage while maintaining continuity.

**Context Window Optimization:**
- Traditional approach: ~4000 lines (full PRD + TODO + journal)
- RAG approach: ~500-800 lines (relevant sections only)
- **Savings: ~75-80% context reduction**

## Instructions

### Step 1: Check VectorDB Availability

First, check if the context persistence infrastructure is available:
```typescript
// Check for LanceDB at ~/.groundedposts/context/lancedb/
const dbPath = path.join(os.homedir(), '.groundedposts', 'context', 'lancedb');
const vectorDbAvailable = fs.existsSync(dbPath);
```

If VectorDB is **not available**, fall back to file-based loading (see Fallback Behavior below).

### Step 2: Retrieve Recent Session Context

Query the `session_summaries` collection for the last 2-3 sessions:
```typescript
const recentSessions = await getRecentSessions(3);
// Returns: [{summary, work_completed, open_items, timestamp}, ...]
```

Display a condensed summary:
```
## Recent Sessions

### Last Session (2026-01-02)
**Summary:** Implemented multi-platform synthesis module...
**Completed:** Added Threads support, updated CLI commands
**Open Items:** Need to test Bluesky integration

### Previous Session (2026-01-01)
**Summary:** Set up project foundation...
```

### Step 3: Retrieve Current TODO State

Get the latest TODO snapshot:
```typescript
const todoState = await getCurrentTodoState();
// Returns: {sections: [{name, items, completion_pct}], overall_completion}
```

Display focused progress:
```
## Current Progress

### Phase 0.0 — Context Persistence (0% complete)
- [ ] 0.0.0 Context Persistence Setup
- [ ] 0.0.1 Embedding Service
- [ ] 0.0.2 LanceDB Collections
...

### Phase 0 — Content Generation (0% complete)
- [ ] 1.0 Project Foundation
...

**Next up:** Task 0.0.0 - Context Persistence Setup
```

### Step 4: Query Relevant PRD Sections

Based on the current TODO focus, retrieve relevant PRD sections:
```typescript
// Determine focus from first incomplete task
const currentFocus = todoState.sections.find(s => s.completion_pct < 100);
const query = `${currentFocus.name} implementation requirements`;

const relevantPrd = await queryPrdSections(query, 3);
// Returns top 3 most relevant sections
```

Display relevant sections:
```
## Relevant PRD Context

### Section 0: Development Infrastructure
[Condensed content about context persistence...]

### Section 0.7: Implementation Requirements
[Dependencies, environment variables, embedding config...]
```

### Step 5: Query Historical Context (Optional)

If the user mentions a specific topic, query journal entries:
```typescript
const historicalContext = await queryJournalEntries(userQuery, 5);
```

### Step 6: Present Context Bundle

Combine all retrieved context into a summary:

```
# Session Start — GroundedPosts Multi-Platform Content Generator

## Quick Recap
- Last session: Implemented Threads platform synthesis
- Current phase: Phase 0.0 — Context Persistence (0% complete)
- Next task: 0.0.0 Context Persistence Setup

## What Was Left Off
- Created PRD Section 0 for context persistence
- Added task groups to TODO for Phase 0.0
- Updated /journal and /startagain commands

## Open Items from Last Session
- [ ] Install LanceDB dependencies
- [ ] Create src/context/ directory structure
- [ ] Implement embedding service

## Relevant Requirements (PRD Section 0)
- LanceDB for embedded vector storage
- OpenAI text-embedding-3-small for embeddings
- Auto-journal on TODO completion threshold

---

What would you like to focus on this session?
```

### Step 7: Ask for Session Focus

After presenting context, ask what to work on:
```
What would you like to focus on this session?
1. Continue with Phase 0.0 (Context Persistence) - Recommended
2. Skip to Phase 0 (Content Generation Pipeline)
3. Something else (describe)
```

## Fallback Behavior

If VectorDB is unavailable, use file-based loading with optimization:

```
## Fallback Mode (VectorDB unavailable)

Reading files directly with context optimization...
```

1. **PRD**: Read `docs/PRD.md`
   - If >2000 lines, read only Table of Contents + Section 0 + first incomplete section

2. **TODO**: Read `docs/TODO.md`
   - Read full file (needed for task tracking)

3. **Journal**: Read **only the last 150 lines** of `journal.md`
   - First check file length, then use offset parameter
   - Captures last 2-3 session entries

```typescript
// Journal tail reading
const journalPath = 'journal.md';
const stats = await fs.stat(journalPath);
const lineCount = (await fs.readFile(journalPath, 'utf-8')).split('\n').length;
const offset = Math.max(0, lineCount - 150);
// Read from offset to get last entries
```

## Project Overview

GroundedPosts is a TypeScript CLI tool for multi-platform content generation:
- **Phase 0.0**: Context persistence infrastructure (current)
- **Phase 0**: Content generation pipeline (main application)

Pipeline: **Collect (Perplexity) → Validate → Score → Synthesize → Platform-specific output**

Supported Platforms: LinkedIn, Threads, Twitter/X, Bluesky, Substack

## Key Files

| File | Purpose |
|------|---------|
| `docs/PRD.md` | Product requirements (all phases) |
| `docs/TODO.md` | Master task list |
| `journal.md` | Session history (markdown backup) |
| `~/.groundedposts/context/lancedb/` | VectorDB storage |

## VectorDB Collections

| Collection | Query For |
|------------|-----------|
| `session_summaries` | Recent session recaps |
| `journal_entries` | Historical context by topic |
| `todo_snapshots` | Current progress state |
| `prd_sections` | Requirements by topic |

## Example RAG Queries

```typescript
// "What did we decide about the synthesis model?"
await queryJournalEntries("synthesis model decision", 3);

// "What are the requirements for the platform adapters?"
await queryPrdSections("platform adapter requirements", 2);

// "Show me progress on synthesis module"
await queryTodoSnapshots("synthesis", 1);
```

## Seeding (First Run)

If VectorDB is empty, suggest running the seeding script:
```
VectorDB is empty. Run `npm run seed-context` to index:
- PRD sections
- Current TODO state
- Existing journal entries (if journal.md exists)
```
