# GroundedPosts PRD Review - 2026-01-01

## Review Context

**Reviewer**: Senior Software Architect & AI Engineering Lead
**Review Date**: 2026-01-01
**PRD Version**: Current (multi-platform with Substack support)
**Codebase State**: Active development, 4 platforms implemented

This review builds upon the prior "Senior Architecture Review" and incorporates analysis of the current implementation state.

---

## A) Executive Summary

### Overall Assessment

**PRD Readiness Score: 6.5/10** (up from 5/10 in prior review)

The project has made significant progress on foundational infrastructure while the PRD documentation has lagged behind implementation reality. The codebase now demonstrates production patterns that the PRD should formalize.

### Key Findings (10 Bullets)

1. **Platform abstraction is production-grade** - `PlatformConfig` interface and registry pattern are well-designed and extensible. Four platforms implemented (LinkedIn, Threads, Substack, Substack Notes).

2. **LLM provider strategy partially resolved** - GPT-5.2 implementation exists with reasoning effort configuration, but multi-provider strategy still undocumented in PRD. Code uses GPT-5.2 Responses API effectively.

3. **Error handling exists but isn't formalized** - Retry logic with exponential backoff (`withRetry`, `CRITICAL_RETRY_OPTIONS`), timeout handling, and rate limiting are implemented. PRD should document these patterns.

4. **Cost tracking is implemented** - `CostTracker` class, per-provider pricing, token estimation all exist. Missing: budget enforcement, cost alerts, per-session limits.

5. **Security measures partially implemented** - `sanitizePromptContent()` for injection prevention, `createSafeError()` for API key protection. Missing: PII detection, content moderation, audit logging.

6. **Evaluation framework still missing** - No golden dataset, no human eval rubric, no regression testing. This remains a critical gap for quality assurance.

7. **RAG/Vector DB not implemented** - Despite being in PRD, context management and output storage vector DBs don't exist. This is a major scope item requiring revalidation.

8. **Observability minimal** - Basic verbose logging exists, but no structured logging, tracing, metrics dashboard, or alerting. Production operations will struggle.

9. **Two platforms not implemented** - Twitter/X and Bluesky configs are placeholders. Threading logic for Twitter threads not built.

10. **Image generation incomplete** - NanoBanana integration exists (`src/image/nanoBanana.ts`) but newsletter image briefs not wired into Substack synthesis.

### Risk Assessment

| Risk | Level | Impact | Mitigation Status |
|------|-------|--------|-------------------|
| Quality degradation undetected | HIGH | Users lose trust | NOT MITIGATED |
| Cost overruns | MEDIUM | Budget exhaustion | PARTIALLY MITIGATED (tracking, no limits) |
| API key exposure | LOW | Security breach | MITIGATED (sanitization) |
| Provider outage | MEDIUM | Service unavailable | PARTIALLY MITIGATED (retry, no fallback models) |
| Prompt injection | LOW | Malicious output | MITIGATED (delimiter/sanitization) |

---

## B) Top Issues (Updated Priority)

### Resolved Since Prior Review

| Prior Issue | Status | Evidence |
|-------------|--------|----------|
| No error handling design | RESOLVED | `src/utils/retry.ts` with backoff, timeouts, rate limit detection |
| Cost controls missing | PARTIALLY RESOLVED | `CostTracker`, pricing tables, but no budget enforcement |
| Security basics absent | PARTIALLY RESOLVED | Sanitization, safe errors, but no PII/moderation |
| LLM provider undefined | PARTIALLY RESOLVED | GPT-5.2 implemented, but no multi-provider fallback |

### Current Priority Issues

| Rank | Issue | Impact | Effort | Status | Fix Priority |
|------|-------|--------|--------|--------|--------------|
| 1 | **No Evaluation Framework** | HIGH | HIGH | NOT STARTED | P0 - Blocking |
| 2 | **Observability Not Designed** | HIGH | MED | NOT STARTED | P0 - Pre-Launch |
| 3 | **Budget Enforcement Missing** | MED | LOW | NOT STARTED | P1 - Week 1 |
| 4 | **Multi-Provider Fallback Absent** | MED | MED | NOT STARTED | P1 - Resilience |
| 5 | **RAG Implementation Unvalidated** | MED | HIGH | NOT STARTED | P1 - Scope Decision |
| 6 | **Content Moderation Missing** | MED | LOW | NOT STARTED | P1 - Safety |
| 7 | **Twitter/Bluesky Not Implemented** | LOW | MED | NOT STARTED | P2 - Platform |
| 8 | **PRD-Code Drift** | MED | LOW | ONGOING | P2 - Documentation |
| 9 | **Newsletter Image Integration** | LOW | MED | PARTIAL | P2 - Feature |
| 10 | **User Persona Unclear** | LOW | LOW | NOT STARTED | P3 - Strategy |

---

## C) Section-by-Section Comments

### Platform Abstraction Layer

**PRD Snippet:**
```typescript
interface PlatformConfig {
  name: Platform;
  maxLength: number;
  hashtagPolicy: HashtagPolicy;
  // ...
}
```

**Assessment**: EXCELLENT - Code matches PRD intent

**What's Working:**
- `src/platforms/types.ts` implements complete interface with 25+ fields
- Platform registry pattern enables clean extension
- Threading configuration well-designed with `ThreadingConfig`
- Validation function per platform (`validateForPlatform`)

