// src/lib/synthex/sync-verify-cron.ts
//
// Synthex scheduled verification — cron manifest.
//
// This is the bounded work that the Senior PM Autopilot identified as
// Task A on the Synthex lane (Kanban t_106e73c7): a scheduled verification
// of the 6 (now 9) GH Action checks that gate the Synthex lane. The lib
// helper (src/lib/synthex/sync-verify.ts) does the work; this file is the
// cron-friendly entrypoint.
//
// Usage (cron-ready):
//
//   1. From a manual run:
//      $ npx tsx src/lib/synthex/sync-verify-cron.ts
//
//   2. From a cron job (operator installs in their shell, not the agent's):
//      $ 0 8 * * 1-5  cd /path/to/Unite-Hub && npx tsx src/lib/synthex/sync-verify-cron.ts
//
//   3. From the Kanban (as the bounded-work completion):
//      - Posts to the Synthex lane's dashboard entry on completion
//      - Updates the latest_synthex_sync_status.json file under 2nd-brain
//
// Does NOT call the cron agent. The cron entry is operator-installed.

import { writeFile } from 'node:fs/promises'
import { verifySynthexSync, formatSyncSummary, SYNTHEX_REPO } from './sync-verify'

const DASHBOARD_PATH = '/Users/phillmcgurk/2nd-brain/.agentic_nexus/dashboard/latest_synthex_sync_status.json'

interface DashboardJson {
  schema_version: number
  audit_id: string
  title: string
  status: 'PASS' | 'FAIL' | 'DEGRADED' | 'UNKNOWN'
  severity: 'informational' | 'p3' | 'p2' | 'p1' | 'p0'
  updated_at: string
  updated_by: string
  source: typeof SYNTHEX_REPO
  branch: string
  result: {
    api_ok: boolean
    all_passed: boolean
    passed_count: number
    failed_count: number
    no_run_count: number
    error?: string
    checks: unknown[]
  }
  notes: string
  related: string[]
  safety: {
    production_db_touched: false
    deployment_occurred: false
    secrets_accessed: false
    external_activation: false
    browser_or_computer_use: false
    destructive_action: false
    blocked_op_touched: false
  }
}

/**
 * Map a verification result to a dashboard status.
 * - all_passed: PASS
 * - api_ok=false: DEGRADED (we couldn't complete the verification)
 * - failed_count > 0: FAIL
 * - otherwise: UNKNOWN
 */
function mapStatus(v: { all_passed: boolean; api_ok: boolean; failed_count: number }):
  | 'PASS'
  | 'FAIL'
  | 'DEGRADED'
  | 'UNKNOWN' {
  if (v.all_passed) return 'PASS'
  if (!v.api_ok) return 'DEGRADED'
  if (v.failed_count > 0) return 'FAIL'
  return 'UNKNOWN'
}

/**
 * Run the verification and write the result to the 2nd-brain dashboard.
 * Returns the verification result so the caller (cron, test) can decide
 * what to do with it.
 */
export async function runAndWriteDashboard(
  opts: { branch?: string; token?: string } = {},
): Promise<Awaited<ReturnType<typeof verifySynthexSync>>> {
  const v = await verifySynthexSync(opts)
  const dashboard: DashboardJson = {
    schema_version: 1,
    audit_id: 'synthex-scheduled-verify',
    title: 'Synthex sync readiness + publishing guardrails (scheduled)',
    status: mapStatus(v),
    severity: v.all_passed ? 'informational' : v.failed_count > 0 ? 'p2' : 'p3',
    updated_at: v.checked_at,
    updated_by: 'synthex-scheduled-verify (Senior PM Autopilot, Task A: t_106e73c7)',
    source: SYNTHEX_REPO,
    branch: v.branch,
    result: {
      api_ok: v.api_ok,
      all_passed: v.all_passed,
      passed_count: v.passed_count,
      failed_count: v.failed_count,
      no_run_count: v.no_run_count,
      checks: v.checks,
    },
    notes: 'Recurring version of the bounded manual check (Kanban t_3ea8ebca, status: done). Cron-ready; does NOT publish, does NOT touch the Synthex repo. Read-only GH Actions API.',
    related: [
      '/Users/phillmcgurk/2nd-brain/.agentic_nexus/PROJECT_REGISTRY_RESULTS.md',
      '/Users/phillmcgurk/2nd-brain/Outcomes/2026-06-12-synthex-lane-recent-completions-and-next-batch.md',
    ],
    safety: {
      production_db_touched: false,
      deployment_occurred: false,
      secrets_accessed: false,
      external_activation: false,
      browser_or_computer_use: false,
      destructive_action: false,
      blocked_op_touched: false,
    },
  }
  if (v.error !== undefined) dashboard.result.error = v.error
  await writeFile(DASHBOARD_PATH, JSON.stringify(dashboard, null, 2))
  return v
}

if (process.argv[1] && process.argv[1].endsWith('sync-verify-cron.ts')) {
  // Running as a script. Print the summary and exit.
  runAndWriteDashboard()
    .then((v) => {
      console.log(formatSyncSummary(v))
      process.exit(v.all_passed ? 0 : 1)
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error(`[synthex/sync-verify-cron] ${message}`)
      process.exit(2)
    })
}
