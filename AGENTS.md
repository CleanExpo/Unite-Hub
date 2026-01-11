# Unite-Hub - AI-First Marketing CRM & Automation Platform
## Guide for AI Coding Agents (Codex)

**Last Updated**: December 31, 2025
**Version**: 1.0.1
**Standard**: Agentic AI Foundation (AGENTS.md spec)

---

## Project Overview

**Purpose**: Multi-tenant CRM with AI agents for marketing automation  
**Products**: Unite-Hub (CRM) + Synthex.social (white-label platform)  
**Tech Stack**: Next.js (App Router), React 19, Supabase PostgreSQL, RabbitMQ  
**Port**: 3008 (not 3000)

**Architecture**: 3-layer system
```
┌─────────────────────────────────────┐
│ Next.js App Router (React 19)       │  ← Presentation Layer
├─────────────────────────────────────┤
│ AI Agents (stateless; queued)       │  ← Intelligence Layer
│ + Phase 2 reliability systems       │
├─────────────────────────────────────┤
│ Supabase PostgreSQL + RabbitMQ      │  ← Data & Messaging Layer
└─────────────────────────────────────┘
```

---

## Non-Negotiables

### 1) Multi-Tenant Isolation (MANDATORY)

Every database query MUST filter by `workspace_id` (unless a table is truly global/system).

```ts
const { data, error } = await supabase
  .from("contacts")
  .select("*")
  .eq("workspace_id", workspaceId); // REQUIRED

if (error) throw error;
```

If you add or change any query, verify the `workspace_id` filter exists (and that `workspaceId` comes from validated context).

### 2) Validate User + Workspace on API Routes

All API routes must:
1. Read `workspaceId` from query params
2. Validate user access to that workspace
3. Apply `.eq("workspace_id", workspaceId)` on all queries
4. Use `withErrorBoundary`

Pattern:
```ts
import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { validateUserAndWorkspace, successResponse, errorResponse } from "@/lib/api-helpers";
import { withErrorBoundary } from "@/lib/error-boundary";

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) return errorResponse("workspaceId required", 400);

  await validateUserAndWorkspace(req, workspaceId);
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from("your_table")
    .select("*")
    .eq("workspace_id", workspaceId);

  if (error) return errorResponse(error.message, 500);
  return successResponse(data);
});
```

### 3) Agents Are Stateless (Queue-Only Coordination)

- Agents communicate via RabbitMQ (no peer-to-peer coordination).
- Persist state in Supabase tables and the memory system.
- Verification is required for agent outputs.

See:
- `src/lib/agents/independent-verifier.ts`
- `src/lib/agents/cost/budgetEnforcer.ts`

---

## Code Style & Standards

### TypeScript
- Strict mode required
- Prefer functional, immutable patterns
- Use `async/await`
- Explicit return types on functions
- Avoid `any` (use proper types or `unknown`)

### Testing
- Framework: Vitest
- Command: `npm run test`

### Documentation
- Architecture changes: update `.claude/CLAUDE.md`
- New/changed agents: update `.claude/agent.md` and `.claude/agents/registry.json`
- New API endpoints: update `src/app/api/API-GUIDE.md`

---

## Key Patterns

### Agent Task Shape

```ts
interface AgentTask {
  id: string;
  workspace_id: string; // REQUIRED
  task_type: string;
  agent_name: string;
  payload: Record<string, any>;
  priority: number; // 0-10
  retry_count: number;
  max_retries: number; // default: 3
}
```

### Database Migrations (Idempotent)

- Use `IF NOT EXISTS`, `CREATE OR REPLACE`, `DROP POLICY IF EXISTS`
- Always include workspace isolation in RLS policies

See: `.claude/rules/database-migrations.md`

---

## Development Workflow

### Run locally
- `npm run dev` (starts on port 3008)

### Validate
- `npm run typecheck`
- `npm run test`

---

## Codex Skills (Recommended)

This repo can include reusable workflows as skills in `.codex/skills/`.

- A skill is `.codex/skills/<skill-name>/SKILL.md`
- Codex loads only skill metadata at startup (progressive disclosure)
- Invoke explicitly by mentioning `$<skill-name>` in your prompt

Starter skills live in `.codex/skills/` (repo-scoped).

---

## Codex SDK (Programmatic Control)

Use the Codex SDK when you need programmatic control (CI/CD, bots, internal tooling).

- Install: `npm install @openai/codex-sdk`
- Start/resume threads and call `run()` repeatedly
- Persist `threadId` to continue work later

---

## Quick Reference

- Dev server port: `3008`
- App: `src/app/`
- Agents: `src/lib/agents/`
- Tests: `tests/`
- Supabase migrations: `supabase/migrations/`