**Enhancement Opportunity:**
```typescript
// PRD should document operational constraints (already conceptually present)
interface PlatformConfig {
  // ... existing fields

  // ADD: Rate limiting per platform API (for future posting)
  platformRateLimits?: {
    postsPerHour: number;
    postsPerDay: number;
  };

  // ADD: Analytics hint for future engagement tracking
  engagementMetrics?: ('likes' | 'comments' | 'shares' | 'impressions')[];
}
```

---

### LLM Provider Strategy

**PRD Snippet:** (Missing from original PRD)

**Current Implementation:**
```typescript
// src/synthesis/gpt.ts
const GPT_MODEL = 'gpt-5.2';
const REASONING_EFFORT = 'medium' as const;
export const GPT_PRICING = {
  inputPerMillion: 1.75,
  outputPerMillion: 14.00,
};
```

**Issue**: Implementation exists, PRD doesn't document it

**Why It Matters**: Engineering decisions are encoded in code but not discoverable. New team members can't understand model selection rationale without reading source.

**Suggested PRD Addition:**

```markdown
## LLM Provider Strategy

### Synthesis Models

| Model | Provider | Version | Context | Cost/1M (in/out) | Use Case |
|-------|----------|---------|---------|------------------|----------|
| **gpt-5.2** (default) | OpenAI | Responses API | 128k | $1.75/$14 | Primary synthesis |
| **claude-4.5-sonnet** | Anthropic | Current | 200k | $3/$15 | Fallback, long-form |
| **gemini-3-flash** | Google | Preview | 2M | $0.50/$3 | Scoring, cost-optimized |
| **kimi-k2** | OpenRouter | Current | 128k | $0.46/$1.84 | Scoring fallback |

### Reasoning Effort Configuration

GPT-5.2 supports reasoning effort levels: none | minimal | low | medium | high | xhigh

- **Synthesis**: `medium` (balanced reasoning depth and latency)
- **Claim Extraction**: `low` (faster, simpler task)
- **Scoring**: Uses Gemini/KIMI (no reasoning mode)

### Fallback Strategy

1. Primary model (gpt-5.2) fails → Retry 5x with exponential backoff
2. All retries fail → Fallback to claude-4.5-sonnet (not implemented)
3. All providers fail → Return cached result if available (not implemented)
```

---

### Error Handling

**PRD Snippet:** (Missing from original PRD)

**Current Implementation:**
```typescript
// src/utils/retry.ts
export const CRITICAL_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 5,
  baseDelayMs: 2000,
  maxDelayMs: 30000,
  retryOn: defaultRetryCondition, // rate limits, server errors, network errors
};
```

**Issue**: Production-grade error handling exists but PRD doesn't specify it

**Suggested PRD Section:**

```markdown
## Error Handling & Resilience

### Retry Configuration

| Operation | Max Retries | Base Delay | Max Delay | Retry Conditions |
|-----------|-------------|------------|-----------|------------------|
| Synthesis (GPT) | 5 | 2000ms | 30000ms | 429, 5xx, network |
| Scoring (Gemini) | 3 | 1000ms | 10000ms | 429, 5xx, network |
| Source Collection | 3 | 1000ms | 30000ms | 429, 5xx, network |

### Rate Limiting

- OpenAI requests throttled to 1 request/second minimum interval
- Rate limit detection via HTTP 429 or error message patterns
- Automatic backoff when rate limited (sleep until reset)

### Timeout Enforcement

- Stage timeout: 120s (configurable via `STAGE_TIMEOUT_MS`)
- Per-request timeout enforced via `Promise.race`
- `TimeoutError` class for clean error identification

### User-Facing Errors

Current: Technical errors exposed
Needed: Human-readable messages with actionable suggestions

| Error Code | User Message | Suggestion |
|------------|--------------|------------|
| `SOURCE_TIMEOUT` | "Source collection timed out" | "Try a more specific topic or check connection" |
| `SYNTHESIS_FAILED` | "Could not generate post" | "Reduce claim count or try again" |
| `RATE_LIMITED` | "API rate limit reached" | "Wait 60 seconds or upgrade API tier" |
```

---

### Cost Management

**PRD Snippet:** (Missing specific budget controls)

**Current Implementation:**
```typescript
// src/utils/cost.ts
export class CostTracker {
  addPerplexity(inputTokens: number, outputTokens: number): void
  addGemini(inputTokens: number, outputTokens: number): void
  addOpenAI(inputTokens: number, outputTokens: number): void
  getCost(): CostBreakdown
}
```

**What's Working:**
- Token tracking per provider
- Accurate pricing tables (updated Dec 2025)
- Cost estimation before run (`estimateCost()`)
- Cost calculation after run (`calculateActualCost()`)

**What's Missing:**

```typescript
// NOT IMPLEMENTED - Budget enforcement
interface BudgetConfig {
  maxCostPerSession: number;    // e.g., $1.00
  maxCostPerDay: number;        // e.g., $10.00
  warningThreshold: number;     // e.g., 0.8 (warn at 80%)
  onBudgetExceeded: 'warn' | 'block' | 'confirm';
}

// Suggested implementation in pipeline
if (costTracker.getCost().total > config.budget.maxCostPerSession) {
  throw new BudgetExceededError(
    `Session cost $${cost} exceeds limit $${config.budget.maxCostPerSession}`
  );
}
```

---

### Security & Input Sanitization

**Current Implementation:**
```typescript
// src/utils/sanitization.ts
export function sanitizePromptContent(content: string, maxLength: number): string
export function createSafeError(operation: string, error: unknown): Error
export function sanitizeErrorMessage(message: string): string
```

