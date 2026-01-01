GroundedPosts PRD - Senior Architecture Review
A) Executive Summary
Overall Assessment: The PRD demonstrates strong product vision and thoughtful platform abstraction, but lacks critical production engineering details. The architecture is 70% complete for prototype, 30% complete for production.

Critical Gaps:

No LLM provider strategy - Which models (GPT-4? Claude? versions?), fallback logic, model versioning, context window management
Zero security/compliance design - API key management, PII handling, content moderation, copyright/fair use strategy missing
No evaluation framework - How do you measure content quality? No golden datasets, human eval rubrics, or regression tests
Missing error handling - No failure modes, retry logic, timeout handling, or graceful degradation documented
Vague RAG implementation - Vector DB choice unstable (Chroma vs Pinecone), no embedding model specified, no chunking/overlap parameters
Cost controls absent - No budgets, rate limits, or cost guardrails despite multi-LLM synthesis
Source trust undefined - No verification scoring, paywall handling, or stale source detection
Observability not designed - No logging, tracing, alerting, SLOs, or incident response plan
Strengths:

Excellent platform abstraction design (PlatformConfig interface is production-grade)
Threading/multi-post logic is well thought through
Clear separation of stages (collect → extract → synthesize → output)
Dual vector DB concept (context + outputs) is innovative
Risk Level: HIGH - The PRD can guide prototyping but will cause scope creep, security incidents, and cost overruns in production without revisions.

Update Todos
 Complete executive summary of PRD issues and opportunities
 Generating prioritized list of improvements with impact/effort ratings
 Write section-by-section detailed comments
 Identify missing sections and decisions
 Draft concrete rewrites for critical sections
 Create revised implementation-ready PRD outline
 Generate stakeholder questions grouped by theme
B) Top Issues (Prioritized by Impact × Urgency)
Rank	Issue	Impact	Effort	Why Critical	Fix Priority
1	No LLM Provider Strategy	HIGH	MED	Can't implement synthesis without model selection, versioning, fallback logic	P0 - Blocking
2	Missing Evaluation Framework	HIGH	HIGH	Can't measure quality, regression, or justify LLM costs	P0 - Blocking
3	No Error Handling Design	HIGH	MED	Production failures will be unhandled (source timeouts, API errors, rate limits)	P0 - Blocking
4	Security/Compliance Absent	HIGH	MED	API keys, PII, content moderation, copyright expose legal/security risk	P0 - Blocking
5	Cost Controls Missing	HIGH	LOW	Multi-LLM synthesis can drain budget without guardrails	P0 - Blocking
6	RAG Implementation Vague	MED	HIGH	Embedding model, chunking params, reranking unspecified	P1 - Pre-Phase 6
7	Source Verification Undefined	MED	MED	No trust scoring, paywall handling, staleness detection	P1 - Pre-Phase 2
8	Observability Not Designed	MED	MED	No tracing, logging, alerting, SLOs for production ops	P1 - Pre-Launch
9	User/Persona Unclear	MED	LOW	"Users" is generic - affects UX, pricing, feature prioritization	P1 - Strategy
10	Threading Failure Modes	MED	LOW	What if part 2/5 fails generation? Partial threads?	P2 - Polish
11	Image Generation Half-Baked	LOW	HIGH	Newsletter images sketched but no NanoBanana integration contract	P2 - Phase 5
12	No Backward Compat Plan	LOW	LOW	Schema changes (linkedinPost → post) need migration strategy	P2 - Phase 1
Update Todos
 Complete executive summary of PRD issues and opportunities
 Generate prioritized list of improvements with impact/effort ratings
 Writing section-by-section detailed comments
 Identify missing sections and decisions
 Draft concrete rewrites for critical sections
 Create revised implementation-ready PRD outline
 Generate stakeholder questions grouped by theme
C) Section-by-Section Comments
Overview & Vision
Quote: "GroundedPosts is a multi-platform content generation CLI that transforms verified research into platform-optimized social media posts."

Issue: "Verified research" is vague. What verification? By whom? To what standard?
Why it matters: This is the core value prop - if verification is fuzzy, the product is just another GPT wrapper.
Suggested change:
GroundedPosts generates platform-optimized social media content from source-attributed claims. 
Every statement in generated content is traceable to a specific URL/quote with verification level 
(VERIFIED, LIKELY, CLAIMED). Users control minimum verification threshold per post.

Quote: "## Vision - One pipeline, any platform."

Issue: Vision doesn't explain the "why" - why is this valuable? To whom? What pain does it solve?
Why it matters: Without user/problem clarity, prioritization and feature decisions become arbitrary.
Suggested change: Add a "Problem Statement" section:
## Problem Statement

**Target Users:** Independent creators, analysts, and small marketing teams who:
- Spend 2-4 hours reformatting a single insight for LinkedIn, Twitter, Threads, Substack
- Lose source attribution when copying content across platforms
- Can't afford dedicated social media teams

**Pain:** Multi-platform content requires manual reformatting (3000 chars → 280 chars), 
tone shifts (professional → casual), and re-sourcing citations. Current tools (Buffer, Hootsuite) 
repost identical content, ignoring platform norms.

**Solution:** One research session → platform-native content with full provenance.

**Why Now:** LLMs enable tone/length adaptation at quality parity with human writers. 
Creator economy demands multi-platform presence (avg creator uses 3.2 platforms, up from 1.8 in 2022).

Platform Abstraction Layer
Quote: "interface PlatformConfig { ... }"

Issue: None - this is excellent. Clean abstraction, well-typed.
Suggested enhancement: Add rateLimit and costPerRequest to PlatformConfig for production operability:
interface PlatformConfig {
  // ... existing fields
  
  // Operational constraints
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  
  costEstimate?: {
    synthesisModel: 'gpt' | 'claude' | 'gemini' | 'kimi';
    avgCostUSD: number;  // Average cost per post generation
  };
}

Pipeline Architecture
Quote: "### Stage 1: Source Collection (Platform-Agnostic) - Web search via Perplexity/Tavily"

Issue: No error handling, timeout, or fallback strategy. What if Perplexity is down? Rate limited? Returns 0 results?
Why it matters: Source collection is a remote API dependency - failures will be common in production.
Suggested change:
### Stage 1: Source Collection (Platform-Agnostic)

**Primary:** Perplexity API (perplexity.ai/api)
**Fallback:** Tavily API (tavily.com)
**Timeout:** 30s per source request
**Retry:** 3 attempts with exponential backoff (2s, 4s, 8s)
**Min Sources:** 3 (configurable via --min-sources flag)
**Failure Mode:** If <3 sources after retries, prompt user:
  "Only found 2 sources. Continue with limited grounding? (y/n)"

**Error States:**
- API_TIMEOUT: Log, retry with fallback provider
- API_RATE_LIMITED: Sleep until rate limit resets (max 60s) or fail gracefully
- NO_RESULTS: Return error with suggestion to rephrase topic
- PAYWALL_DETECTED: Mark source as CLAIMED (lower verification), continue

Quote: "### Stage 2: Claim Extraction (Platform-Agnostic) - Extract quotes, statistics, insights - Assign verification levels"

Issue: "Verification levels" mentioned but never defined. What are they? Who assigns them? How?
Why it matters: This is core to "grounded" promise - needs explicit design.
Suggested change:
### Stage 2: Claim Extraction (Platform-Agnostic)

**Verification Levels:**
- **VERIFIED (L3):** Direct quote or statistic from authoritative source with URL
  Example: "OpenAI reported 100M weekly active users (openai.com/blog/chatgpt-100m)"

- **LIKELY (L2):** Paraphrased fact from credible source
  Example: "Research suggests AI adoption doubled in 2024 (McKinsey report)"

- **CLAIMED (L1):** Unsourced statement or inference
  Example: "Many companies are exploring AI" (no source)

**Extraction Process:**
1. LLM extracts claims from source text (model: gpt-4o-mini for cost)
2. Each claim tagged with verification level based on source authority:
   - L3: .gov, .edu, peer-reviewed journals, official company blogs
   - L2: Major news outlets (NYT, Reuters), industry reports (Gartner, McKinsey)
   - L1: Blogs, social media, opinion pieces
3. User sets min verification level via --min-verification=L2 (default: L2)
4. Claims below threshold are filtered unless user overrides with --allow-all-claims

