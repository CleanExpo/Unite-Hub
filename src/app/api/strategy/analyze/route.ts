// src/app/api/strategy/analyze/route.ts
// POST: Deep strategic analysis using Claude Opus with extended thinking
// Body: { prompt: string, businessContext?: string }

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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

  const systemPrompt = `You are a strategic advisor to Phill McGurk, founder of Unite-Group which oversees 8 businesses.
${businessContext ? `\nFocus: ${businessContext}` : ''}
Provide structured, actionable analysis. Use markdown headers and bullet points.
Be direct — Phill needs decisions, not theory.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 16000,
      thinking: { type: 'enabled', budget_tokens: 10000 },
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    })

    const output = response.content
      .filter(b => b.type === 'text')
      .map(b => b.type === 'text' ? b.text : '')
      .join('\n\n')

    return NextResponse.json({ output })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI unavailable'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