**Assessment**: GOOD foundation, needs expansion

**What's Working:**
- Prompt injection prevention via delimiter sanitization
- API key scrubbing from error messages
- Maximum content length enforcement

**What's Missing:**

| Security Feature | Status | Priority |
|------------------|--------|----------|
| PII detection in inputs | NOT IMPLEMENTED | P1 |
| PII detection in outputs | NOT IMPLEMENTED | P1 |
| Content moderation (toxicity) | NOT IMPLEMENTED | P1 |
| Audit logging | NOT IMPLEMENTED | P2 |
| API key rotation reminders | NOT IMPLEMENTED | P3 |

**Suggested PII Detection:**
```typescript
// src/utils/pii.ts (new file needed)
const PII_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /\+?[\d\-\(\)\s]{10,}/g,
  ssn: /\d{3}-\d{2}-\d{4}/g,
};

export function detectPII(text: string): PIIDetectionResult {
  const findings: PIIFinding[] = [];
  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    const matches = text.match(pattern);
    if (matches) {
      findings.push({ type, count: matches.length, redacted: true });
    }
  }
  return { hasPII: findings.length > 0, findings };
}
```

---

### Evaluation Framework

**PRD Snippet:** "Success Metrics" section lists targets but no measurement plan

**Current Implementation:** NONE

**Issue**: This is the #1 gap. Without evaluation, you cannot:
- Detect quality regression on model updates
- Validate prompt changes don't degrade output
- Compare provider performance objectively
- Justify LLM costs with quality metrics

**Concrete Implementation Plan:**

```markdown
## Evaluation Framework

### Golden Dataset

**Location**: `tests/golden/dataset.json`

**Composition**: 20 topics × 4 platforms = 80 test cases

| Category | Topics | Rationale |
|----------|--------|-----------|
| Tech trends | 5 | High-frequency use case |
| Business insights | 5 | Professional audience target |
| Product launches | 3 | News-style content |
| Research findings | 4 | Citation-heavy |
| Opinion/analysis | 3 | Tone variation test |

**Golden Test Case Schema**:
```json
{
  "id": "golden-001",
  "topic": "AI adoption in healthcare 2025",
  "platforms": ["linkedin", "threads"],
  "expectedMinScore": 4.0,
  "expectedClaims": ["FDA approval", "clinical trials"],
  "humanBaseline": {
    "linkedin": "Sample expert post...",
    "ratingAccuracy": 4.5,
    "ratingTone": 4.0
  }
}
```

### Automated Quality Checks

1. **Attribution Coverage**: % of claims with [N] citations
   - Target: ≥95%
   - Measurement: Parse post, match references to sources

2. **Hallucination Detection**: Claims not in source material
   - Target: 0 hallucinations
   - Measurement: NLI model (bart-large-mnli) entailment check

3. **Platform Constraint Validation**: Length, hashtags, format
   - Target: 100% compliance
   - Measurement: `validateForPlatform()` pass rate

4. **Quote Integrity**: Complete quotes, not truncated
   - Target: 0 truncated quotes
   - Measurement: Lowercase start detection, incomplete phrase endings

### Human Evaluation Rubric

| Dimension | Weight | 1 (Poor) | 3 (Acceptable) | 5 (Excellent) |
|-----------|--------|----------|----------------|---------------|
| Accuracy | 40% | Multiple factual errors | Minor sourcing gaps | All claims verified |
| Tone | 30% | Wrong platform voice | Generic, could be any platform | Perfect platform fit |
| Engagement | 30% | No hook, weak CTA | Decent hook, generic CTA | Compelling hook, specific CTA |

**Inter-rater Reliability Target**: Krippendorff's α ≥ 0.7

### Regression Testing

**Trigger**: Run on every:
- Model version update
- System prompt change
- Synthesis pipeline code change

**Process**:
```bash
npm run test:regression

# 1. Generate outputs for all 80 golden test cases
# 2. Run automated checks (attribution, hallucination, constraints)
# 3. Compare against baseline scores
# 4. Flag cases with >10% quality drop
# 5. Block release if overall score <4.0
```
```

---

### Multi-Post / Threading

**PRD Snippet:** Comprehensive `ThreadingConfig` and per-platform specs

**Current Implementation:**
```typescript
// src/platforms/types.ts
interface ThreadingConfig {
  supportsThreading: boolean;
  maxThreadLength: number;
  connectionType: ThreadConnectionType;
  numberingFormat?: string;
  requiresTeaser: boolean;
  optimalLength: { min: number; max: number };
  threadPromptAdditions: string;
}
```

**Assessment**: Well-designed, partially implemented

**What's Working:**
- Threading config defined for all platform types
- Multi-post prompt building (`buildMultiPostPrompt`)
- Variations vs series mode distinction

**What's Missing:**
- Thread failure recovery logic (partial thread handling)
- Interactive approval mode (`--interactive` flag)
- Thread renumbering on part failure

**Suggested Addition to PRD:**

