// src/app/api/cron/synthex-monitor/route.ts
// Vercel CRON — runs every 15 minutes
// Checks for SYN Linear issues in 'In Review' (Synthex created a PR) and notifies via Slack

import { NextResponse } from 'next/server'
import { checkSynthexProgress } from '@/lib/integrations/linear-monitor'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET?.trim()}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  try {
    const result = await checkSynthexProgress()
    return NextResponse.json({ status: 'ok', inReviewCount: result.inReviewCount })
  } catch (error) {
    console.error('[Synthex Monitor] Failed:', error)
    return NextResponse.json(
      { status: 'error', error: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
