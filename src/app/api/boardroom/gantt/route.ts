// src/app/api/boardroom/gantt/route.ts
// GET /api/boardroom/gantt — Linear issues with due dates for Gantt chart

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { fetchIssuesWithDueDates } from '@/lib/integrations/linear-board'
import { BUSINESSES } from '@/lib/businesses'

export const dynamic = 'force-dynamic'

// Map Linear team key → business key
const TEAM_TO_BUSINESS: Record<string, string> = {
  SYN: 'synthex',
  DR:  'dr',
  GP:  'carsi',
  RA:  'restore',
  UNI: 'ccw',
}

function getBusinessColor(teamKey: string): string {
  const bizKey = TEAM_TO_BUSINESS[teamKey.toUpperCase()] ?? teamKey.toLowerCase()
  return BUSINESSES.find((b) => b.key === bizKey)?.color ?? '#6b7280'
}

function getBusinessName(teamKey: string): string {
  const bizKey = TEAM_TO_BUSINESS[teamKey.toUpperCase()] ?? teamKey.toLowerCase()
  return BUSINESSES.find((b) => b.key === bizKey)?.name ?? teamKey
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const issues = await fetchIssuesWithDueDates()
  const today = new Date().toISOString().split('T')[0]

  const ganttItems = issues.map((issue) => ({
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    url: issue.url,
    dueDate: issue.dueDate,
    createdAt: issue.createdAt,
    isOverdue: issue.dueDate < today,
    teamKey: issue.team.key,
    businessKey: TEAM_TO_BUSINESS[issue.team.key.toUpperCase()] ?? issue.team.key.toLowerCase(),
    businessName: getBusinessName(issue.team.key),
    color: getBusinessColor(issue.team.key),
    state: issue.state.name,
    priority: issue.priority,
    assignee: issue.assignee?.name ?? null,
  }))

  // Sort: overdue first, then by dueDate ascending
  ganttItems.sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1
    if (!a.isOverdue && b.isOverdue) return 1
    return a.dueDate.localeCompare(b.dueDate)
  })

  return NextResponse.json({ items: ganttItems, today })
}