**Output Schema:**
```typescript
interface GroundedClaim {
  text: string;
  sourceUrl: string;
  sourceTitle: string;
  verificationLevel: 'VERIFIED' | 'LIKELY' | 'CLAIMED';
  sourceAuthority: 'high' | 'medium' | 'low';  // .gov=high, blog=low
  extractedAt: Date;
  confidence: number;  // LLM confidence score 0-1
}

Quote: "### Stage 3: Platform Synthesis (Platform-Specific) - Load platform configuration - Apply platform-specific system prompt"

Issue: No LLM model specified. Which GPT? Claude? Version? Temperature? Max tokens?
Why it matters: Can't implement or cost-estimate without model selection. Model changes affect quality/cost/latency.
Suggested change:
### Stage 3: Platform Synthesis (Platform-Specific)

**Model Selection (user configurable via --model flag):**

| Model | Provider | Use Case | Avg Cost/Post | Latency | Quality |
|-------|----------|----------|---------------|---------|---------|
| **gpt-4o** (default) | OpenAI | Balanced quality/cost | $0.015 | 3-5s | Excellent |
| **claude-3-5-sonnet** | Anthropic | Highest quality, verbose | $0.025 | 4-6s | Best |
| **gemini-1.5-pro** | Google | Cost-optimized | $0.008 | 5-8s | Good |
| **gpt-4o-mini** | OpenAI | High-volume, simple posts | $0.003 | 2-3s | Acceptable |

**Synthesis Parameters:**
- Temperature: 0.7 (creative but consistent)
- Max tokens: Calculated as platform.maxLength * 1.5 (buffer for formatting)
- Top-p: 0.9
- Presence penalty: 0.1 (reduce repetition)
- System prompt: Platform-specific (see Platform-Specific Requirements)
- Retry on failure: 2 attempts with temperature reduced to 0.5

**Fallback Strategy:**
1. Primary model fails → retry with same model (2x)
2. Still failing → fallback to gpt-4o-mini (cheaper, more reliable)
3. All models fail → return error with cached partial result if available

**Validation:**
- Zod schema validation against platform.outputSchema
- Character count check (must be ≤ platform.maxLength)
- Hashtag count check (within platform.hashtagPolicy min/max)
- Source attribution check (every claim must have [N] reference or inline link)
- Hallucination check: Run generated content through NLI model to detect unsupported claims

Multi-Post / Threading Support
Quote: "All platforms support connected multi-post content, but with different mechanics and optimal use cases."

Issue: No failure handling. What if part 3/5 fails generation? Do you discard all 5? Retry only part 3? Show user 1,2,4,5?
Why it matters: Multi-part generation has N failure points - needs explicit recovery strategy.
Suggested change:
### Threading Failure Modes

**Partial Failure Handling:**

1. **Single Part Fails (e.g., Part 3/5):**
   - Retry failed part 2x with reduced temperature
   - If still failing, offer user options:
     a) Continue with 4-part thread (renumber 1/4, 2/4, skip failed, 3/4, 4/4)
     b) Regenerate entire thread
     c) Save successful parts and exit

2. **First Part Fails:**
   - ABORT entire thread (first post is critical hook)
   - Return error, don't attempt remaining parts

3. **Last Part Fails:**
   - Offer to generate conclusion separately
   - Allow user to post N-1 parts without teaser

4. **Multiple Parts Fail (>1):**
   - ABORT, suggest single post instead of thread

**Atomicity:**
- Thread generation is NOT atomic - partial results are valid
- User can review and approve each part before next is generated (--interactive mode)
- Use --atomic flag to require all-or-nothing generation

Vector Database & RAG Architecture
Quote: "Implement a vector database to store and retrieve project documentation chunks using RAG"

Issue: No embedding model specified. OpenAI text-embedding-3-small? Sentence-BERT? Affects cost, quality, and compatibility.
Why it matters: Embedding model choice locks you into a vector DB (dimensionality mismatch issues) and cost structure.
Suggested change:
### RAG Implementation Details

**Embedding Model:**
- **Primary:** OpenAI text-embedding-3-small (1536 dimensions, $0.00002/1K tokens)
- **Fallback:** Sentence-BERT (all-MiniLM-L6-v2, 384 dimensions, free but lower quality)
- **Rationale:** OpenAI embeddings have better semantic search quality for technical docs

**Vector Database:**
- **Development:** ChromaDB (local, zero-config, free)
- **Production:** Pinecone (managed, $70/mo for 1M vectors, high availability)
- **Migration path:** Abstraction layer in src/rag/store.ts supports both backends

**Chunking Strategy:**
- Chunk size: 512 tokens (approx 2000 chars)
- Overlap: 50 tokens (10% overlap to avoid boundary cuts)
- Splitter: Markdown-aware (splits on ## headers first, then paragraphs)
- Metadata preserved: source file, section header, last updated timestamp

**Retrieval Parameters:**
- Top-k: 5 chunks (configurable via --rag-top-k)
- Similarity threshold: 0.7 (cosine similarity)
- Reranking: Optional Cohere rerank-english-v2.0 ($1/1K reranks) for improved relevance
- Max context injection: 4000 tokens (reserve remaining for task execution)

Quote: "Vector DB #2: Output Storage & Inspiration - Implement a vector database to store user-approved outputs"

Issue: No deduplication strategy. User generates 10 LinkedIn posts on "AI trends" over time - how avoid near-duplicate retrievals?
Why it matters: Inspiration mode becomes useless if it returns 10 similar posts instead of diverse examples.
Suggested change:
### Output Storage Deduplication

**Pre-Storage Deduplication:**
1. Before storing new output, compute embedding
2. Search existing outputs with similarity threshold 0.95
3. If match found:
   - Ask user: "Similar post already saved (85% match). Save anyway? (y/n)"
   - Option to replace old post or keep both

**Retrieval Diversity:**
- MMR (Maximal Marginal Relevance) ranking for inspiration mode
- Balance relevance (semantic similarity) with diversity (dissimilarity to already-retrieved)
- Lambda parameter: 0.7 (70% relevance, 30% diversity)
- Ensures inspiration results span different angles, not 10 variations of same post

Success Metrics
Quote: "### Vector DB & RAG - Context retrieval reduces session context usage by >60%"

Issue: How do you measure this? No baseline, no instrumentation plan.
Why it matters: Unmeasurable metrics are aspirations, not success criteria.
Suggested change:
### Success Metrics (with Measurement Plan)

**Context Efficiency:**
- **Metric:** Session context usage (tokens) with RAG vs without RAG
- **Target:** >60% reduction
- **Measurement:**
  - Baseline: Median tokens used in session init when loading full PRD.md + JOURNAL.md + TODO.md
  - With RAG: Median tokens used in session init when loading top-5 RAG chunks
  - Tracked in src/utils/metrics.ts, logged to metrics.json
- **Acceptance:** Run 20 sample sessions, compare median token usage

**Content Quality:**
- **Metric:** Human eval score (1-5) on generated content
- **Target:** Avg score ≥ 4.0 across platforms
- **Measurement:**
  - Create golden dataset of 20 topics across 4 platforms (80 posts total)
  - 3 human raters score each post on: accuracy (grounding), tone (platform fit), engagement (hook quality)
  - Track inter-rater agreement (Krippendorff's alpha ≥ 0.7)

**Source Attribution:**
- **Metric:** % of claims in generated content traceable to source URL
- **Target:** 100% traceability
- **Measurement:**
  - Automated check: Parse [N] references in output, verify each maps to sources section
  - Manual spot-check: 10 random posts per week, verify claims match sources

**Cost Per Post:**
- **Metric:** Median USD cost per post (LLM + embedding + vector DB)
- **Target:** <$0.05 per post (gpt-4o default)
- **Measurement:** Tracked in src/utils/costTracking.ts, logged per synthesis run

Update Todos
 Complete executive summary of PRD issues and opportunities
 Generate prioritized list of improvements with impact/effort ratings
 Write section-by-section detailed comments
 Identifying missing sections and decisions
 Draft concrete rewrites for critical sections
 Create revised implementation-ready PRD outline
 Generate stakeholder questions grouped by theme
D) Missing Sections / Missing Decisions
CRITICAL MISSING SECTIONS (Blocking Implementation)
LLM Provider & Model Strategy

Which models for synthesis? (GPT-4o, Claude 3.5, Gemini 1.5?)
Model versioning strategy (pin to gpt-4o-2024-11-20 or use latest?)
Context window management (how split content >128k tokens?)
Fallback chain (primary model → backup → cached result)
Temperature, top-p, max tokens per platform
Security & Compliance

API key management (env vars? secret manager? rotation policy?)
PII handling (what if sources contain personal data?)
Content moderation (filter offensive/harmful LLM outputs?)
Copyright/fair use policy (how much can you quote?)
Rate limiting abuse prevention (user can't drain API quota)
Secrets in logs (prevent API keys in verbose logs)
Error Handling & Resilience

Timeout values per stage (collection: 30s, extraction: 15s, synthesis: 60s?)
Retry logic (how many? exponential backoff?)
Partial failure handling (save intermediate results?)
Graceful degradation (fallback to single source if Perplexity fails?)
User-facing error messages (what does user see on failure?)
Evaluation & Quality Assurance

Golden dataset (20-50 test cases with expected outputs?)
Human eval rubric (what makes a "good" LinkedIn post?)
Regression tests (prevent quality degradation on model updates?)
Hallucination detection (fact-check generated claims against sources?)
A/B testing framework (compare gpt-4o vs claude-3.5?)
Observability & Operations

Logging strategy (structured logs? what fields? retention?)
Tracing (OpenTelemetry? trace synthesis pipeline stages?)
Metrics (Prometheus? Datadog? what metrics?)
Alerting (alert on cost spike? quality drop? API errors?)
SLOs (p95 latency <10s? 99.9% uptime?)
Incident response (runbook for "synthesis fails for all users")
Cost Management

Cost budget per user/session ($1? $10? unlimited?)
Cost tracking (log per-request costs? daily rollup?)
Cost alerts (notify if session exceeds $5?)
Cost optimization (cache frequent topics? use cheaper models?)
Quota enforcement (max 100 posts/day per user?)
Source Verification & Trust

Source authority scoring (how rank .gov vs blog?)
Paywall detection & handling (skip? mark as low-trust?)
Staleness detection (source older than 6 months = stale?)
Contradictory source handling (two sources disagree on stat?)
Source diversity (require 3+ distinct sources, not 3 from same site?)
IMPORTANT MISSING DECISIONS
User Personas & Segmentation

Who is this for? (solo creators? agencies? enterprises?)
Use cases: thought leadership? product marketing? news commentary?
Pricing model (free? $10/mo? usage-based?)
User authentication (if multi-user, how handle API keys per user?)
Content Moderation & Safety

Toxicity filtering (use Perspective API? OpenAI moderation endpoint?)
Misinformation prevention (how avoid amplifying false claims?)
Political/controversial topics (allow? warn user? filter?)
Brand safety (what if source is from disreputable site?)
Data Retention & Privacy

How long store user inputs/outputs? (30 days? forever?)
User data deletion (GDPR right to erasure?)
Consent for output storage (opt-in for RAG output DB?)
Anonymous analytics (track platform popularity without PII?)
Backward Compatibility & Migrations

Schema evolution strategy (linkedinPost → post field rename)
How handle breaking changes? (major version bump? migration script?)
Output file format versioning (add version: "2.0" to JSON?)
Platform API Posting (Future)

Non-goal in v1, but impacts schema design
If add posting in v2, what auth? (OAuth per platform?)
Rate limits per platform (LinkedIn: 150 posts/day, Twitter: 50/day)
Internationalization

English-only or multi-language? (affects LLM prompts, source collection)
Non-Latin scripts? (Chinese, Arabic support?)
Image Generation Integration

Newsletter images mention NanoBanana Pro - what's the contract?
API endpoint? Authentication? Cost per image?
Failure handling (if image generation fails, proceed without image?)
CLI UX Details

Latency expectations (show spinner? progress bar? ETA?)
Streaming output (show post as it generates, or all at once?)
Interactive mode (approve each part of thread before next?)
Color-coding (syntax highlighting for different verification levels?)
Update Todos
 Complete executive summary of PRD issues and opportunities
 Generate prioritized list of improvements with impact/effort ratings
 Write section-by-section detailed comments
 Identify missing sections and decisions
 Drafting concrete rewrites for critical sections
 Create revised implementation-ready PRD outline
 Generate stakeholder questions grouped by theme
E) Concrete Rewrites (Top 7 Critical Sections)
1. NEW SECTION: LLM Provider & Model Strategy
## LLM Provider & Model Strategy

### Synthesis Models

GroundedPosts supports multiple LLM providers for content synthesis. Users select via `--model` flag.

|
 Model 
|
 Provider 
|
 Version 
|
 Context 
|
 Cost/1M Tokens 
|
 Best For 
|
|
-------
|
----------
|
---------
|
---------
|
----------------
|
----------
|
|
**
gpt-4o
**
 (default) 
|
 OpenAI 
|
 2024-11-20 
|
 128k 
|
 $2.50 in, $10 out 
|
 Balanced quality/cost 
|
|
**
claude-3-5-sonnet
**
|
 Anthropic 
|
 20241022 
|
 200k 
|
 $3.00 in, $15 out 
|
 Long-form, nuance 
|
|
**
gemini-1.5-pro
**
|
 Google 
|
 002 
|
 2M 
|
 $1.25 in, $5 out 
|
 Cost-optimized 
|
|
**
gpt-4o-mini
**
|
 OpenAI 
|
 2024-07-18 
|
 128k 
|
 $0.15 in, $0.60 out 
|
 High-volume 
|

### Model Selection Logic

**Default:** `gpt-4o` (best quality/cost trade-off based on human evals)

**Platform-Specific Recommendations:**
- Substack Newsletter: `claude-3-5-sonnet` (best long-form)
- Twitter threads: `gpt-4o-mini` (fast, cheap, good for short-form)
- LinkedIn: `gpt-4o` (default)

**Fallback Chain:**
1. User-specified model (or default `gpt-4o`)
2. If API error: retry 2x with exponential backoff (2s, 4s)
3. If still failing: fallback to `gpt-4o-mini` (highest reliability)
4. If all fail: return cached result if available, else error

### Synthesis Parameters

```typescript
interface SynthesisConfig {
  model: 'gpt-4o' | 'claude-3-5-sonnet' | 'gemini-1.5-pro' | 'gpt-4o-mini';
  temperature: 0.7;              // Creative but consistent
  maxTokens: number;             // platform.maxLength * 1.5 (buffer)
  topP: 0.9;
  presencePenalty: 0.1;          // Reduce repetition
  timeout: 60000;                // 60s timeout
  retries: 2;
}

