# GroundedPosts - TODO

## Phase 1: Platform Abstraction (Foundation)

### 1.1 Create Platform Types
- [ ] Create `src/platforms/types.ts` with PlatformConfig interface
- [ ] Define Platform type union ('linkedin' | 'threads' | 'twitter' | 'bluesky')
- [ ] Define ToneProfile, HashtagPolicy, FormattingConfig types
- [ ] Create PlatformMetadata interface for output

### 1.2 Implement Platform Registry
- [ ] Create `src/platforms/index.ts` with platform registry
- [ ] Implement `getPlatformConfig(platform: Platform)` function
- [ ] Implement `validatePlatformOutput(post: string, platform: Platform)` function
- [ ] Add platform listing utility

### 1.3 Extract LinkedIn Config
- [ ] Create `src/platforms/linkedin.ts`
- [ ] Move LINKEDIN_POST_MAX_LENGTH and hashtag constants
- [ ] Extract LinkedIn system prompt to platform config
- [ ] Extract LinkedIn tone guidelines
- [ ] Create LinkedIn output schema

### 1.4 Update Synthesis Module
- [ ] Add `platform` parameter to synthesis functions
- [ ] Update `buildSynthesisPrompt` to accept platform config
- [ ] Rename `linkedinPost` → `post` in response types
- [ ] Update prompts.ts to use platform-specific guidelines
- [ ] Maintain backward compatibility during migration

### 1.5 Update Schemas
- [ ] Rename LinkedInPost → PlatformPost
- [ ] Add `platform` field to SynthesisResult
- [ ] Create platform-specific validation refinements
- [ ] Update all schema imports

## Phase 2: Threads & Substack Support

### 2.1 Threads Platform Config ✅
- [x] Create `src/platforms/threads.ts`
- [x] Define 500 char limit, optional hashtags
- [x] Write casual/conversational tone guidelines
- [x] Create Threads-specific system prompt

### 2.2 Substack Platform Config ✅
- [x] Create `src/platforms/substack.ts` (Posts + Notes)
- [x] Define newsletter constraints (15000 chars, no hashtags)
- [x] Define Notes constraints (1000 chars, optional hashtags)
- [x] Write conversational tone guidelines
- [x] Create Substack-specific system prompts

### 2.3 Newsletter Image Generation
- [ ] Define NewsletterImageBrief schema
- [ ] Update Substack synthesis prompt for image briefs
- [ ] Generate 2-3 image briefs per newsletter (header, section-break, takeaway)
- [ ] Integrate with NanoBanana Pro for actual image generation
- [ ] Add image placement hints in output

### 2.4 Platform Schema Updates
- [ ] Add `substack` and `substack-notes` to schema enums
- [ ] Define newsletter-specific output fields
- [ ] Add image briefs array to newsletter results
- [ ] Test schema validation for both Substack types

## Phase 3: Twitter/X Support

### 3.1 Twitter Platform Config
- [ ] Create `src/platforms/twitter.ts`
- [ ] Define 280 char limit with t.co handling
- [ ] Implement thread detection (when content > 280)
- [ ] Create punchy tone guidelines

### 3.2 Thread Generation
- [ ] Implement smart thread splitting
- [ ] Handle thread numbering (1/n format)
- [ ] Preserve sentence boundaries
- [ ] Test thread continuity

## Phase 4: CLI Updates

### 4.1 Platform Flag
- [ ] Add `--platform, -p` option to CLI
- [ ] Support comma-separated platforms (linkedin,threads)
- [ ] Implement `--platform all` mode
- [ ] Update help text with platform examples

### 4.2 Output Handling
- [ ] Generate per-platform output files
- [ ] Update output naming: `{topic}-{platform}.json`
- [ ] Add platform comparison summary for multi-platform runs
- [ ] Update verbose logging per platform

## Phase 5: Polish & Cleanup

### 5.1 Bluesky Support
- [ ] Create `src/platforms/bluesky.ts`
- [ ] Define 300 char limit
- [ ] Create conversational tone guidelines
- [ ] Test with sample prompts

### 5.2 Code Cleanup
- [ ] Remove all "linkedin" references from generic code
- [ ] Update all test fixtures
- [ ] Remove dead code from migration
- [ ] Update README with multi-platform examples

### 5.3 Testing
- [ ] Add platform-specific unit tests
- [ ] Test same prompt across all platforms
- [ ] Validate constraint enforcement per platform
- [ ] Performance test multi-platform generation

## Technical Debt

### From Migration
- [ ] Audit all files for LinkedIn-specific naming
- [ ] Update error messages to be platform-agnostic
- [ ] Review and update all JSDoc comments
- [ ] Clean up unused LinkedIn constants

### Code Quality
- [ ] Add platform config validation on load
- [ ] Implement platform feature detection
- [ ] Add telemetry per platform
- [ ] Document platform extension process

## Notes

- Maintain backward compatibility: `--platform linkedin` should work identically to old behavior
- Platform configs should be hot-swappable without code changes
- Consider platform config files (JSON/YAML) for easy customization in future
