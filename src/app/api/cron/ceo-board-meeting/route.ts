// src/app/api/cron/ceo-board-meeting/route.ts
// GET /api/cron/ceo-board-meeting
// Daily CEO board meeting generator — runs at 01:50 UTC (11:50 AEST)
// Aggregates GitHub + Linear + Xero + coach reports + strategy insights → Sonnet synthesis

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { runDailyBriefing, type BriefingInput } from '@/lib/ceo-board/daily-briefing'
import {
  fetchOrgRepos,
  fetchRecentCommits,
  fetchOpenPRs,
  isGitHubBoardConfigured,
} from '@/lib/integrations/github-board'
import {
  fetchRecentlyCompletedIssues,
  fetchInFlightIssues,
  fetchIssuesWithDueDates,
} from '@/lib/integrations/linear-board'
import { fetchRevenueMTD } from '@/lib/integrations/xero'
import { BUSINESSES } from '@/lib/businesses'
import { notify } from '@/lib/notifications'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const XERO_KEYS = ['dr', 'nrpg', 'carsi', 'restore', 'synthex', 'ccw'] as const
const GITHUB_ORG = process.env.GITHUB_OWNER ?? 'CleanExpo'

export async function GET(request: Request) {
  const startTime = Date.now()

  // 1. Auth
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET?.trim()}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const founderId = process.env.FOUNDER_USER_ID?.trim()
  if (!founderId) {
    return NextResponse.json({ error: 'FOUNDER_USER_ID not configured' }, { status: 500 })
  }

  try {
    const supabase = createServiceClient()
    const yesterday = new Date(Date.now() - 86_400_000)
    const today = new Date().toISOString().split('T')[0]

    // 2. Fetch all data sources in parallel
    const [coachReports, strategyInsights, openDecisionsResult, allDueIssues, linearCompleted, linearInFlight, xeroResults] =
      await Promise.allSettled([
        // Yesterday's coach reports
        supabase
          .from('coach_reports')
          .select('coach_type, brief_markdown, status')
          .gte('created_at', yesterday.toISOString())
          .in('status', ['completed', 'failed'])
          .order('created_at', { ascending: false }),

        // Strategy insights being actioned/reviewing
        supabase
          .from('strategy_insights')
          .select('type, title, priority, status')
          .neq('status', 'done')
          .order('created_at', { ascending: false })
          .limit(20),

        // Open CEO decisions count
        supabase
          .from('ceo_decisions')
          .select('id', { count: 'exact', head: true })
          .eq('founder_id', founderId)
          .eq('status', 'open'),

        // Linear: due dates for overdue calc
        fetchIssuesWithDueDates(),

        // Linear: completed yesterday
        fetchRecentlyCompletedIssues(yesterday),

        // Linear: in-flight
        fetchInFlightIssues(),

        // Xero: revenue MTD per business
        Promise.allSettled(
          XERO_KEYS.map(async (key) => {
            const result = await fetchRevenueMTD(founderId, key)
            return { businessKey: key, revenueAud: result.data.revenueCents, expensesAud: result.data.expensesCents, growth: result.data.growth }
          })
        ),
      ])

    // 3. GitHub: fetch repos then commits + PRs (conditional on token)
    const githubConfigured = isGitHubBoardConfigured()
    let githubCommits: Awaited<ReturnType<typeof fetchRecentCommits>> = []
    let githubPRs: Awaited<ReturnType<typeof fetchOpenPRs>> = []

    if (githubConfigured) {
      const repos = await fetchOrgRepos(GITHUB_ORG)
      const repoResults = await Promise.allSettled(
        repos.slice(0, 10).map(async (repo) => {
          const [commits, prs] = await Promise.all([
            fetchRecentCommits(GITHUB_ORG, repo.name, yesterday),
            fetchOpenPRs(GITHUB_ORG, repo.name),
          ])
          return { commits, prs }
        })
      )
      for (const r of repoResults) {
        if (r.status === 'fulfilled') {
          githubCommits = [...githubCommits, ...r.value.commits]
          githubPRs = [...githubPRs, ...r.value.prs]
        }
      }
    }

    // 4. Extract settled results
    const coaches = coachReports.status === 'fulfilled' ? (coachReports.value.data ?? []) : []
    const insights = strategyInsights.status === 'fulfilled' ? (strategyInsights.value.data ?? []) : []
    const openDecisions = openDecisionsResult.status === 'fulfilled' ? (openDecisionsResult.value.count ?? 0) : 0

    const dueIssues = allDueIssues.status === 'fulfilled' ? allDueIssues.value : []
    const overdueIssues = dueIssues.filter((i) => i.dueDate < today)
    const completed = linearCompleted.status === 'fulfilled' ? linearCompleted.value : []
    const inFlight = linearInFlight.status === 'fulfilled' ? linearInFlight.value : []

    const xeroSummary = xeroResults.status === 'fulfilled'
      ? xeroResults.value
          .filter((r) => r.status === 'fulfilled')
          .map((r) => {
            const v = (r as PromiseFulfilledResult<{ businessKey: string; revenueAud?: number; expensesAud?: number; momGrowthPct?: number }>).value
            return {
              businessKey: v.businessKey,
              revenueAud: v.revenueAud ?? 0,
              expensesAud: v.expensesAud ?? 0,
              growth: v.momGrowthPct ?? 0,
            }
          })
      : []

    // 5. Assemble briefing input
    const briefingInput: BriefingInput = {
      meetingDate: new Date().toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      coachReports: coaches.map((c) => ({
        coach_type: c.coach_type as string,
        brief_markdown: (c.brief_markdown as string) ?? '',
        status: c.status as string,
      })),
      strategyInsights: insights.map((s) => ({
        type: s.type as string,
        title: s.title as string,
        priority: s.priority as string,
        status: s.status as string,
      })),
      linearCompleted: completed,
      linearInFlight: inFlight,
      linearOverdue: overdueIssues,
      githubCommits,
      githubPRs,
      xeroSummary,
      openDecisions,
      githubConfigured,
    }

    // 6. Generate AI briefing
    const briefing = await runDailyBriefing(briefingInput)

    // 7. Upsert to board_meetings (UNIQUE on founder+date)
    const { error: upsertErr } = await supabase
      .from('board_meetings')
      .upsert({
        founder_id: founderId,
        meeting_date: today,
        status: 'new',
        agenda: briefing.agenda,
        brief_md: briefing.brief_md,
        github_data: { commits: githubCommits.length, prs: githubPRs.length, configured: githubConfigured },
        linear_data: { completed: completed.length, inFlight: inFlight.length, overdue: overdueIssues.length },
        xero_data: { businesses: xeroSummary.length },
        metrics: {
          decisionsRequired: briefing.decisionsRequired.length,
          openDecisions,
        },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'founder_id,meeting_date' })

    if (upsertErr) throw new Error(`Supabase upsert failed: ${upsertErr.message}`)

    const durationSec = Math.round((Date.now() - startTime) / 1000)
    console.log(`[CEO Board] Meeting for ${today} generated in ${durationSec}s | Linear: ${completed.length} shipped, ${inFlight.length} in-flight | GitHub: ${githubCommits.length} commits, ${githubPRs.length} PRs`)

    notify({
      type: 'cron_complete',
      title: `CEO Board Meeting — ${new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}`,
      body: `Daily briefing ready. ${completed.length} issues shipped, ${githubPRs.length} PRs open, ${overdueIssues.length} overdue. ${briefing.decisionsRequired.length} decisions require your input.`,
      severity: overdueIssues.length > 3 ? 'warning' : 'info',
      metadata: { durationSec },
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      meetingDate: today,
      durationSec,
      stats: {
        linearShipped: completed.length,
        linearInFlight: inFlight.length,
        linearOverdue: overdueIssues.length,
        githubCommits: githubCommits.length,
        githubPRs: githubPRs.length,
        decisionsRequired: briefing.decisionsRequired.length,
      },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[CEO Board] Fatal error:', msg)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

// Silence unused import warning — BUSINESSES used for context only
void BUSINESSES
