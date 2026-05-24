# Unite-Group Ecosystem Cleanup & Recurrence Prevention — Design

**Date:** 2026-05-24
**Owner:** Phill (CleanExpo / Unite-Group Nexus Pty Ltd)
**Status:** Design — awaiting implementation plan
**Spec author:** Claude (Opus 4.7)

---

## Problem statement

The Unite-Group portfolio is operated by a solo founder across multiple machines (some with the Hermes agent, some without). Over time, multiple agents and manual sessions have generated duplicate local folders, duplicate GitHub repos, and abandoned Vercel projects — because the same product is referred to by several names ("Unite-Group", "Unite-Hub", "the CRM", "Unite-Group CRM") and there is no single source of truth that resolves those aliases to one canonical entity.

The cleanup is therefore **not** a one-time tidy. The root cause is ambiguous naming + no SSOT shared across machines. Without a recurrence-prevention layer, the same mess will reappear.

### Confirmed clutter inventory (2026-05-24 audit)

**Local disk (D:\) — 7 dirty folders:**

| Path | State |
|---|---|
| `D:\Unite Group` (with space) | Duplicate clone of CleanExpo/Unite-Hub, branch `feat/superpowers-integration` |
| `D:\Unite-Group CRM` | Duplicate clone of CleanExpo/Unite-Hub on `main` |
| `D:\unite-group-app` | Empty broken `.git`, 0 items |
| `D:\Unite-Hub Marketing Update` | Empty folder |
| `D:\Unite Group Businesses` | 1 item, dormant since 2025-06 |
| `D:\Unite Trade Group Directory` | 8 items, dormant since 2025-05 |
| `D:\Unite-Group Agency` | 12 items including 2 clones of CleanExpo/Unite-Group (Empire Command Center) |

**GitHub (CleanExpo org) — 3 junk repos:**

| Repo | Issue |
|---|---|
| `https-github.com-CleanExpo-Downunder-Miles` | Created with full URL pasted as name |
| `https-github.com-CleanExpo-SC-Generator` | Same naming bug |
| `abacus_crypto_intelligence` | Duplicate of `Abacus-Crypto-Intelligence` |

**Vercel (unite-group team) — 10 suspect projects + 3 colliding names, out of 24 total:**

- 4 generic/experimental: `dashboard`, `web`, `tmp`, `v0-hotel-dashboard`
- 6 Vercel auto-generated names from `vercel deploy` runs without a project name: `brave-colden`, `infallible-poincare`, `infallible-pasteur`, `cool-moser`, `keen-hellman`, `modest-saha`
- 3 colliding-name projects (separate handling — see Phase 2B merge): `unite-group`, `unite-group-ops`, `unite-group.in`

**Identity collision (the central problem):**

Two distinct GitHub repos with overlapping names — but the user considers them "the same":

- `CleanExpo/Unite-Hub` — the AI Marketing CRM (Next.js 16, 133 MB, the active codebase)
- `CleanExpo/Unite-Group` — the Empire Command Center / CEO dashboard (Next.js 14, 8 MB)

User directive: **merge Unite-Group repo content into Unite-Hub, then delete Unite-Group repo.**

**Workflow gap:**

Only 2 of 10 product Vercel projects (RestoreAssist, CCW-CRM) follow the production+sandbox pattern. All other dev work currently flows straight into production deployments — violating the user's stated "sandbox-first, PR-tested merges" requirement.

---

## Goals

1. **Eliminate duplicate/stale local folders, GitHub repos, and Vercel projects** safely (no work loss; reversible until a final hard-delete gate).
2. **Establish a Portfolio Registry (SSOT)** that maps canonical names → aliases → all of (local path, GitHub repo, Vercel projects, domains, workflow rules) for every product.
3. **Auto-load the registry into every agent session on every machine** so that alias resolution happens before any destructive action.
4. **Merge `CleanExpo/Unite-Group` (Empire Command Center) into `CleanExpo/Unite-Hub`** as a route group, then decommission the Unite-Group repo + its Vercel projects.
5. **Provision sandbox Vercel projects** for every active product that lacks one.
6. **Codify a sandbox-first → PR → green-check-merge workflow** with GitHub branch protection and per-product CI checks.
7. **Install machine-level guardrails** (pre-tool-use hook, bootstrap script) that prevent any future agent from creating a duplicate.

