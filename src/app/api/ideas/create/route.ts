// src/app/api/ideas/create/route.ts
// POST: Create approved spec as a Linear issue
// Body: { spec: IdeaSpec }
// Returns: { identifier: string } — e.g. "RA-42"

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createIssue, type CreateIssueInput } from '@/lib/integrations/linear'
import type { IdeaSpec } from '@/lib/ideas/conversation'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (!process.env.LINEAR_API_KEY) {
    return NextResponse.json({ error: 'Linear not configured' }, { status: 503 })
  }

  const { spec } = await request.json() as { spec: IdeaSpec }

  if (!spec?.title || !spec?.teamKey || !Array.isArray(spec?.acceptanceCriteria)) {
    return NextResponse.json({ error: 'Invalid spec payload' }, { status: 400 })
  }

  const acceptanceBlock = spec.acceptanceCriteria.length > 0
    ? `\n\n**Acceptance criteria:**\n${spec.acceptanceCriteria.map(c => `- ${c}`).join('\n')}`
    : ''

  const input: CreateIssueInput = {
    teamKey: spec.teamKey,
    title: spec.title,
    description: spec.description + acceptanceBlock,
    priority: spec.priority,
    labelNames: spec.labels,
  }

  try {
    const result = await createIssue(input)
    return NextResponse.json({ identifier: result.id, url: result.url })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create issue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
