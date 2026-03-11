// src/app/api/ideas/capture/route.ts
// POST: Run one turn of the Bron qualifying conversation
// Body: { messages: ConversationMessage[], rawIdea: string }
// Returns: { type: 'question', question: string } | { type: 'spec', spec: IdeaSpec }

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getUser } from '@/lib/supabase/server'
import { buildSystemPrompt, parseClaudeResponse, type ConversationMessage } from '@/lib/ideas/conversation'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { messages, rawIdea } = await request.json() as {
    messages: ConversationMessage[]
    rawIdea: string
  }

  if (!rawIdea?.trim()) {
    return NextResponse.json({ error: 'rawIdea is required' }, { status: 400 })
  }

  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: 'messages must be an array' }, { status: 400 })
  }

  // Build message history — first message is always the raw idea
  const history: ConversationMessage[] = messages.length === 0
    ? [{ role: 'user', content: rawIdea }]
    : messages

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: buildSystemPrompt(),
    messages: history,
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  const parsed = parseClaudeResponse(raw)

  return NextResponse.json(parsed)
}