## Non-goals

- Refactoring the internals of any product's codebase (only the merge demands Next 14 → 16 work).
- Migrating any product to a different cloud provider, database, or CI system.
- Building a portfolio-wide auth system or unified design system.
- Cleaning up repos/projects outside the Unite-Group ecosystem (Pi-CEO/Hermes brain dumps, third-party forks the user has starred, etc.).

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  PORTFOLIO REGISTRY (SSOT)                                       │
│  Canonical: D:\Unite-Hub\.portfolio\PORTFOLIO.yaml               │
│  Mirror:    D:\Hermes\wiki\entities\portfolio\PORTFOLIO.yaml     │
│  Auto-loaded into every CLAUDE.md via @reference                 │
│                                                                  │
│  Per product: canonical_name, aliases[], github_url,             │
│  local_path, vercel_prod, vercel_sandbox, domains[], status,     │
│  workflow rules, dependencies                                    │
└──────────────────────────────────────────────────────────────────┘
            │ consumed by ▼
   ┌────────┴───────────┬──────────────────┬────────────────┐
   ▼                    ▼                  ▼                ▼
Phase 1            Phase 2            Phase 3          Phase 4
DISK cleanup       GitHub cleanup     Vercel cleanup   Workflow rules
(7 folders)        + Unite-Group      (audit + purge   (branch
                     merge              + provision)     protection,
                                                         CI checks)
   │                    │                  │                │
   └────────────────────┴──────────────────┴────────────────┘
                         │ writes back ▼
              Registry updated after each phase
                         │
                         ▼
              ┌─────────────────────────┐
              │  GUARDRAILS (Phase 5)   │
              │  - Alias-guard hook     │
              │  - Bootstrap script     │
              │  - Registry CI rules    │
              └─────────────────────────┘
```

### Key design decisions

| Decision | Choice | Rationale |
|---|---|---|
| Registry location | `D:\Unite-Hub\.portfolio\PORTFOLIO.yaml` (canonical) + Hermes wiki mirror | Unite-Hub is on every active machine; mirror keeps Hermes-equipped machines in sync |
| Registry format | YAML | Human-editable, comment support, easy for agents to parse |
| Registry scope (v1) | All 11 portfolio products (Authority-Site flips to `status: archived` after Phase 2 merge into Unite-Hub) | Missing entries cause exactly the kind of confusion this project fixes |
| Quiet period before hard delete | 7 days | Long enough to surface "I needed that" without indefinite clutter |
| Hard delete gating | Automatic (scheduled task on Day 7) | User wants explicit cleanup; scheduled removal is cancellable until it fires |
| Old-path placeholder during quiet period | `MOVED.txt` file at archived location | Loud, readable failure for scripts with hardcoded old paths |
| Unite-Group merge target | New route group `src/empire/...` in Unite-Hub via `git subtree` | Preserves Unite-Group's full history inside Unite-Hub |
| Supabase strategy for merge | Merge Empire tables into Unite-Hub Supabase with `empire_*` prefix | Single database, single backup, single RLS surface |
| Vercel sandbox naming | `<product>-sandbox` deploying from long-lived `sandbox` branch | Consistent, predictable; sandbox env vars isolated |

---

## Portfolio Registry data model

```yaml
schema_version: 1
generated_at: 2026-05-24
parent_company: "Unite-Group Nexus Pty Ltd"

