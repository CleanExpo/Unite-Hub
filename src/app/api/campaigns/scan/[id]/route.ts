// GET /api/campaigns/scan/[id]
// Returns the current status and data of a brand scan.
// Used for polling after POST /api/campaigns/scan.

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { BrandProfile } from '@/lib/campaigns/types'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createServiceClient()

  const { data: row, error } = await supabase
    .from('brand_profiles')
    .select('*')
    .eq('id', id)
    .eq('founder_id', user.id)
    .single()

  if (error || !row) {
    return NextResponse.json({ error: 'Brand profile not found' }, { status: 404 })
  }

  const profile: BrandProfile = {
    id: row.id,
    founderId: row.founder_id,
    businessKey: row.business_key,
    clientName: row.client_name,
    websiteUrl: row.website_url,
    logoUrl: row.logo_url,
    colours: row.colours ?? { primary: '#000000', secondary: '#ffffff', accent: '#0000ff', neutrals: [] },
    fonts: row.fonts ?? { heading: 'sans-serif', body: 'sans-serif', accent: null },
    toneOfVoice: row.tone_of_voice,
    brandValues: row.brand_values ?? [],
    tagline: row.tagline,
    targetAudience: row.target_audience,
    industry: row.industry,
    imageryStyle: row.imagery_style,
    referenceImages: row.reference_images ?? [],
    rawScrape: row.raw_scrape ?? {},
    status: row.status,
    scanError: row.scan_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }

  return NextResponse.json(profile)
}
