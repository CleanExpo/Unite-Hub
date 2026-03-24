# Lighthouse Performance Baseline — Unite-Group Nexus 2.0
**Date:** 25/03/2026 | **Tool:** Lighthouse 12.8.2 | **Mode:** Desktop, navigation
**Purpose:** Phase 6 closure baseline — reference point before Phase 8 AI depth features land.

---

## Audit Scope

| Page | URL Audited | Notes |
|------|------------|-------|
| Entry Point / Login | `https://unite-group.in/auth/login` | Direct audit ✅ |
| Root redirect | `https://unite-group.in/` → login | Same bundle ✅ |
| Dashboard | `/founder/dashboard` | Auth-gated — see note below |
| Advisory | `/founder/advisory` | Auth-gated — see note below |
| Bookkeeper | `/founder/bookkeeper` | Auth-gated — see note below |

> **Auth-gated pages:** Lighthouse runs in a clean session with no auth cookies.
> All three app pages redirect to `/auth/login` before content loads, making remote Lighthouse
> inaccurate for those routes. **Manual audit required:** open Chrome DevTools → Lighthouse tab
> while logged into https://unite-group.in — run desktop audit on each of the 3 pages and
> record results in the "Authenticated Pages" section below.

---

## Entry Point — Production Scores (Automated)

### Baseline (pre-fix, 25/03/2026)

| Category | Score | Threshold | Status |
|----------|-------|-----------|--------|
| Performance | **92** | ≥ 90 | ✅ Pass |
| Accessibility | **91** | ≥ 90 | ✅ Pass |
| Best Practices | **93** | ≥ 90 | ✅ Pass |
| SEO | **92** | ≥ 90 | ✅ Pass |

### Post-fix confirmed scores (25/03/2026, 4 deploys)

| Category | Score | Status | Notes |
|----------|-------|--------|-------|
| Performance | **90** | ✅ Pass | FCP 1.5s (was 2.0s), CLS 0 (was 0.004). TBT/SI vary with server load. |
| Accessibility | **100** | ✅ Perfect | All contrast, font-size, label issues resolved |
| Best Practices | **100** | ✅ Perfect | CSP wildcard fixed, no console errors |
| SEO | **100** | ✅ Perfect | robots.txt returning correctly (proxy bypass fixed) |

**Performance ceiling:** Remaining ~10 points held by render-blocking CSS (150ms, Tailwind JIT
generates a single global chunk — not splittable without CSS architecture refactor), unused JS
from the app router bundle (~30 KiB), and LCP element (auth layout logo, 2.9s). These are
inherent to the Next.js+Tailwind architecture for a complex CRM; not addressable without
significant bundle splitting work.

---

## Core Web Vitals (Entry Point)

| Metric | Value | Score | Target | Status |
|--------|-------|-------|--------|--------|
| First Contentful Paint | 2.0 s | 0.84 | < 1.8 s | ⚠️ Needs work |
| Largest Contentful Paint | 3.0 s | 0.77 | < 2.5 s | ⚠️ Needs work |
| Total Blocking Time | 40 ms | 1.00 | < 200 ms | ✅ Excellent |
| Cumulative Layout Shift | 0.004 | 1.00 | < 0.1 | ✅ Excellent |
| Speed Index | 2.7 s | 0.97 | < 3.4 s | ✅ Good |
| Time to Interactive | 3.0 s | 0.96 | < 3.8 s | ✅ Good |

---

## Bundle Analysis (Entry Point)

| Resource Type | Transfer Size | % of Total |
|--------------|--------------|------------|
| JavaScript | 212 KiB | 64% |
| Fonts (Google Fonts CDN) | 95 KiB | 28% |
| Stylesheet | 13 KiB | 4% |
| Document (HTML) | 5 KiB | 2% |
| Images | 4 KiB | 1% |
| **Total** | **333 KiB** | **24 requests** |

---

## Issues Found

### ✅ Priority 1 — Render-Blocking Resources — FIXED (25/03/2026)

