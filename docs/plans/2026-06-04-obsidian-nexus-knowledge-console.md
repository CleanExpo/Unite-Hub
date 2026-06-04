# Obsidian Nexus Knowledge Console MVP Plan

Date: 2026-06-04
Source brief: CleanExpo/Unite-Hub issue #74
Execution branch: codex/obsidian-knowledge-console

## Planning Findings

The requested plan path did not exist when this pass started. The repo already contained earlier Obsidian planning material in:

- `docs/planning/OBSIDIAN_KNOWLEDGE_CONSOLE_PLAN.md`
- `docs/planning/OBSIDIAN_NEXUS_KNOWLEDGE_CONSOLE_PLAN.md`
- `docs/architecture/OBSIDIAN_NEXUS_HERMES_ARCHITECTURE.md`

Current code already has a founder route at `/founder/knowledge-console`, navigation entries in the sidebar, command palette, and topbar, a preview-only route at `/preview/knowledge-console`, founder-scoped knowledge GET APIs, and an additive Supabase migration for `knowledge_projects`, `knowledge_notes`, and `knowledge_batches`.

Issue #74 asks for planning before implementation and limits the first slice to a safe read-only MVP. The issue mentions `workspace_id`, but this repo's current operating rule is stronger and more specific: all DB access must scope by `founder_id`. This plan follows `founder_id` and rejects `workspace_id` for this feature.

## MVP Boundary

In scope for this pass:

- Keep Obsidian local-first. Do not clone, embed, or control Obsidian.
- Render an authenticated founder Knowledge Console at `/founder/knowledge-console`.
- Provide a safe preview mode at `/preview/knowledge-console` only when `KNOWLEDGE_CONSOLE_PREVIEW=1`.
- Read project and note data through founder-scoped GET routes only.
- Fall back to static demo data when the schema is not applied or not seeded.
- Show project filtering, note search, markdown preview, frontmatter, tags, loading, empty, and error states.
- Keep "Open in Obsidian" disabled unless ingestion later stores a safe URI/source metadata.
- Document future Hermes, RAG, ingestion, write-back, and video workflows without enabling them in the read-only console.

Out of scope for this pass:

- No local Obsidian REST/plugin API.
- No write-back to the vault.
- No note creation/update/delete routes for the founder UI.
- No video generation trigger from the Knowledge Console.
- No live DB changes from this task.
- No new dependencies.
- No broad redesign of the founder shell.

## Repo-Grounded Architecture

Route and UI:

- `src/app/(founder)/founder/knowledge-console/page.tsx` authenticates with `getUser()` and redirects unauthenticated users to `/auth/login`.
- `src/components/founder/knowledge-console/KnowledgeConsoleClient.tsx` owns the client-side read-only console, preview fallback, filtering, selected-note loading, and empty/error UI.
- `src/app/(preview)/preview/knowledge-console/page.tsx` renders the same client only when the preview env flag is enabled.

Read APIs:

- `GET /api/knowledge/projects` lists `knowledge_projects` with `.eq('founder_id', user.id)`.
- `GET /api/knowledge/notes` lists `knowledge_notes` with `.eq('founder_id', user.id)` and `.eq('is_deleted', false)`.
- `GET /api/knowledge/notes/[id]` reads a single note with `.eq('founder_id', user.id)`, `.eq('id', id)`, and `.eq('is_deleted', false)`.

Schema scaffold:

- `supabase/migrations/20260603000000_knowledge_schema_phase1.sql` is additive and founder-scoped.
- Authenticated RLS policy for this MVP should be SELECT-only. Future ingestion can use service-role controlled code or a separately reviewed write policy.

## Acceptance Criteria

- The new dated plan exists at `docs/plans/2026-06-04-obsidian-nexus-knowledge-console.md`.
- Knowledge Console remains available through founder navigation and command palette.
- The founder page and preview page render the read-only shell.
- The UI has no enabled write, video, or vault mutation action.
- Knowledge GET routes remain authenticated and founder-scoped.
- The migration does not grant normal authenticated insert/update/delete policies for Phase 1.
- Validation passes: `pnpm lint`, `pnpm type-check`, `pnpm test`, and `pnpm build`.

## Future Work After MVP

1. Apply and seed the schema through a reviewed environment-specific migration path.
2. Build a controlled ingestion worker that parses Markdown/frontmatter and upserts notes using service-role credentials server-side only.
3. Add RAG chunking and citation-backed Hermes actions once ingestion provenance is stable.
4. Revisit write-back and video creation as separate approval-gated features with explicit audit trails.
