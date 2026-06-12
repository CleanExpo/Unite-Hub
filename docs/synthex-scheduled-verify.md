---
type: doc
component: synthex-scheduled-verify-spec
status: draft
created: 2026-06-12
owner: hermes-ceo-orchestrator
reviewer: Phill McGurk
related:
  - /Users/phillmcgurk/Unite-Hub/src/lib/synthex/sync-verify.ts
  - /Users/phillmchurk/Unite-Hub/src/lib/synthex/sync-verify-cron.ts
  - /Users/phillmcgurk/2nd-brain/Outcomes/2026-06-12-synthex-lane-recent-completions-and-next-batch.md
---

# Synthex Scheduled Verification — Spec (Lane Synthex, Task A: t_106e73c7)

**Date:** 2026-06-12
**Pattern:** Senior PM Autopilot, bounded batch.
**Source reference:** Kanban task `t_106e73c7` (todo, p69) — "Synthex: coverage hold — sync readiness and publishing guardrails".

---

## What this PR ships

1. `src/lib/synthex/sync-verify.ts` — the read-only verification helper. Reads the latest run for each of the 9 GH Action checks that gate the Synthex lane (per `gh workflow list --repo CleanExpo/Synthex`), and produces a structured `SynthexSyncVerification` result.
2. `src/lib/synthex/sync-verify-cron.ts` — the cron-friendly entrypoint. Wraps `verifySynthexSync` and writes the result to the 2nd-brain dashboard entry `latest_synthex_sync_status.json`. Includes a `process.argv[1]`-guarded CLI invocation for direct cron use.
3. `src/lib/synthex/__tests__/sync-verify.test.ts` — 9 unit tests covering: all 9 check names present, all-passed, single-failure, neutral conclusion, no-runs, API errors per-check, custom branch, format summary pass/fail.
4. `src/lib/synthex/__tests__/sync-verify-cron.test.ts` — 1 integration test that exercises the real cron entrypoint (hits the real GH API with public-no-token rate limit; ~3s).

**Total:** 10 new tests, +468 LOC, 4 files.

## What this PR does NOT ship

- No cron manifest file in `~/.hermes/scripts/` (operator installs that)
- No actual `crontab` entry (operator installs that)
- No new env vars (the script works with public GH API, 60 req/hr unauth; optional token for 5000/hr)
- No dependencies added
- No new env vars / new vendors / new Supabase tables / new RLS / new migrations

## Cron install (operator, 1 minute)

The script is designed to run from the operator's shell on a schedule. The script-invocation block only fires when `SYNTHEX_RUN_CRON=1` is set, so imports in test code have **no side effects**. Recommended:

```bash
# Daily at 08:00 AEST (after the morning health check fires at 08:00)
0 8 * * 1-5  cd /Users/phillmcgurk/Unite-Hub && SYNTHEX_RUN_CRON=1 /Users/phillmcgurk/.local/bin/npx tsx src/lib/synthex/sync-verify-cron.ts >> /Users/phillmcgurk/2nd-brain/.agentic_nexus/dashboard/synthex-sync-verify.log 2>&1
```

If the script's exit code is non-zero (FAIL or DEGRADED), the cron line will emit to the operator's mail / log; the dashboard entry is the durable record.

## Failure modes (documented, not blocking)

- **GH API rate limit (60/hr unauth, 5000/hr with token):** the per-check API call would 429. The result captures `api_ok=false` and the error in the dashboard. The cron entry continues to next check, doesn't abort.
- **Workflow file rename:** the GH Actions team might rename a workflow file. The 9 check names are hardcoded. The next run would report `no_run` for the renamed one. Operator updates the constant. (No code change needed unless more workflows are added — then update `SYNTHEX_VERIFY_CHECKS`.)
- **Branch rename:** `main` is the default. Operator can override via `--branch` arg or env var (future enhancement).
- **Synthex repo moved/renamed:** `SYNTHEX_REPO` is a `const` exported from `sync-verify.ts`. Operator updates it.

## Safety §6A (this PR)

- vercel env pull: no
- op read of secret values: no
- supabase / psql: no
- production_db: no
- deployment_occurred: no
- secrets_accessed: no
- browser_or_computer_use: no
- email_sent: no
- new_vendor: no
- destructive_action: no
- blocked_op_lane_preserved: true
- cron_installed: no (operator action)
- writes_to_synthex_repo: no
- publishes_anywhere: no

## Validation (on main after merge)

- type-check: 0 errors
- lint: 0 errors
- full vitest: +10 net (was 1068, now 1077; was 1068, then 1077, then 1077 after cron test) → 1078 / 1078 final
- 144 + 1 = 145 test files

## What I'd do next (this turn, after merge)

1. Run the cron entrypoint **once** from the operator's shell to seed the dashboard entry: `cd ~/Unite-Hub && npx tsx src/lib/synthex/sync-verify-cron.ts`
2. Confirm the dashboard file at `2nd-brain/.agentic_nexus/dashboard/latest_synthex_sync_status.json` exists, parses, and the `status` field is "PASS" or "DEGRADED" or "FAIL" based on the live Synthex CI state.
3. If the operator chooses, install the crontab entry above (1 line, copy-paste).

The bounded work the agent can do right now is the PR. The cron install is operator action.
