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

### G1 — prod-vs-sandbox Supabase identity UNCONFIRMED (operational integrity)
- Sandbox ref: `lksfwktwtmyznckodsau` (known). Prod ref: **unconfirmed** from files.
- If prod ≠ sandbox, the 30/05 drift-repair migrations (`20260324000001_hub_satellites.sql`, `20260530000000_approval_queue_founder_id_align.sql`) may **not be live in prod** → prod `/api/connected-projects` and `/api/dashboard/stats` could 500.
- **Confirm:** `vercel env ls production` → read `NEXT_PUBLIC_SUPABASE_URL` ref; compare to sandbox. (`vercel env pull` is unreliable — renders all values empty; per project memory use `ls`.)

### G2 — Integrations 0/13 connected (the dominant "real data" lever)
- Code present + vault-backed for: Xero, Gmail, Google Calendar, Google Drive, Linear, SendGrid, Facebook/Instagram, LinkedIn, TikTok, YouTube, Anthropic, Reddit, GitHub.
- **No code:** Stripe, Apify.
- Zero OAuth tokens in `credentials_vault` / several env keys unset → dashboards render real *structure* but **mock numbers** (Xero revenue falls back to `source: 'mock'`, social publisher no-ops on 0 connected channels).
- This is honest today (discriminators surface it), but blocks "every section serves real data".

### G3 — `/founder/approvals` genuine facade
- `ApprovalQueue.tsx` renders hardcoded empty state; **no `/api/approvals` route exists**.
- `approval_queue` **table exists** (founder-scoped, RLS repaired 30/05) — what's missing is the route + UI wiring + a **product decision on what populates the queue** (likely pending AI actions from content-engine/social-publisher awaiting human sign-off). Do not build the schema blind.

### G4 — `/api/boardroom/meetings` missing explicit founder scope
- `boardroom/meetings/route.ts:18-26` queries `board_meetings` with no `.eq('founder_id', user.id)`. RLS covers it (table has founder_id SELECT policy), but it violates the defence-in-depth invariant in `src/app/api/CLAUDE.md`. One-line fix.

### G5 — Design-standard debt (non-functional)
- ~30–41 component files still `import ... from 'lucide-react'` (rule: custom SVG only). Renders fine; cosmetic.
- Also: axios transitive 1.13.6→1.16.1 via `pnpm overrides`; `/api/analytics` lacks `last_synced_at`.

---

## 3. Roadmap (sequenced) — recommended and locked unless redirected

Rationale for order: **de-risk the foundation before building on it, then pull the biggest real-data lever, then close the last facade, then polish.** Activation-first was rejected (builds on an unconfirmed prod DB); approvals-first was rejected (lowest leverage — numbers stay mock).

### Phase 0 — Integrity gates (high-certainty, hours)
- **0.1** Confirm prod Supabase ref (G1) via `vercel env ls production`. Record result in PORTFOLIO/ledger.
- **0.2** If prod ≠ sandbox: apply `20260324000001` + `20260530000000` to prod DB (with the file-header rollback). If prod == sandbox: mark migrations already-live.
- **0.3** Fix G4 — add `.eq('founder_id', user.id)` to `boardroom/meetings/route.ts`.
- **Acceptance:** prod ref recorded; prod `/api/dashboard/stats` + `/api/connected-projects` return 200 with real founder data; boardroom route founder-scoped; verify loop green.

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
