# Unite-Hub — Path to 100% (NorthStar GREEN)

> **Design doc / spec.** Created 2026-05-30. Locale: en-AU.
> **Definition of 100%:** every founder section GREEN — real founder-scoped data + auth + loading/error + verify-pass, no Invaders. A rendered page or green CI tick is NOT evidence; real founder-scoped data behind auth is.
> **Status of this doc:** verified ground truth established this session via live verify loop + three forensic recon passes. Roadmap below is sequenced for approval.

---

## 1. Verified ground truth (this session, with evidence)

All claims below were confirmed *this session*, not carried from prior ledgers.

| Layer | Finding | Evidence |
|---|---|---|
| Type-check | PASS | `pnpm run type-check` exit 0 |
| Tests | **560/560 pass** (54 files, 23s) | `pnpm run test` |
| Local build | Stops at env-validation prebuild gate only (`.env.local` unpopulated) — **not a code defect**; deploys fine on Vercel where env is set | build log: "missing CRITICAL or REQUIRED env vars" |
| Founder sections | 26/27 wired to real founder-scoped APIs; loading/error near-complete | recon agent 1 (route-by-route table) |
| Database | 35 migrations, 28 tables with `founder_id` RLS, **zero** `workspace_id`/`owner_id` query violations in `src/` | recon agent 3 |
| API honesty | GREEN — no silent-mock Invaders; every integration route surfaces `source`/`not_connected`/`configured` discriminator | recon agent 2 (honesty matrix) |
| Crons | 22 registered in `vercel.json`; 6 spot-checked all live + `CRON_SECRET`-gated, real work | `vercel.json` parse + recon agent 2 |

**Net:** the application skeleton is real and honest. The gap to 100% is **not** facades-everywhere — it is (a) one operational integrity unknown, (b) integrations not yet connected (real structure, mock numbers), (c) one genuine facade, (d) cosmetic debt.

---

## 2. Gap inventory (the only things between here and 100%)

### G1 — prod-vs-sandbox Supabase identity — RESOLVED 2026-05-30 (prod == sandbox)
- **CONFIRMED: prod and sandbox share the same Supabase project `lksfwktwtmyznckodsau`** ("Unite-Group").
- Evidence (this session): the live prod client bundle at `unite-hub-self.vercel.app` embeds `lksfwktwtmyznckodsau.supabase.co` (NEXT_PUBLIC_SUPABASE_URL is public, baked into client JS). `vercel env pull` returned `NEXT_PUBLIC_SUPABASE_URL=""` — re-confirming pull is an unreliable artifact; the bundle is authoritative.
- **Migration-history proof (not mere table existence):** `list_migrations` on `lksfwktwtmyznckodsau` returns `20260530065857 approval_queue_founder_id_align` and `20260530070116 hub_satellites` in the applied `schema_migrations` history → **the 30/05 drift-repair migrations ARE applied-as-migrations in prod**, not just objects that happen to exist. No replay needed. The contrarian "prod ≠ sandbox, missing migrations" risk branch is disproven. (Note: the repo file `20260324000001_hub_satellites.sql` was applied under regenerated version `20260530070116` — content live, version differs.)
- **New observation (not a blocker):** that project reports **1,710 public tables** — far beyond this CRM's ~30. The Supabase project is shared/contaminated with other apps' tables. Flag for later hygiene; does not affect founder-scoped RLS correctness.

### G2 — Integrations 0/13 connected (the dominant "real data" lever)
- Code present + vault-backed for: Xero, Gmail, Google Calendar, Google Drive, Linear, SendGrid, Facebook/Instagram, LinkedIn, TikTok, YouTube, Anthropic, Reddit, GitHub.
- **No code:** Stripe, Apify.
- Zero OAuth tokens in `credentials_vault` / several env keys unset → dashboards render real *structure* but **mock numbers** (Xero revenue falls back to `source: 'mock'`, social publisher no-ops on 0 connected channels).
- This is honest today (discriminators surface it), but blocks "every section serves real data".

### G3 — `/founder/approvals` genuine facade
- `ApprovalQueue.tsx` renders hardcoded empty state; **no `/api/approvals` route exists**.
- `approval_queue` **table exists** (founder-scoped, RLS repaired 30/05) — what's missing is the route + UI wiring + a **product decision on what populates the queue** (likely pending AI actions from content-engine/social-publisher awaiting human sign-off). Do not build the schema blind.