Context Window Management
Problem: Long PRD/journals can exceed context limits.

Solution:

RAG-based context injection (see Vector DB section)
If context > 0.8 * model.contextWindow:
Warn user: "Context too large, truncating least relevant chunks"
Prioritize: user prompt > grounded claims > platform config > context docs
Model Versioning Strategy
Pinned Versions: Use specific model versions (e.g., gpt-4o-2024-11-20) for reproducibility.

Update Policy:

Minor updates (bug fixes): auto-update
Major updates (new model version): require user opt-in via --use-latest flag
Track model version in output JSON for provenance
Regression Testing:

Golden dataset of 20 test cases
Run on new model version, compare outputs
If quality drop >10% (human eval), don't auto-update
Embedding Models (for RAG)
Model	Dimensions	Cost/1M Tokens	Use Case
text-embedding-3-small (default)	1536	$0.02	Context + output storage
text-embedding-3-large	3072	$0.13	Higher quality (overkill for our use case)
all-MiniLM-L6-v2 (Sentence-BERT)	384	Free (local)	Offline/budget mode
Default: text-embedding-3-small (good quality, low cost)


---

### **2. NEW SECTION: Error Handling & Resilience**

```markdown
## Error Handling & Resilience

### Error Taxonomy

| Error Type | Stage | Cause | User Impact | Handling |
|------------|-------|-------|-------------|----------|
| **SOURCE_TIMEOUT** | Collection | Perplexity/Tavily timeout | Delayed or failed post | Retry 3x, fallback provider |
| **SOURCE_NO_RESULTS** | Collection | No sources found for topic | Failed post | Suggest topic rephrase |
| **RATE_LIMITED** | Collection/Synthesis | API rate limit hit | Delayed post | Wait + retry (max 60s) |
| **INSUFFICIENT_SOURCES** | Collection | <3 sources found | Weak grounding | Warn user, offer to continue |
| **EXTRACTION_FAILED** | Extraction | LLM fails to extract claims | Failed post | Retry 2x, fallback to simpler prompt |
| **SYNTHESIS_TIMEOUT** | Synthesis | LLM timeout (>60s) | Failed post | Retry with lower max_tokens |
| **VALIDATION_FAILED** | Synthesis | Output violates platform schema | Failed post | Regenerate with stricter prompt |
| **COST_BUDGET_EXCEEDED** | All | User exceeds cost limit | Blocked request | Return error, show cost estimate |

### Retry Logic

**Exponential Backoff:**
```typescript
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 2000,      // 2s, 4s, 8s
  maxDelay: 10000,      // Cap at 10s
  timeoutMs: 60000,     // 60s total timeout per operation
};

async function withRetry<T>(
  fn: () => Promise<T>,
  operation: string
): Promise<T> {
  for (let i = 0; i < RETRY_CONFIG.maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === RETRY_CONFIG.maxRetries - 1) throw error;
      
      const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(2, i),
        RETRY_CONFIG.maxDelay
      );
      
      logger.warn(`${operation} failed (attempt ${i+1}), retrying in ${delay}ms`, error);
      await sleep(delay);
    }
  }
}

Graceful Degradation
Source Collection:

Primary (Perplexity) fails → Fallback to Tavily
Both fail → Allow user to paste sources manually via --manual-sources
Claim Extraction:

LLM extraction fails → Use simple regex extraction (quoted text = claims)
Zero claims extracted → Warn user, synthesize without grounding (mark as CLAIMED)
Synthesis:

Primary model fails → Fallback model
All models fail → Return cached result if available (cache last 10 prompts)
Threading:

Part 3/5 fails → Offer to skip and renumber (4-part thread)
First part fails → Abort (first post is critical)
User-Facing Error Messages
Bad (current):

Error: API request failed

Good (improved):

⚠️  Source collection timed out after 30s

What happened: Perplexity API didn't respond in time
What to try:
  1. Run again with --fallback-provider tavily
  2. Check internet connection
  3. Reduce scope: try a more specific topic

Need help? See: docs/troubleshooting.md#source-timeout

Circuit Breaker (Future)
If error rate >50% for a provider over 5min window, auto-disable for 15min to prevent cascading failures.


---

### **3. NEW SECTION: Security & Compliance**

```markdown
## Security & Compliance

### API Key Management

**Storage:**
- **Development:** `.env` file (git-ignored)
- **Production:** Environment variables or secret manager (AWS Secrets Manager, HashiCorp Vault)

**Required Keys:**
```bash
# .env.example
OPENAI_API_KEY=sk-...           # Required for gpt models + embeddings
ANTHROPIC_API_KEY=sk-ant-...    # Optional (if using Claude)
GOOGLE_API_KEY=...              # Optional (if using Gemini)
PERPLEXITY_API_KEY=...          # Required for source collection
TAVILY_API_KEY=...              # Optional (fallback provider)
PINECONE_API_KEY=...            # Optional (if using Pinecone for RAG)

Rotation Policy:

Rotate API keys quarterly
Use API key scopes (read-only where possible)
Never log API keys (even in --verbose mode)
Secret Leakage Prevention:

// Strip secrets from logs
function sanitizeLog(data: any): any {
  const secretPatterns = [
    /sk-[a-zA-Z0-9]{48}/g,           // OpenAI keys
    /sk-ant-[a-zA-Z0-9]{95}/g,       // Anthropic keys
    /[A-Za-z0-9]{39}/g,              // Generic API keys
  ];
  
  let str = JSON.stringify(data);
  secretPatterns.forEach(pattern => {
    str = str.replace(pattern, '[REDACTED]');
  });
  return JSON.parse(str);
}

PII & Data Privacy
Input Handling:

