# Compass — Unite Hub (injected before every message)

**Stack**: Next.js 16 (`src/`) + Supabase PostgreSQL + Vercel
**Auth**: Supabase PKCE | **Design**: Scientific Luxury (#050505, #00F5FF, Framer Motion)
**CRITICAL**: ALL DB queries filter by `founder_id` (NEVER workspace_id) | Retrieval-First | Subagent delegation
**Agents**: 31 subagents | Orchestrator token cap: 80k
