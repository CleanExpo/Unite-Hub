// src/app/api/coaches/reports/route.ts
// GET /api/coaches/reports?date=YYYY-MM-DD
// Fetches today's (or specified date's) coach reports for the authenticated founder.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CoachReport } from '@/lib/coaches/types'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = await createClient()

  // 1. Authenticate
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // 2. Parse optional date param (defaults to today AEST)
  const { searchParams } = new URL(request.url)
  const dateParam = searchParams.get('date')

  // Default to today in AEST (UTC+10 / UTC+11 DST)
  const reportDate =
    dateParam ??
    new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString().split('T')[0]

  // 3. Fetch coach reports — RLS ensures founder_id = auth.uid()
  const { data: reports, error: fetchError } = await supabase
    .from('coach_reports')
    .select('*')
    .eq('report_date', reportDate)
    .order('created_at', { ascending: true })
    .returns<CoachReport[]>()

  if (fetchError) {
    console.error('[Coach Reports API] Fetch error:', fetchError)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }

  return NextResponse.json({
    date: reportDate,
    reports: reports ?? [],
    count: reports?.length ?? 0,
  })
}