```markdown
### Thread Failure Modes

| Failure Scenario | Recovery Strategy | User Prompt |
|------------------|-------------------|-------------|
| Part 1 fails | ABORT entire thread | "First post is critical hook. Regenerating entire thread." |
| Part 2-N fails | Retry 2x, then offer options | "Part 3 failed. Options: [1] Skip and renumber [2] Regenerate [3] Save partial" |
| Multiple parts fail | Suggest single post | "Multiple failures. Consider single comprehensive post instead?" |
| Validation fails on part | Regenerate that part only | Silent retry with stricter prompt |

### Thread Generation Schema (Current)

```typescript
// Already implemented in src/synthesis/gpt.ts
interface GPTMultiPostResponse {
  posts: LinkedInPost[];
  factCheckSummary: FactCheckSummary;
}
```

---

### RAG / Vector Database Architecture

**PRD Snippet:** Extensive section on context management and output storage DBs

**Current Implementation:** NONE

**Issue**: Major PRD feature with zero implementation

**Decision Required**: Is RAG still in scope for v1?

**Scope Validation Questions:**
1. What problem does context RAG solve that session-level prompts don't?
2. With 128k context windows (GPT-5.2), is token reduction still critical?
3. Output storage for "inspiration mode" - is this a v1 or v2 feature?
4. ChromaDB vs Pinecone decision - what's the hosting model?

**If RAG Stays in Scope:**

```markdown
### RAG Implementation (Revised for 2026)

**Context Problem**: PRD + Journal + TODO = ~22k tokens per session init

**GPT-5.2 Reality Check**: 128k context window makes this less critical
- 22k tokens = 17% of context (acceptable)
- RAG adds latency (~500ms retrieval)
- RAG adds cost (~$0.001/query for embeddings)

**Recommendation**: Defer RAG to v2 unless session init >50k tokens

**If Proceeding**:

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Embedding Model | text-embedding-3-small | Cost-effective, 1536-dim |
| Vector DB (Dev) | ChromaDB | Zero-config, local |
| Vector DB (Prod) | Pinecone Serverless | Pay-per-use, no idle cost |
| Chunk Size | 512 tokens | Balance granularity/coherence |
| Overlap | 50 tokens (10%) | Prevent boundary information loss |
```

**If Deferring RAG:**

```markdown
### Deferred: RAG Architecture (v2)

RAG implementation is deferred to v2. Rationale:
- GPT-5.2's 128k context handles current project docs
- Prioritize evaluation framework and observability for v1
- Revisit when context usage exceeds 60% of model limit

**v1 Alternative**: Simple file truncation with `--context-budget` flag
- Default: 20k tokens for project context
- Excess: Warn user, suggest `--context-budget 40000`
```

---

### CLI Interface

**PRD Snippet:** Flags documented (`--platform`, `--model`, `--thread`)

**Current Implementation:** `src/cli/program.ts` (not fully reviewed)

**Assessment**: Likely implemented but PRD should formalize UX patterns

**Suggested PRD Addition:**

```markdown
### CLI UX Standards

**Progress Indication**:
- Spinner during API calls (not silent waiting)
- Stage progression: [1/4] Collecting → [2/4] Extracting → [3/4] Synthesizing → [4/4] Saving
- ETA when possible (based on average stage times)

**Error Output**:
- Fatal errors: Red text, exit code 1, actionable message
- Warnings: Yellow text, continue execution
- Verbose mode: Full stack traces for debugging

**Output Modes**:
```bash
# Default: JSON file + summary to stdout
groundedposts "AI trends" --platform linkedin
# Output: ./output/ai-trends-linkedin-20260101.json
# Stdout: "Generated 1 post (2341 chars). Cost: $0.034"

# Streaming: Show post as it generates
groundedposts "AI trends" --stream
# Stdout: Post content streams in real-time

# Quiet: JSON only, no stdout
groundedposts "AI trends" --quiet
# Output: JSON file only, exit code indicates success
```

**Keyboard Shortcuts** (if interactive mode):
- `Ctrl+C`: Abort current operation
- `Enter`: Confirm/continue
- `q`: Quit without saving
```

---

## D) Missing Sections / Missing Decisions

### Critical Missing (Blocking Production)

| Section | Why Critical | Suggested Owner |
|---------|--------------|-----------------|
| **Evaluation Framework** | Can't measure quality, regression, or justify costs | QA/ML Engineer |
| **Observability Design** | Can't operate in production without visibility | Platform Engineer |
| **Incident Response** | No runbooks for common failures | SRE/DevOps |
| **SLO Definitions** | No targets for latency, uptime, quality | Product + Engineering |

### Important Missing (Pre-Launch)

| Section | Impact | Suggested Resolution |
|---------|--------|----------------------|
| Multi-provider fallback | Resilience | Document fallback chain, implement Claude fallback |
| Content moderation | Safety | Integrate OpenAI Moderation API |
| Budget enforcement | Cost control | Add `--max-cost` flag and enforcement |
| PII handling | Compliance | Implement detection + redaction |
| User persona definition | Feature prioritization | Product stakeholder session |

### Nice to Have (Post-Launch)

| Section | Benefit |
|---------|---------|
| A/B testing framework | Model comparison |
| Analytics integration | Engagement tracking |
| Custom platform config | User extensibility |
| Plugin system | Community extensions |

---

## E) Concrete Rewrites

### Rewrite 1: Success Metrics (Measurable)

**Original PRD:**
```markdown
## Success Metrics
- [ ] Same prompt generates appropriate content for each platform
- [ ] All platform constraints validated
- [ ] Source attribution maintained
```

**Improved Version:**

```markdown
## Success Metrics

### Primary Metrics (Blocking Release)

