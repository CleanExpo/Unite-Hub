// src/lib/synthex/sync-verify.ts
//
// Synthex scheduled verification (Lane Synthex, Task A: t_106e73c7)
//
// Read-only verification of the 6 GH Action checks that gate the Synthex
// lane's "sync readiness and publishing guardrails". This is the recurring
// version of the just-completed one-time task (t_3ea8ebca); the difference
// is this version runs on a schedule (cron-ready) and produces a structured
// JSON output that the morning-card / dashboard system can consume.
//
// Does NOT touch the Synthex repo. Does NOT publish. Does NOT bypass
// restricted_scopes. Reads only the public GH Actions API for the Synthex
// repo (CleanExpo/Synthex) and produces a dashboard-shaped JSON file.
//
// Source-grounding references:
//   - 2nd-brain/.agentic_nexus/project_registry.jsonl (synthex entry)
//   - 2nd-brain/Outcomes/2026-06-12-synthex-lane-recent-completions-and-next-batch.md
//   - 2nd-brain/Outcomes/2026-06-12-connections-recently-completed-audit.md

export const SYNTHEX_REPO = 'CleanExpo/Synthex' as const

/**
 * The 6 GH Action checks that gate the Synthex lane, by their exact
 * workflow file names (from `gh workflow list --repo CleanExpo/Synthex`).
 * These are the same names the Synthex maintainers use in the
 * `.github/workflows/` directory.
 */
export const SYNTHEX_VERIFY_CHECKS = [
  'CI',
  'Deploy',
  'Security',
  'Lighthouse Audit',
  'Brand Intelligence Pipeline',
  'Score Accuracy Gate',
  'CodeQL',
  'DESIGN.md lint',
  'Synthex Review Board',
] as const

export type SynthexVerifyCheck = (typeof SYNTHEX_VERIFY_CHECKS)[number]

/** A single check's result. */
export interface SynthexCheckResult {
  /** The workflow file name. */
  check: SynthexVerifyCheck
  /** Whether the latest run succeeded. */
  passed: boolean | null
  /** The run's status, e.g. "completed", "in_progress", "queued". */
  status: string
  /** The run's conclusion, e.g. "success", "failure", "neutral", "cancelled". */
  conclusion: string | null
  /** When the latest run was triggered (ISO). */
  triggered_at: string | null
  /** GH run id (stringified for cross-runtime safety). */
  run_id: string | null
  /** GH run HTML URL. */
  html_url: string | null
}

/** The full verification result for the Synthex lane. */
export interface SynthexSyncVerification {
  /** The repo verified. */
  repo: typeof SYNTHEX_REPO
  /** When the verification ran (ISO). */
  checked_at: string
  /** The branch verified. */
  branch: string
  /** Whether the API call succeeded at all. */
  api_ok: boolean
  /** True iff every check passed. */
  all_passed: boolean
  /** Number of checks that passed. */
  passed_count: number
  /** Number of checks that failed. */
  failed_count: number
  /** Number of checks with no recent run. */
  no_run_count: number
  /** Per-check breakdown. */
  checks: SynthexCheckResult[]
  /** Error from the API call (if any). */
  error?: string
}

/** Shape of one entry from `GET /repos/{owner}/{repo}/actions/runs`. */
export interface GhActionsRun {
  id: number
  name: string
  status: string | null
  conclusion: string | null
  run_started_at: string | null
  html_url: string | null
  head_branch: string | null
}

/** Subset of the GH API response that we care about. */
export interface GhActionsRunsResponse {
  total_count: number
  workflow_runs: GhActionsRun[]
}

export interface VerifySynthexSyncOptions {
  /** Function that fetches a JSON URL (defaults to global fetch). */
  fetcher?: typeof fetch
  /** Branch to verify. Default: 'main'. */
  branch?: string
  /** GitHub token for authenticated requests. Optional — public API works for status reads. */
  token?: string
  /** Clock for `checked_at` (injected for tests). */
  now?: () => Date
}

/**
 * Build a header object for the GH API request.
 * Authenticated requests get a higher rate limit (5000/hr vs 60/hr for unauth).
 */
function buildHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'unite-group-synthex-scheduled-verify',
  }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

/**
 * Fetch the most recent run for a given workflow from the GH Actions API.
 * Returns null if no run found.
 */
