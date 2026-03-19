// GET /api/social/personas/[businessKey] — fetch single brand_identity
// PUT /api/social/personas/[businessKey] — update existing brand_identity
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { BUSINESSES } from '@/lib/businesses'
import type { BrandIdentity, CharacterPersona } from '@/lib/content/types'

export const dynamic = 'force-dynamic'

// ── Database row shape ───────────────────────────────────────────────────────

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

// ── Route params ─────────────────────────────────────────────────────────────

interface RouteParams {
  params: Promise<{ businessKey: string }>
}

// ── GET ──────────────────────────────────────────────────────────────────────

export async function GET(_request: Request, { params }: RouteParams) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { businessKey } = await params

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('brand_identities')
    .select('*')
    .eq('founder_id', user.id)
    .eq('business_key', businessKey)
    .maybeSingle()

  if (error) return NextResponse.json({ error: 'Failed to fetch persona' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Persona not found' }, { status: 404 })

  return NextResponse.json({ persona: rowToBrandIdentity(data as BrandIdentityRow) })
}

// ── PUT ──────────────────────────────────────────────────────────────────────

interface UpdatePersonaInput {
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

export async function PUT(request: Request, { params }: RouteParams) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { businessKey } = await params

  const validKey = BUSINESSES.find(b => b.key === businessKey)
  if (!validKey) return NextResponse.json({ error: 'Invalid businessKey' }, { status: 400 })

  let body: UpdatePersonaInput
  try {
    body = await request.json() as UpdatePersonaInput
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Build partial update — only include fields that were provided
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.toneOfVoice !== undefined) updates.tone_of_voice = body.toneOfVoice
  if (body.targetAudience !== undefined) updates.target_audience = body.targetAudience
  if (body.industryKeywords !== undefined) updates.industry_keywords = body.industryKeywords
  if (body.uniqueSellingPoints !== undefined) updates.unique_selling_points = body.uniqueSellingPoints
  if (body.characterMale !== undefined) updates.character_male = body.characterMale
  if (body.characterFemale !== undefined) updates.character_female = body.characterFemale
  if (Object.prototype.hasOwnProperty.call(body, 'colourPrimary')) updates.colour_primary = body.colourPrimary ?? null
  if (Object.prototype.hasOwnProperty.call(body, 'colourSecondary')) updates.colour_secondary = body.colourSecondary ?? null
  if (body.doList !== undefined) updates.do_list = body.doList
  if (body.dontList !== undefined) updates.dont_list = body.dontList
  if (body.sampleContent !== undefined) updates.sample_content = body.sampleContent

  const { data, error } = await supabase
    .from('brand_identities')
    .update(updates)
    .eq('founder_id', user.id)
    .eq('business_key', businessKey)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to update persona' }, { status: 500 })

  return NextResponse.json({ persona: rowToBrandIdentity(data as BrandIdentityRow) })
}
