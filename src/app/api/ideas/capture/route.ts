// src/app/api/ideas/capture/route.ts
// POST: Run one turn of the Bron qualifying conversation
// Body: { messages: ConversationMessage[], rawIdea: string }
// Returns: { type: 'question', question: string } | { type: 'spec', spec: IdeaSpec }

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { parseClaudeResponse, type ConversationMessage } from '@/lib/ideas/conversation'
import { execute } from '@/lib/ai/router'
import { registerAllCapabilities } from '@/lib/ai/capabilities'

export const dynamic = 'force-dynamic'

// Ensure capabilities are registered before first request
registerAllCapabilities()

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

  const result = await execute('ideas', { messages: history })
  const parsed = parseClaudeResponse(result.content)

  return NextResponse.json(parsed)
}
