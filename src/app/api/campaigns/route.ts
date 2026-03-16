// GET /api/campaigns — list all brand profiles for the founder
// POST /api/campaigns — create a new campaign brief

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { CreateCampaignRequest } from '@/lib/campaigns/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const supabase = createServiceClient()

  const { data: profiles, error } = await supabase
    .from('brand_profiles')
    .select('id, client_name, website_url, logo_url, industry, status, created_at')
    .eq('founder_id', user.id)
    .eq('status', 'ready')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Campaigns] Failed to list brand profiles:', error.message)
    return NextResponse.json({ error: 'Failed to fetch brand profiles' }, { status: 500 })
  }

  return NextResponse.json({ profiles: profiles ?? [] })
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  let body: CreateCampaignRequest
  try {
    body = await request.json() as CreateCampaignRequest
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { brandProfileId, theme, objective, platforms, postCount, dateRangeStart, dateRangeEnd } = body
  if (!brandProfileId || !theme || !objective || !platforms?.length) {
    return NextResponse.json(
      { error: 'brandProfileId, theme, objective and platforms are required' },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()

  // Verify brand profile belongs to this founder
  const { data: profile } = await supabase
    .from('brand_profiles')
    .select('id')
    .eq('id', brandProfileId)
    .eq('founder_id', user.id)
    .eq('status', 'ready')
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Brand profile not found or not ready' }, { status: 404 })
  }

  // Suppress unused variable warnings for future use
  void postCount
  void dateRangeStart
  void dateRangeEnd

  // NOTE: campaigns table is created in Task 29 (Phase 7 migration).
  // For now return 501 until that migration is applied.
  return NextResponse.json(
    { error: 'Campaign creation requires the campaigns table (Phase 7 migration not yet applied)' },
    { status: 501 }
  )
}