products:
  - canonical_name: Unite-Hub
    aliases:
      - "Unite Hub"
      - "Unite-Group"
      - "Unite Group"
      - "Unite-Group CRM"
      - "the CRM"
      - "Marketing CRM"
    purpose: "AI-first marketing CRM and email automation platform"
    status: active                    # active | maintenance | archived
    owner: phill

    github:
      org: CleanExpo
      repo: Unite-Hub
      url: https://github.com/CleanExpo/Unite-Hub
      default_branch: main
      sandbox_branch: sandbox

    local:
      canonical_path: D:\Unite-Hub
      access_via: D:\Unite-Group\Unite-Hub      # parent-folder junction
      do_not_clone_to:                          # known anti-patterns
        - "D:\\Unite Group"
        - "D:\\Unite-Group CRM"
        - "D:\\unite-group-app"
        - "D:\\Unite-Hub Marketing Update"

    vercel:
      team_id: team_KMZACI5rIltoCRhAtGCXlxUf
      production:
        project_id: TBD                         # set by Phase 3 audit
        project_name: TBD
        domain: unite-hub.vercel.app
      sandbox:
        project_id: TBD                         # created in Phase 3
        project_name: unite-hub-sandbox
        domain: unite-hub-sandbox.vercel.app

    workflow:
      sandbox_first: true
      pr_required_for_prod: true
      ci_required_checks: [typecheck, lint, test, build]

    stack:
      framework: next@16
      runtime: react@19
      package_manager: npm
      dev_port: 3008

    dependencies:
      - canonical_name: Hermes
        relationship: "consumes wiki via WIKI_PATH"
```

**Field semantics:**

- **`aliases[]`** is the recurrence fix. Any agent loading this registry normalises a user's casual phrasing to the canonical name before acting.
- **`local.do_not_clone_to[]`** is a literal blocklist. Pre-tool hook refuses operations targeting these paths.
- **`status: archived`** retains the record of retired products so future agents don't try to recreate them.
- **`vercel.production` + `vercel.sandbox`** are symmetric; `TBD` makes gaps visible.
- **`workflow.*`** is per-product so rigour can vary (e.g., Pi-Dev-Ops may not need playwright).
- **`dependencies[]`** captures cross-product wiring (Pi-CEO URLs, shared Supabase, Hermes wiki paths).

---

## Phase 1 · Disk cleanup

### Targets (7) and order

| # | Path | Class | First-pass action |
|---|---|---|---|
| 1 | `D:\unite-group-app` | Empty broken git | Archive |
| 2 | `D:\Unite-Hub Marketing Update` | Empty | Archive |
| 3 | `D:\Unite Group Businesses` | Stale (1 item, 11mo) | Inspect → archive |
| 4 | `D:\Unite Trade Group Directory` | Stale (8 items, 12mo) | Inspect → archive |
| 5 | `D:\Unite-Group Agency` | Stale + 2 Unite-Group clones inside | Inspect → archive |
| 6 | `D:\Unite Group` (with space) | Live Unite-Hub duplicate on `feat/superpowers-integration` | Verify branch pushed → archive |
| 7 | `D:\Unite-Group CRM` | Live Unite-Hub duplicate on `main` | Verify pushed → archive |

### Per-target execution recipe

```
1. PRE-CHECK
   a. git status --porcelain         (uncommitted? → STOP, ask user)
   b. git log --branches --not --remotes
                                     (unpushed? → STOP, ask user)
   c. ls -la                         (non-git files unique? → STOP, list)
2. APPEND to .cleanup-log.md:
   - timestamp, full path, git remote+branch, size, last-modified
   - rollback command (Move-Item back from archive)
3. Move-Item <target> D:\_archive\2026-05-24\<flattened-name>\
4. Verify move; verify original path is gone
5. Place MOVED.txt placeholder at original path:
   "This folder was archived 2026-05-24. Canonical path: <X>.
    See D:\_archive\2026-05-24\_cleanup-log.md for rollback."
