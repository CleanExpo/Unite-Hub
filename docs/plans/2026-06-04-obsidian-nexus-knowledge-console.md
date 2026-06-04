# Obsidian Nexus Knowledge Console MVP Plan

Date: 2026-06-04
Source brief: CleanExpo/Unite-Hub issue #74
Execution branch: codex/obsidian-knowledge-console

## Status

This document merges the remote issue-brief plan with the current repo inspection. The remote plan correctly frames the product as an Obsidian-powered WebUI, but it used two stale assumptions for this Unite-Hub codebase:

- It proposed `/dashboard/knowledge`; this repo's founder shell uses `/founder/*`, and the Knowledge Console already exists at `/founder/knowledge-console`.
- It proposed `workspace_id`; this repo's current operating rule requires founder-scoped DB access with `founder_id`.

The accepted MVP path is therefore a read-only founder route at `/founder/knowledge-console`, backed only by founder-scoped read APIs.

## Planning Findings

Existing planning and architecture documents:

- `docs/planning/OBSIDIAN_KNOWLEDGE_CONSOLE_PLAN.md`
- `docs/planning/OBSIDIAN_NEXUS_KNOWLEDGE_CONSOLE_PLAN.md`
- `docs/architecture/OBSIDIAN_NEXUS_HERMES_ARCHITECTURE.md`

Current code already has:

- Founder route: `src/app/(founder)/founder/knowledge-console/page.tsx`
- Preview route: `src/app/(preview)/preview/knowledge-console/page.tsx`
- Client UI: `src/components/founder/knowledge-console/KnowledgeConsoleClient.tsx`
- Navigation entries in sidebar, command palette, and topbar
- Founder-scoped read APIs for projects and notes
- Additive Supabase schema scaffold for `knowledge_projects`, `knowledge_notes`, and `knowledge_batches`

## Product Decision

Do not clone, rebrand, iframe, or directly control Obsidian.

Architecture:

```text
Obsidian Vault
  -> Git/filesystem sync or reviewed local bridge
  -> Unite-Hub server-side ingestion
  -> Supabase founder-scoped knowledge tables
  -> Nexus Knowledge Console WebUI
  -> Hermes/OpenAI/Codex workflows after provenance is stable
```

## MVP Boundary

In scope:

- Authenticated founder Knowledge Console at `/founder/knowledge-console`.
- Preview shell at `/preview/knowledge-console` only when `KNOWLEDGE_CONSOLE_PREVIEW=1`.
- Project/vault browser, note list, markdown preview, tags, frontmatter, loading, empty, and error states.
- Founder-scoped GET APIs only.
- Static fallback data when the schema is missing or unseeded.
- Disabled `Open in Obsidian` affordance until safe metadata exists.
- Placeholder Hermes, RAG, ingestion, write-back, and video concepts as future work only.

Out of scope:

- No local Obsidian REST/plugin API.
- No note create/update/delete routes for the founder UI.
- No vault write-back.
- No video-generation trigger from the Knowledge Console.
- No live DB changes from this task.
- No new dependencies.
- No broad redesign of the founder shell.

## Repo-Grounded API Contract

- `GET /api/knowledge/projects` reads `knowledge_projects` with `.eq('founder_id', user.id)`.
- `GET /api/knowledge/notes` reads `knowledge_notes` with `.eq('founder_id', user.id)` and `.eq('is_deleted', false)`.
- `GET /api/knowledge/notes/[id]` reads one note with `.eq('founder_id', user.id)`, `.eq('id', id)`, and `.eq('is_deleted', false)`.

Normal authenticated users should receive SELECT-only RLS policies for the Phase 1 knowledge tables. Future ingestion should use reviewed server-side service-role code or a separately approved write policy.

## Acceptance Criteria

- This dated plan exists and reflects current Unite-Hub architecture.
- The Knowledge Console remains reachable through founder navigation and command palette.
- The founder page and preview page render the same read-only shell.
- The UI has no enabled write, video, or vault mutation action.
- Knowledge APIs are authenticated and founder-scoped.
- The Phase 1 migration does not grant normal authenticated insert/update/delete policies.
- Validation passes: `pnpm lint`, `pnpm type-check`, `pnpm test`, and `pnpm build`.

## Future Work

1. Apply and seed the schema through reviewed environment-specific migration operations.
2. Build a controlled Markdown/frontmatter ingestion worker.
3. Add chunking, embeddings, and citation-backed Hermes/RAG actions.
4. Revisit write-back and video creation as separate approval-gated features with audit trails.
