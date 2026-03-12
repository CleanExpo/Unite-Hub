// src/lib/coaches/build.ts
// Build Coach data fetcher — Linear issues and velocity metrics

import type { CoachContext, CoachDataFetcher } from './types'
import { fetchIssues, type LinearIssue } from '@/lib/integrations/linear'

export const fetchBuildData: CoachDataFetcher = async (_founderId: string): Promise<CoachContext> => {
  const reportDate = new Date().toISOString().split('T')[0]

  let issues: LinearIssue[]
  try {
    issues = await fetchIssues()
  } catch (err) {
    console.warn('[Build Coach] Linear API error, using empty data:', err)
    issues = []
  }

  const started = issues.filter((i) => i.state.type === 'started')
  const completed = issues.filter((i) => i.state.type === 'completed')
  const highPriority = issues.filter((i) => i.priority <= 2 && i.priority > 0)

  return {
    coachType: 'build',
    reportDate,
    data: {
      issues: issues.map((i) => ({
        identifier: i.identifier,
        title: i.title,
        priority: i.priority,
        teamKey: i.team.key,
        teamName: i.team.name,
        stateName: i.state.name,
        stateType: i.state.type,
      })),
      totalIssues: issues.length,
      inProgress: started.length,
      completedCount: completed.length,
      highPriorityCount: highPriority.length,
    },
  }
}
