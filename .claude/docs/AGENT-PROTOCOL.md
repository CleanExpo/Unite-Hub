# Unite-Group Nexus 2.0 — Agent Protocol

> Reconciled from Linear status updates (08/03/2026) for Unite-Group Nexus 2.0 single-tenant architecture.
> Replaces any previous multi-role RBAC references — Nexus 2.0 is single-tenant: `founder_id = auth.uid()`.

---

## 1. Agent Roster (Nexus 2.0 Mapping)

The Replit Agent 3 Model (Atlas/Forge/Pixel/Grid/Quill) maps to Unite-Group's Claude Code agent roster:

| Replit Role | Unite-Group Agent | Directory | Responsibility |
|-------------|-------------------|-----------|----------------|
| **Atlas** (Orchestrator) | `orchestrator` + `project-manager` | `.claude/agents/orchestrator/` | Planning, delegation, Linear issue creation, roadmap management |
| **Forge** (Code) | `senior-fullstack` | `.claude/agents/senior-fullstack/` | Next.js, Supabase, API routes, business logic |
| **Pixel** (UI/UX) | `frontend-designer` + `frontend-specialist` | `.claude/agents/frontend-designer/` | Scientific Luxury UI, Framer Motion, Tailwind, component architecture |
| **Grid** (Infra) | `devops-engineer` + `deploy-guardian` | `.claude/agents/devops-engineer/` | Vercel, CI/CD, env config, monitoring, branch protection |
| **Quill** (Docs/Review) | `code-auditor` + `docs-writer` | `.claude/agents/code-auditor/` | Code review, audit trails, documentation, security scanning |

### Supporting Specialists

| Agent | Trigger |
|-------|---------|
| `database-architect` | Schema design, migrations, RLS policies |
| `api-integrations` | Xero, Gmail, Calendar, Stripe, Linear, Publer |
| `qa-tester` + `test-engineer` | E2E tests, smoke tests, verification gates |
| `security-auditor` | Auth flows, RLS, secrets scanning |
| `performance-optimizer` | Core Web Vitals, bundle analysis, query optimisation |

---

## 2. Operational Modes

Each agent operates in one of three modes depending on task risk:

| Mode | Triggers | Oversight Level |
|------|----------|----------------|
| **AUTONOMOUS** | New files, config changes, additive code | Agent acts immediately, self-reviews |
| **SUPERVISED** | Existing file edits, schema changes, env vars | Agent proposes → Phill approves |
| **ESCALATE** | Delete operations, auth changes, production deploys | Hard stop → Phill action required |

**HIGH RISK triggers that always escalate** (from `cli-control-plane.md`):
- Database schema changes (migrations, column drops)
- Authentication/authorisation changes
- Force push, branch deletion, production deployments
- Removing environment variables

---

## 3. Build Execution Flow

```
DISCOVER     →  BLUEPRINT    →  IMPLEMENT   →  VERIFY      →  SHIP
─────────────────────────────────────────────────────────────────
orchestrator    project-mgr     senior-       qa-tester      devops-
scans files     creates spec    fullstack     runs gates     engineer
+ agents/       + Linear        implements    scores 0-100   deploys
```

### Phase Handoffs

```
Phase 1: orchestrator reads codebase state → produces BRIEF
Phase 2: project-manager locks spec → Linear issue created
Phase 3: senior-fullstack implements → commits on feature branch
Phase 4: qa-tester runs verification gates → score ≥ 90 → PASS
Phase 5: devops-engineer merges → Vercel deploys
```

---

## 4. Reflection Loop (Score-Driven)

Every non-trivial implementation goes through the reflection loop before being considered complete.

```
┌─────────────────────────────────────────────────────────────┐
│                     REFLECTION LOOP                         │
│                                                             │
│  1. GENERATE   →  Agent implements feature                  │
│  2. VERIFY     →  pnpm test + pnpm build + pnpm type-check  │
│  3. SCORE      →  Calculate 0–100 using scoring table       │
│                                                             │
│  Score ≥ 90  ──→  COMMIT + PROCEED                         │
│  Score < 90  ──→  Agent analyses failures + patches         │
│       ↑               │                                     │
│       └───────────────┘  (max 3 attempts)                   │
│                                                             │
│  3 failures  ──→  BLUEPRINT_ESCALATION → halt               │
└─────────────────────────────────────────────────────────────┘
```

### Scoring Table (0–100)

| Category | Weight | Pass Criteria |
|----------|--------|---------------|
| Unit test coverage | 30 pts | ≥ 80% on modified files (Vitest) |
| E2E pass rate | 25 pts | All Playwright specs pass |
| Build success | 20 pts | `pnpm build` exits 0 |
| Type safety | 15 pts | `pnpm type-check` → 0 errors |
| Lint | 10 pts | `pnpm lint` → 0 warnings |

**Verification commands:**
```bash
pnpm exec vitest run               # Unit tests (Vitest)
pnpm turbo run type-check          # TypeScript strict check
pnpm turbo run lint                # ESLint
pnpm build                         # Next.js production build
pnpm playwright test               # E2E (requires running server)
```

---

## 5. Sub-Agent Spawning Rules

### When to Spawn

Spawn a sub-agent when:
- Task domain is orthogonal to current work (no shared file state)
- Task requires specialised knowledge (DB schema vs UI vs infra)
- Parallel execution saves > 3 minutes of serial work

