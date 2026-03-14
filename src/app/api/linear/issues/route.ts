// src/app/api/linear/issues/route.ts
// GET  — fetch all Linear issues mapped to Kanban columns
// PATCH — update an issue's state when dragged to a new column

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import {
  fetchIssues,
  fetchTeamStates,
  updateIssueState,
  createIssue,
  stateToColumn,
  teamKeyToBusiness,
  COLUMN_TO_STATE_NAME,
} from '@/lib/integrations/linear'
import { BUSINESSES } from '@/lib/businesses'

export const dynamic = 'force-dynamic'

const bizColor = (key: string): string =>
  BUSINESSES.find((b) => b.key === key)?.color ?? '#555555'

const EMPTY_COLUMNS = {
  today: [], hot: [], pipeline: [], someday: [], done: [],
} as const

export async function GET() {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // Return empty board when Linear is not configured — not an error
  if (!process.env.LINEAR_API_KEY) {
    return NextResponse.json({ columns: EMPTY_COLUMNS, stateMap: {}, configured: false })
  }

  try {
    const [issues, teams] = await Promise.all([fetchIssues(), fetchTeamStates()])

    // Build stateId lookup: teamKey → columnId → stateId
    const stateMap: Record<string, Record<string, string>> = {}
    for (const team of teams) {
      stateMap[team.key] = {}
      for (const [colId, stateName] of Object.entries(COLUMN_TO_STATE_NAME)) {
        const match = team.states.nodes.find((s) => s.name === stateName)
        if (match) stateMap[team.key][colId] = match.id
      }
    }

    // Group issues by column
    const columns: Record<string, {
      id: string
      title: string
      linearId: string
      businessKey: string
      businessColor: string
      priority: number
      stateId: string
      teamKey: string
    }[]> = {
      today: [], hot: [], pipeline: [], someday: [], done: [],
    }

    for (const issue of issues) {
      const colId = stateToColumn(issue.state)
      const businessKey = teamKeyToBusiness(issue.team.key)
      columns[colId].push({
        id: issue.id,
        title: `${issue.identifier} — ${issue.title}`,
        linearId: issue.id,
        businessKey,
        businessColor: bizColor(businessKey),
        priority: issue.priority,
        stateId: issue.state.id,
        teamKey: issue.team.key,
      })
    }

    return NextResponse.json({ columns, stateMap, configured: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  if (!process.env.LINEAR_API_KEY) {
    return NextResponse.json({ error: 'Linear is not configured' }, { status: 503 })
  }

  try {
    const body = await request.json() as {
      title?: string
      description?: string
      teamKey?: string
      priority?: number
    }

    if (!body.title?.trim() || !body.teamKey) {
      return NextResponse.json(
        { error: 'Missing required fields: title, teamKey' },
        { status: 400 },
      )
    }

    const identifier = await createIssue({
      teamKey: body.teamKey,
      title: body.title.trim(),
      description: body.description ?? '',
      priority: body.priority ?? 3,
    })

    return NextResponse.json({ identifier }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

export async function PATCH(request: Request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  try {
    const { issueId, columnId, teamKey, stateMap } = await request.json() as {
      issueId: string
      columnId: string
      teamKey: string
      stateMap: Record<string, Record<string, string>>
    }

    const stateId = stateMap[teamKey]?.[columnId]
    if (!stateId) {
      return NextResponse.json({ error: `No state found for ${teamKey}/${columnId}` }, { status: 400 })
    }

    await updateIssueState(issueId, stateId)
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