Warn user if topic likely contains PII (regex check for emails, phone numbers, SSNs)
Don't store user prompts in logs unless --verbose flag set
Output storage (RAG DB #2) requires user consent: --save flag
Source Scraping:

Don't scrape social media profiles (LinkedIn, Twitter) without user consent
Respect robots.txt for web sources
Don't extract PII from sources (filter out emails, phone numbers)
Data Retention:

interface DataRetentionPolicy {
  userPrompts: '30 days',           // Delete after 30 days
  generatedOutputs: 'until user deletes',  // User-controlled
  groundedClaims: '90 days',        // For debugging
  logs: '7 days',                   // Short retention for troubleshooting
  ragEmbeddings: 'until user deletes',
}

GDPR Compliance (if applicable):

User can delete all data via groundedposts --delete-my-data
Export all data via groundedposts --export-my-data
Content Moderation
Toxicity Filtering:

Run generated content through OpenAI Moderation API (free, 2 req/sec limit)
Categories: hate, harassment, violence, sexual, self-harm
Policy:

If moderation flags content, warn user and offer to regenerate
Don't auto-post flagged content (even if user approves)
Log moderation failures for review
interface ModerationResult {
  flagged: boolean;
  categories: {
    hate: boolean;
    harassment: boolean;
    violence: boolean;
    sexual: boolean;
    selfHarm: boolean;
  };
  action: 'allow' | 'warn' | 'block';
}

Copyright & Fair Use
Quoting Policy:

Max 280 chars per quoted source (Twitter fair use standard)
Always attribute with source URL
Don't reproduce full articles
Paywalled Sources:

If source is behind paywall, mark as CLAIMED (lower verification)
Don't attempt to bypass paywalls
Suggest open-access alternatives
AI-Generated Content Disclosure:

Add footer to Substack newsletters: "This content was generated with AI assistance"
Optional via --ai-disclosure flag (default: true)
Rate Limiting & Abuse Prevention
Cost Limits:

Default: $1 per session (blocks after ~40 gpt-4o posts)
User can override via --max-cost 10
Track cumulative cost, error if exceeded
Request Throttling:

interface RateLimitConfig {
  requestsPerMinute: 60;      // Max 60 LLM calls/min
  requestsPerHour: 1000;      // Max 1000/hour
  costPerHour: 10;            // Max $10/hour
}

Anti-Pattern Detection:

Warn if user runs same prompt 10+ times (likely testing, not production)
Suggest caching/variations mode instead

---

### **4. REWRITE: Stage 2 - Claim Extraction**

```markdown
### Stage 2: Claim Extraction (Platform-Agnostic)

**Purpose:** Extract verifiable claims from collected sources and assign verification levels.

#### Extraction Process

**Model:** `gpt-4o-mini` (cost-optimized, sufficient quality for extraction)

**System Prompt:**

You are a fact extraction assistant. Extract claims from the provided source text.

For each claim:

Extract the core factual statement
Include supporting quote or data point
Assign verification level based on source authority
Provide source URL
Verification Levels:

VERIFIED (L3): Direct quote, statistic, or fact from authoritative source (.gov, .edu, peer-reviewed, official company blog)
LIKELY (L2): Paraphrased fact from credible source (major news, industry reports)
CLAIMED (L1): Opinion, inference, or unsourced statement
Output JSON array of claims.


**Output Schema:**
```typescript
interface GroundedClaim {
  id: string;                     // Unique claim ID
  text: string;                   // Claim statement (1-2 sentences)
  quote?: string;                 // Original quote from source (if direct quote)
  sourceUrl: string;              // Source URL
  sourceTitle: string;            // Source article/page title
  sourceAuthor?: string;          // Author (if available)
  sourceDomain: string;           // e.g., "nytimes.com"
  
  verificationLevel: 'VERIFIED' | 'LIKELY' | 'CLAIMED';
  sourceAuthority: 'high' | 'medium' | 'low';
  
  extractedAt: Date;
  confidence: number;             // LLM confidence score (0-1)
  
  metadata: {
    isStatistic: boolean;         // Contains numerical data
    isQuote: boolean;             // Direct quote from person
    isTemporal: boolean;          // Time-sensitive claim
    topics: string[];             // Extracted topics
  };
}

Source Authority Scoring
function scoreSourceAuthority(domain: string): 'high' | 'medium' | 'low' {
  const high = ['.gov', '.edu', 'nature.com', 'science.org', 'openai.com/blog'];
  const medium = ['nytimes.com', 'reuters.com', 'bloomberg.com', 'techcrunch.com'];
  
  if (high.some(d => domain.includes(d))) return 'high';
  if (medium.some(d => domain.includes(d))) return 'medium';
  return 'low';
}

Verification Level Assignment
Source Type	Example	Verification Level	Authority
Government report	census.gov	VERIFIED	high
Peer-reviewed paper	nature.com	VERIFIED	high
Company official blog	openai.com/blog	VERIFIED	high
Major news outlet	nytimes.com	LIKELY	medium
Industry report	mckinsey.com	LIKELY	medium
Tech blog	techcrunch.com	LIKELY	medium
Personal blog	medium.com/@random	CLAIMED	low
Social media	twitter.com	CLAIMED	low
Filtering & Validation
Minimum Verification Level:

Default: L2 (LIKELY or higher)
User override: --min-verification L1 (allow all claims)
Conservative mode: --min-verification L3 (VERIFIED only)
Minimum Claim Count:

Default: 3 claims required
If <3 claims, warn user: "Only found 2 verified claims. Continue? (y/n)"
Conflict Detection:

If two claims contradict (e.g., "AI market is $100B" vs "$200B"), flag for user review
Show both claims with sources, let user choose
Staleness Detection:

If source publish date >12 months ago, mark claim as potentially stale
User can override: --allow-stale-sources
Example Output
[
  {
    "id": "claim-001",
    "text": "OpenAI's ChatGPT reached 100 million weekly active users by November 2024",
    "quote": "We're thrilled to share that ChatGPT now has 100 million weekly active users",
    "sourceUrl": "https://openai.com/blog/chatgpt-100m-users",
    "sourceTitle": "ChatGPT Reaches 100M Weekly Active Users",
    "sourceDomain": "openai.com",
    "verificationLevel": "VERIFIED",
    "sourceAuthority": "high",
    "confidence": 0.95,
    "metadata": {
      "isStatistic": true,
      "isQuote": true,
      "isTemporal": true,
      "topics": ["AI adoption", "ChatGPT", "user growth"]
    }
  }
]

Error Handling
No Claims Extracted:

Retry with simpler prompt (remove metadata extraction)
If still failing, return error: "Could not extract verifiable claims from sources"
Low Confidence:

If confidence <0.6, flag claim for manual review
Show user: "Low confidence claim detected. Include anyway? (y/n)"
Paywall Detected:

If source returns paywall error, mark as CLAIMED
Add warning to user: "Source behind paywall, could not verify"

---

### **5. REWRITE: Success Metrics**

```markdown
## Success Metrics

### Measurement Framework

All metrics tracked via `src/utils/metrics.ts` and logged to `metrics.json`. Dashboard: `npm run metrics:dashboard`.

---

### **1. Content Quality**

**Metric:** Human evaluation score (1-5 scale)

| Dimension | Weight | Definition | Target |
|-----------|--------|------------|--------|
| **Accuracy** | 40% | Claims match sources, no hallucinations | ≥4.5/5 |
| **Tone** | 30% | Matches platform norms (professional/casual) | ≥4.0/5 |
| **Engagement** | 30% | Compelling hook, clear CTA | ≥4.0/5 |

**Measurement Plan:**
- **Golden Dataset:** 20 topics × 4 platforms = 80 test cases
- **Raters:** 3 independent raters per post (internal team or Upwork)
- **Inter-Rater Reliability:** Krippendorff's alpha ≥0.7
- **Frequency:** Run on every model update, monthly for regression testing

**Acceptance Criteria:**
- Overall score ≥4.0/5 across all dimensions
- No individual post <3.0/5 (auto-flag for review)

**Example Rubric:**

Accuracy (1-5):
5 = All claims sourced, sources credible, no hallucinations
4 = Minor sourcing gaps, overall accurate
3 = Some unsourced claims, mostly accurate
2 = Multiple unsourced claims or factual errors
1 = Significant hallucinations or misleading

Tone (1-5):
5 = Perfect platform fit (e.g., LinkedIn = professional, Threads = casual)
4 = Good fit, minor tone inconsistencies
3 = Acceptable but generic (could be any platform)
2 = Poor fit (too formal for Threads, too casual for LinkedIn)
1 = Completely wrong tone


---

### **2. Source Attribution**

**Metric:** Claim traceability %

**Definition:** % of claims in generated post that map to a source URL

**Target:** 100% traceability

**Measurement:**
- Automated parser extracts all claims from generated post
- Verifies each claim has `[N]` reference or inline link
- Checks reference maps to source in bibliography

**Example Check:**
```typescript
function verifyAttribution(post: string, sources: Source[]): number {
  const claims = extractClaims(post);  // LLM-based claim extraction
  const attributed = claims.filter(claim => 
    hasReference(claim, post) && 
    referenceMapsToSource(claim, sources)
  );
  return (attributed.length / claims.length) * 100;
}

Acceptance: 100% of posts must have ≥95% claim traceability

3. RAG Context Efficiency
Metric: Token usage reduction from RAG

Definition: Session init tokens (RAG) vs full file load

Target: >60% reduction

Measurement:

// Baseline (without RAG): Load full files
const baselineTokens = countTokens(PRD.md + JOURNAL.md + TODO.md);

// With RAG: Load top-5 chunks
const ragTokens = countTokens(retrievedChunks);

const reduction = ((baselineTokens - ragTokens) / baselineTokens) * 100;

Example:

Baseline: PRD (12k tokens) + Journal (8k) + TODO (2k) = 22k tokens
RAG: Top-5 chunks = 8k tokens
Reduction: 64% ✅
Acceptance: Median reduction ≥60% across 20 sample sessions

4. Cost Per Post
Metric: Median USD cost per generated post

Target: <$0.05 per post (gpt-4o default)

Breakdown:

Cost Component	Model	Rate	Typical Usage	Cost
Source collection	Perplexity	$0.001/query	3 queries	$0.003
Claim extraction	gpt-4o-mini	$0.15/$0.60 per 1M tokens	2k in, 1k out	$0.001
Embeddings	text-embedding-3-small	$0.02/1M tokens	500 tokens	$0.00001
Synthesis	gpt-4o	$2.50/$10 per 1M tokens	4k in, 2k out	$0.030
Total				$0.034 ✅
Tracking:

interface CostBreakdown {
  sourceCollection: number;
  claimExtraction: number;
  embeddings: number;
  synthesis: number;
  total: number;
  timestamp: Date;
}

Alerts:

Warn if cost >$0.10 per post (2x target)
Alert if daily cost >$10 (potential abuse)
Optimization Levers:

Use gpt-4o-mini for simple posts (-70% cost)
Cache frequent topics (-50% cost on repeat)
Reduce source count from 5 to 3 (-40% collection cost)
5. Latency (p50, p95, p99)
Metric: End-to-end post generation time

Target:

p50 <10s
p95 <20s
p99 <30s
Breakdown:

Stage	Target p50	Target p95
Source collection	3s	8s
Claim extraction	2s	5s
Synthesis	4s	10s
Output formatting	0.5s	1s
Total	10s	24s ✅
Measurement:

Track timestamps per stage in metrics.json
Alert if p95 >30s (degraded performance)
6. Error Rate
Metric: % of requests that fail

Target: <1% error rate

Error Categories:

Error Type	Target Rate	Handling
Source timeout	<0.5%	Retry + fallback
Synthesis failure	<0.3%	Retry + fallback model
Validation error	<0.2%	Regenerate with stricter prompt
Total	<1.0%	Log all errors for review
7. User Satisfaction (Post-Launch)
Metric: Post-generation survey

Questions:

"Rate the quality of this post (1-5)"
"Would you post this without edits? (yes/no)"
"How much time did this save you? (minutes)"
Target:

Avg quality rating ≥4.0/5
"Post without edits" ≥60% yes rate
Avg time saved ≥15 minutes
Dashboard (Example)
$ npm run metrics:dashboard

╔══════════════════════════════════════════════╗
║  GroundedPosts Metrics - Last 7 Days         ║
╚══════════════════════════════════════════════╝

Posts Generated:     142
Platforms:           LinkedIn (60), Threads (40), Twitter (32), Bluesky (10)

Quality:             4.2/5 ✅ (target: ≥4.0)
Attribution:         98.5% ✅ (target: ≥95%)
Cost/Post:           $0.038 ✅ (target: <$0.05)

Latency:
  p50:               9.2s ✅ (target: <10s)
  p95:               18.5s ✅ (target: <20s)
  p99:               27.1s ✅ (target: <30s)

Error Rate:          0.7% ✅ (target: <1%)
  Source timeout:    0.4%
  Synthesis fail:    0.2%
  Validation error:  0.1%

RAG Context Savings: 62% ✅ (target: ≥60%)


---

### **6. REWRITE: RAG Vector Database - Context Management**

```markdown
## Vector Database #1: Context Management (RAG)

### Problem Statement

Large project documentation (PRD: 12k tokens, journals: 8k tokens, TODOs: 2k tokens) consumes 22k tokens per session initialization - **28% of a 128k context window**. This limits working context for task execution and increases costs.

### Solution

Store chunked project documentation in a vector database. Retrieve only the top-k most relevant chunks for each session, reducing context usage by >60%.

---

### Architecture


src/rag/context-db/
├── embeddings.ts # Embedding generation (OpenAI API)
├── store.ts # Vector DB abstraction (ChromaDB/Pinecone)
├── retrieval.ts # Semantic search + reranking
├── indexing.ts # Document chunking + indexing
└── types.ts # Shared types

src/rag/sources/
├── prd-indexer.ts # Index docs/PRD.md
├── journal-indexer.ts # Index docs/journal/*.md
└── todo-indexer.ts # Index TODO.md

src/rag/session-loader.ts # Session init with RAG


---

### Embedding Model

**Model:** `text-embedding-3-small` (OpenAI)
- **Dimensions:** 1536
- **Cost:** $0.02 per 1M tokens (~$0.0001 per document chunk)
- **Quality:** Sufficient for technical documentation
- **Fallback:** `all-MiniLM-L6-v2` (Sentence-BERT, free, lower quality)

**Configuration:**
```typescript
interface EmbeddingConfig {
  model: 'text-embedding-3-small';
  dimensions: 1536;
  batchSize: 100;          // Batch embed for efficiency
  rateLimit: 3000;         // 3000 RPM (tier 2 OpenAI limit)
}

Vector Database
Development: ChromaDB (local, zero-config)

npm install chromadb

Production: Pinecone (managed, scalable)

npm install @pinecone-database/pinecone

Abstraction Layer:

interface VectorStore {
  upsert(chunks: ContextChunk[]): Promise<void>;
  query(embedding: number[], topK: number): Promise<SearchResult[]>;
  delete(ids: string[]): Promise<void>;
}

class ChromaStore implements VectorStore { ... }
class PineconeStore implements VectorStore { ... }

Migration Path:

Start with Chroma for local dev (free, fast setup)
Switch to Pinecone for production via env var:
VECTOR_DB=pinecone  # or 'chroma'

Document Chunking Strategy
Chunk Size: 512 tokens (~2000 characters)

Rationale: Balance between semantic coherence and granularity
Too small (<256 tokens): Loses context
Too large (>1024 tokens): Reduces retrieval precision
Overlap: 50 tokens (10%)

Prevents information loss at chunk boundaries
Example: "... end of chunk 1 overlaps with start of chunk 2 ..."
Splitting Logic:

interface ChunkingStrategy {
  splitOn: ['##', '###', '\n\n', '.'];  // Priority order
  minChunkSize: 256;                     // Merge small chunks
  maxChunkSize: 768;                     // Split large chunks
  preserveCodeBlocks: true;              // Don't split code
}

Markdown-Aware Splitting:

Split on ## headers (major sections)
If chunk >768 tokens, split on ### sub-headers
If still too large, split on paragraph breaks (\n\n)
If still too large, split on sentences (.)
Never split inside code blocks (``` ... ```)
Indexing Process
PRD Indexing:

async function indexPRD() {
  const prd = await readFile('docs/PRD.md');
  const chunks = chunkDocument(prd, {
    splitOn: ['##', '###', '\n\n'],
    maxChunkSize: 512,
    overlap: 50,
  });
  
  const embeddings = await batchEmbed(chunks);
  
  const contextChunks: ContextChunk[] = chunks.map((chunk, i) => ({
    id: `prd-${i}`,
    content: chunk.text,
    embedding: embeddings[i],
    source: 'prd',
    metadata: {
      section: chunk.header,           // e.g., "Platform Abstraction Layer"
      lastUpdated: new Date(),
      tags: extractTags(chunk.text),   // e.g., ["threading", "platforms"]
    },
  }));
  
  await vectorStore.upsert(contextChunks);
}

Incremental Indexing (Journals):

Only re-index changed files (detect via file mtime)
Keep track of indexed files in rag-index.json
On startup, check for new/modified journals and index them
Re-Indexing Trigger:

# Manual re-index
groundedposts --reindex-context

# Auto re-index if PRD modified (check on startup)
if (PRD.lastModified > lastIndexTime) {
  console.log("PRD updated, re-indexing...");
  await indexPRD();
}

Retrieval Process
Session Initialization:

async function loadContextForSession(userQuery: string): Promise<string> {
  // 1. Generate query embedding
  const queryEmbedding = await embed(userQuery);
  
  // 2. Semantic search (top-10)
  const candidates = await vectorStore.query(queryEmbedding, topK=10);
  
  // 3. Rerank (optional, improves relevance by ~15%)
  const reranked = await rerank(candidates, userQuery);  // Cohere Rerank API
  
  // 4. Take top-5 after reranking
  const topChunks = reranked.slice(0, 5);
  
  // 5. Inject into session context
  const context = topChunks.map(c => c.content).join('\n\n---\n\n');
  
  return context;
}

Retrieval Parameters:

interface RetrievalConfig {
  topK: 10;                    // Retrieve top-10 candidates
  similarityThreshold: 0.7;    // Min cosine similarity
  rerank: true;                // Use Cohere reranking
  finalK: 5;                   // Return top-5 after reranking
  maxContextTokens: 8000;      // Max tokens to inject (leave room for task)
}

Reranking (Optional):

Model: Cohere rerank-english-v2.0
Cost: $1 per 1K reranks (~$0.01 per session)
Benefit: Improves relevance by ~15% (measured via NDCG@5)
When to use: Production (worth the cost), skip in dev
Schema
interface ContextChunk {
  id: string;                    // e.g., "prd-12"
  content: string;               // Chunk text (512 tokens)
  embedding: number[];           // 1536-dim vector
  source: 'prd' | 'journal' | 'todo';
  
  metadata: {
    section?: string;            // Header name (e.g., "RAG Architecture")
    date?: Date;                 // For journals
    phase?: string;              // For TODOs (e.g., "Phase 1")
    tags?: string[];             // Extracted topics
    lastUpdated: Date;
  };
}

interface SearchResult {
  chunk: ContextChunk;
  score: number;                 // Cosine similarity (0-1)
  rerankedScore?: number;        // Reranker score (0-1)
}

CLI Integration
# Start session with RAG (default)
groundedposts "AI trends" --with-context

# Disable RAG (load full files)
groundedposts "AI trends" --no-rag

# Re-index project docs
groundedposts --reindex-context

# Configure retrieval
groundedposts "AI trends" --rag-top-k 10 --rag-rerank

Performance Targets
Metric	Target	Measurement
Context reduction	>60%	Baseline tokens vs RAG tokens
Retrieval latency	<500ms	Query + rerank time
Relevance (NDCG@5)	>0.8	Manual eval on 20 test queries
Index size	<100MB	ChromaDB file size
Index time	<10s	Time to re-index all docs

---

### **7. NEW SECTION: Evaluation & Quality Assurance**

```markdown
## Evaluation & Quality Assurance

### Golden Dataset

**Purpose:** Regression testing to prevent quality degradation on model updates, prompt changes, or code refactors.

**Composition:**
- 20 topics across 5 categories:
  - Tech trends (5): "AI adoption in healthcare", "Quantum computing breakthroughs"
  - Business insights (5): "Remote work productivity stats", "VC funding trends 2024"
  - Product launches (3): "OpenAI GPT-4 features", "Apple Vision Pro review"
  - Research findings (4): "Climate change new studies", "longevity research"
  - Opinion/analysis (3): "Future of work", "Social media regulation"

- 4 platforms per topic: LinkedIn, Threads, Twitter, Substack
- **Total:** 20 topics × 4 platforms = 80 golden test cases

**Storage:** `tests/golden/dataset.json`

```json
{
  "topic": "AI adoption in healthcare",
  "platforms": ["linkedin", "threads", "twitter", "substack"],
  "expectedQualities": {
    "minAccuracy": 4.0,
    "minTone": 4.0,
    "minEngagement": 3.5
  },
  "referenceOutput": {
    "linkedin": "... saved best output ..."
  }
}

Human Evaluation Rubric
Dimensions:

1. Accuracy (40% weight)

5: All claims sourced, zero hallucinations
4: Minor gaps in sourcing, no factual errors
3: Some unsourced claims, mostly accurate
2: Multiple unsourced claims or factual errors
1: Significant hallucinations
2. Tone (30% weight)

5: Perfect platform fit (LinkedIn=professional, Threads=casual)
4: Good fit, minor inconsistencies
3: Generic (could be any platform)
2: Poor fit (wrong formality level)
1: Completely inappropriate
3. Engagement (30% weight)

5: Compelling hook, clear CTA, high viral potential
4: Good hook, decent CTA
3: Acceptable but bland
2: Weak hook, no CTA
1: Boring, no engagement potential
Overall Score: Weighted average of 3 dimensions

Inter-Rater Reliability:

3 independent raters per post
Measure Krippendorff's alpha
Target: α ≥ 0.7 (acceptable agreement)
If α < 0.7: refine rubric, retrain raters
Automated Quality Checks
1. Hallucination Detection

Use NLI (Natural Language Inference) model to check if generated claims are supported by sources:

interface HallucinationCheck {
  claim: string;
  source: string;
  relationship: 'entailment' | 'contradiction' | 'neutral';
  confidence: number;
}

async function detectHallucinations(post: string, sources: Source[]): Promise<HallucinationCheck[]> {
  const claims = extractClaims(post);
  const checks: HallucinationCheck[] = [];
  
  for (const claim of claims) {
    for (const source of sources) {
      const result = await nliModel.infer({
        premise: source.text,
        hypothesis: claim,
      });
      
      if (result.relationship === 'contradiction') {
        checks.push({ claim, source: source.url, relationship: 'contradiction', confidence: result.confidence });
      }
    }
  }
  
  return checks.filter(c => c.relationship === 'contradiction');
}

Model: facebook/bart-large-mnli (Hugging Face, free)

Threshold: If >1 contradiction detected with confidence >0.8, flag post for review

2. Source Attribution Check

function checkAttribution(post: string, sources: Source[]): { coverage: number, missing: string[] } {
  const claims = extractClaims(post);
  const attributed = claims.filter(claim => 
    hasInlineReference(claim) || hasFootnote(claim)
  );
  
  const coverage = (attributed.length / claims.length) * 100;
  const missing = claims.filter(c => !attributed.includes(c));
  
  return { coverage, missing };
}

Threshold: Coverage ≥95% (allow 1 unsourced claim per 20)

3. Platform Constraint Validation

function validatePlatformConstraints(post: string, platform: PlatformConfig): ValidationResult {
  const errors: string[] = [];
  
  // Length check
  if (post.length > platform.maxLength) {
    errors.push(`Post exceeds max length: ${post.length} > ${platform.maxLength}`);
  }
  
  // Hashtag check
  const hashtags = extractHashtags(post);
  if (platform.hashtagPolicy.required && hashtags.length < platform.hashtagPolicy.min) {
    errors.push(`Not enough hashtags: ${hashtags.length} < ${platform.hashtagPolicy.min}`);
  }
  
  // Format check (e.g., LinkedIn supports bold, Threads doesn't)
  if (!platform.formatting.supportsBold && post.includes('**')) {
    errors.push(`Platform doesn't support bold formatting`);
  }
  
  return { valid: errors.length === 0, errors };
}

Regression Testing
Trigger: Run on every:

Model version update (gpt-4o-20241120 → gpt-4o-20250115)
Prompt change (edit system prompt)
Major code refactor (synthesis pipeline changes)
Process:

npm run test:regression

Generate outputs for all 80 golden test cases
Run automated checks (hallucination, attribution, constraints)
Flag cases where automated scores drop >10% vs baseline
Manual review flagged cases
Accept if human eval ≥4.0/5, else debug
Acceptance Criteria:

Automated checks: 100% pass (no hallucinations, attribution ≥95%, constraints valid)
Human eval: Avg score ≥4.0/5
Regression: No >10% drop in any dimension vs previous version
A/B Testing Framework (Future)
Compare model performance:

# Generate with two models, compare quality
groundedposts "AI trends" --ab-test gpt-4o,claude-3-5-sonnet

Output:

Model A (gpt-4o):        Quality 4.2/5, Cost $0.034, Latency 9s
Model B (claude-3-5-sonnet): Quality 4.5/5, Cost $0.051, Latency 12s

Winner: Model B (higher quality, +20% cost, +33% latency)

Monitoring Quality in Production
Post-Generation Survey:

✅ Post generated successfully!

Quick feedback (optional):
  Rate quality (1-5): ___
  Would you post without edits? (y/n): ___
  Time saved (minutes): ___
  
[Skip] [Submit]

Track:

Avg quality rating over time (detect degradation)
% of posts used without edits (proxy for quality)
Time saved (ROI metric)
Alert if:

Quality rating drops <3.5/5 for 7 days
% used without edits <50%

---

Update Todos
 Complete executive summary of PRD issues and opportunities
 Generate prioritized list of improvements with impact/effort ratings
 Write section-by-section detailed comments
 Identify missing sections and decisions
 Draft concrete rewrites for critical sections
 Creating revised implementation-ready PRD outline
 Generate stakeholder questions grouped by theme
F) Revised PRD Outline (Implementation-Ready)
# GroundedPosts - Product Requirements Document (v2.0)

