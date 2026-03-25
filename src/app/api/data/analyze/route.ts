// src/app/api/data/analyze/route.ts
// POST: Financial data analysis using Claude with code execution sandbox.
// Claude can write and run Python code to analyse Xero/bookkeeper data in-request.
//
// Body: { question: string, data?: string, businessContext?: string }
//   data: optional JSON or CSV snippet to analyse (injected as a text block)

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { execute } from '@/lib/ai/router'
import { registerAllCapabilities } from '@/lib/ai/capabilities'

export const dynamic = 'force-dynamic'

registerAllCapabilities()

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let question: string
  let data: string | undefined
  let businessContext: string | undefined

  try {
    const body = await request.json() as {
      question: string
      data?: string
      businessContext?: string
    }
    question        = body.question
    data            = body.data
    businessContext = body.businessContext
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }

  if (!question?.trim()) {
    return NextResponse.json({ error: 'question is required' }, { status: 400 })
  }

  if (question.length > 2000) {
    return NextResponse.json({ error: 'question exceeds 2,000 character limit' }, { status: 400 })
  }

  // Build the user message — inject data snippet if provided
  const userContent = data
    ? `${question}\n\nData to analyse:\n\`\`\`\n${data.slice(0, 20000)}\n\`\`\``
    : question

  try {
    const result = await execute('data-analyst', {
      messages: [{ role: 'user', content: userContent }],
      context: { userId: user.id, businessKey: businessContext },
    })

    return NextResponse.json({
      answer:        result.content,
      citations:     result.citations ?? [],
      sandboxResult: result.sandboxResult ?? null,
      model:         result.model,
      usage:         result.usage,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Analysis failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
