---
name: system-supervisor
category: architecture
version: 1.0.0
priority: P1
auto_load: true
triggers:
  - new_file_creation
  - new_abstraction
  - new_dependency
  - schema_addition
  - api_route_addition
  - component_creation
  - refactor
  - architecture_discussion
description: |
  Apply this skill before creating new files, new abstractions, new dependencies, new
  API routes, new database tables, or new components. Detects architectural drift,
  complexity accumulation, and pattern violations before they get committed.
  Also applies when reviewing existing code for structural issues.
  P1 auto-load — always active when the system structure changes.
context: fork
---

# System Supervisor

## The Default Being Overridden

Left unchecked, LLMs default to:
- **Parallel creation**: Adding a new file/function/abstraction that duplicates one already existing, because the existing one wasn't checked for
- **Complexity ratchet**: Each session adds complexity; no session removes it; over time the codebase drifts from its design patterns
- **Premature abstraction**: Creating helper utilities, shared functions, and wrappers for single-use operations
- **Unchecked dependency growth**: Adding packages without considering their cost (bundle size, maintenance burden, conflict risk)
- **Pattern amnesia**: Implementing a pattern differently from how it's already done elsewhere in the same codebase
- **Silent accumulation**: File counts, function counts, and dependency counts grow without any awareness or concern

This skill overrides those defaults with a structural awareness layer.

---

## Pre-Creation Check (Run Before Creating Anything New)

Before creating a new file, function, component, hook, utility, or API route:

```
Pre-creation check for: [thing being created]

□ Does something serving this purpose already exist?
   → Search: grep for the function name, class name, or similar purpose
   → If found: extend or reuse it — do not create a parallel

□ Is this abstraction used in more than one place?
   → If NO: inline it — don't extract a helper for a single caller
   → If YES: extract to the appropriate shared location

□ Does this follow the existing pattern for its category?
   → Check: how are other [API routes / components / hooks / services] in this codebase structured?
   → Mirror the structure — do not invent a new convention

□ What is the dependency cost?
   → New package: check bundle size impact, update frequency, alternatives
   → Built-in alternative: prefer native APIs over packages when they're sufficient
```

If any check fails, resolve it before proceeding.

---

## Drift Detection Signals

These are signals that architectural drift is occurring. Flag them when spotted:

### Signal 1: Naming inconsistency
The same concept has multiple names in different parts of the codebase (e.g., `founderId`, `founder_id`, `userId`, `createdBy` all referring to the same auth.uid()).

**Action**: Standardise the name. Pick the convention used in the database schema and propagate it.

---

### Signal 2: Pattern divergence
Two API routes that do similar things but are structured differently (e.g., one uses Zod validation, one uses manual type guards; one returns `{ data }`, another returns the object directly).

**Action**: Identify the canonical pattern (the one already in the majority). Refactor the divergent instance to match.

---

### Signal 3: Parallel implementations
Two functions/hooks/components that do the same thing in slightly different ways (e.g., `useFounderData()` and `useFounderProfile()` both fetching the same record).

**Action**: Pick one. Delete the other. Update all callers.

---

### Signal 4: Abstraction creep
Utility files with many small functions that are each only called once, each added over time by different sessions.

**Action**: Move the logic inline to its single caller. Delete the utility function.

---

### Signal 5: Dependency sprawl
Multiple packages solving the same problem (e.g., `date-fns` and `dayjs` both present; `axios` and `fetch` wrappers both used).

**Action**: Identify the canonical choice (whichever is more thoroughly used). Remove the other.

---

### Signal 6: Schema/type mismatch
TypeScript types that don't match the Supabase-generated types in `src/types/database.ts` — manually written interfaces that shadow the generated ones.

**Action**: Delete the manual interface. Use the generated type. Add a comment if the generated type needs augmentation.

---

## Complexity Budget

The codebase has a complexity budget. Every addition spends from it; deletions deposit back.

**Complexity flags** — when the following thresholds are exceeded, flag it before proceeding:

| Metric | Flag threshold | Action |
|--------|----------------|--------|
| Number of `src/lib/` utility files | > 30 | Consolidate by domain |
| Number of API route files | > 60 | Review for duplicate endpoints |
| Number of Supabase migrations | > 200 | Consolidate into new baseline |
| Number of dependencies in `package.json` | > 80 | Audit for redundancy |
| Lines in a single component file | > 300 | Extract sub-components |
| Lines in a single service file | > 250 | Extract to focused services |
| Nesting depth in a single function | > 4 | Extract to named functions |

These are not hard stops — they are flags for review. A component with 400 lines might be justified. But the threshold must be crossed consciously, not by accident.

---

## Architecture Reference (Unite-Group Nexus Stack)

**Established patterns** — new code MUST follow these, not invent alternatives:

### File Structure
```
src/
  app/                    # Next.js App Router — pages and API routes
    (auth)/               # Auth group
    api/                  # API route handlers
    founder/              # Founder dashboard pages
  components/             # React components
    ui/                   # shadcn/ui base components (DO NOT MODIFY)
    founder/              # Feature-specific components
  lib/                    # Shared utilities, clients, helpers
    ai/                   # AI capabilities and pipeline
    supabase/             # Supabase clients (server/browser/service)
  server/                 # Server-only code (services, queries)
    services/             # Business logic
  types/                  # TypeScript types
    database.ts           # Supabase-generated types (DO NOT MANUALLY EDIT)
  hooks/                  # React hooks (client-side only)
```

### Canonical Patterns

**API routes**: Auth check → Zod validate → service call → `return NextResponse.json({ data })` with `handleApiError` catch

**Supabase access**: Server components → `createServerClient()`. Client components → `createBrowserClient()`. Cron/service routes → `createServiceClient()` with CRON_SECRET guard.

**Error handling**: All errors flow through `handleApiError`. No raw Supabase errors to client. No `try/catch` that swallows errors silently.

**Data isolation**: ALL database queries include `.eq('founder_id', founderId)`. No global queries without founder scope.

**TypeScript**: Strict mode. No `any`. No type assertions (`as SomeType`) without a comment explaining why.

---

## When Architecture Decisions Need Council Review

Escalate to `council-of-logic` when:
- Deciding between two established patterns that both seem applicable
- Considering adding a new architectural layer (new directory in `src/`, new service boundary)
- Evaluating a new dependency that would change how a domain of the codebase works
- Detecting a pattern that contradicts what `senior-fullstack` or `database-architect` established

The System Supervisor detects. The Council of Logic deliberates. The Senior Fullstack implements.

---

## Output Format

When this skill triggers a structural observation, report it as:

```
SYSTEM SUPERVISOR: [signal type]

Observed: [what the drift/issue is]
Location: [where in the codebase]
Pattern conflict: [what the established pattern is vs what was found]
Recommended action: [consolidate / inline / delete / rename / refactor]
Impact: [LOW / MEDIUM / HIGH] — affects [N files/components/routes]
```

High-impact structural issues are reported before proceeding with the task. Low and medium are noted at the end.