| Metric | Target | Measurement Method | Automation |
|--------|--------|-------------------|------------|
| **Quality Score** | ≥4.0/5 | Human eval on golden dataset (80 cases) | `npm run eval:human` |
| **Attribution Coverage** | ≥95% | Parse [N] refs, verify in sources | `npm run eval:attribution` |
| **Hallucination Rate** | 0% | NLI entailment check | `npm run eval:hallucination` |
| **Constraint Compliance** | 100% | `validateForPlatform()` all pass | `npm run test:constraints` |
| **Latency (p50)** | <10s | Timer in pipeline, aggregate | `metrics.json` dashboard |
| **Latency (p95)** | <25s | Timer in pipeline, percentile | `metrics.json` dashboard |
| **Cost per Post** | <$0.05 | `CostTracker.getCost()` | Logged per run |
| **Error Rate** | <1% | Failed runs / total runs | `metrics.json` |

### Secondary Metrics (Tracking)

| Metric | Target | Notes |
|--------|--------|-------|
| Quote truncation rate | 0% | Lowercase start or incomplete phrase detection |
| User satisfaction | ≥4.0/5 | Post-generation survey (optional) |
| "Post without edits" rate | ≥60% | User reports using output directly |
| RAG context reduction | ≥60% | If RAG implemented |

### Instrumentation

All metrics logged to `./metrics.json`:
```json
{
  "runs": [
    {
      "id": "run-20260101-001",
      "timestamp": "2026-01-01T10:30:00Z",
      "platform": "linkedin",
      "latencyMs": 8432,
      "cost": { "total": 0.034, "openai": 0.032, "perplexity": 0.002 },
      "quality": {
        "attributionCoverage": 0.96,
        "constraintsPassed": true,
        "hallucinationsDetected": 0
      }
    }
  ]
}
```

Dashboard: `npm run metrics:dashboard` (outputs summary to stdout)
```

---

### Rewrite 2: Observability & Operations

**Original PRD:** (Missing entirely)

**New Section:**

```markdown
## Observability & Operations

### Logging Strategy

**Log Levels**:
- `error`: Fatal failures, user-facing errors
- `warn`: Recoverable issues, degraded performance
- `info`: Stage completion, key milestones
- `debug`: API calls, intermediate state (verbose mode only)

**Structured Log Format**:
```json
{
  "timestamp": "2026-01-01T10:30:00.123Z",
  "level": "info",
  "stage": "synthesis",
  "message": "GPT request completed",
  "duration_ms": 4521,
  "tokens": { "input": 3200, "output": 1800 },
  "cost_usd": 0.032,
  "run_id": "run-20260101-001"
}
```

**Retention**: 7 days local, archive to cloud storage monthly

### Metrics Collection

**Key Metrics**:
| Metric | Type | Labels |
|--------|------|--------|
| `groundedposts_requests_total` | Counter | platform, model, status |
| `groundedposts_latency_seconds` | Histogram | stage, platform |
| `groundedposts_cost_usd` | Counter | provider |
| `groundedposts_tokens_total` | Counter | provider, direction |
| `groundedposts_errors_total` | Counter | error_type, stage |

**Export**: JSON file (`metrics.json`) for CLI, Prometheus format for future API mode

### Alerting Thresholds

| Condition | Severity | Action |
|-----------|----------|--------|
| Error rate >5% over 1 hour | HIGH | Investigate provider status |
| p95 latency >30s | MEDIUM | Check model performance |
| Daily cost >$50 | HIGH | Review usage patterns |
| Quality score <3.5 (eval run) | HIGH | Block deployment, investigate |

### Incident Response

**Runbook: Synthesis Failures**

1. Check OpenAI status page (status.openai.com)
2. If provider issue: Enable fallback model (if implemented)
3. If local issue: Check API key validity, rate limits
4. Escalation: Page on-call if >10% error rate for >15 min

**Runbook: Quality Degradation**

1. Compare recent outputs to golden baseline
2. Check for model version changes
3. Review recent prompt modifications
4. Rollback to last known good configuration
```

---

### Rewrite 3: LLM Provider Strategy

**Original PRD:** (Missing)

**New Section:**

```markdown
## LLM Provider Strategy

### Model Selection

| Task | Primary Model | Fallback | Rationale |
|------|---------------|----------|-----------|
| Synthesis | gpt-5.2 (Responses API) | claude-4.5-sonnet | Best quality, reasoning support |
| Claim Extraction | gpt-4o-mini | gpt-5.2 | Cost-optimized, simpler task |
| Scoring | gemini-3-flash | kimi-k2 | Cheapest for batch operations |
| Embeddings | text-embedding-3-small | - | Only option for OpenAI embeddings |

### GPT-5.2 Configuration

```typescript
const SYNTHESIS_CONFIG = {
  model: 'gpt-5.2',
  api: 'responses',  // NOT chat completions
  reasoning: { effort: 'medium' },
  text: { format: { type: 'json_object' } },
  max_output_tokens: 8192,
};
```

**Why Responses API**:
- 40-80% better cache utilization (lower costs)
- 3% better benchmark performance
- Native reasoning support with effort levels

### Reasoning Effort Levels

| Level | Use Case | Latency Impact |
|-------|----------|----------------|
| `none` | Simple formatting | Fastest |
| `minimal` | Basic extraction | +10% |
| `low` | Claim extraction | +25% |
| `medium` | Synthesis (default) | +50% |
| `high` | Complex analysis | +100% |
| `xhigh` | Not recommended | +200% |

### Model Version Pinning

**Policy**: Pin to specific versions for reproducibility

```typescript
const MODEL_VERSIONS = {
  'gpt-5.2': 'gpt-5.2', // No version suffix available yet
  'gpt-4o': 'gpt-4o-2024-11-20',
  'claude': 'claude-4.5-sonnet-20251201',
};
```