### G4 — Missing explicit founder scope — 8 violations across 7 routes — RESOLVED 2026-05-30
**CLOSED.** All 8 violations fixed via TDD (plan `docs/superpowers/plans/2026-05-30-founder-scoping-phase0.md`, branch `feature/founder-scoping-phase0-3`): each got an explicit `.eq('founder_id', user.id)` in the query WHERE clause + a colocated unit test asserting the founder filter is applied. 573/573 tests pass; type-check + lint clean. Post-fix structural re-scan of boardroom/strategy/video routes confirms **zero VIOLATION-bucket routes remain** — every founder-partitioned `.from(...)` now chains `founder_id` (inserts write it in the payload).

A full `src/app/api/**/route.ts` scan (this session) disproved the earlier "boardroom is the only unscoped route" claim. RLS backstops every one (tables carry founder_id policies), but all violated the defence-in-depth invariant in `src/app/api/CLAUDE.md` (application code is the first line, RLS the last).

| Route | Table | Unscoped op(s) |
|---|---|---|
| `boardroom/meetings/route.ts` | `board_meetings` | GET (~L19) |
| `boardroom/meetings/[id]/route.ts` | `board_meetings` | GET (~L21), PATCH (~L45) |
| `boardroom/team/route.ts` | `team_members` | GET (~L16, only `.eq('active',true)`) |
| `boardroom/team/[id]/route.ts` | `team_members` | PATCH (~L19), DELETE (~L38) |
| `boardroom/decisions/[id]/route.ts` | `ceo_decisions` | PATCH (~L33), DELETE (~L52) |
| `strategy/insights/route.ts` | `strategy_insights` | GET (~L22) |
| `strategy/insights/[id]/route.ts` | `strategy_insights` | PATCH (~L23) |
| `video/[id]/status/route.ts` | `video_assets` | UPDATE (~L43) |

