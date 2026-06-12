import { describe, it, expect } from 'vitest'
import {
  verifySynthexSync,
  formatSyncSummary,
  SYNTHEX_VERIFY_CHECKS,
  SYNTHEX_REPO,
  type GhActionsRunsResponse,
  type SynthexSyncVerification,
} from '../sync-verify'

const FIXED_NOW = new Date('2026-06-12T17:00:00Z')

/** Build a fake fetch that returns the given run per workflow. */
function fakeFetcher(
  responses: Record<string, GhActionsRunsResponse>,
  opts: { throwOn?: string[] } = {},
): typeof fetch {
  return (async (url: string) => {
    // Extract the workflow file from the URL: .../workflows/<file>/runs?...
    const m = url.match(/\/workflows\/([^/]+)\/runs/)
    if (!m) return new Response('not found', { status: 404 })
    const wf = decodeURIComponent(m[1])
    if (opts.throwOn?.includes(wf)) {
      return new Response(JSON.stringify({ message: 'rate limit' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const body = responses[wf] ?? { total_count: 0, workflow_runs: [] }
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }) as typeof fetch
}

function buildRun(
  id: number,
  name: string,
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | null,
  status: 'completed' | 'in_progress' | 'queued' = 'completed',
): GhActionsRunsResponse['workflow_runs'][number] {
  return {
    id,
    name,
    status,
    conclusion,
    run_started_at: `2026-06-12T${10 + (id % 10)}:00:00Z`,
    html_url: `https://github.com/${SYNTHEX_REPO}/actions/runs/${id}`,
    head_branch: 'main',
  }
}

describe('SYNTHEX_VERIFY_CHECKS', () => {
  it('contains the 9 expected GH Action names from CleanExpo/Synthex', () => {
    // These are the names from `gh workflow list --repo CleanExpo/Synthex`
    // that the Synthex maintainers treat as the sync-readiness gate.
    expect(SYNTHEX_VERIFY_CHECKS).toContain('CI')
    expect(SYNTHEX_VERIFY_CHECKS).toContain('Deploy')
    expect(SYNTHEX_VERIFY_CHECKS).toContain('Security')
    expect(SYNTHEX_VERIFY_CHECKS).toContain('Lighthouse Audit')
    expect(SYNTHEX_VERIFY_CHECKS).toContain('Brand Intelligence Pipeline')
    expect(SYNTHEX_VERIFY_CHECKS).toContain('Score Accuracy Gate')
    expect(SYNTHEX_VERIFY_CHECKS).toContain('CodeQL')
    expect(SYNTHEX_VERIFY_CHECKS).toContain('DESIGN.md lint')
    expect(SYNTHEX_VERIFY_CHECKS).toContain('Synthex Review Board')
    expect(SYNTHEX_VERIFY_CHECKS.length).toBe(9)
  })
})

describe('verifySynthexSync', () => {
  it('returns all_passed=true when every check has a successful run', async () => {
    const responses: Record<string, GhActionsRunsResponse> = {}
    for (const c of SYNTHEX_VERIFY_CHECKS) {
      responses[c] = { total_count: 1, workflow_runs: [buildRun(100, c, 'success')] }
    }
    const v = await verifySynthexSync({ fetcher: fakeFetcher(responses), now: () => FIXED_NOW })
    expect(v.repo).toBe(SYNTHEX_REPO)
    expect(v.branch).toBe('main')
    expect(v.api_ok).toBe(true)
    expect(v.all_passed).toBe(true)
    expect(v.passed_count).toBe(9)
    expect(v.failed_count).toBe(0)
    expect(v.no_run_count).toBe(0)
    expect(v.checks).toHaveLength(9)
    expect(v.checked_at).toBe(FIXED_NOW.toISOString())
    expect(v.error).toBeUndefined()
  })

  it('returns all_passed=false when one check has a failed conclusion', async () => {
    const responses: Record<string, GhActionsRunsResponse> = {}
    for (const c of SYNTHEX_VERIFY_CHECKS) {
      const conclusion = c === 'CI' ? 'failure' : 'success'
      responses[c] = {
        total_count: 1,
        workflow_runs: [buildRun(100, c, conclusion as 'success' | 'failure')],
      }
    }
    const v = await verifySynthexSync({ fetcher: fakeFetcher(responses), now: () => FIXED_NOW })
    expect(v.all_passed).toBe(false)
    expect(v.failed_count).toBe(1)
    expect(v.passed_count).toBe(8)
    const failed = v.checks.find((c) => c.check === 'CI')!
    expect(failed.passed).toBe(false)
    expect(failed.conclusion).toBe('failure')
  })

  it('counts a "neutral" conclusion as not-yet-determined (passed: null, not failure)', async () => {
    const responses: Record<string, GhActionsRunsResponse> = {}
    for (const c of SYNTHEX_VERIFY_CHECKS) {
      responses[c] = { total_count: 1, workflow_runs: [buildRun(1, c, 'neutral', 'in_progress')] }
    }
    const v = await verifySynthexSync({ fetcher: fakeFetcher(responses), now: () => FIXED_NOW })
    expect(v.all_passed).toBe(false) // a check with passed=null is not "all passed"
    expect(v.failed_count).toBe(0)
    expect(v.no_run_count).toBe(0)
  })

  it('marks checks with no runs as no_run (passed: null, status: "no_run")', async () => {
    const responses: Record<string, GhActionsRunsResponse> = {
      CI: { total_count: 1, workflow_runs: [buildRun(1, 'CI', 'success')] },
    }
    const v = await verifySynthexSync({ fetcher: fakeFetcher(responses), now: () => FIXED_NOW })
    expect(v.api_ok).toBe(true)
    expect(v.all_passed).toBe(false)
    expect(v.passed_count).toBe(1)
    expect(v.no_run_count).toBe(8)
    // Pick a check that was the no_run (any check that wasn't 'CI').
    const noRun = v.checks.find((c) => c.check === 'Deploy')!
    expect(noRun.passed).toBe(null)
    expect(noRun.status).toBe('no_run')
    // The success check is reported correctly.
    const ok = v.checks.find((c) => c.check === 'CI')!
    expect(ok.passed).toBe(true)
  })

  it('continues on per-check API errors and captures them in the result', async () => {
    const responses: Record<string, GhActionsRunsResponse> = {}
    for (const c of SYNTHEX_VERIFY_CHECKS) {
      responses[c] = { total_count: 1, workflow_runs: [buildRun(1, c, 'success')] }
    }
    const fetcher = fakeFetcher(responses, { throwOn: ['Security'] })
    const v = await verifySynthexSync({ fetcher, now: () => FIXED_NOW })
    expect(v.api_ok).toBe(false)
    expect(v.all_passed).toBe(false)
    expect(v.error).toMatch(/rate limit/)
    const sec = v.checks.find((c) => c.check === 'Security')!
    expect(sec.passed).toBe(null)
    expect(sec.status).toBe('api_error')
  })

  it('respects a custom branch', async () => {
    const responses: Record<string, GhActionsRunsResponse> = {}
    for (const c of SYNTHEX_VERIFY_CHECKS) {
      responses[c] = { total_count: 1, workflow_runs: [buildRun(1, c, 'success')] }
    }
    const v = await verifySynthexSync({
      fetcher: fakeFetcher(responses),
      branch: 'release/2026-q3',
      now: () => FIXED_NOW,
    })
    expect(v.branch).toBe('release/2026-q3')
  })
})

describe('formatSyncSummary', () => {
  it('produces a single-line summary with PASS/FAIL + counts', () => {
    const v: SynthexSyncVerification = {
      repo: SYNTHEX_REPO,
      checked_at: '2026-06-12T17:00:00.000Z',
      branch: 'main',
      api_ok: true,
      all_passed: true,
      passed_count: 9,
      failed_count: 0,
      no_run_count: 0,
      checks: [],
    }
    expect(formatSyncSummary(v)).toBe(
      '[PASS] Synthex sync verify @ 2026-06-12T17:00:00.000Z (main) — passed=9/9 failed=0 no_run=0',
    )
  })

  it('includes the error string when api_ok=false', () => {
    const v: SynthexSyncVerification = {
      repo: SYNTHEX_REPO,
      checked_at: '2026-06-12T17:00:00.000Z',
      branch: 'main',
      api_ok: false,
      all_passed: false,
      passed_count: 8,
      failed_count: 1,
      no_run_count: 0,
      checks: [],
      error: 'GH API 429 for Security: rate limit',
    }
    const s = formatSyncSummary(v)
    expect(s).toMatch(/\[FAIL\]/)
    expect(s).toMatch(/error=GH API 429 for Security: rate limit/)
  })
})
