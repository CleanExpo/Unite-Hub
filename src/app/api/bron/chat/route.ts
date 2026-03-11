// src/app/api/bron/chat/route.ts
// POST: Single-turn Bron AI response with page context
// Body: { messages: {role, content}[], pageContext?: string, businessContext?: string }

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function buildBronSystem(pageContext?: string, businessContext?: string): string {
  return `You are Bron, a concise AI assistant embedded in Phill McGurk's private founder CRM (Unite-Group Nexus).

Phill runs 8 businesses: Disaster Recovery, NRPG, CARSI, RestoreAssist, Synthex, ATO Tax Optimizer, CCW-ERP/CRM.

${pageContext ? `Current page: ${pageContext}` : ''}
${businessContext ? `Current business context: ${businessContext}` : ''}

Rules:
- Be concise — Phill is a founder, not a developer
- Provide recommendations with reasoning when asked
- Reference specific business data when available
- Never make up financial figures — say "I don't have that data" if unsure
- Format responses clearly with markdown when helpful`
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { messages, pageContext, businessContext } = await request.json() as {
    messages: { role: 'user' | 'assistant'; content: string }[]
    pageContext?: string
    businessContext?: string
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: buildBronSystem(pageContext, businessContext),
    messages,
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return NextResponse.json({ content: text })
}
