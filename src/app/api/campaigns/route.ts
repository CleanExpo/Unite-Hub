// GET /api/campaigns — list all brand profiles for the founder
// POST /api/campaigns — create a new campaign brief

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { captureApiError } from '@/lib/error-reporting'
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
    captureApiError(error, { route: '/api/campaigns', method: 'GET', founderId: user.id })
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

  const { data: newCampaign, error: createError } = await supabase
    .from('campaigns')
    .insert({
      founder_id: user.id,
      brand_profile_id: brandProfileId,
      theme,
      objective,
      platforms,
      post_count: postCount ?? 5,
      date_range_start: dateRangeStart ?? null,
      date_range_end: dateRangeEnd ?? null,
      status: 'draft',
    })
    .select('id, theme, objective, status, created_at')
    .single()

  if (createError || !newCampaign) {
    captureApiError(createError ?? new Error('Campaign insert returned null'), {
      route: '/api/campaigns',
      method: 'POST',
      founderId: user.id,
      brandProfileId,
    })
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }

  return NextResponse.json(newCampaign, { status: 201 })
}
