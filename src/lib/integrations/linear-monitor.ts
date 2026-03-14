// src/lib/integrations/linear-monitor.ts
// Watches for SYN team Linear issues that have moved to 'In Review'.
// An issue in 'In Review' means Synthex (Claude Code on spare laptop) created a PR.

import { fetchIssues } from '@/lib/integrations/linear'
import { notify } from '@/lib/notifications'

/**
 * Called by the synthex-monitor CRON every 15 minutes.
 * Finds SYN team issues in 'In Review' state and notifies Phill via Slack.
 * Returns the count of in-review issues found.
 *
 * Note: LinearIssue has `team.key` (not a flat `teamKey`) and `state.name`
 * (not a flat string). The `url` field only exists on LinearIssueDetail — we
 * construct a Linear deep-link from the identifier instead.
 */
export async function checkSynthexProgress(): Promise<{ inReviewCount: number }> {
  // TODO: Replace with a filtered Linear query (SYN team, In Review state only)
  // Currently fetches all issues (up to 500) and filters in memory — acceptable
  // for a single-tenant system with <500 total issues, but inefficient at scale.
  const issues = await fetchIssues()

  const inReview = issues.filter(
    (i) => i.team.key === 'SYN' && i.state.name === 'In Review'
  )

  for (const issue of inReview) {
    const linearUrl = `https://linear.app/issue/${issue.identifier}`

    notify({
      type: 'approval_alert',
      title: '🤖 Synthex PR Ready for Review',
      body: `${issue.identifier}: "${issue.title}" — Synthex has created a PR. Review required.`,
      severity: 'info',
      businessKey: 'synthex',
      metadata: {
        linearIssueId: issue.id,
        linearUrl,
      },
    }).catch(() => {})
  }

  return { inReviewCount: inReview.length }
}
