// src/app/api/coaches/ask/route.ts
// POST: Ask a Macro Coach a question on demand (interactive, memory-backed).
// Uses Opus 4.6 with adaptive thinking — more powerful than the nightly Haiku crons.
// Rate-limited to 5 req/min per founder (AI tier — enforced by middleware).
//
// Body: { coachType: 'revenue' | 'build' | 'marketing' | 'life', question: string, businessContext?: string }
// Response: { brief, citations, thinkingBudget, model, usage }

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { execute } from '@/lib/ai/router'
import { registerAllCapabilities } from '@/lib/ai/capabilities'
import { COACH_TYPES } from '@/lib/coaches/types'
import type { CoachType } from '@/lib/coaches/types'

export const dynamic = 'force-dynamic'

registerAllCapabilities()

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let coachType: CoachType
  let question: string
  let businessContext: string | undefined

  try {
    const body = await request.json() as {
      coachType: CoachType
      question: string
      businessContext?: string
    }
    coachType       = body.coachType
    question        = body.question
    businessContext = body.businessContext
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }

  if (!COACH_TYPES.includes(coachType)) {
    return NextResponse.json(
      { error: `coachType must be one of: ${COACH_TYPES.join(', ')}` },
      { status: 400 }
    )
  }
  if (!question?.trim()) {
    return NextResponse.json({ error: 'question is required' }, { status: 400 })
  }
  if (question.length > 2000) {
    return NextResponse.json({ error: 'question exceeds 2,000 character limit' }, { status: 400 })
  }

  try {
    const result = await execute('coach', {
      messages: [{ role: 'user', content: question }],
      context: {
        userId:     user.id,
        coachType,
        businessKey: businessContext,
      },
    })

    return NextResponse.json({
      brief:         result.content,
      citations:     result.citations ?? [],
      thinkingBudget: result.thinkingBudget ?? null,
      model:         result.model,
      usage:         result.usage,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Coach request failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
