// src/app/api/cron/hub-sweep/route.ts
// GET /api/cron/hub-sweep
// Nightly intelligence sweep — runs at 11pm AEST (13:00 UTC)
//
// For each owned satellite business:
//   1. Linear: open issue count
//   2. GitHub: last commit SHA + date (if repo_url set)
//   3. Supabase: last MACAS verdict date
//   4. Supabase: last bookkeeper run date
//   5. Calculates health_status and upserts into hub_satellites

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { fetchIssueCountByBusiness } from '@/lib/integrations/linear'
import { fetchLastCommit, parseRepoUrl } from '@/lib/integrations/github'
import { BUSINESSES } from '@/lib/businesses'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 1 minute — lightweight API polling only

// ── Auth ─────────────────────────────────────────────────────────────────────

function isAuthorised(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${process.env.CRON_SECRET?.trim()}`
}

// ── Health calculation ────────────────────────────────────────────────────────

function calculateHealthStatus(opts: {
  openLinearIssues: number
  lastCommitDaysAgo: number | null
  lastBookkeeperDaysAgo: number | null
}): 'green' | 'yellow' | 'red' {
  const { openLinearIssues, lastCommitDaysAgo, lastBookkeeperDaysAgo } = opts

  // Critical signals → red
  if (openLinearIssues > 10) return 'red'
  if (lastBookkeeperDaysAgo !== null && lastBookkeeperDaysAgo > 60) return 'red'

  // Warning signals → yellow
  if (openLinearIssues > 3) return 'yellow'
  if (lastCommitDaysAgo !== null && lastCommitDaysAgo > 30) return 'yellow'
  if (lastBookkeeperDaysAgo !== null && lastBookkeeperDaysAgo > 30) return 'yellow'

  return 'green'
}

function daysSince(isoDate: string | null): number | null {
  if (!isoDate) return null
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24))
}

// ── Supabase queries ──────────────────────────────────────────────────────────

async function fetchLastMacasVerdictDate(
  supabase: ReturnType<typeof createServiceClient>,
  founderId: string,
  businessKey: string
): Promise<string | null> {
  const { data } = await supabase
    .from('advisory_cases')
    .select('created_at')
    .eq('founder_id', founderId)
    .eq('status', 'judged')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Best-effort: if no judged cases, check for business_id match via businesses table
  // For now, return any judged case date as a proxy
  void businessKey // suppress unused warning — future: filter by business_id
  return (data as { created_at: string } | null)?.created_at ?? null
}

async function fetchLastBookkeeperRunDate(
  supabase: ReturnType<typeof createServiceClient>,
  founderId: string,
  businessKey: string
): Promise<string | null> {
  // bookkeeper_runs.businesses_processed is JSONB array — check if this business was included
  const { data } = await supabase
    .from('bookkeeper_runs')
    .select('completed_at, businesses_processed')
    .eq('founder_id', founderId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(5)

  if (!data) return null

  // Find the most recent run that processed this business
  for (const run of data as Array<{ completed_at: string | null; businesses_processed: Array<{ businessKey: string; status: string }> | null }>) {
    if (!run.businesses_processed) continue
    const bizResult = run.businesses_processed.find(b => b.businessKey === businessKey && b.status === 'success')
    if (bizResult) return run.completed_at
  }

  return null
}

// ── Main ─────────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const startTime = Date.now()

  if (!isAuthorised(request)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const founderId = process.env.FOUNDER_USER_ID
  if (!founderId) {
    console.error('[Hub Sweep] FOUNDER_USER_ID not set')
    return NextResponse.json({ error: 'FOUNDER_USER_ID not configured' }, { status: 500 })
  }

  const supabase = createServiceClient()
  const now = new Date().toISOString()

  // Owned satellites only
  const ownedBusinesses = BUSINESSES.filter(b => b.type === 'owned')

  // --- Fetch Linear issue counts for all businesses in one call ---
  let linearCounts: Record<string, number> = {}
  try {
    linearCounts = await fetchIssueCountByBusiness()
  } catch (err) {
    console.warn('[Hub Sweep] Linear fetch failed:', err)
  }

  // --- Fetch existing hub_satellites rows to get repo_url per business ---
  const { data: existingRows } = await supabase
    .from('hub_satellites')
    .select('business_key, repo_url, stack, notes')
    .eq('founder_id', founderId)

  const existingMap = new Map(
    (existingRows ?? []).map(row => [
      row.business_key as string,
      row as { repo_url: string | null; stack: string | null; notes: string | null },
    ])
  )

  const results: Array<{ businessKey: string; status: 'ok' | 'error'; error?: string }> = []

  for (const business of ownedBusinesses) {
    try {
      const existing = existingMap.get(business.key)
      const repoUrl = existing?.repo_url ?? null

      // --- GitHub: last commit ---
      let lastCommitSha: string | null = null
      let lastCommitAt: string | null = null
      if (repoUrl) {
        const parsed = parseRepoUrl(repoUrl)
        if (parsed) {
          const commit = await fetchLastCommit(parsed.owner, parsed.repo)
          if (commit) {
            lastCommitSha = commit.sha
            lastCommitAt = commit.authorDate
          }
        }
      }

      // --- Supabase: MACAS + bookkeeper dates ---
      const [lastMacasDate, lastBookkeeperDate] = await Promise.all([
        fetchLastMacasVerdictDate(supabase, founderId, business.key),
        fetchLastBookkeeperRunDate(supabase, founderId, business.key),
      ])

      // --- Linear issue count ---
      const openLinearIssues = linearCounts[business.key] ?? 0

      // --- Health calculation ---
      const healthStatus = calculateHealthStatus({
        openLinearIssues,
        lastCommitDaysAgo: daysSince(lastCommitAt),
        lastBookkeeperDaysAgo: daysSince(lastBookkeeperDate),
      })

      // --- Upsert ---
      const { error } = await supabase
        .from('hub_satellites')
        .upsert(
          {
            founder_id: founderId,
            business_key: business.key,
            business_name: business.name,
            // Preserve existing user-set fields; only sweep writes its own fields
            repo_url: repoUrl,
            stack: existing?.stack ?? null,
            notes: existing?.notes ?? null,
            open_linear_issues: openLinearIssues,
            last_commit_sha: lastCommitSha,
            last_commit_at: lastCommitAt,
            last_macas_verdict_date: lastMacasDate,
            last_bookkeeper_run_date: lastBookkeeperDate,
            health_status: healthStatus,
            last_swept_at: now,
            last_sweep_data: {
              linearIssues: openLinearIssues,
              lastCommitSha,
              lastCommitAt,
              lastMacasDate,
              lastBookkeeperDate,
              healthStatus,
              sweptAt: now,
            },
          },
          { onConflict: 'founder_id,business_key' }
        )

      if (error) {
        console.error(`[Hub Sweep] Upsert failed for ${business.key}:`, error.message)
        results.push({ businessKey: business.key, status: 'error', error: error.message })
      } else {
        results.push({ businessKey: business.key, status: 'ok' })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error'
      console.error(`[Hub Sweep] Error processing ${business.key}:`, msg)
      results.push({ businessKey: business.key, status: 'error', error: msg })
    }
  }

  const durationMs = Date.now() - startTime
  const successCount = results.filter(r => r.status === 'ok').length
  const errorCount = results.filter(r => r.status === 'error').length

  console.log(
    `[Hub Sweep] Complete in ${durationMs}ms — ` +
    `${successCount}/${ownedBusinesses.length} satellites swept, ${errorCount} errors`
  )

  return NextResponse.json({
    success: errorCount === 0,
    durationMs,
    satellitesSwept: successCount,
    errors: errorCount,
    results,
  })
}