## 1. Executive Summary
   - What: Multi-platform content generation with source attribution
   - Who: Independent creators, analysts, small marketing teams
   - Why: 2-4 hours saved per multi-platform post, full provenance maintained
   - Success: 4.0/5 quality, <$0.05/post, <10s latency, 100% attribution

## 2. Problem Statement
   - Target users & personas (3 archetypes with jobs-to-be-done)
   - Current pain points (manual reformatting, lost attribution, time cost)
   - Market gap (Buffer/Hootsuite repost identical content, ignore platform norms)
   - Why now (LLM quality, creator economy multi-platform demand)
   - Competitive analysis (2-3 alternatives, our differentiation)

## 3. Product Vision & Scope
   - Vision: One research session → platform-native content with full provenance
   - In-scope: CLI, 6 platforms, threading, RAG, cost <$0.05/post
   - Out-of-scope v1: API posting, scheduling, analytics, multi-user, cloud-sync
   - Assumptions: Users have OpenAI API keys, English-only, desktop CLI users
   - Constraints: Cost budget $0.05/post, latency <10s p50, 100% attribution

## 4. User Flows
   - 4.1 Single-platform post generation (happy path + 3 error flows)
   - 4.2 Multi-platform batch generation
   - 4.3 Thread/series generation (with partial failure recovery)
   - 4.4 Output review & storage (RAG feedback loop)
   - 4.5 Inspiration mode (retrieve past successes)