### How to Spawn (Claude Code `Task` tool)

```
Orchestrator dispatches via Task tool with:
1. Exact scope    — which files, which routes
2. Success criteria — what "done" looks like
3. File references — specific files to read
4. Constraints    — what NOT to touch
```

### Parallel vs Sequential

```
PARALLEL dispatch (all conditions met):
  ✓ 3+ unrelated tasks across different domains
  ✓ No shared state between tasks
  ✓ Clear file boundaries with no overlap

SEQUENTIAL dispatch (any condition triggers):
  ✗ Tasks have dependencies (B needs output from A)
  ✗ Shared files or state (merge conflict risk)
  ✗ Unclear scope (need to understand before proceeding)
```

### Token Budgets

| Agent | Context Budget |
|-------|---------------|
| Orchestrator | < 80,000 tokens |
| senior-fullstack | < 60,000 tokens |
| frontend-designer | < 60,000 tokens |
| database-architect | < 40,000 tokens |
| qa-tester | < 50,000 tokens |

---

## 6. Agent-Builds-Agent Protocol

Nexus 2.0 supports recursive sub-agent spawning for autonomous feature development.

### Trigger Conditions

An agent spawns child agents when:
- Current task decomposition reveals ≥ 3 independent sub-tasks
- Sub-task requires domain expertise outside the spawning agent's remit
- Iteration cap would be exceeded by sequential handling

### Depth Limit

```
Orchestrator (depth 0)
  └── senior-fullstack (depth 1)
        └── database-architect (depth 2)   ← MAX depth
              └── [NO further spawning]
```

Maximum recursive depth: **2 levels**. At depth 2, agents execute directly without further delegation.

### Spawning Protocol

```typescript
// Pattern used by orchestrator when delegating
{
  subagent: "senior-fullstack",
  scope: "src/app/api/businesses/route.ts",
  task: "Add PATCH /businesses/:id endpoint — update business fields",
  success: "TypeScript compiles, route returns 200 on valid input, 400 on invalid",
  constraints: [
    "Do NOT touch src/app/api/contacts/",
    "Use founder_id = auth.uid() (NOT workspace_id)",
    "No new dependencies without orchestrator approval"
  ]
}
```

### Escalation from Sub-Agents

Sub-agents MUST escalate (output `BLUEPRINT_ESCALATION`) when:
- Iteration cap reached (3 attempts)
- HIGH risk action detected (schema drop, auth change, force push)
- Task description is ambiguous
- Agentic node fails once (no retry for agentic nodes)

---

## 7. Nexus 2.0 Constraints (Single-Tenant)

All agents must enforce these Nexus 2.0 architecture constraints:

### Auth Pattern

```typescript
// CORRECT — single-tenant founder_id
const { data: { user } } = await supabase.auth.getUser();
if (!user) return notFound();

const { data } = await supabase
  .from('businesses')
  .select('*')
  .eq('founder_id', user.id);   // ← ALWAYS filter by founder_id

// WRONG — do not use workspace_id in Nexus 2.0
.eq('workspace_id', workspaceId)  // ← v1 pattern, never use in Nexus 2.0
```

### Locale

- All output: Australian English (colour, behaviour, optimisation)
- Dates: DD/MM/YYYY | Currency: AUD | Timezone: AEST/AEDT

### Design System

```
Background:  #050505 (OLED Black)
Accent:      #00F5FF (Cyan)
Border:      rounded-sm only (never rounded-md, rounded-lg, rounded-full)
Motion:      Framer Motion only (never CSS transitions on interactive elements)
```

### Database Tables (Nexus 2.0 Schema)

All 9 tables include `founder_id uuid REFERENCES auth.users NOT NULL`:
`businesses`, `contacts`, `nexus_pages`, `nexus_databases`, `nexus_rows`,
`credentials_vault`, `approval_queue`, `social_channels`, `connected_projects`

---

## 8. Inter-Agent Communication Format

When an agent hands off to another agent, it outputs a structured handoff:

```
HANDOFF TO: <agent-name>
COMPLETED:  <what was done>
OUTPUT:     <files created/modified, commit SHA>
NEXT TASK:  <exact description of what the next agent must do>
CONTEXT:    <any state the next agent needs to know>
CONSTRAINTS: <what the next agent must not touch>
```

---

## 9. Verification Gates

No agent proceeds past these gates without confirmation:

| Gate | Command | Required Result |
|------|---------|----------------|
| Type check | `pnpm turbo run type-check` | 0 errors |
| Lint | `pnpm turbo run lint` | 0 warnings |
| Unit tests | `pnpm exec vitest run` | All passing |
| Build | `pnpm build` | Exit code 0 |
| RLS audit | Manual (security-auditor) | founder_id on all tables |

---

## 10. Agent Registry

Full agent definitions in `.claude/agents/*/agent.md`.

| Nexus 2.0 Team | Legacy Specialists |
|----------------|-------------------|
| project-manager | spec-builder |
| senior-fullstack | frontend-specialist |
| database-architect | database-specialist |
| frontend-designer | backend-specialist _(archived — v1 FastAPI)_ |
| api-integrations | security-auditor |
| code-auditor | test-engineer |
| devops-engineer | verification |
| qa-tester | orchestrator |
