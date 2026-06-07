import { NextRequest, NextResponse } from 'next/server'
import { getUser, createClient } from '@/lib/supabase/server'
import { qualifyLead } from '@/lib/crm/qualify-lead'

export const dynamic = 'force-dynamic'

type LeadScoringMetadata = Record<string, unknown> & {
  message?: string | null
  interests?: string[] | null
  marketingConsent?: boolean | null
  referralSource?: string | null
  source?: string | null
}

function metadataOf(value: unknown): LeadScoringMetadata {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as LeadScoringMetadata)
    : {}
}

function stringArrayOf(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  const items = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  return items.length > 0 ? items : null
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const supabase = await createClient()

  const { data: contact, error: loadError } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .eq('founder_id', user.id)
    .single()

  if (loadError || !contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

  const metadata = metadataOf(contact.metadata)
  const result = qualifyLead({
    email: contact.email,
    phone: contact.phone,
    company: contact.company,
    jobTitle: contact.role,
    message: typeof metadata.message === 'string' ? metadata.message : null,
    interests: stringArrayOf(metadata.interests),
    marketingConsent: metadata.marketingConsent === true,
    referralSource: typeof metadata.referralSource === 'string' ? metadata.referralSource : null,
    source: typeof metadata.source === 'string' ? metadata.source : null,
  })

  const scoredAt = new Date().toISOString()
  const nextMetadata = {
    ...metadata,
    leadQualification: {
      ...result,
      scoredAt,
      source: 'qualifyLead',
      persistence: 'metadata.leadQualification',
    },
  }

  const { data: updated, error: updateError } = await supabase
    .from('contacts')
    .update({ metadata: nextMetadata })
    .eq('id', id)
    .eq('founder_id', user.id)
    .select('id, metadata')
    .single()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({
    contactId: id,
    result,
    persisted: {
      column: 'metadata.leadQualification',
      aiScoreColumn: 'missing',
      metadata: (updated.metadata as LeadScoringMetadata).leadQualification ?? null,
    },
  })
}
