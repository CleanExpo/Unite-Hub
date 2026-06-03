// src/app/api/cron/pi-ceo-weekly-review/route.ts
// GET /api/cron/pi-ceo-weekly-review
// Weekly Pi-CEO Board strategic review — runs Sunday 20:00 UTC (Monday 06:00 AEST)
// Aggregates: Linear velocity, GitHub shipping, vault growth, agent activity, strategic decisions
// Outputs: Weekly strategic brief, decision queue, next-week priorities

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
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
import { notify } from '@/lib/notifications'

export const dynamic = 'force-dynamic'
export const maxDuration = 180

const GITHUB_ORG = process.env.GITHUB_OWNER ?? 'CleanExpo'

export async function GET(request: Request) {
  const startTime = Date.now()

  // Auth
  if (!process.env.CRON_SECRET) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET.trim()}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const founderId = process.env.FOUNDER_USER_ID?.trim()
  if (!founderId) {
    return NextResponse.json({ error: 'FOUNDER_USER_ID not configured' }, { status: 500 })
  }

  try {
    const supabase = createServiceClient()
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const today = new Date().toISOString().split('T')[0]

    const videoPipelineStatsPromise = Promise.resolve(
      supabase.rpc('get_video_pipeline_stats', { p_founder_id: founderId })
    ).catch(() => ({ data: null }))

    // Parallel data fetch
    const [
      linearCompleted,
      linearInFlight,
      linearDue,
      videoPipelineResult,
      agentResult,
      vaultResult,
      decisionsResult,
    ] = await Promise.allSettled([
      fetchRecentlyCompletedIssues(weekStart),
      fetchInFlightIssues(),
      fetchIssuesWithDueDates(),
      videoPipelineStatsPromise,
      supabase
        .from('agent_executions')
        .select('agent_name, status, execution_time_ms, created_at')
        .eq('initiated_by', founderId)
        .gte('created_at', weekStart.toISOString()),
      supabase
        .from('knowledge_notes')
        .select('project_key, created_at', { count: 'exact' })
        .eq('founder_id', founderId)
        .eq('is_deleted', false),
      supabase
        .from('ceo_decisions')
        .select('status, title', { count: 'exact' })
        .eq('founder_id', founderId)
        .or('status.eq.open,status.eq.blocked'),
    ])

    // GitHub (conditional)
    let githubCommits = 0
    let githubOpenPRs = 0
    let githubConfigured = false

    try {
      githubConfigured = isGitHubBoardConfigured()
      if (githubConfigured) {
        const repos = await fetchOrgRepos(GITHUB_ORG)
        const repoResults = await Promise.allSettled(
          repos.slice(0, 10).map(async (repo) => {
            const [commits, prs] = await Promise.all([
              fetchRecentCommits(GITHUB_ORG, repo.name, weekStart),
              fetchOpenPRs(GITHUB_ORG, repo.name),
            ])
            return { commits: commits.length, prs: prs.length }
          })
        )
        for (const r of repoResults) {
          if (r.status === 'fulfilled') {
            githubCommits += r.value.commits
            githubOpenPRs += r.value.prs
          }
        }
      }
    } catch {
      githubConfigured = false
    }

    // Process agent metrics
    const agentData = agentResult.status === 'fulfilled' ? (agentResult.value.data ?? []) : []
    const successfulAgents = agentData.filter((a: Record<string, unknown>) => a.status === 'completed')
    const agentDurations = agentData
      .filter((a: Record<string, unknown>) => a.execution_time_ms != null)
      .map((a: Record<string, unknown>) => a.execution_time_ms as number)
    const avgDuration = agentDurations.length > 0
      ? Math.round(agentDurations.reduce((sum: number, d: number) => sum + d, 0) / agentDurations.length / 1000)
      : 0
    const successRate = agentData.length > 0 ? successfulAgents.length / agentData.length : 1

    // Process vault metrics
    const vaultData = vaultResult.status === 'fulfilled' ? (vaultResult.value.data ?? []) : []
    const vaultCount = vaultResult.status === 'fulfilled' ? (vaultResult.value.count ?? 0) : 0
    const projectsSet = new Set(vaultData.map((n: Record<string, unknown>) => n.project_key as string))
    const notesAdded = vaultData.filter((n: Record<string, unknown>) => {
      const created = new Date(n.created_at as string)
      return created >= weekStart
    }).length

    // Process decisions
    const decisionData = decisionsResult.status === 'fulfilled' ? (decisionsResult.value.data ?? []) : []
    const openDecisions = decisionData.filter((d: Record<string, unknown>) => d.status === 'open').length
    const blockedDecisions = decisionData.filter((d: Record<string, unknown>) => d.status === 'blocked').length

    // Linear results
    const shipped = linearCompleted.status === 'fulfilled' ? linearCompleted.value.length : 0
    const inFlight = linearInFlight.status === 'fulfilled' ? linearInFlight.value.length : 0
    const overdue = linearDue.status === 'fulfilled'
      ? linearDue.value.filter((i: { dueDate?: string }) => i.dueDate && i.dueDate < today).length
      : 0

    const videoPipelineData = (videoPipelineResult as { status: string; value?: { data?: Record<string, unknown> } }).status === 'fulfilled'
      ? (videoPipelineResult as unknown as { value: { data: Record<string, unknown> } }).value?.data ?? {}
      : {}
    const videoJobsTotal = (videoPipelineData.total_jobs as number) ?? 0
    const videoJobsPublished = (videoPipelineData.published_this_week as number) ?? 0
    const videoJobsFailed = (videoPipelineData.failed_this_week as number) ?? 0
    const videoCostCents = (videoPipelineData.total_cost_cents as number) ?? 0
    const videoCostAud = Math.round(videoCostCents) / 100

    // Determine velocity score (0-100) — now includes video pipeline
    const velocityScore = Math.min(100, Math.round(
      (shipped / Math.max(inFlight, 1)) * 30 +
      (successRate * 25) +
      (Math.min(vaultCount, 100) / 100) * 15 +
      (githubCommits > 0 ? 10 : 0) +
      (videoJobsPublished > 0 ? 20 : 0)
    ))

    // Determine headline
    let headline = 'Steady progress across the portfolio'
    if (shipped > inFlight) headline = 'Exceptional shipping velocity this week'
    else if (overdue > 5) headline = 'Overdue items require immediate attention'
    else if (notesAdded > 10) headline = 'Knowledge base growing rapidly'
    else if (blockedDecisions > 0) headline = 'Blocked decisions need your input'

    // Build brief
    const brief = {
      headline,
      executiveSummary: `Week ending ${today} — ${shipped} issues shipped, ${inFlight} in-flight, ${githubCommits} commits. Velocity: ${velocityScore}/100.`,
      velocityScore,
      topWins: shipped > 0 ? [`${shipped} Linear issues shipped`, `${githubCommits} GitHub commits`] : ['No shipping metrics captured'],
      blockers: [
        overdue > 0 ? `${overdue} overdue items` : 'No overdue items',
        blockedDecisions > 0 ? `${blockedDecisions} blocked decisions` : 'No blocked decisions',
      ],
      risks: [
        inFlight > shipped * 3 ? 'WIP exceeds shipped by 3x — consider WIP limits' : 'WIP under control',
      ],
      decisionsRequired: [
        openDecisions > 0 ? `${openDecisions} open decisions in board` : 'No open decisions',
      ],
      nextWeekPriorities: [
        overdue > 0 ? `Clear ${overdue} overdue items` : 'Maintain zero overdue',
        inFlight > 0 ? `Ship ${Math.ceil(inFlight * 0.3)} from current WIP` : 'Plan next cycle',
        vaultCount === 0 ? 'Connect Obsidian vault for knowledge sync' : `Expand ${projectsSet.size} documented projects`,
      ],
      metrics: {
        linear: { shipped, inFlight, overdue, created: shipped + inFlight },
        github: { commits: githubCommits, openPRs: githubOpenPRs, configured: githubConfigured },
        vault: { notesAdded, notesTotal: vaultCount, projectsActive: projectsSet.size },
        agents: { executions: agentData.length, avgDurationSec: avgDuration, successRate: Math.round(successRate * 100) },
        decisions: { open: openDecisions, blocked: blockedDecisions },
        video: {
          totalJobs: videoJobsTotal,
          publishedThisWeek: videoJobsPublished,
          failedThisWeek: videoJobsFailed,
          totalCostAud: videoCostAud,
        },
      },
    }

    // Upsert to weekly_reviews table (graceful — table may not exist yet)
    try {
      await supabase
        .from('weekly_reviews')
        .upsert({
          founder_id: founderId,
          review_period_start: weekStart.toISOString().split('T')[0],
          headline: brief.headline,
          brief_md: formatBriefMarkdown(brief),
          metrics: brief.metrics as unknown as Record<string, unknown>,
          decisions_queue: brief.decisionsRequired,
          next_priorities: brief.nextWeekPriorities,
          status: 'new',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'founder_id,review_period_start' })
    } catch {
      // Table may not exist — okay for now
    }

    // Also upsert to board_meetings (unified with daily format)
    try {
      await supabase
        .from('board_meetings')
        .upsert({
          founder_id: founderId,
          meeting_date: today,
          status: 'new',
          brief_md: formatBriefMarkdown(brief),
          linear_data: { completed: shipped, inFlight, overdue },
          github_data: { commits: githubCommits, prs: githubOpenPRs, configured: githubConfigured },
          metrics: {
            velocityScore,
            openDecisions,
            vaultNotes: vaultCount,
          },
          updated_at: new Date().toISOString(),
        }, { onConflict: 'founder_id,meeting_date' })
    } catch {
      // Non-fatal
    }

    const durationSec = Math.round((Date.now() - startTime) / 1000)
    console.log(`[Pi-CEO Weekly] ${today} review | Velocity: ${velocityScore} | Shipped: ${shipped} | Vault: ${vaultCount}`)

    notify({
      type: 'cron_complete',
      title: `Weekly Review — ${today}`,
      body: brief.headline,
      severity: velocityScore < 40 ? 'warning' : 'info',
      metadata: { durationSec },
    }).catch(() => {})

    return NextResponse.json({ success: true, brief })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Pi-CEO Weekly] Fatal error:', msg)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

