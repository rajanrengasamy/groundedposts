# Project Guidelines

## Overview
GroundedPosts is a multi-platform content generation CLI that creates verified, source-attributed posts for various social platforms (LinkedIn, Threads, Twitter/X, etc.).

## Architecture
- `src/platforms/` - Platform-specific configurations and prompts
- `src/synthesis/` - LLM-powered content synthesis (GPT, Claude, Gemini, Kimi)
- `src/collectors/` - Source collection from web, social media
- `src/schemas/` - Zod schemas for validation
- `src/utils/` - Shared utilities (logging, sanitization, cost tracking)

## Working with External APIs (Gemini, OpenAI, etc.)
- Always search for the latest documentation before using model IDs
- Verify current API endpoints and parameters

## Key Concepts
- **Platform**: Target social platform (linkedin, threads, twitter, bluesky)
- **Grounded Claims**: Verified facts with source URLs
- **Synthesis**: LLM-generated content from grounded claims

## Commands
- `npm run dev` - Run in development mode
- `npm run build` - Build TypeScript
- `npm run test` - Run tests
- `npm run typecheck` - Type check without emitting