export async function fetchLatestRun(
  workflowFile: string,
  opts: VerifySynthexSyncOptions = {},
): Promise<GhActionsRun | null> {
  const fetcher = opts.fetcher ?? globalThis.fetch
  const branch = opts.branch ?? 'main'
  const url = `https://api.github.com/repos/${SYNTHEX_REPO}/actions/workflows/${encodeURIComponent(workflowFile)}/runs?branch=${encodeURIComponent(branch)}&per_page=1`
  const res = await fetcher(url, { headers: buildHeaders(opts.token) })
  if (!res.ok) {
    throw new Error(`GH API ${res.status} for ${workflowFile}: ${await res.text()}`)
  }
  const body = (await res.json()) as GhActionsRunsResponse
  if (body.workflow_runs.length === 0) return null
  return body.workflow_runs[0]
}

/**
 * Map a GhActionsRun to a SynthexCheckResult.
 * If the run is null (no runs found), the result has `passed: null` and a
 * `no_run_count` increment.
 */
function mapRunToResult(
  check: SynthexVerifyCheck,
  run: GhActionsRun | null,
): SynthexCheckResult {
  if (run === null) {
    return {
      check,
      passed: null,
      status: 'no_run',
      conclusion: null,
      triggered_at: null,
      run_id: null,
      html_url: null,
    }
  }
  const passed =
    run.status === 'completed' && run.conclusion === 'success'
      ? true
      : run.conclusion === 'success' || run.conclusion === 'neutral'
        ? null // still running or neutral
        : false
  return {
    check,
    passed,
    status: run.status ?? 'unknown',
    conclusion: run.conclusion,
    triggered_at: run.run_started_at,
    run_id: String(run.id),
    html_url: run.html_url,
  }
}

/**
 * The main verification entrypoint. Fetches the latest run for each
 * configured check and returns a structured result.
 *
 * Bounded / fault-tolerant: if a single check fails to fetch, the
 * verification still completes (that check gets `passed: null` and the
 * error is captured in the result).
 */
export async function verifySynthexSync(
  opts: VerifySynthexSyncOptions = {},
): Promise<SynthexSyncVerification> {
  const now = opts.now ?? (() => new Date())
  const branch = opts.branch ?? 'main'
  const checks: SynthexCheckResult[] = []
  let api_ok = true
  let error: string | undefined

  for (const check of SYNTHEX_VERIFY_CHECKS) {
    try {
      const run = await fetchLatestRun(check, opts)
      checks.push(mapRunToResult(check, run))
    } catch (err) {
      api_ok = false
      const message = err instanceof Error ? err.message : 'Unknown error'
      error = message
      checks.push({
        check,
        passed: null,
        status: 'api_error',
        conclusion: null,
        triggered_at: null,
        run_id: null,
        html_url: null,
      })
    }
  }

  const passed_count = checks.filter((c) => c.passed === true).length
  const failed_count = checks.filter((c) => passed_determined_as_failure(c.passed)).length
  const no_run_count = checks.filter((c) => c.status === 'no_run').length
  // all_passed means: every check has a definitive pass. API errors and
  // no-runs are NOT "all passed" — they mean the verification couldn't
  // complete or the check hasn't run. The caller decides what to do.
  const all_passed =
    failed_count === 0 && no_run_count === 0 && api_ok && checks.every((c) => c.passed === true)

  const result: SynthexSyncVerification = {
    repo: SYNTHEX_REPO,
    checked_at: now().toISOString(),
    branch,
    api_ok,
    all_passed,
    passed_count,
    failed_count,
    no_run_count,
    checks,
  }
  if (error !== undefined) result.error = error
  return result
}

/** Type guard: a `passed: true | false | null` should classify as failure only when explicitly false. */
function passed_determined_as_failure(passed: boolean | null): boolean {
  return passed === false
}

/**
 * Format a SynthexSyncVerification into a short human-readable summary.
 * Used by the cron manifest's output and the dashboard update path.
 */
export function formatSyncSummary(v: SynthexSyncVerification): string {
  const total = SYNTHEX_VERIFY_CHECKS.length
  const overall = v.all_passed ? 'PASS' : 'FAIL'
  return (
    `[${overall}] Synthex sync verify @ ${v.checked_at} (${v.branch}) — ` +
    `passed=${v.passed_count}/${total} failed=${v.failed_count} no_run=${v.no_run_count}` +
    (v.error ? ` error=${v.error}` : '')
  )
}