function formatBriefMarkdown(brief: {
  headline: string
  executiveSummary: string
  velocityScore: number
  topWins: string[]
  blockers: string[]
  risks: string[]
  decisionsRequired: string[]
  nextWeekPriorities: string[]
  metrics: unknown
}): string {
  const m = brief.metrics as Record<string, Record<string, number | boolean>>
  return [
    `# Weekly Review`,
    ``,
    `> ${brief.headline}`,
    ``,
    `## Velocity Score: ${brief.velocityScore}/100`,
    ``,
    `## Executive Summary`,
    brief.executiveSummary,
    ``,
    `## Wins`,
    ...brief.topWins.map((w: string) => `- ✅ ${w}`),
    ``,
    `## Blockers`,
    ...brief.blockers.map((b: string) => `- 🚫 ${b}`),
    ``,
    `## Risks`,
    ...brief.risks.map((r: string) => `- ⚠️ ${r}`),
    ``,
    `## Decisions`,
    ...brief.decisionsRequired.map((d: string) => `- 🎯 ${d}`),
    ``,
    `## Priorities`,
    ...brief.nextWeekPriorities.map((p: string, i: number) => `${i + 1}. ${p}`),
    ``,
    `## Metrics`,
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Linear Shipped | ${m.linear?.shipped ?? 0} |`,
    `| Linear In Flight | ${m.linear?.inFlight ?? 0} |`,
    `| Linear Overdue | ${m.linear?.overdue ?? 0} |`,
    `| GitHub Commits | ${m.github?.commits ?? 0} |`,
    `| GitHub Open PRs | ${m.github?.openPRs ?? 0} |`,
    `| Vault Notes Total | ${m.vault?.notesTotal ?? 0} |`,
    `| Vault Notes Added | ${m.vault?.notesAdded ?? 0} |`,
    `| Agent Executions | ${m.agents?.executions ?? 0} |`,
    `| Agent Success Rate | ${m.agents?.successRate ?? 0}% |`,
    `| Open Decisions | ${m.decisions?.open ?? 0} |`,
    `| Blocked Decisions | ${m.decisions?.blocked ?? 0} |`,
  ].join('\n')
}
