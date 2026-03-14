// src/app/api/advisory/debug/route.ts
// Temporary debug endpoint — tests Anthropic API connectivity and model availability
// REMOVE before production use

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })

  const client = new Anthropic({ apiKey })

  const results: Record<string, unknown> = {
    apiKeyPresent: true,
    apiKeyPrefix: apiKey.substring(0, 10) + '...',
  }

  // Test firm model
  try {
    const resp = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 50,
      messages: [{ role: 'user', content: 'Say "ok" and nothing else.' }],
    })
    results.firmModel = { ok: true, text: resp.content[0]?.type === 'text' ? resp.content[0].text : 'no text' }
  } catch (err) {
    results.firmModel = { ok: false, error: err instanceof Error ? err.message : String(err) }
  }

  // Test fallback model
  try {
    const resp = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 50,
      messages: [{ role: 'user', content: 'Say "ok" and nothing else.' }],
    })
    results.fallbackModel = { ok: true, text: resp.content[0]?.type === 'text' ? resp.content[0].text : 'no text' }
  } catch (err) {
    results.fallbackModel = { ok: false, error: err instanceof Error ? err.message : String(err) }
  }

  // Test judge model
  try {
    const resp = await client.messages.create({
      model: 'claude-opus-4-5-20250514',
      max_tokens: 50,
      messages: [{ role: 'user', content: 'Say "ok" and nothing else.' }],
    })
    results.judgeModel = { ok: true, text: resp.content[0]?.type === 'text' ? resp.content[0].text : 'no text' }
  } catch (err) {
    results.judgeModel = { ok: false, error: err instanceof Error ? err.message : String(err) }
  }

  return NextResponse.json(results)
}
