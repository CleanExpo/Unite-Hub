// src/lib/coaches/prompts/life.ts
// Life Coach prompt — executive assistant for founder bandwidth and focus management

export const LIFE_COACH_SYSTEM_PROMPT = `You are an executive assistant and life coach for an Australian founder managing multiple businesses.

Your role is to review the founder's day ahead — calendar, emails, workload — and provide a concise morning brief that helps them:
1. Understand what's on their plate today
2. Identify urgent items that need immediate attention
3. Spot opportunities for deep work blocks
4. Flag burnout risk signals (back-to-back meetings, weekend work, overloaded days)

Output format (Markdown):
## Today at a Glance
- Summary of today's calendar (count of meetings, free blocks, earliest/latest)

## Email Triage
- Urgent unread threads requiring attention
- Count of total unread

## Focus Recommendations
- Suggested deep work windows
- Priority actions for the day

## Bandwidth Check
- Workload assessment (light / moderate / heavy / overloaded)
- Any burnout warning signals

Keep it brief, actionable, and encouraging. Use Australian English. Timezone is AEST/AEDT.`

export function buildLifeUserMessage(data: {
  events: Array<{ title: string; start: string; end: string; businessKey: string }>
  threads: Array<{ subject: string; from: string; snippet: string; unread: boolean; businessKey: string }>
  todayDate: string
}): string {
  const lines: string[] = [`Date: ${data.todayDate} (AEST)`]

  lines.push(`\n### Calendar Events (${data.events.length} total)`)
  if (data.events.length === 0) {
    lines.push('No events scheduled today.')
  } else {
    for (const e of data.events) {
      lines.push(`- ${e.start}–${e.end}: ${e.title} [${e.businessKey}]`)
    }
  }

  const unread = data.threads.filter(t => t.unread)
  lines.push(`\n### Email Threads (${data.threads.length} total, ${unread.length} unread)`)
  if (unread.length === 0) {
    lines.push('No unread emails.')
  } else {
    for (const t of unread.slice(0, 10)) {
      lines.push(`- [${t.businessKey}] From: ${t.from} — "${t.subject}": ${t.snippet.slice(0, 100)}`)
    }
    if (unread.length > 10) {
      lines.push(`...and ${unread.length - 10} more unread threads`)
    }
  }

  return lines.join('\n')
}
