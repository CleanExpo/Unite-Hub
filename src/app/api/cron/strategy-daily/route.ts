// src/app/api/cron/strategy-daily/route.ts
// GET /api/cron/strategy-daily?business=<key>
// Runs the daily gstack × SEO/GEO strategy analysis for one business.
// Called by 7 Vercel crons staggered 5 min apart from 02:00 AEST.

import { NextResponse } from 'next/server'
import { runDailyAnalysis } from '@/lib/strategy/daily-analysis'
import { createServiceClient } from '@/lib/supabase/service'
import { BUSINESSES } from '@/lib/businesses'

export const dynamic = 'force-dynamic'
export const maxDuration = 120 // Opus + extended thinking needs time

const VALID_KEYS = BUSINESSES.map((b) => b.key) as string[]

export async function GET(request: Request) {
  const startTime = Date.now()
  const url = new URL(request.url)
  const businessKey = url.searchParams.get('business')?.trim() ?? ''

  // 1. Auth
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET?.trim()}`) {
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

    // 5. Upsert insights to Supabase (service role bypasses RLS)
    const supabase = createServiceClient()
    const rows = insights.map((ins) => ({
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

    const { error } = await supabase.from('strategy_insights').insert(rows)
    if (error) throw new Error(`Supabase insert failed: ${error.message}`)

    const durationSec = Math.round((Date.now() - startTime) / 1000)
    console.log(`[Strategy Daily] ${businessKey} — ${insights.length} insights saved in ${durationSec}s`)

    return NextResponse.json({
      success: true,
      businessKey,
      insightsSaved: insights.length,
      durationSec,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[Strategy Daily] ${businessKey} failed:`, msg)
    return NextResponse.json({ success: false, businessKey, error: msg }, { status: 500 })
  }
}