**Update Process**:
1. New version released → Run regression tests on golden dataset
2. If quality ≥ baseline → Update pinned version
3. If quality < baseline → Investigate, do not update
4. Document version changes in CHANGELOG

### Provider Fallback Chain

```
Primary (gpt-5.2)
    ↓ fails (5 retries)
Fallback 1 (claude-4.5-sonnet) [NOT IMPLEMENTED]
    ↓ fails (3 retries)
Fallback 2 (gpt-4o) [NOT IMPLEMENTED]
    ↓ fails
Return cached result if available [NOT IMPLEMENTED]
    ↓ no cache
FATAL error to user
```

**Implementation Status**: Only primary model with retries implemented. Fallback chain is a P1 priority.
```

---

### Rewrite 4: Security & Compliance

**Original PRD:** (Missing)

**New Section:**

```markdown
## Security & Compliance

### API Key Management

**Current Implementation**:
- Keys stored in `.env` file (git-ignored)
- `getApiKey()` validates presence at startup
- `createSafeError()` scrubs keys from error messages

**Required Keys**:
```bash
OPENAI_API_KEY=sk-...           # Required
PERPLEXITY_API_KEY=pplx-...     # Required
ANTHROPIC_API_KEY=sk-ant-...    # Optional (fallback)
GOOGLE_API_KEY=...              # Optional (scoring)
OPENROUTER_API_KEY=...          # Optional (KIMI K2)
```

**Security Checklist**:
- [x] Keys not logged even in verbose mode
- [x] Keys stripped from error messages
- [ ] Key rotation reminder (90 days)
- [ ] Encrypted storage option (future)

### Prompt Injection Prevention

**Current Implementation**:
```typescript
// src/utils/sanitization.ts
export function sanitizePromptContent(content: string, maxLength: number): string
```

**Protections**:
- [x] Delimiter escape prevention (<<<, >>>)
- [x] Maximum content length enforcement
- [x] Unicode normalization
- [ ] Jailbreak pattern detection (future)

**Delimiter Security**:
```
<<<USER_PROMPT_START>>>
[User content - treated as DATA only]
<<<USER_PROMPT_END>>>
```

### PII Handling

**Current Implementation**: NONE

**Required**:
```typescript
// Detect PII in user prompts
const piiResult = detectPII(userPrompt);
if (piiResult.hasPII) {
  logWarning(`PII detected in prompt: ${piiResult.types.join(', ')}`);
  // Optionally redact or warn user
}

// Detect PII in sources
sources.forEach(source => {
  source.content = redactPII(source.content);
});
```

### Content Moderation

**Required Implementation**:
```typescript
// After synthesis, before returning to user
const moderation = await openai.moderations.create({
  input: result.linkedinPost,
});

if (moderation.results[0].flagged) {
  const categories = moderation.results[0].categories;
  throw new ContentModerationError(
    `Generated content flagged for: ${Object.keys(categories).filter(k => categories[k]).join(', ')}`
  );
}
```

**Cost**: Free (OpenAI Moderation API)
**Rate Limit**: 1000 requests/minute

### Audit Logging

**Required for Production**:
```json
{
  "event": "synthesis_completed",
  "timestamp": "2026-01-01T10:30:00Z",
  "user_id": "anonymous", // Or user identifier if multi-user
  "prompt_hash": "sha256:abc123...", // Don't log raw prompt
  "platform": "linkedin",
  "cost_usd": 0.034,
  "output_hash": "sha256:def456...", // For traceability without storing content
  "pii_detected": false,
  "moderation_passed": true
}
```
```

---

### Rewrite 5: Data Retention & Privacy

**Original PRD:** (Missing)

**New Section:**

```markdown
## Data Retention & Privacy

### Data Categories

| Data Type | Storage Location | Retention | User Control |
|-----------|-----------------|-----------|--------------|
| User prompts | Not stored by default | Session only | `--save-prompt` to persist |
| Generated outputs | `./output/` directory | Until deleted | User manages files |
| Grounded claims | In output JSON | With output | Part of output file |
| API logs | `./logs/` directory | 7 days | `--no-logs` to disable |
| Metrics | `./metrics.json` | 30 days | Aggregated, no PII |

### User Data Rights

**Right to Erasure**:
```bash
groundedposts --delete-my-data

# Deletes:
# - All output files in ./output/
# - All logs in ./logs/
# - metrics.json
# - Any cached data
```

**Data Export**:
```bash
groundedposts --export-my-data

# Exports:
# - All output JSON files
# - Configuration settings
# - Usage metrics
# - ZIP archive created at ./groundedposts-export.zip
```

### Analytics (Opt-In)

If implemented:
- Track platform popularity (aggregated)
- Track average cost per platform (aggregated)
- NO user content or prompts
- Opt-in via `--enable-analytics`
```

---

## F) Revised PRD Outline (Implementation-Ready)

```markdown
# GroundedPosts - Product Requirements Document v2.1

## 1. Executive Summary
   - What: Multi-platform content generation CLI with source attribution
   - Who: Solo creators, analysts, small marketing teams
   - Why: 2-4 hours saved per multi-platform post
   - Success: 4.0/5 quality, <$0.05/post, <10s p50 latency, 95%+ attribution

## 2. Problem Statement [NEEDS UPDATE]
   - Target users & personas (3 archetypes)
   - Current pain points
   - Market gap
   - Why now (LLM quality + creator economy)