| Resource | Savings |
|---------|---------|
| `fonts.googleapis.com/css2?family=Inter…` | **954 ms** |
| Next.js CSS chunk (`e25d1145…`) | 150 ms |

**Root cause:** `globals.css` had a duplicate `@import url('https://fonts.googleapis.com/...')` overriding the `next/font/google` self-hosted setup in `layout.tsx`.

**Fix applied:**
- Removed `@import url(...)` from `src/app/globals.css` line 2
- Added `display: "swap"` to Inter config in `src/app/layout.tsx`

Expected improvement after deploy: **FCP ~1.0 s, LCP ~2.0 s**

---

### 🟡 Priority 2 — Unused JavaScript (30 KiB)

One JS chunk (`b2c604f7…`) carries 30 KiB of unused code on the login page. Likely contains components imported at the app layout level that aren't needed on the auth route.

**Fix:** Audit `src/app/(auth)/layout.tsx` for any imports that should be lazy-loaded. Consider moving heavy dashboard-specific imports behind dynamic imports.

---

### ✅ Priority 3 — Accessibility — FIXED (25/03/2026)

| Issue | Element | Fix Applied |
|-------|---------|-------------|
| Insufficient contrast ratio | `©` footer line used `text-white/30` (~2.5:1 ratio) | Changed to `text-white/50` (~5.3:1, WCAG AA pass) |
| Form elements missing labels | `<label>` existed but lacked `htmlFor` / input lacked `id` | Added `htmlFor="login-email/password"` + matching `id` attrs |

Files changed: `src/app/(auth)/layout.tsx`, `src/app/(auth)/auth/login/page.tsx`

---

### ✅ Priority 4 — SEO — FIXED (25/03/2026)

| Issue | Detail | Fix Applied |
|-------|--------|-------------|
| `robots.txt` misconfigured | Existed but pointed to `synthex.social` sitemap; blocked `/auth/` (wrong); included Synthex-specific rules | Rewritten for `unite-group.in` — blocks `/founder/` + `/api/`, correct sitemap URL, AI crawler blocks |

File changed: `public/robots.txt`

---

### 🟢 Non-Issues (all passing)

- Total Blocking Time: 40 ms — excellent (no heavy JS execution)
- CLS: 0.004 — no layout shift at all
- HTTPS, valid headers, no mixed content
- CSP is active (one minor console warning about `va.vercel-scripts.com` — safe to ignore, Vercel Analytics)

---

## Authenticated Pages Baseline (Manual — to complete)

Run DevTools Lighthouse (desktop, all categories) on each page while logged in.
Record results here after running:

| Page | Perf | A11y | BP | SEO | FCP | LCP | TBT | CLS |
|------|------|------|----|----|-----|-----|-----|-----|
| `/founder/dashboard` | — | — | — | — | — | — | — | — |
| `/founder/advisory` | — | — | — | — | — | — | — | — |
| `/founder/bookkeeper` | — | — | — | — | — | — | — | — |

---

## Recommended Actions (Phase 6 → Phase 8)

Priority order for quick wins before Phase 8 complexity lands:

1. ~~**Self-host Inter via `next/font/google`**~~ ✅ DONE 25/03/2026 — removed duplicate `@import` from `globals.css`
2. ~~**Fix `public/robots.txt`**~~ ✅ DONE 25/03/2026 — rewritten for `unite-group.in` domain
3. ~~**Add `<label>` to login form inputs + fix footer contrast**~~ ✅ DONE 25/03/2026
4. **Run manual Lighthouse on 3 authenticated pages** — still pending (requires Chrome DevTools while logged in)
5. **Unused JavaScript (30 KiB)** — lower priority; investigate lazy-loading imports in auth layout

---

## Re-audit Trigger

Re-run this audit after:
- Phase 8 Structured Outputs / AI Router land (bundle size impact check)
- Any significant new component added to the dashboard layout
- Targeted: Q2 2026 (June review)

---

*Baseline captured: 25/03/2026 | Tool: Lighthouse 12.8.2 | Env: Production (Vercel)*
