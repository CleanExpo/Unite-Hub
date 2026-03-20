# Core Governance Rules

> **Authority**: Constitutional layer. Loaded for every session. Overrides all other rules when conflicts arise.
> **Source**: Adapted from NodeJS-Starter-V1 framework for Unite-Group Nexus (Next.js/Supabase).

---

## Operational Constitution

The single source of truth for project identity, values, and constraints is:

**`.claude/memory/CONSTITUTION.md`** — Human-authored. Never modified by agents.

All agent behaviour must align with the Constitution. When in doubt, re-read it.

---

## Intent-Driven Workflow Mapping

User intent determines execution mode and governance intensity. Detection logic lives in `cli-control-plane.md` — this file defines the behavioural contract per mode.

| User Intent | Execution Mode | Workflow |
|------------|---------------|----------|
| "Build this feature" | BUILD | Spec → Implement → Verify → Commit |
| "Fix this bug" | FIX | Reproduce → Diagnose → Fix → Verify |
| "Clean up this code" | REFACTOR | Analyse → Plan → Refactor → Verify |
| "Migrate to X" | MIGRATE | Audit → Plan → Migrate → Rollback-ready |
| "Deploy this" | DEPLOY | Verify → Stage → Deploy → Monitor |
| "Plan the architecture" | PLAN | Research → Options → Trade-offs → Recommend |
| "Audit the codebase" | AUDIT | Scan → Classify → Report → Prioritise |
| "How does X work?" | EXPLORE | Read → Trace → Explain |

**Rule**: Match intent to mode. Execute mode workflow. Do not mix modes mid-task.

---

## Anti-Hallucination Protocol

Classify every factual claim before acting on it:

| Classification | Definition | Action |
|---------------|-----------|--------|
| **Confirmed** | Read from file, tool output, user-provided | Act freely |
| **Inferred** | Logical deduction from confirmed facts | Act with note |
| **Assumed** | Not verified by any source | **Pause and verify before acting** |

### Never Invent

- API endpoint shapes or response formats
- Database table names, columns, or relationships
- File paths or directory structures
- Environment variable names or values
- Package versions or compatibility claims
- Configuration options or flags

### Verification Method

When a claim is **Assumed**, verify using:
1. **Vault Index** — `.claude/VAULT-INDEX.md` for O(1) asset lookup
2. **Retrieval-First Protocol** — `.claude/rules/retrieval-first.md` for source hierarchy
3. **Codebase search** — Grep/Glob for implementation details
4. **User confirmation** — Ask if verification is not possible programmatically

---

## Retrieval Hierarchy

Before answering any question or making any recommendation, consult sources in this order. Full protocol in `.claude/rules/retrieval-first.md`.

```
0. Vault Index        — .claude/VAULT-INDEX.md (O(1) asset lookup)
1. NotebookLM         — Project-specific knowledge
2. Context7 MCP       — Library/framework documentation
3. Skills             — Pattern libraries (.skills/custom/)
4. Codebase search    — Grep/Glob for implementation details
5. Web search         — Last resort for external/current information
```

---

## Stack Constraints

Unite-Group Nexus is a **Next.js-only** project. These are hard constraints:

| Allowed | Prohibited |
|---------|-----------|
| Next.js 16 App Router | FastAPI, Flask, Django |
| React 19, TypeScript | Python backend services |
| Supabase (PostgreSQL, Auth, Storage) | SQLAlchemy, Alembic |
| Tailwind CSS v4 | CSS-in-JS (styled-components, emotion) |
| Vercel deployment | Docker for production |
| pnpm monorepo | npm, yarn |
| Server Actions, API Routes | Express.js, Hono |

**If a template, skill, or reference suggests Python/FastAPI patterns, translate to Next.js equivalents or discard.**

---

## Single-Tenant Enforcement

- **One user**: Phill McGurk (founder)
- **No multi-tenancy**: No workspace_id, no team features, no user switching
- **DB queries**: Always `.eq('founder_id', founderId)` — never workspace_id
- **Auth**: Supabase PKCE server-side only

---

## Australian Defaults

All output must use Australian English and conventions. Enforced by the `standards` agent and `pre-response` hook. See `.claude/agents/standards/agent.md` for full specification.

- **Spelling**: colour, behaviour, optimisation, analyse, centre, licence (noun)
- **Dates**: DD/MM/YYYY
- **Currency**: AUD ($)
- **Timezone**: AEST/AEDT

---

## Cross-References

- **Detection logic**: `.claude/rules/cli-control-plane.md`
- **Retrieval protocol**: `.claude/rules/retrieval-first.md`
- **Output quality**: `.claude/rules/slop-prevention.md`
- **Response structure**: `.claude/rules/audit-mode-classifier.md`
- **Constitution**: `.claude/memory/CONSTITUTION.md`
- **Compass**: `.claude/memory/compass.md`
