// src/app/api/strategy/analyze/route.ts
// POST: Deep strategic analysis using Claude Opus with extended thinking
// Body: { prompt: string, businessContext?: string }

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { execute } from '@/lib/ai/router'
import { registerAllCapabilities } from '@/lib/ai/capabilities'

export const dynamic = 'force-dynamic'

// Ensure capabilities are registered before first request
registerAllCapabilities()

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let prompt: string
  let businessContext: string | undefined

  try {
    const body = await request.json() as { prompt: string; businessContext?: string }
    prompt = body.prompt
    businessContext = body.businessContext
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
  }

  if (prompt.trim().length > 4000) {
    return NextResponse.json({ error: 'prompt exceeds 4,000 character limit' }, { status: 400 })
  }

  try {
    const result = await execute('analyze', {
      messages: [{ role: 'user', content: prompt }],
      context: { userId: user.id, businessKey: businessContext },
    })

    return NextResponse.json({
      output: result.content,
      citations: result.citations ?? [],
      ...(result.thinkingBudget !== undefined ? { thinkingBudget: result.thinkingBudget } : {}),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI unavailable'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
