# Unite-Group — Single Source of Truth (Clean Data Foundation)

- **Date:** 2026-06-08
- **Status:** Approved design — ready for implementation planning
- **Owner:** Phillip McGurk
- **Author:** Claude (brainstorming session)
- **Scope:** Consolidate the duplicated "Unite-Hub / Unite-Group" stacks into ONE product with one repo, one Vercel project, one domain, and one set of integrations. This is the foundational "clean data" step that the later autonomous-engineering vision depends on.

---

## 1. Problem

The product exists today as **two separate, divergent stacks** that share a confusingly similar identity. Because nothing cleanly distinguishes them, writes (including autonomous-agent commits) land in the wrong place, and the system cannot reach reliable autonomous operation on top of split-brain data.

The user's intent is **one product** under the **"Unite-Group"** identity. The blocker is fear of the unknown migration cost — specifically re-pointing external integrations (Stripe webhooks, OAuth logins) that are invisible from the outside.

## 2. Verified current state (investigated 2026-06-08, not assumed)

GitHub account: **CleanExpo**. Vercel team: **Unite-Group** (`team_KMZACI5rIltoCRhAtGCXlxUf`).

| | **Stack A — "Unite-Hub"** | **Stack B — "Unite-Group"** |
|---|---|---|
| GitHub repo | `CleanExpo/Unite-Hub` (id 1095180668) | `CleanExpo/Unite-Group` (id 1195653032) |
| README identity | "Unite Hub — AI-Powered Marketing **CRM**" | "Unite Group — **Empire Command Center** / CEO command center" |
| Size on disk | ~278 MB | ~7 MB |
| Recent activity | PRs to ~#106, pushed **2026-06-08** (active today) | PRs to ~#217, pushed **2026-06-06** |
| `package.json` name | `unite-group` | `unite-group` (identical — a core cause of ambiguity) |
| Stack | Next 16 / React 19 | Next 16 / React 19 |
| Vercel project | `unite-hub` (`prj_y8hsRwhZHe6ewe6wCbwMbBYx20yp`), region iad1, node 24 | `unite-group` (`prj_IfUuJNLjXTE8VXqEGwLAleIGhiA0`), region syd1, node 22 |
| Custom domain | none (`unite-hub*.vercel.app` only) | **`unite-group.in`** (live) + `unite-group.vercel.app` |
| Deploys from | `Unite-Hub` @ main | `Unite-Group` @ main |
| Commit identity | `<owner-personal-email>` / agent@unite-group.net | support@carsi.com.au |

**Integrations are split across the two repos — neither is complete:**

| Integration | Unite-Hub (CRM) | Unite-Group (Command Center) |
|---|---|---|
| Google / Gmail / Calendar / Drive OAuth | ✅ | — |
| Microsoft / Outlook OAuth | ✅ | — |
| LinkedIn, Meta, TikTok, YouTube, Reddit, IMAP OAuth | ✅ (8+ providers) | — |
| Supabase, Xero | ✅ | — |
| **Stripe billing + webhooks** | ❌ | ✅ (`api/webhooks/stripe`, `lib/api/stripe`, `api/cron/integrations/stripe`, `api/billing/webhook`) |
| GitHub webhooks, Telegram | — | ✅ |
| Live custom domain | ❌ | ✅ (`unite-group.in`) |

**Key insight:** the heavy, painful-to-move OAuth surface (8+ providers, each a separate developer console) lives in **Unite-Hub**. Stripe (a single provider) and the live domain live in **Unite-Group**. Therefore the lowest-rewiring direction is to keep the Unite-Hub codebase and fold the smaller Stripe/command-center half into it.

## 3. Decision

**Strategy: "C-then-A".**

- **Survivor codebase:** `Unite-Hub` (bigger, actively developed, owns the OAuth surface).
- **Survivor identity:** rebranded as **"Unite-Group"** (name in `package.json`, README, titles).
- **Survivor domain:** `unite-group.in` moved onto the unified app.
- **Folded in:** Stripe billing/webhooks + command-center dashboard + GitHub/Telegram webhooks from `Unite-Group`.
- **Old `Unite-Group` repo:** archived (read-only, recoverable), **never deleted**.

Identity and domain are treated as portable "stickers" applied to the surviving codebase — so the user keeps the stronger engine while it *becomes* "Unite-Group".

**Two non-negotiable principles throughout:**
1. **Nothing is deleted, only archived** — every step reversible.
2. **The live site is never down** — the new path is verified before the old one is retired.

## 4. Scope

**In scope:** repo/Vercel/domain/integration consolidation into one identity; an exhaustive connection audit; guardrails preventing recurrence.

**Out of scope (separate future brainstorm):** the Senior-PM / senior-agent orchestration system that runs the full Idea→Design→Build→Test→PR→Prod loop. This spec only delivers the clean-data foundation that vision requires.

## 5. The four phases

### Phase 1 — Freeze & Audit (do first; zero risk; nothing migrated or deleted)

**Part A — Freeze (stop writes without taking the live site down):**
1. **Find the culprit** auto-committing to `Unite-Group` (recent commits reference an autonomous "health scan" agent). Identify the source: agent config, cron job, saved git remote, `CLAUDE.md`, or Vercel git hook. Re-aim it at the survivor.
2. **Lock the door:** enable GitHub branch protection on `Unite-Group` `main` (requires review to push). Repo still deploys/serves the live site; it just can't be silently written to. Fully reversible.

**Part B — Audit (turn every unknown into a written, counted checklist).** Inventory all six surfaces:

1. **Stripe** *(requires user to authorize the Stripe connector)* — every webhook endpoint, the URL it targets, subscribed events, live-vs-test mode, API keys in use.
2. **OAuth providers** — for each (Google, Microsoft, LinkedIn, Meta, TikTok, YouTube, Reddit, IMAP): the redirect URI it currently expects and which console must be edited. Produce a finite, counted list.
3. **Vercel** — env-var *names* (not secret values) on each project, all custom domains, git links.
4. **Supabase** — **do both apps use the SAME database or two different ones?** (Deepest clean-data question — see decision point below.)
5. **GitHub** — Actions workflows, configured webhooks, deploy keys, collaborators on each repo.
6. **Port list** — the unique code in `Unite-Group` that must move into `Unite-Hub` (Stripe billing + webhook handlers, command-center dashboard, GitHub/Telegram webhooks).

**Phase 1 output — the "Migration Map" document:**
- Exact count of external dashboard edits (e.g. "Stripe: N webhook URLs; OAuth: M redirect URIs across K consoles").
- A definitive answer to the database question (#4).
- The Phase-2 port list.
- A go / no-go recommendation on the consolidation.

**Decision point that may escalate to the user:** if surface #4 shows **two different Supabase databases**, "clean data" expands to include choosing the canonical database and deciding whether any data must be merged. This is surfaced with options before any porting — never assumed.

### Phase 2 — Consolidate (off to the side; live site untouched)

1. **Port the missing half** into `Unite-Hub` on a **new branch** (not main): Stripe billing/webhooks, command-center dashboard, GitHub/Telegram webhooks.
2. **Reconcile the database** per the Phase-1 finding (#4).
3. **Apply the "Unite-Group" identity:** update `package.json` name, README, titles.
4. **Build a Vercel preview** of the branch; confirm it compiles and pages load — zero effect on the live site.

*Output: one branch containing the whole product, proven to build, not yet live.*

### Phase 3 — Cutover (the only phase touching live wiring; reversible at every step)

1. **Move `unite-group.in`** onto the unified Vercel project. Because the domain name is unchanged, Stripe/OAuth URLs already on `unite-group.in` are *expected* to keep working — treat this as a hypothesis, not a guarantee. Verify it explicitly at step 4 before retiring anything, and pre-check any provider that pins exact callback/redirect URLs, webhook destinations, or per-deployment signing secrets.
2. **Update the finite redirect-URI checklist** from Phase 1 (consoles still pointing at `unite-hub.vercel.app`).
3. **Copy env-var secrets** into the unified project using the Phase-1 name list.
4. **Verify end-to-end BEFORE retiring anything:** a test Stripe payment received via webhook; real logins for the main OAuth providers; dashboard + CRM pages load on `unite-group.in`.
5. **Instant rollback** at every step: re-point the domain to the old app, which stays fully intact and serving until the new path is verified.

**Guarantee:** nothing old is switched off in Phase 3.

### Phase 4 — Retire & Guardrail (the permanent clean-data payoff)

1. **Soak:** run the unified app live on `unite-group.in` for an agreed window (e.g. a few days), watching payments, logins, and error logs. Old setup parked as one-click fallback.
2. **Retire, don't destroy:** archive `CleanExpo/Unite-Group` (read-only, recoverable) and pause its idle Vercel project. Nothing deleted.
3. **Install guardrails (fixes the root cause):**
   - **`SOURCE-OF-TRUTH.md`** at the top of the surviving repo + a clear repo description naming the one canonical repo.
   - **Remove ambiguous signals:** give the survivor a unique `package.json` name and description so no two repos look identical to an agent.
   - **Re-aim every automation:** the Phase-1 culprit, Pi-CEO / "margot", the Hermes Agent (`<owner-personal-email>` login), and any `CLAUDE.md`, cron job, or MCP config across `Unite-Hub`, `Pi-Dev-Ops`, and `2nd Brain` — all reference only the canonical repo.
   - **Tripwire:** because the old repo is archived, any agent that tries to push to it simply cannot.

## 6. Risks & containment

| Risk | Containment |
|---|---|
| Live site breaks during cutover | Verify all integrations on a preview first; instant domain rollback; old app parked |
| A Stripe/OAuth connection missed | Exhaustive Phase-1 audit checklist; test payment + test login gate the cutover |
| Two different databases discovered | Surfaced in Phase 1 as its own decision before any porting |
| Losing old code | Archived, never deleted — recoverable indefinitely |
| Agents keep using the old repo | Archive locks it; automations re-aimed; source-of-truth documented |

## 7. Success criteria

- One repo (`Unite-Hub`, branded "Unite-Group") contains the complete product, including Stripe and the command center.
- `unite-group.in` serves the unified app; a test payment and real logins succeed against it.
- The old `Unite-Group` repo is archived and cannot be written to.
- No automation references the old repo; a `SOURCE-OF-TRUTH.md` documents the single canonical repo.
- No data loss; live site experienced no downtime during cutover.

## 8. What is needed from the user (at execution time, not now)

- A one-time **Stripe connector authorization** (so the audit can read webhooks).
- **OK to enable branch protection** on `Unite-Group` (reversible).
- A decision **if** Phase 1 reveals two separate Supabase databases.
- Choice of **soak duration** before retiring the old repo.

## 9. Next step

Hand this spec to the **writing-plans** skill to produce a detailed, step-by-step execution plan (starting with Phase 1: Freeze & Audit).
