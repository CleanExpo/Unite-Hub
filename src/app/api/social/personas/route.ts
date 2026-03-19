// GET  /api/social/personas — fetch all brand_identities for the founder
// POST /api/social/personas — upsert a brand_identity by business_key
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { BUSINESSES } from '@/lib/businesses'
import type { BrandIdentity, CharacterPersona } from '@/lib/content/types'

export const dynamic = 'force-dynamic'

// ── Database row shape (snake_case) ─────────────────────────────────────────

interface BrandIdentityRow {
  id: string
  founder_id: string
  business_key: string
  tone_of_voice: string
  target_audience: string
  industry_keywords: string[]
  unique_selling_points: string[]
  character_male: CharacterPersona
  character_female: CharacterPersona
  colour_primary: string | null
  colour_secondary: string | null
  do_list: string[]
  dont_list: string[]
  sample_content: Record<string, unknown>
  created_at: string
  updated_at: string
}

function rowToBrandIdentity(row: BrandIdentityRow): BrandIdentity & { businessName: string } {
  const business = BUSINESSES.find(b => b.key === row.business_key)
  return {
    id: row.id,
    founderId: row.founder_id,
    businessKey: row.business_key,
    toneOfVoice: row.tone_of_voice,
    targetAudience: row.target_audience,
    industryKeywords: row.industry_keywords ?? [],
    uniqueSellingPoints: row.unique_selling_points ?? [],
    characterMale: row.character_male,
    characterFemale: row.character_female,
    colourPrimary: row.colour_primary,
    colourSecondary: row.colour_secondary,
    doList: row.do_list ?? [],
    dontList: row.dont_list ?? [],
    sampleContent: row.sample_content ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    businessName: business?.name ?? row.business_key,
  }
}

// ── GET ──────────────────────────────────────────────────────────────────────

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('brand_identities')
    .select('*')
    .eq('founder_id', user.id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: 'Failed to fetch personas' }, { status: 500 })

  const personas = (data as BrandIdentityRow[]).map(rowToBrandIdentity)
  return NextResponse.json({ personas })
}

// ── POST ─────────────────────────────────────────────────────────────────────

interface UpsertPersonaInput {
  businessKey: string
  toneOfVoice?: string
  targetAudience?: string
  industryKeywords?: string[]
  uniqueSellingPoints?: string[]
  characterMale?: CharacterPersona
  characterFemale?: CharacterPersona
  colourPrimary?: string | null
  colourSecondary?: string | null
  doList?: string[]
  dontList?: string[]
  sampleContent?: Record<string, unknown>
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: UpsertPersonaInput
  try {
    body = await request.json() as UpsertPersonaInput
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.businessKey) return NextResponse.json({ error: 'businessKey is required' }, { status: 400 })

  const validKey = BUSINESSES.find(b => b.key === body.businessKey)
  if (!validKey) return NextResponse.json({ error: 'Invalid businessKey' }, { status: 400 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('brand_identities')
    .upsert(
      {
        founder_id: user.id,
        business_key: body.businessKey,
        tone_of_voice: body.toneOfVoice ?? '',
        target_audience: body.targetAudience ?? '',
        industry_keywords: body.industryKeywords ?? [],
        unique_selling_points: body.uniqueSellingPoints ?? [],
        character_male: body.characterMale ?? {},
        character_female: body.characterFemale ?? {},
        colour_primary: body.colourPrimary ?? null,
        colour_secondary: body.colourSecondary ?? null,
        do_list: body.doList ?? [],
        dont_list: body.dontList ?? [],
        sample_content: body.sampleContent ?? {},
      },
      { onConflict: 'business_key' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to upsert persona' }, { status: 500 })

  return NextResponse.json({ persona: rowToBrandIdentity(data as BrandIdentityRow) }, { status: 201 })
}
