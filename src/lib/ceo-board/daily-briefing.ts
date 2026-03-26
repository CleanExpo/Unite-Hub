// src/lib/ceo-board/daily-briefing.ts
// AI synthesis engine for the daily CEO Board Meeting.
// Applies Anthropic harness pattern: context reset + structured handoff.
// Phase 1 (parallel Haiku): Each data source → compact artifact (max 200 tokens each).
// Phase 2 (Sonnet, clean context): Receives only the compact artifacts → full board minutes.
// This prevents context anxiety as data volume grows, per the harness design doc.

import { getAIClient } from '@/lib/ai/client'
import type { GitHubCommitSummary, GitHubPRSummary } from '@/lib/integrations/github-board'
import type { LinearCompletedIssue, LinearInFlightIssue, LinearIssueWithDue } from '@/lib/integrations/linear-board'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BriefingInput {
  meetingDate: string  // DD/MM/YYYY
  coachReports: Array<{ coach_type: string; brief_markdown: string; status: string }>
  strategyInsights: Array<{ type: string; title: string; priority: string; status: string }>
  linearCompleted: LinearCompletedIssue[]
  linearInFlight: LinearInFlightIssue[]
  linearOverdue: LinearIssueWithDue[]   // issues where dueDate < today
  githubCommits: GitHubCommitSummary[]
  githubPRs: GitHubPRSummary[]
  xeroSummary: Array<{ businessKey: string; revenueAud: number; expensesAud: number; growth: number }>
  openDecisions: number  // count of open ceo_decisions
  githubConfigured: boolean
}

export interface BoardAgendaSection {
  title: string
  items: string[]
  highlight?: string  // key callout for this section
}

export interface BoardMeetingResult {
  agenda: Record<string, BoardAgendaSection>
  brief_md: string
  decisionsRequired: string[]  // action items needing CEO input today
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are the AI Chief of Staff for a 7-business portfolio company run by Phill McGurk (CEO) based in Australia. You chair the daily board meeting by synthesising data from all business systems into a structured morning briefing.

## THE NORTH STAR — Why This Company Exists

This portfolio is built to dominate and transform the Specialised Cleaning Industry across Australia and New Zealand. The insurance industry has systematically disadvantaged small owner-operator restorers by introducing large Builder/Restorer companies that prioritise reconstruction over specialised restoration. Phill's mission is to give owner-operators the tools, education, and market presence to compete and win.

**The 6 core businesses and how they interact:**
- **CARSI** — The Specialised Cleaning & Restoration Industry platform. Industry standards, education, certification for small/medium operators.
- **Disaster Recovery (DR)** — Flagship owner-operator restoration business. The proof-of-concept that the model works.
- **NRPG** — National Restoration Professional Group. Industry association and peer network for operators.
- **Synthex** — The AI-powered content agency. Produces content, statistics, and marketing assets for all businesses AND external SME clients. Synthex is the distribution engine for the entire portfolio.
- **ATO Tax Optimizer** — Helps small business operators navigate Australian tax. Leverages the industry trust built by CARSI/NRPG.
- **RestoreAssist** — Software tools purpose-built for restoration operators. Job management, quoting, reporting.

**Synthex is the content juggernaut** that amplifies all other businesses: it gathers original industry statistics, produces publications, increases visibility for operators and clients, and provides a sustainable online agency model for AUS/NZ SMEs across any industry that needs marketing, branding, and localised rankings.

**Every board meeting decision should be filtered through this lens:** Does this action bring us closer to dominating the specialised cleaning industry and empowering small operators in Australia and New Zealand?

Your briefing must be:
- Action-oriented — every section ends with a clear "CEO action required" or "no action needed"
- Concise — bullet points, not paragraphs
- Australian context — AUD currency, Australian business norms, AEST timezone references
- Honest — flag risks and blockers directly, don't soften problems

Output a JSON object with this exact structure:
{
  "agenda": {
    "shipped": { "title": "What shipped yesterday", "items": [...], "highlight": "..." },
    "linear": { "title": "Linear — in-flight & blocked", "items": [...], "highlight": "..." },
    "github": { "title": "GitHub — commits & PRs", "items": [...], "highlight": "..." },
    "financials": { "title": "Financials — Xero movement", "items": [...], "highlight": "..." },
    "strategy": { "title": "Strategy — insights actioned", "items": [...], "highlight": "..." },
    "decisions": { "title": "Decisions required today", "items": [...], "highlight": "..." },
    "gantt": { "title": "Gantt — timeline risks", "items": [...], "highlight": "..." }
  },
  "brief_md": "Full markdown board minutes — all 7 sections, formatted for reading. 400–600 words total.",
  "decisionsRequired": ["Decision 1 needing CEO input", "Decision 2..."]
}

Return ONLY the JSON. No preamble, no markdown fences.`

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function runDailyBriefing(input: BriefingInput): Promise<BoardMeetingResult> {
  const ai = getAIClient()

  // ── Phase 1: Summarise each data source in parallel (Haiku, clean context per source) ──
  // Each source produces a compact artifact (max 200 tokens) to prevent context bloat.
  const [linearSummary, githubSummary, xeroSummary, coachSummary] = await Promise.all([
    summariseSection(ai, 'Linear', buildLinearBlock(input)),
    summariseSection(ai, 'GitHub', buildGitHubBlock(input)),
    summariseSection(ai, 'Xero Financials', buildXeroBlock(input)),
    summariseSection(ai, 'Coach Reports', buildCoachBlock(input)),
  ])

  // ── Phase 2: Synthesise — clean context, compact artifacts only ──
  const handoffMessage = [
    `## Board Meeting — ${input.meetingDate}`,
    '',
    '### Linear (shipped · in-flight · overdue)',
    linearSummary,
    '',
    '### GitHub',
    githubSummary,
    '',
    '### Xero MTD Financials',
    xeroSummary,
    '',
    '### Coach Reports',
    coachSummary,
    '',
    '### Strategy Insights',
    input.strategyInsights.length === 0
      ? 'None being actioned.'
      : input.strategyInsights
          .filter((s) => s.status !== 'new')
          .slice(0, 5)
          .map((s) => `- [${s.type}] ${s.title} (${s.priority} · ${s.status})`)
          .join('\n'),
    '',
    `### Open CEO Decisions: ${input.openDecisions} awaiting resolution`,
    '',
    'Generate the board meeting briefing for the CEO.',
  ].join('\n')

  const response = await ai.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: handoffMessage }],
  })

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')

  let result: BoardMeetingResult
  try {
    result = JSON.parse(text.trim()) as BoardMeetingResult
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('[CEO Board] Failed to parse briefing JSON')
    result = JSON.parse(match[0]) as BoardMeetingResult
  }

  return result
}

