# Compass — Unite Hub (injected before every message)

**Stack**: Next.js 16 (`src/`) + FastAPI (`apps/backend/`) + Supabase PostgreSQL + Redis
**Auth**: Supabase PKCE | **Design**: Scientific Luxury (#050505, #00F5FF, Framer Motion)
**CRITICAL**: ALL DB queries filter by `workspace_id` | Retrieval-First | Subagent delegation
**Agents**: 23 subagents | 59 skills | Orchestrator token cap: 80k