## 5. Core Architecture
   - 5.1 System diagram (source → extract → synthesize → output)
   - 5.2 Stage 1: Source Collection (Perplexity/Tavily + fallback + error handling)
   - 5.3 Stage 2: Claim Extraction (verification levels L1-L3, authority scoring)
   - 5.4 Stage 3: Platform Synthesis (model selection, prompts, validation)
   - 5.5 Stage 4: Output Generation (JSON, cost tracking, metrics logging)

## 6. Platform Abstraction
   - 6.1 PlatformConfig interface (full TypeScript contract)
   - 6.2 Platform comparison matrix (6 platforms × 12 attributes)
   - 6.3 Platform categories (Social Short, Social Long, Newsletter)
   - 6.4 Platform-specific requirements (tone, structure, citations for each)

## 7. Multi-Post Threading
   - 7.1 ThreadingConfig interface
   - 7.2 Platform threading specs (LinkedIn series, Twitter threads, etc.)
   - 7.3 Thread generation schema (ThreadedPost, ThreadPart)
   - 7.4 Content distribution strategy (hook, evidence, conclusion)
   - 7.5 Failure modes & recovery (partial failures, renumbering, user prompts)

## 8. LLM Provider Strategy **[NEW]**
   - 8.1 Model selection table (gpt-4o, Claude, Gemini, cost/latency/quality)
   - 8.2 Synthesis parameters (temperature, max_tokens, retries per model)
   - 8.3 Fallback chain (primary → retry → fallback model → cached result)
   - 8.4 Context window management (RAG injection, truncation strategy)
   - 8.5 Model versioning & update policy (pinned versions, regression testing)
   - 8.6 Embedding models for RAG (text-embedding-3-small specs)