## 3. Product Vision & Scope
   - Vision: One research session → platform-native content with provenance
   - In-scope: CLI, 6 platforms, threading, cost tracking
   - Out-of-scope v1: API posting, scheduling, analytics, RAG (deferred)
   - Assumptions & constraints

## 4. User Flows
   - 4.1 Single-platform generation
   - 4.2 Multi-platform batch
   - 4.3 Thread/series generation
   - 4.4 Output review & saving

## 5. Core Architecture [MATCHES IMPLEMENTATION]
   - 5.1 System diagram
   - 5.2 Stage 1: Source Collection
   - 5.3 Stage 2: Claim Extraction
   - 5.4 Stage 3: Platform Synthesis
   - 5.5 Stage 4: Output Generation

## 6. Platform Abstraction [WELL IMPLEMENTED]
   - 6.1 PlatformConfig interface
   - 6.2 Platform comparison matrix
   - 6.3 Platform categories
   - 6.4 Platform-specific requirements (all 6)

## 7. Multi-Post Threading [WELL IMPLEMENTED]
   - 7.1 ThreadingConfig interface
   - 7.2 Platform threading specs
   - 7.3 Thread generation schema
   - 7.4 Content distribution strategy
   - 7.5 Failure modes & recovery [NEEDS ADDITION]

## 8. LLM Provider Strategy [NEW - FROM IMPLEMENTATION]
   - 8.1 Model selection table
   - 8.2 GPT-5.2 Responses API configuration
   - 8.3 Reasoning effort levels
   - 8.4 Fallback chain (implemented vs planned)
   - 8.5 Model versioning policy
   - 8.6 Provider pricing

## 9. Error Handling & Resilience [NEW - FROM IMPLEMENTATION]
   - 9.1 Retry configuration
   - 9.2 Rate limiting
   - 9.3 Timeout enforcement
   - 9.4 Graceful degradation
   - 9.5 User-facing error messages

## 10. Cost Management [PARTIALLY IMPLEMENTED]
   - 10.1 Cost tracking (implemented)
   - 10.2 Pricing tables (implemented)
   - 10.3 Cost estimation (implemented)
   - 10.4 Budget enforcement (NOT IMPLEMENTED)
   - 10.5 Cost optimization strategies

## 11. Security & Compliance [PARTIALLY IMPLEMENTED]
   - 11.1 API key management (implemented)
   - 11.2 Prompt injection prevention (implemented)
   - 11.3 PII handling (NOT IMPLEMENTED)
   - 11.4 Content moderation (NOT IMPLEMENTED)
   - 11.5 Audit logging (NOT IMPLEMENTED)

## 12. Evaluation & Quality Assurance [NOT IMPLEMENTED - CRITICAL]
   - 12.1 Golden dataset (80 test cases)
   - 12.2 Human evaluation rubric
   - 12.3 Automated quality checks
   - 12.4 Regression testing
   - 12.5 A/B testing framework

## 13. Success Metrics [NEEDS REWRITE]
   - 13.1 Primary metrics with targets & measurement
   - 13.2 Secondary metrics
   - 13.3 Instrumentation plan
   - 13.4 Dashboard specification

## 14. Observability & Operations [NOT IMPLEMENTED - CRITICAL]
   - 14.1 Logging strategy
   - 14.2 Metrics collection
   - 14.3 Alerting thresholds
   - 14.4 Incident response runbooks
   - 14.5 SLO definitions

## 15. CLI Interface [NEEDS VALIDATION]
   - 15.1 Commands and flags
   - 15.2 Progress indication
   - 15.3 Output modes
   - 15.4 Error output standards
   - 15.5 Interactive mode (future)

## 16. Data Schemas [IMPLEMENTED]
   - 16.1 GroundedClaim
   - 16.2 PlatformConfig
   - 16.3 SynthesisResult
   - 16.4 ThreadedPost
   - 16.5 CostBreakdown

## 17. Implementation Phases (Revised)

   **Phase 0: Documentation Sync** (This Week)
   - [ ] Update PRD with implemented patterns
   - [ ] Document LLM strategy from code
   - [ ] Document error handling from code
   - [ ] Resolve RAG scope decision

   **Phase 1: Evaluation Foundation** (P0)
   - [ ] Create golden dataset (20 topics × 4 platforms)
   - [ ] Implement automated attribution check
   - [ ] Implement hallucination detection
   - [ ] Build regression test runner

   **Phase 2: Observability** (P0)
   - [ ] Structured logging implementation
   - [ ] Metrics collection to JSON
   - [ ] Basic dashboard (npm run metrics:dashboard)
   - [ ] Error rate tracking

   **Phase 3: Safety & Compliance** (P1)
   - [ ] PII detection in prompts/outputs
   - [ ] Content moderation integration
   - [ ] Budget enforcement (--max-cost)
   - [ ] Audit logging

   **Phase 4: Remaining Platforms** (P2)
   - [ ] Twitter/X implementation + threading
   - [ ] Bluesky implementation
   - [ ] Newsletter image integration

   **Phase 5: Resilience** (P2)
   - [ ] Multi-provider fallback chain
   - [ ] Cached result fallback
   - [ ] Circuit breaker for failing providers

## 18. Deferred to v2
   - RAG context management (re-evaluate with usage data)
   - Output storage vector DB
   - API posting integration
   - Scheduling / queue management
   - Multi-user authentication
   - Cloud sync

## 19. Open Questions & Risks
   - See Section G below

## 20. Appendices
   - A. Example prompts with expected outputs
   - B. Platform API references
   - C. Cost breakdown calculator
   - D. Golden dataset samples
   - E. Glossary
