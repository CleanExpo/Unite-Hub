# Nexus 2.0 — Autonomous Testing Protocol

> Approved from Linear status update (08/03/2026) — reconciled for Unite-Group Nexus 2.0 single-tenant architecture.

---

## Test Stack

| Layer | Tool | Location |
|-------|------|----------|
| Unit / Integration | Vitest + RTL | `src/**/__tests__/` |
| E2E | Playwright (Chromium) | `e2e/` |
| Config | `vitest.config.ts` | Repo root |
| Config | `playwright.config.ts` | Repo root |
| Setup | `vitest.setup.ts` | Repo root |

---

## Scoring System (0–100)

| Category | Weight | Pass Criteria |
|----------|--------|---------------|
| Unit test coverage | 30 pts | ≥ 80% coverage of `src/lib/`, `src/app/api/`, `src/hooks/` |
| E2E pass rate | 25 pts | All Playwright specs pass |
| Build success | 20 pts | `pnpm build` exits 0 |
| Type safety | 15 pts | `pnpm type-check` → 0 errors |
| Lint | 10 pts | `pnpm lint` → 0 warnings |

**Total: 100 pts**

---

## Self-Heal Loop

```
Score ≥ 90  →  SHIP
Score < 90  →  Agent analyses failures → patches → re-scores
3 consecutive failures  →  ESCALATE to Phill
```

---

## Commands

```bash
# Unit tests
pnpm test                       # Run all Vitest tests
pnpm test:watch                 # Watch mode
pnpm test:coverage              # With coverage report

# E2E tests (requires running dev server OR CI)
pnpm playwright test            # All E2E specs
pnpm playwright test --headed   # With browser visible
pnpm playwright show-report     # Open HTML report

# Quality checks
pnpm turbo run type-check       # TypeScript strict check
pnpm turbo run lint             # ESLint

# Full pre-ship gate
pnpm turbo run type-check lint test && pnpm playwright test
```

---

## Test File Locations

```
src/
└── app/
    └── api/
        └── health/
            ├── route.ts
            └── __tests__/
                └── route.test.ts      ← Vitest unit test

e2e/
├── health.spec.ts                     ← Playwright: HTTP health check
└── auth-smoke.spec.ts                 ← Playwright: PKCE middleware smoke test
```

---

## CI Gate

GitHub Actions (`.github/workflows/ci.yml`) runs on every push to `rebuild/nexus-2.0` and PR to `main`:

1. `pnpm turbo run type-check lint`
2. `pnpm test` (Vitest unit tests)
3. `pnpm build` (Next.js production build)

Playwright E2E runs separately against the deployed preview URL.

---

## Coverage Targets — Nexus 2.0

| Module | Target |
|--------|--------|
| `src/lib/supabase/` | 80% |
| `src/app/api/health/` | 100% |
| `src/app/api/` (all routes) | 80% |
| `src/components/ui/` | 70% |
| `src/hooks/` | 80% |

---

## Reflection Loop (Agent Protocol)

When running autonomously, agents follow:

```
1. Generate implementation
2. Run `pnpm test` + `pnpm build`
3. Score (0–100 using table above)
4. ≥ 90 → commit + proceed
5. < 90 → analyse failures → patch → back to step 2
6. 3 failed attempts → BLUEPRINT_ESCALATION → halt
```
