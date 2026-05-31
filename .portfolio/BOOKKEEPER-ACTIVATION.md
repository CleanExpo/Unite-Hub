# Bookkeeper Activation Runbook — live financial data

> **Prepared:** 31/05/2026 | **Locale:** en-AU | **Currency:** AUD
> The bookkeeper engine is already built (`src/lib/bookkeeper/`, `/api/cron/bookkeeper`,
> reconciliation, deduction-optimiser, BAS, AU tax codes). It runs on **mock** data until
> Xero is wired. This is the exact path to flip it to real, verified live state.

---

## Why credentials are NOT pulled from 1Password

The system stores encrypted **OAuth tokens** in the pgsodium vault, keyed `(founder_id, businessKey)` —
never raw usernames/passwords (`rules/database/supabase.md`: *never store master passwords in the DB*).
Bank data arrives via **Xero bank feeds** (`/BankStatements`), which need a bank-authorised feed, not a
scraped login. So: secrets stay in 1Password/Vercel env; the app connects by OAuth consent; the vault
holds only the resulting tokens. No password export, by design.

---

## Verified current state (31/05/2026)

| Check | Result |
|-------|--------|
| Prod env Xero secrets | ❌ none (`XERO_CLIENT_*`, `DR_CLIENT_*` absent — only `GOOGLE_CLIENT_*`, `FOUNDER_USER_ID`, `CRON_SECRET` set) |
| `isXeroConfigured()` | **false** → every business returns `source: 'mock'` |
| Vault Xero tokens | `carsi` ✓, `dr` ✓ — that's it |
| No vault token | `nrpg`, `restore`, `synthex`, `ccw`, `ato` |
| Net | **0 businesses on real financial data right now** |

---

## Activation — the human-only last mile

I cannot fabricate secrets or script OAuth/bank consent. These steps are yours; each is one pass.

### Step 1 — paste 4 Xero secrets into Vercel prod (highest leverage)
From your Xero developer app (developer.xero.com → your app → Configuration):

| Env var | Covers businesses |
|---------|-------------------|
| `XERO_CLIENT_ID` | carsi, restore, synthex, ccw, ato |
| `XERO_CLIENT_SECRET` | ↑ |
| `DR_CLIENT_ID` | dr, nrpg |
| `DR_CLIENT_SECRET` | ↑ |

The moment these are set, `isXeroConfigured()` → true and **`dr` + `carsi` flip to live immediately**
(their tokens already exist). Net: 2 businesses green with zero further clicks.

### Step 2 — OAuth-consent the remaining orgs (one click each)
For `nrpg`, `restore`, `synthex`, `ccw`: connect each Xero org via the app's Xero OAuth flow →
writes a token to the vault under that businessKey. (`ato` is pre-revenue — skip.)

### Step 3 — Xero bank feeds (bank-side, regulated)
Inside each Xero org, set up the **bank feed** for that entity's account (signed bank authority).
Once feeds flow, `/BankStatements` populates and the bookkeeper reconciles real transactions.

### Step 4 — bookkeeper runs automatically
The `/api/cron/bookkeeper` job (gated on `CRON_SECRET` + `FOUNDER_USER_ID`, both already set) then runs
on real data: reconciliation %, deduction candidates (`deduction-optimiser` + AU tax codes), BAS figures.

---

## The boundary on deductions / grants / tax positions

The engine **surfaces candidates** — missing deductions, GST/BAS figures, reconciliation gaps. It is an
AI bookkeeping assistant, not a registered agent. Final deduction claims, grant eligibility, and lodgement
**must be confirmed by your registered tax agent** (same boundary as `ENTITY-REGISTER.md`). Nothing here is
presented as filed or as advice.

---

## What flips GREEN, and when

| After | Green |
|-------|-------|
| Step 1 | `dr`, `carsi` revenue/expense/P&L live from Xero |
| Step 2 | `nrpg`, `restore`, `synthex`, `ccw` live |
| Step 3 | bank reconciliation live (real `/BankStatements`) |
| Step 4 | automated weekly bookkeeper run on all connected entities |
| Accountant sign-off | deductions/BAS/grants validated for lodgement |

*Runbook only — operational, not tax or legal advice.*
