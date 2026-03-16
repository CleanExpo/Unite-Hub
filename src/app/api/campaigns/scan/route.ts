// POST /api/campaigns/scan
// Accepts { websiteUrl, clientName, businessKey? }
// Creates a brand_profiles row with status 'scanning', triggers async extraction,
// returns immediately with the profile ID for polling.

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { extractBrandDNA } from '@/lib/campaigns/brand-extractor'
import type { ScanRequest } from '@/lib/campaigns/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function POST(request: Request) {
  // 1. Auth
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // 2. Parse body
  let body: ScanRequest
  try {
    body = await request.json() as ScanRequest
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { websiteUrl, clientName, businessKey } = body
  if (!websiteUrl || !clientName) {
    return NextResponse.json({ error: 'websiteUrl and clientName are required' }, { status: 400 })
  }

  // Normalise URL
  const normalised = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`

  const supabase = createServiceClient()

  // 3. Upsert brand_profiles row with status 'scanning'
  const { data: profile, error: insertError } = await supabase
    .from('brand_profiles')
    .upsert(
      {
        founder_id: user.id,
        business_key: businessKey ?? null,
        client_name: clientName,
        website_url: normalised,
        status: 'scanning',
        scan_error: null,
        colours: { primary: '#000000', secondary: '#ffffff', accent: '#0000ff', neutrals: [] },
        fonts: { heading: 'sans-serif', body: 'sans-serif', accent: null },
      },
      { onConflict: 'founder_id,website_url' }
    )
    .select('id')
    .single()

  if (insertError || !profile) {
    console.error('[Scan] Insert failed:', insertError?.message)
    return NextResponse.json({ error: 'Failed to create brand profile' }, { status: 500 })
  }

  const profileId = profile.id

  // 4. Run extraction (synchronous within this request — maxDuration: 120)
  try {
    const brandDNA = await extractBrandDNA(normalised, clientName)

    await supabase
      .from('brand_profiles')
      .update({
        logo_url: brandDNA.logoUrl,
        colours: brandDNA.colours,
        fonts: brandDNA.fonts,
        tone_of_voice: brandDNA.toneOfVoice,
        brand_values: brandDNA.brandValues,
        tagline: brandDNA.tagline,
        target_audience: brandDNA.targetAudience,
        industry: brandDNA.industry,
        imagery_style: brandDNA.imageryStyle,
        reference_images: brandDNA.referenceImages,
        status: 'ready',
        scan_error: null,
      })
      .eq('id', profileId)

    return NextResponse.json({ id: profileId, status: 'ready', brandDNA })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[Scan] Extraction failed:', message)

    await supabase
      .from('brand_profiles')
      .update({ status: 'failed', scan_error: message })
      .eq('id', profileId)

    return NextResponse.json(
      { id: profileId, status: 'failed', error: message },
      { status: 500 }
    )
  }
}