```

---

## G) Questions to Ask Stakeholders

### Product Strategy (5 Questions)

1. **Who is the v1 target user?** Solo creators? Agencies? Internal marketing teams? This affects feature prioritization and pricing model.

2. **What's the monetization plan?** Free OSS? Freemium with usage limits? Paid CLI license? Usage-based API?

3. **Is RAG still in scope for v1?** With 128k context windows, the original motivation (22k tokens) seems less critical. What's the actual pain point?

4. **What's the quality bar for launch?** Must hit 4.0/5 on human eval? Or "good enough to save time" (3.5/5)?

5. **What's the timeline pressure?** Are we optimizing for speed to market or production readiness?

### Technical Architecture (6 Questions)

6. **Multi-provider fallback priority?** If GPT-5.2 fails, should we fall back to Claude? What's the acceptable quality delta?

7. **Caching strategy?** Cache synthesis results by prompt hash? Expiration policy?

8. **Offline mode?** Should the CLI work without internet using local models (Llama, Mixtral)?

9. **Output storage format?** JSON only? Markdown export? Direct clipboard?

10. **Interactive mode scope?** Thread approval before posting? Edit-in-terminal? Or just batch generation?

11. **Plugin system?** Allow users to define custom platforms via config file? Custom prompts?

### Evaluation & Quality (4 Questions)

12. **Who does human evaluation?** Internal team? Contractors? The users themselves?

13. **How often run regression tests?** On every commit? Nightly? Before releases only?

14. **Acceptable hallucination rate?** Absolutely zero tolerance? Or <1% with disclosure?

15. **A/B testing priority?** Is comparing GPT vs Claude important for v1, or defer to v2?

### Security & Compliance (4 Questions)

16. **GDPR/CCPA requirements?** Are we serving EU/CA users? Affects data handling.

17. **Content moderation policy?** Block toxic content? Warn user? Allow with disclaimer?

18. **Copyright handling?** Maximum quote length before fair use concern? Paywall handling?

19. **PII in sources?** Redact automatically? Warn user? Pass through?

### Operations (4 Questions)

20. **On-call expectations?** Is this a personal project or production service requiring pager duty?

21. **Incident response?** Who gets paged? What's the escalation path?

22. **Cost alerting?** At what daily spend do we alert? $10? $50? $100?

23. **Uptime SLO?** 99%? 99.9%? Best-effort?

---

## H) Recommendations & Next Steps

### Immediate Actions (This Week)

1. **Sync PRD with Implementation**
   - Copy LLM strategy from `gpt.ts` to PRD
   - Document retry/error handling patterns
   - Update cost tables to match `cost.ts`
   - Estimate: 4-6 hours

2. **Decide on RAG Scope**
   - Stakeholder discussion: Is RAG v1 or v2?
   - If deferring: Remove from PRD, add to "Deferred" section
   - If keeping: Define MVP scope (context only? output storage?)

3. **Create Golden Dataset Foundation**
   - Start with 10 topics × 2 platforms = 20 cases
   - Manual baseline: Have a human write ideal posts for 5 topics
   - Store in `tests/golden/dataset.json`

### Short-Term (2 Weeks)

4. **Implement Evaluation Automation**
   - Attribution coverage checker
   - Hallucination detection (NLI model)
   - Quote integrity checker
   - `npm run eval:auto` command

5. **Add Basic Observability**
   - Structured logging to file
   - Metrics collection to `metrics.json`
   - Simple dashboard output

6. **Budget Enforcement**
   - `--max-cost` flag
   - Warning at 80% of budget
   - Block at 100%

### Medium-Term (1 Month)

7. **Complete Platform Coverage**
   - Twitter/X with threading
   - Bluesky
   - Validate all 6 platforms against golden dataset

8. **Content Safety**
   - PII detection
   - Moderation API integration
   - Audit logging

9. **Documentation**
   - Update README with current capabilities
   - Troubleshooting guide
   - Platform-specific tips

---

## I) Final Assessment

### PRD Readiness Score: 6.5/10

| Dimension | Score | Notes |
|-----------|-------|-------|
| Problem Clarity | 6/10 | User persona still vague |
| Architecture | 8/10 | Platform abstraction excellent |
| Implementation Alignment | 5/10 | PRD lags behind code |
| Production Readiness | 4/10 | Missing eval, observability, safety |
| Completeness | 7/10 | Core sections present, gaps identified |

### Comparison to Prior Review

| Metric | Prior Review | Current | Change |
|--------|--------------|---------|--------|
| Overall Score | 5/10 | 6.5/10 | +1.5 |
| P0 Issues | 6 | 2 | -4 (resolved) |
| Implementation Coverage | 30% | 55% | +25% |
| Production Ready | 30% | 45% | +15% |

### Path to Production

**Blocking Items** (Must complete):
1. Evaluation framework (golden dataset + automated checks)
2. Basic observability (logging, metrics, dashboard)
3. PRD-code synchronization

**High Priority** (Should complete):
4. Budget enforcement
5. Content moderation
6. Twitter/Bluesky implementation

**Recommended Timeline**:
- Weeks 1-2: Evaluation foundation + observability
- Weeks 3-4: Safety features + remaining platforms
- Week 5: Documentation + beta testing
- Week 6: Polish + launch

**Total Estimated Effort**: 6-8 weeks to production-ready v1

---

*Review prepared 2026-01-01. Next review recommended after Phase 1-2 completion.*
