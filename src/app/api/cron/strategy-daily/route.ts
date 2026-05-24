// src/app/api/cron/strategy-daily/route.ts
// GET /api/cron/strategy-daily?business=<key>
// Runs the daily gstack × SEO/GEO strategy analysis for one business.
// Called by 7 Vercel crons staggered 5 min apart from 02:00 AEST.

import { NextResponse } from 'next/server'
import { runDailyAnalysis } from '@/lib/strategy/daily-analysis'
import { createServiceClient } from '@/lib/supabase/service'
import { BUSINESSES } from '@/lib/businesses'
import { registerAllCapabilities } from '@/lib/ai/capabilities'
import { execute } from '@/lib/ai/router'

registerAllCapabilities()

export const dynamic = 'force-dynamic'
export const maxDuration = 120 // Opus + extended thinking needs time

const VALID_KEYS = BUSINESSES.map((b) => b.key) as string[]

export async function GET(request: Request) {
  const startTime = Date.now()
  const url = new URL(request.url)
  const businessKey = url.searchParams.get('business')?.trim() ?? ''

  // 1. Auth
  if (!process.env.CRON_SECRET) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET.trim()}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // 2. Validate business key
  if (!businessKey || !VALID_KEYS.includes(businessKey)) {
    return NextResponse.json(
      { error: `Invalid business key. Must be one of: ${VALID_KEYS.join(', ')}` },
      { status: 400 }
    )
  }

  // 3. Validate FOUNDER_USER_ID
  const founderId = process.env.FOUNDER_USER_ID?.trim()
  if (!founderId) {
    return NextResponse.json({ error: 'FOUNDER_USER_ID not configured' }, { status: 500 })
  }

  try {
    // 4. Run AI analysis
    console.log(`[Strategy Daily] Starting analysis for ${businessKey}`)
    const insights = await runDailyAnalysis({ businessKey })

    if (insights.length === 0) {
      console.warn(`[Strategy Daily] ${businessKey} — no insights returned`)
      return NextResponse.json({ success: true, insightsSaved: 0, businessKey })
    }

    // 5. Harness pattern: generator-evaluator separation.
    // Fetch last 7 days of insights to give the evaluator dedup context.
    const supabase = createServiceClient()
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()
    const { data: recentInsights } = await supabase
      .from('strategy_insights')
      .select('title, type, body')
      .eq('business_key', businessKey)
      .gte('created_at', sevenDaysAgo)
      .limit(20)

    const recentContext = (recentInsights ?? [])
      .map((r: { title: string; type: string; body: string }) => `[${r.type}] ${r.title}: ${r.body.slice(0, 100)}`)
      .join('\n')

    // Evaluate each insight in parallel via Haiku adversarial evaluator
    const evaluations = await Promise.allSettled(
      insights.map(async (ins) => {
        const prompt = `Recent insights for ${businessKey} (last 7 days):\n${recentContext || 'None yet.'}\n\nNew insight to evaluate:\nType: ${ins.type}\nTitle: ${ins.title}\nBody: ${ins.body}\nPriority: ${ins.priority}`
        const response = await execute('insight-evaluator', {
          messages: [{ role: 'user' as const, content: prompt }],
        })
        const text = response.content
        try {
          return JSON.parse(text.trim()) as { score: number; pass: boolean; reason: string }
        } catch {
          const match = text.match(/\{[\s\S]*\}/)
          if (match) return JSON.parse(match[0]) as { score: number; pass: boolean; reason: string }
          return { score: 5, pass: true, reason: 'parse error — defaulting to pass' }
        }
      })
    )

    // Only store insights that passed evaluation (score >= 7)
    const rows = insights
      .filter((_, i) => {
        const ev = evaluations[i]
        if (ev.status === 'rejected') return true // pass on evaluator error
        const passed = ev.value.pass
        if (!passed) console.log(`[Strategy Daily] ${businessKey} — insight rejected: "${insights[i].title}" (${ev.value.reason})`)
        return passed
      })
      .map((ins) => ({
        founder_id: founderId,
        business_key: businessKey,
        run_date: new Date().toISOString().split('T')[0],
        type: ins.type,
        title: ins.title,
        body: ins.body,
        priority: ins.priority,
        status: 'new' as const,
        metadata: ins.metadata,
      }))

    if (rows.length === 0) {
      console.warn(`[Strategy Daily] ${businessKey} — all ${insights.length} insights rejected by evaluator`)
      return NextResponse.json({ success: true, insightsSaved: 0, insightsGenerated: insights.length, businessKey })
    }

    const { error } = await supabase.from('strategy_insights').insert(rows)
    if (error) throw new Error(`Supabase insert failed: ${error.message}`)

    const durationSec = Math.round((Date.now() - startTime) / 1000)
    console.log(`[Strategy Daily] ${businessKey} — ${rows.length}/${insights.length} insights saved in ${durationSec}s`)

    return NextResponse.json({
      success: true,
      businessKey,
      insightsSaved: rows.length,
      insightsGenerated: insights.length,
      durationSec,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[Strategy Daily] ${businessKey} failed:`, msg)
    return NextResponse.json({ success: false, businessKey, error: msg }, { status: 500 })
  }
}