Common pattern: query by `id` only, leaning on RLS. Boardroom module is 5/8. Each is a per-query `.eq('founder_id', user.id)` add (or, on `[id]` mutation routes, scope the filter so a cross-founder id can't be mutated even if RLS policy drifts).

**Separate flag (not in this count, larger question):** the scan also found **46 routes using the service-role client**. `rules/database/supabase.md` says founder_id must be written explicitly *even in service-role contexts* (service role bypasses RLS, so the app filter is the ONLY line there). Those 46 were not individually audited for explicit founder_id — that is a distinct audit, sized separately, not folded into G4's 8.

**Follow-ups surfaced by the G4 close-out re-scan (2026-05-30) — logged, NOT fixed in 0.3 (no scope-creep):**
- `video/generate/route.ts` (service-role client) — two `video_assets` `.update(...)` chains (L171 generating-path, L187 failed-path) filter by `.eq('id', videoAsset.id)` only, no `founder_id`. Lower risk than the status route: the id is freshly INSERTed by the same request with `founder_id: user.id` (founder-owned, not URL-supplied). Still violates the service-role defence-in-depth invariant. → belongs to **Phase 0.4** (service-role audit).
- `board_meeting_notes` and `strategy_insight_comments` routes — these child tables have **no `founder_id` column** (confirmed via live schema on `lksfwktwtmyznckodsau`); they key off the parent (`meeting_id` / `insight_id`) only. Not a G4 violation (no column to scope by). Distinct hardening item: the notes/comments GET+POST don't verify the **parent** meeting/insight belongs to the founder before reading/writing children → transitive parent-ownership check. → separate follow-up, not G4, not 0.4.

### G5 — Design-standard debt (non-functional)
- ~30–41 component files still `import ... from 'lucide-react'` (rule: custom SVG only). Renders fine; cosmetic.
- Also: axios transitive 1.13.6→1.16.1 via `pnpm overrides`; `/api/analytics` lacks `last_synced_at`.

---

## 3. Roadmap (sequenced) — recommended and locked unless redirected

Rationale for order: **de-risk the foundation before building on it, then pull the biggest real-data lever, then close the last facade, then polish.** Activation-first was rejected (builds on an unconfirmed prod DB — now confirmed, so this risk is retired); approvals-first was rejected (lowest leverage — numbers stay mock).

### Phase 0 — Integrity gates
- **0.1** ✅ DONE — prod Supabase ref confirmed `lksfwktwtmyznckodsau` (prod == sandbox); recorded in ledger + memory. See G1.
- **0.2** ✅ DONE (no action) — migration history confirms `approval_queue_founder_id_align` + `hub_satellites` applied in prod. No replay.
- **0.3** ✅ DONE 2026-05-30 — Fixed G4: the **8 founder-scoping violations across 7 routes** (boardroom ×5, strategy ×2, video ×1) via TDD on branch `feature/founder-scoping-phase0-3`. Each got `.eq('founder_id', user.id)` in the query WHERE clause + a unit test. Post-fix re-scan: 0 VIOLATION-bucket routes remain. 573/573 tests pass; type-check + lint clean. See G4 (RESOLVED) for follow-ups logged to 0.4.
- **0.4** TODO (flagged, sized separately) — audit the 46 service-role routes for explicit founder_id (service role bypasses RLS → app filter is the only line). Known member: `video/generate/route.ts` (two `video_assets` updates, see G4 follow-ups). NOT a Phase-0 blocker for Phase 1; can run in parallel or defer, but must close before "100%".
- **Acceptance:** prod ref recorded ✓; drift migrations confirmed applied-as-migrations ✓; route scan returns 0 VIOLATION routes (0.3) ✓; verify loop green ✓. (0.4 tracked, not gating Phase 1.)

### Phase 1 — Real-data activation (the 100% lever)
- **1.1** Build `/api/integrations/status` — single founder-scoped endpoint returning per-provider connection state (vault token count + env-key presence + last sync). Feeds a dashboard "Integrations" panel so connection state is visible at a glance.
- **1.2** Verify + complete OAuth connect flows, persisting encrypted tokens to `credentials_vault`, in leverage order: **Xero** (revenue/bookkeeper/board) → **Gmail + Calendar** → **Linear** (env key) → **social channels** (FB/IG/LinkedIn/TikTok/YT).
- **1.3** Per provider connected: confirm the consuming surface flips `source: 'mock'` → real (dashboard KPI, invoices, email, kanban, social).
- **Note:** OAuth click-through requires Phill. Build = the wiring, status surface, and connect entry points; Phill performs the actual authorise step per provider. Each provider is independently shippable.
- **Acceptance:** `/api/integrations/status` live; ≥Xero+Gmail connected with real tokens in vault; dashboard shows `source: 'xero'` (not mock) for at least revenue KPI.

### Phase 2 — Approvals vertical (close the last facade)
- **2.1** Product decision (recorded in spec): queue is fed by **pending AI actions awaiting human sign-off** (content-engine drafts, social-publisher scheduled posts, high-risk bookkeeper/MACAS actions).
- **2.2** Build `/api/approvals` (GET queue / POST approve-reject) against existing `approval_queue` table, founder-scoped, with `audit_log` writes on mutation.
- **2.3** Wire `ApprovalQueue.tsx` to fetch real data; keep honest empty-state when queue is empty.
- **Acceptance:** approving/rejecting an item mutates `approval_queue` + writes audit_log; UI reflects real rows; verify loop green.

### Phase 3 — Polish (cosmetic / hardening)
- **3.1** Lucide→custom-SVG sweep (~30–41 files), dedicated wave (high visual blast-radius — deliberate, not blind).
- **3.2** axios override + re-verify 3 SDK consumers (@sendgrid/mail, apify-client, xero-node).
- **3.3** `/api/analytics` add `last_synced_at`.
- **Acceptance:** zero `lucide-react` imports; verify loop green; advisory `pnpm audit` improvement recorded.

---

## 4. Definition of done (100%)

- Prod DB identity confirmed and drift migrations confirmed-live in prod.
- Every founder section serves real founder-scoped data OR surfaces an honest `not_connected` state (no mock-as-real).
- Xero + Gmail (minimum) connected with real vault tokens; dashboard numbers real, not mock.
- Approvals wired to `approval_queue` with audit logging.
- `/api/integrations/status` gives the founder a single source of connection truth.
- Verify loop (type-check + lint + test + build) green; no `workspace_id`/`owner_id` violations; all API routes founder-scoped explicitly (defence-in-depth).
- Cosmetic: Lucide removed; axios patched.

---

## 5. Out of scope (YAGNI)

- Stripe / Apify integrations (no code today; build only when a real provider need exists).
- The 5 "pull crons" (contacts/pipeline/research/ideas/ad-metrics) — blocked on unconnected providers; scaffolding them now = dishonest no-ops. Add per-provider after Phase 1.
- Multi-tenant / team features — permanently out of scope (single-tenant founder CRM).
