# Unite-Hub Tech Stack

**Status**: ⏳ To be migrated from CLAUDE.md
**Last Updated**: 2026-01-15

---

## Overview

Unite-Hub is an AI-first CRM and marketing automation platform.

## Frontend

- **Next.js 16.0.1** - React framework with App Router and Turbopack
- **React 19.0.0** - UI library with Server Components
- **TypeScript 5.x** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library (50+ components)
- **Lucide React** - Icon system
- **Framer Motion** - Animations

## Backend

- **Next.js API Routes** - Serverless API endpoints (104 routes)
- **Supabase PostgreSQL** - Database with Row Level Security
- **NextAuth.js** - Authentication with SupabaseAdapter
- **Google Gmail API** - OAuth 2.0 email integration

## AI & Integrations

**Anthropic Claude API**:
- `claude-opus-4-5-20251101` - Content generation (Extended Thinking)
- `claude-sonnet-4-5-20250929` - Standard operations
- `claude-haiku-4-5-20251001` - Quick tasks

**Other Services**:
- `@anthropic-ai/sdk` v0.68.0 - Official SDK
- `googleapis` v166.0.0 - Gmail API client
- Perplexity Sonar - SEO intelligence
- OpenRouter - Multi-model routing

## Database

**PostgreSQL via Supabase**:
- 15 core tables
- Row Level Security (RLS) policies
- Real-time subscriptions
- Vector embeddings (pgvector)

See: `architecture/database.md` for complete schema

## Infrastructure

- **Hosting**: Local development (port 3008)
- **Database**: Supabase (cloud PostgreSQL)
- **Auth**: Supabase Auth (PKCE flow)
- **Storage**: Supabase Storage
- **Real-time**: WebSocket, Redis, Bull queues

---

**To be migrated from**: CLAUDE.md lines 125-148
