// src/app/api/connected-projects/route.ts
// GET  /api/connected-projects  — list all hub satellites
// POST /api/connected-projects  — upsert a hub satellite record

import { NextRequest, NextResponse } from 'next/server'
import { getUser, createClient } from '@/lib/supabase/server'
import { captureApiError } from '@/lib/error-reporting'
import { BUSINESSES } from '@/lib/businesses'

export const dynamic = 'force-dynamic'

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('hub_satellites')
    .select('*')
    .eq('founder_id', user.id)
    .order('business_name', { ascending: true })

  if (error) {
    captureApiError(error, { route: '/api/connected-projects', method: 'GET', founderId: user.id })
    return NextResponse.json({ error: 'Failed to fetch hub satellites' }, { status: 500 })
  }

  return NextResponse.json({ satellites: data ?? [] })
}

// ── POST ──────────────────────────────────────────────────────────────────────

interface UpsertSatelliteRequest {
  businessKey: string
  repoUrl?: string
  stack?: string
  notes?: string
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = await createClient()

  let body: UpsertSatelliteRequest
  try {
    body = await request.json() as UpsertSatelliteRequest
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.businessKey) {
    return NextResponse.json({ error: 'businessKey is required' }, { status: 400 })
  }

  const business = BUSINESSES.find(b => b.key === body.businessKey)
  if (!business) {
    return NextResponse.json({ error: `Unknown business: ${body.businessKey}` }, { status: 400 })
  }
  if (business.type !== 'owned') {
    return NextResponse.json(
      { error: `Business '${body.businessKey}' is a client project — not a hub satellite` },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('hub_satellites')
    .upsert(
      {
        founder_id: user.id,
        business_key: body.businessKey,
        business_name: business.name,
        repo_url: body.repoUrl ?? null,
        stack: body.stack ?? null,
        notes: body.notes ?? null,
      },
      { onConflict: 'founder_id,business_key' }
    )
    .select('*')
    .single()

  if (error) {
    captureApiError(error, { route: '/api/connected-projects', method: 'POST', founderId: user.id })
    return NextResponse.json({ error: 'Failed to upsert hub satellite' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