// ---------------------------------------------------------------------------
// Phase 1 helper: summarise a section via Haiku (clean context per call)
// ---------------------------------------------------------------------------

async function summariseSection(
  ai: ReturnType<typeof getAIClient>,
  sectionName: string,
  rawData: string
): Promise<string> {
  try {
    const response = await ai.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 250,
      system: 'You are a concise data summariser. Produce a 3–5 bullet point summary of the provided data. Be specific about numbers and names. Output plain text only.',
      messages: [{ role: 'user', content: `Summarise this ${sectionName} data:\n\n${rawData}` }],
    })
    return response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')
      .trim()
  } catch {
    return rawData.slice(0, 400) // fallback to raw data if Haiku fails
  }
}

// ---------------------------------------------------------------------------
// Phase 1 block builders — raw data per section for Haiku summarisation
// ---------------------------------------------------------------------------

function buildLinearBlock(input: BriefingInput): string {
  const lines: string[] = []
  lines.push('Completed yesterday:')
  if (input.linearCompleted.length === 0) {
    lines.push('  None')
  } else {
    input.linearCompleted.forEach((i) => lines.push(`  [${i.team.key}] ${i.identifier}: ${i.title}`))
  }
  lines.push('In-flight:')
  if (input.linearInFlight.length === 0) {
    lines.push('  None')
  } else {
    input.linearInFlight.forEach((i) =>
      lines.push(`  [${i.team.key}] ${i.identifier}: ${i.title} (${i.state.name}${i.assignee ? ` · ${i.assignee.name}` : ''})`)
    )
  }
  lines.push('Overdue:')
  if (input.linearOverdue.length === 0) {
    lines.push('  None')
  } else {
    input.linearOverdue.forEach((i) => lines.push(`  [${i.team.key}] ${i.identifier}: ${i.title} (due ${i.dueDate})`))
  }
  return lines.join('\n')
}

function buildGitHubBlock(input: BriefingInput): string {
  if (!input.githubConfigured) return 'GitHub not configured (GITHUB_TOKEN not set)'
  const lines: string[] = [`Commits yesterday: ${input.githubCommits.length}`]
  input.githubCommits.slice(0, 10).forEach((c) => lines.push(`  [${c.repo}] ${c.message} (${c.author})`))
  lines.push(`Open PRs: ${input.githubPRs.length}`)
  input.githubPRs.forEach((pr) => lines.push(`  [${pr.repo}] #${pr.number}: ${pr.title}${pr.draft ? ' [DRAFT]' : ''}`))
  return lines.join('\n')
}

function buildXeroBlock(input: BriefingInput): string {
  if (input.xeroSummary.length === 0) return 'No Xero data available'
  return input.xeroSummary
    .map((x) => `${x.businessKey.toUpperCase()}: Revenue AUD $${(x.revenueAud / 100).toLocaleString('en-AU')} | Expenses AUD $${(x.expensesAud / 100).toLocaleString('en-AU')} | Growth ${x.growth > 0 ? '+' : ''}${x.growth}% MoM`)
    .join('\n')
}

function buildCoachBlock(input: BriefingInput): string {
  if (input.coachReports.length === 0) return 'No coach reports'
  return input.coachReports
    .map((r) => `${r.coach_type.toUpperCase()} (${r.status}): ${r.brief_markdown.slice(0, 300)}`)
    .join('\n')
}
