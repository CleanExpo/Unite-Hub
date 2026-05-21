// src/lib/coaches/prompts/build.ts
// Build Coach prompt — engineering manager tracking sprint health

export const BUILD_COACH_SYSTEM_PROMPT = `You are an engineering manager coaching an Australian founder who manages multiple software projects tracked in Linear.

Your role is to review project velocity, issue states, and blockers across all teams, providing a concise daily engineering brief.

Output format (Markdown):
## Build Status Overview
- Total issues: in progress, completed recently, blocked/stale
- Sprint health assessment (on track / at risk / behind)

## Active Work
- Issues currently in progress, grouped by team/project
- Any high-priority (urgent/high) items requiring attention

## Blockers & Risks
- Stale issues (started but no update in 3+ days)
- High-priority items not yet started
- Teams with zero velocity

## Recommendations
- What to focus on today
- Issues to unblock or reassign
- Velocity trends and suggestions

Keep it actionable and concise. Use Australian English.`

export function buildBuildUserMessage(data: {
  issues: Array<{
    identifier: string
    title: string
    priority: number
    teamKey: string
    teamName: string
    stateName: string
    stateType: string
  }>
  todayDate: string
}): string {
  const lines: string[] = [`Report Date: ${data.todayDate}`]

  const started = data.issues.filter((i) => i.stateType === 'started')
  const completed = data.issues.filter((i) => i.stateType === 'completed')
  const backlog = data.issues.filter((i) => i.stateType === 'backlog' || i.stateType === 'unstarted')
  const triage = data.issues.filter((i) => i.stateType === 'triage')

  lines.push(`\n### Summary`)
  lines.push(`- In Progress: ${started.length}`)
  lines.push(`- Completed: ${completed.length}`)
  lines.push(`- Backlog/Unstarted: ${backlog.length}`)
  lines.push(`- Triage: ${triage.length}`)
  lines.push(`- Total: ${data.issues.length}`)

  lines.push(`\n### In Progress (${started.length})`)
  for (const i of started) {
    const priority = ['None', 'Urgent', 'High', 'Normal', 'Low'][i.priority] ?? 'Unknown'
    lines.push(`- [${i.identifier}] ${i.title} — ${i.teamName} (${priority})`)
  }

  const highPriority = data.issues.filter((i) => i.priority <= 2 && i.priority > 0 && i.stateType !== 'completed' && i.stateType !== 'canceled')
  if (highPriority.length > 0) {
    lines.push(`\n### High Priority / Urgent (${highPriority.length})`)
    for (const i of highPriority) {
      const priority = i.priority === 1 ? 'URGENT' : 'High'
      lines.push(`- [${i.identifier}] ${i.title} — ${i.teamName} [${priority}] — Status: ${i.stateName}`)
    }
  }

  return lines.join('\n')
}
