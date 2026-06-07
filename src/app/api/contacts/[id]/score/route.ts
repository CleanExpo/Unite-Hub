import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { qualifyLead } from '@/lib/crm/qualify-lead'

export const dynamic = 'force-dynamic'

function metadataOf(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const supabase = createServiceClient()

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
    message: typeof body.message === 'string' ? body.message : typeof metadata.message === 'string' ? metadata.message : null,
    interests: Array.isArray(body.interests) ? body.interests.filter((item: unknown): item is string => typeof item === 'string') : null,
    marketingConsent: body.marketingConsent === true || metadata.marketingConsent === true,
    referralSource: typeof body.referralSource === 'string' ? body.referralSource : null,
    source: typeof body.source === 'string' ? body.source : null,
  })

  const nextMetadata = {
    ...metadata,
    leadQualification: {
      ...result,
      scoredAt: new Date().toISOString(),
      source: 'api',
    },
  }

  const { data: updated, error: updateError } = await supabase
    .from('contacts')
    .update({ metadata: nextMetadata })
    .eq('id', id)
    .eq('founder_id', user.id)
    .select('id, metadata')
    .single()

  if (updateError) return NextResponse.json({ error: 'Failed to persist lead score' }, { status: 500 })
  return NextResponse.json({ contactId: id, result, metadata: updated.metadata })
}