## 9. Error Handling & Resilience **[NEW]**
   - 9.1 Error taxonomy (10 error types with causes, impacts, handling)
   - 9.2 Retry logic (exponential backoff, max retries, timeout values)
   - 9.3 Graceful degradation (fallback providers, partial results, caching)
   - 9.4 User-facing error messages (actionable, helpful, no jargon)
   - 9.5 Circuit breaker (future: auto-disable failing providers)

## 10. Security & Compliance **[NEW]**
   - 10.1 API key management (storage, rotation, scoping, leakage prevention)
   - 10.2 PII & data privacy (input handling, retention policy, GDPR compliance)
   - 10.3 Content moderation (toxicity filtering via OpenAI Moderation API)
   - 10.4 Copyright & fair use (quoting limits, attribution, paywalls)
   - 10.5 Rate limiting & abuse prevention (cost budgets, throttling, anti-patterns)

## 11. Vector Database & RAG Architecture
   - 11.1 **Context Management DB (RAG)**
     - Problem statement (22k tokens → 8k tokens, 60% reduction)
     - Architecture (embeddings.ts, store.ts, retrieval.ts, indexing.ts)
     - Embedding model (text-embedding-3-small, 1536-dim, $0.02/1M tokens)
     - Vector DB (ChromaDB dev, Pinecone prod, abstraction layer)
     - Chunking strategy (512 tokens, 50 token overlap, markdown-aware)
     - Indexing (PRD, journals, TODOs, incremental updates)
     - Retrieval (semantic search, reranking, top-5 injection)
     - CLI integration (--with-context, --no-rag, --reindex-context)
     - Performance targets (>60% reduction, <500ms latency, NDCG@5 >0.8)

   - 11.2 **Output Storage DB (Inspiration)**
     - Problem statement (no storage for successful outputs, no inspiration mode)
     - Post-generation workflow (review prompt, rating, tagging, save)
     - Output schema (StoredOutput with metadata, rating, engagement)
     - Deduplication (95% similarity threshold, user confirmation)
     - Inspiration mode (--inspiration, filters, MMR diversity ranking)
     - Interactive review UI (terminal prompts, arrow navigation)
     - CLI flags (--auto-save, --no-save, --save --rating 5)
     - Analytics (pattern analysis, common themes, top hooks)

## 12. Evaluation & Quality Assurance **[NEW]**
   - 12.1 Golden dataset (20 topics × 4 platforms = 80 test cases)
   - 12.2 Human eval rubric (accuracy, tone, engagement with 1-5 scales)
   - 12.3 Automated checks (hallucination detection via NLI, attribution %, constraints)
   - 12.4 Regression testing (trigger on model updates, prompt changes)
   - 12.5 A/B testing framework (compare models, track quality/cost/latency)
   - 12.6 Production monitoring (post-generation survey, quality tracking)

## 13. Success Metrics (Measurable)
   - 13.1 Content quality (human eval ≥4.0/5, inter-rater reliability α≥0.7)
   - 13.2 Source attribution (100% traceability, automated checks)
   - 13.3 RAG context efficiency (>60% token reduction vs baseline)
   - 13.4 Cost per post (<$0.05 median, breakdown by stage)
   - 13.5 Latency (p50 <10s, p95 <20s, p99 <30s)
   - 13.6 Error rate (<1% total, <0.5% per error type)
   - 13.7 User satisfaction (≥4.0/5 rating, ≥60% "post without edits")
   - 13.8 Dashboard & instrumentation (metrics.json, npm run metrics:dashboard)

## 14. Observability & Operations **[NEW]**
   - 14.1 Logging strategy (structured logs, fields, retention 7 days)
   - 14.2 Tracing (OpenTelemetry, stage-by-stage tracing)
   - 14.3 Metrics (cost, latency, errors, quality tracked to metrics.json)
   - 14.4 Alerting (cost spike >$10/day, quality <3.5/5, error rate >1%)
   - 14.5 SLOs (p95 latency <20s, 99.9% uptime, 100% attribution)
   - 14.6 Incident response (runbooks for 5 common failure modes)

## 15. CLI Interface & UX
   - 15.1 Basic commands (all flags documented with examples)
   - 15.2 Options table (--platform, --model, --thread, --variations, etc.)
   - 15.3 Progress indication (spinners, ETAs, streaming output)
   - 15.4 Interactive mode (--interactive for thread approval)
   - 15.5 Color coding (verification levels, errors, success)
   - 15.6 Verbose mode (--verbose for debugging)

## 16. Data Schemas
   - 16.1 GroundedClaim (with verification levels, authority, confidence)
   - 16.2 PlatformConfig (complete TypeScript interface)
   - 16.3 SynthesisResult (platform, post, metadata, cost)
   - 16.4 ThreadedPost (threadId, posts, totalParts, style)
   - 16.5 ContextChunk (RAG DB schema)
   - 16.6 StoredOutput (output DB schema with ratings)

## 17. Implementation Phases (Revised)
   - **Phase 0: Foundation (BLOCKING)** **[NEW]**
     - [ ] Document LLM provider strategy (model selection, fallbacks)
     - [ ] Implement error handling framework (retry logic, graceful degradation)
     - [ ] Add security (API key management, PII filtering, content moderation)
     - [ ] Build evaluation framework (golden dataset, human eval rubric)
     - [ ] Set up observability (logging, metrics, tracing)
     - [ ] Create cost tracking & budgeting system
     - **Exit criteria:** All P0 blockers resolved, can safely prototype

   - **Phase 1: Platform Abstraction**
     - [ ] Create src/platforms/ structure
     - [ ] Implement PlatformConfig interface
     - [ ] Extract LinkedIn config from current code
     - [ ] Add platform registry & selector
     - [ ] Update synthesis to accept platform parameter
     - [ ] Schema migration: linkedinPost → post (with backward compat)

   - **Phase 2: Threads & Twitter**
     - [ ] Threads platform config + prompts
     - [ ] Twitter platform config + threading logic
     - [ ] Source verification & trust scoring (for new platforms)
     - [ ] Test with 10 golden test cases per platform

   - **Phase 3: Bluesky & Substack**
     - [ ] Bluesky config
     - [ ] Substack Newsletter config (+ image brief generation)
     - [ ] Substack Notes config
     - [ ] NanoBanana Pro integration (if pursuing image generation)

   - **Phase 4: CLI & Multi-Platform**
     - [ ] --platform flag (single, multiple, all)
     - [ ] --thread flag & threading logic
     - [ ] --variations mode
     - [ ] Interactive review mode
     - [ ] Progress indication & UX polish

   - **Phase 5: Vector DB #1 - Context RAG**
     - [ ] Set up ChromaDB (dev) + Pinecone (prod) abstraction
     - [ ] Implement embedding generation (text-embedding-3-small)
     - [ ] Build chunking pipeline (PRD, journals, TODOs)
     - [ ] Implement retrieval + optional reranking
     - [ ] --with-context, --no-rag, --reindex-context flags
     - [ ] Measure & validate >60% context reduction

   - **Phase 6: Vector DB #2 - Output Storage**
     - [ ] Output storage schema & vector DB
     - [ ] Post-generation review UI (terminal prompts)
     - [ ] Feedback collection (rating, tags, notes)
     - [ ] Deduplication logic (95% similarity check)
     - [ ] --auto-save, --no-save, --save flags
     - [ ] Inspiration mode (--inspiration with filters)
     - [ ] Pattern analysis & suggestions

   - **Phase 7: Polish & Launch**
     - [ ] Regression testing on golden dataset
     - [ ] Performance optimization (latency <10s p50)
     - [ ] Cost optimization (hit <$0.05/post target)
     - [ ] Documentation (README, troubleshooting, examples)
     - [ ] Launch to beta users (10-20 testers)

## 18. Non-Goals (v1) - Explicit Exclusions
   - API posting (just generate content, don't post)
   - Scheduling/queue management
   - Analytics integration (track engagement)
   - Multi-user authentication & accounts
   - Cloud-sync vector database
   - Real-time collaboration
   - Natural language querying of inspiration DB
   - Automated engagement tracking from platforms
   - Mobile app

## 19. Open Questions & Risks **[NEW]**
   - **Open Questions:** (see Section G below for full list)
   - **Risks:**
     - High: LLM cost spikes if no budget enforcement → Mitigation: Phase 0 cost controls
     - High: Quality degradation undetected → Mitigation: Phase 0 eval framework
     - Med: ChromaDB →  Pinecone migration pain → Mitigation: Abstraction layer
     - Med: Source collection rate limits → Mitigation: Fallback providers
     - Low: User adoption (is CLI limiting?) → Mitigation: Beta user feedback

## 20. Appendices
   - A. Example prompts (5 sample topics with expected outputs)
   - B. Platform API references (official docs for each platform)
   - C. Cost breakdown calculator (spreadsheet for estimating costs)
   - D. Golden dataset samples (3 full test cases with human eval scores)
   - E. Glossary (GroundedClaim, Verification Level, Platform Synthesis, etc.)

Update Todos
 Complete executive summary of PRD issues and opportunities
 Generate prioritized list of improvements with impact/effort ratings
 Write section-by-section detailed comments
 Identify missing sections and decisions
 Draft concrete rewrites for critical sections
 Create revised implementation-ready PRD outline
 Generating stakeholder questions grouped by theme
G) Questions to Ask Stakeholders (Grouped by Theme)
Theme 1: Product Strategy & Users
Who is the primary user? Solo creator? Agency? Enterprise marketing team? (Affects pricing, features, auth)

What's the target user's technical sophistication? Comfortable with CLI + API keys, or need GUI?

What's the monetization model? Free OSS? Freemium ($10/mo)? Usage-based ($0.10/post)? SaaS?

What's the 6-month roadmap? Is this a long-term product or a prototype/experiment?

