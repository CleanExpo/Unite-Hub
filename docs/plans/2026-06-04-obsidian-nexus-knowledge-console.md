# Obsidian Nexus Knowledge Console — Implementation Plan

> **For Codex / Hermes / Rana:** This plan converts GitHub issue #74 into an actionable Unite-Hub delivery path. Start in planning mode, inspect the repo, then implement only the read-only MVP unless Phill explicitly approves write-back.

## Status

- **Date:** 2026-06-04
- **Repository:** `CleanExpo/Unite-Hub`
- **Related issue:** #74
- **Scope:** Design and scaffold a modern Obsidian-powered WebUI inside Unite-Hub / Unite-Group Nexus.
- **Initial implementation mode:** Read-only, additive, non-destructive.

## Repo-grounded findings

The current README identifies Unite-Hub as an AI-powered marketing CRM built with Next.js 16, Supabase, and Claude AI. The feature set already includes an AI intelligence layer with email agent, content generator, contact intelligence, and an orchestrator. It also has a modern dashboard and a multimedia input system with full-text search, workspace isolation, RLS policies, and AI analysis.

Existing docs already contain a Kanban + Obsidian integration plan at `docs/plans/2026-03-07-kanban-implementation.md`. That plan proposes a native Next.js 16 Kanban module, Supabase-backed tasks, Obsidian sync paths, and AI agent access via MCP. This new Knowledge Console plan should **not duplicate that Kanban work**. It should sit above it as the founder/operator knowledge layer.

Existing runbook references development commands and operational routes including `/dashboard/contacts`. This suggests the Knowledge Console should follow the dashboard convention rather than create an unrelated top-level app area.

## Product decision

Do not clone, rebrand, or iframe Obsidian.

The correct product architecture is:

```text
Obsidian Vault
  ↓
Vault Bridge / Git Sync / Local Plugin Bridge
  ↓
Unite-Hub API Layer
  ↓
Supabase + pgvector + RLS
  ↓
Nexus Knowledge Console WebUI
  ↓
Hermes + OpenAI/Claude Agents + Codex Workflows
```

## Roles of each system

| System | Role |
|---|---|
| Obsidian | Local-first Markdown vault and human thinking layer |
| Unite-Hub / Unite-Group Nexus | Secure WebUI command centre and operating console |
| Supabase | Durable system of record, workspace isolation, RLS boundary |
| Hermes | Orchestration brain and project routing layer |
| OpenAI / Claude | Reasoning, summarisation, extraction, RAG, prompt generation |
| Codex | Repo implementation and validation worker |

## MVP module name

Recommended name:

```text
Nexus Knowledge Console
```

Acceptable UI labels:

- Knowledge Console
- Vault Console
- Hermes Knowledge Hub
- Nexus Vault

## Recommended route

Use existing dashboard conventions where possible.

Recommended first route:

```text
/dashboard/knowledge
```

Later project-specific route:

```text
/dashboard/projects/[projectId]/knowledge
```

## Read-only MVP scope

The first implementation must be read-only.

Required MVP features:

1. Vault browser shell
2. Markdown preview panel
3. Project filter
4. Tag/status filter
5. Linked notes panel
6. Frontmatter/metadata display
7. Placeholder semantic search box
8. Placeholder Hermes actions panel
9. `Open in Obsidian` URI button where note path is available
10. Empty/loading/error states
11. Workspace-aware access pattern
12. No write-back to local files
13. No direct browser call to local Obsidian APIs

## Suggested UI layout

```text
+------------------------------------------------------+
| Nexus Knowledge Console                              |
| Search vault notes, project handoffs, and decisions  |
+----------------------+-------------------------------+
| Project/Vault Nav    | Selected Note Preview          |
| - RestoreAssist      | # Note title                   |
| - Synthex            | Markdown preview               |
| - Unite-Hub          | Frontmatter card               |
| - CARSI              | Linked actions                 |
| - CCW                | Hermes actions                 |
| - DRQ / NRPG         | Open in Obsidian               |
+----------------------+-------------------------------+
```

## Project groups

Initial hardcoded or seeded filters may include:

- RestoreAssist
- Synthex
- Unite-Group Nexus
- CARSI
- CCW
- Disaster Recovery / NRPG

Later these should come from the existing projects/workspaces model.

## Data model proposal