6. Update registry: add path to do_not_clone_to[] for the relevant product
```

### Archive layout

```
D:\_archive\2026-05-24\
├── unite-group-app\
├── Unite-Hub_Marketing_Update\
├── Unite_Group_Businesses\
├── Unite_Trade_Group_Directory\
├── Unite-Group_Agency\
├── Unite_Group__with_space\
├── Unite-Group_CRM\
└── _cleanup-log.md
```

### Hard-delete gate

Scheduled Windows Task `UniteCleanup-2026-05-31` fires at Day 7:

```powershell
Remove-Item D:\_archive\2026-05-24 -Recurse -Force
```

Cancellable any time by removing the scheduled task. Bypasses recycle bin.

### Pre-archive special handling for Phase 1

- `D:\Unite Group`: verify `feat/superpowers-integration` branch is pushed to `origin`. If not, push it as `archive/superpowers-integration-2026-05-24` first.
- `D:\Unite-Group Agency`: snapshot `git log --all` of the 2 internal Unite-Group clones into `_cleanup-log.md` for tag/ref evidence.

### Special case · `D:\Unite-Group\Authority-Site`

A third local clone of `CleanExpo/Unite-Group` exists at `D:\Unite-Group\Authority-Site` (inside the canonical parent — not a top-level `D:\` folder, so not in the 7-target list). It is on `main`, clean, and structurally in the right place.

This clone is **kept** through Phase 2 because it is the working copy used to perform the subtree merge into Unite-Hub (Phase 2B Step 3). After Phase 2 Step 7 (Unite-Group repo archived), it becomes orphaned and is archived as part of Phase 2 cleanup — not Phase 1.

### What Phase 1 does NOT touch

- `D:\Unite-Group\` (canonical parent with junctions) — keep
- `D:\Unite-Hub\` (canonical Unite-Hub clone) — keep
- `D:\Unite-Group\Authority-Site\` — kept for Phase 2B; archived after merge completes
- `D:\Hermes\` (wiki SSOT) — keep
- All junctions inside `D:\Unite-Group\*` — keep

---

## Phase 2 · GitHub cleanup + Unite-Group → Unite-Hub merge

### Workstream A · Junk repos (parallel with Workstream B)

| Repo | Action | Trigger |
|---|---|---|
| `abacus_crypto_intelligence` | Compare with `Abacus-Crypto-Intelligence`; archive older/empty | Day 0 |
| `https-github.com-CleanExpo-Downunder-Miles` | Archive; verify `Downunder-Miles` (no default branch — suspicious) | Day 0 |
| `https-github.com-CleanExpo-SC-Generator` | Rename canonical to `SC-Generator`; archive original | Day 0 |

All three: hard-delete on Day 7 (same gate as disk).

> **⚠️ SUPERSEDED (2026-05-24):** Inspection during Plan 03 revealed Unite-Group is a 135,587 LOC standalone product with 154 routes, separate Supabase project (`uqfgdezadpkiadugufbs`), Remotion video pipeline, multi-language i18n (en/es/fr), and full RBAC — not a small dashboard suitable for subtree merge. The actual goal (registry recognizes both names map to non-confusing canonicals) is solved by Plan 01's alias system alone. Phase 2B (the merge) is REPLACED by Plan 03's canonicalization-only approach: keep both repos, give Authority-Site the same workflow protections as other products, add an explicit `disambiguation:` block to the registry, and document why they remain separate. See `docs/superpowers/plans/2026-05-24-cleanup-03-authority-site-canonicalize.md`. The content below is retained for audit-trail purposes only.

---

### Workstream B · Unite-Group → Unite-Hub merge (7 steps) — SUPERSEDED

#### Step 1 · Snapshot Unite-Group
```
git tag archive/pre-merge-2026-05-24
git push origin archive/pre-merge-2026-05-24
```
Export merged + open PR list to `_cleanup-log.md`.

#### Step 2 · Decide merge surface area
Empire Command Center lands at `src/empire/...` in Unite-Hub:
- `/dashboard` → `/empire/dashboard`
- `/api/pi-ceo/*` → `/api/empire/pi-ceo/*`
- Supabase tables → prefix `empire_*`, merge into Unite-Hub Supabase
- Env vars: `PI_CEO_API_URL`, SMTP creds carried to Unite-Hub Vercel

#### Step 3 · Branch in Unite-Hub
```
git checkout -b feat/empire-command-center-merge
git subtree add --prefix=src/empire \
  https://github.com/CleanExpo/Unite-Group.git main
```
Subtree preserves Unite-Group's full commit history inside Unite-Hub.

#### Step 4 · Upgrade Next 14 → 16
- Update merged code's `package.json` references
- Convert App Router calls to React 19 patterns
- Gate on `npm run build && npm run typecheck` green

#### Step 5 · Deploy to Unite-Hub sandbox
- Push `feat/empire-command-center-merge`
- Vercel preview auto-builds
- Verify `/empire/dashboard` renders, Pi-CEO health endpoint responds
- Run Playwright suite

#### Step 6 · PR to main
- Full migration notes in PR description
- Required checks: typecheck, lint, test, playwright, build
- Self-merge after CI green
- Vercel production auto-deploys

#### Step 7 · Decommission Unite-Group repo + Vercel projects
- Run both prod URLs in parallel for **7 days**
- Configure 301: `unite-group.vercel.app` → `unite-hub.vercel.app/empire`
- Archive `CleanExpo/Unite-Group` (read-only, settings preserved)
- After 7 more days: hard-delete archived repo
- Vercel projects `unite-group`, `unite-group-ops`, `unite-group.in` handled in Phase 3

### Failure / rollback per step

| Step | Failure mode | Rollback |
|---|---|---|
| 1-3 | Subtree merge breaks | Delete branch + tag |
| 4 | Build/typecheck fails | Fix on branch; no prod impact |
| 5 | Sandbox renders broken | Revert sandbox branch; no prod impact |
| 6 | Post-merge regression | `git revert` merge commit + Vercel rollback to previous deploy |
| 7 (archive) | Need it back | Unarchive in GitHub settings |
| 7 (delete) | Need it back | **Not reversible** — that is the hard gate |

---

## Phase 3 · Vercel cleanup + sandbox provisioning

### Sub-phase 3a · Audit & purge

For each of 24 projects, capture:
- Connected GitHub repo + branch
- Last deployment date
- Attached production domains
- Environment variable count
- Last commit deployed

Classify:

| Project | Initial classification | Action |
|---|---|---|
| `unite-group`, `unite-group-ops`, `unite-group.in` | Audit decides which is real; others orphans | Keep one with prod domain; archive others |
| `dashboard`, `web`, `tmp` | Generic → likely experiments | Audit → archive |
| `brave-colden`, `infallible-poincare`, `infallible-pasteur`, `cool-moser`, `keen-hellman`, `modest-saha` | Vercel auto-generated names | Archive immediately (no audit needed) |
| `v0-hotel-dashboard` | v0.dev experiment | Archive |
| Product-named projects | KEEP | Verify domain matches registry |

**Archive procedure:**
1. Rename → `_archive_<original>_2026-05-24`
2. Disconnect git integration
3. Pause/transfer production domains
4. Day 7: `vercel project remove`

### Sub-phase 3b · Provision missing sandboxes

Pattern: `<product-name>` → production, `<product-name>-sandbox` → deploys from long-lived `sandbox` branch.

Sandboxes to create:
- `unite-hub-sandbox` (priority — test bed for Empire merge)
- `disaster-recovery-sandbox`
- `dr-nrpg-sandbox`
- `synthex-sandbox`
- `ato-app-sandbox`
- `carsi-web-sandbox`
- `pi-dev-ops-sandbox`
- `live-nexus-sandbox`

Already exist (reference pattern): `restoreassist-sandbox`, `ccw-crm-sandbox`.

Each new sandbox:
- Same GitHub repo, branch = `sandbox`
- Env vars copied from prod with **sandbox-prefixed values** (separate Supabase project, test Stripe keys, email send DISABLED — log only)
- Domain: `<product>-sandbox.vercel.app`

### Sandbox-env-var conventions

```
SUPABASE_URL          → <prod-url>          → <sandbox-url>
SUPABASE_SERVICE_KEY  → <prod-key>          → <sandbox-key>
STRIPE_SECRET_KEY     → sk_live_…           → sk_test_…
SENDGRID_API_KEY      → <prod-key>          → "" (disabled — emails logged not sent)
ENVIRONMENT           → production          → sandbox
SENTRY_DSN            → <prod-dsn>          → <sandbox-dsn or empty>
```

A script `scripts/sync-sandbox-env.mjs` (lives in each product) reads `.env.sandbox` and pushes the values to Vercel via `vercel env add`. Keeps configuration as code.

---

## Phase 4 · Workflow rules (codified)

### Per-product, applied via script in Phase 4 execution

1. **Create long-lived `sandbox` branch** on every active product repo (off `main`).
2. **Branch protection on `main`**:
   - Require PR
   - Required status checks: `typecheck`, `lint`, `test`, `build`
   - No force pushes
   - Linear history required
3. **Branch protection on `sandbox`**:
   - Required status checks: `typecheck`, `build` (faster iteration)
4. **PR template** `.github/PULL_REQUEST_TEMPLATE.md`:
   - Registry update checkbox
   - Sandbox URL field
   - Screenshot / recording field
   - "Tested on sandbox?" checkbox
5. **CODEOWNERS**: `* @CleanExpo` (solo founder, self-review acceptable)
6. **GitHub Actions workflow** `.github/workflows/required-checks.yml` per product (templated from Unite-Hub's, with stack-specific commands).

---

## Phase 5 · Guardrails (recurrence prevention)

### 5a · Registry auto-load into every CLAUDE.md

Every product's `CLAUDE.md` gains a header block:

```markdown
# CLAUDE.md
@../.portfolio/PORTFOLIO.yaml

## Identity
Canonical name: Unite-Hub
This project's aliases: Unite Group, Unite-Group CRM, the CRM, Marketing CRM
If the user uses any of those aliases, this is what they mean.
Do NOT create new repos or clones. Use this folder.
```

The `@` syntax is Claude Code's native file-include; the registry is preloaded on session start.

### 5b · Pre-tool-use hook (`settings.json`)

A `PreToolUse` hook for `Bash` and `Write` intercepts and validates:

| Trigger | Check | On violation |
|---|---|---|
| `git clone https://github.com/CleanExpo/...` | Is the repo name an alias of a canonical? | Block + suggest canonical path |
| `vercel project add` / `vercel link` | Does name collide with existing alias? | Block + suggest existing project |
| `mkdir` / `New-Item` creating a path matching `do_not_clone_to[]` | Direct match | Block + tell agent the canonical path |
| `gh repo create` | Does name overlap with existing alias? | Block + suggest using existing repo |

Implementation: `D:\Unite-Group\.portfolio\hooks\alias-guard.ps1`. Reads registry, runs checks, exits non-zero with a clear message on violation.

### 5c · Cross-machine bootstrap

New machine (or any machine after a sync gap):

```powershell
D:\Unite-Group\bootstrap.ps1
```

Which:
1. Clones `Unite-Hub` to `D:\Unite-Hub` if missing
2. Reads `D:\Unite-Hub\.portfolio\PORTFOLIO.yaml`
3. Clones every `status: active` product to its `local.canonical_path`
4. Creates the junction tree under `D:\Unite-Group\`
5. Installs the alias-guard hook into the machine's `~/.claude/settings.json`
6. Verifies Hermes (if installed) points at `D:\Hermes\wiki` for `WIKI_PATH`

Bootstrap is idempotent — safe to re-run.

### 5d · Registry-edit CI rule

Any PR that modifies `.portfolio/PORTFOLIO.yaml` requires:
- A schema validation check (CI job)
- A 24-hour cooling-off period before merge (solo founder = self-cooling-off; reduces "agent edited registry mid-session" risk)

---

## Verification / acceptance criteria

**Phase 1 (Disk) — done when:**
- 7 dirty folders moved to `D:\_archive\2026-05-24\`
- `MOVED.txt` placeholders at each original path
- `_cleanup-log.md` complete with rollback commands for each
- Scheduled task `UniteCleanup-2026-05-31` registered
- Registry's `do_not_clone_to[]` updated for affected products

**Phase 2 (GitHub) — done when:**
- 3 junk repos archived on GitHub
- `archive/pre-merge-2026-05-24` tag exists on `CleanExpo/Unite-Group`
- `feat/empire-command-center-merge` PR merged in Unite-Hub
- `/empire/dashboard` route reachable on `unite-hub.vercel.app`
- Pi-CEO health endpoint responding from new location
- 301 redirect from `unite-group.vercel.app` → `unite-hub.vercel.app/empire`
- `CleanExpo/Unite-Group` archived
- Hard-delete scheduled for Day 14

**Phase 3 (Vercel) — done when:**
- 24 projects audited, audit report committed to `.cleanup-log.md`
- All non-canonical projects renamed `_archive_*`, git disconnected
- 8 sandbox projects created (`*-sandbox`) per registry
- Each sandbox has env vars synced (via `sync-sandbox-env.mjs`)
- Registry's `vercel.production.project_id` and `vercel.sandbox.project_id` filled for all 11 products

**Phase 4 (Workflow) — done when:**
- Every active product repo has `sandbox` branch
- Every active product repo has branch protection on `main`
- Every active product repo has `.github/PULL_REQUEST_TEMPLATE.md`
- Every active product repo has `.github/workflows/required-checks.yml`

**Phase 5 (Guardrails) — done when:**
- Every product's `CLAUDE.md` references `@../.portfolio/PORTFOLIO.yaml`
- `alias-guard.ps1` hook installed in `~/.claude/settings.json` on this machine
- `D:\Unite-Group\bootstrap.ps1` exists and tested on a clean directory
- Registry-edit CI rule active on Unite-Hub repo
- A controlled "agent attempts to clone Unite-Hub to a forbidden path" test produces a clear block message

**Whole project — done when:**
- All five phases verification criteria met
- Final `_cleanup-log.md` archived to the registry directory
- No path on D:\ matches any entry in `do_not_clone_to[]` across the registry
- The user can run `D:\Unite-Group\bootstrap.ps1` on a hypothetical clean machine and end with a working portfolio

---

## Risks & mitigations

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Empire Command Center merge breaks production Unite-Hub | Medium | High | Sandbox-first, Playwright gate, rollback via `git revert` + Vercel rollback |
| Wrong Vercel project deleted (production domain) | Low | High | Audit before classify; rename `_archive_*` first; 7-day quiet period |
| Other machine has uncommitted work in archived folder | Low (this machine clean) | Medium | User confirmed this machine only; cross-machine bootstrap will surface stale state |
| Pre-tool hook blocks legitimate operation | Medium | Low | Hook logs every block + reason; user can bypass with `--force-clone` env var |
| Registry edited in two places (canonical + mirror divergence) | Medium | Medium | Mirror is auto-generated only; CI rule enforces canonical-only edits |
| Pi-CEO connection breaks after Empire merge | Medium | Medium | Env var checklist in PR template; smoke test in sandbox before merge |
| GitHub repo rename breaks open Vercel webhooks | Low | Medium | GitHub auto-redirects clone URLs; Vercel auto-reconnects via GitHub App |

---

## Out of scope (explicit non-decisions)

The following decisions are **deferred to subsequent specs**:

- Per-product CI implementation details (test frameworks, coverage thresholds)
- Sandbox database seeding strategy (whether to copy prod data or generate synthetic)
- Cost optimization for redundant Vercel projects (Vercel pricing is per-team, not per-project, so deleting orphans doesn't directly save money)
- Migration of any non-Unite-Group repo to follow the same pattern
- Monitoring / alerting for the production deployments

---

## Implementation sequencing

Phases are gated, not parallel. Each phase produces an updated registry that the next phase consumes.

```
Day 0    Phase 1 (Disk)            ────►  registry updated
Day 0-1  Phase 2A (GitHub junk)    ────►  registry updated
Day 1-3  Phase 2B (Unite-Group merge) ──►  registry updated
Day 3-5  Phase 3A (Vercel audit + purge) ►  registry updated
Day 4-5  Phase 3B (Sandbox provisioning) ►  registry filled
Day 5-6  Phase 4 (Workflow rules)  ────►  protected branches live
Day 6-7  Phase 5 (Guardrails)      ────►  hook + bootstrap live
Day 7    Scheduled hard-deletes fire for Phase 1 + Phase 2A
Day 14   Scheduled hard-delete fires for Phase 2B (Unite-Group repo)
```

---

## Open items needing implementation-plan decisions

- Exact alias-guard hook script signature (matches Claude Code's current `PreToolUse` JSON contract)
- Whether to use `gh api` calls or GitHub UI for branch protection (`gh api` preferred — scriptable)
- Whether to write `bootstrap.ps1` as PowerShell or bash-compatible (PowerShell — the user's primary shell)
- Whether Empire's Pi-CEO Railway service stays as-is or is also brought into Unite-Hub's infra surface (assumed stays separate — separate spec)

These are mechanical, not architectural — they're for the implementation plan, not this design.