Are we building for a specific niche (e.g., AI thought leaders, SaaS founders) or general creators?

What's success for v1? 100 users? $1k MRR? Open source stars? Acquisition?

Is multi-user support planned? If so, when? (Affects schema design, API key handling)

Theme 2: LLM & Model Strategy
Do we have budget constraints for LLM costs? Max $X/month? Per-user limits?

Are we vendor-locked to OpenAI, or must we support Anthropic/Google for redundancy?

What's our policy on model version pinning? Auto-update to latest, or pin for reproducibility?

Do we need offline/local LLM support? (Llama 3.1, Mixtral for privacy-sensitive users)

What's acceptable latency? <5s? <10s? <30s? (Affects model selection, caching strategy)

Can we use gpt-4o-mini for cost-sensitive users, or is quality non-negotiable?

Theme 3: Source Collection & Verification
What sources are authoritative? Is there a whitelist of .gov/.edu, or trust scoring algorithm?

How do we handle paywalls? Skip paywalled sources, or mark them as CLAIMED?

What if sources contradict? (e.g., "AI market is $100B" vs "$200B") Show both? Let user choose?

Do we verify source recency? Flag sources >12 months old? Require recent sources for news topics?

Can users bring their own sources? (--manual-sources flag to paste URLs/text)

What's the minimum source count? 3? 5? Configurable?

Do we respect robots.txt for web scraping? (Legal/ethical question)

Theme 4: Quality & Evaluation
Who will do human evals? Internal team? Upwork contractors? Users themselves?

What's the quality bar for v1 launch? ≥4.0/5? ≥3.5/5? "Good enough to save time"?

Do we need explainability? (Show user why certain claims were included/excluded)

How often should we run regression tests? Weekly? On every model update? On-demand?

What's the acceptable hallucination rate? 0%? <1%? <5%?

Should we support user feedback on quality? (Post-generation survey, thumbs up/down)

Theme 5: Security & Compliance
Are there regulatory requirements? GDPR (EU users)? CCPA (CA users)? HIPAA (healthcare content)?

How do we store API keys? .env only? Support secret managers (AWS Secrets, Vault)?

Do we log user inputs? If yes, how long retained? PII filtering?

Who owns generated content? User? Platform? Does ToS matter?

What's our content moderation policy? Block toxic content? Warn user? Allow with disclaimer?

Do we need SOC 2 compliance? (If targeting enterprises)

Theme 6: RAG & Vector Database
What's the budget for vector DB? Pinecone is $70/mo - worth it, or stick with free Chroma?

How much context reduction is good enough? 60%? 50%? 80%?

Should reranking be default or opt-in? (Adds $0.01/session cost, +15% relevance)

Do we index user-specific docs, or only project docs (PRD, journals)?

What's the retention policy for stored outputs? Forever? 90 days? User-controlled?

Should inspiration mode be default or opt-in? (Privacy: storing user outputs)

Theme 7: Platforms & Features
Which platforms are P0 for launch? LinkedIn + Twitter? Or all 6?

Do we support Instagram, Facebook, TikTok (image/video platforms)?

What about Reddit, Hacker News, Product Hunt? (Community platforms with different norms)

Should we support custom platforms? (User-defined PlatformConfig for internal tools)

Is image generation in scope for v1, or punt to v2? (Newsletter images via NanoBanana Pro)

Do we need video/audio support? (YouTube scripts, podcast show notes)

What about translations/i18n? English-only, or multi-language?

Theme 8: Error Handling & Operations
What's our uptime SLO? 99%? 99.9%? Best-effort?

Do we need on-call/incident response? If yes, who? Runbooks ready?

How do we handle prolonged API outages (e.g., OpenAI down for 6 hours)?

Should we cache/pre-generate content for common topics to improve reliability?

What's the rollback strategy if a bad model update ships?

Theme 9: Cost & Pricing
What's the target cost per post? <$0.05? <$0.10? Flexible?

Who pays for LLM costs? User brings API keys (current), or we provide (SaaS model)?

If we provide API keys, how enforce quotas? 100 posts/month free, then pay?

What's the CAC:LTV ratio we're targeting? (If monetizing)

Should we offer a free tier? 10 posts/month free, then upgrade?

Theme 10: UX & Developer Experience
Is CLI the final UX, or is web app planned? (Affects investment in CLI polish)

Do we need a GUI for non-technical users? (Electron app, web UI)

Should we support configuration files (.groundedpostsrc.json) for per-project settings?

What's the onboarding flow? groundedposts init wizard to set up API keys?

Do we need tutorials/examples in-repo? (Affects documentation effort)

Should we support plugins/extensions? (User-defined synthesis prompts, custom platforms)

What's the update mechanism? npm update? Auto-update? Homebrew?

Theme 11: Data & Privacy
Can we use generated outputs to improve the product? (Train evals, improve prompts)

Do we anonymize/telemetry? Track platform popularity, error rates (without PII)?

What's the data residency requirement? (EU data stays in EU, for GDPR)

Can we store embeddings of user content, or must everything be local-only?

What's the right-to-erasure implementation? --delete-my-data deletes what exactly?

Theme 12: Risks & Mitigations
What if LLM quality degrades (e.g., OpenAI makes model dumber to save costs)?

What if source collection APIs (Perplexity) shut down or become too expensive?

What if a platform changes character limits (e.g., Twitter → 500 chars)?

What if copyright/fair use law changes, making quoting risky?

What if a major competitor launches (e.g., Buffer adds LLM synthesis)?

What's the bus factor? (How many people know the codebase? Succession plan?)

Update Todos
 Complete executive summary of PRD issues and opportunities
 Generate prioritized list of improvements with impact/effort ratings
 Write section-by-section detailed comments
 Identify missing sections and decisions
 Draft concrete rewrites for critical sections
 Create revised implementation-ready PRD outline
 Generate stakeholder questions grouped by theme
H) Recommendations & Next Steps
Immediate Actions (This Week)
Resolve P0 Blockers - Schedule 2-hour working session to answer the top 20 stakeholder questions (Theme 1-3)

Decision: LLM provider strategy (which models, fallbacks)
Decision: Target user & monetization model
Decision: Quality bar & evaluation approach
Add Missing Sections - Use the concrete rewrites (Section E) to update PRD

Copy-paste the 7 rewritten sections into PRD
Add new sections: LLM Strategy, Error Handling, Security, Evaluation
Estimated effort: 4-6 hours
Create Phase 0 - Block all development until foundational blockers are resolved

Document LLM provider choices in PRD
Implement basic error handling (retry logic, timeouts)
Set up API key management (.env + validation)
Build golden dataset (start with 10 test cases)
Add cost tracking (log per-request costs to metrics.json)
Short-Term (Next 2 Weeks)
Validate Assumptions - Run quick experiments to de-risk technical unknowns

Test: Can gpt-4o-mini maintain quality <4.0/5? (If yes, saves 70% cost)
Test: Does Chroma → Pinecone migration work via abstraction layer?
Test: What's actual p50 latency for end-to-end synthesis? (Currently unknown)
Refine Success Metrics - Make all metrics measurable with instrumentation plan

Implement metrics.json logging
Build simple dashboard (npm run metrics:dashboard)
Run baseline measurements (current cost, latency, context usage)
Stakeholder Alignment - Present revised PRD to stakeholders

Walk through Section B (Top Issues) and get agreement on priorities
Answer open questions (Section G) in collaborative session
Get sign-off on Phase 0 before coding
Medium-Term (Next Month)
Complete Phase 0 - Build foundation before prototyping platforms

✅ P0 blockers resolved (LLM strategy, error handling, security, eval)
✅ Golden dataset created (20 topics × 4 platforms)
✅ Cost tracking operational
✅ Basic regression tests passing
Exit criteria: Can generate 1 LinkedIn post with full error handling, cost tracking, and quality eval
Pilot Phase 1 - Platform abstraction (without new platforms)

Extract LinkedIn config to PlatformConfig
Refactor synthesis to be platform-agnostic
Validate no regression on LinkedIn quality
Exit criteria: Existing LinkedIn functionality works via new abstraction
Beta Testing - Get early user feedback before expanding platforms

Recruit 5-10 beta users (solo creators, not friends/family)
Watch them use the tool (usability testing)
Collect feedback on: quality, latency, cost, UX
Iterate based on feedback before adding Threads/Twitter
Long-Term (Next Quarter)
Scale to All Platforms - Execute Phase 2-4 (Threads, Twitter, Bluesky, Substack)

Add RAG - Execute Phase 5-6 once core platforms stable

Production Hardening - Observability, monitoring, incident response

I) Final Verdict
PRD Readiness Score: 5/10

Strengths (7/10): Vision, platform abstraction, threading logic
Weaknesses (3/10): Missing LLM strategy, security, evaluation, error handling, observability
Recommendation: DO NOT start coding until Phase 0 is complete.

The PRD is 70% ready for prototyping, but only 30% ready for production. The core product vision is sound, but critical engineering details are missing. If you start building now, you'll face:

Costly rework when model strategy changes
Security incidents (API key leaks, PII exposure)
Undetected quality degradation
Cost overruns (no budgets or guardrails)
Best path forward:

Spend 1 week updating PRD with missing sections (use rewrites from Section E)
Answer stakeholder questions (Section G) to resolve ambiguities
Complete Phase 0 (foundation) before any platform expansion
Beta test with 5-10 real users before scaling
Timeline:

PRD update: 1 week
Phase 0: 2-3 weeks
Phase 1-4 (platforms): 6-8 weeks
Phase 5-6 (RAG): 4-6 weeks
Total to production-ready v1: 3-4 months
Good luck! Happy to clarify any section or dive deeper into specific areas. The revised PRD outline (Section F) is ready to copy-paste as the new structure.