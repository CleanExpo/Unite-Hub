// src/app/api/research/route.ts
// POST: Live web research using Claude with Anthropic's server-side web search tool.
// Body: { query: string, businessContext?: string, fetchUrl?: string }
//
// fetchUrl: optional URL to pre-fetch and inject as context before the research query.
//           Useful for "research this specific ATO page" use cases.

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { execute } from '@/lib/ai/router'
import { registerAllCapabilities } from '@/lib/ai/capabilities'
import { fetchUrlContent, formatPageForPrompt } from '@/lib/ai/features/web-fetch'
import type { Anthropic } from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

registerAllCapabilities()

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let query: string
  let businessContext: string | undefined
  let fetchUrl: string | undefined

  try {
    const body = await request.json() as {
      query: string
      businessContext?: string
      fetchUrl?: string
    }
    query = body.query
    businessContext = body.businessContext
    fetchUrl = body.fetchUrl
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }

  if (!query?.trim()) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 })
  }

  if (query.trim().length > 2000) {
    return NextResponse.json({ error: 'query exceeds 2,000 character limit' }, { status: 400 })
  }

  // Build the message list — optionally inject pre-fetched URL content first
  const messages: Anthropic.MessageParam[] = []

  if (fetchUrl) {
    const page = await fetchUrlContent(fetchUrl)
    if (page) {
      messages.push({
        role: 'user',
        content: `Here is content from a URL you may reference:\n\n${formatPageForPrompt(page)}`,
      })
      messages.push({
        role: 'assistant',
        content: 'I have read the page content. What would you like me to research?',
      })
    }
  }

  messages.push({ role: 'user', content: query })

  try {
    const result = await execute('research', {
      messages,
      context: { userId: user.id, businessKey: businessContext },
    })

    return NextResponse.json({
      answer: result.content,
      citations: result.citations ?? [],
      model: result.model,
      usage: result.usage,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Research service unavailable'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
