// src/app/api/bron/chat/route.ts
// POST: Single-turn Bron AI response with page context
// Body: { messages: {role, content}[], pageContext?: string, businessContext?: string }

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

  const { messages, pageContext, businessContext } = await request.json() as {
    messages: { role: 'user' | 'assistant'; content: string }[]
    pageContext?: string
    businessContext?: string
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages is required and must be a non-empty array' }, { status: 400 })
  }

  try {
    const result = await execute('chat', {
      messages,
      context: { userId: user.id, pageContext, businessKey: businessContext },
    })

    return NextResponse.json({ content: result.content })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI unavailable'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