Additive Supabase tables only. Do not destructively modify existing tables.

Suggested tables:

```text
vaults
vault_files
vault_note_chunks
vault_links
vault_tags
vault_frontmatter
vault_embeddings
note_project_links
note_action_items
agent_handoffs
```

### `vaults`

Purpose: registered knowledge vaults per workspace.

Recommended fields:

```sql
id uuid primary key default gen_random_uuid(),
workspace_id uuid not null references workspaces(id) on delete cascade,
name text not null,
source_type text not null check (source_type in ('obsidian','git','filesystem','import')),
root_label text,
sync_mode text not null default 'read_only' check (sync_mode in ('read_only','approval_write','disabled')),
created_by uuid references auth.users(id) on delete set null,
created_at timestamptz default now(),
updated_at timestamptz default now()
```

### `vault_files`

Purpose: one row per Markdown file or vault asset.

Recommended fields:

```sql
id uuid primary key default gen_random_uuid(),
workspace_id uuid not null references workspaces(id) on delete cascade,
vault_id uuid not null references vaults(id) on delete cascade,
project_id uuid,
path text not null,
title text,
slug text,
content_hash text,
markdown_body text,
frontmatter jsonb default '{}'::jsonb,
tags text[] default '{}',
status text default 'active',
last_synced_at timestamptz,
created_at timestamptz default now(),
updated_at timestamptz default now()
```

### `vault_note_chunks`

Purpose: RAG-ready chunks from Markdown notes.

Recommended fields:

```sql
id uuid primary key default gen_random_uuid(),
workspace_id uuid not null references workspaces(id) on delete cascade,
vault_file_id uuid not null references vault_files(id) on delete cascade,
chunk_index int not null,
heading text,
content text not null,
token_count int,
content_hash text,
created_at timestamptz default now()
```

### `note_project_links`

Purpose: link notes to project/workflow context.

Recommended fields:

```sql
id uuid primary key default gen_random_uuid(),
workspace_id uuid not null references workspaces(id) on delete cascade,
vault_file_id uuid not null references vault_files(id) on delete cascade,
project_id uuid not null,
link_type text not null default 'reference',
created_by uuid references auth.users(id) on delete set null,
created_at timestamptz default now()
```

### `agent_handoffs`

Purpose: structured handoffs from notes to Hermes/Codex/Rana/Margot.

Recommended fields:

```sql
id uuid primary key default gen_random_uuid(),
workspace_id uuid not null references workspaces(id) on delete cascade,
project_id uuid,
vault_file_id uuid references vault_files(id) on delete set null,
agent_name text not null,
handoff_type text not null,
summary text,
payload jsonb default '{}'::jsonb,
status text not null default 'draft',
created_by uuid references auth.users(id) on delete set null,
created_at timestamptz default now(),
updated_at timestamptz default now()
```

## RLS and security model

Non-negotiables:

1. Every table must include `workspace_id`.
2. No unauthenticated access to vault content.
3. No public API route may return internal notes.
4. No direct browser access to local Obsidian REST APIs.
5. Local plugin bridge, if used later, must be behind explicit local trust and never exposed publicly.
6. Write-back requires approval, audit logs, and conflict detection.
7. Customer/client workspaces must never see internal founder vault notes.

Recommended first policy direction:

```text
Users can read vault records only when they belong to the same workspace and have an allowed internal role.
```

Exact RLS must follow existing Unite-Hub role/workspace helper functions.

## Ingestion strategy

### Option A — Git/filesystem sync bridge

Recommended for production.

```text
Obsidian Vault → Git/file watcher → Markdown parser → Supabase → pgvector → Nexus UI
```

Strengths:

- Auditable
- Versionable
- Recoverable
- Safer for production
- Works with Codex review patterns

Weaknesses:

- More setup
- Requires sync discipline

### Option B — Local Obsidian plugin bridge

Useful later for internal desktop automation.

Strengths:

- Can support local write-back
- Can open active file / command context
- Good for Hermes local control

Weaknesses:

- Must not be publicly exposed
- Requires local security review
- Not suitable as direct SaaS backend

### Option C — Obsidian URI links

Useful immediately as convenience only.

Strengths:

- Low risk
- Easy to open notes locally
- No write access

Weaknesses:

- Not enough for search, ingestion, RAG, or dashboards

## Hermes/OpenAI integration design

Initial read-only actions:

- Summarise selected note
- Extract action items
- Generate Codex task prompt
- Generate PR handoff
- Classify note by project
- Produce founder briefing
- Explain project history from linked notes

Rules:

- Agent answers must cite source note paths.
- AI output is not the system of record.
- Durable extracted actions go into Supabase after approval.
- Any write-back into Obsidian must be a later gated phase.

## Frontmatter standard

Recommended note metadata:

```yaml
---
workspace_id: unite-group
project_id: restoreassist
source: obsidian
note_type: handoff
status: draft
owner: phill
agent_owner: hermes
linked_app: unite-group-nexus
visibility: internal
created_at: 2026-06-04
updated_at: 2026-06-04
---
```

## Suggested vault folder structure

```text
/Unite-Group-Vault
  /00-Inbox
  /01-Daily-Notes
  /02-Projects
    /RestoreAssist
    /Synthex
    /Unite-Group-Nexus
    /CARSI
    /CCW
    /Disaster-Recovery-NRPG
  /03-Agent-Handoffs
    /Hermes
    /Rana
    /Codex
    /Margot
  /04-Research
    /SEO-AEO-GEO
    /OpenAI
    /Obsidian
    /Competitors
  /05-Skills
    /Hermes-Skills
    /Codex-Skills
    /Nexus-Skills
  /06-Templates
  /07-Decisions
  /08-Archive
```

## Implementation phases

### Phase 1 — UI shell and docs

Deliver:

- `/dashboard/knowledge` read-only route
- Cards for Vault Browser, Note Preview, Hermes Actions, Linked Projects
- Mock/demo data only if repo already has a safe pattern
- No new external services
- No vault sync yet

### Phase 2 — Supabase schema

Deliver:

- Additive migration
- RLS policies
- Seed/demo records for internal workspace only, if safe
- API read endpoints

### Phase 3 — Ingestion worker

Deliver:

- Markdown parser
- Frontmatter extraction
- File hash tracking
- Chunking
- Optional embedding queue

### Phase 4 — Hermes action layer

Deliver:

- Ask Hermes about note
- Extract action items
- Generate Codex prompt
- Generate handoff
- Store agent run history

### Phase 5 — Approval-gated write-back

Deliver only after review:

- Create note
- Append note
- Update frontmatter
- Conflict detection
- Audit log

## Validation plan

Use repo scripts from `package.json`. If available, run:

```bash
npm run build
npm test
npm run test:e2e
```

If pnpm scripts exist, use the matching pnpm equivalents.

Required checks before PR review:

1. TypeScript compile passes
2. Build passes or known warnings are documented
3. Lint passes or existing warnings are documented
4. No RLS regression
5. No public route exposes vault content
6. No secrets committed
7. No write-back enabled

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Exposing private Obsidian notes | Workspace-scoped RLS and internal-role checks |
| Local REST plugin exposed publicly | Do not call local plugin from browser/public routes |
| AI hallucinating project history | Require source note path citations |
| Write conflicts with Obsidian | Delay write-back until conflict detection exists |
| Duplicating Kanban work | Treat this as knowledge layer above existing Kanban plan |
| Overbuilding | Ship read-only UI first |

## Immediate Codex task

Codex should now:

1. Inspect current app route/layout conventions.
2. Identify the safest route for `/dashboard/knowledge`.
3. Identify reusable dashboard components.
4. Create a minimal read-only UI shell only if safe.
5. Do not modify auth, billing, Stripe, onboarding, or public routes.
6. Report commands run and validation results.

## Local Windows correction for Phill

The repo exists at:

```powershell
C:\Users\Disaster Recovery 4\Unite-Hub
```

Use this command to enter it:

```powershell
cd /d "C:\Users\Disaster Recovery 4\Unite-Hub"
```

Do not type the path by itself as a command.
Do not concatenate `dir` onto the `cd` command.

To list Codex environments, run:

```powershell
codex cloud
```

The installed CLI says `codex cloud` lists available environments. Then run:

```powershell
codex cloud exec --env <ENV_ID> --branch codex/obsidian-knowledge-console "Use CleanExpo/Unite-Hub issue #74 and docs/plans/2026-06-04-obsidian-nexus-knowledge-console.md as the task brief. Planning mode first. Inspect repo, then scaffold only the safe read-only Knowledge Console MVP."
```
